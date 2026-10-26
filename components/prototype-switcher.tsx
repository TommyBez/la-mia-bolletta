"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const variants = ["A", "B", "C"] as const;
const labels = { A: "Il consiglio", B: "Il confronto", C: "L’esplorazione" };

export function PrototypeSwitcher({ current }: { current: "A" | "B" | "C" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function cycle(direction: number) {
    const next =
      variants[
        (variants.indexOf(current) + direction + variants.length) %
          variants.length
      ];
    const query = new URLSearchParams(params.toString());
    query.set("variant", next);
    router.replace(`${pathname}?${query}`, { scroll: false });
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    function onKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input, textarea, select, [contenteditable], [role=dialog]",
        )
      )
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        cycle(event.key === "ArrowLeft" ? -1 : 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;
  return (
    <nav aria-label="Varianti del prototipo" className="prototype-switcher">
      <button
        type="button"
        aria-label="Variante precedente"
        onClick={() => cycle(-1)}
      >
        <ArrowLeft size={18} />
      </button>
      <span aria-live="polite">
        <small>ESPLORA IL DESIGN · {variants.indexOf(current) + 1}/3</small>
        <strong>
          {current} — {labels[current]}
        </strong>
      </span>
      <button
        type="button"
        aria-label="Variante successiva"
        onClick={() => cycle(1)}
      >
        <ArrowRight size={18} />
      </button>
    </nav>
  );
}
