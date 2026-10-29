import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeOffers } from "../../src/modules/catalog/normalize";

const xml = readFileSync(
  new URL("./fixtures/gas-official.xml", import.meta.url),
  "utf8",
);
describe("official catalogue normalization", () => {
  it("retains exact economic decimals and the complete official record", () => {
    const result = normalizeOffers(xml, "gas");
    expect(result.offers).toHaveLength(1);
    const offer = result.offers[0];
    expect(offer.code).toBe("001686GSVML00XXCG1026DO000000000");
    expect(offer.supplierVat).toBe("01244170526");
    expect(offer.components[0].intervals[0].price).toBe("0.25");
    expect(offer.sourceRecord.CondizioniContrattuali).toEqual({
      TIPOLOGIA_CONDIZIONE: "03",
      DESCRIZIONE: "Il contratto è a tempo indeterminato.",
      LIMITANTE: "02",
    });
    expect(offer.economicFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
  it("includes switching when activation types repeat in the official XML", () => {
    const repeated = xml.replace(
      "<ns0:TIPOLOGIA_ATT_CONTR>99</ns0:TIPOLOGIA_ATT_CONTR>",
      "<ns0:TIPOLOGIA_ATT_CONTR>01</ns0:TIPOLOGIA_ATT_CONTR><ns0:TIPOLOGIA_ATT_CONTR>02</ns0:TIPOLOGIA_ATT_CONTR>",
    );
    expect(normalizeOffers(repeated, "gas").offers).toHaveLength(1);
  });
  it("does not hide overlapping intervals or collapse their precision", () => {
    const changed = xml.replace(
      "<ns0:PREZZO>0.25</ns0:PREZZO>",
      "<ns0:PREZZO>0.250000000000000001</ns0:PREZZO>",
    );
    expect(
      normalizeOffers(changed, "gas").offers[0].components[0].intervals[0]
        .price,
    ).toBe("0.250000000000000001");
  });
  it("rejects invalid decimal prices instead of silently omitting a simulable formula", () => {
    expect(() =>
      normalizeOffers(xml.replace(">0.25<", ">NaN<"), "gas"),
    ).toThrow();
  });
  it("keeps the economic fingerprint stable for allowed validity changes", () => {
    expect(
      normalizeOffers(xml.replace("10/01/2027", "11/01/2027"), "gas").offers[0]
        .economicFingerprint,
    ).toBe(normalizeOffers(xml, "gas").offers[0].economicFingerprint);
  });
});
it("interprets official code04 as mixed, as in Senza Pensieri S Domestico", () => {
  const mixedXml = readFileSync(
    new URL("./fixtures/gas-mixed-official.xml", import.meta.url),
    "utf8",
  );
  expect(normalizeOffers(mixedXml, "gas").offers[0].offerType).toBe("mixed");
});
it("rejects impossible source calendar dates instead of moving them into a different month", () => {
  expect(() =>
    normalizeOffers(xml.replace("10/01/2027", "31/02/2027"), "gas"),
  ).toThrow("Invalid official date");
});
