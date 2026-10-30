import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { z } from "zod";

export const NORMALIZATION_VERSION = "au-ml-normalizer-v2";
export type Commodity = "electricity" | "gas";
export type SourceRecord = {
  [key: string]: string | SourceRecord | (string | SourceRecord)[];
};
const recordSchema: z.ZodType<SourceRecord> = z.lazy(() =>
  z.record(
    z.string(),
    z.union([
      z.string(),
      recordSchema,
      z.array(z.union([z.string(), recordSchema])),
    ]),
  ),
);
const decimal = z.string().regex(/^[+-]?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?$/);
export const intervalSchema = z.object({
  price: decimal.optional(),
  unit: z.string().optional(),
  band: z.string().optional(),
  source: recordSchema,
});
export const normalizedOfferSchema = z.object({
  code: z.string().min(1),
  supplierVat: z.string().min(1),
  commodity: z.enum(["electricity", "gas"]),
  name: z.string(),
  offerType: z.enum(["fixed", "variable", "mixed", "flat", "unknown"]),
  priceBandCode: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  economicFingerprint: z.string().length(64),
  indices: z.array(z.string()),
  components: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      macroarea: z.string(),
      intervals: z.array(intervalSchema),
      source: recordSchema,
    }),
  ),
  sourceRecord: recordSchema,
});
export type NormalizedOffer = z.infer<typeof normalizedOfferSchema>;
export const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
};
export const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export const records = (value: unknown): SourceRecord[] =>
  !value
    ? []
    : (Array.isArray(value) ? value : [value]).map((v) =>
        recordSchema.parse(v),
      );
export const field = (record: SourceRecord, key: string): string =>
  typeof record[key] === "string" ? (record[key] as string) : "";
export const child = (record: SourceRecord, key: string) =>
  records(record[key])[0] ?? {};

/** Portal dates are wall-clock Europe/Rome, including daylight saving. */
export function portalDate(value: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})_(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`Invalid official date: ${value}`);
  const [, d, mo, y, h, mi, s] = m;
  const wall = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  const calendar = new Date(wall);
  if (
    calendar.getUTCFullYear() !== +y ||
    calendar.getUTCMonth() !== +mo - 1 ||
    calendar.getUTCDate() !== +d ||
    calendar.getUTCHours() !== +h ||
    calendar.getUTCMinutes() !== +mi ||
    calendar.getUTCSeconds() !== +s
  )
    throw new Error(`Invalid official date: ${value}`);
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      fmt.formatToParts(instant).map((x) => [x.type, x.value]),
    );
    const displayed = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    instant += wall - displayed;
  }
  return new Date(instant).toISOString();
}
/** Excludes only documented TO2.0051 administrative changes; the original stays intact. */
export function economicRecord(record: SourceRecord): SourceRecord {
  const result = structuredClone(record);
  delete result.ValiditaOfferta;
  delete result.MetodoPagamento;
  delete result.OffertaCongiunta;
  const detail = child(result, "DettaglioOfferta");
  delete detail.ModalitaAttivazione;
  const contacts = child(detail, "Contatti");
  delete contacts.URL_OFFERTA;
  delete contacts.URL_SITO_VENDITORE;
  if (Object.keys(contacts).length) detail.Contatti = contacts;
  else delete detail.Contatti;
  result.DettaglioOfferta = detail;
  return result;
}
export function normalizeOffers(xml: string, commodity: Commodity) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("XML entities/DOCTYPE are forbidden");
  if (XMLValidator.validate(xml) !== true)
    throw new Error("Corrupt official XML");
  const parsed = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
    processEntities: false,
  }).parse(xml);
  const root = parsed.ListaOfferteMercatoLibero;
  if (!root || !root.offerta) throw new Error("Missing official offer list");
  const exclusions: Record<string, number> = {};
  const exclude = (reason: string) => {
    exclusions[reason] = (exclusions[reason] ?? 0) + 1;
  };
  const offers: NormalizedOffer[] = [];
  const identities = new Set<string>();
  for (const sourceRecord of records(root.offerta)) {
    const details = child(sourceRecord, "DettaglioOfferta");
    if (field(details, "TIPO_CLIENTE") !== "01") {
      exclude("non_domestic");
      continue;
    }
    if (field(details, "OFFERTA_SINGOLA") !== "SI") {
      exclude("dual_fuel");
      continue;
    }
    if (
      ![details.TIPOLOGIA_ATT_CONTR]
        .flat()
        .some((v) => typeof v === "string" && ["01", "99"].includes(v))
    ) {
      exclude("not_switch");
      continue;
    }
    const id = child(sourceRecord, "IdentificativiOfferta");
    const validity = child(sourceRecord, "ValiditaOfferta");
    const code = field(id, "COD_OFFERTA"),
      supplierVat = field(id, "PIVA_UTENTE");
    const key = `${supplierVat}:${code}`;
    if (identities.has(key))
      throw new Error(`Duplicate official identity ${key}`);
    identities.add(key);
    const type = field(details, "TIPO_OFFERTA");
    offers.push(
      normalizedOfferSchema.parse({
        code,
        supplierVat,
        commodity,
        name: field(details, "NOME_OFFERTA"),
        offerType:
          (
            {
              "01": "fixed",
              "02": "variable",
              "03": "flat",
              "04": "mixed",
            } as const
          )[type as "01"] ?? "unknown",
        priceBandCode:
          field(child(sourceRecord, "TipoPrezzo"), "TIPOLOGIA_FASCE") ||
          undefined,
        validFrom: portalDate(field(validity, "DATA_INIZIO")),
        validTo: portalDate(field(validity, "DATA_FINE")),
        economicFingerprint: digest(canonical(economicRecord(sourceRecord))),
        indices: records(sourceRecord.RiferimentiPrezzoEnergia).map((r) =>
          field(r, "IDX_PREZZO_ENERGIA"),
        ),
        components: records(sourceRecord.ComponenteImpresa).map((c) => ({
          name: field(c, "NOME"),
          type: field(c, "TIPOLOGIA"),
          macroarea: field(c, "MACROAREA"),
          source: c,
          intervals: records(c.IntervalloPrezzi).map((i) => ({
            price: field(i, "PREZZO") || undefined,
            unit: field(i, "UNITA_MISURA") || undefined,
            band: field(i, "FASCIA_COMPONENTE") || undefined,
            source: i,
          })),
        })),
        sourceRecord,
      }),
    );
  }
  return { offers, exclusions, total: records(root.offerta).length };
}
