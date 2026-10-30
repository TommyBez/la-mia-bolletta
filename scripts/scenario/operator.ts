#!/usr/bin/env -S node --import tsx
/** Manual operator commands. No scheduler or route invokes the acquisition script. */
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";
import { z } from "zod";
import { getDb } from "../../src/db";
import { child, field, records } from "../../src/modules/catalog/normalize";
import { createBlobOriginalStore } from "../../src/modules/catalog/originals";
import { createCatalogService } from "../../src/modules/catalog/service";
import { createOfficialSource } from "../../src/modules/catalog/source";
import {
  createScenarioService,
  qualifyScenario,
  requiredAnnualRegulatedProfilesForCatalog,
  type ScenarioCommodity,
} from "../../src/modules/scenario";

async function main() {
  loadEnvConfig(process.cwd());
  const [command, argument, ...rest] = process.argv.slice(2);
  if (!["validate", "import", "status", "bind-catalog"].includes(command ?? ""))
    throw new Error(
      "Usage: operator.ts validate|import|bind-catalog <artifact-dir>/snapshot.json, or status electricity|gas",
    );
  const db = getDb(),
    catalog = createCatalogService({
      db,
      source: createOfficialSource(),
      originals: createBlobOriginalStore(),
    });
  const service = createScenarioService(db);
  if (command === "status") {
    if (!["electricity", "gas"].includes(argument))
      throw new Error("Commodity must be electricity or gas");
    const current = await catalog.readCatalog({
      commodity: argument as ScenarioCommodity,
    });
    const result = await service.getScenarioStatus({
      commodity: argument as ScenarioCommodity,
      requiredAnnualFingerprints: current.requiredAnnualFingerprints,
      requiredAnnualRegulatedProfiles:
        requiredAnnualRegulatedProfilesForCatalog(current.offers),
    });
    console.log(
      JSON.stringify({ ...result, catalogStatus: current.status }, null, 2),
    );
    return;
  }
  if (!argument || rest.length)
    throw new Error("Exactly one snapshot path is required");
  const file = await realpath(argument),
    artifactDir = dirname(file);
  const input = JSON.parse(await readFile(file, "utf8"));
  const current = await catalog.readCatalog({ commodity: input.commodity });
  if (current.status !== "ready" || !current.versionId)
    throw new Error(
      `Current official catalog is not ready: ${current.reasons.join(", ")}`,
    );
  const manifest = z
    .object({
      files: z.array(z.object({ kind: z.string(), sha256: z.string() })),
    })
    .parse(current.manifest);
  const officialOfferDigest = manifest.files.find(
    (f) => f.kind === "offers",
  )?.sha256;
  if (
    !officialOfferDigest ||
    !Array.isArray(input.evidence) ||
    !input.evidence.some(
      (e: { kind: string; sha256: string }) =>
        e.kind === "official_offer" && e.sha256 === officialOfferDigest,
    )
  )
    throw new Error(
      "The acquisition offer XML differs from the current published catalog; reacquire using current official conditions",
    );
  const requiredAnnualRegulatedProfiles =
    requiredAnnualRegulatedProfilesForCatalog(current.offers);
  const regulatedProbes = (input.annualRegulatedRates ?? []).flatMap(
    (rate: { calibrations: unknown[]; holdouts: unknown[] }) => [
      ...rate.calibrations,
      ...rate.holdouts,
    ],
  );
  if (command === "bind-catalog") {
    // Binding after a long acquisition is allowed only if every offer source is exactly
    // the currently published catalog and every required fingerprint is present.
    const allCodes = current.offers.map((o) => o.code);
    for (const p of [
      ...input.calibrations,
      ...input.holdouts,
      ...input.annualSales,
      ...regulatedProbes,
    ])
      if (!allCodes.includes(p.offerCode))
        throw new Error(`Probe is not in current catalog: ${p.offerCode}`);
    const required = current.offers
      .filter((o) => o.priceBandCode === "07")
      .map((o) => o.economicFingerprint);
    if (
      required.some(
        (f) =>
          !input.annualSales.some(
            (a: { fingerprint: string }) => a.fingerprint === f,
          ),
      )
    )
      throw new Error(
        "Current catalog contains an unqualified Peak fingerprint",
      );
    const parameterDigest = manifest.files.find(
      (f) => f.kind === "parameters",
    )?.sha256;
    if (!parameterDigest)
      throw new Error("Current parameter source unavailable");
    if (input.commodity === "electricity") {
      const parameters = new Map(
        current.parameters?.rows.map((r) => [r.nome_parametro, r.valore]),
      );
      const cdispd = parameters.get("cdispd"),
        lambda = parameters.get("lambda");
      if (
        !cdispd ||
        !lambda ||
        input.calibrations.some(
          (c: { additiveUnit: string; multiplier: string }) =>
            !new Decimal(c.additiveUnit).eq(cdispd) ||
            !new Decimal(c.multiplier).eq(new Decimal(1).plus(lambda)),
        )
      )
        throw new Error(
          "Probe subtractions differ from the current official loss/dispatch parameters",
        );
    }
    if (
      !input.evidence.some(
        (e: { sha256: string; kind: string }) =>
          e.sha256 === parameterDigest && e.kind === "official_method",
      )
    ) {
      const body = await createBlobOriginalStore().get(
        `catalog/${input.commodity}/${parameterDigest}.csv`,
      );
      if (createHash("sha256").update(body).digest("hex") !== parameterDigest)
        throw new Error("Current archived parameter source digest mismatch");
      const blobKey = `scenario/${input.acquisitionMonth}/${parameterDigest}.csv`;
      await mkdir(dirname(resolve(artifactDir, blobKey)), { recursive: true });
      await writeFile(resolve(artifactDir, blobKey), body);
      input.evidence.push({
        blobKey,
        sha256: parameterDigest,
        kind: "official_method",
      });
    }
    const uniqueEvidence: typeof input.evidence = [];
    const remapping = new Map<number, number>();
    for (const [i, evidence] of input.evidence.entries()) {
      const existing = uniqueEvidence.findIndex(
        (e: { blobKey: string; sha256: string; kind: string }) =>
          e.blobKey === evidence.blobKey &&
          e.sha256 === evidence.sha256 &&
          e.kind === evidence.kind,
      );
      remapping.set(i, existing < 0 ? uniqueEvidence.length : existing);
      if (existing < 0) uniqueEvidence.push(evidence);
    }
    for (const probe of [
      ...input.calibrations,
      ...input.holdouts,
      ...regulatedProbes,
      ...input.annualSales.flatMap(
        (a: { calibrations: unknown[]; holdouts: unknown[] }) => [
          ...a.calibrations,
          ...a.holdouts,
        ],
      ),
    ]) {
      probe.evidenceIndex = remapping.get(probe.evidenceIndex);
      if (probe.predictionEvidenceIndex !== undefined)
        probe.predictionEvidenceIndex = remapping.get(
          probe.predictionEvidenceIndex,
        );
    }
    for (const annual of input.annualSales)
      if (annual.structuralQualification)
        annual.structuralQualification.sourceEvidenceIndex = remapping.get(
          annual.structuralQualification.sourceEvidenceIndex,
        );
    input.evidence = uniqueEvidence;
    for (const annual of input.annualSales) {
      if (!annual.structuralQualification) continue;
      const official = current.offers.find(
        (o) => o.economicFingerprint === annual.fingerprint,
      );
      if (!official || official.priceBandCode !== "07")
        throw new Error(
          "Structural proof has no matching current official offer",
        );
      for (const component of official.components)
        for (const interval of component.intervals)
          if (
            !["01", "03"].includes(interval.unit ?? "") ||
            interval.source.CONSUMO_DA !== undefined ||
            interval.source.CONSUMO_A !== undefined ||
            interval.source.PeriodoValidita !== undefined
          )
            throw new Error(
              "Official source is not linear and power-independent",
            );
      for (const discount of records(official.sourceRecord.Sconto)) {
        const conditions = records(discount.Condizione);
        if (
          conditions.length &&
          conditions.every((c) => field(c, "CONDIZIONE_APPLICAZIONE") === "00")
        )
          throw new Error(
            "Applicable discount prevents the declared structural qualification",
          );
      }
      const physical = child(official.sourceRecord, "CaratteristicheOfferta");
      const minimum = field(physical, "CONSUMO_MIN"),
        maximum = field(physical, "CONSUMO_MAX");
      if (
        (minimum && new Decimal(annual.domain.minKwh).lt(minimum)) ||
        (maximum && new Decimal(annual.domain.maxKwh).gt(maximum))
      )
        throw new Error(
          "Qualified annual domain exceeds official consumption limits",
        );
    }
    if (requiredAnnualRegulatedProfiles.length)
      input.requiredAnnualRegulatedProfiles = requiredAnnualRegulatedProfiles;
    input.catalogVersionId = current.versionId;
    input.requiredAnnualFingerprints = required.sort();
    const checked = qualifyScenario(input, {
      requiredAnnualFingerprints: required,
      catalogVersionId: current.versionId,
      requiredAnnualRegulatedProfiles,
    });
    if (checked.status === "rejected")
      throw new Error(checked.reasons.join(", "));
    await writeFile(file, JSON.stringify(input, null, 2));
    console.log(
      JSON.stringify({
        status: "bound_to_current_catalog",
        catalogVersionId: current.versionId,
      }),
    );
    return;
  }
  const required = current.offers
    .filter((o) => o.priceBandCode === "07")
    .map((o) => o.economicFingerprint);
  const parameterDigest = manifest.files.find(
    (f) => f.kind === "parameters",
  )?.sha256;
  if (
    !parameterDigest ||
    !input.evidence.some(
      (e: { kind: string; sha256: string }) =>
        e.kind === "official_method" && e.sha256 === parameterDigest,
    )
  )
    throw new Error(
      "Missing current official parameter source; bind the acquisition to the catalog before validation",
    );
  const qualified = qualifyScenario(input, {
    requiredAnnualFingerprints: required,
    catalogVersionId: current.versionId,
    requiredAnnualRegulatedProfiles,
  });
  if (qualified.status === "rejected") {
    console.log(JSON.stringify(qualified, null, 2));
    process.exitCode = 1;
    return;
  }
  for (const evidence of qualified.snapshot.evidence) {
    const path = await realpath(resolve(artifactDir, evidence.blobKey));
    if (!path.startsWith(artifactDir + sep))
      throw new Error("Evidence path escapes artifact directory");
    const text = await readFile(path, "utf8");
    if (createHash("sha256").update(text).digest("hex") !== evidence.sha256)
      throw new Error(`Evidence digest mismatch ${evidence.sha256}`);
    if (
      evidence.kind !== "official_offer" &&
      /csrf_token|currentFilterJSON|jsessionid|set-cookie|authorization\s*:/i.test(
        text,
      )
    )
      throw new Error("Unsanitized acquisition artifact");
  }
  if (command === "validate") {
    console.log(
      JSON.stringify({
        status: "qualified",
        versionId: qualified.versionId,
        commodity: qualified.snapshot.commodity,
        coefficientCount: qualified.snapshot.coefficients.length,
        annualCount: qualified.snapshot.annualSales.length,
      }),
    );
    return;
  }
  const originals = createBlobOriginalStore();
  for (const evidence of qualified.snapshot.evidence)
    await originals.put(
      evidence.blobKey,
      await readFile(resolve(artifactDir, evidence.blobKey), "utf8"),
    );
  const imported = await service.importSnapshot(qualified.snapshot, {
    requiredAnnualFingerprints: required,
    catalogVersionId: current.versionId,
    requiredAnnualRegulatedProfiles,
  });
  console.log(JSON.stringify(imported));
  if (imported.status === "rejected") process.exitCode = 1;
  const status = await service.getScenarioStatus({
    commodity: qualified.snapshot.commodity,
    requiredAnnualFingerprints: required,
    requiredAnnualRegulatedProfiles,
  });
  console.log(JSON.stringify(status));
  if (status.status !== "ready") process.exitCode = 1;
}
main()
  .catch((error) => {
    console.error(
      JSON.stringify({
        status: "failed",
        transportCause:
          error instanceof Error && error.cause instanceof Error
            ? /timeout|timed out/i.test(error.cause.message)
              ? "database_connection_timeout"
              : (/ECONNRESET|ECONNREFUSED|ENOTFOUND|certificate|SSL|TLS/i.exec(
                  error.cause.message,
                )?.[0] ?? "underlying_error_details_suppressed")
            : undefined,
        reason:
          error instanceof Error &&
          !/postgres|password|token|secret|connection/i.test(error.message)
            ? error.message
            : "Operator operation failed; inspect server configuration without logging credentials",
      }),
    );
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 50);
  });
