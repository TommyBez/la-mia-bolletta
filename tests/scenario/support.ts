export function gasSnapshot() {
  const quarters = ["2026-Q4", "2027-Q1", "2027-Q2", "2027-Q3"];
  const values = [
    "0.8568583333333333333333333333",
    "0.84325",
    "0.62185",
    "0.5751583333333333333333333333",
  ];
  return {
    schemaVersion: 1,
    commodity: "gas",
    acquisitionMonth: "2026-10",
    acquiredAt: "2026-10-28T12:00:00Z",
    method: "portal-implicit-quarterly-v1",
    provenance: "inferred_from_official_simulator",
    coverageStart: "2026-10-01",
    coverageEnd: "2027-09-30",
    catalogVersionId: "fixture-official-20261028",
    requiredAnnualFingerprints: [] as string[],
    evidence: [
      {
        blobKey: "scenario/2026-10/gas/probes.json",
        sha256: "a".repeat(64),
        kind: "sanitized_probe",
      },
    ],
    coefficients: quarters.map((quarter, i) => ({
      quarter,
      band: "BASE",
      index: "PSV",
      value: values[i],
      uncertainty: "0.000004166666666666666666666666667",
      unit: "EUR/Smc",
    })),
    calibrations: quarters.map((quarter, i) => ({
      id: `gas-${quarter}`,
      offerCode: "ZERO-FLEX-OFFICIAL-PROBE",
      quarter,
      band: "BASE",
      consumption: "1200",
      observedSales: ["1202.23", "1185.90", "920.22", "864.19"][i],
      fixedAnnual: "174",
      spread: "0",
      additiveUnit: "0",
      multiplier: "1",
      evidenceIndex: 0,
    })),
    holdouts: [
      {
        id: "independent-mixed-gas",
        offerCode: "ZERO-FLEX-OFFICIAL-PROBE",
        observedSales: "979.15",
        fixedAnnual: "174",
        spread: "0",
        additiveUnit: "0",
        multiplier: "1",
        terms: [
          { quarter: quarters[0], band: "BASE", consumption: "120" },
          { quarter: quarters[1], band: "BASE", consumption: "240" },
          { quarter: quarters[2], band: "BASE", consumption: "360" },
          { quarter: quarters[3], band: "BASE", consumption: "480" },
        ],
        evidenceIndex: 0,
      },
    ],
    annualSales: [],
  };
}
