import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  DOMESTIC_ANNUAL_REGULATED_PROFILES,
  qualifyScenario,
  resolveAnnualRegulatedRate,
} from "../../src/modules/scenario";

const snapshot = () =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/live-gas-ccr-20261030.json", import.meta.url),
      "utf8",
    ),
  );
it("qualifies all six domestic CCR profiles from four calibration observations and a preregistered independent municipality holdout", () => {
  const result = qualifyScenario(snapshot(), {
    now: new Date("2026-10-30T12:00:00Z"),
    requiredAnnualRegulatedProfiles: DOMESTIC_ANNUAL_REGULATED_PROFILES,
  });
  expect(result.status).toBe("qualified");
  if (result.status !== "qualified") throw new Error(result.reasons.join(","));
  expect(result.snapshot.annualRegulatedRates).toHaveLength(6);
  const c2 = resolveAnnualRegulatedRate(result.snapshot, {
    code: "CCR",
    profile: "C2",
  });
  expect(c2.status).toBe("ready");
  if (c2.status === "ready")
    expect(Number(c2.value)).toBeCloseTo(0.025152167343802, 14);
});
it("blocks missing domestic coverage and corrupted holdout observations without widening its measured uncertainty", () => {
  const missing = snapshot();
  missing.annualRegulatedRates.pop();
  expect(
    qualifyScenario(missing, {
      now: new Date("2026-10-30T12:00:00Z"),
      requiredAnnualRegulatedProfiles: DOMESTIC_ANNUAL_REGULATED_PROFILES,
    }).status,
  ).toBe("rejected");
  const corrupted = snapshot();
  corrupted.annualRegulatedRates[0].holdouts[0].observedSales = "1";
  const result = qualifyScenario(corrupted, {
    now: new Date("2026-10-30T12:00:00Z"),
    requiredAnnualRegulatedProfiles: DOMESTIC_ANNUAL_REGULATED_PROFILES,
  });
  expect(result.status).toBe("rejected");
  expect(result.reasons.join(",")).toContain("observation mismatch");
});
