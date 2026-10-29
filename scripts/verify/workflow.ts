import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const target = new URL(process.argv[2]);
  const mode = process.argv[3] ?? "start";
  if (!["start", "status"].includes(mode))
    throw new Error("Choose start or status");
  if (
    !/^la-mia-bolletta-[a-z0-9]+-tommasos-projects-bb9d6551\.vercel\.app$/.test(
      target.hostname,
    ) ||
    target.protocol !== "https:"
  )
    throw new Error("Choose this project's exact internal preview deployment");
  if (!process.env.CRON_SECRET || !process.env.VERCEL_OIDC_TOKEN)
    throw new Error("Refresh local operator credentials without printing them");
  const response = await fetch(
    new URL(
      `/api/internal/catalog/${mode === "status" ? "status" : "refresh"}`,
      target,
    ),
    {
      redirect: "error",
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
        "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN,
      },
    },
  );
  if (response.status !== (mode === "status" ? 200 : 202))
    throw new Error(`Import trigger failed: HTTP ${response.status}`);
  const result = await response.json();
  if (mode === "status") {
    if (result.statuses?.length !== 2)
      throw new Error("Both catalog statuses are required");
    const proof = {
      checkedAt: new Date().toISOString(),
      baseUrl: target.origin,
      productionCronVerified: false,
      statuses: result.statuses.map(
        (item: {
          commodity: string;
          status: string;
          versionId: string;
          referenceVersionId: string;
          sourceDate: string;
          lastRun: unknown;
        }) => ({
          commodity: item.commodity,
          status: item.status,
          versionId: item.versionId,
          referenceVersionId: item.referenceVersionId,
          sourceDate: item.sourceDate,
          lastRun: item.lastRun,
        }),
      ),
    };
    await writeFile(
      "/tmp/lmb-workflow-preview-status.json",
      JSON.stringify(proof, null, 2),
    );
    console.log(JSON.stringify(proof, null, 2));
    return;
  }
  if (
    result.results?.length !== 2 ||
    result.results.some((run: { state: string }) => run.state !== "started")
  )
    throw new Error("Both independent commodity workflows must start");
  const proof = {
    checkedAt: new Date().toISOString(),
    environment: "protected Vercel Preview",
    baseUrl: target.origin,
    productionCronVerified: false,
    ...result,
  };
  await writeFile(
    "/tmp/lmb-workflow-preview-start.json",
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof, null, 2));
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Workflow verification failed",
  );
  process.exitCode = 1;
});
