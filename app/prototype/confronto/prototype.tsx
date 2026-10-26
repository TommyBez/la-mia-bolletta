"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Leaf,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type DemoCase,
  decimal,
  initialProfiles,
  makeComparison,
  money,
  type Offer,
  type Profile,
  type Supply,
} from "./model";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";
import "./prototype.css";

type Panel = "profile" | "offer" | "ranking" | "method" | "supplier" | null;

export function ComparisonPrototype() {
  const search = useSearchParams();
  const candidate = search.get("variant");
  const variant = candidate === "B" || candidate === "C" ? candidate : "A";
  const [supply, setSupply] = useState<Supply>("luce");
  const [gasAdded, setGasAdded] = useState(false);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [demoCase, setDemoCase] = useState<DemoCase>("standard");
  const [fixedOnly, setFixedOnly] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [draftSupply, setDraftSupply] = useState<Supply>("luce");
  const [draft, setDraft] = useState<Profile>(initialProfiles.luce);
  const [confirmed, setConfirmed] = useState({ luce: false, gas: false });
  const profile = profiles[supply];
  const comparison = makeComparison(supply, profile, demoCase, fixedOnly);
  const otherSupply = supply === "luce" ? "gas" : "luce";
  const other = makeComparison(
    otherSupply,
    profiles[otherSupply],
    demoCase,
    fixedOnly,
  );
  const combinedAnnual =
    (comparison.keepCurrent
      ? (comparison.currentAnnual ?? comparison.recommended.annual)
      : comparison.recommended.annual) +
    (other.keepCurrent
      ? (other.currentAnnual ?? other.recommended.annual)
      : other.recommended.annual);

  function reviewProfile(target: Supply = supply) {
    setDraftSupply(target);
    setDraft({ ...profiles[target] });
    setPanel("profile");
  }
  function showOffer(offer: Offer) {
    setSelectedOffer(offer);
    setPanel("offer");
  }
  const variantProps = {
    comparison,
    profile,
    onOffer: showOffer,
    onReviewProfile: () => reviewProfile(),
    onShowRanking: () => setPanel("ranking"),
    onShowMethod: () => setPanel("method"),
  };
  const modalTitle =
    panel === "profile"
      ? "Diamo un’occhiata ai tuoi dati."
      : panel === "ranking"
        ? "Tutte le offerte dell’esempio"
        : panel === "method"
          ? "Cosa c’è dietro questa stima"
          : panel === "supplier"
            ? "Qui passeresti al fornitore."
            : (selectedOffer?.name ?? "Dettagli dell’offerta");

  return (
    <div className={`bill-prototype variant-${variant.toLowerCase()}`}>
      <a className="skip-link" href="#risultato">
        Vai al risultato
      </a>
      <div className="demo-strip">
        <span>
          <span className="demo-dot" /> PROTOTIPO · DATI DI ESEMPIO
        </span>
        <label>
          Prova un caso{" "}
          <select
            value={demoCase}
            onChange={(e) => setDemoCase(e.target.value as DemoCase)}
          >
            <option value="standard">Risparmio stimato</option>
            <option value="incerto">Vantaggio incerto</option>
            <option value="incompleto">Contratto incompleto</option>
            <option value="resta">Conviene restare</option>
          </select>
        </label>
      </div>
      <header className="brand-header">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={23} strokeWidth={1.7} />
          </span>
          <span>
            la mia bolletta<span className="brand-period">.</span>
          </span>
        </div>
        <nav aria-label="Navigazione principale">
          <span aria-current="page">Il tuo confronto</span>
          <button type="button" onClick={() => setPanel("method")}>
            Come funziona
          </button>
        </nav>
        <span className="free-note">
          <ShieldCheck size={15} /> Gratis, senza account
        </span>
      </header>
      <div className="workspace-bar">
        <div className="workspace-top">
          <fieldset className="supply-tabs" aria-label="Fornitura">
            <button
              type="button"
              aria-pressed={supply === "luce"}
              onClick={() => setSupply("luce")}
            >
              <Zap size={15} /> Luce
            </button>
            <button
              type="button"
              aria-pressed={gasAdded && supply === "gas"}
              onClick={() =>
                gasAdded ? setSupply("gas") : reviewProfile("gas")
              }
            >
              {gasAdded ? <Flame size={15} /> : <Plus size={15} />}{" "}
              {gasAdded ? "Gas" : "Aggiungi gas"}
            </button>
          </fieldset>
          <button
            type="button"
            className="profile-link"
            onClick={() => reviewProfile()}
          >
            <MapPin size={13} />
            <span>
              {profile.city} <span className="dot-divider">·</span>{" "}
              {decimal(profile.consumption)} {comparison.unit}/anno{" "}
              {supply === "luce" && (
                <>
                  <span className="dot-divider">·</span> {profile.power} kW
                </>
              )}
            </span>
            <Pencil size={13} />
            <span className="sr-only">Rivedi i dati</span>
          </button>
        </div>
        <div className="preference-row">
          <span>
            Il tuo prossimo anno di{" "}
            {supply === "luce" ? "energia elettrica" : "gas"}
          </span>
          <label>
            <input
              type="checkbox"
              checked={fixedOnly}
              onChange={(e) => setFixedOnly(e.target.checked)}
            />
            <span>Preferisco il prezzo fisso</span>
          </label>
        </div>
        {gasAdded && (
          <div className="combined">
            <Check size={14} />
            <span>
              Luce + gas, scegliendo le due raccomandazioni:{" "}
              <strong>{money(combinedAnnual)}/anno stimati</strong>
            </span>
          </div>
        )}
      </div>
      {variant === "A" ? (
        <VariantA {...variantProps} />
      ) : variant === "B" ? (
        <VariantB {...variantProps} />
      ) : (
        <VariantC {...variantProps} />
      )}
      <footer className="prototype-footer">
        <span>Una scelta più chiara, una bolletta alla volta.</span>
        <p>
          Offerte e importi inventati per valutare il design. Nessun
          collegamento ai dati di mercato.
        </p>
      </footer>
      <PrototypeSwitcher current={variant} />

      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent showCloseButton={false} className="bill-modal">
          <DialogClose className="modal-close" aria-label="Chiudi">
            <X size={20} />
          </DialogClose>
          <span className="modal-kicker">LA MIA BOLLETTA · ESEMPIO</span>
          <DialogTitle className="modal-title">{modalTitle}</DialogTitle>
          <DialogDescription className="modal-description">
            {panel === "profile"
              ? "Una rapida conferma, prima di confrontare. In questo prototipo i dati sono già compilati e puoi modificarli."
              : panel === "offer"
                ? `${selectedOffer?.supplier} · Offerta dimostrativa, non sottoscrivibile`
                : panel === "ranking"
                  ? "Tre offerte sintetiche ordinate per costo annuo stimato, con gli stessi consumi e le stesse ipotesi."
                  : panel === "supplier"
                    ? "La sottoscrizione avverrà sul suo sito, dopo aver verificato le condizioni aggiornate."
                    : "Un esempio per capire l’interfaccia: questi importi non provengono dal Portale Offerte, da GME o da altri operatori."}
          </DialogDescription>
          {panel === "profile" && (
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                setProfiles({ ...profiles, [draftSupply]: draft });
                setConfirmed({ ...confirmed, [draftSupply]: true });
                if (draftSupply === "gas") setGasAdded(true);
                setSupply(draftSupply);
                setPanel(null);
              }}
            >
              <div className="form-note">
                <ShieldCheck size={19} />
                <span>
                  Nessuna bolletta caricata. Questi dati rimangono solo nella
                  pagina e si azzerano ricaricandola.
                </span>
              </div>
              <label>
                Comune di fornitura{" "}
                {!confirmed[draftSupply] && (
                  <span className="uncertain">Da verificare</span>
                )}
                <input
                  required
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </label>
              <label>
                Consumo annuo ({draftSupply === "luce" ? "kWh" : "Smc"})
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={draft.consumption || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, consumption: Number(e.target.value) })
                  }
                />
                <small>Il totale degli ultimi 12 mesi.</small>
              </label>
              {draftSupply === "luce" && (
                <label>
                  Potenza impegnata
                  <select
                    value={draft.power}
                    onChange={(e) =>
                      setDraft({ ...draft, power: e.target.value })
                    }
                  >
                    <option value="1.5">1,5 kW</option>
                    <option value="3">3 kW</option>
                    <option value="4.5">4,5 kW</option>
                    <option value="6">6 kW</option>
                    <option value="10">10 kW</option>
                  </select>
                </label>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.resident}
                  onChange={(e) =>
                    setDraft({ ...draft, resident: e.target.checked })
                  }
                />
                È la mia abitazione di residenza
              </label>
              <p className="fine-print">
                Qui cambiare i consumi modifica gli importi con una formula
                illustrativa. Comune, potenza e residenza non alimentano ancora
                un calcolo tariffario.
              </p>
              <button className="solid-button" type="submit">
                Conferma e confronta {draftSupply}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {panel === "offer" && selectedOffer && (
            <div className="offer-detail">
              <div className="detail-cost">
                <span>Costo annuo stimato</span>
                <strong>{money(selectedOffer.annual)}</strong>
                <small>
                  Circa {decimal(selectedOffer.annual / 12)} € al mese in media,
                  non una rata
                </small>
              </div>
              <dl>
                <div>
                  <dt>Prezzo dell’energia</dt>
                  <dd>{selectedOffer.kind}</dd>
                </div>
                <div>
                  <dt>Durata delle condizioni</dt>
                  <dd>{selectedOffer.duration}</dd>
                </div>
                <div>
                  <dt>Codice offerta di esempio</dt>
                  <dd>
                    <code>{selectedOffer.code}</code>
                  </dd>
                </div>
              </dl>
              <h3>Requisiti dichiarati</h3>
              <ul>
                {selectedOffer.requirements.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="form-note">
                {selectedOffer.kind === "Fisso"
                  ? "Il prezzo fisso riguarda la materia energia. Consumi, imposte e altre componenti possono cambiare il totale della bolletta."
                  : "Il prezzo variabile segue il mercato. Il costo futuro e il risparmio possono cambiare."}
              </div>
              <button
                type="button"
                className="solid-button"
                onClick={() => setPanel("supplier")}
              >
                Continua verso il fornitore
                <ExternalLink size={16} />
              </button>
              <p className="fine-print">
                Passaggio simulato: non verrà aperto un sito esterno.
              </p>
            </div>
          )}
          {panel === "ranking" && (
            <div className="ranking-list">
              {comparison.offers.map((offer, i) => (
                <button
                  type="button"
                  key={offer.id}
                  onClick={() => showOffer(offer)}
                >
                  <span className="rank-number">0{i + 1}</span>
                  <span>
                    <strong>{offer.name}</strong>
                    <small>
                      {offer.kind} · {offer.supplier}
                    </small>
                    {offer.id === comparison.recommended.id &&
                      !comparison.keepCurrent && (
                        <small className="rank-tag">
                          {comparison.conditional
                            ? "Consigliata nello scenario centrale"
                            : "Coerente con le tue preferenze"}
                        </small>
                      )}
                  </span>
                  <span className="rank-price">
                    {money(offer.annual)}
                    <small>/ anno stimati</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
          {panel === "method" && (
            <div className="method-content">
              <h3>Lo stesso metro per tutte le offerte</h3>
              <p>
                Il prodotto confronterà la spesa prevista nei prossimi 12 mesi,
                usando gli stessi consumi e includendo le voci applicabili. Il
                mensile è il totale annuo diviso per 12: non è una previsione
                della singola bolletta.
              </p>
              <h3>Il futuro può cambiare il risultato</h3>
              <p>
                Questi tre scenari sono esempi, senza probabilità associate. Qui
                il contratto attuale è rappresentato con un costo invariato;
                l’alternativa varia solo se il prezzo dell’energia è variabile.
              </p>
              <div className="scenario-table">
                <div className="scenario-table-header">
                  <span>Ipotesi</span>
                  <span>Attuale</span>
                  <span>{comparison.recommended.name}</span>
                </div>
                {comparison.scenarios.map((scenario) => (
                  <div key={scenario.label}>
                    <span>{scenario.label}</span>
                    <strong>
                      {scenario.current === null
                        ? "Non noto"
                        : money(scenario.current)}
                    </strong>
                    <strong>{money(scenario.alternative)}</strong>
                  </div>
                ))}
              </div>
              <p className="fine-print">
                Importi annuali sintetici. Non sono previsioni ufficiali,
                intervalli di confidenza o dati aggiornati. I dettagli del
                metodo reale saranno definiti prima del rilascio.
              </p>
            </div>
          )}
          {panel === "supplier" && (
            <div className="supplier-preview">
              <ExternalLink size={32} strokeWidth={1.5} />
              <p>
                Hai esplorato il percorso fino all’ultimo passaggio. Nel
                prodotto, il pulsante aprirà il sito del fornitore dell’offerta
                scelta.
              </p>
              <strong>
                Qui non viene inviata nessuna richiesta e non si attiva alcun
                contratto.
              </strong>
              <button
                type="button"
                className="solid-button"
                onClick={() => setPanel("offer")}
              >
                Torna alla scheda
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
