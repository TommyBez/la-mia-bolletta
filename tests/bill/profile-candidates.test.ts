import { expect, it } from "vitest";
import { candidateFromExtraction } from "../../src/modules/bill/candidates";

it("separates dual supplies, retains missing fields and never attests confirmation", () => {
  const extraction = {
    readability: "partial" as const,
    supplies: [
      {
        commodity: "electricity" as const,
        fields: [
          {
            path: "annualConsumption.value" as const,
            value: "3000",
            evidence: {
              fileId: "file-1",
              page: 1,
              excerpt: "Consumo annuo 3000 kWh",
            },
          },
        ],
        warnings: [],
      },
      {
        commodity: "gas" as const,
        fields: [
          {
            path: "annualConsumption.value" as const,
            value: null,
            evidence: null,
          },
        ],
        warnings: ["Annuale non leggibile"],
      },
    ],
  };
  const profiles = candidateFromExtraction(extraction, "job-1");
  expect(profiles).toHaveLength(2);
  expect(profiles[0]).toMatchObject({
    commodity: "electricity",
    confirmed: false,
    fields: {
      "annualConsumption.value": {
        state: "present",
        value: "3000",
        origin: "document",
        documentId: "job-1",
        fileId: "file-1",
        page: 1,
      },
    },
  });
  expect(profiles[1].fields["annualConsumption.value"].state).toBe("missing");
});
