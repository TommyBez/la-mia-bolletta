"use client";

import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { decimal, money, type VariantProps } from "./model";
import styles from "./variant-a.module.css";

export function VariantA({
  comparison: c,
  onOffer,
  onShowRanking,
  onShowMethod,
}: VariantProps) {
  const offer = c.recommended;
  const heroCost = c.keepCurrent
    ? (c.currentAnnual ?? offer.annual)
    : offer.annual;
  return (
    <main id="risultato" className={styles.main}>
      <div className={styles.intro}>
        <div className={styles.eyebrow}>
          <span /> IL TUO CONFRONTO, SPIEGATO BENE
        </div>
        <h1>{c.headline}</h1>
        <p>{c.explanation}</p>
      </div>
      <section
        className={styles.recommendation}
        aria-label="Il nostro consiglio"
      >
        <div className={styles.offer}>
          <div className={styles.tag}>
            <Sparkles size={15} />{" "}
            {c.keepCurrent
              ? "Il consiglio: mantieni la tua offerta"
              : c.conditional
                ? "Il consiglio, nello scenario centrale"
                : "Il nostro consiglio per te"}
          </div>
          <div className={styles.offerTitle}>
            <span className={styles.symbol}>
              {c.keepCurrent ? <ShieldCheck size={27} /> : `${offer.id}.`}
            </span>
            <div>
              <span className={styles.supplier}>
                {c.keepCurrent ? "IL TUO CONTRATTO" : offer.supplier}
              </span>
              <h2>{c.keepCurrent ? "La tua offerta attuale" : offer.name}</h2>
            </div>
          </div>
          <div className={styles.costLabel}>Costo annuo stimato</div>
          <div className={styles.cost}>
            {money(heroCost)}
            <span>/ anno</span>
          </div>
          <p className={styles.monthly}>
            Circa {decimal(heroCost / 12)} € al mese in media
          </p>
          <div className={styles.attributes}>
            <span>
              <Check size={15} />{" "}
              {c.keepCurrent
                ? "La più conveniente nell’esempio"
                : `Prezzo ${offer.kind.toLowerCase()}`}
            </span>
            <span>
              <Check size={15} />{" "}
              {c.keepCurrent ? "Nessun cambio necessario" : "Bolletta digitale"}
            </span>
          </div>
          <button
            type="button"
            className={styles.primary}
            onClick={c.keepCurrent ? onShowRanking : () => onOffer(offer)}
          >
            {c.keepCurrent
              ? "Confronta comunque le alternative"
              : "Scopri questa offerta"}
            <ArrowRight size={18} />
          </button>
          <p className={styles.small}>
            {c.keepCurrent
              ? "Decidi tu se e quando cambiare."
              : "Prima tutti i dettagli. Poi decidi tu."}
          </p>
        </div>
        <div className={styles.saving}>
          <span className={styles.savingLabel}>
            {c.keepCurrent
              ? "Sei già sulla strada giusta"
              : c.savings === null
                ? "Manca un pezzo del confronto"
                : "Potresti risparmiare"}
          </span>
          {c.savings !== null && !c.keepCurrent ? (
            <>
              <div className={styles.savingNumber}>
                <ArrowDownRight size={38} strokeWidth={1.5} />
                {money(c.savings)}
              </div>
              <span className={styles.savingUnit}>
                all’anno, rispetto alla tua offerta
              </span>
            </>
          ) : (
            <div className={styles.quietTitle}>
              {c.keepCurrent
                ? "A volte, la scelta migliore è restare."
                : "Prima i costi. Poi il risparmio."}
            </div>
          )}
          {c.currentAnnual !== null ? (
            <div className={styles.miniComparison}>
              <div>
                <span>La tua offerta attuale</span>
                <strong>{money(c.currentAnnual)}</strong>
              </div>
              <div className={styles.bar}>
                <span
                  style={{
                    width: `${(c.currentAnnual / Math.max(c.currentAnnual, offer.annual)) * 100}%`,
                  }}
                />
              </div>
              <div>
                <span>{offer.name}</span>
                <strong>{money(offer.annual)}</strong>
              </div>
              <div className={`${styles.bar} ${styles.newBar}`}>
                <span
                  style={{
                    width: `${(offer.annual / Math.max(c.currentAnnual, offer.annual)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className={styles.missing}>
              Servono il prezzo dell’energia e la quota fissa attuali. Non li
              ricaviamo dal solo totale dell’ultima bolletta.
            </p>
          )}
          <p className={styles.caveat}>
            {c.conditional
              ? "Se i prezzi salgono, questa alternativa può costare più della tua offerta attuale."
              : "Stessi consumi, stesso periodo di 12 mesi. Gli importi futuri possono cambiare."}
          </p>
          <button
            type="button"
            className={styles.methodLink}
            onClick={onShowMethod}
          >
            <CircleHelp size={15} /> Come leggere questa stima
          </button>
        </div>
      </section>
      <section className={styles.reasons} aria-label="Le ragioni del consiglio">
        <div>
          <span>01</span>
          <h3>Parte da te</h3>
          <p>Un confronto sui tuoi consumi e sulle tue preferenze.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Guarda l’intero anno</h3>
          <p>Energia, quote fisse e altre voci nella stessa stima.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Ti lascia scegliere</h3>
          <p>Condizioni e alternative sempre a portata di mano.</p>
        </div>
      </section>
      <section className={styles.alternatives}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>C’È PIÙ DI UNA BUONA SCELTA</span>
            <h2>Altre strade, altre priorità.</h2>
          </div>
          <button type="button" onClick={onShowRanking}>
            Tutte le offerte dell’esempio <ArrowRight size={16} />
          </button>
        </div>
        {c.offers
          .filter((o) => o.id !== offer.id)
          .map((alternative) => (
            <button
              type="button"
              key={alternative.id}
              className={styles.alternative}
              onClick={() => onOffer(alternative)}
            >
              <span className={styles.altSymbol}>{alternative.id}.</span>
              <span className={styles.altName}>
                <strong>{alternative.name}</strong>
                <small>
                  {alternative.kind === "Fisso"
                    ? "Per chi cerca stabilità nel prezzo dell’energia"
                    : "Per chi preferisce seguire il mercato"}
                </small>
              </span>
              <span className={styles.altPrice}>
                <strong>{money(alternative.annual)}</strong>
                <small>all’anno, stimati</small>
              </span>
              <ChevronRight size={20} />
            </button>
          ))}
      </section>
    </main>
  );
}
