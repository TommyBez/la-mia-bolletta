"use client";

import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { decimal, money, type Offer, type VariantProps } from "./model";
import styles from "./variant-b.module.css";

// Prototype B: an aligned ledger, read from left to right on desktop and top to bottom on mobile.
export function VariantB({
  comparison,
  profile,
  onOffer,
  onReviewProfile,
  onShowRanking,
  onShowMethod,
}: VariantProps) {
  const { recommended, currentAnnual, savings, keepCurrent, conditional } =
    comparison;
  const alternative =
    comparison.offers.find(
      (offer) => offer.id !== recommended.id && offer.kind === "Fisso",
    ) ?? comparison.offers[2];
  const difference = (offer: Offer) => {
    if (currentAnnual === null) return "Risparmio non disponibile";
    const amount = currentAnnual - offer.annual;
    return amount >= 0
      ? `${money(amount)} in meno all’anno`
      : `${money(-amount)} in più all’anno`;
  };

  return (
    <main id="risultato" className={styles.page}>
      <div className={styles.masthead}>
        <div>
          <p className={styles.eyebrow}>
            IL TUO CONFRONTO / {comparison.supply.toUpperCase()}
          </p>
          <h1>
            Le differenze.
            <br />
            <span>Nero su bianco.</span>
          </h1>
        </div>
        <button
          className={styles.profile}
          type="button"
          onClick={onReviewProfile}
        >
          <span className={styles.profileNumber}>
            {decimal(profile.consumption)} <small>{comparison.unit}/anno</small>
          </span>
          <span>
            {profile.city} <span aria-hidden="true">·</span> Rivedi i dati{" "}
            <SlidersHorizontal size={14} aria-hidden="true" />
          </span>
        </button>
      </div>

      <section className={styles.verdict} aria-labelledby="comparison-verdict">
        <div className={styles.verdictIcon}>
          <ArrowDownRight size={26} aria-hidden="true" />
        </div>
        <div>
          <h2 id="comparison-verdict">{comparison.headline}</h2>
          <p>{comparison.explanation}</p>
        </div>
        {savings !== null && !keepCurrent && (
          <div className={styles.verdictSaving}>
            <strong>{money(savings)}</strong>
            <span>
              risparmio annuo stimato
              {conditional ? " nello scenario centrale" : ""}
            </span>
          </div>
        )}
      </section>

      <div className={styles.ledgerIntro}>
        <span>01 / STESSI CONSUMI, TRE POSSIBILITÀ</span>
        <span>Importi stimati su 12 mesi</span>
      </div>
      <section
        className={styles.ledger}
        aria-label="Confronto tra contratto attuale e due alternative"
      >
        <article
          className={`${styles.column} ${keepCurrent ? styles.selected : styles.current}`}
        >
          <div className={styles.columnTop}>
            <span className={styles.columnLabel}>
              {keepCurrent ? (
                <>
                  <Check size={14} aria-hidden="true" /> LA NOSTRA INDICAZIONE
                </>
              ) : (
                "IL PUNTO DI PARTENZA"
              )}
            </span>
            <h3>La tua offerta</h3>
            <p>Il contratto che hai oggi</p>
          </div>
          <div className={styles.cost}>
            <span>Costo annuo stimato</span>
            {currentAnnual === null ? (
              <strong className={styles.missing}>Da completare</strong>
            ) : (
              <strong>{money(currentAnnual)}</strong>
            )}
            <small>
              {currentAnnual === null
                ? "Mancano le condizioni economiche"
                : `${decimal(currentAnnual / 12)} €/mese in media`}
            </small>
          </div>
          <div className={styles.delta}>
            {keepCurrent
              ? "La più conveniente nell’esempio"
              : "Il riferimento del confronto"}
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Condizioni economiche</dt>
              <dd>
                {currentAnnual === null
                  ? "Non ricostruibili"
                  : "Ricostruite nell’esempio"}
              </dd>
            </div>
            <div>
              <dt>Durata</dt>
              <dd>Da verificare sul contratto</dd>
            </div>
            <div>
              <dt>Requisiti</dt>
              <dd>Le tue condizioni attuali</dd>
            </div>
          </dl>
          <button
            className={styles.secondary}
            type="button"
            onClick={onReviewProfile}
          >
            {currentAnnual === null
              ? "Rivedi i dati disponibili"
              : "Rivedi la tua fornitura"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </article>

        <article
          className={`${styles.column} ${keepCurrent ? "" : styles.selected}`}
        >
          <div className={styles.columnTop}>
            <span className={styles.columnLabel}>
              {keepCurrent ? (
                "PRIMA ALTERNATIVA"
              ) : (
                <>
                  <Check size={14} aria-hidden="true" />{" "}
                  {conditional
                    ? "CONSIGLIO CONDIZIONATO"
                    : "IL NOSTRO CONSIGLIO"}
                </>
              )}
            </span>
            <h3>{recommended.name}</h3>
            <p>{recommended.supplier}</p>
          </div>
          <div className={styles.cost}>
            <span>Costo annuo stimato</span>
            <strong>{money(recommended.annual)}</strong>
            <small>{decimal(recommended.annual / 12)} €/mese in media</small>
          </div>
          <div className={styles.delta}>{difference(recommended)}</div>
          <dl className={styles.facts}>
            <div>
              <dt>Prezzo dell’energia</dt>
              <dd>
                {recommended.kind}
                {recommended.kind === "Variabile"
                  ? " · segue il mercato"
                  : " · stabilito in contratto"}
              </dd>
            </div>
            <div>
              <dt>Durata</dt>
              <dd>{recommended.duration}</dd>
            </div>
            <div>
              <dt>Requisiti dichiarati</dt>
              <dd>{recommended.requirements.join(" · ")}</dd>
            </div>
          </dl>
          <button
            className={keepCurrent ? styles.secondary : styles.primary}
            type="button"
            onClick={() => onOffer(recommended)}
          >
            Esplora l’offerta
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </article>

        <article className={styles.column}>
          <div className={styles.columnTop}>
            <span className={styles.columnLabel}>
              {recommended.kind === "Variabile"
                ? "PER CHI PREFERISCE IL FISSO"
                : "UN’ALTRA DURATA"}
            </span>
            <h3>{alternative.name}</h3>
            <p>{alternative.supplier}</p>
          </div>
          <div className={styles.cost}>
            <span>Costo annuo stimato</span>
            <strong>{money(alternative.annual)}</strong>
            <small>{decimal(alternative.annual / 12)} €/mese in media</small>
          </div>
          <div className={styles.delta}>{difference(alternative)}</div>
          <dl className={styles.facts}>
            <div>
              <dt>Prezzo dell’energia</dt>
              <dd>Fisso · stabilito in contratto</dd>
            </div>
            <div>
              <dt>Durata</dt>
              <dd>{alternative.duration}</dd>
            </div>
            <div>
              <dt>Requisiti dichiarati</dt>
              <dd>{alternative.requirements.join(" · ")}</dd>
            </div>
          </dl>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => onOffer(alternative)}
          >
            Esplora l’alternativa
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </article>
      </section>

      <div className={styles.ledgerFoot}>
        <p>
          La media mensile è il costo annuo diviso per 12. Non è l’importo di
          una rata.
        </p>
        <button type="button" onClick={onShowRanking}>
          Tutte le {comparison.offers.length} offerte dell’esempio{" "}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      <section
        className={styles.context}
        aria-label="Come leggere il confronto"
      >
        <span className={styles.contextIndex}>02</span>
        <div>
          <h2>
            {conditional
              ? "Il vantaggio può cambiare."
              : "Una stima, con le carte in tavola."}
          </h2>
          <p>
            {conditional
              ? "Nello scenario con prezzi in aumento, la proposta variabile può costare più del contratto attuale. Confronta le ipotesi prima di scegliere."
              : "Gli importi dipendono dai consumi e dalle ipotesi sui prezzi. Un prezzo fisso dell’energia non rende fisso il totale della bolletta."}
          </p>
        </div>
        <button type="button" onClick={onShowMethod}>
          <Info size={17} aria-hidden="true" />{" "}
          {conditional ? "Confronta gli scenari" : "Ipotesi del confronto"}
        </button>
      </section>
    </main>
  );
}
