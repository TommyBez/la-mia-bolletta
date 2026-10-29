import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDb } from "../../src/db";
import type { Commodity } from "../../src/modules/catalog/normalize";
import { createBlobOriginalStore } from "../../src/modules/catalog/originals";
import { getCatalogService } from "../../src/modules/catalog/runtime";
import {
  archiveGasReferences,
  archiveReferenceSourceCaptures,
} from "../../src/modules/references/archive";
import retainedArchives from "../../src/modules/references/data/reference-archives.json";
import {
  bundledReferences,
  gasObservationSchema,
  withReferenceArchives,
} from "../../src/modules/references/registry";

const commands = ["refresh", "reprocess", "status", "references"];
async function main() {
  const [
    command,
    selected = "all",
    observationDirectory = "src/modules/references/data/gas-observations",
  ] = process.argv.slice(2);
  if (!commands.includes(command))
    throw new Error(
      "Usage: node --env-file=.env.local --import tsx scripts/catalog/index.ts refresh|reprocess|status [all|electricity|gas] OR references [directory]",
    );
  const service = getCatalogService();
  if (command === "references") {
    const directory = resolve(
      selected === "all" ? observationDirectory : selected,
    );
    const files = await readdir(directory);
    const observations = [];
    for (const file of files.filter((f) => /^\d{6}\.json$/.test(f)).sort())
      observations.push(
        gasObservationSchema.parse(
          JSON.parse(await readFile(resolve(directory, file), "utf8")),
        ),
      );
    const originals = createBlobOriginalStore();
    const [archives, sourceArchive] = await Promise.all([
      archiveGasReferences({
        observations,
        directory,
        originals,
        known: {
          observationFingerprint: retainedArchives.observationFingerprint,
          archives: retainedArchives.gasArchives,
        },
      }),
      archiveReferenceSourceCaptures({
        originals,
        knownArchives: retainedArchives.sourceArchives,
      }),
    ]);
    const refs = withReferenceArchives(
      bundledReferences(observations),
      archives,
      [sourceArchive],
    );
    await service.publishReferences(refs);
    console.log(
      JSON.stringify(
        { versionId: refs.versionId, coverage: refs.coverage },
        null,
        2,
      ),
    );
    return;
  }
  if (!["all", "electricity", "gas"].includes(selected))
    throw new Error("Invalid commodity");
  const commodities: Commodity[] =
    selected === "all" ? ["electricity", "gas"] : [selected as Commodity];
  const results = await Promise.allSettled(
    commodities.map(async (commodity) => {
      if (command === "refresh" || command === "reprocess") {
        const start = Date.now();
        const result =
          command === "refresh"
            ? await service.refreshCatalog({ commodity })
            : await service.reprocessCatalog({ commodity });
        return { ...result, commodity, elapsedMs: Date.now() - start };
      }
      return service.getCatalogStatus({ commodity });
    }),
  );
  for (const result of results)
    console.log(
      JSON.stringify(
        result.status === "fulfilled"
          ? result.value
          : {
              state: "failed",
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason),
            },
        null,
        2,
      ),
    );
  if (results.some((r) => r.status === "rejected")) process.exitCode = 1;
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.DATABASE_URL) await getDb().$client.end();
  });
