import Decimal from "decimal.js";
import { field, records } from "../../catalog/normalize";
import { resolvePortalMunicipality } from "../../references/registry";
import { evaluateDiscountCondition } from "../common";
import type { OfferCalculationInput } from "../contracts";
import { gasMonths, gasSales } from "./sales";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

/** Exact non-CCR sales basis for a preregistered Portal annual CCR probe.
 * The calibration offers must have one ordinary PSV index and no applicable
 * discounts, periods or consumption tiers. No vendor identity is consulted.
 */
export function annualGasRegulatedBaseline(
  input: OfferCalculationInput,
  options: { requireCcr?: boolean } = {},
) {
  const refs = input.catalog.references;
  if (!refs || input.profile.commodity !== "gas" || !input.profile.gas)
    throw new Error("Annual CCR qualification needs an official gas profile");
  const location = resolvePortalMunicipality(
    refs,
    input.profile.municipality.portalCode,
    "gas",
  );
  if (location.status !== "ready" || !location.gas)
    throw new Error("Annual CCR qualification locality is not qualified");
  const indices = records(input.offer.sourceRecord.RiferimentiPrezzoEnergia);
  if (
    input.offer.offerType !== "variable" ||
    indices.length !== 1 ||
    !["03", "10", "14", "15"].includes(
      field(indices[0], "IDX_PREZZO_ENERGIA"),
    ) ||
    (field(indices[0], "COEFFICIENTE") &&
      field(indices[0], "COEFFICIENTE") !== "1") ||
    records(input.offer.sourceRecord.Sconto).some(
      (s) => evaluateDiscountCondition(s).applicable,
    ) ||
    input.offer.components.some(
      (c) =>
        c.intervals.length !== 1 ||
        c.intervals.some(
          (i) =>
            field(i.source, "CONSUMO_DA") ||
            field(i.source, "CONSUMO_A") ||
            i.source.PeriodoValidita,
        ),
    )
  )
    throw new Error(
      "Annual CCR probe offer is outside the qualified linear PSV protocol",
    );
  const regulated = records(input.offer.sourceRecord.ComponentiRegolate);
  const codes = regulated.flatMap((r) =>
    typeof r.CODICE === "string"
      ? [r.CODICE]
      : Array.isArray(r.CODICE)
        ? r.CODICE
        : [],
  );
  if (options.requireCcr !== false && !codes.includes("03"))
    throw new Error("Annual CCR probe offer does not declare CCR");
  if (options.requireCcr === false && codes.includes("03"))
    throw new Error("PSV drift control must be independent of CCR");
  const withoutCcr = {
    ...input,
    offer: {
      ...input.offer,
      sourceRecord: {
        ...input.offer.sourceRecord,
        ComponentiRegolate: regulated.map((r) => ({
          ...r,
          CODICE: (typeof r.CODICE === "string"
            ? [r.CODICE]
            : Array.isArray(r.CODICE)
              ? r.CODICE
              : []
          ).filter((c) => c !== "03"),
        })),
      },
    },
  };
  const months = gasMonths(withoutCcr, location.gas.operationalProfile);
  const sales = gasSales(withoutCcr, months);
  let uncertainty = new D(0);
  const terms = new Map<string, Decimal>();
  for (const month of months) {
    const coefficient = input.scenario.coefficients.find(
      (c) =>
        c.index === "PSV" && c.band === "BASE" && c.quarter === month.quarter,
    );
    if (!coefficient)
      throw new Error(`Missing PSV uncertainty for ${month.quarter}`);
    uncertainty = uncertainty.plus(month.quantity.mul(coefficient.uncertainty));
    terms.set(
      month.quarter,
      (terms.get(month.quarter) ?? new D(0)).plus(month.quantity),
    );
  }
  return {
    profile:
      input.profile.gas.usage === "heating"
        ? location.gas.operationalProfile
        : input.profile.gas.usage === "cooking_hot_water"
          ? "C2"
          : "T1",
    volume: input.profile.annualConsumption.value,
    baselineSales: sales.fixed.plus(sales.variable).toString(),
    baselineUncertainty: uncertainty.toString(),
    terms: [...terms].map(([quarter, consumption]) => ({
      quarter,
      consumption: consumption.toString(),
    })),
  };
}
