import { describe, expect, it } from "vitest";
import { qualifyScenario, scenarioWindow } from "../../src/modules/scenario";
import { gasSnapshot } from "./support";

describe("manual scenario qualification", () => {
  it("qualifies the official gas observations and rejects a changed independent holdout", () => {
    const input = gasSnapshot();
    expect(
      qualifyScenario(input, { now: new Date("2026-10-29T12:00:00Z") }).status,
    ).toBe("qualified");
    input.holdouts[0].observedSales = "980.15";
    const invalid = qualifyScenario(input, {
      now: new Date("2026-10-29T12:00:00Z"),
    });
    expect(invalid.status).toBe("rejected");
    expect(invalid.reasons.join(" ")).toContain("holdout");
  });
});

describe("catalog binding", () => {
  it("rejects a manifest that hides its declared Peak requirements from the current catalog context", () => {
    const input = gasSnapshot();
    input.requiredAnnualFingerprints.push("a".repeat(64));
    const result = qualifyScenario(input, {
      now: new Date("2026-10-29T12:00:00Z"),
      requiredAnnualFingerprints: [],
    });
    expect(result.status).toBe("rejected");
  });
});

it("expires the previous month at midnight in Italy, even when the server still has the preceding UTC date", () => {
  const result = qualifyScenario(gasSnapshot(), {
    now: new Date("2026-10-31T23:30:00Z"),
  });
  expect(result.status).toBe("rejected");
  expect(result.reasons.join(",")).toContain("month");
});

it("uses the Italian calendar year and quarter when UTC is still in the previous year", () => {
  const window = scenarioWindow(new Date("2026-12-31T23:30:00Z"));
  expect(window.acquisitionMonth).toBe("2027-01");
  expect(window.quarters).toEqual(["2027-Q1", "2027-Q2", "2027-Q3", "2027-Q4"]);
});
