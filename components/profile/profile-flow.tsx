"use client";

import { upload } from "@vercel/blob/client";
import {
  ArrowRight,
  Check,
  FileText,
  Flame,
  LoaderCircle,
  PencilLine,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import {
  type ConfirmedProfile,
  type FieldProvenance,
  validateProfile,
} from "@/src/domain/profile";
import { candidateFromExtraction } from "@/src/modules/bill/candidates";
import type { BillExtraction } from "@/src/modules/bill/extraction";
import { MunicipalityPicker } from "./municipality-picker";

type Commodity = "electricity" | "gas";
type Draft = {
  values: Record<string, string>;
  provenance: Record<string, FieldProvenance>;
  confirmed: boolean;
  profile?: ConfirmedProfile;
  warnings: string[];
};
const blank = (): Draft => ({
  values: {},
  provenance: {},
  confirmed: false,
  warnings: [],
});
const inputClass =
  "mt-2 w-full rounded-xl border border-[#d5ddd7] bg-white px-3.5 py-3 text-base outline-none transition focus:border-[#16634b] focus:ring-2 focus:ring-[#16634b]/15";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#164d3b] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d3628] disabled:opacity-50";
function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const parts = path.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    current[part] ??= {};
    current = current[part] as Record<string, unknown>;
  }
  const leaf = parts.at(-1);
  if (leaf) current[leaf] = value;
}
export function ProfileFlow({
  onConfirmed,
  onProfilesChange,
  onExtracted,
  activeCommodity,
  onCommodityChange,
}: {
  onConfirmed?: (profiles: ConfirmedProfile[]) => void;
  onProfilesChange?: (profiles: ConfirmedProfile[]) => void;
  onExtracted?: (result: BillExtraction) => void;
  activeCommodity?: Commodity;
  onCommodityChange?: (commodity: Commodity) => void;
}) {
  const [localCommodity, setLocalCommodity] =
    useState<Commodity>("electricity");
  const commodity = activeCommodity ?? localCommodity;
  const setCommodity = (next: Commodity) => {
    setLocalCommodity(next);
    onCommodityChange?.(next);
  };
  const [drafts, setDrafts] = useState<Record<Commodity, Draft>>({
    electricity: blank(),
    gas: blank(),
  });
  const [mode, setMode] = useState<"choice" | "manual">("choice");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [ocrFailed, setOcrFailed] = useState(false);
  const [issues, setIssues] = useState<{ path: string; message: string }[]>([]);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [pendingJob, setPendingJob] = useState<{
    id: string;
    capability: string;
  } | null>(null);
  const draft = drafts[commodity];
  function change(path: string, value: string) {
    revision.current++;
    onProfilesChange?.(
      Object.entries(drafts).flatMap(([key, entry]) =>
        key !== commodity && entry.profile ? [entry.profile] : [],
      ),
    );
    setIssues([]);
    setMessage("");
    setDrafts((previous) => ({
      ...previous,
      [commodity]: {
        ...previous[commodity],
        values: {
          ...previous[commodity].values,
          [path]: value,
          ...(path.startsWith("electricity.bands.")
            ? { "electricity.useConventionalBands": "false" }
            : {}),
        },
        provenance: {
          ...previous[commodity].provenance,
          [path]: { origin: "manual" },
        },
        confirmed: false,
        profile: undefined,
      },
    }));
  }
  function selectSupply(next: Commodity) {
    setCommodity(next);
    setIssues([]);
    setMessage("");
  }
  function manual() {
    revision.current++;
    controller.current?.abort();
    setMode("manual");
    setBusy(false);
    setMessage("");
  }
  function applyExtraction(result: BillExtraction, jobId: string) {
    setOcrFailed(false);
    onExtracted?.(result);
    const changedSupplies = new Set(
      result.supplies.length
        ? result.supplies.map((supply) => supply.commodity)
        : [commodity],
    );
    onProfilesChange?.(
      Object.entries(drafts).flatMap(([key, entry]) =>
        !changedSupplies.has(key as Commodity) && entry.profile
          ? [entry.profile]
          : [],
      ),
    );
    setDrafts((previous) => {
      const next = { ...previous };
      for (const supply of candidateFromExtraction(result, jobId)) {
        const prior = next[supply.commodity];
        const values = { ...prior.values };
        const provenance = { ...prior.provenance };
        for (const [path, field] of Object.entries(supply.fields)) {
          if (field.value === null || provenance[path]?.origin === "manual")
            continue;
          values[path] = String(field.value);
          provenance[path] = {
            origin: "document",
            documentId: jobId,
            ...(field.page ? { page: field.page } : {}),
            ...(field.fileId ? { fileId: field.fileId } : {}),
            ...(field.excerpt ? { excerpt: field.excerpt } : {}),
          };
        }
        next[supply.commodity] = {
          values,
          provenance,
          confirmed: false,
          warnings: supply.warnings,
        };
      }
      return next;
    });
    if (result.supplies[0]) setCommodity(result.supplies[0].commodity);
    setMode("manual");
    setMessage(
      result.readability === "unreadable"
        ? "Non riesco a leggere questi documenti. Puoi inserire i dati a mano."
        : "Ho preparato i dati della bolletta. Controllali e completa quelli mancanti.",
    );
  }
  async function extract(
    job: { id: string; capability: string },
    expected: number,
  ) {
    if (expected !== revision.current) return;
    const response = await fetch(`/api/bills/${job.id}/extract`, {
      method: "POST",
      headers: { "x-bill-capability": job.capability },
      signal: controller.current?.signal,
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(
        body.message ??
          (body.status === "capacity"
            ? "Ci sono già due letture in corso. Riprova tra poco."
            : "Lettura in corso: riprova tra poco."),
      );
    if (expected === revision.current && body.result)
      applyExtraction(body.result, job.id);
  }
  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    revision.current++;
    const expected = revision.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setMessage("");
    setPendingJob(null);
    setOcrFailed(false);
    try {
      const request = await fetch("/api/bills/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: selected.map((f) => ({
            name: f.name,
            size: f.size,
            contentType: f.type,
          })),
        }),
        signal: controller.current.signal,
      });
      const job = await request.json();
      if (!request.ok) throw new Error(job.message);
      if (expected !== revision.current) return;
      setPendingJob({ id: job.id, capability: job.capability });
      for (let n = 0; n < selected.length; n++) {
        if (expected !== revision.current) return;
        await upload(job.files[n].pathname, selected[n], {
          access: "private",
          handleUploadUrl: "/api/bills/upload",
          clientPayload: JSON.stringify({ jobId: job.id }),
          headers: { "x-bill-capability": job.capability },
          multipart: true,
        });
      }
      await extract(job, expected);
    } catch (error) {
      if (expected === revision.current) {
        setOcrFailed(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "Lettura non disponibile. Inserisci i dati a mano.",
        );
      }
    } finally {
      if (expected === revision.current) setBusy(false);
    }
  }
  async function retry() {
    if (!pendingJob) return;
    setBusy(true);
    setMessage("");
    const expected = revision.current;
    controller.current = new AbortController();
    try {
      await extract(pendingJob, expected);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Riprova più tardi.");
    } finally {
      setBusy(false);
    }
  }
  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: Record<string, unknown> = {
      schemaVersion: 1,
      commodity,
      origin: Object.values(draft.provenance).some(
        (p) => p.origin === "document",
      )
        ? "document"
        : "manual",
      confirmed: draft.confirmed,
      revision: revision.current,
      provenance: draft.provenance,
    };
    for (const [path, value] of Object.entries(draft.values)) {
      if (value === "") continue;
      setPath(
        candidate,
        path,
        ["electricity.resident", "electricity.useConventionalBands"].includes(
          path,
        )
          ? value === "true"
          : value,
      );
    }
    if (!draft.values["annualConsumption.unit"])
      setPath(
        candidate,
        "annualConsumption.unit",
        commodity === "electricity" ? "kWh" : "Smc",
      );
    if (draft.values.supplyContext === "true")
      candidate.supplyContext = {
        domestic: true,
        active: true,
        operation: "switch_same_holder",
      };
    const result = validateProfile(candidate);
    if (result.status === "needs_input") {
      setIssues(result.issues);
      return;
    }
    const next = {
      ...drafts,
      [commodity]: { ...draft, profile: result.profile },
    };
    setDrafts(next);
    setIssues([]);
    onProfilesChange?.(
      Object.values(next).flatMap((d) => (d.profile ? [d.profile] : [])),
    );
    onConfirmed?.(
      Object.values(next).flatMap((d) => (d.profile ? [d.profile] : [])),
    );
  }
  function field(
    path: string,
    label: string,
    options?: { type?: string; hint?: string; placeholder?: string },
  ) {
    return (
      <label className="block text-sm font-medium text-[#263b32]" key={path}>
        {label}
        <input
          name={path}
          aria-label={label}
          type={options?.type ?? "text"}
          inputMode={
            options?.type === "date"
              ? undefined
              : path.includes("value") ||
                  path.includes("power") ||
                  path.includes("bands")
                ? "decimal"
                : undefined
          }
          value={draft.values[path] ?? ""}
          onChange={(event) =>
            change(path, event.target.value.replace(",", "."))
          }
          className={inputClass}
          placeholder={options?.placeholder}
          aria-invalid={issues.some((issue) => issue.path === path)}
        />
        {options?.hint && (
          <span className="mt-1.5 block text-xs leading-relaxed text-[#4f6255]">
            {options.hint}
          </span>
        )}
        {draft.provenance[path]?.origin === "document" && (
          <span className="mt-1.5 block text-xs text-[#4f6255]">
            Letto dalla bolletta
            {draft.provenance[path].page
              ? `, pagina ${draft.provenance[path].page}`
              : ""}
            {draft.provenance[path].excerpt
              ? ` · “${draft.provenance[path].excerpt}”`
              : ""}
          </span>
        )}
      </label>
    );
  }
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-14">
      <div className="mb-10 flex items-center gap-3 text-xs font-medium text-[#4f6255]">
        <span className="grid size-6 place-items-center rounded-full bg-[#164d3b] text-white">
          1
        </span>
        <span className="text-[#164d3b]">I tuoi consumi</span>
        <span className="h-px w-8 bg-[#d5ddd7]" />
        <span>2 · Il confronto</span>
      </div>
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em] text-[#526b59]">
          Partiamo da te
        </p>
        <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-[#16392b] sm:text-6xl">
          La bolletta cambia.
          <br />I tuoi consumi restano tuoi.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#4f6255]">
          Carica una bolletta o raccontaci quanto consumi. Ti aiutiamo a trovare
          le offerte adatte alla tua casa, un dato alla volta.
        </p>
      </div>
      <fieldset className="mb-7 flex flex-wrap gap-2">
        <legend className="sr-only">Fornitura</legend>
        {(["electricity", "gas"] as const).map((kind) => (
          <button
            type="button"
            key={kind}
            aria-pressed={commodity === kind}
            onClick={() => selectSupply(kind)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition ${commodity === kind ? "border-[#164d3b] bg-[#164d3b] text-white" : "border-[#d5ddd7] bg-white text-[#395344] hover:border-[#164d3b]"}`}
          >
            {kind === "electricity" ? <Zap size={16} /> : <Flame size={16} />}{" "}
            {kind === "electricity" ? "Luce" : "Gas"}
            {drafts[kind].profile && <Check size={16} />}
          </button>
        ))}
      </fieldset>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="rounded-3xl border border-[#dde4dc] bg-white p-5 shadow-[0_12px_50px_-32px_#16392b] sm:p-8">
          {mode === "choice" ? (
            <>
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#eef4e9] text-[#356042]">
                <FileText size={23} />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#173a2c]">
                Hai una bolletta a portata di mano?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f6255]">
                Leggiamo i dati utili per il confronto. Prima di usarli, sarai
                tu a controllarli e confermarli.
              </p>
              <label
                className={`mt-7 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#b8cbb9] bg-[#f7faf4] p-7 text-center transition hover:bg-[#eff5e9] ${busy ? "pointer-events-none opacity-60" : ""}`}
              >
                <Upload className="mb-3 text-[#46734e]" size={25} />
                <span className="font-semibold text-[#234f35]">
                  Scegli PDF o foto della bolletta
                </span>
                <span className="mt-2 text-xs leading-relaxed text-[#4f6255]">
                  PDF fino a 10 MB e 20 pagine.
                  <br />
                  Oppure fino a 10 foto JPG/PNG, 30 MB in tutto.
                </span>
                <input
                  aria-label="Carica bolletta"
                  className="sr-only"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  multiple
                  disabled={busy}
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </label>
              <button
                type="button"
                onClick={manual}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d5ddd7] px-5 py-3 text-sm font-medium text-[#395344] hover:bg-[#f5f8f2]"
              >
                <PencilLine size={15} />
                Inserisco i dati a mano
              </button>
            </>
          ) : (
            <>
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#173a2c]">
                    Controlliamo i tuoi dati{" "}
                    {commodity === "electricity" ? "luce" : "gas"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#4f6255]">
                    Cerca il <strong>consumo annuo</strong> nella bolletta: è
                    diverso dal consumo del mese o bimestre.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium underline underline-offset-4"
                  onClick={() => setMode("choice")}
                >
                  Carica bolletta
                </button>
              </div>
              <form onSubmit={confirm} noValidate className="space-y-6">
                <label className="flex items-start gap-3 rounded-xl bg-[#f5f8f0] p-4 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[#164d3b]"
                    checked={draft.values.supplyContext === "true"}
                    onChange={(event) =>
                      change("supplyContext", String(event.target.checked))
                    }
                  />
                  <span>
                    È una fornitura domestica già attiva: voglio cambiare
                    fornitore mantenendo lo stesso intestatario.
                  </span>
                </label>
                <MunicipalityPicker
                  name={draft.values["municipality.name"] ?? ""}
                  code={draft.values["municipality.portalCode"] ?? ""}
                  onNameChange={(name) => {
                    change("municipality.name", name);
                    change("municipality.portalCode", "");
                  }}
                  onSelect={(item) => {
                    change("municipality.name", item.name);
                    change("municipality.portalCode", item.portalCode);
                  }}
                />
                <details className="text-sm">
                  <summary className="cursor-pointer text-[#4f6255]">
                    Identificativo del comune nella fonte
                  </summary>
                  <div className="mt-3">
                    {field(
                      "municipality.portalCode",
                      "Codice comune del Portale",
                      {
                        hint: "Il codice della fonte può differire dal codice ISTAT corrente dopo una fusione.",
                        placeholder: "Es. 068028",
                      },
                    )}
                  </div>
                </details>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field(
                    "annualConsumption.value",
                    `Consumo annuo (${commodity === "electricity" ? "kWh" : "Smc"})`,
                    {
                      placeholder:
                        commodity === "electricity" ? "Es. 2700" : "Es. 1000",
                    },
                  )}
                  <label className="block text-sm font-medium text-[#263b32]">
                    Questo consumo è
                    <select
                      className={inputClass}
                      value={draft.values["annualConsumption.kind"] ?? ""}
                      onChange={(event) =>
                        change("annualConsumption.kind", event.target.value)
                      }
                    >
                      <option value="">Seleziona</option>
                      <option value="measured">Misurato in bolletta</option>
                      <option value="estimated">Stimato in bolletta</option>
                      <option value="declared">Dichiarato da me</option>
                    </select>
                  </label>
                </div>
                {commodity === "gas" && (
                  <label className="block text-sm font-medium">
                    Unità del consumo annuo
                    <select
                      className={inputClass}
                      value={draft.values["annualConsumption.unit"] ?? "Smc"}
                      onChange={(event) =>
                        change("annualConsumption.unit", event.target.value)
                      }
                    >
                      <option value="Smc">Smc (metri cubi standard)</option>
                      <option value="m3">
                        m³ (da verificare e correggere)
                      </option>
                    </select>
                  </label>
                )}
                {draft.values["annualConsumption.unit"] === "m3" && (
                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Il documento riporta m³: recupera il consumo annuo in Smc.
                    Non convertiamo automaticamente le due unità.
                  </p>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  {field(
                    "annualConsumption.period.from",
                    "Inizio periodo annuale",
                    { type: "date" },
                  )}
                  {field(
                    "annualConsumption.period.to",
                    "Fine periodo annuale",
                    { type: "date" },
                  )}
                </div>
                {commodity === "electricity" ? (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {field("electricity.powerKw", "Potenza impegnata (kW)", {
                        placeholder: "Es. 3",
                      })}
                      <label className="block text-sm font-medium text-[#263b32]">
                        Residenza anagrafica
                        <select
                          className={inputClass}
                          value={draft.values["electricity.resident"] ?? ""}
                          onChange={(event) =>
                            change("electricity.resident", event.target.value)
                          }
                        >
                          <option value="">Seleziona</option>
                          <option value="true">Sono residente</option>
                          <option value="false">Non sono residente</option>
                        </select>
                      </label>
                    </div>
                    <fieldset>
                      <legend className="text-sm font-medium">
                        Consumi annui per fascia (kWh)
                      </legend>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {field("electricity.bands.F1", "F1")}
                        {field("electricity.bands.F2", "F2")}
                        {field("electricity.bands.F3", "F3")}
                      </div>
                      <label className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-[#526859]">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-[#164d3b]"
                          checked={
                            draft.values["electricity.useConventionalBands"] ===
                            "true"
                          }
                          onChange={(event) => {
                            change(
                              "electricity.useConventionalBands",
                              String(event.target.checked),
                            );
                            if (event.target.checked)
                              setDrafts((previous) => {
                                const values = {
                                  ...previous.electricity.values,
                                };
                                delete values["electricity.bands.F1"];
                                delete values["electricity.bands.F2"];
                                delete values["electricity.bands.F3"];
                                return {
                                  ...previous,
                                  electricity: {
                                    ...previous.electricity,
                                    values,
                                  },
                                };
                              });
                          }}
                        />
                        <span>
                          Non conosco le fasce: confermo la ripartizione
                          convenzionale del Portale (F1 33%, F2 31%, F3 36%).
                        </span>
                      </label>
                    </fieldset>
                  </>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Uso del gas
                      <select
                        className={inputClass}
                        value={draft.values["gas.usage"] ?? ""}
                        onChange={(event) =>
                          change("gas.usage", event.target.value)
                        }
                      >
                        <option value="">Seleziona</option>
                        <option value="cooking_hot_water">
                          Cottura e/o acqua calda
                        </option>
                        <option value="heating">Anche riscaldamento</option>
                        <option value="technology" disabled>
                          Uso tecnologico: percorso non domestico non supportato
                        </option>
                      </select>
                    </label>
                    {field("gas.meterClass", "Classe del contatore", {
                      placeholder: "Es. G4",
                      hint: "La trovi nei dati tecnici della fornitura.",
                    })}
                  </div>
                )}
                {draft.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-xl bg-[#f7f6e8] p-3 text-sm text-[#6b6533]"
                  >
                    {warning}
                  </p>
                ))}
                <label className="flex items-start gap-3 border-t border-[#e4e9e1] pt-6 text-sm leading-relaxed text-[#395344]">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[#164d3b]"
                    checked={draft.confirmed}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [commodity]: {
                          ...previous[commodity],
                          confirmed: event.target.checked,
                          profile: undefined,
                        },
                      }))
                    }
                  />
                  <span>
                    Ho controllato questi dati e confermo che il consumo si
                    riferisce all’intero anno indicato.
                  </span>
                </label>
                {issues.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
                  >
                    <p className="mb-2 font-semibold">
                      Manca ancora qualche dato
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      {issues.map((issue) => (
                        <li key={`${issue.path}-${issue.message}`}>
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button className={primary} type="submit">
                  Conferma i dati <ArrowRight size={16} />
                </button>
                {draft.profile && (
                  <div
                    aria-live="polite"
                    className="rounded-2xl border border-[#bed5b9] bg-[#f1f7eb] p-5"
                  >
                    <p className="flex items-center gap-2 font-semibold text-[#234f35]">
                      <Check size={18} />
                      Profilo {commodity === "electricity" ? "luce" : "gas"}{" "}
                      confermato
                    </p>
                    <p className="mt-2 text-sm text-[#526859]">
                      {draft.profile.annualConsumption.value}{" "}
                      {draft.profile.annualConsumption.unit}/anno ·{" "}
                      {draft.profile.municipality.name}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-[#4f6255]">
                      Puoi aggiungere l’altra fornitura dalla scheda in alto,
                      mantenendo i due profili indipendenti.
                    </p>
                  </div>
                )}
              </form>
            </>
          )}
          {busy && (
            <div
              aria-live="polite"
              className="mt-5 flex items-center gap-3 rounded-xl bg-[#f0f5eb] p-4 text-sm text-[#395344]"
            >
              <LoaderCircle className="animate-spin" size={18} />
              <span>
                Sto leggendo la bolletta. Puoi intanto passare all’inserimento
                manuale.
              </span>
            </div>
          )}
          {message && (
            <div
              aria-live="polite"
              className="mt-5 rounded-xl bg-[#f5f3e8] p-4 text-sm leading-relaxed text-[#5d613f]"
            >
              {message}
              {pendingJob && !busy && ocrFailed && (
                <button
                  type="button"
                  onClick={() => void retry()}
                  className="ml-2 font-semibold underline"
                >
                  Riprova lettura
                </button>
              )}
            </div>
          )}
        </section>
        <aside className="space-y-6 px-1 py-2">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#688a65]" size={21} />
            <div>
              <h3 className="text-sm font-semibold text-[#2a4b37]">
                La tua bolletta è privata
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#52604d]">
                Conserviamo l’originale in un archivio privato. I dati del
                percorso restano in questa pagina: al ricaricamento dovrai
                inserirli di nuovo.
              </p>
            </div>
          </div>
          <div className="h-px bg-[#dde4d8]" />
          <p className="text-xs leading-relaxed text-[#52604d]">
            Luce e gas hanno consumi e offerte diversi. Ti chiediamo di
            confermare i dati di ciascuna fornitura, anche quando compaiono
            sulla stessa bolletta.
          </p>
          <p className="font-serif text-xl leading-snug text-[#5c704d]">
            Una scelta chiara comincia
            <br />
            da numeri comprensibili.
          </p>
        </aside>
      </div>
    </div>
  );
}
