import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createDb } from "../../src/db";
import { migrateDatabase } from "../../src/db/migrate";
import { digest } from "../../src/modules/catalog/normalize";
import {
  type CatalogDependencies,
  createCatalogService,
} from "../../src/modules/catalog/service";
import type { SourceFile } from "../../src/modules/catalog/source";
import { bundledReferences } from "../../src/modules/references/registry";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    "TEST_DATABASE_URL is required for catalog integration tests",
  );
const db = createDb(databaseUrl);
beforeAll(() => migrateDatabase(db));
afterAll(() => db.$client.end());
let tick = 0;
const clockBase = Math.max(
  Date.now(),
  new Date("2026-10-29T16:00:00Z").valueOf(),
);
const xml = readFileSync(
  new URL("./fixtures/gas-official.xml", import.meta.url),
  "utf8",
);
function harness(
  supplementAcquirer?: CatalogDependencies["supplementAcquirer"],
) {
  const code = `001686GSVML00XX${randomUUID().replaceAll("-", "").slice(0, 17)}`;
  let broken = false;
  let replacement: string | undefined;
  let sourceDate = "2026-10-29";
  const memory = new Map<string, string>();
  const files = (): SourceFile[] =>
    ["offers", "parameters"].map((kind) => {
      const body =
        kind === "offers"
          ? broken
            ? "corrupt"
            : (replacement ?? xml).replace(
                "001686GSVML00XXCG1026DO000000000",
                code,
              )
          : "nome_parametro,valore,descrizione\niva_f1,0.100000,IVA\n";
      return {
        kind: kind as "offers" | "parameters",
        url: `https://www.ilportaleofferte.it/test/${kind}`,
        sourceDate,
        body,
        sha256: digest(body),
        acquiredAt: "2026-10-29T15:00:00.000Z",
      };
    });
  const service = createCatalogService({
    db,
    supplementAcquirer,
    clock: () => new Date(clockBase + tick++),
    source: { acquire: async () => files() },
    originals: {
      put: async (path, body) => {
        memory.set(path, body);
        return { path };
      },
      get: async (path) => {
        const body = memory.get(path);
        if (!body) throw new Error("missing");
        return body;
      },
    },
  });
  return {
    code,
    service,
    break: () => {
      broken = true;
    },
    setXml: (value: string) => {
      replacement = value;
    },
    setDate: (value: string) => {
      sourceDate = value;
    },
  };
}
it("publishes then reads real normalized offers; a corrupt successor preserves the published snapshot", async () => {
  const h = harness();
  const result = await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  expect(["published", "unchanged"]).toContain(result.state);
  const before = await h.service.readCatalog({ commodity: "gas" });
  expect(before.offers[0].code).toBe(h.code);
  h.break();
  await expect(
    h.service.refreshCatalog({
      commodity: "gas",
      references: bundledReferences(),
    }),
  ).rejects.toThrow("Corrupt official XML");
  const after = await h.service.readCatalog({ commodity: "gas" });
  expect(after.versionId).toBe(before.versionId);
  expect(
    (await h.service.getCatalogStatus({ commodity: "gas" })).lastRun?.state,
  ).toBe("failed");
  const reprocessed = await h.service.reprocessCatalog({ commodity: "gas" });
  expect(reprocessed.state).toBe("unchanged");
  expect(reprocessed.versionId).toBe(before.versionId);
});

it("reuses unchanged observations, applies official validity correction under the same URL, and retains the pinned version", async () => {
  const h = harness();
  const first = await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  expect((await h.service.refreshCatalog({ commodity: "gas" })).state).toBe(
    "unchanged",
  );
  h.setXml(xml.replace("10/01/2027", "11/01/2027"));
  const corrected = await h.service.refreshCatalog({ commodity: "gas" });
  expect(corrected.versionId).not.toBe(first.versionId);
  if (!first.versionId) throw new Error("Expected a published snapshot");
  const old = await h.service.readCatalog({
    commodity: "gas",
    versionId: first.versionId,
  });
  const current = await h.service.readCatalog({ commodity: "gas" });
  expect(old.offers[0].validTo).toBe("2027-01-10T22:59:59.000Z");
  expect(current.offers[0].validTo).toBe("2027-01-11T22:59:59.000Z");
  expect(
    (
      await h.service.readCatalog({
        commodity: "gas",
        at: new Date("2026-10-31T01:00:00Z"),
      })
    ).reasons,
  ).toContain("catalog_source_older_than_48h");
});
it("rejects unexpected active economics and leaves electricity independently publishable", async () => {
  const h = harness();
  await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  const before = await h.service.readCatalog({ commodity: "gas" });
  h.setXml(xml.replace(">0.25<", ">0.26<"));
  const results = await Promise.allSettled([
    h.service.refreshCatalog({ commodity: "gas" }),
    h.service.refreshCatalog({ commodity: "electricity" }),
  ]);
  expect(results[0].status).toBe("rejected");
  if (results[0].status === "rejected")
    expect(String(results[0].reason)).toContain(
      "Unexpected economic modification",
    );
  expect(results[1].status).toBe("fulfilled");
  expect((await h.service.readCatalog({ commodity: "gas" })).versionId).toBe(
    before.versionId,
  );
});
it("serializes competing publications and prevents an older source replacing a newer one", async () => {
  const current = harness(),
    older = harness();
  older.setDate("2026-10-28");
  await Promise.all([
    current.service.refreshCatalog({
      commodity: "gas",
      references: bundledReferences(),
    }),
    older.service.refreshCatalog({
      commodity: "gas",
      references: bundledReferences(),
    }),
  ]);
  expect(
    (await current.service.readCatalog({ commodity: "gas" })).sourceDate,
  ).toBe("2026-10-29");
});
it("remembers an official identity when an offer disappears and later returns with changed active economics", async () => {
  const h = harness();
  await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  h.setXml(
    xml.replace(
      "001686GSVML00XXCG1026DO000000000",
      "999999GSVML00XXCG1026DO000000000",
    ),
  );
  await h.service.refreshCatalog({ commodity: "gas" });
  h.setXml(xml.replace(">0.25<", ">0.26<"));
  await expect(h.service.refreshCatalog({ commodity: "gas" })).rejects.toThrow(
    "Unexpected economic modification",
  );
});
it("permits reopening an expired identity through dates, but rejects other expired-record changes", async () => {
  const h = harness();
  const expired = xml.replace("10/01/2027_23:59:59", "28/10/2026_23:59:59");
  h.setXml(expired);
  await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  h.setXml(
    expired.replace(
      "<ns0:MODALITA_PAGAMENTO>01</ns0:MODALITA_PAGAMENTO>",
      "<ns0:MODALITA_PAGAMENTO>02</ns0:MODALITA_PAGAMENTO>",
    ),
  );
  await expect(h.service.refreshCatalog({ commodity: "gas" })).rejects.toThrow(
    "Unexpected expired-offer modification",
  );
  h.setXml(xml);
  expect((await h.service.refreshCatalog({ commodity: "gas" })).state).toBe(
    "published",
  );
});
it("reads an immutable archived offer even after its marketing availability expires", async () => {
  const h = harness();
  const published = await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  if (!published.versionId) throw new Error("Expected a catalog version");
  expect(
    (
      await h.service.readCatalog({
        commodity: "gas",
        versionId: published.versionId,
        at: new Date("2027-02-01T12:00:00Z"),
      })
    ).offers,
  ).toHaveLength(0);
  const archived = await h.service.readOfferVersion({
    commodity: "gas",
    versionId: published.versionId,
    code: h.code,
    supplierVat: "01244170526",
  });
  expect(archived?.components[0].intervals[0].price).toBe("0.25");
  expect(
    await h.service.readOfferVersion({
      commodity: "electricity",
      versionId: published.versionId,
      code: h.code,
      supplierVat: "01244170526",
    }),
  ).toBeNull();
});
it("protects cached official economics from caller mutation and rechecks freshness on each read", async () => {
  const h = harness();
  await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  const first = await h.service.readCatalog({ commodity: "gas" });
  expect(() => {
    first.offers[0].components[0].intervals[0].price = "99";
  }).toThrow();
  expect(
    (await h.service.readCatalog({ commodity: "gas" })).offers[0].components[0]
      .intervals[0].price,
  ).toBe("0.25");
  expect(
    (
      await h.service.readCatalog({
        commodity: "gas",
        at: new Date("2026-10-31T01:00:00Z"),
      })
    ).status,
  ).toBe("incomplete_data");
});
it("preserves the last complete gas snapshot when a new official structural cohort has no qualified supplement", async () => {
  const h = harness();
  await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  const before = await h.service.readCatalog({ commodity: "gas" });
  h.setXml(
    readFileSync(
      new URL(
        "./fixtures/gas-supplement-required-official.xml",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await expect(h.service.refreshCatalog({ commodity: "gas" })).rejects.toThrow(
    "Missing qualified gas sale supplement",
  );
  expect((await h.service.readCatalog({ commodity: "gas" })).versionId).toBe(
    before.versionId,
  );
});

it("reuses qualified sales for one daily source and automatically reacquires them for the next daily file", async () => {
  const example = JSON.parse(
    readFileSync(
      new URL("./fixtures/gas-sale-supplement.json", import.meta.url),
      "utf8",
    ),
  );
  let acquisitions = 0;
  const h = harness(async (offer, options) => {
    acquisitions++;
    if (!options.source) throw new Error("Expected daily source context");
    for (const evidence of example.evidence) {
      const body = readFileSync(
        new URL(`./fixtures/${evidence.sha256}.html.txt`, import.meta.url),
        "utf8",
      );
      await options.archive(evidence.originalPath, body);
    }
    return {
      ...example,
      offerCode: offer.code,
      supplierVat: offer.supplierVat,
      economicFingerprint: offer.economicFingerprint,
      sourceDate: options.source.sourceDate,
      catalogSourceSha256: options.source.sha256,
    };
  });
  h.setXml(
    readFileSync(
      new URL(
        "./fixtures/gas-supplement-required-official.xml",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const first = await h.service.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  expect(acquisitions).toBe(1);
  expect((await h.service.refreshCatalog({ commodity: "gas" })).state).toBe(
    "unchanged",
  );
  expect(acquisitions).toBe(1);
  h.setDate("2026-10-30");
  const next = await h.service.refreshCatalog({ commodity: "gas" });
  expect(acquisitions).toBe(2);
  expect(next.versionId).not.toBe(first.versionId);
  if (!first.versionId || !next.versionId)
    throw new Error("Expected immutable daily versions");
  const historical = await h.service.readOfferVersionContext({
    commodity: "gas",
    versionId: first.versionId,
    code: example.offerCode,
    supplierVat: example.supplierVat,
  });
  const current = await h.service.readOfferVersionContext({
    commodity: "gas",
    versionId: next.versionId,
    code: example.offerCode,
    supplierVat: example.supplierVat,
  });
  expect(historical?.offerSalesSupplement?.sourceDate).toBe("2026-10-29");
  expect(current?.offerSalesSupplement?.sourceDate).toBe("2026-10-30");
  expect(historical?.referenceVersionId).not.toBe(current?.referenceVersionId);
});
