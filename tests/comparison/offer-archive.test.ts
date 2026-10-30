import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, expect, it, vi } from "vitest";
import { createDb } from "../../src/db";
import { digest } from "../../src/modules/catalog/normalize";
import { createCatalogService } from "../../src/modules/catalog/service";
import { lookupOfferArchive } from "../../src/modules/comparison/offer-archive";
import { bundledReferences } from "../../src/modules/references/registry";
import { handleMcpRequest } from "../../src/transports/mcp";
import { createOperations } from "../../src/transports/operations";

if (!process.env.TEST_DATABASE_URL) throw Error("Dedicated database required");
const db = createDb(process.env.TEST_DATABASE_URL);
afterAll(() => db.$client.end());

it("looks up exact offer codes in published historical snapshots without exposing economic records", async () => {
  const original = readFileSync(
    "tests/catalog/fixtures/gas-official.xml",
    "utf8",
  );
  const csv = readFileSync(
    "docs/evidenze/fiscalita-gas-2026-10-29/PO_Parametri_Mercato_Libero_G_20261029.csv",
    "utf8",
  );
  let at = new Date("2026-10-28T12:00:00Z");
  let xml = original;
  const originals = new Map<string, string>();
  const catalog = createCatalogService({
    db,
    clock: () => at,
    source: {
      acquire: async () =>
        ["offers", "parameters"].map((kind) => ({
          kind: kind as "offers" | "parameters",
          body: kind === "offers" ? xml : csv,
          sourceDate: at.toISOString().slice(0, 10),
          acquiredAt: at.toISOString(),
          sha256: digest(kind === "offers" ? xml : csv),
          url: `https://www.ilportaleofferte.it/test/${kind}`,
        })),
    },
    originals: {
      put: async (path, body) => {
        originals.set(path, body);
        return { path };
      },
      get: async (path) => {
        const body = originals.get(path);
        if (!body) throw Error("Missing fixture");
        return body;
      },
    },
  });
  const old = await catalog.refreshCatalog({
    commodity: "gas",
    references: bundledReferences(),
  });
  expect(old.state).toBe("published");
  at = new Date("2026-10-29T12:00:00Z");
  xml = original.replace("10/01/2027_23:59:59", "11/01/2027_23:59:59");
  const latest = await catalog.refreshCatalog({ commodity: "gas" });
  expect(latest.state).toBe("published");
  at = new Date("2026-10-30T12:00:00Z");
  xml = original.replace("001686GSVML00XXCG1026DO000000000", "STAGED_ONLY");
  await catalog.stageCatalog({ commodity: "gas" });
  const query = {
    code: "001686GSVML00XXCG1026DO000000000",
    commodity: "gas" as const,
  };
  const result = await lookupOfferArchive(db, query);
  expect(result).toMatchObject({
    schemaVersion: 1,
    offerArchive: {
      items: [
        {
          code: query.code,
          supplierVat: "01244170526",
          versionId: latest.versionId,
          sourceDate: "2026-10-29",
          observedAt: "2026-10-29T12:00:00.000Z",
        },
        {
          code: query.code,
          versionId: old.versionId,
          sourceDate: "2026-10-28",
        },
      ],
    },
  });
  expect(result.offerArchive.items).toHaveLength(2);
  expect(Object.keys(result.offerArchive.items[0]).sort()).toEqual(
    [
      "code",
      "supplierVat",
      "name",
      "versionId",
      "sourceDate",
      "observedAt",
    ].sort(),
  );
  expect(
    await createOperations(db)("get_data_status", { offerQuery: query }),
  ).toEqual(result);
  vi.stubEnv("MCP_ACCESS_TOKEN", "test-only-archive-token");
  try {
    const response = await handleMcpRequest(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: {
          authorization: "Bearer test-only-archive-token",
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_data_status", arguments: { offerQuery: query } },
        }),
      }),
      { db },
    );
    expect(response.status).toBe(200);
    expect((await response.json()).result.structuredContent).toEqual(result);
  } finally {
    vi.unstubAllEnvs();
  }
  expect(
    (await lookupOfferArchive(db, { ...query, code: "001686" })).offerArchive
      .items,
  ).toEqual([]);
  expect(
    (await lookupOfferArchive(db, { ...query, commodity: "electricity" }))
      .offerArchive.items,
  ).toEqual([]);
  expect(
    (await lookupOfferArchive(db, { ...query, code: "STAGED_ONLY" }))
      .offerArchive.items,
  ).toEqual([]);
  // Daily snapshots retain the same commercial observation; each published
  // context remains separately selectable, bounded to the newest twenty.
  for (let day = 1; day <= 21; day++) {
    at = new Date(`2026-11-${String(day).padStart(2, "0")}T12:00:00Z`);
    xml = original.replace("10/01/2027_23:59:59", "11/01/2027_23:59:59");
    expect((await catalog.refreshCatalog({ commodity: "gas" })).state).toBe(
      "published",
    );
  }
  const bounded = await lookupOfferArchive(db, query);
  expect(bounded.offerArchive.items).toHaveLength(20);
  expect(bounded.offerArchive.items[0].sourceDate).toBe("2026-11-21");
  expect(bounded.offerArchive.items[0].observedAt).toBe(
    "2026-11-21T12:00:00.000Z",
  );
  expect(bounded.offerArchive.items.at(-1)?.sourceDate).toBe("2026-11-02");
  // Arrange an old-normalizer stored snapshot: it cannot be offered to the
  // current calculator even though it was once successfully published.
  const incompatible = bounded.offerArchive.items[0].versionId;
  await db.execute(
    sql`update lmb_catalog_snapshots set manifest = manifest || '{"normalizationVersion":"au-ml-normalizer-v1"}'::jsonb where id = ${incompatible}`,
  );
  const compatible = await lookupOfferArchive(db, query);
  expect(
    compatible.offerArchive.items.some(
      (item) => item.versionId === incompatible,
    ),
  ).toBe(false);
  expect(
    await createOperations(db)("get_data_status", {
      offerQuery: { code: "", commodity: "gas" },
    }),
  ).toMatchObject({ status: "needs_input" });
});
