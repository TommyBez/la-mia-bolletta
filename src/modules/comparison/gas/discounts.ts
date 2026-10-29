import Decimal from "decimal.js";
import { field, records } from "../../catalog/normalize";
import { evaluateDiscountCondition } from "../common";
import type { CostComponent, OfferCalculationInput } from "../contracts";
import { type GasMonth, type gasSales, periodApplies } from "./sales";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export function gasDiscounts(
  input: OfferCalculationInput,
  months: GasMonth[],
  commercial: ReturnType<typeof gasSales>,
) {
  let fixed = new D(0),
    variable = new D(0),
    low = new D(0),
    afterVat = new D(0);
  const conditions: string[] = [];
  const breakdown: CostComponent[] = [];
  const discounts = records(input.offer.sourceRecord.Sconto);
  const hasTutelaPercentage = discounts.some(
    (d) =>
      evaluateDiscountCondition(d).applicable &&
      ["01", "02"].includes(field(d, "VALIDITA")) &&
      records(d.PrezziSconto).some(
        (p) =>
          field(p, "TIPOLOGIA") === "04" && field(p, "UNITA_MISURA") === "06",
      ),
  );
  for (const [index, discount] of discounts.entries()) {
    const name = field(discount, "NOME") || `Sconto ${index + 1}`;
    const condition = evaluateDiscountCondition(discount);
    if (
      !condition.applicable ||
      !["01", "02"].includes(field(discount, "VALIDITA"))
    ) {
      conditions.push(
        `${name}: escluso dalla stima (${condition.explanation}; validità ${field(discount, "VALIDITA")}).`,
      );
      continue;
    }
    let amount = new D(0),
      lowAmount = new D(0),
      fixedAmount = new D(0),
      afterAmount = new D(0);
    for (const price of records(discount.PrezziSconto)) {
      const type = field(price, "TIPOLOGIA"),
        unit = field(price, "UNITA_MISURA"),
        raw = field(price, "PREZZO");
      if (!raw) throw new Error("Prezzo dello sconto gas assente.");
      const value = new D(raw);
      if (type === "03" && unit === "06" && hasTutelaPercentage) {
        conditions.push(
          `${name}: sconto percentuale vendita non cumulato con quello sulla tutela.`,
        );
        continue;
      }
      const lower = field(price, "VALIDO_DA"),
        upper = field(price, "VALIDO_FINO");
      const monthsApplicable = months.filter((month) =>
        periodApplies(discount, month),
      );
      if (type === "01") {
        const volume = new D(input.profile.annualConsumption.value);
        if ((lower && volume.lt(lower)) || (upper && volume.gt(upper)))
          continue;
        if (!["01", "05"].includes(unit))
          throw new Error("Unità sconto fisso gas non qualificata.");
        const bonus =
          unit === "01"
            ? value.mul(monthsApplicable.length).div(12)
            : monthsApplicable.length
              ? value
              : new D(0);
        if (field(discount, "IVA_SCONTO") === "01")
          fixedAmount = fixedAmount.plus(bonus);
        else if (field(discount, "IVA_SCONTO") === "02")
          afterAmount = afterAmount.plus(bonus);
        else throw new Error("Regola IVA dello sconto gas mancante.");
      } else if (type === "03" || type === "04") {
        if (!["04", "06"].includes(unit))
          throw new Error("Unità sconto vendita gas non qualificata.");
        for (const month of monthsApplicable) {
          if (
            (lower && month.midpoint.lt(lower)) ||
            (upper && month.midpoint.gt(upper))
          )
            continue;
          let rate = value;
          let lowRate = value;
          if (unit === "06") {
            let base =
              type === "04"
                ? commercial.monthlyIndices[month.position].plus(
                    commercial.monthlyRegulated[month.position]["03"] ?? 0,
                  )
                : commercial.monthlyEnergy[month.position];
            let lowBase =
              type === "04"
                ? commercial.monthlyIndices[month.position].plus(
                    commercial.monthlyRegulatedLow[month.position]["03"] ?? 0,
                  )
                : base;
            const scope = field(discount, "CODICE_COMPONENTE_FASCIA");
            if (scope && type !== "04") {
              const regulated =
                commercial.monthlyRegulated[month.position][scope];
              if (regulated === undefined)
                throw new Error(
                  `Sconto gas su componente regolata non qualificata: ${scope}`,
                );
              base = regulated;
              lowBase = commercial.monthlyRegulatedLow[month.position][scope];
            }
            rate = base.mul(value).div(100);
            lowRate = lowBase.mul(value).div(100);
          }
          amount = amount.plus(rate.mul(month.quantity));
          lowAmount = lowAmount.plus(lowRate.mul(month.lowQuantity));
        }
      } else throw new Error(`Tipologia sconto gas non qualificata: ${type}`);
    }
    fixed = fixed.plus(fixedAmount);
    variable = variable.plus(amount);
    low = low.plus(lowAmount);
    afterVat = afterVat.plus(afterAmount);
    const total = fixedAmount.plus(amount).plus(afterAmount);
    breakdown.push({
      code: `gas.discount.${index}`,
      label: name,
      amount: total.negated().toFixed(2),
      category: "discount",
    });
    conditions.push(
      `${name}: applicato alla stima, secondo i campi strutturati ufficiali.`,
    );
  }
  return { fixed, variable, low, afterVat, conditions, breakdown };
}
