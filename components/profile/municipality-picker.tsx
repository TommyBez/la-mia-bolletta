"use client";
import { useEffect, useId, useRef, useState } from "react";

type Item = { portalCode: string; name: string };
export function MunicipalityPicker({
  name,
  code,
  onNameChange,
  onSelect,
}: {
  name: string;
  code: string;
  onNameChange: (name: string) => void;
  onSelect: (item: Item) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const searchGeneration = useRef(0);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (code || name.trim().length < 2) return;
    const controller = new AbortController();
    const generation = searchGeneration.current;
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/municipalities?q=${encodeURIComponent(name)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json();
        if (
          controller.signal.aborted ||
          generation !== searchGeneration.current
        )
          return;
        setItems(data.municipalities?.items ?? []);
        setUnavailable(Boolean(data.status === "temporarily_unavailable"));
        setOpen(true);
        setHighlighted(-1);
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setUnavailable(true);
        }
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [name, code]);
  function choose(item: Item) {
    searchGeneration.current++;
    onSelect(item);
    input.current?.focus();
    setOpen(false);
  }
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium">
        Comune di fornitura
      </label>
      <input
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget))
            setOpen(false);
        }}
        ref={input}
        id={id}
        name="municipality.name"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={`${id}-options`}
        aria-expanded={open && items.length > 0}
        aria-activedescendant={
          open && highlighted >= 0 ? `${id}-option-${highlighted}` : undefined
        }
        autoComplete="off"
        value={name}
        placeholder="Cerca il tuo comune"
        className="mt-2 w-full rounded-xl border border-[#c9d4ca] bg-white px-3.5 py-3 text-base outline-none focus:border-[#164d3b] focus:ring-2 focus:ring-[#164d3b]/20"
        onChange={(event) => {
          searchGeneration.current++;
          onNameChange(event.target.value);
          setItems([]);
          setOpen(false);
        }}
        onFocus={() => {
          if (items.length && !code) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" && items.length) {
            event.preventDefault();
            setOpen(true);
            setHighlighted((value) => (value + 1) % items.length);
          }
          if (event.key === "ArrowUp" && items.length) {
            event.preventDefault();
            setOpen(true);
            setHighlighted(
              (value) => (value - 1 + items.length) % items.length,
            );
          }
          if (event.key === "Enter" && open && highlighted >= 0) {
            event.preventDefault();
            choose(items[highlighted]);
          }
        }}
      />
      {code ? (
        <p className="mt-1.5 text-xs text-[#4f6255]">
          Comune identificato nella fonte ufficiale.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-[#4f6255]">
          Scrivi almeno due lettere e seleziona il comune dall'elenco.
        </p>
      )}
      {open && items.length > 0 && (
        <div
          id={`${id}-options`}
          role="listbox"
          aria-label="Comuni corrispondenti"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[#c9d4ca] bg-white p-1 shadow-lg"
        >
          {items.map((item, index) => (
            <button
              key={item.portalCode}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === highlighted}
              type="button"
              className={`w-full rounded-lg px-3 py-3 text-left text-sm ${index === highlighted ? "bg-[#eaf0de]" : "hover:bg-[#f1f4ed]"}`}
              onClick={() => choose(item)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      {unavailable && (
        <p className="mt-2 text-sm text-[#823d2c]">
          L'elenco ufficiale non è disponibile. Puoi riprovare o inserire il
          codice nelle opzioni avanzate.
        </p>
      )}
    </div>
  );
}
