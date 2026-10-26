"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Flame,
  ListFilter,
  LockKeyhole,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { decimal, money, type VariantProps } from "./model";
import styles from "./variant-c.module.css";

// Throwaway direction C: browse a short offer list, inspect one offer at a time.
export function VariantC({
  comparison,
  profile,
  onOffer,
  onReviewProfile,
  onShowRanking,
  onShowMethod,
}: VariantProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const selected =
    comparison.offers.find((offer) => offer.id === selectedId) ??
    comparison.recommended;
  const isRecommended =
    selected.id === comparison.recommended.id && !comparison.keepCurrent;
  const difference =
    comparison.currentAnnual === null
      ? null
      : comparison.currentAnnual - selected.annual;
  const SupplyIcon = comparison.supply === "luce" ? Zap : Flame;

  function selectOffer(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 760px)").matches) {
        detailHeading.current?.focus({ preventScroll: true });
        detailHeading.current?.scrollIntoView({ block: "start" });
      }
    });
  }

  return (
    <main id="risultato" className={styles.page}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>
            Un po’ di chiarezza, prima di scegliere
          </p>
          <h1>{comparison.headline}</h1>
          <p className={styles.explanation}>{comparison.explanation}</p>
        </div>
        <div className={styles.current}>
          <span className={styles.currentLabel}>
            <FileCheck2 size={17} aria-hidden="true" /> La tua offerta attuale
          </span>
          {comparison.currentAnnual === null ? (
            <>
              <strong className={styles.unknown}>Da completare</strong>
              <span>Mancano le condizioni economiche</span>
            </>
          ) : (
            <>
              <strong>{money(comparison.currentAnnual)}</strong>
              <span>Costo annuo stimato</span>
            </>
          )}
          <button type="button" onClick={onReviewProfile}>
            Rivedi i tuoi dati <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.catalogue} aria-label="Esplora le offerte">
          <div className={styles.catalogueHeading}>
            <h2>Le tue alternative</h2>
            <span>{comparison.offers.length}</span>
          </div>
          <p className={styles.catalogueHint}>
            In ordine di costo annuo stimato
          </p>
          <div className={styles.offerList}>
            {comparison.offers.map((offer, index) => {
              const active = offer.id === selected.id;
              const recommended =
                offer.id === comparison.recommended.id &&
                !comparison.keepCurrent;
              return (
                <button
                  type="button"
                  key={offer.id}
                  className={`${styles.offerOption} ${active ? styles.active : ""}`}
                  onClick={() => selectOffer(offer.id)}
                  aria-pressed={active}
                  aria-controls="explore-offer-detail"
                >
                  <span className={styles.offerNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.offerSummary}>
                    <span className={styles.offerName}>{offer.name}</span>
                    <span className={styles.offerSupplier}>
                      {offer.supplier}
                    </span>
                    <span className={styles.offerMeta}>
                      {recommended ? (
                        <span className={styles.recommendedTag}>
                          <Check size={12} aria-hidden="true" />
                          {comparison.conditional
                            ? "Da valutare"
                            : "Consigliata"}
                        </span>
                      ) : null}
                      <span>Prezzo {offer.kind.toLowerCase()}</span>
                    </span>
                  </span>
                  <span className={styles.offerPrice}>
                    <strong>{money(offer.annual)}</strong>
                    <span>/ anno</span>
                    <ChevronRight size={17} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className={styles.rankButton}
            type="button"
            onClick={onShowRanking}
          >
            <ListFilter size={17} aria-hidden="true" /> Classifica completa
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <p className={styles.catalogueFootnote}>
            Tre offerte di esempio, nessuna inserzione sponsorizzata nel
            prototipo.
          </p>
        </section>

        <section
          id="explore-offer-detail"
          className={styles.detail}
          aria-labelledby="explore-offer-title"
        >
          <div className={styles.detailTop}>
            <span className={styles.supplyMark}>
              <SupplyIcon size={26} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className={styles.detailKicker}>
              {isRecommended
                ? comparison.conditional
                  ? "La proposta da valutare"
                  : "La proposta per te"
                : "Un’alternativa da conoscere"}
            </span>
            <span className={styles.typeTag}>
              {selected.kind === "Fisso" ? (
                <LockKeyhole size={13} aria-hidden="true" />
              ) : (
                <TrendingUp size={13} aria-hidden="true" />
              )}
              {selected.kind}
            </span>
          </div>

          <h2 id="explore-offer-title" ref={detailHeading} tabIndex={-1}>
            {selected.name}
          </h2>
          <p className={styles.supplier}>{selected.supplier}</p>

          <div className={styles.priceArea}>
            <div>
              <p className={styles.priceLabel}>Costo annuo stimato</p>
              <p className={styles.annual}>{money(selected.annual)}</p>
              <p className={styles.monthly}>
                In media {decimal(selected.annual / 12)} € al mese
              </p>
            </div>
            <div
              className={`${styles.savings} ${difference !== null && difference > 0 ? styles.positive : ""}`}
            >
              {difference === null ? (
                <>
                  <CircleHelp size={21} aria-hidden="true" />
                  <strong>Risparmio da verificare</strong>
                  <span>Completa i dati dell’offerta attuale.</span>
                </>
              ) : (
                <>
                  {difference < 0 ? (
                    <ArrowUpRight size={22} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={22} aria-hidden="true" />
                  )}
                  <strong>{money(Math.abs(difference))} / anno</strong>
                  <span>
                    {difference > 0
                      ? "di risparmio stimato rispetto all’attuale"
                      : difference < 0
                        ? "in più rispetto all’offerta attuale"
                        : "di differenza rispetto all’attuale"}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={styles.factList}>
            <div>
              <span>Il prezzo dell’energia</span>
              <p>
                {selected.kind === "Fisso"
                  ? selected.duration
                  : "Segue l’andamento del mercato"}
              </p>
            </div>
            <div>
              <span>Cosa richiede</span>
              <p>{selected.requirements.join(" · ")}</p>
            </div>
            <div>
              <span>I tuoi consumi</span>
              <p>
                {decimal(profile.consumption)} {comparison.unit} / anno ·{" "}
                {profile.city}
              </p>
            </div>
          </div>

          <div className={styles.observation}>
            <span className={styles.noteMark} aria-hidden="true">
              i
            </span>
            <p>
              {selected.kind === "Fisso"
                ? "Il prezzo fisso riguarda la materia energia. Il totale della bolletta può cambiare con consumi, imposte e altre componenti."
                : comparison.conditional
                  ? "Nello scenario di prezzi in aumento, questa offerta può costare più della tua attuale. Il risparmio non è garantito."
                  : "Con un prezzo variabile, il costo dipende anche dal mercato. La media mensile è indicativa: le rate effettive possono essere diverse."}
            </p>
          </div>

          <div className={styles.detailActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onOffer(selected)}
            >
              Leggi la scheda dell’offerta
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <span>Prima di decidere, tutti i dettagli.</span>
          </div>
        </section>
      </div>

      <div className={styles.bottomNote}>
        <span>Una scelta informata parte da numeri comprensibili.</span>
        <button type="button" onClick={onShowMethod}>
          Come leggere queste stime <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
