import Decimal from "decimal.js";
import { child, field, records } from "../../catalog/normalize";
import { resolvePortalMunicipality } from "../../references/registry";
import { coherentOfferEstimate, evaluateEligibility } from "../common";
import type {
  CostComponent,
  OfferCalculation,
  OfferCalculationInput,
} from "../contracts";
import { gasDiscounts } from "./discounts";
import { gasMonths, gasSales } from "./sales";

const D = Decimal.clone({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
class MissingGasData extends Error {}
function parameter(input: OfferCalculationInput, key: string) {
  const rows = input.catalog.parameters?.rows.filter(
    (row) => row.nome_parametro === key,
  );
  if (rows?.length !== 1)
    throw new MissingGasData(`Parametro gas mancante o ambiguo: ${key}`);
  const value = new D(rows[0].valore);
  if (!value.isFinite())
    throw new MissingGasData(`Parametro gas non numerico: ${key}`);
  return value;
}
function progressive(volume: Decimal, rates: Decimal[], limits: number[]) {
  let sum = new D(0),
    previous = new D(0);
  for (let i = 0; i < rates.length; i++) {
    const upper = limits[i] === Infinity ? volume : new D(limits[i]);
    const amount = D.max(0, D.min(volume, upper).minus(previous));
    sum = sum.plus(amount.mul(rates[i]));
    previous = upper;
  }
  return sum;
}
export function calculateGasOffer(
  input: OfferCalculationInput,
): OfferCalculation {
  const { offer, profile } = input;
  try {
    if (
      profile.commodity !== "gas" ||
      offer.commodity !== "gas" ||
      !profile.gas ||
      profile.annualConsumption.unit !== "Smc"
    )
      throw new MissingGasData("Serve un profilo gas confermato in Smc.");
    if (!input.catalog.references || !input.catalog.parameters)
      throw new MissingGasData("Riferimenti e parametri gas non disponibili.");
    const location = resolvePortalMunicipality(
      input.catalog.references,
      profile.municipality.portalCode,
      "gas",
    );
    if (location.status === "unavailable")
      return {
        status: "ineligible",
        offerCode: offer.code,
        reasons: location.reasons,
      };
    if (location.status !== "ready" || !location.gas)
      throw new MissingGasData(
        location.status === "ready"
          ? "Profilo fiscale gas assente."
          : location.reasons.join(", "),
      );
    const details = child(offer.sourceRecord, "DettaglioOfferta");
    if (
      ["01", "02"].includes(field(details, "OFFERTA_ONNICOMPRENSIVA")) ||
      ["flat", "unknown"].includes(offer.offerType)
    )
      throw new MissingGasData(
        "Nuova famiglia gas FLAT/onnicomprensiva: qualifica numerica e fiscale richiesta prima del confronto completo.",
      );
    const volume = new D(profile.annualConsumption.value);
    if (volume.gt(200000))
      throw new MissingGasData("Tariffe oltre 200.000 Smc non qualificate.");
    const area = (
      {
        north_west: 1,
        north_east: 2,
        central: 3,
        central_south_east: 4,
        central_south_west: 5,
        south: 6,
        sardinia: 7,
      } as Record<string, number>
    )[location.territory.gasArea];
    if (!area)
      throw new MissingGasData("Ambito tariffario gas non qualificato.");
    const meter = new D(profile.gas.meterClass.slice(1));
    const group = meter.lte(6) ? 1 : meter.lte(40) ? 2 : 3;
    const fixedNetwork = parameter(input, `tau1_cc${group}_a${area}`)
      .plus(parameter(input, `st_a${area}`))
      .plus(parameter(input, `vr_a${area}`));
    const tierLimits = [120, 480, 1560, 5000, 80000, 200000];
    const variableNetwork = progressive(
      volume,
      Array.from({ length: 6 }, (_, i) =>
        parameter(input, `tau3_f${i + 1}_a${area}`),
      ),
      tierLimits,
    ).plus(
      volume.mul(
        parameter(input, "qt")
          .plus(parameter(input, "rs"))
          .plus(parameter(input, "ug1")),
      ),
    );
    const lowVolume = D.min(480, volume);
    const lowNetwork = progressive(
      lowVolume,
      Array.from({ length: 6 }, (_, i) =>
        parameter(input, `tau3_f${i + 1}_a${area}`),
      ),
      tierLimits,
    ).plus(
      lowVolume.mul(
        parameter(input, "qt")
          .plus(parameter(input, "rs"))
          .plus(parameter(input, "ug1")),
      ),
    );
    const fixedCharges = parameter(input, "ug2s");
    const variableCharges = progressive(
      volume,
      Array.from({ length: 6 }, (_, i) => parameter(input, `ug2p_d_f${i + 1}`)),
      tierLimits,
    ).plus(volume.mul(parameter(input, "re").plus(parameter(input, "ug3"))));
    const lowCharges = progressive(
      lowVolume,
      Array.from({ length: 6 }, (_, i) => parameter(input, `ug2p_d_f${i + 1}`)),
      tierLimits,
    ).plus(lowVolume.mul(parameter(input, "re").plus(parameter(input, "ug3"))));
    const gasReference = location.gas;
    const taxRates = gasReference.rates.excise.map((r, i) =>
      new D(r.eur_smc).plus(gasReference.rates.regional[i].eur_smc),
    );
    const taxes = progressive(volume, taxRates, [120, 480, 1560, Infinity]);
    const lowTaxes = progressive(lowVolume, taxRates, [
      120,
      480,
      1560,
      Infinity,
    ]);
    const eligibility = evaluateEligibility(input);
    if (
      eligibility.status === "ineligible" ||
      eligibility.status === "incomplete_data"
    )
      return {
        status: eligibility.status,
        offerCode: offer.code,
        reasons: eligibility.reasons,
      };
    const months = gasMonths(input, location.gas.operationalProfile);
    const commercial = gasSales(
      input,
      months,
      profile.gas.usage === "heating"
        ? location.gas.operationalProfile
        : profile.gas.usage === "cooking_hot_water"
          ? "C2"
          : "T1",
    );
    const fixedSales = commercial.fixed,
      variableSales = commercial.variable,
      lowSales = commercial.low;
    const discounts = gasDiscounts(input, months, commercial);
    const sales = fixedSales.plus(variableSales),
      network = fixedNetwork.plus(variableNetwork),
      charges = fixedCharges.plus(variableCharges);
    const net = sales
      .plus(network)
      .plus(charges)
      .plus(taxes)
      .minus(discounts.fixed)
      .minus(discounts.variable);
    const lowBase = lowSales
      .plus(lowNetwork)
      .plus(lowCharges)
      .plus(lowTaxes)
      .minus(discounts.low);
    const vat = lowBase
      .mul(parameter(input, "iva_f1"))
      .plus(net.minus(lowBase).mul(parameter(input, "iva_f3")));
    const total = net.plus(vat).minus(discounts.afterVat);
    const breakdown: CostComponent[] = [
      {
        code: "gas.sales",
        label: "Vendita gas",
        amount: sales.toFixed(2),
        category: "sales",
      },
      {
        code: "gas.network",
        label: "Rete e gestione contatore",
        amount: network.toFixed(2),
        category: "network",
      },
      {
        code: "gas.charges",
        label: "Oneri generali",
        amount: charges.toFixed(2),
        category: "charges",
      },
      {
        code: "gas.excise",
        label: "Accisa e addizionale regionale",
        amount: taxes.toFixed(2),
        category: "excise",
      },
      {
        code: "gas.vat",
        label: "IVA normativa",
        amount: vat.toFixed(2),
        category: "vat",
      },
      ...discounts.breakdown,
    ];
    return {
      status: "calculated",
      estimate: coherentOfferEstimate(input, {
        annualCost: total.toString(),
        breakdown,
        eligibility,
        conditions: discounts.conditions,
        assumptions: [
          "Stima al riferimento convenzionale gas 0,03852 GJ/Smc; aliquote e parametri ufficiali versionati.",
          "Profilo mensile AU qualificato; scaglioni commerciali midpoint, specifici prima del default, minimo PREZZO e variabile al pareggio.",
          ...(records(offer.sourceRecord.ComponentiRegolate).some((r) =>
            (Array.isArray(r.CODICE) ? r.CODICE : [r.CODICE]).includes("03"),
          )
            ? [
                "CCR annuale dedotta da simulazioni ufficiali per il profilo AU; coefficiente di scenario versionato.",
              ]
            : []),
          ...(offer.offerType === "mixed"
            ? [
                "IVA normativa del ramo misto; non riproduciamo l’anomalia IVA osservata nel simulatore del Portale.",
              ]
            : []),
        ],
      }),
    };
  } catch (error) {
    return {
      status: "incomplete_data",
      offerCode: offer.code,
      reasons: [
        error instanceof Error ? error.message : "Dati gas non interpretabili.",
      ],
    };
  }
}
