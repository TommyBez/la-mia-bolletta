import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { closeDatabases, getDb } from "../../../src/db";
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
    throw new Error("Published sources unavailable");
  const profile = validateProfile({
    schemaVersion: 1,
    commodity: "electricity",
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "2700",
      unit: "kWh",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    electricity: {
      powerKw: "3",
      resident: true,
      bands: { F1: "891", F2: "837", F3: "972" },
    },
    origin: "manual",
    confirmed: true,
  });
  if (profile.status !== "ready") throw new Error("Invalid synthetic profile");
  const targets = catalog.offers.filter(
    (o) =>
      o.offerType === "fixed" &&
      o.components.some((c) => c.macroarea === "04") &&
      o.components
        .filter((c) => c.macroarea === "04")
        .every((c) => c.type === "02"),
  );
  const probes = targets.map((offer) => {
    const result = calculateElectricityOffer({
      profile: profile.profile,
      purpose: "current",
      preferences: { pricePreference: "any", requirements: {} },
      offer,
      catalog,
      scenario: scenario.snapshot,
    });
    if (result.status !== "calculated") throw new Error(JSON.stringify(result));
    return {
      offerCode: offer.code,
      supplierVat: offer.supplierVat,
      economicFingerprint: offer.economicFingerprint,
      offerType: offer.offerType,
      expectedAnnualCost: result.estimate.annualCost,
      expectedSales: result.estimate.breakdown.find((c) => c.code === "sales")
        ?.amount,
    };
  });
  const manifest = catalog.manifest as {
    files: { kind: string; url: string; sha256: string }[];
  };
  const source = manifest.files.find((f) => f.kind === "offers");
  if (!source) throw new Error("Missing official original");
  await writeFile(
    "/tmp/electricity-optional-plan.json",
    JSON.stringify(
      {
        catalogVersionId: catalog.versionId,
        scenarioVersionId: scenario.versionId,
        source,
        probes,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ status: "prepared", probes: probes.length }));
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Failed");
    process.exitCode = 1;
  })
  .finally(closeDatabases);
