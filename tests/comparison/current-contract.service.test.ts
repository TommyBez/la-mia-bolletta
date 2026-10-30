import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDb } from "../../src/db";
import { digest, normalizeOffers } from "../../src/modules/catalog/normalize";
import { createCatalogService } from "../../src/modules/catalog/service";
import { createComparisonService } from "../../src/modules/comparison/service";
import { bundledReferences } from "../../src/modules/references/registry";
import { createScenarioService } from "../../src/modules/scenario";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Dedicated test database required");
const db = createDb(process.env.TEST_DATABASE_URL);
const at = new Date("2026-10-30T12:00:00Z");
const fixture = (name: string) =>
  readFileSync(`tests/comparison/electricity/fixtures/${name}`, "utf8");
const xml = fixture("plenitude-20261029.xml"),
  csv = fixture("parameters-20261029.csv");
const officialOffer = normalizeOffers(xml, "electricity").offers[0];
const service = createComparisonService({ db, now: () => at });
const profile = {
  schemaVersion: 1,
  supplyContext: {
    domestic: true,
    active: true,
    operation: "switch_same_holder",
  },
  commodity: "electricity",
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
};
const conditions = {
  confirmed: true,
  priceKind: "variable",
  index: "PUN",
  indexMultiplier: "2",
  spread: "0.1",
  indexIncludesNetworkLosses: true,
  fixedAnnualCharge: "0",
  validFrom: "2026-10-01",
  validTo: "2027-09-30",
  allCommercialChargesIncluded: true,
};
beforeAll(async () => {
  const originals = new Map<string, string>();
  const catalog = createCatalogService({
    db,
    clock: () => at,
    source: {
      acquire: async () =>
        ["offers", "parameters"].map((kind) => ({
          kind: kind as "offers" | "parameters",
          body: kind === "offers" ? xml : csv,
          sourceDate: "2026-10-30",
          acquiredAt: at.toISOString(),
          sha256: digest(kind === "offers" ? xml : csv),
          url: `https://www.ilportaleofferte.it/test/${kind}`,
        })),
    },
    originals: {
      put: async (path, body) => {
        originals.set(path, body);
        return { path };
      },
      get: async (path) => {
        const body = originals.get(path);
        if (!body) throw new Error("Missing source fixture");
        return body;
      },
    },
  });
  const publication = await catalog.refreshCatalog({
    commodity: "electricity",
    references: bundledReferences(),
  });
  if (!publication.versionId) throw new Error("Source fixture not published");
  const scenario = JSON.parse(fixture("scenario-20261029.json"));
  scenario.catalogVersionId = publication.versionId;
  const result = await createScenarioService(db, {
    now: () => at,
  }).importSnapshot(scenario);
  expect(result.status).toBe("published");
});
afterAll(() => db.$client.end());
it("preserves the confirmed formula 2 × PUN including losses + spread, without multiplying the spread", async () => {
  // Four official F0 coefficients average0.184511969696... EUR/kWh.
  // 2700×(2×PUN×1.1+0.1)=1366.0011 EUR sales; statutory rest245.2725; VAT10%.
  const result = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
    currentBillConditions: conditions,
  });
  expect(result.status).toBe("ready");
  if (!("currentContract" in result)) throw new Error(JSON.stringify(result));
  expect(result.currentContract).toMatchObject({
    status: "comparable",
    annualCost: "1772.40",
  });
});

it("treats a zero PUN multiplier as a fixed spread without dropping its energy price", async () => {
  const result = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
    currentBillConditions: { ...conditions, indexMultiplier: "0" },
  });
  expect(result.status).toBe("ready");
  if (!("currentContract" in result)) throw new Error(JSON.stringify(result));
  // 2700×0.1=270 EUR sales, plus245.2725 statutory rest and10% VAT.
  expect(result.currentContract).toMatchObject({
    status: "comparable",
    annualCost: "566.80",
    estimate: { offerType: "fixed" },
  });
});

it("keeps official alternatives available but does not infer zero sales or recommend staying from an unqualified normalized bill", async () => {
  const result = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
    currentContract: {
      confirmed: true,
      applicableFrom: "2026-10-01",
      applicableTo: "2027-09-30",
      source: { kind: "confirmed_bill", reference: "unqualified-client-bill" },
      offer: {
        ...officialOffer,
        sourceRecord: {},
        components: [],
        indices: [],
      },
    },
  });
  expect(result.status).toBe("ready");
  if (!("currentContract" in result)) throw new Error(JSON.stringify(result));
  expect(result.offers).toHaveLength(1);
  expect(result.currentContract.status).toBe("incomplete");
  expect(result.offers[0].savings).toBeUndefined();
  expect(result.recommendation.kind).toBe("conditional");
});

it("resolves official archive conditions from their pinned server observation rather than the client offer body", async () => {
  const alternatives = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
  });
  if (!("versions" in alternatives))
    throw new Error(JSON.stringify(alternatives));
  const result = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
    currentContract: {
      confirmed: true,
      applicableFrom: "2026-10-01",
      applicableTo: "2027-09-30",
      source: {
        kind: "official_archive",
        reference: alternatives.versions.catalog,
      },
      offer: {
        ...officialOffer,
        sourceRecord: {},
        components: [],
        indices: [],
      },
    },
  });
  expect(result).toMatchObject({
    status: "ready",
    currentContract: { status: "comparable", annualCost: "910.25" },
  });
});

it("accepts only the official archived identity and version without requiring invented normalized XML fields", async () => {
  const alternatives = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
  });
  if (!("versions" in alternatives))
    throw new Error(JSON.stringify(alternatives));
  const result = await service.compare({
    profile,
    preferences: { requirements: { "payment:01": "satisfied" } },
    currentContract: {
      confirmed: true,
      applicableFrom: "2026-10-01",
      applicableTo: "2027-09-30",
      source: {
        kind: "official_archive",
        reference: alternatives.versions.catalog,
      },
      offer: {
        code: officialOffer.code,
        supplierVat: officialOffer.supplierVat,
      },
    },
  });
  expect(result).toMatchObject({
    status: "ready",
    currentContract: { status: "comparable", annualCost: "910.25" },
  });
});
