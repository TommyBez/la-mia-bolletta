import { readFileSync } from "node:fs";
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  calculateAnnualEffectiveSales,
  qualifyScenario,
} from "../../src/modules/scenario";

const input = () =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/live-electricity-20261029.json", import.meta.url),
      "utf8",
    ),
  );
describe("frozen live official monthly observations", () => {
  it("qualifies all 13 current economic fingerprints and preserves independently observed annual costs across physical profiles", () => {
    const qualified = qualifyScenario(input(), {
      now: new Date("2026-10-29T23:59:00Z"),
    });
    expect(qualified.status).toBe("qualified");
    if (qualified.status !== "qualified")
      throw new Error(qualified.reasons.join(","));
    expect(qualified.snapshot.annualSales).toHaveLength(13);
    for (const a of qualified.snapshot.annualSales) {
      for (const probe of a.holdouts) {
        const result = calculateAnnualEffectiveSales(qualified.snapshot, {
          fingerprint: a.fingerprint,
          f1: probe.f1,
          f2: probe.f2,
          f3: probe.f3,
          powerKw: probe.powerKw,
          resident: probe.resident,
        });
        const volume = new Decimal(probe.f1).plus(probe.f2).plus(probe.f3);
        if (volume.gt(a.domain.maxKwh)) {
          expect(result.status).toBe("incomplete_data");
          continue;
        }
        expect(result.status).toBe("ready");
        if (result.status === "ready")
          expect(
            new Decimal(result.sales)
              .minus(probe.observedSales)
              .abs()
              .lte(new Decimal(result.salesRoundingUncertainty).plus(".005")),
          ).toBe(true);
      }
    }
    const a = qualified.snapshot.annualSales.find(
      (a) => a.offerCode === "029878ESVFL03XX000002DOM2VAR2BIO",
    );
    expect(a?.holdouts[0].observedSales).toBe("1139.78");
  });
  it("blocks a corrupted independent holdout and a fingerprint newly required by the current catalog", () => {
    const corrupted = input();
    corrupted.annualSales[0].holdouts[0].observedSales = "1";
    const result = qualifyScenario(corrupted, {
      now: new Date("2026-10-29T23:59:00Z"),
    });
    expect(result.status).toBe("rejected");
    expect(result.reasons.join(",")).toContain("holdout mismatch");
    const changed = input();
    const required = [...changed.requiredAnnualFingerprints, "f".repeat(64)];
    const changedResult = qualifyScenario(changed, {
      now: new Date("2026-10-29T23:59:00Z"),
      requiredAnnualFingerprints: required,
    });
    expect(changedResult.status).toBe("rejected");
  });
});

it("uses the explicit official XML linearity proof for zero use and power independence, retaining empirical observations", () => {
  const candidate = input();
  const annual = candidate.annualSales.find(
    (a: { offerCode: string }) =>
      a.offerCode === "029878ESVFL03XX000002DOM2VAR2BIO",
  );
  annual.domain.minKwh = "0";
  annual.domain.powerIndependent = true;
  annual.structuralQualification = {
    method: "official-xml-linear-sales-v1",
    sourceEvidenceIndex: candidate.evidence.findIndex(
      (e: { kind: string }) => e.kind === "official_offer",
    ),
    economicFingerprint: annual.fingerprint,
    noConsumptionTiers: true,
    noPowerCharges: true,
    noPricePeriods: true,
    noApplicableDiscounts: true,
  };
  const qualified = qualifyScenario(candidate, {
    now: new Date("2026-10-29T23:59:00Z"),
  });
  expect(qualified.status).toBe("qualified");
  if (qualified.status !== "qualified")
    throw new Error(qualified.reasons.join(","));
  const result = calculateAnnualEffectiveSales(qualified.snapshot, {
    fingerprint: annual.fingerprint,
    f1: "0",
    f2: "0",
    f3: "0",
    powerKw: "1.5",
    resident: true,
  });
  expect(result.status).toBe("ready");
  if (result.status === "ready") expect(result.sales).toBe("143.99");
});
