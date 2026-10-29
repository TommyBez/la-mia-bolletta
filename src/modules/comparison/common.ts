import Decimal from "decimal.js";
import {
  canonical,
  child,
  digest,
  field,
  records,
  type SourceRecord,
} from "../catalog/normalize";
import {
  resolvePortalMunicipality,
  resolveSupplierName,
} from "../references/registry";
import type {
  CostComponent,
  OfferCalculationInput,
  OfferEstimate,
  Requirement,
} from "./contracts";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const strings = (value: SourceRecord[string] | undefined): string[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string",
  );
// The immutable source keeps XML escapes. Decode display text without enabling
// XML entities/DTDs in the parser or interpreting any HTML in the browser.
function officialText(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };
  return value.replace(
    /&(amp|lt|gt|quot|apos);/g,
    (_, entity: string) => entities[entity],
  );
}
const paymentLabels: Record<string, string> = {
  "01": "Domiciliazione bancaria",
  "02": "Domiciliazione postale",
  "03": "Domiciliazione su carta di credito",
  "04": "Bollettino precompilato",
};

export type Eligibility = {
  status: "eligible" | "conditional" | "ineligible" | "incomplete_data";
  requirements: Requirement[];
  reasons: string[];
  conditions: string[];
};

/** Structured requirements only: hidden limitations in free text remain phase two. */
export function evaluateEligibility(input: OfferCalculationInput): Eligibility {
  const { offer, profile, preferences } = input;
  const source = offer.sourceRecord;
  const details = child(source, "DettaglioOfferta");
  const characteristics = child(source, "CaratteristicheOfferta");
  const reasons: string[] = [];
  const requirements: Requirement[] = [];
  const conditions = records(source.CondizioniContrattuali)
    .map((condition) => field(condition, "DESCRIZIONE"))
    .filter(Boolean);
  if (profile.commodity !== offer.commodity)
    reasons.push("different_commodity");
  if (input.purpose === "current")
    return {
      status: reasons.length ? "ineligible" : "eligible",
      reasons,
      requirements,
      conditions,
    };
  const checkRange = (
    value: string,
    minimum: string,
    maximum: string,
    reason: string,
  ) => {
    if (
      (minimum && new D(value).lt(minimum)) ||
      (maximum && new D(value).gt(maximum))
    )
      reasons.push(reason);
  };
  checkRange(
    profile.annualConsumption.value,
    field(characteristics, "CONSUMO_MIN"),
    field(characteristics, "CONSUMO_MAX"),
    "outside_consumption_range",
  );
  if (profile.commodity === "electricity" && profile.electricity) {
    checkRange(
      profile.electricity.powerKw,
      field(characteristics, "POTENZA_MIN"),
      field(characteristics, "POTENZA_MAX"),
      "outside_power_range",
    );
    const resident = field(details, "DOMESTICO_RESIDENTE");
    if (
      (resident === "01" && !profile.electricity.resident) ||
      (resident === "02" && profile.electricity.resident)
    )
      reasons.push("residence_requirement_not_met");
  }
  if (reasons.length)
    return { status: "ineligible", reasons, requirements, conditions };
  const zones = records(source.ZoneOfferta);
  if (zones.length) {
    const references = input.catalog.references;
    if (!references)
      return {
        status: "incomplete_data",
        reasons: ["missing_territorial_references"],
        requirements,
        conditions,
      };
    const locality = resolvePortalMunicipality(
      references,
      profile.municipality.portalCode,
      profile.commodity,
    );
    if (locality.status !== "ready")
      return {
        status: "incomplete_data",
        reasons: locality.reasons,
        requirements,
        conditions,
      };
    const hasTerritories = zones.some((zone) =>
      ["COMUNE", "PROVINCIA", "REGIONE"].some(
        (key) => strings(zone[key]).length,
      ),
    );
    const applicable = zones.some(
      (zone) =>
        strings(zone.COMUNE).includes(profile.municipality.portalCode) ||
        strings(zone.PROVINCIA).includes(locality.territory.provinceCode) ||
        strings(zone.REGIONE).includes(locality.territory.regionCode),
    );
    if (hasTerritories && !applicable)
      return {
        status: "ineligible",
        reasons: ["outside_offer_territory"],
        requirements,
        conditions,
      };
  }
  for (const condition of records(source.CondizioniContrattuali)) {
    if (field(condition, "LIMITANTE") !== "01") continue;
    const code = `condition:${digest(canonical(condition))}`;
    requirements.push({
      code,
      label:
        field(condition, "DESCRIZIONE") ||
        "Conferma la condizione limitante dell'offerta",
      answer: preferences.requirements[code] ?? "unknown",
    });
  }
  if (
    requirements.some((requirement) => requirement.answer === "not_satisfied")
  )
    return {
      status: "ineligible",
      reasons: ["limiting_condition_not_met"],
      requirements,
      conditions,
    };
  const payments = records(source.MetodoPagamento).map((payment) => {
    const mode = field(payment, "MODALITA_PAGAMENTO");
    const code =
      mode === "99"
        ? `payment:99:${digest(canonical(payment))}`
        : `payment:${mode}`;
    return {
      code,
      label:
        paymentLabels[mode] ||
        field(payment, "DESCRIZIONE") ||
        "Metodo di pagamento dichiarato",
      answer: preferences.requirements[code] ?? "unknown",
    } satisfies Requirement;
  });
  if (
    payments.length &&
    !payments.some((payment) => payment.answer === "satisfied")
  ) {
    if (payments.every((payment) => payment.answer === "not_satisfied"))
      return {
        status: "ineligible",
        reasons: ["no_accepted_payment_method"],
        requirements: [...requirements, ...payments],
        conditions,
      };
    requirements.push(...payments);
  }
  return {
    status: requirements.some((requirement) => requirement.answer === "unknown")
      ? "conditional"
      : "eligible",
    reasons,
    requirements,
    conditions,
  };
}

export function discountConditionCode(discount: SourceRecord): string {
  return `discount:${digest(canonical(discount))}`;
}

/** AU excludes conditional discounts from its headline estimate, even if confirmed. */
export function evaluateDiscountCondition(discount: SourceRecord) {
  const conditions = records(discount.Condizione);
  const unconditional =
    conditions.length > 0 &&
    conditions.every(
      (condition) => field(condition, "CONDIZIONE_APPLICAZIONE") === "00",
    );
  return {
    applicable: unconditional,
    code: discountConditionCode(discount),
    explanation: unconditional
      ? "Sconto incondizionato dichiarato"
      : "Sconto condizionato escluso dalla stima secondo il metodo del Portale",
  };
}

export function validatedOfficialExitUrl(value: string): string | undefined {
  value = officialText(value.trim());
  if (!value.trim()) return undefined;
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(url.hostname)
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function coherentOfferEstimate(
  input: OfferCalculationInput,
  cost: {
    annualCost: string;
    breakdown: CostComponent[];
    assumptions?: string[];
    conditions?: string[];
    eligibility?: Eligibility;
  },
): OfferEstimate {
  const eligibility = cost.eligibility ?? evaluateEligibility(input);
  if (eligibility.status === "incomplete_data")
    throw new Error(
      "Incomplete eligibility must be returned before creating an estimate",
    );
  const details = child(input.offer.sourceRecord, "DettaglioOfferta");
  const identity = child(input.offer.sourceRecord, "IdentificativiOfferta");
  const contacts = child(details, "Contatti");
  return {
    offerId: `${input.offer.supplierVat}:${input.offer.code}`,
    code: input.offer.code,
    supplierVat: input.offer.supplierVat,
    name: officialText(input.offer.name),
    supplierName: officialText(
      field(identity, "RAGIONE_SOCIALE") ||
        (input.catalog.references &&
          resolveSupplierName(
            input.catalog.references,
            input.offer.supplierVat,
          )) ||
        `Venditore ${input.offer.supplierVat}`,
    ),
    offerType: input.offer.offerType,
    annualCost: new D(cost.annualCost).toFixed(2),
    monthlyAverage: new D(cost.annualCost).div(12).toFixed(2),
    breakdown: cost.breakdown,
    eligibility: eligibility.status,
    requirements: eligibility.requirements,
    conditions: [
      ...new Set(
        [
          field(details, "DESCRIZIONE"),
          ...eligibility.conditions,
          ...(cost.conditions ?? []),
          ...records(input.offer.sourceRecord.ProdottiServiziAggiuntivi).map(
            (product) =>
              [field(product, "NOME"), field(product, "DETTAGLIO")]
                .filter(Boolean)
                .join(": "),
          ),
          ...(field(details, "GARANZIE") && field(details, "GARANZIE") !== "NO"
            ? [`Garanzie: ${field(details, "GARANZIE")}`]
            : []),
        ].filter(Boolean),
      ),
    ].map(officialText),
    assumptions: cost.assumptions ?? [],
    validFrom: input.offer.validFrom,
    validTo: input.offer.validTo,
    officialUrl:
      validatedOfficialExitUrl(field(contacts, "URL_OFFERTA")) ??
      validatedOfficialExitUrl(field(contacts, "URL_SITO_VENDITORE")),
  };
}
