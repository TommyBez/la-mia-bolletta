#!/usr/bin/env -S node --import tsx
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import Decimal from "decimal.js";
import { normalizeOffers } from "../../src/modules/catalog/normalize";
import type { CatalogRead } from "../../src/modules/catalog/service";
import { parseParameters } from "../../src/modules/catalog/source";
import { calculateGasOffer } from "../../src/modules/comparison/gas";
import { createAnnualGasProbeInput } from "../../src/modules/comparison/gas/annual-regulated-acquisition";
import { parseGasTaxQuote } from "../../src/modules/comparison/gas/supplement-acquisition";
import { bundledReferences } from "../../src/modules/references/registry";
import { scenarioSnapshotSchema } from "../../src/modules/scenario";

async function main() {
  const { values } = parseArgs({
    options: {
      xml: { type: "string" },
      snapshot: { type: "string" },
      out: { type: "string" },
    },
  });
  if (!values.xml || !values.snapshot || !values.out)
    throw new Error(
      "Usage: --xml official.xml --snapshot artifact/snapshot.json --out NEW-report.json",
    );
  const snapshot = scenarioSnapshotSchema.parse(
    JSON.parse(await readFile(values.snapshot, "utf8")),
  );
  const artifactDir = dirname(values.snapshot);
  const parameter = snapshot.evidence.find(
    (e) => e.kind === "official_method" && e.blobKey.endsWith(".csv"),
  );
  if (!parameter)
    throw new Error("Pinned official gas parameters are required");
  const refs = bundledReferences();
  const xml = await readFile(values.xml, "utf8");
  const xmlSha = createHash("sha256").update(xml).digest("hex");
  if (
    !snapshot.evidence.some(
      (e) => e.kind === "official_offer" && e.sha256 === xmlSha,
    )
  )
    throw new Error("Gas XML does not match pinned official evidence");
  const parameterBody = await readFile(
    join(artifactDir, parameter.blobKey),
    "utf8",
  );
  if (
    createHash("sha256").update(parameterBody).digest("hex") !==
    parameter.sha256
  )
    throw new Error("Gas parameter proof checksum mismatch");
  const catalog: CatalogRead = {
    status: "ready",
    reasons: [],
    commodity: "gas",
    versionId: snapshot.catalogVersionId,
    referenceVersionId: refs.versionId,
    sourceDate: null,
    acquiredAt: snapshot.acquiredAt,
    offers: normalizeOffers(xml, "gas").offers,
    parameters: parseParameters(parameterBody),
    references: refs,
    manifest: null,
    requiredAnnualFingerprints: [],
  };
  const predictions = (snapshot.annualRegulatedRates ?? []).flatMap((rate) =>
    [...rate.calibrations, ...rate.holdouts].map((probe) => {
      const locality = refs.portalMunicipalities.find(
        (m) => m.code === probe.municipalityCode,
      );
      if (!locality || rate.profile === "T1")
        throw new Error("Qualified domestic locality required");
      const input = createAnnualGasProbeInput(
        catalog,
        snapshot,
        probe.offerCode,
        { portalCode: locality.code, name: locality.name },
        rate.profile,
        probe.volume,
      );
      const result = calculateGasOffer(input);
      if (result.status !== "calculated")
        throw new Error(JSON.stringify(result));
      const vat = result.estimate.breakdown.find(
        (c) => c.code === "gas.vat",
      )?.amount;
      const sales = result.estimate.breakdown.find(
        (c) => c.code === "gas.sales",
      )?.amount;
      if (vat === undefined || sales === undefined)
        throw new Error("Gas sales/VAT estimate missing");
      const salesUncertainty = new Decimal(probe.baselineUncertainty).plus(
        new Decimal(rate.uncertainty).mul(probe.volume),
      );
      return {
        id: probe.id,
        profile: rate.profile,
        volume: probe.volume,
        municipalityCode: probe.municipalityCode,
        evidenceIndex: probe.evidenceIndex,
        predictedSales: sales,
        predictedVat: vat,
        predictedTotal: result.estimate.annualCost,
        totalBound: salesUncertainty.mul("1.22").plus("0.01").toString(),
        vatBound: salesUncertainty.mul("0.22").plus("0.015").toString(),
      };
    }),
  );
  // Freeze every model prediction before reading tax/total holdout evidence.
  await writeFile(
    values.out,
    JSON.stringify(
      { state: "predictions_before_evidence_read", predictions },
      null,
      2,
    ),
    { flag: "wx" },
  );
  const results = [];
  for (const prediction of predictions) {
    const proof = snapshot.evidence[prediction.evidenceIndex];
    const body = await readFile(join(artifactDir, proof.blobKey), "utf8");
    if (createHash("sha256").update(body).digest("hex") !== proof.sha256)
      throw new Error("Official tax proof checksum mismatch");
    const observed = parseGasTaxQuote(body);
    const vat = new Decimal(observed.vat10).plus(observed.vat22);
    const totalResidual = new Decimal(prediction.predictedTotal).minus(
      observed.annualTotal,
    );
    const vatResidual = new Decimal(prediction.predictedVat).minus(vat);
    results.push({
      ...prediction,
      observed,
      observedVat: vat.toString(),
      totalResidual: totalResidual.toString(),
      vatResidual: vatResidual.toString(),
      totalPass: totalResidual.abs().lte(prediction.totalBound),
      vatPass: vatResidual.abs().lte(prediction.vatBound),
    });
  }
  await writeFile(
    values.out,
    JSON.stringify({ state: "observed", results }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        report: values.out,
        observations: results.length,
        totalFailures: results.filter((r) => !r.totalPass).length,
        vatFailures: results.filter((r) => !r.vatPass).length,
        failures: results.filter((r) => !r.totalPass || !r.vatPass),
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Gas CCR tax verification failed",
  );
  process.exitCode = 1;
});
