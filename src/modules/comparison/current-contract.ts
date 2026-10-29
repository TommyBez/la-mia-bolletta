import Decimal from "decimal.js";
import { z } from "zod";
import type { ConfirmedProfile } from "../../domain/profile";
import { canonical, digest, type SourceRecord } from "../catalog/normalize";
import type { ConfirmedBillContractInput } from "./contracts";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const amount = z.string().regex(/^-?\d+(?:\.\d+)?$/);
const commonConditions = z.object({
  confirmed: z.literal(true),
  fixedAnnualCharge: amount,
  validFrom: z.iso.date(),
  validTo: z.iso.date(),
  allCommercialChargesIncluded: z.literal(true),
  offerCode: z.string().max(100).optional(),
  supplierName: z.string().max(200).optional(),
  sourceRef: z.string().max(200).optional(),
});
const billConditions = z.discriminatedUnion("priceKind", [
  commonConditions.extend({ priceKind: z.literal("fixed"), unitPrice: amount }),
  commonConditions.extend({
    priceKind: z.literal("variable"),
    index: z.enum(["PUN", "PSV"]),
    indexMultiplier: amount.refine(
      (value) => Number(value) >= 0 && Number(value) <= 2,
    ),
    spread: amount,
    indexIncludesNetworkLosses: z.boolean().optional(),
  }),
]);

/** A billed total or a historic variable unit price cannot become future prices. */
export function reconstructBillContract(
  input: unknown,
  profile: ConfirmedProfile,
):
  | { status: "comparable"; contract: ConfirmedBillContractInput }
  | { status: "incomplete"; reasons: string[] } {
  const parsed = billConditions.safeParse(input);
  if (!parsed.success)
    return {
      status: "incomplete",
      reasons: [
        "Servono tutte le condizioni commerciali confermate e le date di applicabilità. Per un prezzo variabile occorrono indice, coefficiente e spread; il prezzo passato da solo non basta.",
      ],
    };
  const c = parsed.data;
  if (
    c.priceKind === "variable" &&
    (c.index !== (profile.commodity === "gas" ? "PSV" : "PUN") ||
      (profile.commodity === "electricity" &&
        c.indexIncludesNetworkLosses !== true))
  )
    return {
      status: "incomplete",
      reasons: [
        "La formula confermata deve corrispondere all'indice della fornitura; per PUN monorario va confermata l'applicazione delle perdite di rete all'indice.",
      ],
    };
  if (c.validFrom > c.validTo)
    return {
      status: "incomplete",
      reasons: ["Le date delle condizioni attuali non sono coerenti."],
    };
  const unit = profile.commodity === "electricity" ? "03" : "04";
  const variable =
    c.priceKind === "variable" && !new D(c.indexMultiplier).isZero();
  const priceKind = variable ? "variable" : "fixed";
  // Official electricity coefficients weight both index and energy component.
  // The bill form expresses coefficient × PUN (with losses) + independent spread.
  // Adapt that representation here; retain the official calculator semantics.
  const energyPrice =
    c.priceKind === "fixed"
      ? c.unitPrice
      : variable && profile.commodity === "electricity"
        ? new D(c.spread).div(c.indexMultiplier).toFixed()
        : c.spread;
  const components: SourceRecord[] = [
    {
      NOME: "Prezzo energia confermato",
      TIPOLOGIA: "01",
      MACROAREA: "04",
      IntervalloPrezzi: { PREZZO: energyPrice, UNITA_MISURA: unit },
    },
    {
      NOME: "Quota commerciale annua confermata",
      TIPOLOGIA: "01",
      MACROAREA: "01",
      IntervalloPrezzi: { PREZZO: c.fixedAnnualCharge, UNITA_MISURA: "01" },
    },
  ];
  const code = c.offerCode || "current-confirmed-bill";
  const sourceRecord: SourceRecord = {
    IdentificativiOfferta: {
      COD_OFFERTA: code,
      PIVA_UTENTE: "confirmed-bill",
      RAGIONE_SOCIALE: c.supplierName || "Contratto attuale",
    },
    DettaglioOfferta: {
      TIPO_OFFERTA: priceKind === "fixed" ? "01" : "02",
      TIPO_CLIENTE: "01",
      NOME_OFFERTA: "Le condizioni attuali confermate",
    },
    ComponenteImpresa: components,
    ...(c.priceKind === "variable" && variable
      ? {
          RiferimentiPrezzoEnergia: {
            IDX_PREZZO_ENERGIA: c.index === "PSV" ? "14" : "12",
            COEFFICIENTE: c.indexMultiplier,
          },
        }
      : {}),
  };
  return {
    status: "comparable",
    contract: {
      applicableFrom: c.validFrom,
      applicableTo: c.validTo,
      confirmed: true,
      source: {
        kind: "confirmed_bill",
        reference: c.sourceRef || "bill-conditions-confirmed-by-user",
      },
      offer: {
        code,
        supplierVat: "confirmed-bill",
        commodity: profile.commodity,
        name: "Le condizioni attuali confermate",
        offerType: priceKind,
        priceBandCode: profile.commodity === "electricity" ? "01" : undefined,
        validFrom: `${c.validFrom}T00:00:00.000Z`,
        validTo: `${c.validTo}T23:59:59.999Z`,
        economicFingerprint: digest(canonical(sourceRecord)),
        indices:
          c.priceKind === "variable" && variable
            ? [c.index === "PSV" ? "14" : "12"]
            : [],
        sourceRecord,
        components: components.map((source, index) => ({
          name:
            index === 0
              ? "Prezzo energia confermato"
              : "Quota commerciale annua confermata",
          type: "01",
          macroarea: index === 0 ? "04" : "01",
          source,
          intervals: [
            {
              price: index === 0 ? energyPrice : c.fixedAnnualCharge,
              unit: index === 0 ? unit : "01",
              source: {
                PREZZO: index === 0 ? energyPrice : c.fixedAnnualCharge,
                UNITA_MISURA: index === 0 ? unit : "01",
              },
            },
          ],
        })),
      },
    },
  };
}
