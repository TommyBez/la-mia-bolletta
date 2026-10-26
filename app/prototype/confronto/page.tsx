import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparisonPrototype } from "./prototype";

export const metadata: Metadata = {
  title: "Il tuo confronto · La mia bolletta · Prototipo",
  robots: { index: false, follow: false },
};

// Three results-screen structures on one throwaway route; ?variant=A|B|C.
export default function PrototypePage() {
  return (
    <Suspense fallback={<p className="p-8">Prepariamo il prototipo…</p>}>
      <ComparisonPrototype />
    </Suspense>
  );
}
