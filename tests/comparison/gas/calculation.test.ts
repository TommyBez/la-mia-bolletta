import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Decimal from "decimal.js";
import { expect, it } from "vitest";
import { validateProfile } from "../../../src/domain/profile";
import { normalizeOffers } from "../../../src/modules/catalog/normalize";
import { parseParameters } from "../../../src/modules/catalog/source";
import type { OfferCalculationInput } from "../../../src/modules/comparison/contracts";
import { calculateGasOffer } from "../../../src/modules/comparison/gas";
import { annualGasRegulatedBaseline } from "../../../src/modules/comparison/gas/annual-regulated";
import { selectAnnualGasRegulatedProbes } from "../../../src/modules/comparison/gas/annual-regulated-acquisition";
import { bundledReferences } from "../../../src/modules/references/registry";
import { scenarioSnapshotSchema } from "../../../src/modules/scenario";

const xml = readFileSync("tests/catalog/fixtures/gas-official.xml", "utf8");
const parameters = parseParameters(
  readFileSync(
    "docs/evidenze/fiscalita-gas-2026-10-29/PO_Parametri_Mercato_Libero_G_20261029.csv",
    "utf8",
  ),
);
export function fixtureInput(consumption = "400"): OfferCalculationInput {
  const validation = validateProfile({
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "gas",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: consumption,
      unit: "Smc",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    gas: { usage: "heating", meterClass: "G4" },
    origin: "manual",
    confirmed: true,
  });
  if (validation.status !== "ready") throw new Error("fixture_profile");
  const offer = normalizeOffers(xml, "gas").offers[0];
  offer.offerType = "fixed";
  offer.components = offer.components.map((c) => ({
    ...c,
    intervals: c.intervals.map((i) => ({
      ...i,
      price: c.macroarea === "04" ? "0.5" : "120",
      source: {
        PREZZO: c.macroarea === "04" ? "0.5" : "120",
        UNITA_MISURA: i.unit ?? "",
      },
    })),
  }));
  return {
    profile: validation.profile,
    preferences: { pricePreference: "any", requirements: {} },
    offer,
    catalog: {
      status: "ready",
      reasons: [],
      commodity: "gas",
      versionId: "fixture-catalog",
      referenceVersionId: "fixture-references",
      sourceDate: "2026-10-29",
      acquiredAt: "2026-10-29T12:00:00Z",
      offers: [offer],
      parameters,
      references: {
        ...bundledReferences(),
        regulatedRates: JSON.parse(
          readFileSync(
            "tests/comparison/gas/fixtures/regulated-rates.json",
            "utf8",
          ),
        ),
        gasProfiles: JSON.parse(
          readFileSync(
            "tests/comparison/gas/fixtures/gas-profiles.json",
            "utf8",
          ),
        ).profiles,
      },
      manifest: {},
      requiredAnnualFingerprints: [],
    },
    scenario: scenarioSnapshotSchema.parse(
      JSON.parse(
        readFileSync("tests/comparison/gas/fixtures/scenario.json", "utf8"),
      ),
    ),
  };
}
it("calculates a fixed domestic gas offer with progressive network/taxes and statutory VAT", () => {
  const result = calculateGasOffer(fixtureInput());
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") throw new Error(JSON.stringify(result));
  expect(result.estimate.annualCost).toBe("613.99");
  expect(
    result.estimate.breakdown.find((c) => c.category === "excise")?.amount,
  ).toBe("51.15");
  expect(
    result.estimate.breakdown.find((c) => c.category === "vat")?.amount,
  ).toBe("73.94");
});

it("uses the qualified monthly domestic profile and one PSV index, not one index per component", () => {
  const input = fixtureInput();
  input.offer = normalizeOffers(xml, "gas").offers[0];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(
      result.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe("610.45");
});

it("selects the minimum specific commercial interval at the monthly midpoint, independently of XML order", () => {
  const input = fixtureInput("1500");
  input.offer.offerType = "variable";
  input.scenario.coefficients = input.scenario.coefficients.map((c) => ({
    ...c,
    value: "0",
  }));
  const component = input.offer.components.find((c) => c.macroarea === "04");
  if (!component) throw new Error("fixture energy");
  component.intervals = [
    { price: "0.2", unit: "04", source: { PREZZO: "0.2", UNITA_MISURA: "04" } },
    {
      price: "0",
      unit: "04",
      source: {
        PREZZO: "0",
        UNITA_MISURA: "04",
        CONSUMO_DA: "0",
        CONSUMO_A: "1000",
      },
    },
    {
      price: "0.05",
      unit: "04",
      source: {
        PREZZO: "0.05",
        UNITA_MISURA: "04",
        CONSUMO_DA: "501",
        CONSUMO_A: "1000",
      },
    },
    {
      price: "0.1",
      unit: "04",
      source: { PREZZO: "0.1", UNITA_MISURA: "04", CONSUMO_DA: "1001" },
    },
  ];
  const first = calculateGasOffer(input);
  expect(first.status).toBe("calculated");
  if (first.status === "calculated")
    expect(
      first.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe("178.71");
  component.intervals.reverse();
  expect(calculateGasOffer(input)).toEqual(first);
});
it("prefers the variable formula when raw fixed and variable prices tie, then uses statutory VAT", () => {
  const input = fixtureInput();
  input.offer.offerType = "mixed";
  const component = input.offer.components.find((c) => c.macroarea === "04");
  if (!component) throw new Error("fixture energy");
  component.intervals = [
    {
      price: "0.08",
      unit: "04",
      source: { PREZZO: "0.08", UNITA_MISURA: "04", TIPO_PREZZO: "01" },
    },
    {
      price: "0.08",
      unit: "04",
      source: { PREZZO: "0.08", UNITA_MISURA: "04", TIPO_PREZZO: "02" },
    },
  ];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated") {
    expect(
      result.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe("518.45");
    expect(
      result.estimate.breakdown.find((c) => c.category === "vat")?.amount,
    ).toBe("93.79");
  }
});

it("adds qualified regulated gas components with quarterly CCR and does not convert EUR/Smc again", () => {
  const input = fixtureInput();
  input.offer.sourceRecord.ComponentiRegolate = {
    CODICE: ["03", "04", "05", "06", "07", "09", "10"],
  };
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(
      result.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe("388.71");
});

it("applies only unconditional discounts to the headline with correct before/after VAT treatment", () => {
  const input = fixtureInput();
  input.offer.sourceRecord.Sconto = [
    {
      NOME: "Sconto consumi",
      VALIDITA: "02",
      IVA_SCONTO: "01",
      Condizione: { CONDIZIONE_APPLICAZIONE: "00" },
      PrezziSconto: { TIPOLOGIA: "03", UNITA_MISURA: "04", PREZZO: "0.01" },
    },
    {
      NOME: "Bonus netto",
      VALIDITA: "01",
      IVA_SCONTO: "02",
      Condizione: { CONDIZIONE_APPLICAZIONE: "00" },
      PrezziSconto: { TIPOLOGIA: "01", UNITA_MISURA: "05", PREZZO: "24" },
    },
    {
      NOME: "Bonus amico",
      VALIDITA: "01",
      IVA_SCONTO: "01",
      Condizione: { CONDIZIONE_APPLICAZIONE: "99" },
      PrezziSconto: { TIPOLOGIA: "01", UNITA_MISURA: "05", PREZZO: "999" },
    },
  ];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated") {
    expect(result.estimate.annualCost).toBe("585.59");
    expect(
      result.estimate.conditions.some(
        (c) => c.includes("Bonus amico") && c.includes("escluso"),
      ),
    ).toBe(true);
  }
});

it("handles first-month duration versus the default and rejects uncovered thermal-year months", () => {
  const input = fixtureInput();
  const fixed = input.offer.components.find((c) => c.macroarea === "01");
  if (!fixed) throw new Error("fixture fixed");
  fixed.intervals = [
    { price: "240", unit: "01", source: { PREZZO: "240", UNITA_MISURA: "01" } },
    {
      price: "120",
      unit: "01",
      source: {
        PREZZO: "120",
        UNITA_MISURA: "01",
        PeriodoValidita: { DURATA: "7" },
      },
    },
  ];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(result.estimate.annualCost).toBe("674.99");
  input.scenario.coverageStart = "2027-01-01";
  input.scenario.coverageEnd = "2027-12-31";
  expect(calculateGasOffer(input)).toMatchObject({
    status: "incomplete_data",
    reasons: ["Profilo gas ufficiale non copre 2027-10."],
  });
});
it("keeps territorial exclusions separate from missing tax observations and missing regulated data", () => {
  const input = fixtureInput();
  input.offer.sourceRecord.ZoneOfferta = { REGIONE: "03" };
  expect(calculateGasOffer(input).status).toBe("ineligible");
  delete input.offer.sourceRecord.ZoneOfferta;
  if (!input.catalog.references) throw new Error("fixture references");
  input.catalog.references.gasObservations = [];
  expect(calculateGasOffer(input).status).toBe("incomplete_data");
});

const observedTaxes = JSON.parse(
  readFileSync(
    "docs/evidenze/fiscalita-gas-2026-10-29/tax-matrix-observed.json",
    "utf8",
  ),
) as { rows: { istat: string; town: string; tax4000_observed_eur: string }[] };
it.each(
  observedTaxes.rows,
)("matches the independently observed progressive taxes for $town ($istat)", (row) => {
  const input = fixtureInput("4000");
  input.profile.municipality = { portalCode: row.istat, name: row.town };
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(
      result.estimate.breakdown.find((c) => c.category === "excise")?.amount,
    ).toBe(row.tax4000_observed_eur);
});
it.each([
  ["120", "6.84"],
  ["480", "63.81"],
  ["1560", "221.30"],
  ["1561", "221.47"],
])("uses exact progressive tax portions at %s Smc", (volume, expected) => {
  const result = calculateGasOffer(fixtureInput(volume));
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(
      result.estimate.breakdown.find((c) => c.category === "excise")?.amount,
    ).toBe(expected);
});

it("applies a tutela percentage to PSV plus CCR, keeping the supplier's separate spread outside that official basis", () => {
  const input = fixtureInput("400");
  input.offer.offerType = "variable";
  input.offer.sourceRecord.RiferimentiPrezzoEnergia = {
    IDX_PREZZO_ENERGIA: "14",
  };
  input.offer.sourceRecord.ComponentiRegolate = { CODICE: ["03"] };
  const before = calculateGasOffer(input);
  if (before.status !== "calculated") throw new Error("fixture quote");
  input.offer.sourceRecord.Sconto = {
    NOME: "Sconto tutela 10%",
    Condizione: { CONDIZIONE_APPLICAZIONE: "00" },
    VALIDITA: "01",
    IVA_SCONTO: "01",
    PrezziSconto: { TIPOLOGIA: "04", UNITA_MISURA: "06", PREZZO: "10" },
  };
  const result = calculateGasOffer(input);
  const fullSales = before.estimate.breakdown.find(
    (c) => c.code === "gas.sales",
  )?.amount;
  if (result.status !== "calculated" || !fullSales)
    throw new Error("fixture quote");
  const expected = new Decimal(fullSales)
    .minus("120")
    .minus(new Decimal("0.5").mul("400"))
    .mul("0.1")
    .neg()
    .toFixed(2);
  expect(
    result.estimate.breakdown.find((c) => c.code === "gas.discount.0")?.amount,
  ).toBe(expected);
});
it.each([
  ["G4", "613.99"],
  ["G10", "1118.85"],
  ["G65", "1741.81"],
])("applies the explicit meter group for %s", (meter, expected) => {
  const input = fixtureInput();
  if (!input.profile.gas) throw new Error("fixture gas");
  input.profile.gas.meterClass = meter;
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(result.estimate.annualCost).toBe(expected);
});

it("does not publish an apparently complete price for a newly appearing unqualified all-inclusive family", () => {
  const input = fixtureInput();
  const details = input.offer.sourceRecord.DettaglioOfferta as Record<
    string,
    string
  >;
  details.OFFERTA_ONNICOMPRENSIVA = "02";
  details.CONSUMO_CANONE = "400";
  expect(calculateGasOffer(input)).toMatchObject({ status: "incomplete_data" });
});

it.each([
  ["cooking_hot_water", "C2", "1473.35"],
  ["technology", "T1", "1439.96"],
])("uses the official %s profile rather than the heating profile", (usage, _label, expected) => {
  const input = fixtureInput("1200");
  if (!input.profile.gas) throw new Error("fixture gas");
  input.profile.gas.usage = usage as "cooking_hot_water" | "technology";
  input.offer = normalizeOffers(xml, "gas").offers[0];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(
      result.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe(expected);
});

const currentCases = normalizeOffers(
  readFileSync("tests/comparison/gas/fixtures/current-cases.xml", "utf8"),
  "gas",
).offers;
const officialObservations = JSON.parse(
  readFileSync(
    "tests/comparison/gas/fixtures/portal-observations.json",
    "utf8",
  ),
) as {
  observations: {
    offerCode: string;
    file: string;
    sha256: string;
    sales: string;
    network: string;
    charges: string;
    excise: string;
    expectedNormativeTotal: string;
    beforeVatDiscountCodes?: string[];
    usage?: "cooking_hot_water";
  }[];
};
it.each(
  officialObservations.observations,
)("matches current official quote and preserves the normative VAT policy for $offerCode", (observation) => {
  const input = fixtureInput("1200");
  const offer = currentCases.find((o) => o.code === observation.offerCode);
  if (!offer) throw new Error("Missing frozen official offer");
  input.offer = offer;
  if (observation.usage && input.profile.gas)
    input.profile.gas.usage = observation.usage;
  expect(
    createHash("sha256")
      .update(readFileSync(`tests/comparison/gas/fixtures/${observation.file}`))
      .digest("hex"),
  ).toBe(observation.sha256);
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status !== "calculated") return;
  expect(result.estimate.annualCost).toBe(observation.expectedNormativeTotal);
  for (const category of ["network", "charges", "excise"] as const)
    expect(
      result.estimate.breakdown.find((c) => c.category === category)?.amount,
    ).toBe(observation[category]);
  const sales = result.estimate.breakdown.find((c) => c.code === "gas.sales");
  if (!sales) throw new Error("Missing sale");
  // Forecast intervals are inferred from rounded Portal outputs: max coefficient
  // uncertainty * consumption, plus half a cent for each displayed observation.
  const maxUncertainty = Decimal.max(
    ...input.scenario.coefficients.map((c) => c.uncertainty),
  );
  const allowed = maxUncertainty.mul("1200").plus("0.01");
  expect(
    new Decimal(sales.amount)
      .plus(
        result.estimate.breakdown
          .filter((c) => observation.beforeVatDiscountCodes?.includes(c.code))
          .reduce((sum, c) => sum.plus(c.amount), new Decimal(0)),
      )
      .minus(observation.sales)
      .abs()
      .lte(allowed),
  ).toBe(true);
});

it("blocks the incomplete fixed-price export until a separately qualified official unit-price supplement is available", () => {
  const input = fixtureInput("1200");
  const offer = currentCases.find(
    (o) => o.code === "022119GSFML01XXPFIXGASVDOM088RID",
  );
  if (!offer || !input.catalog.references) throw new Error("fixture");
  input.offer = offer;
  input.catalog.references.offerSalesSupplements = [];
  expect(calculateGasOffer(input)).toMatchObject({ status: "incomplete_data" });
  input.catalog.references.offerSalesSupplements = [
    JSON.parse(
      readFileSync(
        "tests/comparison/gas/fixtures/top-sale-supplement.json",
        "utf8",
      ),
    ),
  ];
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated") {
    expect(result.estimate.annualCost).toBe("2152.41");
    expect(
      result.estimate.breakdown.find((c) => c.code === "gas.sales")?.amount,
    ).toBe("1224.00");
  }
});

it("isolates a CCR calibration from PSV, spread, fixed charges and QVD without rounding the baseline", () => {
  const input = fixtureInput("1200");
  const offer = currentCases.find(
    (o) => o.code === "020237GSVML01XX0FLEXHOMEGASLIGHT",
  );
  if (!offer || !input.profile.gas) throw new Error("fixture");
  input.offer = offer;
  input.profile.gas.usage = "cooking_hot_water";
  const baseline = annualGasRegulatedBaseline(input);
  expect(baseline.profile).toBe("C2");
  expect(new Decimal(baseline.baselineSales).toFixed(4)).toBe("1410.8850");
  expect(
    new Decimal(baseline.baselineSales).eq(
      new Decimal(baseline.baselineSales).toFixed(2),
    ),
  ).toBe(false);
  expect(new Decimal(baseline.baselineUncertainty).toFixed(6)).toBe("0.005000");
  expect(baseline.terms).toHaveLength(4);
  expect(JSON.stringify(input.offer.sourceRecord.ComponentiRegolate)).toContain(
    '"03"',
  );
});

it("refuses to infer CCR from an offer with applicable sales discounts", () => {
  const input = fixtureInput("1200");
  const offer = currentCases.find(
    (o) => o.code === "020237GSVML01XX0FLEXHOMEGASLIGHT",
  );
  if (!offer) throw new Error("fixture");
  input.offer = structuredClone(offer);
  input.offer.sourceRecord.Sconto = {
    Condizione: { CONDIZIONE_APPLICAZIONE: "00" },
    VALIDITA: "01",
    PrezziSconto: { TIPOLOGIA: "01", PREZZO: "10" },
  };
  expect(() => annualGasRegulatedBaseline(input)).toThrow(
    "linear PSV protocol",
  );
});

it("uses a separate declared control mode to check PSV drift with a CCR-free offer", () => {
  const input = fixtureInput("1200");
  const offer = currentCases.find(
    (o) => o.code === "000971GSVML01XXPROD1300109202600",
  );
  if (!offer || !input.profile.gas) throw new Error("fixture");
  input.offer = offer;
  input.profile.gas.usage = "cooking_hot_water";
  expect(() => annualGasRegulatedBaseline(input)).toThrow(
    "does not declare CCR",
  );
  const control = annualGasRegulatedBaseline(input, { requireCcr: false });
  expect(new Decimal(control.baselineSales).toFixed(2)).toBe("1203.35");
});

it("discovers monthly CCR recipes after offer identities change and still requires independent suppliers", () => {
  const input = fixtureInput("1200");
  const original = currentCases.find(
    (o) => o.code === "020237GSVML01XX0FLEXHOMEGASLIGHT",
  );
  const control = currentCases.find(
    (o) => o.code === "000971GSVML01XXPROD1300109202600",
  );
  if (!original || !control) throw new Error("fixture");
  const a = structuredClone(original),
    duplicateSupplier = structuredClone(original),
    b = structuredClone(original),
    newControl = structuredClone(control);
  a.code = "NEXT_MONTH_CCR_A";
  duplicateSupplier.code = "NEXT_MONTH_CCR_A_DUPLICATE";
  b.code = "NEXT_MONTH_CCR_B";
  b.supplierVat = "99999999999";
  newControl.code = "NEXT_MONTH_NO_CCR";
  delete newControl.sourceRecord.ZoneOfferta;
  input.catalog.offers = [a, duplicateSupplier, b, newControl];
  const selected = selectAnnualGasRegulatedProbes(
    input.catalog,
    input.scenario,
    new Date("2026-10-30T00:00:00Z"),
  );
  expect(selected.offerCodes).toEqual([a.code, b.code]);
  expect(selected.controlOfferCode).toBe(newControl.code);
});

it("suspends a conventional CCR quote when its implicit annual profile coefficient is absent", () => {
  const input = fixtureInput();
  input.offer.sourceRecord.ComponentiRegolate = { CODICE: ["03"] };
  delete input.scenario.annualRegulatedRates;
  expect(calculateGasOffer(input)).toMatchObject({ status: "incomplete_data" });
});

it.each([
  {
    municipality: { portalCode: "068028", name: "Pescara" },
    usage: "cooking_hot_water" as const,
    total: "1274.46",
  },
  {
    municipality: { portalCode: "001003", name: "Ala di Stura" },
    usage: "heating" as const,
    total: "1338.53",
  },
])("keeps quarterly CCR allocation for VAT while using the qualified annual sales coefficient in $municipality.name/$usage", ({
  municipality,
  usage,
  total,
}) => {
  const input = fixtureInput("600");
  const offer = currentCases.find(
    (o) => o.code === "020237GSVML01XX0FLEXHOMEGASLIGHT",
  );
  if (!offer || !input.profile.gas) throw new Error("fixture");
  input.offer = offer;
  input.profile.municipality = municipality;
  input.profile.gas.usage = usage;
  const result = calculateGasOffer(input);
  expect(result.status).toBe("calculated");
  if (result.status === "calculated")
    expect(result.estimate.annualCost).toBe(total);
});
