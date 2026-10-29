import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { BillExtraction } from "../../modules/bill/extraction";
import type { BillFile } from "../../modules/bill/files";
export const billJobs = pgTable(
  "bill_jobs",
  {
    id: text("id").primaryKey(),
    capabilityHash: text("capability_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    state: text("state").notNull().default("uploading"),
    files: jsonb("files").$type<BillFile[]>().notNull(),
    result: jsonb("result").$type<BillExtraction>(),
    error: text("error"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("bill_jobs_state_lease").on(table.state, table.leaseUntil)],
);
export const billAttempts = pgTable("bill_attempts", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => billJobs.id),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  state: text("state").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  estimatedCostUsd: text("estimated_cost_usd"),
  usage: jsonb("usage"),
  durationMs: integer("duration_ms").notNull(),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
