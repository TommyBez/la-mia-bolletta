import Decimal from "decimal.js";
import { z } from "zod";

const decimal = z
  .string()
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,12})?$/,
    "Inserisci un numero decimale non negativo, usando il punto.",
  );
const period = z.object({ from: z.iso.date(), to: z.iso.date() });
export const ProfileCandidateSchema = z.object({
  schemaVersion: z.literal(1),
  supplyContext: z.object({
    domestic: z.literal(true),
    active: z.literal(true),
    operation: z.literal("switch_same_holder"),
  }),
  commodity: z.enum(["electricity", "gas"]),
  municipality: z.object({
    portalCode: z.string().regex(/^\d{6}$/),
    name: z.string().min(1),
  }),
  annualConsumption: z.object({
    value: decimal,
    unit: z.enum(["kWh", "Smc", "m3"]),
    kind: z.enum(["measured", "estimated", "declared"]),
    period,
  }),
  electricity: z
    .object({
      powerKw: decimal,
      resident: z.boolean(),
      bands: z.object({ F1: decimal, F2: decimal, F3: decimal }).optional(),
      useConventionalBands: z.boolean().optional(),
    })
    .optional(),
  gas: z
    .object({
      usage: z.enum(["cooking_hot_water", "heating", "technology"]),
      meterClass: z
        .string()
        .regex(/^G(?:1\.6|2\.5|4|6|10|16|25|40|65|100|160|250)$/),
    })
    .optional(),
  origin: z.enum(["manual", "document", "client_mcp"]),
  confirmed: z.boolean(),
  revision: z.number().int().nonnegative().default(0),
  provenance: z
    .record(
      z.string(),
      z.object({
        origin: z.enum([
          "manual",
          "document",
          "client_mcp",
          "official_derivation",
        ]),
        documentId: z.string().optional(),
        fileId: z.string().optional(),
        page: z.number().int().positive().optional(),
        excerpt: z.string().max(2000).optional(),
      }),
    )
    .optional(),
});
export type ProfileCandidate = z.input<typeof ProfileCandidateSchema>;
export type FieldProvenance = NonNullable<
  z.output<typeof ProfileCandidateSchema>["provenance"]
>[string];
export type ConfirmedProfile = z.output<typeof ProfileCandidateSchema> & {
  confirmed: true;
  provenance: Record<string, FieldProvenance>;
  assumptions: { code: string; description: string; source: string }[];
};
export type ProfileIssue = { path: string; message: string };
export type ProfileValidation =
  | { status: "ready"; profile: ConfirmedProfile }
  | { status: "needs_input"; issues: ProfileIssue[] };

/** Common web/manual/MCP interface. No document, account or session is required. */
export function validateProfile(input: unknown): ProfileValidation {
  const parsed = ProfileCandidateSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: "needs_input",
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.join(".");
        const labels: Record<string, string> = {
          supplyContext:
            "Conferma che la fornitura è domestica, già attiva e con lo stesso intestatario.",
          municipality: "Indica il comune della fornitura.",
          "municipality.name": "Indica il nome del comune.",
          "municipality.portalCode":
            "Inserisci il codice ISTAT del comune (6 cifre).",
          annualConsumption: "Indica il consumo annuo e il relativo periodo.",
          "annualConsumption.value":
            "Inserisci un consumo annuo numerico, con punto o virgola per i decimali.",
          "annualConsumption.unit": "Verifica l'unità di misura del consumo.",
          "annualConsumption.kind":
            "Indica se il consumo è misurato, stimato o dichiarato da te.",
          "annualConsumption.period":
            "Indica il periodo completo del consumo annuo.",
          "annualConsumption.period.from": "Indica una data di inizio valida.",
          "annualConsumption.period.to": "Indica una data di fine valida.",
          "electricity.resident": "Indica esplicitamente se sei residente.",
          "electricity.powerKw": "Inserisci la potenza impegnata in kW.",
          "gas.usage": "Seleziona l'uso del gas.",
          "gas.meterClass": "Indica la classe del contatore (ad esempio G4).",
        };
        return {
          path,
          message:
            labels[path] ??
            (path.startsWith("electricity.bands.")
              ? "Inserisci i consumi numerici di tutte e tre le fasce."
              : path.startsWith("supplyContext.")
                ? labels.supplyContext
                : issue.message),
        };
      }),
    };
  const profile = parsed.data;
  if (!profile.confirmed)
    return {
      status: "needs_input",
      issues: [
        { path: "confirmed", message: "Conferma i dati prima di continuare." },
      ],
    };
  const issues: ProfileIssue[] = [];
  const from = new Date(`${profile.annualConsumption.period.from}T00:00:00Z`);
  const afterTo = new Date(`${profile.annualConsumption.period.to}T00:00:00Z`);
  afterTo.setUTCDate(afterTo.getUTCDate() + 1);
  const afterYear = new Date(from);
  afterYear.setUTCFullYear(afterYear.getUTCFullYear() + 1);
  if (afterYear.getTime() !== afterTo.getTime())
    issues.push({
      path: "annualConsumption.period",
      message:
        "Servono i consumi di un anno intero, non quelli del periodo fatturato.",
    });
  if (
    profile.annualConsumption.unit !==
    (profile.commodity === "electricity" ? "kWh" : "Smc")
  )
    issues.push({
      path: "annualConsumption.unit",
      message:
        "Per la luce usa kWh; per il gas servono Smc, non metri cubi non corretti.",
    });
  if (profile.commodity === "electricity") {
    if (!profile.electricity)
      issues.push({
        path: "electricity",
        message: "Indica potenza e residenza della fornitura luce.",
      });
    else {
      if (new Decimal(profile.electricity.powerKw).lte(0))
        issues.push({
          path: "electricity.powerKw",
          message: "La potenza deve essere maggiore di zero.",
        });
      const bands = profile.electricity.bands;
      if (bands && profile.electricity.useConventionalBands) {
        const annual = new Decimal(profile.annualConsumption.value);
        if (
          !new Decimal(bands.F1).eq(annual.mul("0.33")) ||
          !new Decimal(bands.F2).eq(annual.mul("0.31")) ||
          !new Decimal(bands.F3).eq(annual.mul("0.36"))
        )
          issues.push({
            path: "electricity.bands",
            message:
              "Le fasce inserite non coincidono con il profilo convenzionale confermato: scegli uno dei due metodi.",
          });
      }
      if (!bands && !profile.electricity.useConventionalBands)
        issues.push({
          path: "electricity.bands",
          message:
            "Inserisci le fasce o conferma la ripartizione convenzionale.",
        });
      if (
        bands &&
        !new Decimal(bands.F1)
          .plus(bands.F2)
          .plus(bands.F3)
          .eq(profile.annualConsumption.value)
      )
        issues.push({
          path: "electricity.bands",
          message: "La somma delle fasce deve coincidere con il consumo annuo.",
        });
    }
  } else if (profile.gas?.usage === "technology")
    issues.push({
      path: "gas.usage",
      message:
        "L'uso tecnologico appartiene al percorso non domestico del Portale, fuori da questa prima versione. Controlla la categoria della fornitura.",
    });
  else if (!profile.gas)
    issues.push({
      path: "gas",
      message: "Indica uso del gas e classe del contatore.",
    });
  if (issues.length) return { status: "needs_input", issues };
  const provenance: Record<string, FieldProvenance> = { ...profile.provenance };
  for (const path of [
    "municipality",
    "annualConsumption.value",
    "annualConsumption.unit",
    "annualConsumption.period",
    profile.commodity,
  ]) {
    if (!provenance[path]) provenance[path] = { origin: profile.origin };
  }
  const assumptions: ConfirmedProfile["assumptions"] = [];
  if (
    profile.commodity === "electricity" &&
    profile.electricity &&
    profile.electricity.useConventionalBands
  ) {
    const annual = new Decimal(profile.annualConsumption.value);
    profile.electricity.bands = {
      F1: annual.mul("0.33").toString(),
      F2: annual.mul("0.31").toString(),
      F3: annual.mul("0.36").toString(),
    };
    const source =
      "https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf";
    assumptions.push({
      code: "official-domestic-bands",
      description:
        "Ripartizione domestica convenzionale F1 33%, F2 31%, F3 36%, confermata dall'utente (Regole v4.2 p.9).",
      source,
    });
    provenance["electricity.bands"] = { origin: "official_derivation" };
  }
  return {
    status: "ready",
    profile: { ...profile, confirmed: true, provenance, assumptions },
  };
}
