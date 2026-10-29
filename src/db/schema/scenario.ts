import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { ScenarioSnapshot } from "../../modules/scenario/snapshot";

export const scenarioSnapshots = pgTable(
  "scenario_snapshots",
  {
    versionId: text("version_id").primaryKey(),
    commodity: text("commodity").notNull(),
    acquisitionMonth: text("acquisition_month").notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull(),
    coverageStart: text("coverage_start").notNull(),
    coverageEnd: text("coverage_end").notNull(),
    snapshot: jsonb("snapshot").$type<ScenarioSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("scenario_snapshot_commodity_month_idx").on(
      table.commodity,
      table.acquisitionMonth,
    ),
  ],
);
export const publishedScenarios = pgTable("published_scenarios", {
  commodity: text("commodity").primaryKey(),
  versionId: text("version_id")
    .notNull()
    .references(() => scenarioSnapshots.versionId),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
