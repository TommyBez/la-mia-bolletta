import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { NormalizedOffer } from "../../modules/catalog/normalize";

export const catalogRuns = pgTable("lmb_catalog_runs", {
  id: text("id").primaryKey(),
  commodity: text("commodity").notNull(),
  state: text("state").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  sourceDate: text("source_date"),
  snapshotId: text("snapshot_id"),
  error: jsonb("error").$type<{ code: string; message: string }>(),
});
export const catalogFiles = pgTable("lmb_catalog_files", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => catalogRuns.id),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  sourceDate: text("source_date").notNull(),
  sha256: text("sha256").notNull(),
  blobPath: text("blob_path").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull(),
  size: integer("size").notNull(),
  etag: text("etag"),
});
export const catalogObservations = pgTable(
  "lmb_catalog_observations",
  {
    id: text("id").primaryKey(),
    commodity: text("commodity").notNull(),
    code: text("code").notNull(),
    supplierVat: text("supplier_vat").notNull(),
    economicFingerprint: text("economic_fingerprint").notNull(),
    contentHash: text("content_hash").notNull(),
    data: jsonb("data").$type<NormalizedOffer>().notNull(),
    firstObservedAt: timestamp("first_observed_at", {
      withTimezone: true,
    }).notNull(),
  },
  (t) => [
    uniqueIndex("lmb_catalog_observation_content").on(
      t.commodity,
      t.supplierVat,
      t.code,
      t.contentHash,
    ),
  ],
);
export const referenceSets = pgTable("lmb_reference_sets", {
  id: text("id").primaryKey(),
  sourceDate: text("source_date").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull(),
  payload: jsonb("payload").notNull(),
  coverage: jsonb("coverage").notNull(),
  manifest: jsonb("manifest").notNull(),
});
export const catalogSnapshots = pgTable("lmb_catalog_snapshots", {
  id: text("id").primaryKey(),
  commodity: text("commodity").notNull(),
  sourceDate: text("source_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  bundleHash: text("bundle_hash").notNull(),
  referenceVersionId: text("reference_version_id")
    .notNull()
    .references(() => referenceSets.id),
  parameters: jsonb("parameters").notNull(),
  manifest: jsonb("manifest").notNull(),
});
export const catalogMembers = pgTable(
  "lmb_catalog_members",
  {
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => catalogSnapshots.id),
    observationId: text("observation_id")
      .notNull()
      .references(() => catalogObservations.id),
  },
  (t) => [primaryKey({ columns: [t.snapshotId, t.observationId] })],
);
export const catalogPublished = pgTable("lmb_catalog_published", {
  commodity: text("commodity").primaryKey(),
  snapshotId: text("snapshot_id")
    .notNull()
    .references(() => catalogSnapshots.id),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
});
export const referencePublished = pgTable("lmb_reference_published", {
  scope: text("scope").primaryKey(),
  referenceVersionId: text("reference_version_id")
    .notNull()
    .references(() => referenceSets.id),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
});
