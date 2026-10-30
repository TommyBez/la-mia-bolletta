import Decimal from "decimal.js";
import type { ComparisonResult, OfferEstimate } from "./contracts";

type Ready = Extract<ComparisonResult, { offers: unknown[] }>;
export function summarizeComparisons(results: ComparisonResult[]) {
  const ready = results.filter((result): result is Ready => "offers" in result);
  if (
    ready.length !== 2 ||
    new Set(ready.map((result) => result.commodity)).size !== 2
  )
    return { status: "unavailable" as const };
  const [a, b] = ready;
  if (
    a.period.from !== b.period.from ||
    a.period.to !== b.period.to ||
    a.scenarioMonth !== b.scenarioMonth ||
    a.versions.method !== b.versions.method ||
    a.versions.references !== b.versions.references
  )
    return { status: "incompatible" as const };
  const choices = ready.map((result) =>
    result.recommendation.kind === "stay" &&
    result.currentContract.status === "comparable"
      ? result.currentContract.estimate
      : result.recommendedOffer?.eligibility === "eligible"
        ? result.recommendedOffer
        : undefined,
  );
  if (!choices.every((choice): choice is OfferEstimate => choice !== undefined))
    return { status: "unavailable" as const };
  const total = choices.reduce(
    (sum, choice) => sum.plus(choice.annualCost),
    new Decimal(0),
  );
  const savings = ready.every(
    (result) => result.currentContract.status === "comparable",
  )
    ? ready
        .reduce(
          (sum, result, index) =>
            sum.plus(
              result.currentContract.status === "comparable"
                ? new Decimal(result.currentContract.annualCost).minus(
                    choices[index].annualCost,
                  )
                : 0,
            ),
          new Decimal(0),
        )
        .toFixed(2)
    : undefined;
  return {
    status: "ready" as const,
    annualCost: total.toFixed(2),
    savings,
    period: a.period,
  };
}
