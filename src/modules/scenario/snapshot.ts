import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { z } from "zod";
import {
  type AnnualRegulatedProfile,
  annualRegulatedProfileSchema,
  annualRegulatedRateSchema,
  qualifyAnnualRegulatedRates,
} from "./annual-regulated";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const decimal = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/)
  .max(100);
const nonnegative = decimal.refine(
  (v) => new D(v).gte(0),
  "must be nonnegative",
);
const positive = decimal.refine((v) => new D(v).gt(0), "must be positive");
const quarter = z.string().regex(/^\d{4}-Q[1-4]$/);
const band = z.enum(["F0", "F1", "F2", "F3", "F23", "BASE"]);
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const evidence = z
  .object({
    blobKey: z
      .string()
      .regex(/^scenario\/[a-zA-Z0-9_./-]+$/)
      .refine(
        (v) =>
          !v.includes("..") && !/token|cookie|csrf|session|secret/i.test(v),
      ),
    sha256: sha,
    kind: z.enum([
      "sanitized_probe",
      "official_offer",
      "official_method",
      "prediction_before_query",
    ]),
  })
  .strict();
const terms = z.object({ quarter, band, consumption: nonnegative }).strict();
const equation = {
  id: z.string().min(1),
  offerCode: z.string().min(1),
  observedSales: decimal,
  fixedAnnual: decimal,
  spread: decimal,
  additiveUnit: decimal,
  multiplier: positive,
  evidenceIndex: z.number().int().nonnegative(),
};
const annualProbe = z
  .object({
    id: z.string().min(1),
    f1: nonnegative,
    f2: nonnegative,
    f3: nonnegative,
    observedSales: decimal,
    evidenceIndex: z.number().int().nonnegative(),
    powerKw: positive,
    resident: z.boolean(),
  })
  .strict();
export const scenarioSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    commodity: z.enum(["electricity", "gas"]),
    acquisitionMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    acquiredAt: z.iso.datetime(),
    method: z.literal("portal-implicit-quarterly-v1"),
    provenance: z.literal("inferred_from_official_simulator"),
    coverageStart: z.iso.date(),
    coverageEnd: z.iso.date(),
    catalogVersionId: z.string().min(1),
    requiredAnnualFingerprints: z.array(sha),
    requiredAnnualRegulatedProfiles: z
      .array(annualRegulatedProfileSchema)
      .optional(),
    annualRegulatedRates: z.array(annualRegulatedRateSchema).optional(),
    evidence: z.array(evidence).min(1),
    coefficients: z.array(
      z
        .object({
          quarter,
          band,
          index: z.enum(["PUN", "PSV"]),
          value: decimal,
          uncertainty: nonnegative,
          unit: z.enum(["EUR/kWh", "EUR/Smc"]),
        })
        .strict(),
    ),
    calibrations: z
      .array(
        z
          .object({ ...equation, ...terms.shape, consumption: positive })
          .strict(),
      )
      .min(1),
    holdouts: z
      .array(z.object({ ...equation, terms: z.array(terms).min(1) }).strict())
      .min(1),
    annualSales: z.array(
      z
        .object({
          fingerprint: sha,
          offerCode: z.string().min(1),
          supplierVat: z.string().min(1),
          fixedAnnual: decimal,
          f1: decimal,
          f2: decimal,
          f3: decimal,
          includes: z.array(z.string().min(1)).min(1),
          domain: z
            .object({
              minKwh: nonnegative,
              maxKwh: positive,
              powerKw: z.array(positive).min(1),
              resident: z.array(z.boolean()).min(1),
              powerIndependent: z.boolean().optional(),
            })
            .strict(),
          structuralQualification: z
            .object({
              method: z.literal("official-xml-linear-sales-v1"),
              sourceEvidenceIndex: z.number().int().nonnegative(),
              economicFingerprint: sha,
              noConsumptionTiers: z.literal(true),
              noPowerCharges: z.literal(true),
              noPricePeriods: z.literal(true),
              noApplicableDiscounts: z.literal(true),
            })
            .strict()
            .optional(),
          calibrations: z.array(annualProbe).min(4),
          holdouts: z.array(annualProbe).min(1),
        })
        .strict(),
    ),
  })
  .strict();
export type ScenarioSnapshot = z.infer<typeof scenarioSnapshotSchema>;
export type ScenarioCommodity = ScenarioSnapshot["commodity"];
export type ScenarioQualification =
  | {
      status: "qualified";
      snapshot: ScenarioSnapshot;
      versionId: string;
      reasons: [];
    }
  | { status: "rejected"; reasons: string[] };

export function scenarioWindow(at: Date) {
  const calendar = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const year = Number(calendar.year),
    month = Number(calendar.month) - 1,
    q = Math.floor(month / 3);
  const start = new Date(Date.UTC(year, q * 3, 1));
  const end = new Date(Date.UTC(year + 1, q * 3, 0));
  const quarters = Array.from(
    { length: 4 },
    (_, i) => `${year + Math.floor((q + i) / 4)}-Q${((q + i) % 4) + 1}`,
  );
  return {
    acquisitionMonth: `${calendar.year}-${calendar.month}`,
    coverageStart: start.toISOString().slice(0, 10),
    coverageEnd: end.toISOString().slice(0, 10),
    quarters,
  };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function scenarioDigest(snapshot: ScenarioSnapshot) {
  return createHash("sha256").update(canonical(snapshot)).digest("hex");
}
/** Qualification checks independent observations, not just structural JSON validity. */
export function qualifyScenario(
  input: unknown,
  options: {
    now?: Date;
    requiredAnnualFingerprints?: string[];
    catalogVersionId?: string;
    strictCatalogBinding?: boolean;
    requiredAnnualRegulatedProfiles?: AnnualRegulatedProfile[];
  } = {},
): ScenarioQualification {
  const parsed = scenarioSnapshotSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: "rejected",
      reasons: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
    };
  const s = parsed.data,
    reasons: string[] = [];
  const now = options.now ?? new Date(),
    window = scenarioWindow(now);
  if (
    s.acquisitionMonth !== window.acquisitionMonth ||
    scenarioWindow(new Date(s.acquiredAt)).acquisitionMonth !==
      s.acquisitionMonth ||
    new Date(s.acquiredAt) > now
  )
    reasons.push(
      "acquisition month must be current; observation cannot be in the future",
    );
  if (
    s.coverageStart !== window.coverageStart ||
    s.coverageEnd !== window.coverageEnd
  )
    reasons.push("coverage must be the four current calendar quarters");
  if (
    options.catalogVersionId &&
    s.catalogVersionId !== options.catalogVersionId
  )
    reasons.push("catalog version mismatch");
  const expected =
    s.commodity === "electricity" ? ["F0", "F1", "F2", "F3", "F23"] : ["BASE"];
  const keys = new Set<string>();
  for (const c of s.coefficients) {
    const key = `${c.quarter}/${c.band}`;
    if (keys.has(key)) reasons.push(`duplicate coefficient ${key}`);
    keys.add(key);
    if (
      !window.quarters.includes(c.quarter) ||
      !expected.includes(c.band) ||
      c.index !== (s.commodity === "electricity" ? "PUN" : "PSV") ||
      c.unit !== (s.commodity === "electricity" ? "EUR/kWh" : "EUR/Smc")
    )
      reasons.push(`incoherent coefficient ${key}`);
  }
  for (const q of window.quarters)
    for (const b of expected)
      if (!keys.has(`${q}/${b}`)) reasons.push(`missing coefficient ${q}/${b}`);
  const checkEvidence = (i: number) => {
    if (!s.evidence[i]) reasons.push(`missing evidence reference ${i}`);
  };
  const calibrated = new Set<string>();
  for (const c of s.calibrations) {
    checkEvidence(c.evidenceIndex);
    const coef = s.coefficients.find(
      (v) => v.quarter === c.quarter && v.band === c.band,
    );
    if (!coef) {
      reasons.push(`calibration missing coefficient ${c.id}`);
      continue;
    }
    const predicted = new D(c.fixedAnnual).plus(
      new D(c.consumption).times(
        new D(coef.value)
          .times(c.multiplier)
          .plus(c.spread)
          .plus(c.additiveUnit),
      ),
    );
    if (predicted.minus(c.observedSales).abs().gt("0.0050000001"))
      reasons.push(`calibration mismatch ${c.id}`);
    const minimumUncertainty = new D("0.005").div(
      new D(c.consumption).times(c.multiplier),
    );
    if (
      new D(coef.uncertainty)
        .plus("0.000000000000000000000000001")
        .lt(minimumUncertainty)
    )
      reasons.push(`understated rounding uncertainty ${c.id}`);
    calibrated.add(`${c.quarter}/${c.band}`);
  }
  for (const key of keys)
    if (!calibrated.has(key)) reasons.push(`uncalibrated coefficient ${key}`);
  const holdoutCoverage = new Set<string>();
  for (const h of s.holdouts) {
    checkEvidence(h.evidenceIndex);
    if (s.calibrations.some((c) => c.id === h.id))
      reasons.push(`holdout reused calibration ${h.id}`);
    let predicted = new D(h.fixedAnnual),
      tolerance = new D("0.005");
    for (const t of h.terms) {
      const c = s.coefficients.find(
        (v) => v.quarter === t.quarter && v.band === t.band,
      );
      if (!c) {
        reasons.push(`holdout missing coefficient ${h.id}`);
        continue;
      }
      predicted = predicted.plus(
        new D(t.consumption).times(
          new D(c.value)
            .times(h.multiplier)
            .plus(h.spread)
            .plus(h.additiveUnit),
        ),
      );
      tolerance = tolerance.plus(
        new D(t.consumption).times(h.multiplier).times(c.uncertainty),
      );
      if (new D(t.consumption).gt(0))
        holdoutCoverage.add(`${t.quarter}/${t.band}`);
    }
    if (
      predicted.minus(h.observedSales).abs().gt(tolerance.plus("0.0000000001"))
    )
      reasons.push(`independent holdout mismatch ${h.id}`);
  }
  for (const key of keys)
    if (!holdoutCoverage.has(key))
      reasons.push(`missing independent holdout for ${key}`);
  const annualIds = new Set<string>();
  for (const a of s.annualSales) {
    if (annualIds.has(a.fingerprint))
      reasons.push(`duplicate annual fingerprint ${a.fingerprint}`);
    annualIds.add(a.fingerprint);
    if (s.commodity !== "electricity")
      reasons.push("annual Peak coefficients require electricity");
    if (new D(a.domain.minKwh).gt(a.domain.maxKwh))
      reasons.push("invalid annual profile domain");
    const structural = a.structuralQualification;
    if (structural) {
      checkEvidence(structural.sourceEvidenceIndex);
      if (
        s.evidence[structural.sourceEvidenceIndex]?.kind !== "official_offer" ||
        structural.economicFingerprint !== a.fingerprint
      )
        reasons.push(
          `annual structural proof source mismatch ${a.fingerprint}`,
        );
    }
    if (a.domain.powerIndependent && !structural)
      reasons.push(
        `annual power independence requires official structural proof ${a.fingerprint}`,
      );
    const physicalEvidence = [...a.calibrations, ...a.holdouts];
    for (const power of a.domain.powerKw)
      for (const resident of a.domain.resident)
        if (
          !physicalEvidence.some(
            (p) => new D(p.powerKw).eq(power) && p.resident === resident,
          )
        )
          reasons.push(
            `annual physical profile unqualified ${a.fingerprint}/${power}/${resident}`,
          );
    const holdoutVolumes = a.holdouts.map((p) =>
      new D(p.f1).plus(p.f2).plus(p.f3),
    );
    if (
      (D.min(...holdoutVolumes).gt(a.domain.minKwh) &&
        !(structural && new D(a.domain.minKwh).eq(0))) ||
      D.max(...holdoutVolumes).lt(a.domain.maxKwh)
    )
      reasons.push(
        `annual volume domain exceeds independent controls ${a.fingerprint}`,
      );
    const pure = new Set(
      a.calibrations
        .filter(
          (p) => [p.f1, p.f2, p.f3].filter((v) => new D(v).gt(0)).length === 1,
        )
        .map((p) =>
          new D(p.f1).gt(0) ? "F1" : new D(p.f2).gt(0) ? "F2" : "F3",
        ),
    );
    if (pure.size !== 3)
      reasons.push(
        `annual calibration needs three pure bands ${a.fingerprint}`,
      );
    // Two volumes identify the intercept; merely fitting three quotes cannot identify four unknowns.
    const volumes = new Set(
      a.calibrations.map((p) => new D(p.f1).plus(p.f2).plus(p.f3).toString()),
    );
    if (volumes.size < 2)
      reasons.push(`annual intercept not identified ${a.fingerprint}`);
    const base = a.calibrations.find(
      (p) => new D(p.f1).gt(0) && new D(p.f2).eq(0) && new D(p.f3).eq(0),
    );
    const baseVolume = base ? new D(base.f1) : new D(1);
    const protocol =
      [0, 1, 2].every((i) =>
        a.calibrations.some((p) =>
          [p.f1, p.f2, p.f3].every((v, j) =>
            new D(v).eq(j === i ? baseVolume : 0),
          ),
        ),
      ) &&
      a.calibrations.some(
        (p) =>
          new D(p.f1).eq(baseVolume.times(2)) &&
          new D(p.f2).eq(0) &&
          new D(p.f3).eq(0),
      );
    if (!protocol)
      reasons.push(
        `annual calibration requires pure equal-volume bands and a doubled F1 control ${a.fingerprint}`,
      );
    const minVolume = baseVolume;
    for (const p of [...a.calibrations, ...a.holdouts]) {
      checkEvidence(p.evidenceIndex);
      const predicted = new D(a.fixedAnnual)
        .plus(new D(a.f1).times(p.f1))
        .plus(new D(a.f2).times(p.f2))
        .plus(new D(a.f3).times(p.f3));
      const volume = new D(p.f1).plus(p.f2).plus(p.f3);
      // Intercept fitted from two rounded observations: <= .015; each slope <= .02/base.
      const bound = new D("0.015")
        .plus(volume.div(minVolume).times("0.02"))
        .plus("0.005");
      if (predicted.minus(p.observedSales).abs().gt(bound))
        reasons.push(
          `annual ${a.holdouts.includes(p) ? "holdout" : "calibration"} mismatch ${p.id}`,
        );
    }
    for (const p of a.holdouts) {
      if (a.calibrations.some((c) => c.id === p.id))
        reasons.push(`annual holdout reused calibration ${p.id}`);
      if ([p.f1, p.f2, p.f3].some((v) => new D(v).eq(0)))
        reasons.push(`annual mixed holdout required ${p.id}`);
    }
  }
  const required =
    options.requiredAnnualFingerprints ?? s.requiredAnnualFingerprints;
  if (
    options.strictCatalogBinding !== false &&
    options.requiredAnnualFingerprints &&
    [...new Set(required)].sort().join(",") !==
      [...new Set(s.requiredAnnualFingerprints)].sort().join(",")
  )
    reasons.push("declared annual requirements differ from the bound catalog");
  if (s.commodity === "gas" && s.requiredAnnualFingerprints.length)
    reasons.push("gas cannot declare electricity Peak fingerprints");
  for (const fingerprint of required)
    if (!annualIds.has(fingerprint))
      reasons.push(`unqualified annual fingerprint ${fingerprint}`);
  if (
    new Set(s.requiredAnnualFingerprints).size !==
    s.requiredAnnualFingerprints.length
  )
    reasons.push("duplicate required fingerprints");
  const regulatedRequired =
    options.requiredAnnualRegulatedProfiles ??
    s.requiredAnnualRegulatedProfiles ??
    [];
  if (
    options.strictCatalogBinding !== false &&
    options.requiredAnnualRegulatedProfiles &&
    [...new Set(regulatedRequired)].sort().join(",") !==
      [...new Set(s.requiredAnnualRegulatedProfiles ?? [])].sort().join(",")
  )
    reasons.push(
      "declared annual regulated profiles differ from the bound catalog",
    );
  reasons.push(...qualifyAnnualRegulatedRates(s, regulatedRequired));
  return reasons.length
    ? { status: "rejected", reasons }
    : {
        status: "qualified",
        snapshot: s,
        versionId: scenarioDigest(s),
        reasons: [],
      };
}
