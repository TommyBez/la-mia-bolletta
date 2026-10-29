"use client";

import {
  ArrowRight,
  Check,
  CircleHelp,
  Flame,
  LoaderCircle,
  PencilLine,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProfileFlow } from "@/components/profile/profile-flow";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConfirmedProfile } from "@/src/domain/profile";
import type { BillExtraction } from "@/src/modules/bill/extraction";
import type {
  ComparisonPreferences,
  ComparisonRequest,
  ComparisonResult,
  OfferDetailResult,
  OfferEstimate,
} from "@/src/modules/comparison/contracts";
import type { ArchivedOfferOption } from "@/src/modules/comparison/offer-archive";
import { summarizeComparisons } from "@/src/modules/comparison/summary";
import { CurrentArchivePicker } from "./current-archive-picker";
import styles from "./results.module.css";

type Commodity = "electricity" | "gas";
type Ready = Extract<ComparisonResult, { offers: unknown[] }>;
type Current = {
  enabled: boolean;
  source: "bill" | "archive";
  archive?: ArchivedOfferOption;
  priceKind: string;
  unitPrice: string;
  indexMultiplier: string;
  spread: string;
  indexIncludesNetworkLosses: boolean;
  fixedAnnualCharge: string;
  validFrom: string;
  validTo: string;
  complete: boolean;
  offerCode?: string;
  supplierName?: string;
};
type Supply = {
  profile?: ConfirmedProfile;
  preferences: ComparisonPreferences;
  current: Current;
  result?: ComparisonResult;
  request?: ComparisonRequest;
  busy: boolean;
  error?: string;
};
const fresh = (): Supply => ({
  preferences: { pricePreference: "any", requirements: {} },
  current: {
    enabled: false,
    source: "bill",
    priceKind: "unknown",
    unitPrice: "",
    indexMultiplier: "1",
    spread: "",
    indexIncludesNetworkLosses: false,
    fixedAnnualCharge: "",
    validFrom: "",
    validTo: "",
    complete: false,
  },
  busy: false,
});
const names = { electricity: "Luce", gas: "Gas" };
const money = (value: string) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    Number(value),
  );
const date = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
const fieldClass =
  "mt-2 w-full rounded-xl border border-[#c9d4ca] bg-white px-3 py-2.5 text-base outline-none focus:border-[#164d3b] focus:ring-2 focus:ring-[#164d3b]/20";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#164d3b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#103a2c] disabled:opacity-60";
const reasonLabels: Record<string, string> = {
  lower_estimated_annual_cost:
    "Il costo annuo stimato è inferiore a quello del tuo contratto attuale.",
  variable_price_scenario:
    "Il vantaggio dipende dall'andamento futuro dei prezzi: questa è una stima, non una garanzia.",
  fixed_price_preference:
    "Abbiamo rispettato la tua preferenza per il prezzo fisso dell'energia.",
  alternatives_available_current_contract_not_comparable:
    "Possiamo confrontare i costi delle alternative. Per stimare il risparmio servono le condizioni complete del contratto attuale.",
  current_contract_costs_no_more_than_selected_alternative:
    "Nelle stesse condizioni di consumo e periodo, la tua offerta attuale costa meno o quanto l'alternativa selezionata.",
  confirm_offer_requirements:
    "Le offerte disponibili richiedono ancora alcune conferme. Leggi le condizioni prima di scegliere.",
  no_eligible_fixed_offer:
    "Non risultano offerte fisse ammissibili con le conferme attuali. Puoi rivedere la preferenza o le condizioni.",
  no_eligible_offers:
    "Non risultano offerte ammissibili per questo profilo e le condizioni confermate.",
};

export function ComparisonWorkspace() {
  const [supplies, setSupplies] = useState<Record<Commodity, Supply>>({
    electricity: fresh(),
    gas: fresh(),
  });
  const [active, setActive] = useState<Commodity>("electricity");
  const activeSupply = useRef<Commodity>("electricity");
  const [editing, setEditing] = useState(true);
  const generations = useRef<Record<Commodity, number>>({
    electricity: 0,
    gas: 0,
  });
  const confirmed = useRef<Partial<Record<Commodity, ConfirmedProfile>>>({});
  const requests = useRef<Partial<Record<Commodity, AbortController>>>({});
  const detailGeneration = useRef(0);
  const [detail, setDetail] = useState<{
    commodity: Commodity;
    loading: boolean;
    result?: OfferDetailResult;
  } | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [rankingKind, setRankingKind] = useState<"eligible" | "conditional">(
    "eligible",
  );
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const supply = supplies[active];
  const result = supply.result;
  const ready = result && "offers" in result ? result : undefined;
  const combined = summarizeComparisons(
    Object.values(supplies).flatMap((entry) =>
      entry.result ? [entry.result] : [],
    ),
  );

  useEffect(() => {
    const deadlines = Object.values(supplies).flatMap((entry) =>
      entry.result && "offers" in entry.result
        ? [Date.parse(entry.result.validUntil) || 0]
        : [],
    );
    if (!deadlines.length) return;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(
        () => {
          const expired = (["electricity", "gas"] as const).filter(
            (commodity) => {
              const result = supplies[commodity].result;
              return (
                result &&
                "offers" in result &&
                (Date.parse(result.validUntil) || 0) <= Date.now()
              );
            },
          );
          for (const commodity of expired) {
            generations.current[commodity]++;
            requests.current[commodity]?.abort();
          }
          if (expired.length) {
            detailGeneration.current++;
            setDetail(null);
            setSupplies(
              (state) =>
                Object.fromEntries(
                  Object.entries(state).map(([commodity, entry]) => [
                    commodity,
                    expired.includes(commodity as Commodity)
                      ? {
                          ...entry,
                          result: {
                            status: "incomplete_data",
                            reasons: ["snapshot_expired"],
                            profileRevision: entry.profile?.revision,
                          },
                          busy: false,
                        }
                      : entry,
                  ]),
                ) as Record<Commodity, Supply>,
            );
          }
          if (!expired.length) schedule();
        },
        Math.max(
          0,
          Math.min(Math.min(...deadlines) - Date.now(), 24 * 3600000),
        ),
      );
    }
    schedule();
    return () => clearTimeout(timer);
  }, [supplies]);

  function selectCommodity(commodity: Commodity) {
    activeSupply.current = commodity;
    detailGeneration.current++;
    setDetail(null);
    setActive(commodity);
  }

  function invalidate(commodity: Commodity) {
    generations.current[commodity]++;
    requests.current[commodity]?.abort();
    detailGeneration.current++;
    setDetail(null);
  }
  function syncProfiles(profiles: ConfirmedProfile[]) {
    const next: Partial<Record<Commodity, ConfirmedProfile>> =
      Object.fromEntries(
        profiles.map((profile) => [profile.commodity, profile]),
      );
    for (const commodity of ["electricity", "gas"] as const) {
      if (confirmed.current[commodity]?.revision !== next[commodity]?.revision)
        invalidate(commodity);
    }
    const previous = confirmed.current;
    confirmed.current = next;
    setSupplies(
      (state) =>
        Object.fromEntries(
          (["electricity", "gas"] as const).map((commodity) => [
            commodity,
            previous[commodity]?.revision === next[commodity]?.revision
              ? { ...state[commodity], profile: next[commodity] }
              : {
                  ...state[commodity],
                  profile: next[commodity],
                  result: undefined,
                  request: undefined,
                  busy: false,
                  error: undefined,
                },
          ]),
        ) as Record<Commodity, Supply>,
    );
  }
  function preferencesChanged(patch: Partial<ComparisonPreferences>) {
    invalidate(active);
    setSupplies((state) => ({
      ...state,
      [active]: {
        ...state[active],
        preferences: { ...state[active].preferences, ...patch },
        result: undefined,
        request: undefined,
        busy: false,
        error: undefined,
      },
    }));
  }
  function currentChanged(patch: Partial<Current>) {
    invalidate(active);
    setSupplies((state) => ({
      ...state,
      [active]: {
        ...state[active],
        current: { ...state[active].current, complete: false, ...patch },
        result: undefined,
        request: undefined,
        busy: false,
        error: undefined,
      },
    }));
  }
  function applyExtraction(extraction: BillExtraction) {
    setSupplies((state) => {
      const next = { ...state };
      for (const candidate of extraction.supplies) {
        const fields = Object.fromEntries(
          candidate.fields.flatMap((field) =>
            field.value !== null && field.path.startsWith("contract.")
              ? [[field.path, field.value]]
              : [],
          ),
        );
        if (!Object.keys(fields).length) continue;
        const end = fields["contract.validUntil"];
        const normalizedEnd = end?.match(/^\d{2}\/\d{2}\/\d{4}$/)
          ? end.split("/").reverse().join("-")
          : (end ?? "");
        next[candidate.commodity] = {
          ...next[candidate.commodity],
          current: {
            ...next[candidate.commodity].current,
            enabled: true,
            complete: false,
            priceKind: fields["contract.priceKind"] ?? "unknown",
            unitPrice: fields["contract.unitPrice"] ?? "",
            spread: fields["contract.spread"] ?? "",
            indexMultiplier: fields["contract.indexMultiplier"] ?? "",
            validFrom: fields["contract.validFrom"] ?? "",
            indexIncludesNetworkLosses: false,
            fixedAnnualCharge: fields["contract.fixedAnnualCharge"] ?? "",
            validTo: normalizedEnd,
            offerCode: fields["contract.offerCode"],
            supplierName: fields["contract.supplier"],
          },
        };
      }
      return next;
    });
  }

  async function compare(commodity: Commodity, append = false) {
    const entry = supplies[commodity];
    if (!entry.profile) return;
    const generation = ++generations.current[commodity];
    requests.current[commodity]?.abort();
    const controller = new AbortController();
    requests.current[commodity] = controller;
    const previous =
      entry.result && "offers" in entry.result ? entry.result : undefined;
    const offset =
      append && previous
        ? Math.max(previous.offers.length, previous.conditionalOffers.length)
        : 0;
    const body: ComparisonRequest = {
      profile: entry.profile,
      preferences: entry.preferences,
      page: { offset, limit: 20 },
      ...(append && previous ? { versions: previous.versions } : {}),
      ...(entry.current.enabled &&
      entry.current.source === "archive" &&
      entry.current.archive &&
      entry.current.complete &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.current.validFrom) &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.current.validTo) &&
      entry.current.validFrom <= entry.current.validTo
        ? {
            currentContract: {
              offer: {
                code: entry.current.archive.code,
                supplierVat: entry.current.archive.supplierVat,
              },
              source: {
                kind: "official_archive" as const,
                reference: entry.current.archive.versionId,
              },
              applicableFrom: entry.current.validFrom,
              applicableTo: entry.current.validTo,
              confirmed: true as const,
            },
          }
        : entry.current.enabled
          ? {
              currentBillConditions: {
                confirmed:
                  entry.current.complete && entry.current.source === "bill",
                priceKind: entry.current.priceKind,
                unitPrice: entry.current.unitPrice,
                index: commodity === "gas" ? "PSV" : "PUN",
                indexMultiplier: entry.current.indexMultiplier,
                spread: entry.current.spread,
                indexIncludesNetworkLosses:
                  entry.current.indexIncludesNetworkLosses,
                fixedAnnualCharge: entry.current.fixedAnnualCharge,
                validFrom: entry.current.validFrom,
                validTo: entry.current.validTo,
                allCommercialChargesIncluded: entry.current.complete,
                offerCode: entry.current.offerCode,
                supplierName: entry.current.supplierName,
              },
            }
          : {}),
    };
    setSupplies((state) => ({
      ...state,
      [commodity]: {
        ...state[commodity],
        busy: true,
        error: undefined,
        result: append ? state[commodity].result : undefined,
        request: body,
      },
    }));
    try {
      const response = await fetch("/api/comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("service_unavailable");
      const answer: ComparisonResult = await response.json();
      if (generation !== generations.current[commodity]) return;
      if (
        "profileRevision" in answer &&
        answer.profileRevision !== undefined &&
        answer.profileRevision !== entry.profile.revision
      )
        throw new Error("stale_profile_response");
      setSupplies((state) => {
        const merged =
          append && previous && "offers" in answer
            ? {
                ...answer,
                offers: [...previous.offers, ...answer.offers],
                conditionalOffers: [
                  ...previous.conditionalOffers,
                  ...answer.conditionalOffers,
                ],
              }
            : answer;
        return {
          ...state,
          [commodity]: { ...state[commodity], result: merged, busy: false },
        };
      });
      if (!append && activeSupply.current === commodity)
        requestAnimationFrame(() => resultHeading.current?.focus());
    } catch {
      if (
        generation !== generations.current[commodity] ||
        controller.signal.aborted
      )
        return;
      setSupplies((state) => ({
        ...state,
        [commodity]: {
          ...state[commodity],
          busy: false,
          error:
            "Il confronto non è disponibile in questo momento. Puoi riprovare: i dati confermati restano nella pagina.",
        },
      }));
    }
  }
  async function openOffer(offer: OfferEstimate) {
    if (!ready || !supply.request) return;
    const generation = ++detailGeneration.current;
    setDetail({ commodity: active, loading: true });
    try {
      const response = await fetch("/api/offers/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...supply.request,
          versions: ready.versions,
          offerId: offer.offerId,
        }),
      });
      if (!response.ok) throw new Error("detail_unavailable");
      const answer: OfferDetailResult = await response.json();
      if (generation === detailGeneration.current)
        setDetail({ commodity: active, loading: false, result: answer });
    } catch {
      if (generation === detailGeneration.current)
        setDetail({
          commodity: active,
          loading: false,
          result: {
            status: "temporarily_unavailable",
            reasons: ["detail_unavailable"],
          },
        });
    }
  }
  const selectedOffer =
    detail?.result?.status === "ready" ? detail.result.offer : undefined;
  const displayed = ready
    ? rankingKind === "eligible"
      ? ready.offers
      : ready.conditionalOffers
    : [];

  return (
    <>
      <div style={{ display: editing ? "block" : "none" }}>
        <ProfileFlow
          activeCommodity={active}
          onCommodityChange={selectCommodity}
          onProfilesChange={syncProfiles}
          onExtracted={applyExtraction}
          onConfirmed={(profiles) => {
            syncProfiles(profiles);
            setEditing(false);
          }}
        />
      </div>
      {!editing && (
        <div className={styles.main}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#d8ded4] pb-5">
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Fornitura da confrontare</legend>
              {(["electricity", "gas"] as const).map((commodity) => (
                <button
                  key={commodity}
                  type="button"
                  aria-pressed={active === commodity}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${active === commodity ? "border-[#164d3b] bg-[#164d3b] text-white" : "border-[#b8c8bd] text-[#164d3b]"}`}
                  onClick={() => {
                    selectCommodity(commodity);
                    if (!supplies[commodity].profile) setEditing(true);
                  }}
                >
                  {commodity === "electricity" ? (
                    <Zap size={15} />
                  ) : (
                    <Flame size={15} />
                  )}
                  {names[commodity]}
                  {supplies[commodity].profile && <Check size={14} />}
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
              onClick={() => setEditing(true)}
            >
              <PencilLine size={15} /> Rivedi i dati
            </button>
          </div>
          {combined.status === "ready" && (
            <p className="mb-6 rounded-xl border border-[#c6d4bd] bg-[#eaf0de] p-4 text-sm">
              <strong>
                Luce + gas: {money(combined.annualCost)} all'anno stimati.
              </strong>
              {combined.savings !== undefined && (
                <> Risparmio complessivo stimato: {money(combined.savings)}.</>
              )}
            </p>
          )}
          {combined.status === "incompatible" && (
            <p className="mb-5 text-sm">
              I due confronti usano versioni o periodi diversi. Aggiornali
              entrambi per ottenere un totale coerente.
            </p>
          )}
          {supply.profile && (
            <section
              className="mb-8 rounded-2xl border border-[#d8ded4] bg-white/70 p-5"
              aria-label="Dati e preferenze del confronto"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  <strong>{supply.profile.municipality.name}</strong> ·{" "}
                  {supply.profile.annualConsumption.value}{" "}
                  {supply.profile.annualConsumption.unit} all'anno
                  {supply.profile.electricity && (
                    <>
                      {" "}
                      · {supply.profile.electricity.powerKw} kW ·{" "}
                      {supply.profile.electricity.resident
                        ? "residente"
                        : "non residente"}
                    </>
                  )}
                </p>
                <span className="text-xs text-[#4f6558]">Dati confermati</span>
              </div>
              <details open={!ready} className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Preferenze e contratto attuale
                </summary>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Preferenza sul prezzo dell'energia
                    <select
                      className={fieldClass}
                      value={supply.preferences.pricePreference}
                      onChange={(event) =>
                        preferencesChanged({
                          pricePreference: event.target.value as
                            | "fixed"
                            | "any",
                        })
                      }
                    >
                      <option value="any">Nessuna preferenza</option>
                      <option value="fixed">Preferisco il prezzo fisso</option>
                    </select>
                  </label>
                  <fieldset>
                    <legend className="text-sm font-medium">
                      Quali metodi di pagamento puoi usare?
                    </legend>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      {[
                        ["01", "Domiciliazione bancaria"],
                        ["02", "Domiciliazione postale"],
                        ["03", "Carta di credito"],
                        ["04", "Bollettino"],
                      ].map(([code, label]) => (
                        <label key={code} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="size-4 accent-[#164d3b]"
                            checked={
                              supply.preferences.requirements[
                                `payment:${code}`
                              ] === "satisfied"
                            }
                            onChange={(event) =>
                              preferencesChanged({
                                requirements: {
                                  ...supply.preferences.requirements,
                                  [`payment:${code}`]: event.target.checked
                                    ? "satisfied"
                                    : "unknown",
                                },
                              })
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#4f6558]">
                      I metodi non selezionati restano da confermare.
                    </p>
                  </fieldset>
                </div>
                <details className="mt-5 border-t border-[#d8ded4] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Il tuo contratto attuale e il risparmio
                  </summary>
                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#164d3b]"
                      checked={supply.current.enabled}
                      onChange={(event) =>
                        currentChanged({ enabled: event.target.checked })
                      }
                    />
                    Inserisco o confermo le condizioni attuali
                  </label>
                  {supply.current.enabled && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-[#4f6558]">
                        Servono le condizioni applicabili all'intero periodo di
                        stima. Il totale dell'ultima bolletta non basta;
                        eventuali rinnovi ignoti restano esclusi.
                      </p>
                      <label className="block text-sm">
                        Come ricostruire il contratto attuale
                        <select
                          aria-label="Come ricostruire il contratto attuale"
                          className={fieldClass}
                          value={supply.current.source}
                          onChange={(event) =>
                            currentChanged({
                              source: event.target.value as Current["source"],
                            })
                          }
                        >
                          <option value="bill">
                            Inserisco le condizioni della bolletta
                          </option>
                          <option value="archive">
                            Cerco il codice nell'archivio del Portale
                          </option>
                        </select>
                      </label>
                      {supply.current.source === "archive" && (
                        <CurrentArchivePicker
                          key={`${active}:${supply.current.offerCode ?? ""}`}
                          commodity={active}
                          initialCode={supply.current.offerCode}
                          selected={supply.current.archive}
                          onSelect={(archive) => currentChanged({ archive })}
                        />
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {supply.current.source === "bill" && (
                          <>
                            <label className="text-sm">
                              Tipo di prezzo
                              <select
                                aria-label="Tipo di prezzo"
                                className={fieldClass}
                                value={supply.current.priceKind}
                                onChange={(event) =>
                                  currentChanged({
                                    priceKind: event.target.value,
                                  })
                                }
                              >
                                <option value="unknown">Non lo so</option>
                                <option value="fixed">Fisso</option>
                                <option value="variable">Variabile</option>
                                <option value="mixed">Misto</option>
                              </select>
                            </label>
                            {supply.current.priceKind === "variable" && (
                              <>
                                <p className="self-center text-sm">
                                  Indice:{" "}
                                  {active === "gas"
                                    ? "PSV"
                                    : "PUN Index GME monorario"}
                                  .
                                </p>
                                <label className="text-sm">
                                  Coefficiente dell'indice
                                  <input
                                    className={fieldClass}
                                    inputMode="decimal"
                                    value={supply.current.indexMultiplier}
                                    onChange={(event) =>
                                      currentChanged({
                                        indexMultiplier:
                                          event.target.value.replace(",", "."),
                                      })
                                    }
                                  />
                                </label>
                                <label className="text-sm">
                                  Spread complessivo (€/{" "}
                                  {active === "gas" ? "Smc" : "kWh"})
                                  <input
                                    className={fieldClass}
                                    inputMode="decimal"
                                    value={supply.current.spread}
                                    onChange={(event) =>
                                      currentChanged({
                                        spread: event.target.value.replace(
                                          ",",
                                          ".",
                                        ),
                                      })
                                    }
                                  />
                                </label>
                                {active === "electricity" && (
                                  <label className="flex items-start gap-2 text-sm sm:col-span-2">
                                    <input
                                      type="checkbox"
                                      className="mt-1 size-4 accent-[#164d3b]"
                                      checked={
                                        supply.current
                                          .indexIncludesNetworkLosses
                                      }
                                      onChange={(event) =>
                                        currentChanged({
                                          indexIncludesNetworkLosses:
                                            event.target.checked,
                                        })
                                      }
                                    />
                                    Confermo che la formula applica all'indice
                                    monorario le perdite di rete, oltre al
                                    coefficiente e allo spread riportati.
                                  </label>
                                )}
                              </>
                            )}
                            {supply.current.priceKind === "fixed" && (
                              <label className="text-sm">
                                Prezzo della sola energia (€/{" "}
                                {active === "gas" ? "Smc" : "kWh"})
                                <input
                                  className={fieldClass}
                                  inputMode="decimal"
                                  value={supply.current.unitPrice}
                                  onChange={(event) =>
                                    currentChanged({
                                      unitPrice: event.target.value.replace(
                                        ",",
                                        ".",
                                      ),
                                    })
                                  }
                                />
                              </label>
                            )}
                            <label className="text-sm">
                              Quota commerciale fissa (€/anno)
                              <input
                                className={fieldClass}
                                inputMode="decimal"
                                value={supply.current.fixedAnnualCharge}
                                onChange={(event) =>
                                  currentChanged({
                                    fixedAnnualCharge:
                                      event.target.value.replace(",", "."),
                                  })
                                }
                              />
                            </label>
                            <div />
                          </>
                        )}
                        <label className="text-sm">
                          Condizioni applicabili dal
                          <input
                            className={fieldClass}
                            type="date"
                            value={supply.current.validFrom}
                            onChange={(event) =>
                              currentChanged({ validFrom: event.target.value })
                            }
                          />
                        </label>
                        <label className="text-sm">
                          Condizioni applicabili fino al
                          <input
                            className={fieldClass}
                            type="date"
                            value={supply.current.validTo}
                            onChange={(event) =>
                              currentChanged({ validTo: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-[#164d3b]"
                          checked={supply.current.complete}
                          onChange={(event) =>
                            currentChanged({ complete: event.target.checked })
                          }
                        />
                        {supply.current.source === "archive"
                          ? "Confermo che l'osservazione selezionata riporta tutte le condizioni commerciali applicate al mio contratto, con le date indicate."
                          : "Confermo di aver riportato tutte le componenti commerciali, escluse rete e imposte, e le loro date di applicabilità."}
                      </label>
                      <p className="text-xs text-[#4f6558]">
                        Per il variabile inserisci la formula futura, con tutti
                        gli oneri commerciali e lo spread nelle unità indicate.
                        Formule per fasce, miste o con componenti ulteriori non
                        ricostruite richiedono altri dati: le alternative
                        restano disponibili, senza inventare un risparmio.
                      </p>
                    </div>
                  )}
                </details>
                <button
                  type="button"
                  className={`${buttonClass} mt-5`}
                  disabled={supply.busy}
                  onClick={() => compare(active)}
                >
                  {supply.busy ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin motion-reduce:animate-none"
                      />{" "}
                      Calcolo in corso…
                    </>
                  ) : (
                    <>
                      {ready
                        ? "Aggiorna il confronto"
                        : "Confronta le offerte reali"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </details>
            </section>
          )}
          <div aria-live="polite" aria-busy={supply.busy}>
            {supply.busy && !ready && (
              <p className="py-8 text-sm">
                Sto confrontando tutte le offerte applicabili con le stesse
                fonti e ipotesi.
              </p>
            )}
            {supply.error && (
              <p role="alert" className="rounded-xl bg-[#f6e6dc] p-5 text-sm">
                {supply.error}
              </p>
            )}
            {result && !("offers" in result) && (
              <section className="rounded-2xl border border-[#c9d4ca] p-6">
                <h2
                  ref={resultHeading}
                  tabIndex={-1}
                  className="font-serif text-3xl outline-none"
                >
                  {result.status === "needs_input"
                    ? "Manca ancora un dato."
                    : "Il confronto completo non è ancora disponibile."}
                </h2>
                {result.status === "needs_input" ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
                    {result.issues.map((issue) => (
                      <li key={`${issue.path}:${issue.message}`}>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed">
                    Alcuni dati ufficiali necessari sono mancanti, scaduti o in
                    aggiornamento. Riprova più tardi: non mostriamo una
                    classifica che esclude offerte difficili da calcolare.
                  </p>
                )}
                <button
                  type="button"
                  className="mt-5 text-sm font-semibold underline"
                  onClick={() => setEditing(true)}
                >
                  Controlla i dati della fornitura
                </button>
              </section>
            )}
            {ready && (
              <Recommendation
                result={ready}
                headingRef={resultHeading}
                onOffer={openOffer}
                onRanking={() => {
                  setRankingOpen(true);
                  setRankingKind(
                    ready.offers.length ? "eligible" : "conditional",
                  );
                }}
              />
            )}
          </div>
          {ready && rankingOpen && (
            <section className="mt-10" aria-label="Classifica delle offerte">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl">Tutte le alternative.</h2>
                  <p className="mt-2 text-sm text-[#4f6558]">
                    Ordinate per costo annuo stimato crescente, a parità di
                    profilo e ipotesi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["eligible", "conditional"] as const).map((kind) => (
                    <button
                      type="button"
                      key={kind}
                      aria-pressed={rankingKind === kind}
                      className="rounded-full border border-[#aebfb2] px-3 py-2 text-xs font-medium"
                      onClick={() => setRankingKind(kind)}
                    >
                      {kind === "eligible"
                        ? `Ammissibili (${ready.pagination?.eligibleTotal ?? ready.offers.length})`
                        : `Da confermare (${ready.pagination?.conditionalTotal ?? ready.conditionalOffers.length})`}
                    </button>
                  ))}
                </div>
              </div>
              {displayed.length ? (
                <ol className="divide-y divide-[#d8ded4] border-y border-[#d8ded4]">
                  {displayed.map((offer, index) => (
                    <li key={offer.offerId}>
                      <button
                        type="button"
                        className="grid w-full grid-cols-[2rem_1fr] items-center gap-3 py-5 text-left sm:grid-cols-[2rem_1fr_auto]"
                        onClick={() => openOffer(offer)}
                      >
                        <span className="font-serif text-xl text-[#536f5b]">
                          {index + 1}.
                        </span>
                        <span className="min-w-0">
                          <strong className="block break-words text-sm">
                            {offer.name}
                          </strong>
                          <small className="mt-1 block text-[#4f6558]">
                            {offer.supplierName} ·{" "}
                            {offer.offerType === "fixed"
                              ? "Prezzo fisso"
                              : offer.offerType === "mixed"
                                ? "Prezzo misto"
                                : "Prezzo variabile"}
                          </small>
                        </span>
                        <span className="col-start-2 font-semibold sm:col-start-auto">
                          {money(offer.annualCost)}
                          <small className="ml-1 font-normal">
                            /anno stimati
                          </small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-6 text-sm">
                  Nessuna offerta in questa sezione con le conferme attuali.
                </p>
              )}
              {displayed.length <
                (rankingKind === "eligible"
                  ? (ready.pagination?.eligibleTotal ?? 0)
                  : (ready.pagination?.conditionalTotal ?? 0)) && (
                <button
                  type="button"
                  disabled={supply.busy}
                  className="mt-5 rounded-full border border-[#aebfb2] px-5 py-3 text-sm font-semibold"
                  onClick={() => compare(active, true)}
                >
                  Mostra altre offerte
                </button>
              )}
            </section>
          )}
          {ready && (
            <details className="mt-10 border-t border-[#d8ded4] pt-5">
              <summary className="cursor-pointer text-sm font-semibold">
                Fonti, periodo e ipotesi
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#4f6558]">
                <p>
                  Periodo di stima: {date(ready.period.from)} –{" "}
                  {date(ready.period.to)}. Consumi storici e periodo futuro sono
                  distinti.
                </p>
                <p>
                  Catalogo del {date(ready.sourceDate)} dal{" "}
                  <a
                    className="underline"
                    href="https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Portale Offerte
                  </a>
                  . Solo offerte domestiche singole, simulabili e per cambio
                  fornitore; PLACET e offerte congiunte escluse.
                </p>
                <p>
                  Scenario di {ready.scenarioMonth}: coefficienti impliciti
                  ricavati dalle simulazioni ufficiali del Portale e validati
                  prima dell'importazione. Non sono un file previsionale
                  pubblicato da Acquirente Unico.
                </p>
                <p>
                  I prezzi futuri possono cambiare. Il prezzo fisso riguarda
                  l'energia: rete, oneri e imposte possono variare. La media
                  mensile non è una rata contrattuale.
                </p>
                {ready.warnings.includes(
                  "using_last_applicable_catalog_within_48h",
                ) && (
                  <p>
                    Stiamo usando l'ultimo catalogo applicabile, entro il limite
                    di 48 ore dalla data della fonte.
                  </p>
                )}
                <p className="break-all text-xs">
                  Versioni: catalogo {ready.versions.catalog}; riferimenti{" "}
                  {ready.versions.references}; scenario{" "}
                  {ready.versions.scenario}; metodo {ready.versions.method}.
                </p>
              </div>
            </details>
          )}
          <footer className="mt-12 border-t border-[#d8ded4] pt-5 text-xs text-[#4f6558]">
            Gratuito, senza account. Il percorso si azzera ricaricando la
            pagina; gli originali caricati restano nell'archivio privato.
          </footer>
        </div>
      )}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) {
            detailGeneration.current++;
            setDetail(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[85dvh] overflow-y-auto bg-[#fffef9] p-6 text-[#173e33] sm:max-w-2xl"
        >
          <DialogClose
            className="absolute right-4 top-4 rounded-full p-2"
            aria-label="Chiudi la scheda"
          >
            <X size={20} />
          </DialogClose>
          <DialogTitle className="pr-9 font-serif text-3xl">
            {selectedOffer?.name ?? "Scheda dell'offerta"}
          </DialogTitle>
          <DialogDescription>
            {selectedOffer
              ? `${selectedOffer.supplierName} · Condizioni dichiarate nella fonte ufficiale`
              : detail?.loading
                ? "Sto recuperando la scheda con le stesse versioni del confronto."
                : "La scheda non è disponibile con queste versioni. Riprova il confronto."}
          </DialogDescription>
          {selectedOffer && (
            <>
              <p className="text-4xl font-medium tracking-tight">
                {money(selectedOffer.annualCost)}
                <span className="ml-2 text-sm font-normal">
                  all'anno stimati
                </span>
              </p>
              <p className="text-sm text-[#4f6558]">
                {money(selectedOffer.monthlyAverage)} al mese in media; non è
                una rata.
              </p>
              <dl className="divide-y divide-[#d8ded4] text-sm">
                {selectedOffer.breakdown.map((component) => (
                  <div
                    key={component.code}
                    className="flex justify-between gap-4 py-3"
                  >
                    <dt>{component.label}</dt>
                    <dd className="shrink-0 font-medium">
                      {money(component.amount)}
                    </dd>
                  </div>
                ))}
              </dl>
              {selectedOffer.requirements.length > 0 && (
                <section>
                  <h3 className="font-semibold">Condizioni da verificare</h3>
                  {selectedOffer.requirements.map((requirement) => (
                    <div
                      key={requirement.code}
                      className="mt-3 rounded-xl border border-[#d8ded4] p-4"
                    >
                      <p className="text-sm leading-relaxed">
                        {requirement.label}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-[#aebfb2] px-3 py-2 text-xs font-semibold"
                          onClick={() =>
                            preferencesChanged({
                              requirements: {
                                ...supply.preferences.requirements,
                                [requirement.code]: "satisfied",
                              },
                            })
                          }
                        >
                          La soddisfo
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[#aebfb2] px-3 py-2 text-xs"
                          onClick={() =>
                            preferencesChanged({
                              requirements: {
                                ...supply.preferences.requirements,
                                [requirement.code]: "not_satisfied",
                              },
                            })
                          }
                        >
                          Non la soddisfo
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
              <section>
                <h3 className="font-semibold">Condizioni dichiarate</h3>
                {selectedOffer.conditions.map((condition, index) => (
                  <p
                    key={`${index}:${condition.slice(0, 30)}`}
                    className="mt-3 whitespace-pre-line text-sm leading-relaxed"
                  >
                    {condition}
                  </p>
                ))}
              </section>
              <section className="space-y-2 text-sm">
                <p>
                  Codice offerta:{" "}
                  <strong className="break-all">{selectedOffer.code}</strong>
                </p>
                <p>Partita IVA venditore: {selectedOffer.supplierVat}</p>
                <p>
                  Sottoscrivibile dal {date(selectedOffer.validFrom)} al{" "}
                  {date(selectedOffer.validTo)}. La durata delle condizioni
                  economiche può essere diversa.
                </p>
                {selectedOffer.assumptions.map((assumption, index) => (
                  <p
                    key={`${index}:${assumption.slice(0, 30)}`}
                    className="text-[#4f6558]"
                  >
                    {assumption}
                  </p>
                ))}
              </section>
              {selectedOffer.officialUrl ? (
                <a
                  href={selectedOffer.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass}
                >
                  Vai al fornitore <ArrowRight size={16} />
                </a>
              ) : (
                <p className="rounded-xl bg-[#eaf0de] p-4 text-sm">
                  Nessun collegamento specifico verificato disponibile. Usa il
                  codice dell'offerta e i canali indicati dalla fonte ufficiale.
                </p>
              )}
              <p className="text-xs leading-relaxed text-[#4f6558]">
                Il collegamento proviene dal Portale. Verifica condizioni e
                disponibilità prima di sottoscrivere; non acquistiamo servizi
                per tuo conto.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Recommendation({
  result,
  headingRef,
  onOffer,
  onRanking,
}: {
  result: Ready;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onOffer: (offer: OfferEstimate) => void;
  onRanking: () => void;
}) {
  const staying = result.recommendation.kind === "stay";
  const offer =
    staying && result.currentContract.status === "comparable"
      ? result.currentContract.estimate
      : result.recommendedOffer;
  const savings = staying ? undefined : offer?.savings;
  const headline = staying
    ? "A volte, la scelta migliore è restare."
    : offer
      ? "La tua prossima scelta, più chiara."
      : "Vediamo quali condizioni mancano.";
  return (
    <>
      <div className={styles.intro}>
        <div className={styles.eyebrow}>
          <span /> IL TUO CONFRONTO, SPIEGATO BENE
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="outline-none">
          {headline}
        </h1>
        {result.recommendation.reasons.map((reason) => (
          <p key={reason}>
            {reasonLabels[reason] ??
              "Valuta l'offerta insieme alle sue condizioni e alle ipotesi di stima."}
          </p>
        ))}
      </div>
      {offer && (
        <section
          className={styles.recommendation}
          aria-label="Il nostro consiglio"
        >
          <div className={styles.offer}>
            <div className={styles.tag}>
              {staying ? <ShieldCheck size={15} /> : <Sparkles size={15} />}
              {staying
                ? "Il consiglio: mantieni la tua offerta"
                : result.recommendation.kind === "conditional"
                  ? "Una scelta da valutare"
                  : "Il nostro consiglio per te"}
            </div>
            <div className={styles.offerTitle}>
              <span className={styles.symbol}>
                {staying ? <ShieldCheck size={25} /> : "1."}
              </span>
              <div>
                <span className={styles.supplier}>
                  {staying ? "IL TUO CONTRATTO" : offer.supplierName}
                </span>
                <h2>{staying ? "La tua offerta attuale" : offer.name}</h2>
              </div>
            </div>
            <div className={styles.costLabel}>Costo annuo stimato</div>
            <div className={styles.cost}>
              {money(offer.annualCost)}
              <span>/ anno</span>
            </div>
            <p className={styles.monthly}>
              Circa {money(offer.monthlyAverage)} al mese in media
            </p>
            <div className={styles.attributes}>
              <span>
                <Check size={15} />
                {offer.offerType === "fixed"
                  ? "Prezzo dell'energia fisso"
                  : "Prezzo dell'energia variabile o misto"}
              </span>
              {offer.eligibility === "conditional" && (
                <span>Condizioni ancora da confermare</span>
              )}
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={staying ? onRanking : () => onOffer(offer)}
            >
              {staying
                ? "Confronta comunque le alternative"
                : "Scopri questa offerta"}
              <ArrowRight size={17} />
            </button>
            <p className={styles.small}>
              Prima tutti i dettagli. Poi decidi tu.
            </p>
          </div>
          <div className={styles.saving}>
            <span className={styles.savingLabel}>
              {savings !== undefined
                ? "Risparmio annuo stimato"
                : staying
                  ? "Sei già sulla strada giusta"
                  : "Manca un pezzo del confronto"}
            </span>
            {savings !== undefined ? (
              <div className={styles.savingNumber}>{money(savings)}</div>
            ) : (
              <div className={styles.quietTitle}>
                {staying
                  ? "Nessun cambio necessario, nelle ipotesi attuali."
                  : "Prima i costi. Poi il risparmio."}
              </div>
            )}
            <p className={styles.missing}>
              {result.currentContract.status === "comparable"
                ? `Il contratto attuale costa ${money(result.currentContract.annualCost)} all'anno stimati, sugli stessi consumi e periodo.`
                : "Le condizioni del contratto attuale non coprono o non ricostruiscono tutto il periodo. Il risparmio resta non disponibile."}
            </p>
            <p className={styles.caveat}>
              Stessi consumi, stesso periodo. Gli importi futuri possono
              cambiare.
            </p>
            <span className={styles.methodLink}>
              <CircleHelp size={15} /> Fonti e ipotesi sono riportate sotto.
            </span>
          </div>
        </section>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          {result.pagination?.eligibleTotal ?? result.offers.length} offerte
          ammissibili ·{" "}
          {result.pagination?.conditionalTotal ??
            result.conditionalOffers.length}{" "}
          da confermare
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 font-semibold underline underline-offset-4"
          onClick={onRanking}
        >
          Apri la classifica <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
