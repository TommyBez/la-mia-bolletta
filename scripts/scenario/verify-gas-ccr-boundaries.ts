#!/usr/bin/env -S node --import tsx
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import Decimal from "decimal.js";
import { normalizeOffers } from "../../src/modules/catalog/normalize";
import type { CatalogRead } from "../../src/modules/catalog/service";
import { parseParameters } from "../../src/modules/catalog/source";
import { calculateGasOffer } from "../../src/modules/comparison/gas";
import { annualGasRegulatedBaseline } from "../../src/modules/comparison/gas/annual-regulated";
import { createAnnualGasProbeInput } from "../../src/modules/comparison/gas/annual-regulated-acquisition";
import {
  acquireGasPortalQuote,
  parseGasTaxQuote,
} from "../../src/modules/comparison/gas/supplement-acquisition";
import { bundledReferences } from "../../src/modules/references/registry";
import { scenarioSnapshotSchema } from "../../src/modules/scenario";

async function main() {
  const { values } = parseArgs({
    options: {
      xml: { type: "string" },
      snapshot: { type: "string" },
      out: { type: "string" },
      profiles: { type: "string" },
    },
  });
  if (!values.xml || !values.snapshot || !values.out)
    throw new Error(
      "Usage: --xml official.xml --snapshot artifact/snapshot.json --out NEW-directory [--profiles C2,C1F]",
    );
  const snapshot = scenarioSnapshotSchema.parse(
    JSON.parse(await readFile(values.snapshot, "utf8")),
  );
  const root = dirname(values.snapshot);
  const refs = bundledReferences();
  const parameter = snapshot.evidence.find(
    (e) => e.kind === "official_method" && e.blobKey.endsWith(".csv"),
  );
  if (!parameter) throw new Error("Pinned official parameters required");
  const xml = await readFile(values.xml, "utf8"),
    xmlSha = createHash("sha256").update(xml).digest("hex");
  if (
    !snapshot.evidence.some(
      (e) => e.kind === "official_offer" && e.sha256 === xmlSha,
    )
  )
    throw new Error("Gas XML differs from pinned source");
  const parameterBody = await readFile(join(root, parameter.blobKey), "utf8");
  if (
    createHash("sha256").update(parameterBody).digest("hex") !==
    parameter.sha256
  )
    throw new Error("Official parameter checksum mismatch");
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
  await mkdir(values.out);
  const requested = values.profiles?.split(",");
  const rates = (snapshot.annualRegulatedRates ?? []).filter(
    (r) =>
      r.profile !== "T1" &&
      (!requested || requested.includes(r.profile.replaceAll(" ", ""))),
  );
  if (!rates.length) throw new Error("No qualified domestic profiles selected");
  const results = [];
  for (const rate of rates) {
    if (rate.profile === "T1") throw new Error("T1 is outside domestic scope");
    const code = rate.calibrations[2].offerCode;
    const locality = refs.portalMunicipalities.find(
      (m) => m.code === rate.calibrations[0].municipalityCode,
    );
    if (!locality) throw new Error("Official calibration locality unavailable");
    for (const volume of ["120", "400", "480", "481"]) {
      const input = createAnnualGasProbeInput(
        catalog,
        snapshot,
        code,
        { portalCode: locality.code, name: locality.name },
        rate.profile,
        volume,
      );
      const baseline = annualGasRegulatedBaseline(input);
      const result = calculateGasOffer(input);
      if (result.status !== "calculated")
        throw new Error(JSON.stringify(result));
      const predictedSales = result.estimate.breakdown.find(
        (c) => c.code === "gas.sales",
      )?.amount;
      const predictedVat = result.estimate.breakdown.find(
        (c) => c.code === "gas.vat",
      )?.amount;
      if (!predictedSales || !predictedVat)
        throw new Error("Required prediction breakdown unavailable");
      const uncertainty = new Decimal(baseline.baselineUncertainty).plus(
        new Decimal(rate.uncertainty).mul(volume),
      );
      const prediction = {
        profile: rate.profile,
        municipality: { portalCode: locality.code, name: locality.name },
        offerCode: code,
        volume,
        predictedSales,
        predictedVat,
        predictedTotal: result.estimate.annualCost,
        totalBound: uncertainty.mul("1.22").plus("0.01").toString(),
        vatBound: uncertainty.mul("0.22").plus("0.015").toString(),
        predictedAt: new Date().toISOString(),
      };
      const stem = `${rate.profile.replaceAll(" ", "")}-${locality.code}-${volume}`;
      const predictionBody = JSON.stringify(prediction, null, 2);
      await writeFile(
        join(values.out, `${stem}-prediction.json`),
        predictionBody,
        { flag: "wx" },
      );
      console.log(JSON.stringify({ state: "prediction_saved", ...prediction }));
      const quote = await acquireGasPortalQuote(
        input.offer,
        volume,
        rate.profile === "C2" ? "cooking_hot_water" : "heating",
        fetch,
        prediction.municipality,
      );
      const sha256 = createHash("sha256").update(quote.body).digest("hex");
      await writeFile(join(values.out, `${sha256}.html.txt`), quote.body);
      const observed = parseGasTaxQuote(quote.body);
      const observedVat = new Decimal(observed.vat10).plus(observed.vat22);
      const salesResidual = new Decimal(predictedSales).minus(
          quote.observedSales,
        ),
        vatResidual = new Decimal(predictedVat).minus(observedVat),
        totalResidual = new Decimal(prediction.predictedTotal).minus(
          observed.annualTotal,
        );
      const observation = {
        ...prediction,
        observedSales: quote.observedSales,
        observed,
        sha256,
        predictionSha256: createHash("sha256")
          .update(predictionBody)
          .digest("hex"),
        salesResidual: salesResidual.toString(),
        vatResidual: vatResidual.toString(),
        totalResidual: totalResidual.toString(),
        totalPass: totalResidual.abs().lte(prediction.totalBound),
        vatPass: vatResidual.abs().lte(prediction.vatBound),
      };
      results.push(observation);
      await writeFile(
        join(values.out, "report.json"),
        JSON.stringify(results, null, 2),
      );
      console.log(JSON.stringify({ state: "observed", ...observation }));
    }
  }
  console.log(
    JSON.stringify({
      state: "complete",
      observations: results.length,
      failures: results.filter((r) => !r.totalPass || !r.vatPass).length,
      report: join(values.out, "report.json"),
    }),
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Official CCR boundary verification failed",
  );
  process.exitCode = 1;
});
