import { describe, expect, it } from "vitest";
import { validateProfile } from "../../src/domain/profile";

describe("confirmed consumption profile", () => {
  it("accepts explicit annual electricity data after user confirmation", () => {
    const result = validateProfile({
      schemaVersion: 1,
      supplyContext: {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      },
      commodity: "electricity",
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: "3000",
        unit: "kWh",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      electricity: {
        powerKw: "3",
        resident: true,
        bands: { F1: "1000", F2: "1000", F3: "1000" },
      },
      origin: "manual",
      confirmed: true,
    });
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.profile.annualConsumption.value).toBe("3000");
      expect(result.profile.commodity).toBe("electricity");
      expect(result.profile.provenance["annualConsumption.value"].origin).toBe(
        "manual",
      );
    }
  });
});

it("does not admit the technological-use category from the non-domestic Portal flow", () => {
  const result = validateProfile({
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "gas",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "400",
      unit: "Smc",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    gas: { usage: "technology", meterClass: "G4" },
    origin: "client_mcp",
    confirmed: true,
  });
  expect(result.status).toBe("needs_input");
  if (result.status === "needs_input")
    expect(result.issues.map((issue) => issue.path)).toContain("gas.usage");
});

it("does not confirm a candidate on behalf of the user", () => {
  const candidate = {
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "gas",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "1000",
      unit: "Smc",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    gas: { usage: "heating", meterClass: "G4" },
    origin: "manual",
    confirmed: false,
  };
  expect(validateProfile(candidate)).toMatchObject({
    status: "needs_input",
    issues: [{ path: "confirmed" }],
  });
});

it("rejects a billed period and cubic metres instead of silently annualising or converting", () => {
  const result = validateProfile({
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "gas",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "1000",
      unit: "m3",
      kind: "measured",
      period: { from: "2026-08-01", to: "2026-09-30" },
    },
    gas: { usage: "heating", meterClass: "G4" },
    origin: "document",
    confirmed: true,
  });
  expect(result.status).toBe("needs_input");
  if (result.status === "needs_input")
    expect(result.issues.map((i) => i.path)).toEqual(
      expect.arrayContaining([
        "annualConsumption.period",
        "annualConsumption.unit",
      ]),
    );
});

it("applies the official conventional bands only with explicit consent", () => {
  const candidate = {
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "electricity",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "3000",
      unit: "kWh",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    electricity: { powerKw: "3", resident: true, useConventionalBands: true },
    origin: "manual",
    confirmed: true,
  };
  const result = validateProfile(candidate);
  expect(result.status).toBe("ready");
  if (result.status === "ready") {
    expect(result.profile.electricity?.bands).toEqual({
      F1: "990",
      F2: "930",
      F3: "1080",
    });
    expect(result.profile.assumptions[0].code).toBe("official-domestic-bands");
  }
});

it("requires an explicit confirmation of active domestic supply and same holder switching", () => {
  expect(
    validateProfile({
      schemaVersion: 1,
      commodity: "gas",
      municipality: { portalCode: "068028", name: "Pescara" },
      annualConsumption: {
        value: "1000",
        unit: "Smc",
        kind: "declared",
        period: { from: "2025-10-01", to: "2026-09-30" },
      },
      gas: { usage: "heating", meterClass: "G4" },
      origin: "manual",
      confirmed: true,
    }),
  ).toMatchObject({ status: "needs_input" });
});

it("preserves an explicitly confirmed conventional profile across web and MCP validation", () => {
  const candidate = {
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "electricity",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "3000",
      unit: "kWh",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    electricity: { powerKw: "3", resident: true, useConventionalBands: true },
    origin: "manual",
    confirmed: true,
  };
  const first = validateProfile(candidate);
  if (first.status !== "ready") throw new Error("fixture");
  expect(validateProfile(first.profile)).toEqual(first);
  expect(
    validateProfile({
      ...candidate,
      electricity: {
        ...candidate.electricity,
        bands: { F1: "1000", F2: "1000", F3: "1000" },
      },
    }),
  ).toMatchObject({ status: "needs_input" });
});

it("blocks inconsistent electricity totals, missing residence and unnormalised gas", () => {
  const candidate = {
    schemaVersion: 1,
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    commodity: "electricity",
    municipality: { portalCode: "068028", name: "Pescara" },
    annualConsumption: {
      value: "3000",
      unit: "kWh",
      kind: "declared",
      period: { from: "2025-10-01", to: "2026-09-30" },
    },
    electricity: { powerKw: "3", bands: { F1: "1000", F2: "1000", F3: "500" } },
    origin: "client_mcp",
    confirmed: true,
  };
  expect(validateProfile(candidate)).toMatchObject({ status: "needs_input" });
  expect(
    validateProfile({
      ...candidate,
      electricity: { ...candidate.electricity, resident: true },
    }),
  ).toMatchObject({
    status: "needs_input",
    issues: [{ path: "electricity.bands" }],
  });
});
