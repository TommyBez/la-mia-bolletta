import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { validateProfile } from "../../../domain/profile";
import { child, field, records } from "../../catalog/normalize";
import type { CatalogRead } from "../../catalog/service";
import {
  buildAnnualRegulatedRate,
  type ScenarioSnapshot,
} from "../../scenario";
import type { OfferCalculationInput } from "../contracts";
import { annualGasRegulatedBaseline } from "./annual-regulated";
import { acquireGasPortalQuote } from "./supplement-acquisition";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
type Rate = NonNullable<ScenarioSnapshot["annualRegulatedRates"]>[number];
type Probe = Rate["calibrations"][number];
type Locality = { portalCode: string; name: string };
export type AnnualGasRegulatedPlan = {
  profile: "C1 B" | "C1 C" | "C1 D" | "C1 E" | "C1 F" | "C2";
  calibration: Locality;
  holdout: Locality;
};

/** Select current national domestic linear PSV probes by their declared structure. */
export function selectAnnualGasRegulatedProbes(
  catalog: CatalogRead,
  scenario: ScenarioSnapshot,
  at = new Date(),
) {
  const candidates = catalog.offers
    .filter(
      (offer) =>
        offer.offerType === "variable" &&
        field(child(offer.sourceRecord, "DettaglioOfferta"), "TIPO_CLIENTE") ===
          "01" &&
        records(offer.sourceRecord.ZoneOfferta).length === 0 &&
        new Date(offer.validFrom) <= at &&
        new Date(offer.validTo) >= at,
    )
    .sort(
      (a, b) =>
        a.components.length - b.components.length ||
        a.code.localeCompare(b.code),
    );
  const ccr: typeof candidates = [],
    controls: typeof candidates = [];
  for (const offer of candidates) {
    const probe = createAnnualGasProbeInput(
      catalog,
      scenario,
      offer.code,
      { portalCode: "068028", name: "Pescara" },
      "C2",
      "1200",
    );
    try {
      if (records(offer.sourceRecord.ComponentiRegolate).length === 0) {
        annualGasRegulatedBaseline(probe, { requireCcr: false });
        controls.push(offer);
      } else {
        annualGasRegulatedBaseline(probe);
        if (!ccr.some((o) => o.supplierVat === offer.supplierVat))
          ccr.push(offer);
      }
    } catch {
      /* A different formula needs another separately qualified probe recipe. */
    }
    if (ccr.length >= 2 && controls.length) break;
  }
  if (ccr.length < 2 || !controls.length)
    throw new Error(
      "Current XML has no two independent linear CCR probes and CCR-free PSV control; prepare another qualified recipe",
    );
  return {
    offerCodes: [ccr[0].code, ccr[1].code] as [string, string],
    controlOfferCode: controls[0].code,
  };
}

export function createAnnualGasProbeInput(
  catalog: CatalogRead,
  scenario: ScenarioSnapshot,
  offerCode: string,
  locality: Locality,
  profile: AnnualGasRegulatedPlan["profile"],
  volume: string,
): OfferCalculationInput {
  const offer = catalog.offers.find((o) => o.code === offerCode);
  if (!offer)
    throw new Error(`Official CCR probe offer unavailable: ${offerCode}`);
  const previousYear = (date: string) =>
    `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;
  const validation = validateProfile({
    schemaVersion: 1,
    commodity: "gas",
    supplyContext: {
      domestic: true,
      active: true,
      operation: "switch_same_holder",
    },
    municipality: locality,
    annualConsumption: {
      value: volume,
      unit: "Smc",
      kind: "declared",
      period: {
        from: previousYear(scenario.coverageStart),
        to: previousYear(scenario.coverageEnd),
      },
    },
    gas: {
      usage: profile === "C2" ? "cooking_hot_water" : "heating",
      meterClass: "G4",
    },
    origin: "manual",
    confirmed: true,
  });
  if (validation.status !== "ready")
    throw new Error("Synthetic CCR profile did not validate");
  return {
    profile: validation.profile,
    preferences: { pricePreference: "any", requirements: {} },
    catalog,
    scenario,
    offer,
  };
}

/** Public Portal only. Tokens remain in memory; archive receives no raw session page. */
export async function acquireAnnualGasRegulatedRates(
  input: {
    catalog: CatalogRead;
    scenario: ScenarioSnapshot;
    offerCodes: [string, string];
    controlOfferCode: string;
    plans: AnnualGasRegulatedPlan[];
  },
  options: {
    archive: (path: string, body: string) => Promise<void>;
    fetcher?: typeof fetch;
    clock?: () => Date;
    onProgress?: (event: Record<string, unknown>) => void;
  },
) {
  if (new Set(input.offerCodes).size !== 2)
    throw new Error("Two independent CCR probe offers are required");
  const evidence: ScenarioSnapshot["evidence"] = [];
  const rates: Rate[] = [];
  const archiveEvidence = async (
    body: string,
    extension: string,
    kind: ScenarioSnapshot["evidence"][number]["kind"],
  ) => {
    const sha256 = createHash("sha256").update(body).digest("hex");
    const blobKey = `scenario/${input.scenario.acquisitionMonth}/ccr/${sha256}.${extension}`;
    await options.archive(blobKey, body);
    const index = input.scenario.evidence.length + evidence.length;
    evidence.push({ blobKey, sha256, kind });
    return index;
  };
  for (const plan of input.plans) {
    if (plan.calibration.portalCode === plan.holdout.portalCode)
      throw new Error(
        "CCR holdout must use a second independently qualified municipality",
      );
    const control = createAnnualGasProbeInput(
      input.catalog,
      input.scenario,
      input.controlOfferCode,
      plan.calibration,
      plan.profile,
      "1200",
    );
    const controlBaseline = annualGasRegulatedBaseline(control, {
      requireCcr: false,
    });
    const controlPrediction = {
      kind: "psv_drift_control",
      profile: plan.profile,
      municipality: plan.calibration,
      offerCode: input.controlOfferCode,
      volume: "1200",
      predictedSales: controlBaseline.baselineSales,
      uncertainty: new D(controlBaseline.baselineUncertainty)
        .plus("0.005")
        .toString(),
      predictedAt: (options.clock?.() ?? new Date()).toISOString(),
    };
    await archiveEvidence(
      JSON.stringify(controlPrediction, null, 2),
      "json",
      "prediction_before_query",
    );
    const controlQuote = await acquireGasPortalQuote(
      control.offer,
      "1200",
      plan.profile === "C2" ? "cooking_hot_water" : "heating",
      options.fetcher ?? fetch,
      plan.calibration,
    );
    await archiveEvidence(controlQuote.body, "html.txt", "sanitized_probe");
    if (
      new D(controlQuote.observedSales)
        .minus(controlPrediction.predictedSales)
        .abs()
        .gt(controlPrediction.uncertainty)
    )
      throw new Error(
        `PSV drift detected for ${plan.profile}; refresh the quarterly scenario before inferring CCR`,
      );
    options.onProgress?.({
      state: "psv_control_passed",
      profile: plan.profile,
      observedSales: controlQuote.observedSales,
    });
    const calibrations: Probe[] = [],
      holdouts: Probe[] = [];
    const probes = [
      ...input.offerCodes.flatMap((code) =>
        ["600", "1200"].map((volume) => ({
          code,
          volume,
          locality: plan.calibration,
          kind: "calibration" as const,
        })),
      ),
      {
        code: input.offerCodes[1],
        volume: "2400",
        locality: plan.holdout,
        kind: "holdout" as const,
      },
    ];
    for (const [position, p] of probes.entries()) {
      const calculation = createAnnualGasProbeInput(
        input.catalog,
        input.scenario,
        p.code,
        p.locality,
        plan.profile,
        p.volume,
      );
      const baseline = annualGasRegulatedBaseline(calculation);
      if (baseline.profile !== plan.profile)
        throw new Error(
          `Official locality does not use requested CCR profile ${plan.profile}`,
        );
      const fitted =
        p.kind === "holdout"
          ? buildAnnualRegulatedRate({
              profile: plan.profile,
              calibrations,
              holdouts: [],
            })
          : null;
      const rate = new D(fitted?.value ?? "0");
      const predictedSales = new D(baseline.baselineSales).plus(
        rate.mul(p.volume),
      );
      const predictedUncertainty = fitted
        ? new D(baseline.baselineUncertainty)
            .plus(new D(fitted.uncertainty).mul(p.volume))
            .plus("0.005")
        : null;
      const id = `ccr-${plan.profile.replaceAll(" ", "")}-${position}-${p.locality.portalCode}-${p.volume}`;
      const predictionEvidenceIndex = await archiveEvidence(
        JSON.stringify(
          {
            id,
            kind: p.kind,
            source: "official_portal",
            profile: plan.profile,
            municipality: p.locality,
            offerCode: p.code,
            volume: p.volume,
            acquisitionMonth: input.scenario.acquisitionMonth,
            coverageStart: input.scenario.coverageStart,
            coverageEnd: input.scenario.coverageEnd,
            baselineSales: baseline.baselineSales,
            baselineUncertainty: baseline.baselineUncertainty,
            terms: baseline.terms,
            // Calibration preregisters the algebra; no CCR value is assumed.
            ...(fitted
              ? {
                  predictedSales: predictedSales.toString(),
                  predictedUncertainty: predictedUncertainty?.toString(),
                  value: fitted.value,
                  uncertainty: fitted.uncertainty,
                }
              : {
                  equation:
                    "observedSales = baselineSales + volume * annualCCR",
                }),
            predictedAt: (options.clock?.() ?? new Date()).toISOString(),
          },
          null,
          2,
        ),
        "json",
        "prediction_before_query",
      );
      options.onProgress?.({
        state: "prediction_saved",
        id,
        profile: plan.profile,
        kind: p.kind,
      });
      const quote = await acquireGasPortalQuote(
        calculation.offer,
        p.volume,
        plan.profile === "C2" ? "cooking_hot_water" : "heating",
        options.fetcher ?? fetch,
        p.locality,
      );
      const evidenceIndex = await archiveEvidence(
        quote.body,
        "html.txt",
        "sanitized_probe",
      );
      if (
        fitted &&
        new D(quote.observedSales)
          .minus(predictedSales)
          .abs()
          .gt(predictedUncertainty ?? 0)
      ) {
        options.onProgress?.({
          state: "holdout_failed",
          id,
          observedSales: quote.observedSales,
          predictedSales: predictedSales.toString(),
          predictedUncertainty: predictedUncertainty?.toString(),
          evidenceIndex,
        });
        throw new Error(`Independent annual CCR holdout failed: ${id}`);
      }
      const record: Probe = {
        id,
        offerCode: p.code,
        supplierVat: calculation.offer.supplierVat,
        municipalityCode: p.locality.portalCode,
        volume: p.volume,
        baselineSales: baseline.baselineSales,
        baselineUncertainty: baseline.baselineUncertainty,
        terms: baseline.terms,
        observedSales: quote.observedSales,
        evidenceIndex,
        predictionEvidenceIndex,
        ...(fitted ? { predictedSales: predictedSales.toString() } : {}),
      };
      (p.kind === "holdout" ? holdouts : calibrations).push(record);
      options.onProgress?.({
        state: "observed",
        id,
        profile: plan.profile,
        kind: p.kind,
        observedSales: quote.observedSales,
      });
    }
    rates.push(
      buildAnnualRegulatedRate({
        profile: plan.profile,
        calibrations,
        holdouts,
      }),
    );
    options.onProgress?.({
      state: "profile_qualified",
      profile: plan.profile,
      value: rates.at(-1)?.value,
      uncertainty: rates.at(-1)?.uncertainty,
    });
  }
  return { annualRegulatedRates: rates, evidence };
}
