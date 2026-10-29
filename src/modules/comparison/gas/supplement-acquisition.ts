import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import {
  child,
  field,
  type NormalizedOffer,
  records,
} from "../../catalog/normalize";
import { bundledReferences } from "../../references/registry";
import { evaluateDiscountCondition } from "../common";
import {
  type GasSaleSupplement,
  gasSaleSupplementSchema,
  requiresGasSaleSupplement,
} from "./supplement";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const ORIGIN = "https://www.ilportaleofferte.it";
const DETAIL = `${ORIGIN}/portaleOfferte/it/dettaglio_offerta_ml.page`;
function decode(text: string) {
  return text
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number: string) =>
      String.fromCodePoint(
        number[0].toLowerCase() === "x"
          ? Number.parseInt(number.slice(1), 16)
          : Number(number),
      ),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "€")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function plain(text: string) {
  return decode(text.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}
function italian(text: string) {
  return new D(text.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", "."));
}
function attributes(tag: string) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((m) => [
      m[1],
      decode(m[2] ?? m[3]),
    ]),
  );
}
function inputFields(html: string) {
  const result: Record<string, string> = {};
  for (const match of html.matchAll(/<input\b[^>]*>/gi)) {
    const a = attributes(match[0]);
    if (a.name) result[a.name] = a.value ?? "";
  }
  return result;
}
function detailFields(html: string) {
  const form =
    /<form\b[^>]*id=["']formDettaglioOffertaML["'][^>]*>([\s\S]*?)<\/form>/i.exec(
      html,
    );
  if (!form) throw new Error("Official detail form unavailable");
  return inputFields(form[1]);
}
export function parseGasSaleQuote(cost: string) {
  const sale =
    /Vendita di gas naturale<\/th>[\s\S]*?<strong>\s*€\s*([\d.,]+)<\/strong>/i.exec(
      cost,
    );
  if (!sale) throw new Error("Missing official gas sales subtotal");
  const end = /Tariffa per l(?:&#39;|&apos;|')uso/i.exec(cost)?.index ?? -1;
  if (end < 0)
    throw new Error("Missing boundary of official gas sales details");
  const section = cost.slice(0, end);
  let unit: "fixed" | "volume" | null = null,
    fixed = new D(0),
    rate = new D(0),
    fixedSeen = false,
    rateSeen = false;
  for (const match of section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [
      ...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
    ].map((m) => plain(m[1]));
    const text = cells.join(" ");
    const numericCell = [...cells]
      .reverse()
      .find((cell) => /^-?[\d.]+,\d+$/.test(cell));
    if (!numericCell && /Quota fissa.*anno/i.test(text)) {
      unit = "fixed";
      continue;
    }
    if (!numericCell && /Quota energia.*Smc/i.test(text)) {
      unit = "volume";
      continue;
    }
    if (/Sconto|Una.Tantum|Bonus/i.test(text) && /<strong>/i.test(match[1])) {
      unit = null;
      continue;
    }
    if (!unit) continue;
    const value = [...cells]
      .reverse()
      .find((cell) => /^-?[\d.]+,\d+$/.test(cell));
    if (!value) continue;
    if (unit === "fixed") {
      fixed = fixed.plus(italian(value));
      fixedSeen = true;
    } else {
      rate = rate.plus(italian(value));
      rateSeen = true;
    }
  }
  if (!fixedSeen || !rateSeen)
    throw new Error(
      "Official fixed and unit gas sales prices are both required",
    );
  return {
    fixedAnnual: fixed.toString(),
    unitRate: rate.toString(),
    observedSales: italian(sale[1]).toString(),
  };
}

export function parseGasTaxQuote(cost: string) {
  const values = new Map<string, string>();
  for (const match of cost.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [
      ...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
    ].map((m) => plain(m[1]));
    const key = cells[0]?.trim();
    if (!["Spesa annua stimata", "IVA 10%", "IVA 22%"].includes(key)) continue;
    if (values.has(key))
      throw new Error(`Ambiguous official gas aggregate row: ${key}`);
    const amount = cells.at(-1);
    if (!amount || !/^(?:€\s*)?-?[\d.]+,\d{1,2}(?:\s*€)?$/.test(amount))
      throw new Error(`Invalid official gas aggregate amount: ${key}`);
    values.set(key, italian(amount).toString());
  }
  const get = (key: string) => {
    const value = values.get(key);
    if (value === undefined)
      throw new Error(`Missing official gas aggregate row: ${key}`);
    return value;
  };
  return {
    annualTotal: get("Spesa annua stimata"),
    vat10: get("IVA 10%"),
    vat22: get("IVA 22%"),
  };
}
class PortalSession {
  private cookies = new Map<string, string>();
  constructor(private fetcher: typeof fetch) {}
  async read(path: string, fields?: Record<string, string>) {
    let url = new URL(path, ORIGIN),
      method = fields ? "POST" : "GET",
      body = fields ? new URLSearchParams(fields).toString() : undefined;
    for (let redirects = 0; redirects < 6; redirects++) {
      if (url.origin !== ORIGIN || url.username || url.password)
        throw new Error("Only official Portal requests are permitted");
      const headers: Record<string, string> = {
        "User-Agent": "LaMiaBolletta official-data qualification",
      };
      if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
      if (this.cookies.size)
        headers.Cookie = [...this.cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; ");
      const response = await this.fetcher(url, {
        method,
        headers,
        body,
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(60000),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";", 1)[0];
        const equal = pair.indexOf("=");
        if (equal > 0)
          this.cookies.set(pair.slice(0, equal), pair.slice(equal + 1));
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const target = response.headers.get("location");
        if (!target) throw new Error("Official redirect missing location");
        url = new URL(target, url);
        if ([301, 302, 303].includes(response.status)) {
          method = "GET";
          body = undefined;
        }
        continue;
      }
      if (!response.ok)
        throw new Error(`Official Portal HTTP ${response.status}`);
      return response.text();
    }
    throw new Error("Too many official redirects");
  }
  async validateOffer(code: string, portalCode: string) {
    // The validation call is JSON rather than the form body used by read().
    const url = `${ORIGIN}/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json`;
    const response = await this.fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: JSON.stringify({
        offertaConfrontoRequest: {
          codiceComune: portalCode,
          commodityType: "GAS",
          tipoCliente: "DOMESTICO",
          codiceOfferta: code,
        },
      }),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok)
      throw new Error(`Official offer validation HTTP ${response.status}`);
    await response.text();
  }
}
function qualificationLocality(offer: NormalizedOffer) {
  const refs = bundledReferences();
  const zones = records(offer.sourceRecord.ZoneOfferta);
  if (!zones.length) return { portalCode: "068028", name: "Pescara" };
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : [];
  const communes = new Set(zones.flatMap((z) => strings(z.COMUNE))),
    provinces = new Set(zones.flatMap((z) => strings(z.PROVINCIA))),
    regions = new Set(zones.flatMap((z) => strings(z.REGIONE)));
  const matchingRegionCodes = new Set(
    refs.municipalities
      .filter((m) => regions.has(m.regionCode))
      .flatMap((m) => m.portalCodes),
  );
  const matches = (code: string) =>
    communes.has(code) ||
    provinces.has(code.slice(0, 3)) ||
    matchingRegionCodes.has(code);
  const portal = refs.portalMunicipalities.find(
    (m) => !m.excludedGas && matches(m.code),
  );
  if (!portal)
    throw new Error("No qualified official locality in the offer territory");
  return { portalCode: portal.code, name: portal.name };
}
export async function acquireGasPortalQuote(
  offer: NormalizedOffer,
  volume: string,
  usage: "heating" | "cooking_hot_water",
  fetcher: typeof fetch,
  municipality: { portalCode: string; name: string },
) {
  const session = new PortalSession(fetcher);
  const initial = await session.read(
    `/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?tipoOfferta=gas&cap-comune=${encodeURIComponent(municipality.name)}&code-istat=${municipality.portalCode}&fornitura=`,
  );
  const token = inputFields(initial).csrf_token;
  if (!token) throw new Error("Official request token unavailable");
  await session.validateOffer(offer.code, municipality.portalCode);
  const fields: Record<string, string> = {
    commodityType: "gas",
    codiceIstatComune: municipality.portalCode,
    capComuneDescr: municipality.name,
    dove: "casa",
    codiceOffertaConfronto: offer.code,
    tipoOfferta:
      offer.offerType === "fixed" ? "prezzoFisso" : "prezzoVariabile",
    clienteVulnerabile: "NO",
    categoriaUsoCot: "CC",
    categoriaUsoAcq: "AC",
    classeContatore: "1",
    usaConsumi: "NO",
    conosciGas: "SI",
    ConsumoAnnuoGas: volume,
    mesiGas: "0",
    categoriaOfferta: "ALL",
    scontiCondizionati: "00",
    sconti: "00",
    idAttivazioneOfferta: "ALL",
    advancedFilter: "false",
    statoMisure: "",
    misureMensili: "",
    csrf_token: token,
    personeGas: "",
    superficieAbitazione: "",
    offertaName: "",
    codiceOfferta: "",
    prodServAggiuntivi: "",
    modalitaPagamento: "",
  };
  if (usage === "heating") fields.categoriaUsoRisc = "RISC";
  const listing = await session.read(
    "/portaleOfferte/it/confronta_offerte.page",
    fields,
  );
  const position = listing.indexOf(
    `<p class="codice_offerta"><strong>cod. </strong>${offer.code}`,
  );
  if (position < 0)
    throw new Error("Official offer unavailable for qualification");
  const selected = /vaiAlDettaglioML\(false,(\d+),true,(\d+),/.exec(
    listing.slice(position),
  );
  if (!selected) throw new Error("Official detail link unavailable");
  const detail = await session.read(DETAIL, {
    ...detailFields(listing),
    idOfferta: selected[1],
    idTipoOfferta: selected[2],
    isOffertaConfronto: "true",
  });
  const normalized = /name="currentFilterJSON"[^>]*value='([\s\S]*?)'/.exec(
    detail,
  );
  if (!normalized) throw new Error("Official normalized profile unavailable");
  const profile = JSON.parse(decode(normalized[1]));
  if (
    profile.codiceOffertaConfronto !== offer.code ||
    !new D(profile.consumoTotale).eq(volume) ||
    profile.commodityType !== "GAS" ||
    profile.categoriaUsoRisc !== (usage === "heating")
  )
    throw new Error(
      "Official normalized profile or offer differs from requested qualification",
    );
  const start = detail.indexOf('<h3 class="header_comp_sepsa"');
  const endings = [
    detail.indexOf("<script", start),
    detail.indexOf("</section>", start),
  ].filter((n) => n > start);
  if (start < 0 || !endings.length)
    throw new Error("Official cost fragment unavailable");
  const body = detail.slice(start, Math.min(...endings));
  if (/csrf|currentFilterJSON|sessionid/i.test(body))
    throw new Error("Refusing to archive a credential-bearing fragment");
  return { ...parseGasSaleQuote(body), body, volume, usage };
}
function xmlUnitPrices(offer: NormalizedOffer) {
  let fixed = new D(0),
    rate = new D(0);
  for (const c of offer.components) {
    if (c.macroarea === "06" && c.type === "02") continue;
    if (c.intervals.length !== 1)
      throw new Error(
        "Supplement cohort requires one declared interval per component",
      );
    const interval = c.intervals[0];
    if (
      interval.price === undefined ||
      field(interval.source, "CONSUMO_DA") ||
      field(interval.source, "CONSUMO_A") ||
      Object.keys(child(interval.source, "PeriodoValidita")).length
    )
      throw new Error(
        "Supplement cohort contains time or consumption dependent pricing",
      );
    if (interval.unit === "01") fixed = fixed.plus(interval.price);
    else if (interval.unit === "04") rate = rate.plus(interval.price);
    else throw new Error("Supplement cohort has an unqualified unit");
  }
  return { fixed, rate };
}
function salesDiscount(offer: NormalizedOffer) {
  for (const s of records(offer.sourceRecord.Sconto)) {
    if (
      !evaluateDiscountCondition(s).applicable ||
      !["01", "02"].includes(field(s, "VALIDITA"))
    )
      continue;
    for (const p of records(s.PrezziSconto)) {
      if (field(p, "TIPOLOGIA") !== "01")
        throw new Error(
          "Supplement sales discount requires dedicated qualification",
        );
    }
  }
  // Fixed/unatantum discounts are deducted later from annual net/tax totals;
  // the Portal's Sales subtotal and unit-price rows remain gross of these.
  return new D(0);
}

export async function acquireGasSaleSupplement(
  offer: NormalizedOffer,
  options: {
    fetcher?: typeof fetch;
    clock?: () => Date;
    source?: { sourceDate: string; sha256: string };
    archive: (path: string, body: string) => Promise<void>;
  },
): Promise<GasSaleSupplement> {
  if (!requiresGasSaleSupplement(offer))
    throw new Error(
      "Offer is outside the structurally qualified gas supplement cohort",
    );
  const original = xmlUnitPrices(offer);
  const municipality = qualificationLocality(offer);
  const fetcher = options.fetcher ?? fetch;
  const evidence: GasSaleSupplement["evidence"] = [];
  let fixed: Decimal | undefined, rate: Decimal | undefined;
  for (const [i, probe] of [
    { volume: "600", usage: "heating" as const },
    { volume: "1200", usage: "heating" as const },
    { volume: "2400", usage: "cooking_hot_water" as const },
  ].entries()) {
    const observed = await acquireGasPortalQuote(
      offer,
      probe.volume,
      probe.usage,
      fetcher,
      municipality,
    );
    const f = new D(observed.fixedAnnual),
      r = new D(observed.unitRate);
    if ((fixed && !fixed.eq(f)) || (rate && !rate.eq(r)))
      throw new Error(
        "Official gas unit prices differ across volumes or profiles",
      );
    fixed = f;
    rate = r;
    const expected = f.plus(r.mul(probe.volume)).minus(salesDiscount(offer));
    if (!expected.toDecimalPlaces(2).eq(observed.observedSales))
      throw new Error(
        "Official unit prices and structured discounts do not reproduce the independent sales holdout",
      );
    const sha256 = createHash("sha256").update(observed.body).digest("hex"),
      originalPath = `gas-sales/${offer.economicFingerprint}/${sha256}.html.txt`;
    await options.archive(originalPath, observed.body);
    evidence.push({
      kind: i === 2 ? "holdout" : "calibration",
      municipality,
      volume: probe.volume,
      usage: probe.usage,
      observedSales: observed.observedSales,
      fixedAnnual: f.toString(),
      unitRate: r.toString(),
      sourceUrl: DETAIL,
      observedAt: (options.clock?.() ?? new Date()).toISOString(),
      sha256,
      originalPath,
    });
  }
  if (!fixed || !rate) throw new Error("Missing qualified unit prices");
  return gasSaleSupplementSchema.parse({
    schemaVersion: 1,
    commodity: "gas",
    offerCode: offer.code,
    supplierVat: offer.supplierVat,
    economicFingerprint: offer.economicFingerprint,
    method: "official-detail-unit-sales-v1",
    observedAt: evidence.at(-1)?.observedAt,
    ...(options.source
      ? {
          sourceDate: options.source.sourceDate,
          catalogSourceSha256: options.source.sha256,
        }
      : {}),
    fixedAnnual: fixed.toString(),
    unitRate: rate.toString(),
    xmlFixedAnnual: original.fixed.toString(),
    xmlUnitRate: original.rate.toString(),
    additionalFixedAnnual: fixed.minus(original.fixed).toString(),
    additionalUnitRate: rate.minus(original.rate).toString(),
    evidence,
  });
}
