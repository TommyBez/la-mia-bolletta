import Decimal from "decimal.js";
export type OcrQualificationCase = {
  id: string;
  format: "pdf_native" | "pdf_scan" | "photo_set";
  vendor: string;
  synthetic: boolean;
  expected: Record<string, string | null>;
  actual: Record<string, string | null>;
  durationMs: number;
  costUsd: string | null;
  dual: boolean;
  pages: number;
  priceKinds: ("fixed" | "variable")[];
};
/** The report evaluates observed, annotated runs; an absent corpus cannot pass. */
export function qualifyOcrCorpus(cases: OcrQualificationCase[]) {
  const reasons: string[] = [];
  const real = cases.filter((item) => !item.synthetic);
  if (real.length < 30)
    reasons.push("Occorrono almeno 30 bollette reali autorizzate.");
  for (const format of ["pdf_native", "pdf_scan", "photo_set"] as const)
    if (real.filter((c) => c.format === format).length < 10)
      reasons.push(`Occorrono almeno 10 casi ${format}.`);
  if (new Set(real.map((c) => c.vendor)).size < 5)
    reasons.push("Occorrono almeno cinque venditori diversi.");
  if (!real.some((c) => c.dual))
    reasons.push("Manca un documento con entrambe le forniture.");
  if (!real.some((c) => c.pages > 1))
    reasons.push("Manca un documento multipagina.");
  if (
    !real.some((c) => c.priceKinds.includes("fixed")) ||
    !real.some((c) => c.priceKinds.includes("variable"))
  )
    reasons.push("Servono contratti fissi e variabili.");
  const counts = { correct: 0, missing: 0, wrong: 0, correctlyAbsent: 0 };
  const fields: Record<string, typeof counts> = {};
  const byFormat: Record<string, typeof counts> = {};
  for (const item of cases)
    for (const [path, expected] of Object.entries(item.expected)) {
      const actual = item.actual[path] ?? null;
      const state =
        expected === null
          ? actual === null
            ? "correctlyAbsent"
            : "wrong"
          : actual === null
            ? "missing"
            : actual === expected
              ? "correct"
              : "wrong";
      counts[state]++;
      fields[path] ??= { correct: 0, missing: 0, wrong: 0, correctlyAbsent: 0 };
      fields[path][state]++;
      byFormat[item.format] ??= {
        correct: 0,
        missing: 0,
        wrong: 0,
        correctlyAbsent: 0,
      };
      byFormat[item.format][state]++;
    }
  const readable = counts.correct + counts.missing + counts.wrong;
  const accuracy = readable ? counts.correct / readable : 0;
  if (accuracy < 0.95)
    reasons.push("Accuratezza dei campi leggibili inferiore al 95%.");
  const durations = cases.map((c) => c.durationMs).sort((a, b) => a - b);
  const percentile = (p: number) =>
    durations.length ? durations[Math.ceil(durations.length * p) - 1] : null;
  const p95 = percentile(0.95);
  if (p95 === null || p95 > 60000)
    reasons.push("Tempo p95 superiore a 60 secondi o non misurato.");
  if (cases.some((c) => c.costUsd === null))
    reasons.push("Alcuni costi dei tentativi non sono disponibili.");
  if (cases.some((c) => c.synthetic))
    reasons.push("Le fixture sintetiche non qualificano l'accuratezza reale.");
  return {
    qualified: reasons.length === 0,
    reasons,
    cases: cases.length,
    counts,
    fields,
    byFormat,
    accuracy,
    p50Ms: percentile(0.5),
    p95Ms: p95,
    totalReportedCostUsd: cases
      .reduce(
        (sum, c) => (c.costUsd ? sum.plus(c.costUsd) : sum),
        new Decimal(0),
      )
      .toString(),
  };
}
