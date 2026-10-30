import { z } from "zod";
import { type Commodity, canonical, digest } from "../catalog/normalize";
import {
  type GasSaleSupplement,
  gasSaleSupplementSchema,
} from "../comparison/gas/supplement";
import initialGasObservations from "./data/gas-observations.json";
import gasProfiles from "./data/gas-profiles.json";
import initialGasSaleSupplements from "./data/gas-sale-supplements.json";
import mergerCrosswalk from "./data/merger-crosswalk.json";
import currentMunicipalities from "./data/municipalities.json";
import portalData from "./data/portal-geography/all.json";
import portalGeographyManifest from "./data/portal-geography/manifest.json";
import initialReferenceArchives from "./data/reference-archives.json";
import electricityRegulatedRates from "./data/regulatory-rates-electricity.json";
import gasRegulatedRates from "./data/regulatory-rates-gas.json";
import supplierManifest from "./data/suppliers/manifest.json";
import supplierDirectory from "./data/suppliers/suppliers.json";
import taxSeed from "./data/tax-seed.json";
import territorialManifest from "./data/territorial-manifest.json";

const rate = z.string().regex(/^\d+(?:\.\d+)?$/);
export const gasObservationSchema = z.object({
  portalCode: z.string().regex(/^\d{6}$/),
  name: z.string(),
  source: z.string().url(),
  observedAt: z.string().datetime({ offset: true }),
  operationalProfile: z.enum(["C1 B", "C1 C", "C1 D", "C1 E", "C1 F"]),
  rates: z.object({
    excise: z.array(z.object({ label: z.string(), eur_smc: rate })).length(4),
    regional: z.array(z.object({ label: z.string(), eur_smc: rate })).length(4),
  }),
  syntheticAnnualSmc: z.string(),
  usage: z.literal("RISC"),
  calibrationOffer: z.string(),
  saleEur: rate,
  costFragmentSha256: z.string().length(64),
  calibrationScenarioSha256: z.string().length(64).optional(),
  profileResidualEur: z.string().optional(),
});
export type GasObservation = z.infer<typeof gasObservationSchema>;
export type PortalMunicipality = {
  code: string;
  name: string;
  excludedElectricity: boolean;
  excludedGas: boolean;
};
export type Municipality = {
  currentIstatCode: string;
  name: string;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  gasArea: string;
  portalCodes: string[];
  crosswalkStatus:
    | "same_code"
    | "official_historical_code"
    | "official_merger_localities"
    | "unresolved";
  normativeClimateZone: string | null;
  normativeClimateStatus: string;
};
export type ReferenceBundle = {
  versionId: string;
  sourceDate: string;
  acquiredAt: string;
  municipalities: Municipality[];
  portalMunicipalities: PortalMunicipality[];
  gasProfiles: typeof gasProfiles.profiles;
  gasObservations: GasObservation[];
  regulatedRates: RegulatedRate[];
  suppliers: Supplier[];
  offerSalesSupplements: GasSaleSupplement[];
  taxSeeds: typeof taxSeed.rows;
  coverage: {
    currentMunicipalities: number;
    portalMunicipalities: number;
    crosswalkResolved: number;
    unresolvedCrosswalk: number;
    qualifiedGas: number;
    eligibleGas: number;
    gasNationalReady: boolean;
    electricityNationalReady: boolean;
    eligibleElectricity: number;
    electricityTerritoriesQualified: number;
    gasTerritoriesQualified: number;
  };
  manifest: unknown;
};
/** Builds a versioned crosswalk using official alternate ISTAT encodings. A merger
 * lacking an official unique identity remains unresolved, never assigned a predecessor. */
export function bundledReferences(
  observations: GasObservation[] = initialGasObservations as GasObservation[],
): ReferenceBundle {
  const portalMunicipalities: PortalMunicipality[] = portalData.items.map(
    (r) => ({
      code: String(r.codIstat).padStart(6, "0"),
      name: r.denominazione,
      excludedElectricity: r.esclusoOffertaEE === 1,
      excludedGas: r.esclusoOffertaGas === 1,
    }),
  );
  const byCode = new Map(portalMunicipalities.map((r) => [r.code, r]));
  const municipalities: Municipality[] = currentMunicipalities.map((m) => {
    const alternate = Object.values(m.istat_code_encodings_by_province_layout);
    const merger = mergerCrosswalk.find(
      (row) => row.currentIstatCode === m.istat_code,
    );
    const portalCodes = merger
      ? merger.portalLocalities.map((locality) => locality.portalCode)
      : byCode.has(m.istat_code)
        ? [m.istat_code]
        : [...new Set(alternate.filter((c) => byCode.has(c)))];
    return {
      currentIstatCode: m.istat_code,
      name: m.full_name,
      regionCode: m.region_code,
      regionName: m.region_name,
      provinceCode: m.province_historical_code,
      provinceName: m.province_name,
      gasArea: m.gas_geographic_area,
      portalCodes,
      crosswalkStatus: merger
        ? "official_merger_localities"
        : portalCodes.length === 1
          ? portalCodes[0] === m.istat_code
            ? "same_code"
            : "official_historical_code"
          : "unresolved",
      normativeClimateZone:
        typeof m.climate_zone === "string" ? m.climate_zone : null,
      normativeClimateStatus: m.climate_status,
    };
  });
  const gasObservations = observations.map((v) =>
    gasObservationSchema.parse(v),
  );
  const uniqueObs = new Map(gasObservations.map((o) => [o.portalCode, o]));
  if (uniqueObs.size !== gasObservations.length)
    throw new Error("Duplicate gas reference municipality");
  for (const observation of gasObservations) {
    const town = byCode.get(observation.portalCode);
    if (!town || town.excludedGas)
      throw new Error(
        "Gas reference outside official gas perimeter " +
          observation.portalCode,
      );
  }
  const territoryByProvince = new Map<string, Set<string>>();
  const territoryByPortal = new Map<string, Set<string>>();
  for (const m of municipalities) {
    const key = `${m.regionCode}:${m.provinceCode}:${m.gasArea}`;
    const province = territoryByProvince.get(m.provinceCode) ?? new Set();
    province.add(key);
    territoryByProvince.set(m.provinceCode, province);
    for (const code of m.portalCodes) {
      const codes = territoryByPortal.get(code) ?? new Set();
      codes.add(key);
      territoryByPortal.set(code, codes);
    }
  }
  const territoryQualified = (code: string) =>
    (territoryByPortal.get(code) ?? territoryByProvince.get(code.slice(0, 3)))
      ?.size === 1;
  const gasEligible = portalMunicipalities.filter((m) => !m.excludedGas),
    electricityEligible = portalMunicipalities.filter(
      (m) => !m.excludedElectricity,
    );
  const eligibleGas = gasEligible.length;
  const coverage = {
    currentMunicipalities: municipalities.length,
    portalMunicipalities: portalMunicipalities.length,
    crosswalkResolved: municipalities.filter(
      (m) => m.crosswalkStatus !== "unresolved",
    ).length,
    unresolvedCrosswalk: municipalities.filter(
      (m) => m.crosswalkStatus === "unresolved",
    ).length,
    qualifiedGas: gasObservations.length,
    eligibleGas,
    gasNationalReady: gasEligible.every(
      (m) => uniqueObs.has(m.code) && territoryQualified(m.code),
    ),
    electricityNationalReady: electricityEligible.every((m) =>
      territoryQualified(m.code),
    ),
    eligibleElectricity: electricityEligible.length,
    electricityTerritoriesQualified: electricityEligible.filter((m) =>
      territoryQualified(m.code),
    ).length,
    gasTerritoriesQualified: gasEligible.filter((m) =>
      territoryQualified(m.code),
    ).length,
  };
  const regulatedRates = [
    ...electricityRegulatedRates,
    ...gasRegulatedRates,
  ].map((rate) => regulatedRateSchema.parse(rate));
  const keys = new Map<string, string>();
  for (const rate of regulatedRates) {
    const key = `${rate.commodity}:${rate.code}:${rate.quarter ?? "current"}:${rate.band ?? "all"}`;
    if (keys.has(key) && keys.get(key) !== rate.value)
      throw new Error(`Conflicting regulated reference ${key}`);
    keys.set(key, rate.value);
  }
  const suppliers = supplierDirectory.map((row) => supplierSchema.parse(row));
  const offerSalesSupplements = initialGasSaleSupplements.map((record) =>
    gasSaleSupplementSchema.parse(record),
  );
  const payload = {
    municipalities,
    portalMunicipalities,
    gasProfiles: gasProfiles.profiles,
    gasObservations,
    regulatedRates,
    suppliers,
    offerSalesSupplements,
    taxSeeds: taxSeed.rows,
    coverage,
    manifest: {
      territorial: territorialManifest,
      suppliers: supplierManifest,
      mergerCrosswalk,
      portalObservedAt: portalData.observedAt,
      portalGeographySources: portalGeographyManifest,
      privateGasOriginalArchives: initialReferenceArchives.gasArchives,
      privateSourceArchives: initialReferenceArchives.sourceArchives,
      taxSeedObservedOn: taxSeed.observed_on,
      gasProfilesSource: gasProfiles.source,
      operationalProfile:
        "Official Portal simulation, unique fit against AU profile and independently recovered coefficients; does not replace statutory climatic zone",
    },
  };
  return {
    ...payload,
    versionId: digest(canonical(payload)),
    sourceDate: "2026-10-29",
    acquiredAt: portalData.observedAt,
  };
}
export function resolveMunicipality(
  refs: ReferenceBundle,
  code: string,
  commodity: Commodity,
  portalLocalityCode?: string,
) {
  const municipality = refs.municipalities.find(
    (m) => m.currentIstatCode === code,
  );
  if (!municipality)
    return {
      status: "incomplete_data" as const,
      reasons: ["unknown_current_municipality"],
    };
  const portalCodes = municipality.portalCodes;
  const selected =
    portalLocalityCode && portalCodes.includes(portalLocalityCode)
      ? portalLocalityCode
      : portalCodes.length === 1
        ? portalCodes[0]
        : undefined;
  if (!selected)
    return {
      status: "incomplete_data" as const,
      reasons: ["unresolved_portal_crosswalk"],
      municipality,
    };
  const portal = refs.portalMunicipalities.find((m) => m.code === selected);
  if (!portal)
    return {
      status: "incomplete_data" as const,
      reasons: ["missing_portal_municipality"],
      municipality,
    };
  if (
    commodity === "electricity"
      ? portal.excludedElectricity
      : portal.excludedGas
  )
    return {
      status: "unavailable" as const,
      reasons: ["official_commodity_exclusion"],
      municipality,
      portal,
    };
  const observation = refs.gasObservations.find(
    (m) => m.portalCode === selected,
  );
  const seed = refs.taxSeeds.find((m) => m.istat === selected);
  const operationalProfile = observation?.operationalProfile;
  const rates = observation?.rates ?? seed?.rates;
  if (commodity === "gas" && (!operationalProfile || !rates))
    return {
      status: "incomplete_data" as const,
      reasons: [
        ...(!operationalProfile ? ["missing_gas_profile"] : []),
        ...(!rates ? ["missing_gas_tax_rates"] : []),
      ],
      municipality,
      portal,
    };
  return {
    status: "ready" as const,
    municipality,
    portal,
    gas:
      commodity === "gas"
        ? {
            operationalProfile,
            rates,
            profileSource: observation
              ? "portal_observed"
              : "normative_name_match",
            ratesSource: observation?.source ?? seed?.source,
            observedAt: observation?.observedAt ?? taxSeed.observed_on,
          }
        : undefined,
  };
}
/** Exact Portal identity accepted by the public simulator. A statutory merger may
 * have several Portal localities; the chosen locality is never re-labelled as a
 * current ISTAT municipality. Region/area can still be joined by official province. */
export function resolvePortalMunicipality(
  refs: ReferenceBundle,
  portalCode: string,
  commodity: Commodity,
) {
  const portal = refs.portalMunicipalities.find((m) => m.code === portalCode);
  if (!portal)
    return {
      status: "incomplete_data" as const,
      reasons: ["unknown_portal_municipality"],
    };
  if (
    commodity === "electricity"
      ? portal.excludedElectricity
      : portal.excludedGas
  )
    return {
      status: "unavailable" as const,
      reasons: ["official_commodity_exclusion"],
      portal,
    };
  const currentCandidates = refs.municipalities.filter((m) =>
    m.portalCodes.includes(portalCode),
  );
  const provinceCandidates = currentCandidates.length
    ? currentCandidates
    : refs.municipalities.filter(
        (m) => m.provinceCode === portalCode.slice(0, 3),
      );
  const territories = [
    ...new Map(
      provinceCandidates.map((m) => [
        `${m.regionCode}:${m.provinceCode}:${m.gasArea}`,
        {
          regionCode: m.regionCode,
          regionName: m.regionName,
          provinceCode: m.provinceCode,
          provinceName: m.provinceName,
          gasArea: m.gasArea,
        },
      ]),
    ).values(),
  ];
  if (territories.length !== 1)
    return {
      status: "incomplete_data" as const,
      reasons: ["unresolved_portal_territory"],
      portal,
      currentIstatCandidates: currentCandidates.map((m) => m.currentIstatCode),
    };
  const observation = refs.gasObservations.find(
    (m) => m.portalCode === portalCode,
  );
  if (commodity === "gas" && !observation)
    return {
      status: "incomplete_data" as const,
      reasons: ["missing_qualified_gas_reference"],
      portal,
      territory: territories[0],
      currentIstatCandidates: currentCandidates.map((m) => m.currentIstatCode),
    };
  return {
    status: "ready" as const,
    portal,
    territory: territories[0],
    currentIstatCode:
      currentCandidates.length === 1
        ? currentCandidates[0].currentIstatCode
        : null,
    currentIstatCandidates: currentCandidates.map((m) => m.currentIstatCode),
    gas: commodity === "gas" ? observation : undefined,
  };
}
export const regulatedRateSchema = z.object({
  commodity: z.enum(["electricity", "gas"]),
  code: z.string().min(1),
  quarter: z
    .string()
    .regex(/^\d{4}-Q[1-4]$/)
    .optional(),
  band: z.string().optional(),
  value: z.string().regex(/^[+-]?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?$/),
  unit: z.enum(["EUR/kWh", "EUR/Smc", "EUR/year", "EUR/kW/year", "EUR/GJ"]),
  sourceUrl: z
    .string()
    .url()
    .refine((url) => {
      const u = new URL(url);
      return (
        u.protocol === "https:" &&
        ["www.ilportaleofferte.it", "www.arera.it", "arera.it"].includes(
          u.hostname,
        )
      );
    }, "Regulated rates require an official Portal or ARERA source"),
  observedAt: z.string().datetime({ offset: true }),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type RegulatedRate = z.infer<typeof regulatedRateSchema>;

export function referenceContent(refs: ReferenceBundle) {
  return {
    municipalities: refs.municipalities,
    portalMunicipalities: refs.portalMunicipalities,
    gasProfiles: refs.gasProfiles,
    gasObservations: refs.gasObservations,
    ...(refs.regulatedRates !== undefined
      ? { regulatedRates: refs.regulatedRates }
      : {}),
    ...(refs.suppliers !== undefined ? { suppliers: refs.suppliers } : {}),
    ...(refs.offerSalesSupplements !== undefined
      ? { offerSalesSupplements: refs.offerSalesSupplements }
      : {}),
    taxSeeds: refs.taxSeeds,
    coverage: refs.coverage,
    manifest: refs.manifest,
  };
}
export function withReferenceArchives(
  refs: ReferenceBundle,
  archives: {
    sha256: string;
    blobPath: string;
    portalCodes: string[];
    bytes: number;
  }[],
  sourceArchives: {
    kind: string;
    sha256: string;
    blobPath: string;
    bytes: number;
  }[] = [],
): ReferenceBundle {
  const result = {
    ...refs,
    manifest: {
      ...(refs.manifest as Record<string, unknown>),
      privateGasOriginalArchives: archives,
      privateSourceArchives: sourceArchives,
    },
  };
  return { ...result, versionId: digest(canonical(referenceContent(result))) };
}

export const supplierSchema = z.object({
  vat: z.string().regex(/^\d{11}$/),
  name: z.string().min(1),
  sourceUrls: z
    .array(
      z
        .string()
        .url()
        .refine((url) =>
          ["www.arera.it", "arera.it"].includes(new URL(url).hostname),
        ),
    )
    .min(1),
  sourceSha256: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1),
  sourceVatValues: z.array(z.string().regex(/^\d{1,11}$/)).min(1),
  observedAt: z.string().datetime({ offset: true }),
});
export type Supplier = z.infer<typeof supplierSchema>;
export function resolveSupplierName(
  refs: ReferenceBundle,
  vat: string,
): string | undefined {
  const key = /^\d{1,11}$/.test(vat) ? vat.padStart(11, "0") : vat;
  const matches = (refs.suppliers ?? []).filter((row) => row.vat === key);
  return matches.length === 1 ? matches[0].name : undefined;
}
