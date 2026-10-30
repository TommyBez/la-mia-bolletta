#!/usr/bin/env -S node --import tsx
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { normalizeOffers } from "../../src/modules/catalog/normalize";
import type { CatalogRead } from "../../src/modules/catalog/service";
import {
  type AnnualGasRegulatedPlan,
  acquireAnnualGasRegulatedRates,
  selectAnnualGasRegulatedProbes,
} from "../../src/modules/comparison/gas/annual-regulated-acquisition";
import { bundledReferences } from "../../src/modules/references/registry";
import { scenarioSnapshotSchema } from "../../src/modules/scenario";

async function main() {
  const { values } = parseArgs({
    options: {
      xml: { type: "string" },
      scenario: { type: "string" },
      out: { type: "string" },
      plan: { type: "string" },
    },
  });
  if (!values.xml || !values.scenario || !values.out)
    throw new Error(
      "Usage: --xml official-gas.xml --scenario artifact-dir/snapshot.json --out NEW-artifact-dir",
    );
  const scenario = scenarioSnapshotSchema.parse(
    JSON.parse(await readFile(values.scenario, "utf8")),
  );
  if (scenario.commodity !== "gas")
    throw new Error("A qualified quarterly gas scenario is required");
  const xml = await readFile(values.xml, "utf8");
  const xmlSha256 = createHash("sha256").update(xml).digest("hex");
  if (
    !scenario.evidence.some(
      (e) => e.kind === "official_offer" && e.sha256 === xmlSha256,
    )
  )
    throw new Error(
      "Gas XML is not the official source pinned by the input scenario",
    );
  const refs = bundledReferences();
  const profiles = ["C1 B", "C1 C", "C1 D", "C1 E", "C1 F", "C2"] as const;
  const plans: AnnualGasRegulatedPlan[] = profiles.map((profile) => {
    const candidates =
      profile === "C2"
        ? ["068028", "022205"]
            .map((code) =>
              refs.gasObservations.find((o) => o.portalCode === code),
            )
            .filter((o) => o !== undefined)
        : refs.gasObservations
            .filter((o) => o.operationalProfile === profile)
            .slice(0, 2);
    if (candidates.length !== 2)
      throw new Error(
        `Two qualified official municipalities are required for ${profile}`,
      );
    return {
      profile,
      calibration: {
        portalCode: candidates[0].portalCode,
        name: candidates[0].name,
      },
      holdout: {
        portalCode: candidates[1].portalCode,
        name: candidates[1].name,
      },
    };
  });
  const catalog: CatalogRead = {
    status: "ready",
    reasons: [],
    commodity: "gas",
    versionId: scenario.catalogVersionId,
    referenceVersionId: refs.versionId,
    sourceDate: null,
    acquiredAt: scenario.acquiredAt,
    offers: normalizeOffers(xml, "gas").offers,
    parameters: null,
    references: refs,
    manifest: null,
    requiredAnnualFingerprints: [],
  };
  const out = resolve(values.out);
  await mkdir(out); // A new artifact directory prevents accidental checkpoint overwrite.
  for (const evidence of scenario.evidence) {
    const source = join(dirname(resolve(values.scenario)), evidence.blobKey);
    const body = await readFile(source);
    if (createHash("sha256").update(body).digest("hex") !== evidence.sha256)
      throw new Error("Input scenario proof checksum mismatch");
    const target = join(out, evidence.blobKey);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  const probes = values.plan
    ? (JSON.parse(await readFile(values.plan, "utf8")) as {
        offerCodes: [string, string];
        controlOfferCode: string;
      })
    : selectAnnualGasRegulatedProbes(catalog, scenario);
  if (
    !Array.isArray(probes.offerCodes) ||
    probes.offerCodes.length !== 2 ||
    probes.offerCodes.some((code) => typeof code !== "string") ||
    typeof probes.controlOfferCode !== "string"
  )
    throw new Error(
      "Probe plan must declare two current offerCodes and one current controlOfferCode",
    );
  const result = await acquireAnnualGasRegulatedRates(
    {
      catalog,
      scenario,
      ...probes,
      plans,
    },
    {
      archive: async (path, body) => {
        const target = join(out, path);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, body, "utf8");
      },
      onProgress: (event) => console.log(JSON.stringify(event)),
    },
  );
  const snapshot = {
    ...scenario,
    acquiredAt: new Date().toISOString(),
    annualRegulatedRates: result.annualRegulatedRates,
    requiredAnnualRegulatedProfiles: [...profiles],
    evidence: [...scenario.evidence, ...result.evidence],
  };
  await writeFile(
    join(out, "snapshot.json"),
    JSON.stringify(snapshot, null, 2),
  );
  console.log(
    JSON.stringify({
      state: "complete",
      profiles: profiles.length,
      probes: profiles.length * 5,
      snapshotPath: join(out, "snapshot.json"),
    }),
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Official annual CCR acquisition failed",
  );
  process.exitCode = 1;
});
