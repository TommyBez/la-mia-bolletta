import { expect, it } from "vitest";
import { qualifyOcrCorpus } from "../../src/modules/bill/qualification";

it("does not qualify synthetic or incomplete corpora, even with perfect field matches", () => {
  const report = qualifyOcrCorpus([
    {
      id: "synthetic",
      format: "pdf_native",
      vendor: "fixture",
      synthetic: true,
      expected: { "electricity.annualConsumption.value": "3000" },
      actual: { "electricity.annualConsumption.value": "3000" },
      durationMs: 100,
      costUsd: "0.001",
      dual: false,
      pages: 1,
      priceKinds: ["fixed"],
    },
  ]);
  expect(report.qualified).toBe(false);
  expect(report.reasons).toContain(
    "Occorrono almeno 30 bollette reali autorizzate.",
  );
  expect(report.counts.correct).toBe(1);
});
