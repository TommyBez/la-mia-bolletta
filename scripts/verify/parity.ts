import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
async function main() {
  const base = process.argv[2] ?? "http://localhost:3100";
  const target = new URL(base);
  if (
    !(
      target.hostname === "localhost" ||
      target.hostname === "127.0.0.1" ||
      /^la-mia-bolletta(?:-[a-z0-9-]+)?\.vercel\.app$/.test(target.hostname)
    )
  )
    throw new Error("Use this project's local or Vercel deployment URL");
  const token = process.env.MCP_ACCESS_TOKEN;
  if (!token) throw new Error("MCP_ACCESS_TOKEN is required; never print it");
  const commodity = process.argv[3] ?? "gas";
  if (!["gas", "electricity"].includes(commodity))
    throw new Error("Choose gas or electricity");
  const request = {
    profile: {
      schemaVersion: 1,
      supplyContext: {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      },
      commodity,
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: commodity === "gas" ? "1200" : "2700",
        unit: commodity === "gas" ? "Smc" : "kWh",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      ...(commodity === "gas"
        ? { gas: { usage: "heating", meterClass: "G4" } }
        : {
            electricity: {
              powerKw: "3",
              resident: true,
              bands: { F1: "891", F2: "837", F3: "972" },
            },
          }),
      origin: "client_mcp",
      confirmed: true,
      revision: 1,
    },
    preferences: {
      pricePreference: "any",
      requirements: { "payment:01": "satisfied" },
    },
    page: { offset: 0, limit: 20 },
  };
  const protection: Record<string, string> = {};
  if (target.hostname.endsWith(".vercel.app") && process.env.VERCEL_OIDC_TOKEN)
    protection["x-vercel-trusted-oidc-idp-token"] =
      process.env.VERCEL_OIDC_TOKEN;
  const webResponse = await fetch(new URL("/api/comparison", target), {
    method: "POST",
    headers: { ...protection, "Content-Type": "application/json" },
    body: JSON.stringify(request),
    redirect: "error",
  });
  if (
    !webResponse.ok ||
    !webResponse.headers.get("content-type")?.includes("json")
  )
    throw new Error(`Web response unavailable: HTTP ${webResponse.status}`);
  const web = await webResponse.json();
  assert.equal(web.status, "ready");
  const mcpResponse = await fetch(new URL("/api/mcp", target), {
    method: "POST",
    headers: {
      ...protection,
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "compare_offers",
        arguments: { ...request, versions: web.versions },
      },
    }),
    redirect: "error",
  });
  if (!mcpResponse.ok)
    throw new Error(`MCP unavailable: HTTP ${mcpResponse.status}`);
  const rpc = await mcpResponse.json();
  if (rpc.error || rpc.result?.isError)
    throw new Error("MCP reported an error");
  const mcp = rpc.result.structuredContent;
  // Only public, synthetic profile results; no requests, headers or credentials.
  await writeFile("/tmp/lmb-parity-web.json", JSON.stringify(web, null, 2));
  await writeFile("/tmp/lmb-parity-mcp.json", JSON.stringify(mcp, null, 2));
  assert.deepEqual(
    { ...mcp, calculatedAt: null },
    { ...web, calculatedAt: null },
  );
  const evidence = {
    checkedAt: new Date().toISOString(),
    baseUrl: target.origin,
    status: "passed",
    commodity,
    profile:
      commodity === "gas"
        ? "public synthetic 1200 Smc, Pescara, G4, heating"
        : "public synthetic 2700 kWh, Pescara, 3 kW, resident",
    versions: web.versions,
    coverage: web.coverage,
    pagination: web.pagination,
    equalFields: "all except calculation timestamp",
    source: "live published data; no fixture fallback",
  };
  await writeFile(
    "/tmp/lmb-parity-proof.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify(evidence, null, 2));
}
main().catch((error) => {
  console.error(
    error instanceof assert.AssertionError
      ? "Web/MCP results differ; inspect locally without credentials"
      : error instanceof Error
        ? error.message
        : "Verification failed",
  );
  process.exitCode = 1;
});
