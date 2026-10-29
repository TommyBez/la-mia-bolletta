import { ArrowUpRight, Check, Leaf } from "lucide-react";
import Link from "next/link";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7ef] text-[#16392b]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <span className="font-semibold tracking-tight">
          la mia bolletta<span className="ml-1 text-[#91a77d]">↗</span>
        </span>
        <span className="text-xs text-[#718269]">
          Luce e gas, finalmente chiari
        </span>
      </header>
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[.2em] text-[#6f8866]">
            I consumi sono tuoi. La scelta anche.
          </p>
          <h1 className="font-serif text-6xl leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
            Una bolletta
            <br />
            più leggera.
            <br />
            <span className="text-[#7d9569]">
              Una scelta
              <br />
              più semplice.
            </span>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-[#64745f]">
            Confronta le offerte di luce e gas partendo dai tuoi consumi reali.
            Con dati del Portale Offerte e spiegazioni che si capiscono.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-5 rounded-full bg-[#164d3b] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#0d3628]"
            href="/confronto"
          >
            Parti dalla tua bolletta <ArrowUpRight size={19} />
          </Link>
          <p className="mt-5 text-xs text-[#798771]">
            Gratis. Senza account. Sei tu a confermare i dati.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-8 rounded-full bg-[#e4ecd9] blur-3xl" />
          <div className="relative rotate-[-3deg] rounded-3xl border border-[#dce5d3] bg-white p-8 shadow-[0_30px_70px_-30px_#63814e55]">
            <div className="mb-8 flex items-center justify-between border-b border-[#edf0e8] pb-6">
              <span className="text-xs uppercase tracking-[.14em] text-[#73836b]">
                Da qui si comincia
              </span>
              <Leaf size={24} className="text-[#87a267]" />
            </div>
            <p className="font-serif text-4xl leading-tight">
              La tua casa.
              <br />I tuoi numeri.
              <br />
              Le tue possibilità.
            </p>
            <div className="mt-9 space-y-4">
              {[
                "Carichi una bolletta o inserisci i consumi",
                "Controlli i dati, senza sorprese",
                "Valuti le offerte adatte a te",
              ].map((text, index) => (
                <div
                  className="flex items-start gap-3 text-sm leading-relaxed text-[#617258]"
                  key={text}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#edf4e4] text-xs font-semibold text-[#537044]">
                    {index + 1}
                  </span>
                  {text}
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 border-t border-[#edf0e8] pt-6 text-xs text-[#73836b]">
              <Check size={15} />
              Dati chiari, scelte consapevoli
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto w-full max-w-6xl px-6 py-7 text-xs text-[#8a9582] sm:px-10">
        Un progetto indipendente. Dati ufficiali del Portale Offerte.
      </footer>
    </main>
  );
}
