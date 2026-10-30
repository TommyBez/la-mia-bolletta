import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canonical, digest } from "../catalog/normalize";
import type { OriginalStore } from "../catalog/originals";
import type { GasObservation } from "./registry";
export type ReferenceArchive = {
  sha256: string;
  blobPath: string;
  portalCodes: string[];
  bytes: number;
};
/** Bounded archives retain the exact sanitized official cost fragments privately.
 * The normalized rows are published only after every original has been verified. */
export async function archiveGasReferences(input: {
  observations: GasObservation[];
  directory: string;
  originals: OriginalStore;
  seedDirectory?: string;
  known?: { observationFingerprint: string; archives: ReferenceArchive[] };
}): Promise<ReferenceArchive[]> {
  const {
    observations,
    directory,
    originals,
    seedDirectory = "docs/evidenze/fiscalita-gas-2026-10-29",
  } = input;
  const sorted = [...observations].sort((a, b) =>
    a.portalCode.localeCompare(b.portalCode),
  );
  if (input.known?.observationFingerprint === digest(canonical(sorted))) {
    const codes = input.known.archives.flatMap(
      (archive) => archive.portalCodes,
    );
    const expected = new Set(sorted.map((row) => row.portalCode));
    if (
      codes.length !== expected.size ||
      new Set(codes).size !== expected.size ||
      codes.some((code) => !expected.has(code))
    )
      throw new Error("Retained reference archive coverage mismatch");
    return input.known.archives;
  }
  const batches = Array.from(
    { length: Math.ceil(sorted.length / 100) },
    (_, i) => sorted.slice(i * 100, (i + 1) * 100),
  );
  const results: ReferenceArchive[] = [];
  for (let offset = 0; offset < batches.length; offset += 4) {
    const group = await Promise.all(
      batches.slice(offset, offset + 4).map(async (batch) => {
        const records = [];
        for (const observation of batch) {
          const name = `${observation.portalCode}-cost.html`;
          const cost = await readFile(resolve(directory, name), "utf8").catch(
            async (error) => {
              if (error.code !== "ENOENT") throw error;
              return readFile(resolve(seedDirectory, name), "utf8");
            },
          );
          if (digest(cost) !== observation.costFragmentSha256)
            throw new Error(
              `Official reference checksum mismatch ${observation.portalCode}`,
            );
          if (/csrf|currentFilterJSON|sessionid/i.test(cost))
            throw new Error(
              `Unsafe reference fragment ${observation.portalCode}`,
            );
          const originalObservation = await readFile(
            resolve(directory, `${observation.portalCode}.json`),
            "utf8",
          );
          records.push({
            portalCode: observation.portalCode,
            observationOriginal: originalObservation,
            costFragment: cost,
          });
        }
        const body = JSON.stringify({
          schemaVersion: 1,
          kind: "sanitized_official_gas_reference_fragments",
          records,
        });
        const sha256 = digest(body);
        const stored = await originals.put(
          `references/gas/${sha256}.json`,
          body,
        );
        return {
          sha256,
          blobPath: stored.path,
          portalCodes: batch.map((o) => o.portalCode),
          bytes: Buffer.byteLength(body),
        };
      }),
    );
    results.push(...group);
  }
  return results;
}
export async function archiveReferenceSourceCaptures(input: {
  originals: OriginalStore;
  territorialDirectory?: string;
  geographyDirectory?: string;
  suppliersDirectory?: string;
  knownArchives?: {
    kind: string;
    sha256: string;
    blobPath: string;
    bytes: number;
  }[];
}) {
  const {
    originals,
    territorialDirectory = "docs/evidenze/riferimenti-territoriali-2026-10-29",
    geographyDirectory = "src/modules/references/data/portal-geography",
  } = input;
  const territorial = JSON.parse(
    await readFile(resolve(territorialDirectory, "manifest.json"), "utf8"),
  ) as { sources: Record<string, string>; files: Record<string, string> };
  const geographic = JSON.parse(
    await readFile(resolve(geographyDirectory, "manifest.json"), "utf8"),
  ) as {
    sources: {
      prefix: string;
      source: string;
      sha256: string;
      observedAt: string;
    }[];
  };
  const captures = [];
  for (const [path, sourceUrl] of Object.entries(territorial.sources)) {
    const expected = territorial.files[path];
    if (!expected) continue;
    const bytes = await readFile(resolve(territorialDirectory, path));
    if (digest(bytes) !== expected)
      throw new Error(`Territorial capture checksum mismatch ${path}`);
    captures.push({
      kind: "research_source_capture",
      capturedAs: path,
      sourceUrl,
      sha256: expected,
      encoding: "base64",
      body: bytes.toString("base64"),
    });
  }
  for (const source of geographic.sources) {
    const bytes = await readFile(
      resolve(geographyDirectory, `${source.prefix}.raw.json`),
    );
    if (digest(bytes) !== source.sha256)
      throw new Error(`Geographic source checksum mismatch ${source.prefix}`);
    captures.push({
      kind: "original_official_geographic_response",
      capturedAs: `${source.prefix}.raw.json`,
      sourceUrl: source.source,
      sha256: source.sha256,
      encoding: "base64",
      body: bytes.toString("base64"),
    });
  }
  const suppliersDirectory =
    input.suppliersDirectory ?? "src/modules/references/data/suppliers";
  const suppliers = JSON.parse(
    await readFile(resolve(suppliersDirectory, "manifest.json"), "utf8"),
  ) as { sources: { url: string; sha256: string; file: string }[] };
  for (const source of suppliers.sources) {
    const bytes = await readFile(resolve(suppliersDirectory, source.file));
    if (digest(bytes) !== source.sha256)
      throw new Error("Supplier registry original checksum mismatch");
    captures.push({
      kind: "original_official_supplier_registry",
      capturedAs: source.file,
      sourceUrl: source.url,
      sha256: source.sha256,
      encoding: "base64",
      body: bytes.toString("base64"),
    });
  }
  const body = JSON.stringify({ schemaVersion: 1, captures });
  const sha256 = digest(body);
  const retained = input.knownArchives?.find(
    (archive) => archive.sha256 === sha256,
  );
  if (retained) return retained;
  const stored = await originals.put(`references/sources/${sha256}.json`, body);
  return {
    kind: "official_reference_source_captures",
    sha256,
    blobPath: stored.path,
    bytes: Buffer.byteLength(body),
  };
}
