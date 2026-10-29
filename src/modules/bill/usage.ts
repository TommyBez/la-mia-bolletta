import Decimal from "decimal.js";
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../../db";
import { billAttempts } from "../../db/schema/documents";

/** Operator interface; contains no filenames, documents or extracted values. */
export async function getBillUsage(input: {
  from: Date;
  to: Date;
  jobId?: string;
}) {
  if (
    !Number.isFinite(input.from.valueOf()) ||
    !Number.isFinite(input.to.valueOf()) ||
    input.from >= input.to
  )
    throw new Error("A valid, increasing usage interval is required");
  const rows = await getDb()
    .select({
      model: billAttempts.model,
      state: billAttempts.state,
      inputTokens: billAttempts.inputTokens,
      outputTokens: billAttempts.outputTokens,
      estimatedCostUsd: billAttempts.estimatedCostUsd,
      usage: billAttempts.usage,
      durationMs: billAttempts.durationMs,
    })
    .from(billAttempts)
    .where(
      and(
        gte(billAttempts.createdAt, input.from),
        lt(billAttempts.createdAt, input.to),
        input.jobId ? eq(billAttempts.jobId, input.jobId) : undefined,
      ),
    );
  const groups = new Map<
    string,
    {
      model: string;
      attempts: number;
      completed: number;
      failed: number;
      inputTokens: number;
      outputTokens: number;
      durationMs: number;
      gatewayReportedCostUsd: string;
      estimatedCostUsd: string;
      unknownCostAttempts: number;
    }
  >();
  for (const row of rows) {
    const group = groups.get(row.model) ?? {
      model: row.model,
      attempts: 0,
      completed: 0,
      failed: 0,
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      gatewayReportedCostUsd: "0",
      estimatedCostUsd: "0",
      unknownCostAttempts: 0,
    };
    group.attempts++;
    if (row.state === "complete") group.completed++;
    else group.failed++;
    group.inputTokens += row.inputTokens ?? 0;
    group.outputTokens += row.outputTokens ?? 0;
    group.durationMs += row.durationMs;
    const usage = row.usage as {
      costKind?: string;
      billedCostUsd?: unknown;
    } | null;
    if (
      usage?.costKind === "gateway_reported" &&
      typeof usage.billedCostUsd === "string" &&
      /^\d+(?:\.\d+)?$/.test(usage.billedCostUsd)
    )
      group.gatewayReportedCostUsd = new Decimal(group.gatewayReportedCostUsd)
        .plus(usage.billedCostUsd)
        .toFixed();
    else group.unknownCostAttempts++;
    if (row.estimatedCostUsd !== null)
      group.estimatedCostUsd = new Decimal(group.estimatedCostUsd)
        .plus(row.estimatedCostUsd)
        .toFixed();
    groups.set(row.model, group);
  }
  return {
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    models: [...groups.values()].sort((a, b) => a.model.localeCompare(b.model)),
  };
}
