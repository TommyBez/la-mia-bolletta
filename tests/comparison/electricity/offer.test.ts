import { readFileSync } from "node:fs";
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { validateProfile } from "../../../src/domain/profile";
import { normalizeOffers } from "../../../src/modules/catalog/normalize";
import type { CatalogRead } from "../../../src/modules/catalog/service";
import { parseParameters } from "../../../src/modules/catalog/source";
import type { OfferEstimate } from "../../../src/modules/comparison/contracts";
import { calculateElectricityOffer } from "../../../src/modules/comparison/electricity";
import { bundledReferences } from "../../../src/modules/references/registry";
import { scenarioSnapshotSchema } from "../../../src/modules/scenario";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
function amount(estimate: OfferEstimate, code: string) {
  const item = estimate.breakdown.find(
    (c) => c.code === code || c.category === code,
  );
  if (!item) throw new Error(`Missing output component ${code}`);
  return item.amount;
}
function context(name = "plenitude-20261029.xml") {
  const offer = normalizeOffers(fixture(name), "electricity").offers[0];
  const validation = validateProfile({
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
  if (validation.status !== "ready") throw new Error("Invalid test profile");
  const electricity = validation.profile.electricity;
  if (!electricity) throw new Error("Missing fixture electricity profile");
  const catalog: CatalogRead = {
    status: "ready",
    reasons: [],
    commodity: "electricity",
    versionId: "official-fixture-20261029",
    referenceVersionId: "official-fixture-refs",
    sourceDate: "2026-10-29",
    acquiredAt: "2026-10-29T12:00:00Z",
    offers: [offer],
    parameters: parseParameters(fixture("parameters-20261029.csv")),
    references: null,
    manifest: {},
    requiredAnnualFingerprints: [],
  };
  return {
    purpose: "alternative" as "alternative" | "current",
    profile: { ...validation.profile, electricity },
    preferences: { pricePreference: "any" as const, requirements: {} },
    offer,
    catalog,
    scenario: scenarioSnapshotSchema.parse(
      JSON.parse(fixture("scenario-20261029.json")),
    ),
  };
}
describe("electricity offer calculation through its public boundary", () => {
  it("applies the official unconditional 30% energy discount, excludes the conditional 5%, and calculates network and normative tax", () => {
    // Independent official price arithmetic: 2700*.2079+144=705.33; discount168.399.
    // Dispatch45.2952; network133.9674; charges89.5131; excise21.792; VAT82.74987.
    const result = calculateElectricityOffer(context());
    expect(result.status).toBe("calculated");
    if (result.status !== "calculated")
      throw new Error(result.reasons.join(","));
    expect(result.estimate.annualCost).toBe("910.25");
    expect(new Decimal(amount(result.estimate, "discount")).toFixed(3)).toBe(
      "-168.399",
    );
    expect(
      result.estimate.breakdown.find((c) => c.category === "excise")?.amount,
    ).toBe("21.792");
  });
});

it("calculates the qualified PUN quarterly scenario with losses on the index alone", () => {
  const input = context("special-20261029.xml");
  input.profile.annualConsumption.value = "3000";
  input.profile.electricity.bands = { F1: "1000", F2: "1000", F3: "1000" };
  const result = calculateElectricityOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(result.reasons.join(","));
  expect(new Decimal(amount(result.estimate, "sales")).toFixed(4)).toBe(
    "870.3525",
  );
  expect(result.estimate.annualCost).toBe("1257.97");
});

it("applies electricity consumption tiers progressively, using the default only outside specific intervals", () => {
  const input = context("iren-tiers-20261029.xml");
  input.profile.annualConsumption.value = "4500";
  input.profile.electricity.bands = { F1: "1485", F2: "1395", F3: "1620" };
  const result = calculateElectricityOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(result.reasons.join(","));
  // Official AU example:3000*.176+1500*.209=841.50; fixed147; dispatch75.492.
  expect(new Decimal(amount(result.estimate, "sales")).toFixed(3)).toBe(
    "1063.992",
  );
  expect(result.estimate.annualCost).toBe("1623.39");
  const reordered = structuredClone(input);
  reordered.offer.components[0].intervals.reverse();
  expect(calculateElectricityOffer(reordered)).toEqual(result);
});

it("uses the qualified annual Peak operator exactly once and includes the regulated network and taxes", () => {
  const input = context("peak-20261029.xml");
  input.profile.annualConsumption.value = "4000";
  input.profile.electricity.bands = { F1: "1234", F2: "987", F3: "1779" };
  input.scenario = scenarioSnapshotSchema.parse(
    JSON.parse(fixture("scenario-full-20261029.json")),
  );
  const result = calculateElectricityOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(result.reasons.join(","));
  expect(
    new Decimal(amount(result.estimate, "sales"))
      .minus("1139.78")
      .abs()
      .lte(".05"),
  ).toBe(true);
  expect(result.estimate.annualCost).toBe("1656.96");
});

it("uses each structured discount period and keeps text descriptions separate from calculation fields", () => {
  const result = calculateElectricityOffer(context("sprint-20261029.xml"));
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(result.reasons.join(","));
  // Periods:225*(.175+.145+.12+3*.1)=166.50; annual discount tiers:250+83.50+198=531.50.
  const discount = result.estimate.breakdown.find(
    (c) => c.category === "discount",
  );
  expect(new Decimal(discount?.amount ?? "NaN").toFixed(2)).toBe("-698.00");
});

it.each([
  ["regulated-20261029.xml", "1018.8745", "1421.35"],
  ["pd-20261029.xml", "836.3590", "1220.58"],
  ["pe-20261029.xml", "768.9970", "1146.48"],
])("uses effective official regulated prices and the qualified PE branch for %s", (name, sales, total) => {
  const input = context(name);
  input.profile.annualConsumption.value = "3000";
  input.profile.electricity.bands = { F1: "990", F2: "930", F3: "1080" };
  input.catalog.references = {
    ...bundledReferences(),
    regulatedRates: JSON.parse(fixture("regulated-rates-20261029.json")),
  };
  const result = calculateElectricityOffer({ ...input, purpose: "current" });
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(result.reasons.join(","));
  expect(new Decimal(amount(result.estimate, "sales")).toFixed(4)).toBe(sales);
  expect(result.estimate.annualCost).toBe(total);
});

it("matches all nine fixed offers whose energy component is marked optional against preregistered live official quotes", () => {
  const results = JSON.parse(
    readFileSync(
      new URL(
        "../../../scripts/scenario/evidence/optional-electricity-20261029/results.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).results as {
    offerCode: string;
    observedAnnualCost: string;
    observedSales: string;
  }[];
  expect(results).toHaveLength(9);
  results.forEach((observed, i) => {
    const input = context(`optional-${i}-20261029.xml`);
    input.purpose = "current";
    expect(input.offer.code).toBe(observed.offerCode);
    const result = calculateElectricityOffer(input);
    expect(result.status).toBe("calculated");
    if (result.status !== "calculated")
      throw new Error(result.reasons.join(","));
    expect(result.estimate.annualCost).toBe(observed.observedAnnualCost);
    expect(new Decimal(amount(result.estimate, "sales")).toFixed(2)).toBe(
      observed.observedSales,
    );
  });
});
