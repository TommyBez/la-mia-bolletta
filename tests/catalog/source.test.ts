import { expect, it } from "vitest";
import {
  discoverSources,
  parseParameters,
} from "../../src/modules/catalog/source";

it("discovers the exact daily official links and rejects incomplete commodities", () => {
  const html =
    '<a href="/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261029.xml">Gas</a><a href="/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_G_20261029.csv">params</a>';
  const s = discoverSources(html, "gas");
  expect(s.offers.url).toBe(
    "https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261029.xml",
  );
  expect(s.offers.sourceDate).toBe("2026-10-29");
  expect(() => discoverSources(html, "electricity")).toThrow();
});
it("preserves quoted semicolons in the official comma-delimited parameter CSV", () => {
  expect(
    parseParameters(
      'nome_parametro,valore,descrizione\nqt,0.105049,"Trasporto; con PCS"\n',
    ).rows[0],
  ).toEqual({
    nome_parametro: "qt",
    valore: "0.105049",
    descrizione: "Trasporto; con PCS",
  });
});
it("rejects corrupt numeric parameters instead of publishing a seemingly complete catalogue", () => {
  expect(() =>
    parseParameters("nome_parametro,valore,descrizione\niva_f1,NaN,IVA\n"),
  ).toThrow("Invalid official parameter");
});
