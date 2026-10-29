import { expect, it } from "vitest";
import {
  BillExtractionSchema,
  estimateOcrCost,
} from "../../src/modules/bill/extraction";

it("keeps unreadable annual data missing instead of converting billed consumption", () => {
  expect(
    BillExtractionSchema.parse({
      supplies: [
        {
          commodity: "gas",
          fields: [
            { path: "annualConsumption.value", value: null, evidence: null },
          ],
          warnings: ["Solo consumo bimestrale leggibile"],
        },
      ],
      readability: "partial",
    }).supplies[0].fields[0].value,
  ).toBeNull();
});
it("cost monitoring changes with published dated tariffs and includes output tokens", () => {
  expect(estimateOcrCost(10000, 2000, new Date("2026-10-29"))).toBe("0.015");
  expect(estimateOcrCost(10000, 2000, new Date("2027-01-01"))).toBe("0.03");
});
