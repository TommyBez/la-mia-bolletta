import Decimal from "decimal.js";
import { field, records, type SourceRecord } from "../../catalog/normalize";
import {
  calculateAnnualEffectiveSales,
  resolveScenarioCoefficient,
} from "../../scenario";
import {
  coherentOfferEstimate,
  evaluateDiscountCondition,
  evaluateEligibility,
} from "../common";
import type {
  CostComponent,
  OfferCalculation,
  OfferCalculationInput,
} from "../contracts";
import { type EnergyMonth, electricityDiscounts } from "./discounts";
import {
  annualPriceComponent,
  EconomicsDataError,
  economicMonths,
} from "./intervals";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const strings = (v: SourceRecord[string] | undefined) =>
  (Array.isArray(v) ? v : [v]).filter(
    (v): v is string => typeof v === "string",
  );
/** No source calls here: web and MCP use the same immutable published context. */
export function calculateElectricityOffer(
  input: OfferCalculationInput,
): OfferCalculation {
  const { offer, profile, catalog, scenario } = input;
  const fail = (reason: string): OfferCalculation => ({
    status: "incomplete_data",
    offerCode: offer.code,
    reasons: [reason],
  });
  const eligibility = evaluateEligibility(input);
  if (eligibility.status === "ineligible")
    return {
      status: "ineligible",
      offerCode: offer.code,
      reasons: eligibility.reasons,
    };
  if (eligibility.status === "incomplete_data")
    return fail(eligibility.reasons.join(", "));
  if (profile.commodity !== "electricity" || !profile.electricity?.bands)
    return fail("electricity_profile_incomplete");
  try {
    const annual = new D(profile.annualConsumption.value),
      power = new D(profile.electricity.powerKw),
      bands = profile.electricity.bands;
    const months = economicMonths(scenario.coverageStart);
    const parameters = new Map(
      catalog.parameters?.rows.map((r) => [r.nome_parametro, r.valore]),
    );
    const param = (code: string) => {
      const value = parameters.get(code);
      if (value === undefined)
        throw new EconomicsDataError(`missing_official_parameter:${code}`);
      return new D(value);
    };
    const effectiveQuarter = `${months[0].year}-Q${Math.floor((months[0].month - 1) / 3) + 1}`;
    // Regulated tariffs use their effective current quarter throughout the estimate;
    // these are not independently forecast delivery-quarter prices.
    const rate = (code: string, band?: string) => {
      const rows = catalog.references?.regulatedRates.filter(
        (r) =>
          r.commodity === "electricity" &&
          r.code === code &&
          (!r.quarter || r.quarter === effectiveQuarter) &&
          (!r.band || r.band === band),
      );
      if (!rows?.length)
        throw new EconomicsDataError(
          `missing_effective_regulated_parameter:${code}/${band ?? ""}`,
        );
      if (new Set(rows.map((r) => r.value)).size !== 1)
        throw new EconomicsDataError(`conflicting_regulated_parameter:${code}`);
      return new D(rows[0].value);
    };
    if (!["fixed", "variable"].includes(offer.offerType))
      throw new EconomicsDataError(
        `unqualified_electricity_formula:${offer.offerType}`,
      );
    let energy = new D(0),
      commercial = new D(0),
      dispatch = new D(0),
      fer = new D(0),
      indexWeightSum = new D(1);
    const assumptions: string[] = [];
    const regulated = new Map<string, Decimal>();
    const energyMonths: EnergyMonth[] = months.map(() => ({
      F1: new D(0),
      F2: new D(0),
      F3: new D(0),
    }));
    const allocate = (month: number, band: string, cost: Decimal) => {
      const targets =
        band === "F1"
          ? ["F1"]
          : band === "F2"
            ? ["F2"]
            : band === "F3"
              ? ["F3"]
              : band === "F23"
                ? ["F2", "F3"]
                : band === "F13"
                  ? ["F1", "F3"]
                  : band === "F12"
                    ? ["F1", "F2"]
                    : ["F1", "F2", "F3"];
      const total = targets.reduce(
        (sum, b) => sum.plus(bands[b as keyof typeof bands]),
        new D(0),
      );
      if (total.eq(0)) return;
      for (const b of targets)
        energyMonths[month][b as keyof EnergyMonth] = energyMonths[month][
          b as keyof EnergyMonth
        ].plus(cost.times(bands[b as keyof typeof bands]).div(total));
    };
    const annualOperator =
      offer.priceBandCode === "07"
        ? calculateAnnualEffectiveSales(scenario, {
            fingerprint: offer.economicFingerprint,
            f1: bands.F1,
            f2: bands.F2,
            f3: bands.F3,
            powerKw: profile.electricity.powerKw,
            resident: profile.electricity.resident,
          })
        : undefined;
    if (annualOperator?.status === "incomplete_data")
      throw new EconomicsDataError(annualOperator.reasons.join(", "));
    if (annualOperator?.status === "ready") {
      energy = new D(annualOperator.sales);
      assumptions.push(
        `Peak/OffPeak: arrotondamento della quota vendita entro ±${new D(annualOperator.salesRoundingUncertainty).toDecimalPlaces(2, Decimal.ROUND_UP).toFixed(2)} EUR; quota fissa e dispacciamento già inclusi.`,
      );
      if (
        records(offer.sourceRecord.Sconto).some(
          (s) => evaluateDiscountCondition(s).applicable,
        )
      )
        throw new EconomicsDataError(
          "annual_operator_discount_base_requires_separate_qualification",
        );
    } else {
      for (const component of offer.components) {
        if (component.macroarea === "06" && component.type === "02") continue;
        const cost = annualPriceComponent(component, {
          annual,
          power,
          bands,
          priceBandCode: offer.priceBandCode,
          months,
          onCost: (point) => {
            if (component.macroarea !== "04" || point.unit !== "03") return;
            const semantic =
              offer.priceBandCode === "01" || !point.band
                ? "F0"
                : (
                    {
                      "01": "F1",
                      "02": "F2",
                      "03": "F3",
                      "91": "F23",
                      "92": "F13",
                      "93": "F12",
                    } as Record<string, string>
                  )[point.band];
            if (!semantic)
              throw new EconomicsDataError("unqualified_discount_energy_band");
            allocate(point.month.index, semantic, point.cost);
          },
        });
        if (component.macroarea === "04") energy = energy.plus(cost);
        else if (["01", "02", "05", "06"].includes(component.macroarea)) {
          commercial = commercial.plus(cost);
          if (component.macroarea === "06") fer = fer.plus(cost);
        } else
          throw new EconomicsDataError(
            `unqualified_component_macroarea:${component.macroarea}`,
          );
      }
      if (offer.offerType === "variable") {
        const weights =
          offer.priceBandCode === "01"
            ? [{ band: "F0" as const, amount: annual }]
            : offer.priceBandCode === "91"
              ? [
                  { band: "F1" as const, amount: new D(bands.F1) },
                  {
                    band: "F23" as const,
                    amount: new D(bands.F2).plus(bands.F3),
                  },
                ]
              : offer.priceBandCode === "03"
                ? [
                    { band: "F1" as const, amount: new D(bands.F1) },
                    { band: "F2" as const, amount: new D(bands.F2) },
                    { band: "F3" as const, amount: new D(bands.F3) },
                  ]
                : undefined;
        if (!weights)
          throw new EconomicsDataError(
            `unqualified_forecast_band:${offer.priceBandCode}`,
          );
        const indices = records(offer.sourceRecord.RiferimentiPrezzoEnergia);
        if (!indices.length)
          throw new EconomicsDataError("missing_variable_reference_index");
        indexWeightSum = indices.reduce(
          (sum, index) => sum.plus(field(index, "COEFFICIENTE") || "1"),
          new D(0),
        );
        for (const row of energyMonths)
          for (const band of ["F1", "F2", "F3"] as const)
            row[band] = row[band].times(indexWeightSum);
        let indexedEnergy = new D(0),
          uncertainty = new D(0);
        const tutelaApplicable = records(offer.sourceRecord.Sconto).some(
          (s) =>
            evaluateDiscountCondition(s).applicable &&
            records(s.PrezziSconto).some((p) => field(p, "TIPOLOGIA") === "04"),
        );
        for (const index of indices) {
          let code = field(index, "IDX_PREZZO_ENERGIA");
          const coefficient = new D(field(index, "COEFFICIENTE") || "1");
          if (coefficient.lt(0))
            throw new EconomicsDataError(
              "negative_index_coefficient_not_qualified",
            );
          if (code === "05") {
            if (tutelaApplicable)
              throw new EconomicsDataError(
                "applicable_tutela_discount_requires_ONFIN_FUNZAU_qualification",
              );
            code = "12";
            assumptions.push(
              "Indice PE senza sconto tutela applicabile: base PUN per fascia qualificata con tre fasce pure e un profilo misto del Portale.",
            );
          }
          for (const month of months)
            for (const weight of weights) {
              const quarter = `${month.year}-Q${Math.floor((month.month - 1) / 3) + 1}`;
              const value = resolveScenarioCoefficient(scenario, {
                sourceIndexCode: code,
                band: weight.band,
                quarter,
              });
              if (value.status !== "ready")
                throw new EconomicsDataError(value.reasons.join(", "));
              const quantity = weight.amount.div(12),
                losses = param("lambda").plus(1);
              const cost = new D(value.value)
                .times(quantity)
                .times(losses)
                .times(coefficient);
              indexedEnergy = indexedEnergy.plus(cost);
              allocate(month.index, weight.band, cost);
              uncertainty = uncertainty.plus(
                new D(value.uncertainty)
                  .times(quantity)
                  .times(losses)
                  .times(coefficient.abs()),
              );
            }
        }
        energy = energy.times(indexWeightSum).plus(indexedEnergy);
        commercial = commercial.plus(fer.times(indexWeightSum.minus(1)));
        assumptions.push(
          `Coefficienti variabili ricavati dal Portale; arrotondamento della quota energia entro ±${uncertainty.toDecimalPlaces(2, Decimal.ROUND_UP).toFixed(2)} EUR.`,
        );
      }
      for (const item of records(offer.sourceRecord.Dispacciamento)) {
        const code = field(item, "TIPO_DISPACCIAMENTO");
        let cost: Decimal;
        if (code === "13") {
          commercial = commercial.plus(param("dispbt_d"));
          continue;
        }
        if (code === "14") cost = param("cdispd");
        else if (code === "01")
          cost = [
            "msd",
            "modeol",
            "uniess",
            "terna",
            "interr",
            "capprod",
          ].reduce((sum, key) => sum.plus(param(key)), new D(0));
        else if (code === "02") {
          dispatch = dispatch
            .plus(rate("PD", "F1").times(bands.F1))
            .plus(rate("PD", "F23").times(new D(bands.F2).plus(bands.F3)));
          continue;
        } else if (code === "09")
          cost = param("cpty_mrkt_1")
            .plus(param("cpty_mrkt_2"))
            .plus(param("cpty_mrkt_3"))
            .div(3);
        else if (code === "99") {
          const value = field(item, "VALORE_DISP");
          if (value === "")
            throw new EconomicsDataError("missing_custom_dispatch_price");
          cost = new D(value);
        } else {
          const key = (
            {
              "03": "msd",
              "04": "modeol",
              "05": "uniess",
              "06": "terna",
              "07": "capprod",
              "08": "interr",
              "10": "cpty_mrkt_mt",
              "11": "rst",
              "12": "rstg",
            } as Record<string, string>
          )[code];
          if (!key)
            throw new EconomicsDataError(`unqualified_dispatch_code:${code}`);
          cost = param(key);
        }
        dispatch = dispatch.plus(cost.times(annual));
      }
      for (const container of records(offer.sourceRecord.ComponentiRegolate))
        for (const code of strings(container.CODICE)) {
          let cost: Decimal;
          if (code === "01") {
            cost = param("pcv_c");
            commercial = commercial.plus(cost);
          } else if (code === "02") {
            cost = rate("PPE").times(annual).times(indexWeightSum);
            energy = energy.plus(cost);
          } else
            throw new EconomicsDataError(
              `unqualified_regulated_component:${code}`,
            );
          regulated.set(code, (regulated.get(code) ?? new D(0)).plus(cost));
        }
    }
    const discount = annualOperator
      ? { beforeVat: new D(0), afterVat: new D(0) }
      : electricityDiscounts(offer.sourceRecord, {
          annual,
          power,
          bands,
          months,
          energy: energyMonths,
          regulated,
        });
    const network = param("sigma1")
      .plus(param("sigma2").times(power))
      .plus(
        param("sigma3").plus(param("uc3")).plus(param("uc6p_d")).times(annual),
      )
      .plus(param("uc6s_d").times(power));
    const resident = profile.electricity.resident;
    const charges = resident
      ? param("asos_dr").plus(param("arim_dr")).times(annual)
      : param("asos_dnr_f")
          .plus(param("arim_dnr_f"))
          .plus(param("asos_dnr_v").plus(param("arim_dnr_v")).times(annual));
    const exemption = annual.lte(1800)
      ? annual
      : annual.lte(2640)
        ? new D(1800)
        : D.max(new D(1800).minus(annual.minus(2640)), 0);
    const excise =
      resident && power.lte(3)
        ? annual.minus(exemption).times(param("acc_c_r_l"))
        : annual.times(param(resident ? "acc_c_r_h" : "acc_c_nr"));
    const grossSales = energy.plus(commercial).plus(dispatch);
    const beforeVat = grossSales
        .minus(discount.beforeVat)
        .plus(network)
        .plus(charges)
        .plus(excise),
      vat = beforeVat.times(param("iva_c"));
    const total = beforeVat.plus(vat).minus(discount.afterVat);
    const component = (
      code: string,
      label: string,
      amount: Decimal,
      category: CostComponent["category"],
    ): CostComponent => ({ code, label, amount: amount.toFixed(), category });
    const breakdown = [
      component("sales", "Vendita di energia elettrica", grossSales, "sales"),
      component(
        "discount",
        "Sconti applicati prima IVA",
        discount.beforeVat.negated(),
        "discount",
      ),
      component(
        "network",
        "Tariffa per l’uso della rete elettrica",
        network,
        "network",
      ),
      component("charges", "Oneri generali di sistema", charges, "charges"),
      component("excise", "Accisa", excise, "excise"),
      component("vat", "IVA", vat, "vat"),
    ];
    if (discount.afterVat.gt(0))
      breakdown.push(
        component(
          "discount-after-vat",
          "Sconti applicati dopo IVA",
          discount.afterVat.negated(),
          "discount",
        ),
      );
    return {
      status: "calculated",
      estimate: coherentOfferEstimate(input, {
        annualCost: total.toFixed(),
        breakdown,
        eligibility,
        assumptions,
      }),
    };
  } catch (error) {
    return fail(
      error instanceof EconomicsDataError
        ? error.message
        : "electricity_calculation_failed",
    );
  }
}
