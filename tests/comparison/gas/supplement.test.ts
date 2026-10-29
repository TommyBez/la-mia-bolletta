import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { gasSaleSupplementSchema } from "../../../src/modules/comparison/gas/supplement";
import {
  parseGasSaleQuote,
  parseGasTaxQuote,
} from "../../../src/modules/comparison/gas/supplement-acquisition";

it("reads the published aggregate unit price without confusing it with the XML's optional margin", () => {
  const quote = parseGasSaleQuote(
    readFileSync(
      "tests/comparison/gas/fixtures/missing-base-top-20261029.html.txt",
      "utf8",
    ),
  );
  expect(quote).toMatchObject({
    fixedAnnual: "138",
    unitRate: "0.905",
    observedSales: "1224",
  });
});
it("keeps gross unit prices separate from the published sales discount", () => {
  const quote = parseGasSaleQuote(
    readFileSync(
      "tests/comparison/gas/fixtures/tier-discount-20261029.html.txt",
      "utf8",
    ),
  );
  expect(quote).toMatchObject({
    fixedAnnual: "96",
    unitRate: "0.78",
    observedSales: "979.14",
  });
});

it("rejects a tampered supplemental price even when the JSON fields are individually well formed", () => {
  const qualified = JSON.parse(
    readFileSync(
      "tests/comparison/gas/fixtures/top-sale-supplement.json",
      "utf8",
    ),
  );
  expect(gasSaleSupplementSchema.safeParse(qualified).success).toBe(true);
  qualified.additionalUnitRate = "0";
  expect(gasSaleSupplementSchema.safeParse(qualified).success).toBe(false);
});

it("rejects a supplement whose published holdout subtotal does not reproduce its unit prices", () => {
  const qualified = JSON.parse(
    readFileSync(
      "tests/comparison/gas/fixtures/top-sale-supplement.json",
      "utf8",
    ),
  );
  qualified.evidence[2].observedSales = "1";
  expect(gasSaleSupplementSchema.safeParse(qualified).success).toBe(false);
});

it("preserves the daily source binding and rejects a partial binding", () => {
  const qualified = JSON.parse(
    readFileSync(
      "tests/comparison/gas/fixtures/top-sale-supplement.json",
      "utf8",
    ),
  );
  qualified.sourceDate = "2026-10-29";
  qualified.catalogSourceSha256 = "a".repeat(64);
  const parsed = gasSaleSupplementSchema.parse(qualified);
  expect(parsed).toHaveProperty("sourceDate", "2026-10-29");
  expect(parsed).toHaveProperty("catalogSourceSha256", "a".repeat(64));
  delete qualified.catalogSourceSha256;
  expect(gasSaleSupplementSchema.safeParse(qualified).success).toBe(false);
});

it("requires genuinely distinct numeric volumes rather than different decimal spellings", () => {
  const qualified = JSON.parse(
    readFileSync(
      "tests/comparison/gas/fixtures/top-sale-supplement.json",
      "utf8",
    ),
  );
  qualified.evidence[2].volume = "0600";
  qualified.evidence[2].observedSales = "681";
  expect(gasSaleSupplementSchema.safeParse(qualified).success).toBe(false);
});

it("reads VAT and the annual total from official aggregate rows, excluding repeated unit-price details", () => {
  const quote = parseGasTaxQuote(
    readFileSync(
      "tests/comparison/gas/fixtures/ccr-c1f-failed-20261029.html.txt",
      "utf8",
    ),
  );
  expect(quote).toEqual({
    annualTotal: "2419.63",
    vat10: "75.57",
    vat22: "286.43",
  });
});
