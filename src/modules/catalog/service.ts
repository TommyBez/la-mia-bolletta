import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { AppDb } from "../../db";
import {
  catalogFiles,
  catalogMembers,
  catalogObservations,
  catalogPublished,
  catalogRuns,
  catalogSnapshots,
  referencePublished,
  referenceSets,
} from "../../db/schema/catalog";
import {
  type GasSaleSupplement,
  gasSaleSupplementSchema,
  requiresGasSaleSupplement,
} from "../comparison/gas/supplement";
import {
  bundledReferences,
  type ReferenceBundle,
  referenceContent,
  resolveMunicipality,
  resolvePortalMunicipality,
} from "../references/registry";
import { catalogCache, versionCached } from "./cache";
import {
  type Commodity,
  canonical,
  digest,
  NORMALIZATION_VERSION,
  type NormalizedOffer,
  normalizedOfferSchema,
  normalizeOffers,
  portalDate,
} from "./normalize";
import type { OriginalStore } from "./originals";
import { type CatalogSource, parseParameters } from "./source";

class ReferencePublicationConflict extends Error {
  constructor() {
    super("Reference publication changed while qualifying");
  }
}
export type CatalogDependencies = {
  db: AppDb;
  source: CatalogSource;
  originals: OriginalStore;
  clock?: () => Date;
  supplementAcquirer?: (
    offer: NormalizedOffer,
    options: {
      archive: (path: string, body: string) => Promise<void>;
      clock?: () => Date;
      source?: { sourceDate: string; sha256: string };
    },
  ) => Promise<GasSaleSupplement>;
};
export type CatalogRead = {
  status: "ready" | "incomplete_data";
  reasons: string[];
  commodity: Commodity;
  versionId: string | null;
  referenceVersionId: string | null;
  sourceDate: string | null;
  acquiredAt: string | null;
  offers: NormalizedOffer[];
  parameters: ReturnType<typeof parseParameters> | null;
  references: ReferenceBundle | null;
  manifest: unknown;
  requiredAnnualFingerprints: string[];
};
const chunks = <T>(items: T[], size = 200) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
const safeError = (error: unknown) => ({
  code: "catalog_import_failed",
  message: error instanceof Error ? error.message : "Unknown import failure",
});

function originalOffersSource(
  sourceDate: string,
  manifest: unknown,
): { sourceDate: string; sha256: string } | null {
  if (
    !manifest ||
    typeof manifest !== "object" ||
    !("files" in manifest) ||
    !Array.isArray(manifest.files)
  )
    return null;
  const offer = manifest.files.find(
    (item: unknown) =>
      item &&
      typeof item === "object" &&
      "kind" in item &&
      item.kind === "offers",
  );
  return offer && typeof offer.sha256 === "string"
    ? { sourceDate, sha256: offer.sha256 }
    : null;
}
export function createCatalogService({
  db,
  source,
  originals,
  clock = () => new Date(),
  supplementAcquirer,
}: CatalogDependencies) {
  async function fail(runId: string, error: unknown) {
    await db
      .update(catalogRuns)
      .set({ state: "failed", finishedAt: clock(), error: safeError(error) })
      .where(eq(catalogRuns.id, runId));
  }
  async function publishReferences(
    refs: ReferenceBundle,
    options: { onlyIfAbsent?: boolean; expectedVersionId?: string } = {},
  ) {
    if (digest(canonical(referenceContent(refs))) !== refs.versionId)
      throw new Error("Reference payload hash mismatch");
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('lmb_reference_national'))`,
      );
      const [pointer] = await tx
        .select()
        .from(referencePublished)
        .where(eq(referencePublished.scope, "national"));
      if (
        options.expectedVersionId !== undefined &&
        pointer?.referenceVersionId !== options.expectedVersionId
      )
        throw new ReferencePublicationConflict();
      const [existing] = await tx
        .select({ id: referenceSets.id })
        .from(referenceSets)
        .where(eq(referenceSets.id, refs.versionId))
        .limit(1);
      if (!existing)
        await tx
          .insert(referenceSets)
          .values({
            id: refs.versionId,
            sourceDate: refs.sourceDate,
            acquiredAt: clock(),
            payload: refs,
            coverage: refs.coverage,
            manifest: refs.manifest,
          })
          .onConflictDoNothing();
      const insert = tx.insert(referencePublished).values({
        scope: "national",
        referenceVersionId: refs.versionId,
        publishedAt: clock(),
      });
      if (options.onlyIfAbsent) await insert.onConflictDoNothing();
      else
        await insert.onConflictDoUpdate({
          target: referencePublished.scope,
          set: { referenceVersionId: refs.versionId, publishedAt: clock() },
        });
    });
    await versionCached(
      catalogCache(db).references,
      refs.versionId,
      async () => structuredClone(refs),
      4,
    );
    return refs.versionId;
  }
  async function stageCatalog({
    commodity,
    runId = randomUUID(),
  }: {
    commodity: Commodity;
    runId?: string;
  }) {
    await db
      .insert(catalogRuns)
      .values({ id: runId, commodity, state: "acquiring", startedAt: clock() })
      .onConflictDoNothing();
    const [existing] = await db
      .select()
      .from(catalogRuns)
      .where(eq(catalogRuns.id, runId));
    if (existing?.commodity !== commodity)
      throw new Error("Run commodity mismatch");
    if (
      existing.state === "staged" ||
      existing.state === "published" ||
      existing.state === "unchanged"
    )
      return { runId, commodity };
    try {
      const files = await source.acquire(commodity);
      if (
        files.length !== 2 ||
        !files.some((f) => f.kind === "offers") ||
        !files.some((f) => f.kind === "parameters")
      )
        throw new Error("Both offers and parameters files are required");
      if (new Set(files.map((f) => f.sourceDate)).size !== 1)
        throw new Error("Incoherent official source dates");
      for (const f of files) {
        if (digest(f.body) !== f.sha256)
          throw new Error("Source checksum mismatch");
        const archive = await originals.put(
          `catalog/${commodity}/${f.sha256}.${f.kind === "offers" ? "xml" : "csv"}`,
          f.body,
        );
        await db
          .insert(catalogFiles)
          .values({
            id: `${runId}:${f.kind}`,
            runId,
            kind: f.kind,
            url: f.url,
            sourceDate: f.sourceDate,
            sha256: f.sha256,
            blobPath: archive.path,
            acquiredAt: new Date(f.acquiredAt),
            size: Buffer.byteLength(f.body),
            etag: f.etag,
          })
          .onConflictDoNothing();
      }
      await db
        .update(catalogRuns)
        .set({ state: "staged", sourceDate: files[0].sourceDate, error: null })
        .where(eq(catalogRuns.id, runId));
      return { runId, commodity };
    } catch (error) {
      await fail(runId, error);
      throw error;
    }
  }
  async function latestReferences(): Promise<ReferenceBundle> {
    const [pointer] = await db
      .select()
      .from(referencePublished)
      .where(eq(referencePublished.scope, "national"));
    if (!pointer) {
      await publishReferences(bundledReferences(), { onlyIfAbsent: true });
      return latestReferences();
    }
    const value = await versionCached(
      catalogCache(db).references,
      pointer.referenceVersionId,
      async () => {
        const [row] = await db
          .select({ payload: referenceSets.payload })
          .from(referenceSets)
          .where(eq(referenceSets.id, pointer.referenceVersionId));
        return (row?.payload as ReferenceBundle | undefined) ?? null;
      },
      4,
    );
    if (!value) throw new Error("Published reference bundle unavailable");
    return value;
  }
  function checkedSupplement(
    value: unknown,
    offer: NormalizedOffer,
    source?: { sourceDate: string; sha256: string },
  ) {
    const record = gasSaleSupplementSchema.parse(value);
    if (
      record.economicFingerprint !== offer.economicFingerprint ||
      record.offerCode !== offer.code ||
      record.supplierVat !== offer.supplierVat
    )
      throw new Error(`Supplement identity mismatch ${offer.code}`);
    if (
      record.evidence.some(
        (e) =>
          new URL(e.sourceUrl).origin !== "https://www.ilportaleofferte.it" ||
          !e.originalPath.startsWith("gas-sales/") ||
          e.originalPath.includes(".."),
      )
    )
      throw new Error(
        "Supplement provenance is not official Portal private evidence",
      );
    if (
      source &&
      (record.sourceDate !== source.sourceDate ||
        record.catalogSourceSha256 !== source.sha256)
    )
      throw new Error(
        `Gas sale supplement is not qualified for this daily source ${offer.economicFingerprint}`,
      );
    return record;
  }
  async function qualifyCatalog({ runId }: { runId: string }) {
    const [run] = await db
      .select()
      .from(catalogRuns)
      .where(eq(catalogRuns.id, runId));
    if (!run) throw new Error("Unknown catalog run");
    if (run.commodity !== "gas")
      return { runId, required: 0, acquired: 0, reused: 0 };
    try {
      const [file] = await db
        .select()
        .from(catalogFiles)
        .where(
          and(eq(catalogFiles.runId, runId), eq(catalogFiles.kind, "offers")),
        );
      if (!file) throw new Error("Missing staged gas original");
      const xml = await originals.get(file.blobPath);
      if (digest(xml) !== file.sha256)
        throw new Error("Archived original checksum mismatch");
      const now = clock();
      const required = normalizeOffers(xml, "gas").offers.filter(
        (offer) =>
          new Date(offer.validFrom) <= now &&
          new Date(offer.validTo) >= now &&
          requiresGasSaleSupplement(offer),
      );
      let refs = await latestReferences();
      const known = new Map(
        (refs.offerSalesSupplements ?? [])
          .filter(
            (record) =>
              record.sourceDate === file.sourceDate &&
              record.catalogSourceSha256 === file.sha256,
          )
          .map((record) => [record.economicFingerprint, record]),
      );
      for (const offer of required) {
        const record = known.get(offer.economicFingerprint);
        if (record) checkedSupplement(record, offer, file);
      }
      const pending = required.filter(
        (offer) => !known.has(offer.economicFingerprint),
      );
      let acquired = 0;
      await db
        .update(catalogRuns)
        .set({ state: "qualifying", error: null })
        .where(eq(catalogRuns.id, runId));
      for (const batch of chunks(pending, 2)) {
        const outcomes = await Promise.allSettled(
          batch.map(async (offer) => {
            const kind = `gas_sale_supplement:${offer.economicFingerprint}`;
            const checkpoints = await db
              .select()
              .from(catalogFiles)
              .where(
                and(
                  eq(catalogFiles.kind, kind),
                  eq(catalogFiles.sourceDate, file.sourceDate),
                ),
              )
              .orderBy(desc(catalogFiles.acquiredAt))
              .limit(20);
            let record: GasSaleSupplement | undefined;
            for (const checkpoint of checkpoints) {
              const body = await originals.get(checkpoint.blobPath);
              if (digest(body) !== checkpoint.sha256)
                throw new Error("Supplement checkpoint checksum mismatch");
              let candidate = checkedSupplement(JSON.parse(body), offer);
              if (!candidate.sourceDate) {
                const [original] = await db
                  .select()
                  .from(catalogFiles)
                  .where(
                    and(
                      eq(catalogFiles.runId, checkpoint.runId),
                      eq(catalogFiles.kind, "offers"),
                    ),
                  )
                  .limit(1);
                if (
                  original?.sourceDate !== file.sourceDate ||
                  original.sha256 !== file.sha256
                )
                  continue;
                candidate = checkedSupplement(
                  {
                    ...candidate,
                    sourceDate: file.sourceDate,
                    catalogSourceSha256: file.sha256,
                  },
                  offer,
                  file,
                );
              }
              if (
                candidate.sourceDate === file.sourceDate &&
                candidate.catalogSourceSha256 === file.sha256
              ) {
                record = checkedSupplement(candidate, offer, file);
                break;
              }
            }
            if (!record) {
              if (!supplementAcquirer)
                throw new Error(
                  `Missing qualified gas sale supplement ${offer.economicFingerprint}`,
                );
              const archivedProofs = new Map<string, string>();
              record = checkedSupplement(
                await supplementAcquirer(offer, {
                  clock,
                  source: { sourceDate: file.sourceDate, sha256: file.sha256 },
                  archive: async (path, body) => {
                    if (/csrf|currentFilterJSON|sessionid/i.test(body))
                      throw new Error("Unsafe official supplement fragment");
                    await originals.put(path, body);
                    archivedProofs.set(path, digest(body));
                  },
                }),
                offer,
                file,
              );
              if (
                record.evidence.some(
                  (e) => archivedProofs.get(e.originalPath) !== e.sha256,
                )
              )
                throw new Error(
                  "Supplement original evidence was not archived and verified",
                );
              acquired++;
              const body = JSON.stringify(record),
                sha256 = digest(body),
                stored = await originals.put(
                  `catalog/gas-sale-supplements/${offer.economicFingerprint}/${sha256}.json`,
                  body,
                );
              await db
                .insert(catalogFiles)
                .values({
                  id: `${runId}:${kind}`,
                  runId,
                  kind,
                  url: record.evidence[0].sourceUrl,
                  sourceDate: file.sourceDate,
                  sha256,
                  blobPath: stored.path,
                  acquiredAt: new Date(record.observedAt),
                  size: Buffer.byteLength(body),
                })
                .onConflictDoNothing();
            }
            known.set(offer.economicFingerprint, record);
            console.log("catalog.supplement.qualified", {
              runId,
              economicFingerprint: offer.economicFingerprint,
            });
          }),
        );
        const failure = outcomes.find(
          (outcome) => outcome.status === "rejected",
        );
        if (failure?.status === "rejected") throw failure.reason;
      }
      if (pending.length) {
        for (let attempt = 0; attempt < 3; attempt++) {
          refs = await latestReferences();
          const merged = new Map(
            (refs.offerSalesSupplements ?? []).map((record) => [
              record.economicFingerprint,
              record,
            ]),
          );
          for (const [fingerprint, record] of known) {
            const existing = merged.get(fingerprint);
            if (
              existing?.sourceDate === file.sourceDate &&
              existing.catalogSourceSha256 === file.sha256
            ) {
              if (
                existing.additionalFixedAnnual !==
                  record.additionalFixedAnnual ||
                existing.additionalUnitRate !== record.additionalUnitRate
              )
                throw new Error(
                  `Conflicting same-source gas sale observations ${fingerprint}`,
                );
            } else merged.set(fingerprint, record);
          }
          const updated = {
            ...refs,
            offerSalesSupplements: [...merged.values()].sort((a, b) =>
              a.economicFingerprint.localeCompare(b.economicFingerprint),
            ),
          };
          const qualified = {
            ...updated,
            versionId: digest(canonical(referenceContent(updated))),
          };
          try {
            await publishReferences(qualified, {
              expectedVersionId: refs.versionId,
            });
            break;
          } catch (error) {
            if (
              !(error instanceof ReferencePublicationConflict) ||
              attempt === 2
            )
              throw error;
          }
        }
      }
      await db
        .update(catalogRuns)
        .set({ state: "staged", error: null })
        .where(eq(catalogRuns.id, runId));
      return {
        runId,
        required: required.length,
        acquired,
        reused: required.length - acquired,
      };
    } catch (error) {
      await fail(runId, error);
      throw error;
    }
  }
  async function publishCatalog({
    runId,
    references,
  }: {
    runId: string;
    references?: ReferenceBundle;
  }) {
    const [run] = await db
      .select()
      .from(catalogRuns)
      .where(eq(catalogRuns.id, runId));
    if (!run) throw new Error("Unknown catalog run");
    if (["published", "unchanged", "superseded"].includes(run.state))
      return { runId, state: run.state, versionId: run.snapshotId };
    try {
      const files = (
        await db
          .select()
          .from(catalogFiles)
          .where(eq(catalogFiles.runId, runId))
      ).filter((file) => file.kind === "offers" || file.kind === "parameters");
      if (files.length !== 2) throw new Error("Missing staged originals");
      const content = new Map<string, string>();
      for (const file of files) {
        const body = await originals.get(file.blobPath);
        if (digest(body) !== file.sha256)
          throw new Error("Archived original checksum mismatch");
        content.set(file.kind, body);
      }
      const commodity = run.commodity as Commodity;
      const offerContent = content.get("offers"),
        parameterContent = content.get("parameters");
      if (!offerContent || !parameterContent)
        throw new Error("Missing staged offer or parameter original");
      const normalized = normalizeOffers(offerContent, commodity);
      if (!normalized.offers.length)
        throw new Error("No domestic switching offers in source");
      const parameters = parseParameters(parameterContent);
      const refs = references ?? (await latestReferences());
      const requiredSupplements = normalized.offers.filter(
        (offer) =>
          new Date(offer.validFrom) <= clock() &&
          new Date(offer.validTo) >= clock() &&
          requiresGasSaleSupplement(offer),
      );
      for (const offer of requiredSupplements) {
        const record = (refs.offerSalesSupplements ?? []).find(
          (item) => item.economicFingerprint === offer.economicFingerprint,
        );
        if (!record)
          throw new Error(
            `Missing qualified gas sale supplement ${offer.economicFingerprint}`,
          );
        const offerFile = files.find((file) => file.kind === "offers");
        if (!offerFile) throw new Error("Missing original offer file");
        checkedSupplement(record, offer, offerFile);
      }
      if (references) await publishReferences(refs);
      const referenceVersionId = refs.versionId;
      const sourceDate = files[0].sourceDate;
      const bundleHash = digest(
        canonical({
          normalizationVersion: NORMALIZATION_VERSION,
          commodity,
          files: files
            .map((f) => ({
              kind: f.kind,
              sha256: f.sha256,
              sourceDate: f.sourceDate,
            }))
            .sort((a, b) => a.kind.localeCompare(b.kind)),
          references: refs.versionId,
        }),
      );
      const manifest = {
        normalizationVersion: NORMALIZATION_VERSION,
        files: files.map(
          ({ kind, url, sha256, sourceDate, acquiredAt, size }) => ({
            kind,
            url,
            sha256,
            sourceDate,
            acquiredAt: acquiredAt.toISOString(),
            size,
          }),
        ),
        supplierNameCoverage: {
          total: new Set(normalized.offers.map((o) => o.supplierVat)).size,
          missingVats: [...new Set(normalized.offers.map((o) => o.supplierVat))]
            .filter(
              (vat) =>
                !(refs.suppliers ?? []).some(
                  (supplier) => supplier.vat === vat,
                ),
            )
            .sort(),
        },
        totalSourceOffers: normalized.total,
        includedOffers: normalized.offers.length,
        exclusions: normalized.exclusions,
        perimeter: "official simulable free-market single domestic switching",
        referenceCoverage: refs.coverage,
      };
      const now = clock();
      const outcome = await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`lmb_catalog:${commodity}`}))`,
        );
        const [pointer] = await tx
          .select()
          .from(catalogPublished)
          .innerJoin(
            catalogSnapshots,
            eq(catalogPublished.snapshotId, catalogSnapshots.id),
          )
          .where(eq(catalogPublished.commodity, commodity));
        const previous = pointer?.lmb_catalog_snapshots;
        if (previous && previous.sourceDate > sourceDate) {
          await tx
            .update(catalogRuns)
            .set({
              state: "superseded",
              snapshotId: previous.id,
              finishedAt: now,
            })
            .where(eq(catalogRuns.id, runId));
          return { state: "superseded", versionId: previous.id };
        }
        if (previous?.bundleHash === bundleHash) {
          await tx
            .update(catalogRuns)
            .set({
              state: "unchanged",
              snapshotId: previous.id,
              finishedAt: now,
            })
            .where(eq(catalogRuns.id, runId));
          return { state: "unchanged", versionId: previous.id };
        }
        if (previous) {
          const oldRows = await tx
            .selectDistinctOn(
              [catalogObservations.supplierVat, catalogObservations.code],
              { data: catalogObservations.data },
            )
            .from(catalogObservations)
            .innerJoin(
              catalogMembers,
              eq(catalogMembers.observationId, catalogObservations.id),
            )
            .innerJoin(
              catalogSnapshots,
              eq(catalogMembers.snapshotId, catalogSnapshots.id),
            )
            .where(eq(catalogSnapshots.commodity, commodity))
            .orderBy(
              catalogObservations.supplierVat,
              catalogObservations.code,
              desc(catalogSnapshots.sourceDate),
              desc(catalogSnapshots.createdAt),
              desc(catalogSnapshots.id),
            );
          const oldByIdentity = new Map(
            oldRows.map((r) => [
              `${r.data.supplierVat}:${r.data.code}`,
              r.data,
            ]),
          );
          for (const offer of normalized.offers) {
            const old = oldByIdentity.get(`${offer.supplierVat}:${offer.code}`);
            if (!old) continue;
            if (new Date(old.validTo) < now) {
              const before = structuredClone(old.sourceRecord),
                after = structuredClone(offer.sourceRecord);
              delete before.ValiditaOfferta;
              delete after.ValiditaOfferta;
              if (canonical(before) !== canonical(after))
                throw new Error(
                  `Unexpected expired-offer modification ${offer.code}`,
                );
            }
            if (
              new Date(old.validFrom) <= now &&
              old.economicFingerprint !== offer.economicFingerprint
            )
              throw new Error(
                `Unexpected economic modification of existing official identity ${offer.supplierVat}:${offer.code}`,
              );
            if (
              new Date(old.validFrom) <= now &&
              new Date(old.validTo) >= now &&
              old.validFrom !== offer.validFrom
            )
              throw new Error(
                `Unexpected active-offer start-date modification ${offer.code}`,
              );
          }
        }
        const observationIds: string[] = [];
        for (const batch of chunks(normalized.offers)) {
          const rows = batch.map((data) => {
            const contentHash = digest(canonical(data));
            const id = digest(
              `${commodity}:${data.supplierVat}:${data.code}:${contentHash}`,
            );
            observationIds.push(id);
            return {
              id,
              commodity,
              code: data.code,
              supplierVat: data.supplierVat,
              economicFingerprint: data.economicFingerprint,
              contentHash,
              data,
              firstObservedAt: now,
            };
          });
          await tx
            .insert(catalogObservations)
            .values(rows)
            .onConflictDoNothing();
        }
        await tx
          .insert(catalogSnapshots)
          .values({
            id: bundleHash,
            commodity,
            sourceDate,
            createdAt: now,
            bundleHash,
            referenceVersionId,
            parameters,
            manifest,
          })
          .onConflictDoNothing();
        for (const batch of chunks(observationIds, 500))
          await tx
            .insert(catalogMembers)
            .values(
              batch.map((observationId) => ({
                snapshotId: bundleHash,
                observationId,
              })),
            )
            .onConflictDoNothing();
        await tx
          .insert(catalogPublished)
          .values({ commodity, snapshotId: bundleHash, publishedAt: now })
          .onConflictDoUpdate({
            target: catalogPublished.commodity,
            set: { snapshotId: bundleHash, publishedAt: now },
          });
        await tx
          .update(catalogRuns)
          .set({
            state: "published",
            snapshotId: bundleHash,
            finishedAt: now,
            error: null,
          })
          .where(eq(catalogRuns.id, runId));
        return { state: "published", versionId: bundleHash };
      });
      return { runId, ...outcome };
    } catch (error) {
      await fail(runId, error);
      throw error;
    }
  }
  async function refreshCatalog(input: {
    commodity: Commodity;
    references?: ReferenceBundle;
    runId?: string;
  }) {
    const stage = await stageCatalog(input);
    if (input.references) await publishReferences(input.references);
    await qualifyCatalog({ runId: stage.runId });
    return publishCatalog({ runId: stage.runId });
  }
  async function reprocessCatalog({
    commodity,
    versionId,
  }: {
    commodity: Commodity;
    versionId?: string;
  }) {
    if (!versionId) {
      const [pointer] = await db
        .select()
        .from(catalogPublished)
        .where(eq(catalogPublished.commodity, commodity));
      versionId = pointer?.snapshotId;
    }
    if (!versionId)
      throw new Error("No published catalog originals to reprocess");
    const [prior] = await db
      .select()
      .from(catalogRuns)
      .where(
        and(
          eq(catalogRuns.snapshotId, versionId),
          eq(catalogRuns.commodity, commodity),
        ),
      )
      .orderBy(desc(catalogRuns.startedAt), desc(catalogRuns.id))
      .limit(1);
    if (!prior)
      throw new Error("Published catalog has no retained original run");
    const files = await db
      .select()
      .from(catalogFiles)
      .where(eq(catalogFiles.runId, prior.id));
    if (
      files.filter(
        (file) => file.kind === "offers" || file.kind === "parameters",
      ).length !== 2
    )
      throw new Error("Published catalog original set is incomplete");
    const runId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(catalogRuns).values({
        id: runId,
        commodity,
        state: "staged",
        startedAt: clock(),
        sourceDate: files[0].sourceDate,
      });
      await tx.insert(catalogFiles).values(
        files.map((file) => ({
          ...file,
          id: `${runId}:${file.kind}`,
          runId,
        })),
      );
    });
    await qualifyCatalog({ runId });
    return publishCatalog({ runId });
  }
  async function readCatalog({
    commodity,
    versionId,
    at = clock(),
    municipalityCode,
    portalLocalityCode,
    portalMunicipalityCode,
  }: {
    commodity: Commodity;
    versionId?: string;
    at?: Date;
    municipalityCode?: string;
    portalLocalityCode?: string;
    portalMunicipalityCode?: string;
  }): Promise<CatalogRead> {
    const empty: CatalogRead = {
      status: "incomplete_data",
      reasons: ["catalog_unavailable"],
      commodity,
      versionId: null,
      referenceVersionId: null,
      sourceDate: null,
      acquiredAt: null,
      offers: [],
      parameters: null,
      references: null,
      manifest: null,
      requiredAnnualFingerprints: [],
    };
    if (!versionId) {
      const [pointer] = await db
        .select()
        .from(catalogPublished)
        .where(eq(catalogPublished.commodity, commodity));
      versionId = pointer?.snapshotId;
    }
    if (!versionId) return empty;
    const pinnedVersion = versionId;
    const cache = catalogCache(db);
    const loaded = await versionCached(
      cache.snapshots[commodity],
      pinnedVersion,
      async () => {
        const [snapshot] = await db
          .select()
          .from(catalogSnapshots)
          .where(
            and(
              eq(catalogSnapshots.id, pinnedVersion),
              eq(catalogSnapshots.commodity, commodity),
            ),
          );
        if (!snapshot) return null;
        const rows = await db
          .select({ data: catalogObservations.data })
          .from(catalogMembers)
          .innerJoin(
            catalogObservations,
            eq(catalogMembers.observationId, catalogObservations.id),
          )
          .where(eq(catalogMembers.snapshotId, pinnedVersion));
        return {
          snapshot,
          offers: rows.map((row) => normalizedOfferSchema.parse(row.data)),
        };
      },
      2,
    );
    if (!loaded) return empty;
    const { snapshot } = loaded;
    const refs = await versionCached(
      cache.references,
      snapshot.referenceVersionId,
      async () => {
        const [ref] = await db
          .select({ payload: referenceSets.payload })
          .from(referenceSets)
          .where(eq(referenceSets.id, snapshot.referenceVersionId));
        return (ref?.payload as ReferenceBundle | undefined) ?? null;
      },
      4,
    );
    const offers = loaded.offers
      .filter(
        (offer) =>
          new Date(offer.validFrom) <= at && new Date(offer.validTo) >= at,
      )
      .sort(
        (a, b) =>
          a.code.localeCompare(b.code) ||
          a.supplierVat.localeCompare(b.supplierVat),
      );
    const ageMs =
      at.valueOf() -
      new Date(
        portalDate(
          `${snapshot.sourceDate.slice(8, 10)}/${snapshot.sourceDate.slice(5, 7)}/${snapshot.sourceDate.slice(0, 4)}_00:00:00`,
        ),
      ).valueOf();
    const reasons: string[] = [];
    if (ageMs > 48 * 3600000) reasons.push("catalog_source_older_than_48h");
    if (ageMs < 0) reasons.push("catalog_source_in_future");
    if (!offers.length) reasons.push("no_current_offers");
    if (!refs) reasons.push("reference_version_unavailable");
    if (commodity === "gas" && refs) {
      const source = originalOffersSource(
        snapshot.sourceDate,
        snapshot.manifest,
      );
      for (const offer of offers.filter(requiresGasSaleSupplement)) {
        const record = (refs.offerSalesSupplements ?? []).find(
          (item) => item.economicFingerprint === offer.economicFingerprint,
        );
        try {
          if (!record || !source) throw new Error("Missing daily supplement");
          checkedSupplement(record, offer, source);
        } catch {
          reasons.push("gas_sale_supplement_unqualified");
          break;
        }
      }
    }
    if (refs && portalMunicipalityCode) {
      const resolution = resolvePortalMunicipality(
        refs,
        portalMunicipalityCode,
        commodity,
      );
      if (resolution.status !== "ready") reasons.push(...resolution.reasons);
    }
    if (refs && municipalityCode) {
      const resolution = resolveMunicipality(
        refs,
        municipalityCode,
        commodity,
        portalLocalityCode,
      );
      if (resolution.status !== "ready") reasons.push(...resolution.reasons);
    }
    return {
      status: reasons.length ? "incomplete_data" : "ready",
      reasons,
      commodity,
      versionId,
      referenceVersionId: snapshot.referenceVersionId,
      sourceDate: snapshot.sourceDate,
      acquiredAt: snapshot.createdAt.toISOString(),
      offers,
      parameters: snapshot.parameters as ReturnType<typeof parseParameters>,
      references: refs ?? null,
      manifest: snapshot.manifest,
      requiredAnnualFingerprints: [
        ...new Set(
          offers
            .filter((o) => o.priceBandCode === "07")
            .map((o) => o.economicFingerprint),
        ),
      ],
    };
  }
  async function readOfferVersion({
    commodity,
    versionId,
    code,
    supplierVat,
  }: {
    commodity: Commodity;
    versionId: string;
    code: string;
    supplierVat: string;
  }): Promise<NormalizedOffer | null> {
    const [row] = await db
      .select({ data: catalogObservations.data })
      .from(catalogMembers)
      .innerJoin(
        catalogSnapshots,
        eq(catalogMembers.snapshotId, catalogSnapshots.id),
      )
      .innerJoin(
        catalogObservations,
        eq(catalogMembers.observationId, catalogObservations.id),
      )
      .where(
        and(
          eq(catalogSnapshots.commodity, commodity),
          eq(catalogMembers.snapshotId, versionId),
          eq(catalogObservations.commodity, commodity),
          eq(catalogObservations.code, code),
          eq(catalogObservations.supplierVat, supplierVat),
        ),
      )
      .limit(1);
    return row ? normalizedOfferSchema.parse(row.data) : null;
  }
  async function readOfferVersionContext({
    commodity,
    versionId,
    code,
    supplierVat,
  }: {
    commodity: Commodity;
    versionId: string;
    code: string;
    supplierVat: string;
  }) {
    const [row] = await db
      .select({
        data: catalogObservations.data,
        referenceVersionId: catalogSnapshots.referenceVersionId,
        sourceDate: catalogSnapshots.sourceDate,
        manifest: catalogSnapshots.manifest,
        supplements: sql<
          GasSaleSupplement[]
        >`coalesce(${referenceSets.payload}->'offerSalesSupplements','[]'::jsonb)`,
      })
      .from(catalogMembers)
      .innerJoin(
        catalogSnapshots,
        eq(catalogMembers.snapshotId, catalogSnapshots.id),
      )
      .innerJoin(
        catalogObservations,
        eq(catalogMembers.observationId, catalogObservations.id),
      )
      .innerJoin(
        referenceSets,
        eq(catalogSnapshots.referenceVersionId, referenceSets.id),
      )
      .where(
        and(
          eq(catalogSnapshots.commodity, commodity),
          eq(catalogMembers.snapshotId, versionId),
          eq(catalogObservations.commodity, commodity),
          eq(catalogObservations.code, code),
          eq(catalogObservations.supplierVat, supplierVat),
        ),
      )
      .limit(1);
    if (!row) return null;
    const offer = normalizedOfferSchema.parse(row.data),
      source = originalOffersSource(row.sourceDate, row.manifest);
    let offerSalesSupplement: GasSaleSupplement | null = null;
    if (commodity === "gas" && source) {
      const saved = row.supplements.find(
        (record) => record.economicFingerprint === offer.economicFingerprint,
      );
      if (saved) {
        try {
          offerSalesSupplement = checkedSupplement(saved, offer, source);
        } catch {
          offerSalesSupplement = null;
        }
      }
    }
    return {
      offer,
      versionId,
      referenceVersionId: row.referenceVersionId,
      sourceDate: row.sourceDate,
      sourceSha256: source?.sha256 ?? null,
      offerSalesSupplement,
      normalizationVersion:
        row.manifest &&
        typeof row.manifest === "object" &&
        "normalizationVersion" in row.manifest
          ? String(row.manifest.normalizationVersion)
          : null,
    };
  }
  async function getCatalogStatus({
    commodity,
    at = clock(),
  }: {
    commodity: Commodity;
    at?: Date;
  }) {
    const [snapshot] = await db
      .select({
        id: catalogSnapshots.id,
        sourceDate: catalogSnapshots.sourceDate,
        createdAt: catalogSnapshots.createdAt,
        referenceVersionId: catalogSnapshots.referenceVersionId,
        manifest: catalogSnapshots.manifest,
        coverage: referenceSets.coverage,
        saleSupplementBindings:
          commodity === "gas"
            ? sql<
                GasSaleSupplement[]
              >`coalesce(${referenceSets.payload}->'offerSalesSupplements','[]'::jsonb)`
            : sql<GasSaleSupplement[]>`'[]'::jsonb`,
      })
      .from(catalogPublished)
      .innerJoin(
        catalogSnapshots,
        eq(catalogPublished.snapshotId, catalogSnapshots.id),
      )
      .leftJoin(
        referenceSets,
        eq(catalogSnapshots.referenceVersionId, referenceSets.id),
      )
      .where(eq(catalogPublished.commodity, commodity));
    const [lastRun] = await db
      .select()
      .from(catalogRuns)
      .where(eq(catalogRuns.commodity, commodity))
      .orderBy(desc(catalogRuns.startedAt), desc(catalogRuns.id))
      .limit(1);
    let currentOfferCount = 0;
    let requiredAnnualFingerprints: string[] = [];
    let unqualifiedSaleFingerprints: string[] = [];
    const reasons: string[] = [];
    if (snapshot) {
      const valid = and(
        eq(catalogMembers.snapshotId, snapshot.id),
        sql`(${catalogObservations.data}->>'validFrom')::timestamptz <= ${at.toISOString()}::timestamptz`,
        sql`(${catalogObservations.data}->>'validTo')::timestamptz >= ${at.toISOString()}::timestamptz`,
      );
      const [countRows, peakRows] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::integer` })
          .from(catalogMembers)
          .innerJoin(
            catalogObservations,
            eq(catalogMembers.observationId, catalogObservations.id),
          )
          .where(valid),
        db
          .selectDistinct({
            fingerprint: sql<string>`${catalogObservations.data}->>'economicFingerprint'`,
          })
          .from(catalogMembers)
          .innerJoin(
            catalogObservations,
            eq(catalogMembers.observationId, catalogObservations.id),
          )
          .where(
            and(
              valid,
              sql`${catalogObservations.data}->>'priceBandCode' = '07'`,
            ),
          ),
      ]);
      if (commodity === "gas") {
        const cohort = await db
          .select({
            fingerprint: sql<string>`${catalogObservations.data}->>'economicFingerprint'`,
          })
          .from(catalogMembers)
          .innerJoin(
            catalogObservations,
            eq(catalogMembers.observationId, catalogObservations.id),
          )
          .where(
            and(
              valid,
              sql`${catalogObservations.data}->>'offerType' = 'fixed'`,
              sql`jsonb_path_exists(${catalogObservations.data},'$.components[*] ? (@.macroarea == "04")')`,
              sql`not jsonb_path_exists(${catalogObservations.data},'$.components[*] ? (@.macroarea == "04" && @.type != "02")')`,
              sql`not jsonb_path_exists(${catalogObservations.data},'$.components[*] ? (@.macroarea == "06" && @.type == "01")')`,
            ),
          );
        const source = originalOffersSource(
          snapshot.sourceDate,
          snapshot.manifest,
        );
        const bound = new Set(
          snapshot.saleSupplementBindings
            .filter(
              (record) =>
                source &&
                record.sourceDate === source.sourceDate &&
                record.catalogSourceSha256 === source.sha256,
            )
            .map((record) => record.economicFingerprint),
        );
        unqualifiedSaleFingerprints = cohort
          .map((row) => row.fingerprint)
          .filter((fingerprint) => !bound.has(fingerprint))
          .sort();
        if (unqualifiedSaleFingerprints.length)
          reasons.push("gas_sale_supplement_unqualified");
      }
      currentOfferCount = countRows[0]?.count ?? 0;
      requiredAnnualFingerprints = peakRows
        .map((row) => row.fingerprint)
        .sort();
      const ageMs =
        at.valueOf() -
        new Date(
          portalDate(
            `${snapshot.sourceDate.slice(8, 10)}/${snapshot.sourceDate.slice(5, 7)}/${snapshot.sourceDate.slice(0, 4)}_00:00:00`,
          ),
        ).valueOf();
      if (ageMs > 48 * 3600000) reasons.push("catalog_source_older_than_48h");
      if (ageMs < 0) reasons.push("catalog_source_in_future");
      if (!currentOfferCount) reasons.push("no_current_offers");
      if (!snapshot.coverage) reasons.push("reference_version_unavailable");
    } else reasons.push("catalog_unavailable");
    const coverage = snapshot?.coverage as
      | ReferenceBundle["coverage"]
      | undefined;
    const nationalReferencesReady =
      coverage &&
      (commodity === "electricity"
        ? coverage.electricityNationalReady
        : coverage.gasNationalReady);
    const catalogStatus = reasons.length ? "incomplete_data" : "ready";
    return {
      status:
        catalogStatus === "ready" && nationalReferencesReady
          ? "ready"
          : "incomplete_data",
      catalogStatus,
      reasons: [
        ...reasons,
        ...(!nationalReferencesReady
          ? ["national_reference_coverage_incomplete"]
          : []),
      ],
      commodity,
      versionId: snapshot?.id ?? null,
      referenceVersionId: snapshot?.referenceVersionId ?? null,
      sourceDate: snapshot?.sourceDate ?? null,
      acquiredAt: snapshot?.createdAt.toISOString() ?? null,
      currentOfferCount,
      coverage: coverage ?? null,
      requiredAnnualFingerprints,
      unqualifiedSaleFingerprints,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            state: lastRun.state,
            startedAt: lastRun.startedAt.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString() ?? null,
            error: lastRun.error,
          }
        : null,
      manifest: snapshot?.manifest ?? null,
    };
  }

  return {
    stageCatalog,
    qualifyCatalog,
    publishCatalog,
    refreshCatalog,
    reprocessCatalog,
    readCatalog,
    readOfferVersion,
    readOfferVersionContext,
    getCatalogStatus,
    publishReferences,
  };
}
