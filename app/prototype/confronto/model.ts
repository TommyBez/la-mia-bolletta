// Synthetic fixtures for a throwaway UX prototype. No market data or tariff engine.
export type Supply = "luce" | "gas";
export type DemoCase = "standard" | "incerto" | "incompleto" | "resta";

export interface Profile {
  city: string;
  consumption: number;
  power: string;
  resident: boolean;
}

export interface Offer {
  id: string;
  name: string;
  supplier: string;
  kind: "Fisso" | "Variabile";
  annual: number;
  duration: string;
  code: string;
  requirements: string[];
}

export interface Comparison {
  supply: Supply;
  unit: string;
  offers: Offer[];
  recommended: Offer;
  currentAnnual: number | null;
  savings: number | null;
  keepCurrent: boolean;
  conditional: boolean;
  headline: string;
  explanation: string;
  scenarios: { label: string; current: number | null; alternative: number }[];
}

export interface VariantProps {
  comparison: Comparison;
  profile: Profile;
  onOffer: (offer: Offer) => void;
  onReviewProfile: () => void;
  onShowRanking: () => void;
  onShowMethod: () => void;
}

export const money = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export const decimal = (value: number) =>
  new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(value);

export const initialProfiles: Record<Supply, Profile> = {
  luce: { city: "Milano", consumption: 2700, power: "3", resident: true },
  gas: { city: "Milano", consumption: 1100, power: "", resident: true },
};

export function makeComparison(
  supply: Supply,
  profile: Profile,
  demoCase: DemoCase,
  fixedOnly: boolean,
): Comparison {
  const gas = supply === "gas";
  const ratio = profile.consumption / (gas ? 1100 : 2700);
  const cost = (base: number) => Math.round(base * (0.35 + 0.65 * ratio));
  const offers: Offer[] = [
    {
      id: "a",
      name: gas ? "Gas Leggero" : "Luce Leggera",
      supplier: "Fornitore esempio A",
      kind: "Variabile",
      annual: cost(gas ? 1076 : 764),
      duration: "Condizioni commerciali per 12 mesi",
      code: `DEMO-${supply.toUpperCase()}-001`,
      requirements: ["Addebito diretto sul conto", "Bolletta digitale"],
    },
    {
      id: "b",
      name: gas ? "Gas Serena" : "Luce Serena",
      supplier: "Fornitore esempio B",
      kind: "Fisso",
      annual: cost(gas ? 1130 : 812),
      duration: "Prezzo della materia energia fisso per 12 mesi",
      code: `DEMO-${supply.toUpperCase()}-002`,
      requirements: ["Addebito diretto sul conto", "Bolletta digitale"],
    },
    {
      id: "c",
      name: gas ? "Gas Semplice" : "Luce Semplice",
      supplier: "Fornitore esempio C",
      kind: "Fisso",
      annual: cost(gas ? 1220 : 896),
      duration: "Prezzo della materia energia fisso per 24 mesi",
      code: `DEMO-${supply.toUpperCase()}-003`,
      requirements: [
        "Bolletta digitale",
        "Pagamento con bollettino o addebito",
      ],
    },
  ];
  const recommended = offers[fixedOnly ? 1 : 0];
  const currentAnnual =
    demoCase === "incompleto"
      ? null
      : cost(demoCase === "resta" ? (gas ? 900 : 650) : gas ? 1400 : 1040);
  const savings =
    currentAnnual === null ? null : currentAnnual - recommended.annual;
  const keepCurrent = savings !== null && savings <= 0;
  const conditional = demoCase === "incerto" && !fixedOnly;
  return {
    supply,
    unit: gas ? "Smc" : "kWh",
    offers,
    recommended,
    currentAnnual,
    savings,
    keepCurrent,
    conditional,
    headline: keepCurrent
      ? "Per ora, ti conviene restare."
      : conditional
        ? "Puoi spendere meno. Dipende dai prezzi."
        : currentAnnual === null
          ? "Una buona partenza, anche senza tutti i dati."
          : fixedOnly
            ? "Meno spesa. Più stabilità."
            : "La tua energia, un po’ più leggera.",
    explanation: keepCurrent
      ? "Nel confronto dimostrativo, la tua offerta costa meno delle alternative. Non serve cambiare a ogni costo."
      : conditional
        ? "Questa offerta è la più economica nello scenario centrale. Se il prezzo dell’energia sale, il vantaggio rispetto all’attuale può scomparire."
        : currentAnnual === null
          ? "Possiamo confrontare le alternative per i tuoi consumi. Per stimare il risparmio servono anche prezzo dell’energia e quota fissa del tuo contratto attuale."
          : fixedOnly
            ? "Tra le offerte a prezzo fisso dell’esempio, questa ha il costo annuo stimato più basso. Rimane fisso il prezzo dell’energia, non l’intera bolletta."
            : "Per i tuoi consumi, questa è l’offerta con il costo annuo stimato più basso tra le alternative dell’esempio.",
    scenarios: [
      {
        label: "Prezzi in calo",
        current: currentAnnual,
        alternative: fixedOnly ? recommended.annual : cost(gas ? 960 : 692),
      },
      {
        label: "Scenario centrale",
        current: currentAnnual,
        alternative: recommended.annual,
      },
      {
        label: "Prezzi in aumento",
        current: currentAnnual,
        alternative: fixedOnly
          ? recommended.annual
          : cost(conditional ? (gas ? 1510 : 1112) : gas ? 1180 : 840),
      },
    ],
  };
}
