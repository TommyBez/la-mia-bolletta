import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { normalizeOffers } from "../../src/modules/catalog/normalize";
import {
  type GasSaleSupplement,
  gasSaleSupplementSchema,
  requiresGasSaleSupplement,
} from "../../src/modules/comparison/gas/supplement";
import { acquireGasSaleSupplement } from "../../src/modules/comparison/gas/supplement-acquisition";

async function main() {
  const { values } = parseArgs({
    options: {
      xml: { type: "string" },
      out: { type: "string" },
      workers: { type: "string", default: "3" },
      only: { type: "string" },
      "source-date": { type: "string" },
    },
  });
  if (!values.xml || !values.out)
    throw new Error(
      "Usage: --xml official.xml --out output-directory [--workers 1..3] [--only offerCode]",
    );
  const workers = Number(values.workers);
  if (![1, 2, 3].includes(workers))
    throw new Error("Workers must be 1, 2 or 3");
  const out = resolve(values.out);
  await mkdir(out, { recursive: true });
  const xml = await readFile(values.xml, "utf8");
  const sha256 = createHash("sha256").update(xml).digest("hex");
  const sourceDate = values["source-date"];
  if (sourceDate && !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate))
    throw new Error("source-date must use YYYY-MM-DD");
  const source = sourceDate ? { sourceDate, sha256 } : undefined;
  const offers = normalizeOffers(xml, "gas")
    .offers.filter(requiresGasSaleSupplement)
    .filter((o) => !values.only || o.code === values.only);
  if (!offers.length) throw new Error("No matching structural cohort offers");
  const completed: GasSaleSupplement[] = [];
  try {
    const previous = JSON.parse(
      await readFile(join(out, "supplements.json"), "utf8"),
    );
    for (const candidate of previous) {
      const supplement = gasSaleSupplementSchema.parse(candidate);
      if (
        (source &&
          (supplement.sourceDate !== source.sourceDate ||
            supplement.catalogSourceSha256 !== source.sha256)) ||
        !offers.some(
          (o) => o.economicFingerprint === supplement.economicFingerprint,
        ) ||
        supplement.observedAt.slice(0, 10) !==
          new Date().toISOString().slice(0, 10)
      )
        continue;
      for (const evidence of supplement.evidence) {
        const body = await readFile(join(out, evidence.originalPath));
        if (createHash("sha256").update(body).digest("hex") !== evidence.sha256)
          throw new Error("Checkpoint evidence checksum mismatch");
      }
      completed.push(supplement);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const pending = offers.filter(
    (o) =>
      !completed.some((s) => s.economicFingerprint === o.economicFingerprint),
  );
  let cursor = 0;
  const archive = async (path: string, body: string) => {
    const target = join(out, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body, "utf8");
  };
  const failures: { code: string; reason: string }[] = [];
  let saving = Promise.resolve();
  const persist = () => {
    saving = saving.then(async () => {
      const target = join(out, "supplements.json");
      const tmp = join(
        out,
        `supplements-${process.pid}-${completed.length}.tmp`,
      );
      await writeFile(
        tmp,
        JSON.stringify(
          [...completed].sort((a, b) =>
            a.economicFingerprint.localeCompare(b.economicFingerprint),
          ),
          null,
          2,
        ),
      );
      await rename(tmp, target);
    });
    return saving;
  };
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (cursor < pending.length) {
        const offer = pending[cursor++];
        try {
          const supplement = await acquireGasSaleSupplement(offer, {
            archive,
            source,
          });
          completed.push(supplement);
          await persist();
          console.log(
            JSON.stringify({
              status: "qualified",
              offerCode: offer.code,
              fingerprint: offer.economicFingerprint,
              additionalFixedAnnual: supplement.additionalFixedAnnual,
              additionalUnitRate: supplement.additionalUnitRate,
              completed: completed.length,
              total: offers.length,
            }),
          );
        } catch (error) {
          const failure = {
            code: offer.code,
            reason:
              error instanceof Error
                ? error.message
                : "Official acquisition failed",
          };
          failures.push(failure);
          console.log(JSON.stringify({ status: "failed", ...failure }));
        }
      }
    }),
  );
  await writeFile(
    join(out, "result.json"),
    JSON.stringify(
      { qualified: completed.length, required: offers.length, failures },
      null,
      2,
    ),
  );
  if (failures.length)
    throw new Error("Incomplete cohort: no complete catalog may be published");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed");
  process.exitCode = 1;
});
