import { expect, it } from "vitest";
import { candidateFromExtraction } from "../../src/modules/bill/candidates";

it("normalizes Italian document dates for review while retaining the source and rejecting impossible dates", () => {
  const [candidate] = candidateFromExtraction(
    {
      readability: "readable",
      supplies: [
        {
          commodity: "gas",
          warnings: [],
          fields: [
            {
              path: "annualConsumption.period.from",
              value: "01/12/2024",
              evidence: null,
            },
            {
              path: "annualConsumption.period.to",
              value: "30/11/2025",
              evidence: null,
            },
            {
              path: "contract.validUntil",
              value: "31/02/2027",
              evidence: null,
            },
          ],
        },
      ],
    },
    "date-regression",
  );
  expect(candidate.fields["annualConsumption.period.from"]).toMatchObject({
    value: "2024-12-01",
    originalValues: ["01/12/2024"],
    state: "present",
  });
  expect(candidate.fields["annualConsumption.period.to"].value).toBe(
    "2025-11-30",
  );
  expect(candidate.fields["contract.validUntil"]).toMatchObject({
    value: null,
    state: "invalid",
  });
  expect(candidate.confirmed).toBe(false);
});

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
