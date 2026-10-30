import Decimal from "decimal.js";
import { z } from "zod";
import type { NormalizedOffer } from "../../catalog/normalize";

const amount = z.string().regex(/^-?\d+(?:\.\d+)?$/);
export const gasSaleSupplementSchema = z
  .object({
    schemaVersion: z.literal(1),
    commodity: z.literal("gas"),
    offerCode: z.string(),
    supplierVat: z.string(),
    economicFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    method: z.literal("official-detail-unit-sales-v1"),
    observedAt: z.iso.datetime({ offset: true }),
    sourceDate: z.iso.date().optional(),
    catalogSourceSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    fixedAnnual: amount,
    unitRate: amount,
    xmlFixedAnnual: amount,
    xmlUnitRate: amount,
    additionalFixedAnnual: amount,
    additionalUnitRate: amount,
    evidence: z
      .array(
        z.object({
          kind: z.enum(["calibration", "holdout"]),
          municipality: z.object({
            portalCode: z.string().regex(/^\d{6}$/),
            name: z.string(),
          }),
          volume: amount,
          usage: z.enum(["heating", "cooking_hot_water"]),
          observedSales: amount,
          fixedAnnual: amount,
          unitRate: amount,
          sourceUrl: z.url(),
          observedAt: z.iso.datetime({ offset: true }),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          originalPath: z
            .string()
            .regex(/^gas-sales\/[a-f0-9]{64}\/[a-f0-9]{64}\.html\.txt$/),
        }),
      )
      .length(3),
  })
  .superRefine((value, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    try {
      if (!!value.sourceDate !== !!value.catalogSourceSha256)
        issue(
          "Both daily catalog source date and checksum are required together",
        );
      if (
        !new Decimal(value.xmlFixedAnnual)
          .plus(value.additionalFixedAnnual)
          .eq(value.fixedAnnual) ||
        !new Decimal(value.xmlUnitRate)
          .plus(value.additionalUnitRate)
          .eq(value.unitRate)
      )
        issue(
          "Qualified gas supplement deltas do not match the observed unit prices",
        );
      if (
        value.evidence.filter((e) => e.kind === "calibration").length !== 2 ||
        value.evidence.filter((e) => e.kind === "holdout").length !== 1 ||
        new Set(value.evidence.map((e) => new Decimal(e.volume).toString()))
          .size !== 3 ||
        !value.evidence.some(
          (e) => e.kind === "holdout" && e.usage === "cooking_hot_water",
        )
      )
        issue(
          "Two different calibration volumes and an independent C2 holdout are required",
        );
      for (const evidence of value.evidence) {
        if (
          !new Decimal(evidence.volume).gt(0) ||
          !new Decimal(evidence.fixedAnnual).eq(value.fixedAnnual) ||
          !new Decimal(evidence.unitRate).eq(value.unitRate) ||
          !new Decimal(evidence.fixedAnnual)
            .plus(new Decimal(evidence.unitRate).mul(evidence.volume))
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .eq(evidence.observedSales)
        )
          issue("Official unit prices must agree in every independent probe");
        if (
          evidence.originalPath !==
          `gas-sales/${value.economicFingerprint}/${evidence.sha256}.html.txt`
        )
          issue(
            "Supplement proof path does not match its fingerprint and content hash",
          );
        const source = new URL(evidence.sourceUrl);
        if (
          source.origin !== "https://www.ilportaleofferte.it" ||
          source.pathname !== "/portaleOfferte/it/dettaglio_offerta_ml.page"
        )
          issue(
            "Only the official Portal detail is a qualified supplemental source",
          );
      }
    } catch {
      issue("Supplement contains an invalid financial value or source URL");
    }
  });
export type GasSaleSupplement = z.infer<typeof gasSaleSupplementSchema>;
/** Structural cohort, independent of seller names or a cheap-looking price. */
export function requiresGasSaleSupplement(offer: NormalizedOffer) {
  const energy = offer.components.filter((c) => c.macroarea === "04");
  return (
    offer.commodity === "gas" &&
    offer.offerType === "fixed" &&
    energy.length > 0 &&
    energy.every((c) => c.type === "02") &&
    !offer.components.some((c) => c.macroarea === "06" && c.type === "01")
  );
}
