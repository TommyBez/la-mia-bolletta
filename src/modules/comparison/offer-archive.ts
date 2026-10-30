import { sql } from "drizzle-orm";
import { z } from "zod";
import type { AppDb } from "../../db";
import {
  catalogMembers,
  catalogObservations,
  catalogRuns,
  catalogSnapshots,
} from "../../db/schema/catalog";
import { NORMALIZATION_VERSION } from "../catalog/normalize";

export const OfferArchiveQuerySchema = z
  .object({
    code: z.string().trim().min(1).max(100),
    commodity: z.enum(["electricity", "gas"]),
  })
  .strict();

export type ArchivedOfferOption = {
  code: string;
  supplierVat: string;
  name: string;
  versionId: string;
  sourceDate: string;
  observedAt: string;
};

/** Metadata only: selecting a version never accepts client-supplied prices. */
export async function lookupOfferArchive(
  db: AppDb,
  query: z.input<typeof OfferArchiveQuerySchema>,
): Promise<{
  schemaVersion: 1;
  offerArchive: { items: ArchivedOfferOption[] };
}> {
  const { code, commodity } = OfferArchiveQuerySchema.parse(query);
  const result = await db.execute<ArchivedOfferOption>(sql`
    select ${catalogObservations.code} as code,
      ${catalogObservations.supplierVat} as "supplierVat",
      ${catalogObservations.data}->>'name' as name,
      ${catalogSnapshots.id} as "versionId",
      ${catalogSnapshots.sourceDate} as "sourceDate",
      ${catalogSnapshots.createdAt} as "observedAt"
    from ${catalogObservations}
    join ${catalogMembers} on ${catalogMembers.observationId} = ${catalogObservations.id}
    join ${catalogSnapshots} on ${catalogSnapshots.id} = ${catalogMembers.snapshotId}
    where ${catalogObservations.code} = ${code}
      and ${catalogObservations.commodity} = ${commodity}
      and ${catalogSnapshots.commodity} = ${commodity}
      and ${catalogSnapshots.manifest}->>'normalizationVersion' = ${NORMALIZATION_VERSION}
      and exists (
        select 1 from ${catalogRuns}
        where ${catalogRuns.snapshotId} = ${catalogSnapshots.id}
          and ${catalogRuns.state} = 'published'
      )
    order by ${catalogSnapshots.sourceDate} desc,
      ${catalogSnapshots.createdAt} desc, ${catalogSnapshots.id} desc,
      ${catalogObservations.supplierVat}, ${catalogObservations.id}
    limit 20
  `);
  return {
    schemaVersion: 1,
    offerArchive: {
      items: result.rows.map((row) => ({
        code: row.code,
        supplierVat: row.supplierVat,
        name: row.name.replace(
          /&(amp|lt|gt|quot|apos);/g,
          (_, entity: string) =>
            ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity] ?? _,
        ),
        versionId: row.versionId,
        sourceDate: row.sourceDate,
        observedAt: new Date(row.observedAt).toISOString(),
      })),
    },
  };
}
