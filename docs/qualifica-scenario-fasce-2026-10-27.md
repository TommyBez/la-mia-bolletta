# Qualifica delle fasce elettriche per lo scenario previsionale

**Stato aggiornato al 28 ottobre 2026:** dopo il riesame delle alternative e il chiarimento sul metodo del Portale, l'utente ha accettato per la prima versione il nostro scenario: struttura relativa storica mensile normalizzata al baseload GME selezionato secondo Q39. È una scelta progettuale iniziale, non una superiorità dimostrata sulle [alternative](./alternative-scenario-fasce-2026-10-27.md) né una replica della curva AU. La normalizzazione verifica coerenza, non accuratezza previsionale. Restano le verifiche tecniche e del canale indicate sotto.

Ricerca tecnica del 27 ottobre 2026, solo pubblicazioni GME e ARERA. Q39 ha approvato il contratto trimestrale GME quando disponibile e il mensile per i mesi altrimenti scoperti; la sua regola resta valida per la curva baseload. Questo documento propone come ricavare F1/F2/F3; il metodo proposto **non è ancora approvato**.

## Risultato utile per chiudere la specifica

È stata identificata e letta una **fonte ufficiale gratuita di prezzi storici mensili F1/F2/F3**, distinta dal CSV aggregato del Portale: [GME, Prezzo medio per fasce](https://gme.mercatoelettrico.org/it-it/Home/Pubblicazioni/PrezzoMedioFasce). La [FAQ ufficiale GME](https://gme.mercatoelettrico.org/it-it/Home/Orientarsi) indica espressamente questo percorso per i prezzi medi per fascia.

La pagina pubblica nove PDF per gennaio–settembre 2026; il selettore anno permette di ottenere [i dodici PDF del 2025](https://gme.mercatoelettrico.org/it-it/Home/Pubblicazioni/PrezzoMedioFasce/moduleId/4845/controller/StatRapportiME/action/Index?val=Settimanale&anno=2025&mese=1). Quindi i collegamenti ufficiali coprono i dodici mesi completi più recenti, ottobre 2025–settembre 2026. Sono stati aperti/estratti tre allegati, non tutti i ventuno.

| Mese storico, PDF ufficiale | F1: ore / €/MWh | F2: ore / €/MWh | F3: ore / €/MWh |
| --- | --- | --- | --- |
| [Novembre 2025](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT/20251203PrezzomedioperfasceNovembre2025.pdf) | 220 / 129,59 | 164 / 124,02 | 336 / 105,51 |
| [Dicembre 2025](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT/20260105PrezzomedioperfasceDicembre2025.pdf) | 220 / 130,09 | 164 / 119,98 | 360 / 104,52 |
| [Settembre 2026](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT/20260930PrezzomedioperfasceSettembre2026.pdf) | 242 / 206,35 | 174 / 227,58 | 304 / 197,02 |

I documenti sono di una pagina, espongono sia le ore sia il prezzo delle tre fasce e richiamano la delibera ARERA 181/2006. Sono **consuntivi**, non previsioni né prezzi AU per il confronto. La disponibilità HTTP del documento non certifica una licenza aperta per raccolta sistematica o riuso pubblico: resta la qualifica GME del canale già individuata.

## I forward per fascia non sono stati trovati

La [DTF 01 rev. 06 MTE](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101DTF01rev6MTE.pdf), pp. 2–3, elenca mensili, trimestrali e annuali **Baseload e Peakload**. Non elenca contratti forward F1/F2/F3. La [pagina Peakload](https://www.mercatoelettrico.org/it-it/Home/Esiti/Elettricita/MTE/Esiti/Peakload) e il suo widget sono stati esaminati; una richiesta diretta senza contesto al relativo endpoint del widget ha restituito 401. Non è stato tentato un aggiramento, non sono stati letti nuovi valori Peakload e non sono state accettate condizioni o creati account.

Anche disponendo di Baseload e Peakload, due quotazioni non identificano univocamente tre fasce ARERA: servono ulteriori ipotesi sulla forma dei prezzi. In particolare non è lecito chiamare Peakload “F1” senza confrontare esattamente gli insiemi temporali dei prodotti. La ricerca non prova l'assenza assoluta di altri forward gratuiti per fascia; stabilisce il limite dei canali ufficiali esaminati.

## Proposta tecnica da sottoporre all'utente

Usare una **forma stagionale storica ufficiale, normalizzata sulla curva baseload GME**:

1. Congelare i dodici mesi consuntivi completi più recenti disponibili alla data dello scenario. Per ogni mese futuro prendere il mese con lo stesso numero nel campione storico. Al 27 ottobre 2026, novembre usa novembre 2025, gennaio usa gennaio 2026, ottobre usa ottobre 2025. Nessun uso di un consuntivo non ancora pubblicato.
2. Indicare con `H_f` il prezzo storico della fascia e con `h_f` il numero di ore **future** della fascia, secondo calendario ARERA applicabile e fuso Europe/Rome. Festività nazionali e cambio ora vanno versionati e verificati; i pesi non sono quelli dei consumi personali.
3. Calcolare `normalizzatore = somma(h_f × H_f) / somma(h_f)` e quindi `scenario_f = baseload_del_mese × H_f / normalizzatore`.
4. In questo modo la media delle tre fasce, ponderata per le ore future, coincide con il baseload adottato secondo Q39. La struttura relativa delle fasce deriva dalla fonte storica, non è una previsione ufficiale del differenziale futuro.
5. Per una fascia aggregata F23, derivare il valore con le ore future F2/F3: `(h2 × scenario2 + h3 × scenario3)/(h2+h3)`. I consumi personali intervengono soltanto dopo, nella stima dell'offerta; non cambiano la curva di mercato.
6. Preservare unità €/MWh e conversione a €/kWh separata. Non applicare qui perdite di rete: il motore tariffario le applica secondo la formula dell'offerta/metodo.

La definizione delle fasce è pubblicata nel [glossario ARERA](https://www.arera.it/en/bolletta/glossario-dei-termini/dettaglio/fasce-orarie): F1 feriali 8–19; F2 feriali 7–8 e 19–23 e sabati 7–23, esclusi i festivi; F3 restante tempo e domeniche/festivi. Per il calendario implementato usare la versione pertinente della Tabella 6 TIV e le variazioni applicabili nell'orizzonte: non proiettare automaticamente un vecchio elenco festivi al 2027.

### Esempio numerico, non quotazione ufficiale delle fasce future

Novembre 2026: baseload GME già acquisito 219,44 €/MWh; prezzi di forma da novembre 2025; ore future calcolate F1 231, F2 169, F3 320 (720 totali). Il normalizzatore è 117,580375 €/MWh. Risultano:

- F1: 241,853537… €/MWh;
- F2: 231,458258… €/MWh;
- F3: 196,913085… €/MWh.

La media ponderata sulle 720 ore ritorna 219,44 €/MWh. I valori dimostrano l'invariante algebrica della proposta, non la sua accuratezza previsiva né la parità con le curve AU.

## Cosa è ora pronto e cosa resta da verificare

La dipendenza “esistono serie ufficiali storiche per fascia?” è risolta con una fonte concreta e documenti recuperati. È quindi possibile approvare un metodo deterministico di derivazione e descriverne gli adapter/test nei ticket.

Il metodo di scenario proprio è accettato per la prima versione. Prima dell'integrazione finale occorre: verificare il parsing dell'intero campione di dodici PDF e gli aggiornamenti/correzioni; qualificare il canale di acquisizione e riuso GME; implementare il calendario versionato con festività e DST; controllare mesi/prezzi mancanti, normalizzatore nullo o dati non utilizzabili senza costruire fasce inventate; effettuare backtest separati dalla verifica algebrica e dichiarare le assunzioni nella UX e MCP. Non va esclusa un'offerta a fasce per evitare questa dipendenza.

## Evidenze locali della ricerca

Copie persistite nel repository: [manifest e campioni](./evidenze/scenario-fasce-2026-10-27/qualification.json), i tre PDF nella stessa cartella e [controllo indipendente della normalizzazione](./evidenze/scenario-fasce-2026-10-27/normalization-check.json). Il controllo usa aritmetica decimale e verifica la media pesata; non misura accuratezza previsionale.

`/tmp/lmb-official-bands-qualification.json` contiene i 21 URL esposti dagli indici annuali, i tre campioni estratti con SHA-256 e l'esempio calcolato. I PDF campione sono `/tmp/lmb-gme-fasce-202511.pdf`, `/tmp/lmb-gme-fasce-202512.pdf`, `/tmp/lmb-gme-fasce-202609.pdf`. Gli indici HTML e il JavaScript del widget sono stati letti come evidenze tecniche; non sono credenziali, sessioni applicative o codice del motore di stima del Portale Offerte.
