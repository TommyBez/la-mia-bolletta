import { randomUUID } from "node:crypto";
import type { Commodity } from "./normalize";
import { getCatalogService } from "./runtime";

/** Only small IDs cross durable boundaries. Original XML/CSV stay in private Blob. */
export async function refreshCatalogWorkflow(commodity: Commodity) {
  "use workflow";
  const runId = await beginImport(commodity);
  await acquireOriginals(commodity, runId);
  await qualifyReferences(runId);
  const result = await publishImport(runId);
  console.log("catalog.workflow.completed", {
    commodity,
    runId,
    state: result.state,
  });
  return result;
}
async function beginImport(commodity: Commodity) {
  "use step";
  const runId = randomUUID();
  console.log("catalog.workflow.started", { commodity, runId });
  return runId;
}
async function acquireOriginals(commodity: Commodity, runId: string) {
  "use step";
  console.log("catalog.acquire.started", { commodity, runId });
  const result = await getCatalogService().stageCatalog({ commodity, runId });
  console.log("catalog.acquire.staged", { commodity, runId });
  return result;
}
async function publishImport(runId: string) {
  "use step";
  const started = Date.now();
  console.log("catalog.publish.started", { runId });
  const result = await getCatalogService().publishCatalog({ runId });
  console.log("catalog.publish.completed", {
    runId,
    state: result.state,
    elapsedMs: Date.now() - started,
  });
  return result;
}

async function qualifyReferences(runId: string) {
  "use step";
  const started = Date.now();
  console.log("catalog.qualify.started", { runId });
  const result = await getCatalogService().qualifyCatalog({ runId });
  console.log("catalog.qualify.completed", {
    ...result,
    elapsedMs: Date.now() - started,
  });
  return result;
}
