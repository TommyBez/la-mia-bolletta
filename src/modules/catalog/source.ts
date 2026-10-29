import { type Commodity, digest } from "./normalize";
export const OPEN_DATA_URL =
  "https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page";
export type SourceLink = { url: string; sourceDate: string };
export type SourceFile = SourceLink & {
  kind: "offers" | "parameters";
  body: string;
  sha256: string;
  acquiredAt: string;
  etag?: string;
};
export type CatalogSource = {
  acquire(commodity: Commodity): Promise<SourceFile[]>;
};
const origin = "https://www.ilportaleofferte.it";
export function discoverSources(
  html: string,
  commodity: Commodity,
): { offers: SourceLink; parameters: SourceLink } {
  const code = commodity === "electricity" ? "E" : "G";
  const urls = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(
    (m) => new URL(m[1].replace(/&amp;/g, "&"), origin),
  );
  const select = (pattern: RegExp): SourceLink => {
    const links = urls
      .filter((u) => u.origin === origin && pattern.test(u.pathname))
      .sort((a, b) => b.pathname.localeCompare(a.pathname));
    if (!links.length)
      throw new Error(`Missing official ${commodity} source ${pattern}`);
    const url = links[0],
      match = /_(\d{4})(\d{2})(\d{2})\.(?:xml|csv)$/.exec(url.pathname);
    if (!match) throw new Error("Missing official source date");
    return { url: url.href, sourceDate: `${match[1]}-${match[2]}-${match[3]}` };
  };
  const offers = select(
    new RegExp(`/offerteML/[^/]+/PO_Offerte_${code}_MLIBERO_\\d{8}\\.xml$`),
  );
  const parameters = select(
    new RegExp(
      `/parametriML/[^/]+/PO_Parametri_Mercato_Libero_${code}_\\d{8}\\.csv$`,
    ),
  );
  if (offers.sourceDate !== parameters.sourceDate)
    throw new Error("Official offers and parameters publication dates differ");
  return { offers, parameters };
}
export function createOfficialSource(
  fetcher: typeof fetch = fetch,
): CatalogSource {
  const read = async (url: string) => {
    let response: Response;
    try {
      response = await fetcher(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(60000),
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      const code =
        cause && typeof cause === "object" && "code" in cause
          ? String(cause.code)
          : error instanceof Error
            ? error.name
            : "network_error";
      throw new Error(`Official source network failure ${code}: ${url}`, {
        cause: error,
      });
    }
    if (!response.ok)
      throw new Error(`Official source HTTP ${response.status}: ${url}`);
    if (new URL(response.url || url).origin !== origin)
      throw new Error("Source redirected outside official Portal");
    return response;
  };
  return {
    async acquire(commodity) {
      const page = await read(OPEN_DATA_URL);
      const links = discoverSources(await page.text(), commodity);
      const files: SourceFile[] = [];
      for (const kind of ["offers", "parameters"] as const) {
        const link = links[kind];
        const response = await read(link.url);
        const body = await response.text();
        if (!body.trim()) throw new Error(`Empty ${kind} source`);
        files.push({
          ...link,
          kind,
          body,
          sha256: digest(body),
          acquiredAt: new Date().toISOString(),
          etag: response.headers.get("etag") ?? undefined,
        });
      }
      return files;
    },
  };
}
/** Quoted semicolon CSV, including embedded newlines; values remain decimal strings. */
export function parseParameters(csv: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const delimiter = csv.split(/\r?\n/, 1)[0].includes(";") ? ";" : ",";
  const matrix: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) matrix.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Unterminated parameter CSV quote");
  row.push(cell);
  if (row.some((v) => v.trim())) matrix.push(row);
  const headers = matrix.shift()?.map((h) => h.replace(/^\uFEFF/, "").trim());
  if (!headers?.length || !matrix.length)
    throw new Error("Empty parameter CSV");
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate CSV columns");
  const rows = matrix.map((values, i) => {
    if (values.length !== headers.length)
      throw new Error(`Corrupt parameter CSV row ${i + 2}`);
    return Object.fromEntries(headers.map((h, j) => [h, values[j].trim()]));
  });
  if (
    !["nome_parametro", "valore", "descrizione"].every((key) =>
      headers.includes(key),
    )
  )
    throw new Error("Invalid official parameter columns");
  const names = new Set<string>();
  for (const row of rows) {
    if (
      !row.nome_parametro ||
      names.has(row.nome_parametro) ||
      !/^[-+]?\d+(?:\.\d+)?(?:[Ee][-+]?\d+)?$/.test(row.valore)
    )
      throw new Error(`Invalid official parameter ${row.nome_parametro}`);
    names.add(row.nome_parametro);
  }
  return { headers, rows };
}
