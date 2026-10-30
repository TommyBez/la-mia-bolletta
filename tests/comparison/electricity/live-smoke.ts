import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { getDb } from "../../../src/db";
import { validateProfile } from "../../../src/domain/profile";
import { createBlobOriginalStore } from "../../../src/modules/catalog/originals";
import { createCatalogService } from "../../../src/modules/catalog/service";
import { createOfficialSource } from "../../../src/modules/catalog/source";
import { calculateElectricityOffer } from "../../../src/modules/comparison/electricity";
import { createScenarioService } from "../../../src/modules/scenario";

async function main() {
  loadEnvConfig(process.cwd());
  const db = getDb();
  const catalog = await createCatalogService({
    db,
    source: createOfficialSource(),
    originals: createBlobOriginalStore(),
  }).readCatalog({ commodity: "electricity" });
  const scenario = await createScenarioService(db).getScenario({
    commodity: "electricity",
    requiredAnnualFingerprints: catalog.requiredAnnualFingerprints,
  });
  if (catalog.status !== "ready" || scenario.status !== "ready")
    throw new Error(
      `Live published data unavailable:${catalog.reasons.join(",")}/${scenario.reasons.join(",")}`,
    );
  const cases = process.argv.includes("--full")
    ? ["0", "1000", "2700", "5000", "8000", "20000"]
    : ["2700"];
  const output = [];
  for (const value of cases) {
    const numeric = Number(value);
    for (const power of process.argv.includes("--full")
      ? ["1.5", "3", "6", "20"]
      : ["3"]) {
      for (const resident of process.argv.includes("--full")
        ? [true, false]
        : [true]) {
        const v = validateProfile({
          schemaVersion: 1,
          commodity: "electricity",
          supplyContext: {
            domestic: true,
            active: true,
            operation: "switch_same_holder",
          },
          municipality: { portalCode: "068028", name: "Pescara" },
          annualConsumption: {
            value,
            unit: "kWh",
            kind: "declared",
            period: { from: "2025-10-01", to: "2026-09-30" },
          },
          electricity: {
            powerKw: power,
            resident,
            bands: {
              F1: String(numeric * 0.33),
              F2: String(numeric * 0.31),
              F3: String(numeric * 0.36),
            },
          },
          origin: "manual",
          confirmed: true,
        });
        if (v.status !== "ready") throw new Error(JSON.stringify(v));
        const estimates: {
          code: string;
          annualCost: string;
          offerType: string;
        }[] = [];
        const failures: Record<string, string[]> = Object.create(null),
          counts: Record<string, number> = {};
        const started = Date.now();
        for (const offer of catalog.offers) {
          const result = calculateElectricityOffer({
            profile: v.profile,
            preferences: { pricePreference: "any", requirements: {} },
            offer,
            catalog,
            scenario: scenario.snapshot,
          });
          counts[result.status] = (counts[result.status] ?? 0) + 1;
          if (result.status === "calculated")
            estimates.push({
              code: offer.code,
              annualCost: result.estimate.annualCost,
              offerType: offer.offerType,
            });
          if (result.status === "incomplete_data")
            for (const reason of result.reasons) {
              failures[reason] ??= [];
              failures[reason].push(offer.code);
            }
        }
        output.push({
          value,
          power,
          resident,
          counts,
          failures,
          durationMs: Date.now() - started,
          top: estimates
            .sort((a, b) => Number(a.annualCost) - Number(b.annualCost))
            .slice(0, 5),
        });
      }
    }
  }
  const result = {
    catalogVersionId: catalog.versionId,
    scenarioVersionId: scenario.versionId,
    offerCount: catalog.offers.length,
    cases: output,
  };
  await writeFile(
    "/tmp/electricity-live-smoke.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  if (output.some((c) => c.counts.incomplete_data)) process.exitCode = 1;
}
main()
  .catch((e) => {
    const cause =
      e instanceof Error ? (e.cause as Error | undefined) : undefined;
    console.error(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Live verification failed",
        cause: cause?.message?.replace(
          /postgres(?:ql)?:\/\/[^\s]+/g,
          "[database URL redacted]",
        ),
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50);
  });
