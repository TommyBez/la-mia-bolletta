import { readFileSync } from "node:fs";
import { afterAll, expect, it } from "vitest";
import { createDb } from "../../src/db";
import { digest } from "../../src/modules/catalog/normalize";
import { createCatalogService } from "../../src/modules/catalog/service";
import { createComparisonService } from "../../src/modules/comparison/service";
import { bundledReferences } from "../../src/modules/references/registry";
import { createScenarioService } from "../../src/modules/scenario";
import { gasSnapshot } from "../scenario/support";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Dedicated test database required");
const db = createDb(process.env.TEST_DATABASE_URL);
afterAll(() => db.$client.end());

it("asks for missing profile fields before attempting an economic comparison", async () => {
  const service = createComparisonService({ db });
  const result = await service.compare({
    profile: { commodity: "electricity", confirmed: false },
  });
  expect(result.status).toBe("needs_input");
  if (result.status === "needs_input") {
    expect(result.issues.map((issue) => issue.path)).toContain(
      "annualConsumption",
    );
  }
});

it("does not substitute a different catalog when a pinned version is unavailable", async () => {
  const service = createComparisonService({
    db,
    now: () => new Date("2026-10-29T12:00:00Z"),
  });
  const result = await service.compare({
    profile: {
      schemaVersion: 1,
      supplyContext: {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      },
      commodity: "electricity",
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: "3000",
        unit: "kWh",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      electricity: {
        powerKw: "3",
        resident: true,
        bands: { F1: "1000", F2: "1000", F3: "1000" },
      },
      origin: "manual",
      confirmed: true,
      revision: 3,
    },
    versions: {
      catalog: "unavailable-version",
      references: "unavailable-version",
      parameters: "unavailable-version",
      scenario: "unavailable-version",
      method: "portal-v4.2-project-v1",
    },
  });
  expect(result).toMatchObject({
    status: "incomplete_data",
    reasons: ["catalog_unavailable"],
    profileRevision: 3,
  });
});

it("reports invalid preferences instead of silently treating them as consent", async () => {
  const service = createComparisonService({ db });
  const result = await service.compare({
    profile: {},
    preferences: {
      pricePreference: "cheapest",
      requirements: { direct_debit: true },
    },
  });
  expect(result.status).toBe("needs_input");
  if (result.status === "needs_input") {
    expect(result.issues.map((issue) => issue.path)).toContain(
      "preferences.requirements.direct_debit",
    );
  }
});

it("reports expiry independently for both commodities when the acquisition month changes", async () => {
  const service = createComparisonService({
    db,
    now: () => new Date("2026-11-02T12:00:00Z"),
  });
  const status = await service.getDataStatus();
  expect(status.electricity.scenario).toMatchObject({
    status: "incomplete_data",
    acquisitionMonth: "2026-11",
  });
  expect(status.gas.scenario).toMatchObject({
    status: "incomplete_data",
    acquisitionMonth: "2026-11",
  });
});

it("reads published versions, ranks the full fixture catalog and preserves them in the offer detail", async () => {
  // Controlled source fixture; the expected EUR 613.99 comes from the worked
  // statutory-tax example, not from the calculator under test.
  const at = new Date("2026-10-29T12:00:00Z");
  const original = readFileSync(
    "tests/catalog/fixtures/gas-official.xml",
    "utf8",
  );
  const fixedXml = original
    .replace("<ns0:TIPO_OFFERTA>02", "<ns0:TIPO_OFFERTA>01")
    .replace("<ns0:PREZZO>0.25", "<ns0:PREZZO>0.5")
    .replace("<ns0:PREZZO>144", "<ns0:PREZZO>120");
  const firstOffer = fixedXml.match(
    /<ns0:offerta>[\s\S]*?<\/ns0:offerta>/,
  )?.[0];
  if (!firstOffer) throw new Error("Official offer fixture is missing");
  const second = firstOffer
    .replace("001686GSVML00XXCG1026DO000000000", "TEST_GAS_ALTERNATIVE")
    .replace("<ns0:PREZZO>0.5", "<ns0:PREZZO>0.6");
  const xml = fixedXml.replace(
    "</ns0:ListaOfferteMercatoLibero>",
    `${second}</ns0:ListaOfferteMercatoLibero>`,
  );
  const csv = readFileSync(
    "docs/evidenze/fiscalita-gas-2026-10-29/PO_Parametri_Mercato_Libero_G_20261029.csv",
    "utf8",
  );
  const originals = new Map<string, string>();
  const catalog = createCatalogService({
    db,
    clock: () => at,
    source: {
      acquire: async () =>
        ["offers", "parameters"].map((kind) => ({
          kind: kind as "offers" | "parameters",
          body: kind === "offers" ? xml : csv,
          sourceDate: "2026-10-29",
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
        if (!body) throw new Error("missing fixture original");
        return body;
      },
    },
  });
  const publication = await catalog.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  const snapshot = gasSnapshot();
  if (!publication.versionId)
    throw new Error("Fixture catalog was not published");
  snapshot.catalogVersionId = publication.versionId;
  expect(
    (
      await createScenarioService(db, { now: () => at }).importSnapshot(
        snapshot,
      )
    ).status,
  ).toBe("published");
  const service = createComparisonService({ db, now: () => at });
  const input = {
    profile: {
      schemaVersion: 1,
      supplyContext: {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      },
      commodity: "gas",
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: "400",
        unit: "Smc",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      gas: { usage: "heating", meterClass: "G4" },
      origin: "manual",
      confirmed: true,
      revision: 4,
    },
    preferences: {
      pricePreference: "any",
      requirements: { "payment:01": "satisfied" },
    },
  };
  const result = await service.compare({
    ...input,
    page: { offset: 0, limit: 1 },
  });
  expect(result.status).toBe("ready");
  if (!("offers" in result)) throw new Error(JSON.stringify(result));
  expect(result.offers[0].annualCost).toBe("613.99");
  expect(result.offers[0].savings).toBeUndefined();
  expect(result.offers).toHaveLength(1);
  expect(result.coverage).toMatchObject({ complete: true, considered: 2 });
  expect(result.pagination).toMatchObject({
    eligibleTotal: 2,
    offset: 0,
    limit: 1,
  });
  const detail = await service.getOfferDetail({
    ...input,
    versions: result.versions,
    offerId: "01244170526:TEST_GAS_ALTERNATIVE",
  });
  expect(detail).toMatchObject({
    status: "ready",
    versions: result.versions,
    offer: { annualCost: "657.99" },
    profileRevision: 4,
  });
  const withCurrent = await service.compare({
    ...input,
    currentBillConditions: {
      confirmed: true,
      priceKind: "fixed",
      unitPrice: "0.7",
      fixedAnnualCharge: "120",
      validFrom: "2026-10-01",
      validTo: "2027-09-30",
      allCommercialChargesIncluded: true,
    },
  });
  expect(withCurrent).toMatchObject({
    status: "ready",
    currentContract: { status: "comparable", annualCost: "701.99" },
    recommendation: { kind: "switch" },
  });
  if ("offers" in withCurrent)
    expect(withCurrent.offers[0].savings).toBe("88.00");
  const withVariableCurrent = await service.compare({
    ...input,
    currentBillConditions: {
      confirmed: true,
      priceKind: "variable",
      index: "PSV",
      indexMultiplier: "1",
      spread: "0.1",
      // A past billed price is irrelevant once the future formula is known.
      unitPrice: "999",
      fixedAnnualCharge: "120",
      validFrom: "2026-10-01",
      validTo: "2027-09-30",
      allCommercialChargesIncluded: true,
    },
  });
  expect(withVariableCurrent).toMatchObject({
    status: "ready",
    currentContract: {
      status: "comparable",
      estimate: { offerType: "variable" },
    },
  });
  if (
    "offers" in withVariableCurrent &&
    withVariableCurrent.currentContract.status === "comparable"
  ) {
    expect(Number(withVariableCurrent.currentContract.annualCost)).toBeLessThan(
      2000,
    );
    expect(withVariableCurrent.offers[0].savings).toBeDefined();
  }
  const independent = await service.compareSupplies([
    input,
    { profile: { commodity: "electricity", confirmed: false } },
  ]);
  expect(independent.status).toBe("multi_supply");
  if (independent.status === "multi_supply") {
    expect(independent.results.map((entry) => entry.status)).toEqual([
      "ready",
      "needs_input",
    ]);
    expect(independent.summary.status).toBe("unavailable");
  }
});

let recommendationFixtureSequence = 0;
async function publishRecommendationFixture(
  suffix: string,
  expiry = "10/01/2027_23:59:59",
  includeVariable = false,
) {
  const at = new Date(
    Date.parse("2026-10-30T12:00:00Z") + recommendationFixtureSequence++ * 1000,
  );
  const original = readFileSync(
    "tests/catalog/fixtures/gas-official.xml",
    "utf8",
  );
  const fixed = original
    .replace("001686GSVML00XXCG1026DO000000000", `TEST_FIXED_${suffix}`)
    .replace("<ns0:TIPO_OFFERTA>02", "<ns0:TIPO_OFFERTA>01")
    .replace("<ns0:PREZZO>0.25", "<ns0:PREZZO>2")
    .replace("10/01/2027_23:59:59", expiry);
  const variable = includeVariable
    ? original
        .match(/<ns0:offerta>[\s\S]*?<\/ns0:offerta>/)?.[0]
        ?.replace("001686GSVML00XXCG1026DO000000000", `TEST_VARIABLE_${suffix}`)
        .replace("<ns0:PREZZO>0.25", "<ns0:PREZZO>0")
    : undefined;
  const xml = variable
    ? fixed.replace(
        "</ns0:ListaOfferteMercatoLibero>",
        `${variable}</ns0:ListaOfferteMercatoLibero>`,
      )
    : fixed;
  const csv = readFileSync(
    "docs/evidenze/fiscalita-gas-2026-10-29/PO_Parametri_Mercato_Libero_G_20261029.csv",
    "utf8",
  );
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
        if (!body) throw Error("Missing fixture");
        return body;
      },
    },
  });
  const publication = await catalog.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  if (!publication.versionId) throw Error(JSON.stringify(publication));
  const snapshot = gasSnapshot();
  snapshot.catalogVersionId = publication.versionId;
  snapshot.acquiredAt = at.toISOString();
  const imported = await createScenarioService(db, {
    now: () => at,
  }).importSnapshot(snapshot);
  expect(imported, JSON.stringify(imported)).toMatchObject({
    status: "published",
  });
  return {
    at,
    profile: {
      schemaVersion: 1,
      supplyContext: {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      },
      commodity: "gas",
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: "400",
        unit: "Smc",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      gas: { usage: "heating", meterClass: "G4" },
      origin: "manual",
      confirmed: true,
      revision: 1,
    },
  };
}

it("expires the complete comparison when an active offer expires, before catalog or scenario deadlines", async () => {
  const fixture = await publishRecommendationFixture(
    "EXPIRY",
    "30/10/2026_23:59:59",
  );
  const service = createComparisonService({ db, now: () => fixture.at });
  const result = await service.compare({
    profile: fixture.profile,
    preferences: {
      pricePreference: "any",
      requirements: { "payment:01": "satisfied" },
    },
  });
  expect(result.status).toBe("ready");
  if (!("validUntil" in result)) throw Error(JSON.stringify(result));
  // October 30 is CET: this offer ends at 22:59:59Z, ahead of both data deadlines.
  expect(result.validUntil).toBe("2026-10-30T22:59:59.000Z");
});

it("respects the fixed-price preference when all alternatives still have requirements to confirm", async () => {
  const fixture = await publishRecommendationFixture(
    "CONDITIONAL",
    undefined,
    true,
  );
  const service = createComparisonService({ db, now: () => fixture.at });
  const result = await service.compare({
    profile: fixture.profile,
    preferences: { pricePreference: "fixed", requirements: {} },
  });
  expect(result.status).toBe("no_eligible_offers");
  if (!("conditionalOffers" in result)) throw Error(JSON.stringify(result));
  // The cheaper variable offer stays in the full ranking, but the explicit
  // fixed preference must determine which conditional offer is recommended.
  expect(result.conditionalOffers.map((offer) => offer.offerType)).toEqual([
    "variable",
    "fixed",
  ]);
  expect(result.recommendation).toMatchObject({
    kind: "conditional",
    offerId: "01244170526:TEST_FIXED_CONDITIONAL",
  });
  expect(result.recommendedOffer?.offerType).toBe("fixed");
});
