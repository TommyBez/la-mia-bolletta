import Decimal from "decimal.js";
import {
  child,
  field,
  type NormalizedOffer,
  records,
  type SourceRecord,
} from "../../catalog/normalize";
import {
  annualRegulatedProfileSchema,
  resolveAnnualRegulatedRate,
} from "../../scenario";
import { resolveScenarioCoefficient } from "../../scenario/prices";
import type { OfferCalculationInput } from "../contracts";
import {
  gasSaleSupplementSchema,
  requiresGasSaleSupplement,
} from "./supplement";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export type GasMonth = {
  key: string;
  quarter: string;
  position: number;
  quantity: Decimal;
  midpoint: Decimal;
  lowQuantity: Decimal;
};
export function gasMonths(
  input: OfferCalculationInput,
  heatingProfile: string,
) {
  const official = input.catalog.references?.gasProfiles.find(
    (p) =>
      p.profile ===
      (input.profile.gas?.usage === "heating"
        ? heatingProfile
        : input.profile.gas?.usage === "technology"
          ? "T1"
          : "C2"),
  );
  if (!official) throw new Error("Profilo mensile gas ufficiale mancante.");
  const volume = new D(input.profile.annualConsumption.value);
  const start = new Date(`${input.scenario.coverageStart}T00:00:00Z`);
  const calendar = Array.from({ length: 12 }, (_, calendarPosition) => {
    const date = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + calendarPosition,
        1,
      ),
    );
    const key = date.toISOString().slice(0, 7);
    const index = official.months.indexOf(key);
    if (index < 0) throw new Error(`Profilo gas ufficiale non copre ${key}.`);
    return {
      key,
      quarter: `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`,
      quantity: volume.mul(official.percentages[index]).div(100),
    };
  });
  // Q44 pins calendar prices to four quarters. The independently observed Q38
  // commercial accumulator starts with the month AFTER consultation; it is a
  // cyclic ordering of those same twelve calendar/profile rows, not a fifth
  // forecast quarter or a silently extended thermal-year profile.
  const nextMonth = (Number(input.scenario.acquisitionMonth.slice(5)) % 12) + 1;
  const first = calendar.findIndex(
    (month) => Number(month.key.slice(5)) === nextMonth,
  );
  if (first < 0) throw new Error("Ordine mensile gas non determinabile.");
  let cumulative = new D(0);
  return Array.from({ length: 12 }, (_, position) => {
    const month = calendar[(first + position) % 12];
    const midpoint = cumulative.plus(month.quantity.div(2));
    const lowQuantity = D.max(
      0,
      D.min(month.quantity, new D(480).minus(cumulative)),
    );
    cumulative = cumulative.plus(month.quantity);
    return { ...month, position, midpoint, lowQuantity };
  });
}
export function periodApplies(source: SourceRecord, month: GasMonth) {
  const validity = child(source, "PeriodoValidita");
  const duration = field(validity, "DURATA"),
    until = field(validity, "VALIDO_FINO"),
    calendar = field(validity, "MESE_VALIDITA");
  if (duration)
    return Number(duration) < 0 || month.position < Number(duration);
  if (until) {
    const match = /^(\d{2})\/(\d{4})$/.exec(until);
    if (!match) throw new Error("Formato VALIDO_FINO gas non riconosciuto.");
    return month.key <= `${match[2]}-${match[1]}`;
  }
  if (calendar) return Number(month.key.slice(5)) === Number(calendar);
  return true;
}
function isSpecific(source: SourceRecord) {
  return !!(
    field(source, "CONSUMO_DA") ||
    field(source, "CONSUMO_A") ||
    Object.keys(child(source, "PeriodoValidita")).length
  );
}
function applies(source: SourceRecord, month: GasMonth) {
  const lower = field(source, "CONSUMO_DA"),
    upper = field(source, "CONSUMO_A");
  return (
    (!lower || month.midpoint.gte(lower)) &&
    (!upper || month.midpoint.lte(upper)) &&
    periodApplies(source, month)
  );
}
export function selectGasInterval(
  component: NormalizedOffer["components"][number],
  month: GasMonth,
) {
  if (!component.intervals.length)
    throw new Error("Componente gas senza intervalli.");
  const units = new Set(component.intervals.map((i) => i.unit));
  if (units.size !== 1)
    throw new Error("Unità incompatibili nella stessa componente gas.");
  const matching = component.intervals.filter((i) => applies(i.source, month));
  const specifics = matching.filter((i) => isSpecific(i.source));
  const candidates = specifics.length
    ? specifics
    : matching.filter((i) => !isSpecific(i.source));
  if (!candidates.length)
    throw new Error(`Nessun prezzo gas applicabile nel mese ${month.key}.`);
  return candidates.reduce((best, current) => {
    if (current.price === undefined || best.price === undefined)
      throw new Error("Prezzo gas mancante.");
    const comparison = new D(current.price).cmp(best.price);
    return comparison < 0 ||
      (comparison === 0 && field(current.source, "TIPO_PREZZO") === "02")
      ? current
      : best;
  });
}
function regulatedRate(
  input: OfferCalculationInput,
  code: string,
  quarter: string,
) {
  const rows = input.catalog.references?.regulatedRates.filter(
    (r) =>
      r.commodity === "gas" &&
      r.code === code &&
      (!r.quarter || r.quarter === quarter),
  );
  const specific = rows?.filter((r) => r.quarter === quarter);
  const candidates = specific?.length ? specific : rows;
  if (candidates?.length !== 1)
    throw new Error(
      `Corrispettivo regolato gas mancante o ambiguo: ${code}/${quarter}`,
    );
  const rate = candidates[0];
  if (!["EUR/Smc", "EUR/year"].includes(rate.unit))
    throw new Error(`Unità non qualificata per ${code}: ${rate.unit}`);
  return { value: new D(rate.value), unit: rate.unit };
}
function regulatedCodes(input: OfferCalculationInput) {
  return [
    ...new Set(
      records(input.offer.sourceRecord.ComponentiRegolate).flatMap((r) =>
        typeof r.CODICE === "string"
          ? [r.CODICE]
          : Array.isArray(r.CODICE)
            ? r.CODICE.filter((v): v is string => typeof v === "string")
            : [],
      ),
    ),
  ];
}
function monthlyIndex(input: OfferCalculationInput, month: GasMonth) {
  const references = records(input.offer.sourceRecord.RiferimentiPrezzoEnergia);
  if (!references.length) throw new Error("Indice gas assente.");
  let index = new D(0);
  for (const reference of references) {
    const code = field(reference, "IDX_PREZZO_ENERGIA");
    const result = resolveScenarioCoefficient(input.scenario, {
      sourceIndexCode:
        code === "06" &&
        records(input.offer.sourceRecord.Sconto).some((s) =>
          records(s.PrezziSconto).some((p) => field(p, "TIPOLOGIA") === "04"),
        )
          ? "14"
          : code,
      band: "BASE",
      quarter: month.quarter,
    });
    if (result.status !== "ready") throw new Error(result.reasons.join(", "));
    if (result.unit !== "EUR/Smc" || result.index !== "PSV")
      throw new Error("Unità o indice dello scenario gas non coerenti.");
    const coefficient = field(reference, "COEFFICIENTE");
    if (coefficient && (new D(coefficient).lt(0) || new D(coefficient).gt(2)))
      throw new Error(
        "Coefficiente indice gas fuori intervallo ufficiale 0–2.",
      );
    if (references.length > 1 && !coefficient)
      throw new Error("Coefficiente della somma di indici gas mancante.");
    index = index.plus(new D(result.value).mul(coefficient || "1"));
  }
  return index;
}
export function gasSales(
  input: OfferCalculationInput,
  months: GasMonth[],
  conventionalProfile?: string,
) {
  const needsSupplement = requiresGasSaleSupplement(input.offer);
  const candidate = input.catalog.references?.offerSalesSupplements?.find(
    (s) =>
      s.economicFingerprint === input.offer.economicFingerprint &&
      s.offerCode === input.offer.code &&
      s.supplierVat === input.offer.supplierVat,
  );
  if (needsSupplement && !candidate)
    throw new Error(
      "Prezzo energia della coorte fissa da completare con dettaglio ufficiale qualificato; nessuna classifica parziale.",
    );
  const supplement = needsSupplement
    ? gasSaleSupplementSchema.parse(candidate)
    : undefined;
  let fixed = new D(0),
    variable = new D(0),
    low = new D(0);
  const monthlyEnergy: Decimal[] = [];
  const monthlyIndices: Decimal[] = [];
  const monthlyRegulated: Record<string, Decimal>[] = [];
  const monthlyRegulatedLow: Record<string, Decimal>[] = [];
  let annualCcr = new D(0),
    averageLowCcr = new D(0),
    quarterlyLowCcr = new D(0);
  for (const month of months) {
    let indexNeeded = input.offer.offerType === "variable";
    let energy = new D(0),
      otherVariable = new D(0),
      fixedMonth = new D(0);
    for (const component of input.offer.components) {
      if (component.macroarea === "06" && component.type === "02") continue;
      if (!["01", "02", "04", "05", "06"].includes(component.macroarea))
        throw new Error(
          `Macroarea gas non qualificata: ${component.macroarea}`,
        );
      const interval = selectGasInterval(component, month);
      if (interval.price === undefined) throw new Error("Prezzo gas assente.");
      const price = new D(interval.price);
      if (interval.unit === "01") fixedMonth = fixedMonth.plus(price.div(12));
      else if (interval.unit === "05") {
        if (month.position === 0) fixedMonth = fixedMonth.plus(price);
      } else if (interval.unit === "04") {
        if (component.macroarea === "04" || component.macroarea === "06") {
          energy = energy.plus(price);
          if (input.offer.offerType === "mixed") {
            const kind = field(interval.source, "TIPO_PREZZO");
            if (!["01", "02"].includes(kind))
              throw new Error("Offerta mista gas senza tipo prezzo esplicito.");
            if (kind === "02") indexNeeded = true;
          }
        } else otherVariable = otherVariable.plus(price);
      } else throw new Error(`Unità gas non qualificata: ${interval.unit}`);
    }
    if (supplement) {
      fixedMonth = fixedMonth.plus(
        new D(supplement.additionalFixedAnnual).div(12),
      );
      energy = energy.plus(supplement.additionalUnitRate);
    }
    const indexRate = indexNeeded ? monthlyIndex(input, month) : new D(0);
    energy = energy.plus(indexRate);
    monthlyIndices.push(indexRate);
    monthlyEnergy.push(energy);
    const regulated: Record<string, Decimal> = {};
    const regulatedLow: Record<string, Decimal> = {};
    for (const code of regulatedCodes(input)) {
      const key = (
        {
          "03": "CCR",
          "04": "CPR",
          "05": "GRAD",
          "06": "QTINT",
          "07": "QTPSV",
          "09": "QVD_FIXED",
          "10": "QVD_VARIABLE",
        } as Record<string, string>
      )[code];
      if (!key) throw new Error(`Componente regolata gas sconosciuta: ${code}`);
      let rate: { value: Decimal; unit: string };
      if (key === "CCR") {
        const profile = annualRegulatedProfileSchema.parse(conventionalProfile);
        const qualified = resolveAnnualRegulatedRate(input.scenario, {
          code: "CCR",
          profile,
        });
        if (qualified.status !== "ready")
          throw new Error(qualified.reasons.join(", "));
        rate = { value: new D(qualified.value), unit: qualified.unit };
        const quarterly = regulatedRate(input, key, month.quarter);
        regulatedLow[code] = quarterly.value;
        annualCcr = annualCcr.plus(rate.value.mul(month.quantity));
        averageLowCcr = averageLowCcr.plus(rate.value.mul(month.lowQuantity));
        quarterlyLowCcr = quarterlyLowCcr.plus(
          quarterly.value.mul(month.lowQuantity),
        );
      } else rate = regulatedRate(input, key, month.quarter);
      regulated[code] = rate.value;
      regulatedLow[code] ??= rate.value;
      if (rate.unit === "EUR/year")
        fixedMonth = fixedMonth.plus(rate.value.div(12));
      else otherVariable = otherVariable.plus(rate.value);
    }
    monthlyRegulated.push(regulated);
    monthlyRegulatedLow.push(regulatedLow);
    const rate = energy.plus(otherVariable);
    fixed = fixed.plus(fixedMonth);
    variable = variable.plus(rate.mul(month.quantity));
    low = low.plus(rate.mul(month.lowQuantity));
  }
  if (annualCcr.gt(0)) {
    const ccrAtLowVat = new D(input.profile.annualConsumption.value).lte(480)
      ? annualCcr
      : D.min(annualCcr, quarterlyLowCcr);
    low = low.minus(averageLowCcr).plus(ccrAtLowVat);
    if (quarterlyLowCcr.gt(0)) {
      const factor = ccrAtLowVat.div(quarterlyLowCcr);
      for (const regulated of monthlyRegulatedLow)
        if (regulated["03"] !== undefined)
          regulated["03"] = regulated["03"].mul(factor);
    }
  }
  return {
    fixed,
    variable,
    low,
    monthlyEnergy,
    monthlyIndices,
    monthlyRegulated,
    monthlyRegulatedLow,
  };
}
