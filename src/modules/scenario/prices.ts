import Decimal from "decimal.js";
import type { ScenarioSnapshot } from "./snapshot";

/** Source periodicity changes settlement, not the qualified underlying forecast series. */
export function resolveScenarioCoefficient(
  snapshot: ScenarioSnapshot,
  input: {
    sourceIndexCode: string;
    band: "F0" | "F1" | "F2" | "F3" | "F23" | "BASE";
    quarter: string;
  },
) {
  const accepted =
    snapshot.commodity === "electricity"
      ? ["01", "08", "12"]
      : ["03", "10", "14", "15"];
  if (!accepted.includes(input.sourceIndexCode))
    return {
      status: "incomplete_data" as const,
      reasons: ["Source index requires a separately qualified method"],
    };
  const coefficient = snapshot.coefficients.find(
    (c) => c.band === input.band && c.quarter === input.quarter,
  );
  if (!coefficient)
    return {
      status: "incomplete_data" as const,
      reasons: [`Missing ${input.quarter}/${input.band}`],
    };
  return { status: "ready" as const, ...coefficient };
}
export function calculateAnnualEffectiveSales(
  snapshot: ScenarioSnapshot,
  input: {
    fingerprint: string;
    f1: string;
    f2: string;
    f3: string;
    powerKw: string;
    resident: boolean;
  },
) {
  const a = snapshot.annualSales.find(
    (v) => v.fingerprint === input.fingerprint,
  );
  if (!a)
    return {
      status: "incomplete_data" as const,
      reasons: ["Unqualified annual economic fingerprint"],
    };
  let f1: Decimal, f2: Decimal, f3: Decimal, power: Decimal;
  try {
    f1 = new Decimal(input.f1);
    f2 = new Decimal(input.f2);
    f3 = new Decimal(input.f3);
    power = new Decimal(input.powerKw);
  } catch {
    return {
      status: "incomplete_data" as const,
      reasons: ["Invalid annual physical profile"],
    };
  }
  const total = f1.plus(f2).plus(f3);
  if (
    ![f1, f2, f3].every((v) => v.isFinite() && v.gte(0)) ||
    total.lt(a.domain.minKwh) ||
    total.gt(a.domain.maxKwh) ||
    !power.isFinite() ||
    power.lte(0) ||
    (!a.domain.powerIndependent &&
      !a.domain.powerKw.some((v) => power.eq(v))) ||
    !a.domain.resident.includes(input.resident)
  )
    return {
      status: "incomplete_data" as const,
      reasons: ["Annual profile is outside the qualified domain"],
    };
  const basis = a.calibrations.find(
    (p) =>
      new Decimal(p.f1).gt(0) &&
      new Decimal(p.f2).eq(0) &&
      new Decimal(p.f3).eq(0),
  );
  if (!basis)
    return {
      status: "incomplete_data" as const,
      reasons: ["Annual operator lacks a valid calibration basis"],
    };
  const Exact = Decimal.clone({ precision: 50 });
  return {
    status: "ready" as const,
    sales: new Exact(a.fixedAnnual)
      .plus(new Exact(a.f1).times(input.f1))
      .plus(new Exact(a.f2).times(input.f2))
      .plus(new Exact(a.f3).times(input.f3))
      .toFixed(),
    salesRoundingUncertainty: new Exact("0.015")
      .plus(new Exact(total.toFixed()).div(basis.f1).times("0.02"))
      .toFixed(),
    includes: a.includes,
    method: "annual-effective-affine-sales-v1" as const,
  };
}
