"use client";

import { useEffect, useRef, useState } from "react";
import type { ArchivedOfferOption } from "@/src/modules/comparison/offer-archive";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#c9d4ca] bg-white px-3 py-2.5 text-base";
export function CurrentArchivePicker({
  commodity,
  initialCode,
  selected,
  onSelect,
}: {
  commodity: "electricity" | "gas";
  initialCode?: string;
  selected?: ArchivedOfferOption;
  onSelect: (item: ArchivedOfferOption | undefined) => void;
}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [items, setItems] = useState<ArchivedOfferOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  async function search() {
    const current = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage("");
    setItems([]);
    onSelect(undefined);
    try {
      const response = await fetch(
        `/api/offer-archive?${new URLSearchParams({ code: code.trim(), commodity })}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("archive_unavailable");
      const data = await response.json();
      if (current !== generation.current) return;
      if (data.schemaVersion !== 1 || !Array.isArray(data.offerArchive?.items))
        throw new Error("archive_unavailable");
      const found: ArchivedOfferOption[] = data.offerArchive.items;
      setItems(found);
      if (!found.length)
        setMessage(
          "Non abbiamo condizioni archiviate per questo codice. Puoi inserire le condizioni dalla bolletta; senza dati sufficienti il risparmio resta non disponibile.",
        );
    } catch {
      if (current === generation.current && !controller.signal.aborted)
        setMessage(
          "L'archivio non è disponibile. Puoi inserire le condizioni dalla bolletta o confrontare soltanto le alternative.",
        );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded-xl border border-[#d8ded4] p-4">
      <p className="text-sm text-[#4f6558]">
        Cerca il codice riportato in bolletta e scegli l'osservazione ufficiale
        che corrisponde al tuo contratto. Non sostituiamo automaticamente
        condizioni o rinnovi mancanti.
      </p>
      <label className="block text-sm">
        Codice dell'offerta attuale
        <input
          className={fieldClass}
          maxLength={100}
          value={code}
          onChange={(event) => {
            generation.current++;
            request.current?.abort();
            setBusy(false);
            setCode(event.target.value);
            setItems([]);
            setMessage("");
            onSelect(undefined);
          }}
        />
      </label>
      <button
        type="button"
        disabled={busy || !code.trim()}
        onClick={search}
        className="rounded-full border border-[#aebfb2] px-4 py-2 text-sm font-semibold text-[#164d3b] disabled:opacity-50"
      >
        {busy ? "Cerco nell'archivio…" : "Cerca le condizioni archiviate"}
      </button>
      {items.length > 0 && (
        <label className="block text-sm">
          Condizioni ufficiali archiviate
          <select
            aria-label="Condizioni ufficiali archiviate"
            className={fieldClass}
            value={
              selected ? `${selected.versionId}:${selected.supplierVat}` : ""
            }
            onChange={(event) =>
              onSelect(
                items.find(
                  (item) =>
                    `${item.versionId}:${item.supplierVat}` ===
                    event.target.value,
                ),
              )
            }
          >
            <option value="">Scegli un'osservazione</option>
            {items.map((item, index) => (
              <option
                key={`${item.versionId}:${item.supplierVat}`}
                value={`${item.versionId}:${item.supplierVat}`}
              >
                {index + 1}. {item.name} · fonte {item.sourceDate} · registrata{" "}
                {new Intl.DateTimeFormat("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Europe/Rome",
                }).format(new Date(item.observedAt))}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && (
        <p className="text-sm">
          {selected.name} · partita IVA {selected.supplierVat}. Conferma sotto
          che le condizioni corrispondono al tuo contratto e indica il loro
          periodo di applicabilità.
        </p>
      )}
      {message && (
        <output className="block text-sm text-[#4f6558]">{message}</output>
      )}
    </div>
  );
}
