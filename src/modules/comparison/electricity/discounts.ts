import Decimal from "decimal.js";
import { field, records, type SourceRecord } from "../../catalog/normalize";
import { evaluateDiscountCondition } from "../common";
import {
  boundedQuantity,
  type EconomicMonth,
  EconomicsDataError,
  hasPeriod,
  periodApplies,
} from "./intervals";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export type EnergyMonth = { F1: Decimal; F2: Decimal; F3: Decimal };
const sourceStrings = (v: SourceRecord[string] | undefined) =>
  (Array.isArray(v) ? v : [v]).filter(
    (v): v is string => typeof v === "string",
  );
export function electricityDiscounts(
  source: SourceRecord,
  input: {
    annual: Decimal;
    power: Decimal;
    bands: { F1: string; F2: string; F3: string };
    months: EconomicMonth[];
    energy: EnergyMonth[];
    regulated: Map<string, Decimal>;
  },
) {
  let beforeVat = new D(0),
    afterVat = new D(0);
  for (const discount of records(source.Sconto)) {
    if (!evaluateDiscountCondition(discount).applicable) continue;
    const period = hasPeriod(discount);
    if (!period && !["01", "02"].includes(field(discount, "VALIDITA")))
      continue;
    const targets = sourceStrings(discount.CODICE_COMPONENTE_FASCIA);
    const targetBands = targets.length
      ? targets.flatMap((code) =>
          code === "11"
            ? ["F1"]
            : code === "12"
              ? ["F2"]
              : code === "13"
                ? ["F3"]
                : code === "91"
                  ? ["F2", "F3"]
                  : code === "92"
                    ? ["F1", "F3"]
                    : code === "93"
                      ? ["F1", "F2"]
                      : [],
        )
      : ["F1", "F2", "F3"];
    const regulatedTargets = targets.filter((c) => ["01", "02"].includes(c));
    if (
      targets.some(
        (t) => !["01", "02", "11", "12", "13", "91", "92", "93"].includes(t),
      )
    )
      throw new EconomicsDataError("unqualified_discount_target");
    const quantity = targetBands.reduce(
      (sum, b) => sum.plus(input.bands[b as keyof typeof input.bands]),
      new D(0),
    );
    for (const price of records(discount.PrezziSconto)) {
      const value = field(price, "PREZZO"),
        type = field(price, "TIPOLOGIA"),
        unit = field(price, "UNITA_MISURA");
      if (value === "") throw new EconomicsDataError("missing_discount_price");
      if (type === "04")
        throw new EconomicsDataError("unqualified_applicable_tutela_discount");
      let amount = new D(0),
        once = false;
      for (const month of input.months) {
        if (!periodApplies(discount, month)) continue;
        const lower = field(price, "VALIDO_DA"),
          upper = field(price, "VALIDO_FINO");
        if (type === "01") {
          if (
            (lower &&
              input.annual.lt(
                new D(lower).gt(0) ? new D(lower).minus(1) : 0,
              )) ||
            (upper && input.annual.gt(upper))
          )
            continue;
          if (unit === "01") amount = amount.plus(new D(value).div(12));
          else if (unit === "05") {
            if (!once) {
              amount = amount.plus(value);
              once = true;
            }
          } else
            throw new EconomicsDataError(
              `unqualified_fixed_discount_unit:${unit}`,
            );
        } else if (type === "02" && unit === "02")
          amount = amount.plus(new D(value).times(input.power).div(12));
        else if (type === "03" && unit === "03") {
          const annualUnits = input.annual.eq(0)
            ? new D(0)
            : boundedQuantity(input.annual, price, "VALIDO_DA", "VALIDO_FINO")
                .times(quantity)
                .div(input.annual);
          amount = amount.plus(annualUnits.times(value).div(12));
        } else if (type === "03" && unit === "06") {
          let base = new D(0);
          if (regulatedTargets.length) {
            for (const code of regulatedTargets) {
              const cost = input.regulated.get(code);
              if (!cost)
                throw new EconomicsDataError(
                  `missing_regulated_discount_base:${code}`,
                );
              base = base.plus(cost.div(12));
            }
          } else
            base = targetBands.reduce(
              (sum, band) =>
                sum.plus(input.energy[month.index][band as keyof EnergyMonth]),
              new D(0),
            );
          if (lower || upper) {
            const fraction = input.annual.eq(0)
              ? new D(0)
              : boundedQuantity(
                  input.annual,
                  price,
                  "VALIDO_DA",
                  "VALIDO_FINO",
                ).div(input.annual);
            base = base.times(fraction);
          }
          amount = amount.plus(base.times(value).div(100));
        } else
          throw new EconomicsDataError(`unqualified_discount:${type}/${unit}`);
      }
      const vat = field(discount, "IVA_SCONTO");
      if (!["01", "02"].includes(vat))
        throw new EconomicsDataError("missing_discount_vat_semantics");
      if (type === "01" && vat === "02") afterVat = afterVat.plus(amount);
      else beforeVat = beforeVat.plus(amount);
    }
  }
  return { beforeVat, afterVat };
}
