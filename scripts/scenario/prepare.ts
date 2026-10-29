#!/usr/bin/env -S node --import tsx
/** Build a reviewable monthly plan from the published official catalog, without stable offer IDs. */
import { writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";
import { z } from "zod";
import { getDb } from "../../src/db";
import type { NormalizedOffer } from "../../src/modules/catalog/normalize";
import { createBlobOriginalStore } from "../../src/modules/catalog/originals";
import { createCatalogService } from "../../src/modules/catalog/service";
import { createOfficialSource } from "../../src/modules/catalog/source";
import { scenarioWindow } from "../../src/modules/scenario";

function simpleProbe(offer: NormalizedOffer, commodity: "electricity" | "gas") {
  if (
    offer.offerType !== "variable" ||
    offer.sourceRecord.Sconto ||
    offer.sourceRecord.ComponentiRegolate ||
    offer.components.length !== 2
  )
    return undefined;
  if (
    offer.indices.length !== 1 ||
    !(
      commodity === "electricity"
        ? ["01", "08", "12"]
        : ["03", "10", "14", "15"]
    ).includes(offer.indices[0])
  )
    return undefined;
  const fixed = offer.components.find(
    (c) => c.intervals.length === 1 && c.intervals[0].unit === "01",
  );
  const spread = offer.components.find(
    (c) =>
      c.intervals.length > 0 &&
      c.intervals.every(
        (i) => i.unit === (commodity === "electricity" ? "03" : "04"),
      ),
  );
  if (
    !fixed ||
    !spread ||
    !fixed.intervals[0].price ||
    spread.intervals.some((i) => !i.price)
  )
    return undefined;
  const spreadPrice = spread.intervals[0].price;
  if (!spreadPrice) return undefined;
  if (
    !spread.intervals.every(
      (i) => i.price && new Decimal(i.price).eq(spreadPrice),
    )
  )
    return undefined;
  // Intervals, percentages, periods and nested variable-price branches need their own recipe.
  for (const component of [fixed, spread])
    for (const interval of component.intervals)
      if (
        Object.keys(interval.source).some(
          (k) => !["PREZZO", "UNITA_MISURA", "FASCIA_COMPONENTE"].includes(k),
        )
      )
        return undefined;
  if (commodity === "electricity") {
    const dispatch = offer.sourceRecord.Dispacciamento;
    const rows = Array.isArray(dispatch) ? dispatch : [dispatch];
    if (
      rows.length !== 1 ||
      typeof rows[0] !== "object" ||
      rows[0]?.TIPO_DISPACCIAMENTO !== "14"
    )
      return undefined;
  }
  return {
    offerCode: offer.code,
    offerType: "variable",
    fixedAnnual: fixed.intervals[0].price,
    spread: spreadPrice,
    supplierVat: offer.supplierVat,
  };
}
async function main() {
  loadEnvConfig(process.cwd());
  const [commodity, path] = process.argv.slice(2);
  if (!["electricity", "gas"].includes(commodity) || !path)
    throw new Error("Usage: prepare.ts electricity|gas <new-plan.json>");
  const c = commodity as "electricity" | "gas";
  const catalog = await createCatalogService({
    db: getDb(),
    source: createOfficialSource(),
    originals: createBlobOriginalStore(),
  }).readCatalog({ commodity: c });
  if (catalog.status !== "ready" || !catalog.versionId || !catalog.parameters)
    throw new Error(`Catalog unavailable: ${catalog.reasons.join(", ")}`);
  const params = new Map(
    catalog.parameters.rows.map((r) => [r.nome_parametro, r.valore]),
  );
  const value = (name: string) => {
    const v = params.get(name);
    if (!v || !new Decimal(v).isFinite())
      throw new Error(`Missing official parameter ${name}`);
    return v;
  };
  const additiveUnit = c === "electricity" ? value("cdispd") : "0";
  const multiplier =
    c === "electricity" ? new Decimal(1).plus(value("lambda")).toFixed() : "1";
  const candidates = catalog.offers.flatMap((o) => {
    const r = simpleProbe(o, c);
    return r ? [{ offer: o, recipe: r }] : [];
  });
  const bands =
    c === "electricity" ? ["F0", "F1", "F2", "F3", "F23"] : ["BASE"];
  const quarterlyProbes = bands.map((band) => {
    const list = candidates
      .filter(
        (v) =>
          c === "gas" ||
          v.offer.priceBandCode ===
            (band === "F0" ? "01" : band === "F23" ? "91" : "03"),
      )
      .sort(
        (a, b) =>
          new Decimal(a.recipe.spread).cmp(b.recipe.spread) ||
          a.offer.code.localeCompare(b.offer.code),
      );
    const primary = list[0],
      secondary = list.find(
        (v) => v.recipe.supplierVat !== primary?.recipe.supplierVat,
      );
    if (!primary || !secondary)
      throw new Error(
        `Two independent simple official probe offers unavailable for ${band}; review the source and prepare an explicit qualified recipe`,
      );
    const recipe = (r: typeof primary.recipe) => ({
      offerCode: r.offerCode,
      offerType: r.offerType,
      fixedAnnual: r.fixedAnnual,
      spread: r.spread,
    });
    return {
      ...recipe(primary.recipe),
      band,
      additiveUnit,
      multiplier,
      consumption: c === "electricity" ? "3000" : "1200",
      holdout: recipe(secondary.recipe),
    };
  });
  const manifest = z
    .object({
      files: z.array(
        z.object({ kind: z.string(), url: z.url(), sha256: z.string() }),
      ),
    })
    .parse(catalog.manifest);
  const plan = {
    acquisitionMonth: scenarioWindow(new Date()).acquisitionMonth,
    commodity: c,
    catalogVersionId: catalog.versionId,
    officialSources: manifest.files.map((f) => ({
      url: f.url,
      kind: f.kind === "offers" ? "official_offer" : "official_method",
    })),
    quarterlyProbes,
    annualProbes: catalog.offers
      .filter((o) => o.priceBandCode === "07")
      .map((o) => ({
        offerCode: o.code,
        supplierVat: o.supplierVat,
        fingerprint: o.economicFingerprint,
        offerType: o.offerType,
      })),
  };
  await writeFile(path, JSON.stringify(plan, null, 2), { flag: "wx" });
  console.log(
    JSON.stringify({
      status: "plan_requires_operator_review",
      path,
      quarterlyProbes: quarterlyProbes.length,
      annualFingerprints: plan.annualProbes.length,
    }),
  );
}
main()
  .catch((e) => {
    console.error(
      JSON.stringify({
        status: "failed",
        reason: e instanceof Error ? e.message : "Plan preparation failed",
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50);
  });
