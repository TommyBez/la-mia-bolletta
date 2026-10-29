import Decimal from "decimal.js";
import { z } from "zod";
import type { ScenarioSnapshot } from "./snapshot";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const decimal = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/)
  .max(100);
const nonnegative = decimal.refine((v) => new D(v).gte(0));
const positive = decimal.refine((v) => new D(v).gt(0));
export const annualRegulatedProfileSchema = z.enum([
  "C1 B",
  "C1 C",
  "C1 D",
  "C1 E",
  "C1 F",
  "C2",
  "T1",
]);
export type AnnualRegulatedProfile = z.infer<
  typeof annualRegulatedProfileSchema
>;
export const DOMESTIC_ANNUAL_REGULATED_PROFILES: AnnualRegulatedProfile[] = [
  "C1 B",
  "C1 C",
  "C1 D",
  "C1 E",
  "C1 F",
  "C2",
];
export const annualRegulatedProbeSchema = z
  .object({
    id: z.string().min(1),
    offerCode: z.string().min(1),
    supplierVat: z.string().min(1),
    municipalityCode: z.string().regex(/^\d{6}$/),
    volume: positive,
    baselineSales: decimal,
    baselineUncertainty: nonnegative,
    terms: z
      .array(
        z
          .object({
            quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
            consumption: nonnegative,
          })
          .strict(),
      )
      .min(1)
      .max(4),
    observedSales: decimal,
    evidenceIndex: z.number().int().nonnegative(),
    predictionEvidenceIndex: z.number().int().nonnegative().optional(),
    predictedSales: decimal.optional(),
    indexMultiplier: positive.optional(),
    profile: annualRegulatedProfileSchema.optional(),
    kind: z.enum(["calibration", "holdout"]).optional(),
  })
  .strict();
export type AnnualRegulatedProbe = z.infer<typeof annualRegulatedProbeSchema>;
export const annualRegulatedRateSchema = z
  .object({
    code: z.literal("CCR"),
    profile: annualRegulatedProfileSchema,
    method: z.literal("portal-implicit-profile-annual-ccr-v1"),
    unit: z.literal("EUR/Smc"),
    value: decimal,
    uncertainty: nonnegative,
    lower: decimal,
    upper: decimal,
    calibrations: z.array(annualRegulatedProbeSchema).length(4),
    holdouts: z.array(annualRegulatedProbeSchema).min(1),
  })
  .strict();
export type AnnualRegulatedRate = z.infer<typeof annualRegulatedRateSchema>;

function bounds(calibrations: AnnualRegulatedProbe[]) {
  if (calibrations.length !== 4)
    throw new Error("CCR calibration requires two providers at600/1200Smc");
  const lower = D.max(
    ...calibrations.map((p) =>
      new D(p.observedSales)
        .minus("0.005")
        .minus(p.baselineSales)
        .minus(p.baselineUncertainty)
        .div(p.volume),
    ),
  );
  const upper = D.min(
    ...calibrations.map((p) =>
      new D(p.observedSales)
        .plus("0.005")
        .minus(p.baselineSales)
        .plus(p.baselineUncertainty)
        .div(p.volume),
    ),
  );
  if (lower.gt(upper))
    throw new Error("CCR calibration intervals have no common intersection");
  return { lower, upper };
}
/** Prefit accepts an empty holdout list; publishing still requires independent observations. */
export function buildAnnualRegulatedRate(input: {
  profile: AnnualRegulatedProfile;
  calibrations: AnnualRegulatedProbe[];
  holdouts?: AnnualRegulatedProbe[];
}): AnnualRegulatedRate {
  const calibrations = input.calibrations.map((p) =>
    annualRegulatedProbeSchema.parse(p),
  );
  const { lower, upper } = bounds(calibrations),
    value = lower.plus(upper).div(2);
  return {
    code: "CCR",
    profile: annualRegulatedProfileSchema.parse(input.profile),
    method: "portal-implicit-profile-annual-ccr-v1",
    unit: "EUR/Smc",
    value: value.toFixed(),
    uncertainty: D.max(value.minus(lower), upper.minus(value)).toFixed(),
    lower: lower.toFixed(),
    upper: upper.toFixed(),
    calibrations,
    holdouts: input.holdouts ?? [],
  };
}
export function qualifyAnnualRegulatedRates(
  snapshot: ScenarioSnapshot,
  required: AnnualRegulatedProfile[] = [],
): string[] {
  const reasons: string[] = [],
    rates = snapshot.annualRegulatedRates ?? [],
    keys = new Set<string>();
  for (const rate of rates) {
    const key = `${rate.code}/${rate.profile}`;
    if (keys.has(key)) reasons.push(`duplicate annual regulated rate ${key}`);
    keys.add(key);
    if (snapshot.commodity !== "gas")
      reasons.push("annual CCR rates require gas");
    const providers = new Set(rate.calibrations.map((p) => p.supplierVat));
    const municipalities = new Set(
      rate.calibrations.map((p) => p.municipalityCode),
    );
    if (providers.size !== 2 || municipalities.size !== 1)
      reasons.push(
        `CCR needs two independent providers in one calibration municipality ${key}`,
      );
    for (const supplier of providers) {
      const probes = rate.calibrations.filter(
        (p) => p.supplierVat === supplier,
      );
      if (
        probes.length !== 2 ||
        probes
          .map((p) => new D(p.volume).toFixed())
          .sort()
          .join(",") !== ["1200", "600"].join(",")
      )
        reasons.push(
          `CCR calibration volumes must be600/1200Smc for each provider ${key}`,
        );
    }
    let fitted: ReturnType<typeof bounds> | undefined;
    try {
      fitted = bounds(rate.calibrations);
    } catch {
      reasons.push(`CCR calibration bounds are inconsistent ${key}`);
    }
    if (fitted) {
      if (
        new D(rate.lower)
          .minus(fitted.lower)
          .abs()
          .gt("0.000000000000000000000001") ||
        new D(rate.upper)
          .minus(fitted.upper)
          .abs()
          .gt("0.000000000000000000000001")
      )
        reasons.push(`CCR declared bounds differ from calibration ${key}`);
      const uncertainty = new D(rate.uncertainty),
        value = new D(rate.value);
      const center = fitted.lower.plus(fitted.upper).div(2),
        radius = D.max(center.minus(fitted.lower), fitted.upper.minus(center));
      if (
        value.minus(center).abs().gt("0.000000000000000000000001") ||
        uncertainty.minus(radius).abs().gt("0.000000000000000000000001")
      )
        reasons.push(
          `CCR value or uncertainty must use the exact calibration intersection ${key}`,
        );
    }
    const ids = new Set<string>();
    for (const probe of [...rate.calibrations, ...rate.holdouts]) {
      if (ids.has(probe.id)) reasons.push(`CCR duplicate probe ${probe.id}`);
      ids.add(probe.id);
      if (probe.profile && probe.profile !== rate.profile)
        reasons.push(`CCR profile mismatch ${probe.id}`);
      if (snapshot.evidence[probe.evidenceIndex]?.kind !== "sanitized_probe")
        reasons.push(`CCR missing sanitized source observation ${probe.id}`);
      const quarters = new Set(probe.terms.map((t) => t.quarter)),
        expected = new Set(
          snapshot.coefficients
            .filter((c) => c.index === "PSV")
            .map((c) => c.quarter),
        );
      if (
        quarters.size !== 4 ||
        probe.terms.length !== 4 ||
        [...quarters].some((q) => !expected.has(q))
      )
        reasons.push(
          `CCR baseline must cover four exact PSV quarters ${probe.id}`,
        );
      const volume = new D(probe.volume),
        termsVolume = probe.terms.reduce(
          (sum, t) => sum.plus(t.consumption),
          new D(0),
        );
      // Published AU percentages have seven decimal places: at most12*0.5e-7 percentage points.
      if (
        termsVolume
          .minus(volume)
          .abs()
          .gt(volume.times("0.000000006").plus("0.000000000000000000000001"))
      )
        reasons.push(`CCR conventional quantity sum inconsistent ${probe.id}`);
      let propagated = new D(0);
      for (const term of probe.terms) {
        const coefficient = snapshot.coefficients.find(
          (c) =>
            c.index === "PSV" &&
            c.band === "BASE" &&
            c.quarter === term.quarter,
        );
        if (coefficient)
          propagated = propagated.plus(
            new D(coefficient.uncertainty)
              .times(term.consumption)
              .times(probe.indexMultiplier ?? "1"),
          );
      }
      if (
        new D(probe.baselineUncertainty)
          .minus(propagated)
          .abs()
          .gt("0.000000000000000000000001")
      )
        reasons.push(
          `CCR baseline uncertainty must equal propagated PSV bounds ${probe.id}`,
        );
      const prediction = new D(probe.baselineSales).plus(
        new D(rate.value).times(volume),
      );
      const tolerance = new D("0.005")
        .plus(probe.baselineUncertainty)
        .plus(new D(rate.uncertainty).times(volume));
      if (
        prediction
          .minus(probe.observedSales)
          .abs()
          .gt(tolerance.plus("0.000000000000000000000001"))
      )
        reasons.push(`CCR independent observation mismatch ${probe.id}`);
    }
    for (const holdout of rate.holdouts) {
      if (
        !new D(holdout.volume).eq("2400") ||
        municipalities.has(holdout.municipalityCode)
      )
        reasons.push(
          `CCR holdout requires2400Smc in a different municipality ${key}`,
        );
      if (
        holdout.predictionEvidenceIndex === undefined ||
        snapshot.evidence[holdout.predictionEvidenceIndex]?.kind !==
          "prediction_before_query" ||
        holdout.predictedSales === undefined
      )
        reasons.push(
          `CCR holdout lacks preregistered prediction ${holdout.id}`,
        );
      else if (
        new D(holdout.predictedSales)
          .minus(
            new D(holdout.baselineSales).plus(
              new D(rate.value).times(holdout.volume),
            ),
          )
          .abs()
          .gt("0.000000000000000000000001")
      )
        reasons.push(
          `CCR preregistered prediction differs from calibration ${holdout.id}`,
        );
    }
  }
  const declared = snapshot.requiredAnnualRegulatedProfiles ?? [];
  for (const profile of new Set([...required, ...declared]))
    if (!keys.has(`CCR/${profile}`))
      reasons.push(`unqualified annual regulated profile CCR/${profile}`);
  return reasons;
}
export function resolveAnnualRegulatedRate(
  snapshot: ScenarioSnapshot,
  input: { code: "CCR"; profile: AnnualRegulatedProfile },
) {
  const rate = snapshot.annualRegulatedRates?.find(
    (r) => r.code === input.code && r.profile === input.profile,
  );
  return rate
    ? { status: "ready" as const, ...rate }
    : {
        status: "incomplete_data" as const,
        reasons: [
          `Missing qualified annual regulated rate ${input.code}/${input.profile}`,
        ],
      };
}

/** Only domestic profiles are required when current catalog offers include CCR. */
export function requiredAnnualRegulatedProfilesForCatalog(
  offers: ReadonlyArray<{
    commodity: string;
    sourceRecord: Record<string, unknown>;
  }>,
): AnnualRegulatedProfile[] {
  const needs = offers.some((o) => {
    if (o.commodity !== "gas") return false;
    const containers = o.sourceRecord.ComponentiRegolate;
    const rows = Array.isArray(containers) ? containers : [containers];
    return rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const code = (row as { CODICE?: unknown }).CODICE;
      return (Array.isArray(code) ? code : [code]).includes("03");
    });
  });
  return needs ? [...DOMESTIC_ANNUAL_REGULATED_PROFILES] : [];
}
