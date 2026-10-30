import Decimal from "decimal.js";
import {
  child,
  field,
  type NormalizedOffer,
  type SourceRecord,
} from "../../catalog/normalize";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
export class EconomicsDataError extends Error {}
export type EconomicMonth = { index: number; year: number; month: number };
export function economicMonths(from: string): EconomicMonth[] {
  const start = new Date(`${from}T00:00:00Z`);
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    return {
      index,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
    };
  });
}
export function periodApplies(source: SourceRecord, month: EconomicMonth) {
  const p = child(source, "PeriodoValidita");
  const duration = field(p, "DURATA"),
    until = field(p, "VALIDO_FINO"),
    calendar = field(p, "MESE_VALIDITA");
  if (duration && month.index >= Number(duration)) return false;
  if (calendar && month.month !== Number(calendar)) return false;
  if (until) {
    const match = /^(\d{1,2})\/(\d{4})$/.exec(until);
    if (!match) throw new EconomicsDataError("invalid_price_period");
    if (
      month.year * 12 + month.month >
      Number(match[2]) * 12 + Number(match[1])
    )
      return false;
  }
  return true;
}
export function hasPeriod(source: SourceRecord) {
  return Object.keys(child(source, "PeriodoValidita")).length > 0;
}
const lower = (source: SourceRecord, key = "CONSUMO_DA") => {
  const v = field(source, key);
  if (!v) return new D(0);
  const n = new D(v);
  return n.gt(0) ? n.minus(1) : n;
};
export function boundedQuantity(
  total: Decimal,
  source: SourceRecord,
  from = "CONSUMO_DA",
  to = "CONSUMO_A",
) {
  const upper = field(source, to);
  return D.max(
    D.min(total, upper ? new D(upper) : total).minus(lower(source, from)),
    0,
  );
}
function select(
  intervals: NormalizedOffer["components"][number]["intervals"],
  point: Decimal,
  month: EconomicMonth,
) {
  const applicable = intervals.filter(
    (i) =>
      periodApplies(i.source, month) &&
      point.gte(lower(i.source)) &&
      (!field(i.source, "CONSUMO_A") ||
        point.lte(field(i.source, "CONSUMO_A"))),
  );
  const specific = applicable.filter(
    (i) =>
      i.source.CONSUMO_DA !== undefined ||
      i.source.CONSUMO_A !== undefined ||
      hasPeriod(i.source),
  );
  const choices = specific.length ? specific : applicable;
  if (!choices.length) throw new EconomicsDataError("uncovered_price_interval");
  return choices.reduce((a, b) =>
    new D(b.price ?? "NaN").lt(a.price ?? "NaN") ? b : a,
  );
}
export function annualPriceComponent(
  component: NormalizedOffer["components"][number],
  input: {
    annual: Decimal;
    power: Decimal;
    bands: { F1: string; F2: string; F3: string };
    priceBandCode?: string;
    months: EconomicMonth[];
    onCost?: (input: {
      band?: string;
      unit?: string;
      month: EconomicMonth;
      cost: Decimal;
    }) => void;
  },
) {
  if (!component.intervals.length)
    throw new EconomicsDataError("component_without_price");
  const groups = new Map<string, typeof component.intervals>();
  for (const i of component.intervals) {
    if (i.price === undefined || i.unit === undefined)
      throw new EconomicsDataError("missing_component_price_or_unit");
    const key = `${i.unit}:${i.band ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  let cost = new D(0);
  for (const intervals of groups.values()) {
    const unit = intervals[0].unit,
      band = intervals[0].band;
    const amount =
      input.priceBandCode === "01" || !band
        ? input.annual
        : band === "01"
          ? new D(input.bands.F1)
          : band === "02"
            ? new D(input.bands.F2)
            : band === "03"
              ? new D(input.bands.F3)
              : band === "91"
                ? new D(input.bands.F2).plus(input.bands.F3)
                : band === "92"
                  ? new D(input.bands.F1).plus(input.bands.F3)
                  : band === "93"
                    ? new D(input.bands.F1).plus(input.bands.F2)
                    : undefined;
    if (amount === undefined)
      throw new EconomicsDataError(`unqualified_price_band:${band}`);
    const add = (value: Decimal, month: EconomicMonth) => {
      cost = cost.plus(value);
      input.onCost?.({ band, unit, month, cost: value });
    };
    let oneTime = false;
    for (const month of input.months) {
      if (unit === "03") {
        if (input.annual.eq(0)) continue;
        const points = [
          new D(0),
          input.annual,
          ...intervals.flatMap((i) => [
            lower(i.source),
            ...(field(i.source, "CONSUMO_A")
              ? [new D(field(i.source, "CONSUMO_A"))]
              : []),
          ]),
        ]
          .filter((p) => p.gte(0) && p.lte(input.annual))
          .sort((a, b) => a.cmp(b));
        for (let n = 1; n < points.length; n++) {
          const width = points[n].minus(points[n - 1]);
          if (width.eq(0)) continue;
          const chosen = select(
            intervals,
            points[n].plus(points[n - 1]).div(2),
            month,
          );
          add(
            new D(chosen.price as string)
              .times(width)
              .times(amount)
              .div(input.annual)
              .div(12),
            month,
          );
        }
      } else {
        const chosen = select(intervals, input.annual, month),
          price = new D(chosen.price as string);
        if (unit === "01") add(price.div(12), month);
        else if (unit === "02") add(price.times(input.power).div(12), month);
        else if (unit === "05") {
          if (!oneTime) {
            add(price, month);
            oneTime = true;
          }
        } else
          throw new EconomicsDataError(`unqualified_component_unit:${unit}`);
      }
    }
  }
  return cost;
}
