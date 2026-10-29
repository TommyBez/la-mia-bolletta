import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { catalogPublished } from "../../db/schema/catalog";
import {
  publishedScenarios,
  scenarioSnapshots,
} from "../../db/schema/scenario";
import type { AnnualRegulatedProfile } from "./annual-regulated";
import {
  qualifyScenario,
  type ScenarioCommodity,
  type ScenarioSnapshot,
  scenarioWindow,
} from "./snapshot";

export type ScenarioReadInput = {
  commodity: ScenarioCommodity;
  versionId?: string;
  at?: Date;
  requiredAnnualFingerprints?: string[];
  requiredAnnualRegulatedProfiles?: AnnualRegulatedProfile[];
};
export type ScenarioRead =
  | {
      status: "ready";
      versionId: string;
      snapshot: ScenarioSnapshot;
      reasons: [];
    }
  | {
      status: "incomplete_data";
      versionId?: string;
      snapshot?: never;
      reasons: string[];
    };
export function createScenarioService(
  db: NodePgDatabase,
  options: { now?: () => Date } = {},
) {
  const now = options.now ?? (() => new Date());
  async function getScenario(input: ScenarioReadInput): Promise<ScenarioRead> {
    let versionId = input.versionId;
    if (!versionId) {
      const [pointer] = await db
        .select()
        .from(publishedScenarios)
        .where(eq(publishedScenarios.commodity, input.commodity));
      versionId = pointer?.versionId;
    }
    if (!versionId)
      return { status: "incomplete_data", reasons: ["no published scenario"] };
    const [row] = await db
      .select()
      .from(scenarioSnapshots)
      .where(
        and(
          eq(scenarioSnapshots.versionId, versionId),
          eq(scenarioSnapshots.commodity, input.commodity),
        ),
      );
    if (!row)
      return {
        status: "incomplete_data",
        versionId,
        reasons: ["requested scenario version unavailable"],
      };
    const qualified = qualifyScenario(row.snapshot, {
      now: input.at ?? now(),
      requiredAnnualFingerprints: input.requiredAnnualFingerprints,
      requiredAnnualRegulatedProfiles: input.requiredAnnualRegulatedProfiles,
      strictCatalogBinding: false,
    });
    if (qualified.status === "rejected")
      return {
        status: "incomplete_data",
        versionId,
        reasons: qualified.reasons,
      };
    return {
      status: "ready",
      versionId,
      snapshot: qualified.snapshot,
      reasons: [],
    };
  }
  async function importSnapshot(
    input: unknown,
    context: {
      requiredAnnualFingerprints?: string[];
      catalogVersionId?: string;
      requiredAnnualRegulatedProfiles?: AnnualRegulatedProfile[];
    } = {},
  ) {
    const qualified = qualifyScenario(input, { now: now(), ...context });
    if (qualified.status === "rejected")
      return { status: "rejected" as const, reasons: qualified.reasons };
    const { snapshot, versionId } = qualified;
    return db.transaction(async (tx) => {
      if (context.catalogVersionId) {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`lmb_catalog:${snapshot.commodity}`}))`,
        );
        const [catalog] = await tx
          .select()
          .from(catalogPublished)
          .where(eq(catalogPublished.commodity, snapshot.commodity));
        if (catalog?.snapshotId !== context.catalogVersionId)
          return {
            status: "rejected" as const,
            versionId,
            reasons: [
              "catalog publication changed; revalidate acquisition against the current catalog",
            ],
          };
      }
      // One lock per commodity orders all publications, including competing first imports.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`scenario:${snapshot.commodity}`}))`,
      );
      const [current] = await tx
        .select({
          versionId: scenarioSnapshots.versionId,
          acquiredAt: scenarioSnapshots.acquiredAt,
          acquisitionMonth: scenarioSnapshots.acquisitionMonth,
        })
        .from(publishedScenarios)
        .innerJoin(
          scenarioSnapshots,
          eq(publishedScenarios.versionId, scenarioSnapshots.versionId),
        )
        .where(eq(publishedScenarios.commodity, snapshot.commodity));
      if (current?.versionId === versionId)
        return { status: "unchanged" as const, versionId, reasons: [] };
      if (
        current &&
        (current.acquisitionMonth > snapshot.acquisitionMonth ||
          current.acquiredAt.getTime() >=
            new Date(snapshot.acquiredAt).getTime())
      )
        return {
          status: "rejected" as const,
          versionId,
          reasons: [
            "out-of-order or conflicting acquisition; newer scenario remains published",
          ],
        };
      await tx
        .insert(scenarioSnapshots)
        .values({
          versionId,
          commodity: snapshot.commodity,
          acquisitionMonth: snapshot.acquisitionMonth,
          acquiredAt: new Date(snapshot.acquiredAt),
          coverageStart: snapshot.coverageStart,
          coverageEnd: snapshot.coverageEnd,
          snapshot,
        })
        .onConflictDoNothing();
      await tx
        .insert(publishedScenarios)
        .values({
          commodity: snapshot.commodity,
          versionId,
          publishedAt: now(),
        })
        .onConflictDoUpdate({
          target: publishedScenarios.commodity,
          set: { versionId, publishedAt: now() },
        });
      return { status: "published" as const, versionId, reasons: [] };
    });
  }
  async function getScenarioStatus(input: ScenarioReadInput) {
    const at = input.at ?? now();
    const result = await getScenario({ ...input, at });
    return {
      status: result.status,
      versionId: result.versionId,
      ...scenarioWindow(at),
      reasons: result.reasons,
      source:
        result.status === "ready" ? result.snapshot.provenance : undefined,
      acquiredAt:
        result.status === "ready" ? result.snapshot.acquiredAt : undefined,
      fallback: {
        available: false,
        reason:
          "GME fallback has not been qualified for the current Q44 window and all required bands; no automatic replacement",
      },
    };
  }
  return { importSnapshot, getScenario, getScenarioStatus };
}
