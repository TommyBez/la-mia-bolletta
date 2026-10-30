import { start } from "workflow/api";
import type { Commodity } from "@/src/modules/catalog/normalize";
import { refreshCatalogWorkflow } from "@/src/modules/catalog/workflow";
import { isInternalRequest } from "@/src/server/internal-auth";
export const maxDuration = 300;
/** Vercel Cron and operator retries launch independent durable commodity imports. */
export async function GET(request: Request) {
  if (!isInternalRequest(request))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const requested = new URL(request.url).searchParams.get("commodity");
  if (requested && !["electricity", "gas"].includes(requested))
    return Response.json({ error: "invalid_commodity" }, { status: 400 });
  const commodities: Commodity[] = requested
    ? [requested as Commodity]
    : ["electricity", "gas"];
  const attempts = await Promise.allSettled(
    commodities.map(async (commodity) => {
      const run = await start(refreshCatalogWorkflow, [commodity]);
      return { commodity, workflowRunId: run.runId };
    }),
  );
  const results = attempts.map((attempt, i) =>
    attempt.status === "fulfilled"
      ? { ...attempt.value, state: "started" }
      : {
          commodity: commodities[i],
          state: "failed",
          error: "workflow_start_failed",
        },
  );
  return Response.json(
    { results },
    { status: results.every((r) => r.state === "started") ? 202 : 503 },
  );
}
