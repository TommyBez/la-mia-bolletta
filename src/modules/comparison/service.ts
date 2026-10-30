import Decimal from "decimal.js";
import { z } from "zod";
import type { AppDb } from "../../db";
import { validateProfile } from "../../domain/profile";
import {
  canonical,
  digest,
  NORMALIZATION_VERSION,
  type NormalizedOffer,
  portalDate,
  records,
} from "../catalog/normalize";
import { createBlobOriginalStore } from "../catalog/originals";
import { createCatalogService } from "../catalog/service";
import { createOfficialSource } from "../catalog/source";
import {
  createScenarioService,
  DOMESTIC_ANNUAL_REGULATED_PROFILES,
} from "../scenario";
import {
  ComparisonRequestSchema,
  type ComparisonResult,
  type ComparisonVersions,
  type CurrentContractResult,
  type OfferCalculation,
  OfferDetailRequestSchema,
  type OfferDetailResult,
  type OfferEstimate,
} from "./contracts";
import { reconstructBillContract } from "./current-contract";
import { calculateElectricityOffer } from "./electricity";
import { calculateGasOffer } from "./gas";
import { summarizeComparisons } from "./summary";

export const COMPARISON_METHOD = "portal-v4.2-project-v2";
const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

export function createComparisonService({
  db,
  now = () => new Date(),
}: {
  db: AppDb;
  now?: () => Date;
}) {
  const catalog = createCatalogService({
    db,
    source: createOfficialSource(),
    originals: createBlobOriginalStore(),
    clock: now,
  });
  const scenario = createScenarioService(db, { now });
  async function compareAll(input: unknown): Promise<ComparisonResult> {
    const parsed = ComparisonRequestSchema.safeParse(input);
    if (!parsed.success)
      return {
        status: "needs_input",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    const request = parsed.data;
    const validation = validateProfile(request.profile);
    if (validation.status !== "ready") return validation;
    const { profile } = validation;
    const at = now();
    const data = await catalog.readCatalog({
      commodity: profile.commodity,
      versionId: request.versions?.catalog,
      at,
      portalMunicipalityCode: profile.municipality.portalCode,
    });
    if (
      data.status !== "ready" ||
      !data.versionId ||
      !data.referenceVersionId ||
      !data.sourceDate
    )
      return {
        status: "incomplete_data",
        reasons: data.reasons.length
          ? data.reasons
          : ["catalog_version_metadata_unavailable"],
        profileRevision: profile.revision,
      };
    const scenarioRead = await scenario.getScenario({
      commodity: profile.commodity,
      versionId: request.versions?.scenario,
      at,
      requiredAnnualFingerprints: data.requiredAnnualFingerprints,
      requiredAnnualRegulatedProfiles:
        profile.commodity === "gas" &&
        data.offers.some((offer) =>
          records(offer.sourceRecord.ComponentiRegolate).some((row) =>
            (Array.isArray(row.CODICE) ? row.CODICE : [row.CODICE]).some(
              (code) => code === "03" || code === "CCR",
            ),
          ),
        )
          ? DOMESTIC_ANNUAL_REGULATED_PROFILES
          : [],
    });
    if (scenarioRead.status !== "ready")
      return {
        status: "incomplete_data",
        reasons: scenarioRead.reasons,
        profileRevision: profile.revision,
      };
    const versions: ComparisonVersions = {
      catalog: data.versionId,
      references: data.referenceVersionId,
      parameters: digest(canonical(data.parameters)),
      scenario: scenarioRead.versionId,
      method: COMPARISON_METHOD,
    };
    if (
      request.versions &&
      Object.entries(versions).some(
        ([key, value]) =>
          request.versions?.[key as keyof ComparisonVersions] !== value,
      )
    )
      return {
        status: "incomplete_data",
        reasons: ["incompatible_pinned_versions"],
        profileRevision: profile.revision,
      };
    const preferences = request.preferences ?? {
      pricePreference: "any" as const,
      requirements: {},
    };
    const calculate =
      profile.commodity === "gas"
        ? calculateGasOffer
        : calculateElectricityOffer;
    const context = {
      profile,
      preferences,
      catalog: data,
      scenario: scenarioRead.snapshot,
    };
    const results: OfferCalculation[] = data.offers.map((offer) => {
      try {
        return calculate({ ...context, offer, purpose: "alternative" });
      } catch {
        return {
          status: "incomplete_data",
          offerCode: offer.code,
          reasons: ["uninterpretable_official_formula"],
        };
      }
    });
    const failures = results.filter(
      (result) => result.status === "incomplete_data",
    );
    if (failures.length)
      return {
        status: "incomplete_data",
        reasons: [
          `uncomputed_offers:${failures.length}`,
          ...failures
            .slice(0, 12)
            .flatMap((failure) =>
              failure.status === "incomplete_data"
                ? failure.reasons.map(
                    (reason) => `${failure.offerCode}: ${reason}`,
                  )
                : [],
            ),
        ],
        profileRevision: profile.revision,
      };
    const estimates = results.flatMap((result) =>
      result.status === "calculated" ? [result.estimate] : [],
    );
    if (estimates.some((estimate) => !new D(estimate.annualCost).isFinite()))
      return {
        status: "incomplete_data",
        reasons: ["non_finite_official_estimate"],
        profileRevision: profile.revision,
      };
    const period = {
      from: scenarioRead.snapshot.coverageStart,
      to: scenarioRead.snapshot.coverageEnd,
    };
    let currentContract: CurrentContractResult = {
      status: "absent",
      reasons: ["current_contract_not_provided"],
    };
    let reconstructedOffer: NormalizedOffer | undefined;
    let currentInput = request.currentContract;
    // A client-provided normalized offer cannot establish bill completeness.
    // Only the confirmed conditions adapter below constructs this provenance.
    if (currentInput?.source.kind === "confirmed_bill") {
      currentInput = undefined;
      currentContract = {
        status: "incomplete",
        reasons: ["current_bill_requires_confirmed_commercial_conditions"],
      };
    }
    if (!currentInput && request.currentBillConditions !== undefined) {
      const reconstructed = reconstructBillContract(
        request.currentBillConditions,
        profile,
      );
      if (reconstructed.status === "comparable") {
        currentInput = reconstructed.contract;
        reconstructedOffer = reconstructed.contract.offer;
      } else
        currentContract = {
          status: "incomplete",
          reasons: reconstructed.reasons,
        };
    }
    if (currentInput) {
      const current = currentInput;
      if (
        current.applicableFrom > period.from ||
        current.applicableTo < period.to
      )
        currentContract = {
          status: "outside_period",
          reasons: ["current_conditions_do_not_cover_estimation_period"],
        };
      else {
        const archived =
          current.source.kind === "official_archive"
            ? await catalog.readOfferVersionContext({
                commodity: profile.commodity,
                versionId: current.source.reference,
                code: current.offer.code,
                supplierVat: current.offer.supplierVat,
              })
            : null;
        const currentOffer =
          current.source.kind === "confirmed_bill"
            ? reconstructedOffer
            : archived?.normalizationVersion === NORMALIZATION_VERSION
              ? archived.offer
              : undefined;
        // Historical commercial terms stay tied to their immutable observation.
        // Network charges and taxes still use today's applicable references.
        const currentCatalog =
          archived && data.references
            ? {
                ...data,
                references: {
                  ...data.references,
                  offerSalesSupplements: archived.offerSalesSupplement
                    ? [archived.offerSalesSupplement]
                    : [],
                },
              }
            : data;
        const calculation = currentOffer
          ? calculate({
              ...context,
              catalog: currentCatalog,
              offer: currentOffer,
              purpose: "current",
            })
          : null;
        currentContract =
          calculation?.status === "calculated"
            ? {
                status: "comparable",
                annualCost: calculation.estimate.annualCost,
                estimate: calculation.estimate,
                reasons: [],
              }
            : {
                status: "incomplete",
                reasons: calculation?.reasons ?? [
                  archived &&
                  archived.normalizationVersion !== NORMALIZATION_VERSION
                    ? "current_archive_normalization_version_incompatible"
                    : "current_official_archive_version_unavailable",
                ],
              };
      }
    }
    if (currentContract.status === "comparable") {
      for (const estimate of estimates)
        estimate.savings = new D(currentContract.annualCost)
          .minus(estimate.annualCost)
          .toFixed(2);
    }
    const order = (a: OfferEstimate, b: OfferEstimate) =>
      new D(a.annualCost).cmp(b.annualCost) ||
      a.code.localeCompare(b.code) ||
      a.supplierVat.localeCompare(b.supplierVat);
    const offers = estimates
      .filter((estimate) => estimate.eligibility === "eligible")
      .sort(order);
    const conditionalOffers = estimates
      .filter((estimate) => estimate.eligibility === "conditional")
      .sort(order);
    const fixed = offers.filter((offer) => offer.offerType === "fixed");
    const recommended =
      preferences.pricePreference === "fixed" ? fixed[0] : offers[0];
    const conditionalRecommended =
      preferences.pricePreference === "fixed"
        ? conditionalOffers.find((offer) => offer.offerType === "fixed")
        : conditionalOffers[0];
    let recommendation: Extract<
      ComparisonResult,
      { offers: OfferEstimate[] }
    >["recommendation"];
    if (!recommended)
      recommendation = {
        kind: conditionalRecommended ? "conditional" : "unavailable",
        offerId: conditionalRecommended?.offerId,
        reasons: [
          preferences.pricePreference === "fixed" && !conditionalRecommended
            ? "no_eligible_fixed_offer"
            : conditionalRecommended
              ? "confirm_offer_requirements"
              : "no_eligible_offers",
        ],
      };
    else if (currentContract.status !== "comparable")
      recommendation = {
        kind: "conditional",
        offerId: recommended.offerId,
        reasons: [
          "alternatives_available_current_contract_not_comparable",
          ...(preferences.pricePreference === "fixed"
            ? ["fixed_price_preference"]
            : []),
        ],
      };
    else if (new D(currentContract.annualCost).lte(recommended.annualCost))
      recommendation = {
        kind: "stay",
        reasons: ["current_contract_costs_no_more_than_selected_alternative"],
      };
    else
      recommendation = {
        kind:
          recommended.offerType === "variable" ||
          recommended.offerType === "mixed"
            ? "conditional"
            : "switch",
        offerId: recommended.offerId,
        reasons: [
          "lower_estimated_annual_cost",
          ...(recommended.offerType !== "fixed"
            ? ["variable_price_scenario"]
            : []),
          ...(preferences.pricePreference === "fixed"
            ? ["fixed_price_preference"]
            : []),
        ],
      };
    const manifest = data.manifest as { exclusions?: Record<string, number> };
    const dateInRome = (iso: string) =>
      portalDate(
        `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}_00:00:00`,
      );
    const [scenarioYear, scenarioMonth] = scenarioRead.snapshot.acquisitionMonth
      .split("-")
      .map(Number);
    const nextMonth = new Date(Date.UTC(scenarioYear, scenarioMonth, 1))
      .toISOString()
      .slice(0, 10);
    const validUntil = new Date(
      Math.min(
        new Date(dateInRome(data.sourceDate)).valueOf() + 48 * 3600000,
        new Date(dateInRome(nextMonth)).valueOf(),
        // Pinned versions do not extend an offer's marketing availability.
        // Expire the entire ranking before any active member disappears.
        ...data.offers.map((offer) => new Date(offer.validTo).valueOf()),
      ),
    ).toISOString();
    return {
      status: offers.length ? "ready" : "no_eligible_offers",
      schemaVersion: 1,
      commodity: profile.commodity,
      profileRevision: profile.revision,
      profileHash: digest(canonical(profile)),
      calculatedAt: at.toISOString(),
      validUntil,
      scenarioMonth: scenarioRead.snapshot.acquisitionMonth,
      sourceDate: data.sourceDate,
      period,
      versions,
      coverage: {
        source: "official_portal",
        complete: true,
        considered: data.offers.length,
        excluded: {
          ...(manifest.exclusions ?? {}),
          profile_ineligible: results.filter(
            (result) => result.status === "ineligible",
          ).length,
        },
      },
      offers,
      conditionalOffers,
      currentContract,
      recommendation,
      recommendedOffer: recommendation.offerId
        ? [...offers, ...conditionalOffers].find(
            (offer) => offer.offerId === recommendation.offerId,
          )
        : undefined,
      warnings: [
        "forward_coefficients_inferred_from_official_simulator",
        ...(data.sourceDate !==
        at.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" })
          ? ["using_last_applicable_catalog_within_48h"]
          : []),
      ],
    };
  }
  async function compare(input: unknown): Promise<ComparisonResult> {
    const result = await compareAll(input);
    if (!("offers" in result)) return result;
    const parsed = ComparisonRequestSchema.parse(input);
    const { offset = 0, limit = 20 } = parsed.page ?? {};
    return {
      ...result,
      pagination: {
        offset,
        limit,
        eligibleTotal: result.offers.length,
        conditionalTotal: result.conditionalOffers.length,
      },
      offers: result.offers.slice(offset, offset + limit),
      conditionalOffers: result.conditionalOffers.slice(offset, offset + limit),
    };
  }
  async function getDataStatus() {
    const at = now();
    async function commodityStatus(commodity: "electricity" | "gas") {
      const catalogStatus = await catalog.getCatalogStatus({ commodity, at });
      const scenarioStatus = await scenario.getScenarioStatus({
        commodity,
        at,
        requiredAnnualFingerprints: catalogStatus.requiredAnnualFingerprints,
        requiredAnnualRegulatedProfiles:
          commodity === "gas" ? DOMESTIC_ANNUAL_REGULATED_PROFILES : [],
      });
      return { catalog: catalogStatus, scenario: scenarioStatus };
    }
    const [electricity, gas] = await Promise.all([
      commodityStatus("electricity"),
      commodityStatus("gas"),
    ]);
    return {
      schemaVersion: 1 as const,
      checkedAt: at.toISOString(),
      electricity,
      gas,
    };
  }
  async function getOfferDetail(input: unknown): Promise<OfferDetailResult> {
    const parsed = OfferDetailRequestSchema.safeParse(input);
    if (!parsed.success)
      return {
        status: "needs_input",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    const { offerId, ...request } = parsed.data;
    const result = await compareAll(request);
    if (!("offers" in result)) return result;
    const offer = [...result.offers, ...result.conditionalOffers].find(
      (item) => item.offerId === offerId,
    );
    if (!offer)
      return {
        status: "not_found",
        reasons: ["offer_not_in_pinned_comparison"],
      };
    return {
      status: "ready",
      offer,
      versions: result.versions,
      period: result.period,
      profileHash: result.profileHash,
      profileRevision: result.profileRevision,
    };
  }
  async function compareSupplies(input: unknown) {
    const parsed = z
      .array(ComparisonRequestSchema)
      .min(1)
      .max(2)
      .safeParse(input);
    if (!parsed.success)
      return {
        status: "needs_input" as const,
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    const commodities = parsed.data
      .map(
        (request) =>
          (request.profile as { commodity?: unknown } | null)?.commodity,
      )
      .filter(Boolean);
    if (new Set(commodities).size !== commodities.length)
      return {
        status: "needs_input" as const,
        issues: [
          {
            path: "supplies",
            message: "Invia al massimo un profilo luce e un profilo gas.",
          },
        ],
      };
    const results = await Promise.all(parsed.data.map(compare));
    return {
      status: "multi_supply" as const,
      results,
      summary: summarizeComparisons(results),
    };
  }
  return {
    compare,
    compareSupplies,
    validateProfile,
    getDataStatus,
    getOfferDetail,
  };
}
