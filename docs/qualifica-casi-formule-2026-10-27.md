# Qualifica dei casi economici ambigui negli open data

Approfondimento del 27 ottobre 2026 dell'[audit formule](./audit-formule-offerte-2026-10-27.md). Fonti ammesse: esclusivamente open data del Portale Offerte e tracciati/metodi ufficiali, secondo Q28. Non sono stati consultati siti o documenti dei fornitori.

Il risultato separa tre questioni: quale formula prescrive il metodo ufficiale, se il record consente di applicarla a uno specifico profilo, e se il record rispetta tutte le regole di trasmissione. Un'anomalia di trasmissione non equivale sempre a un calcolo matematicamente indeterminato; una formula supportata non rende univoco qualsiasi record ricevuto.

## Fonti e verifica

- [XML luce ML, 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml), SHA-256 `7c01ff47e716f5de6743d27f5489d0fd6e84fea4dc03f73148e38b8fc09b4c7a`.
- [XML gas ML, 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml), SHA-256 `1c8c944a6911980c9946ea58e0fdd1b60cbeb795634e07e73f324eb75ae558df`.
- [AU, Trasmissione Offerte Mercato Retail v5.0](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true): pagine 22, 26–29, 59–63 e appendice 68–70.
- [AU, Regole di calcolo della spesa annua v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf): pagine 22–26, 29–30, 37–39 e 41–42. Il documento rimane collegato alla [pagina ufficiale di calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/calcolo-bolletta-gas-luce-formula-energia-stima-consumi.page), verificata in questa sessione.

I casi sono stati riletti integralmente negli XML, con i filtri dell'audit: domestici, singoli, cambio fornitore. Le conclusioni distinguono l'interpretazione dei documenti dal comportamento osservato nell'interfaccia pubblica. Per una delle miste è stata eseguita anche una verifica del Portale, descritta sotto; non è una prova di tutte le offerte né dell'algoritmo interno.

## 1. Nove offerte fisse che contengono anche un indice

**Questione risolta per la selezione della formula:** `TIPO_OFFERTA=01` seleziona il ramo fisso. Non sommare automaticamente un PUN/PSV solo perché il record contiene `RiferimentiPrezzoEnergia`.

La specifica v5.0, p.22, non consente `IDX_PREZZO_ENERGIA` sulle offerte fisse. Il calcolo fisso v4.2, pp.22–23 e 37–38, usa i prezzi delle componenti impresa e le componenti regolate pertinenti: non contiene il termine dell'indice delle offerte variabili. Il campo è dunque un'incoerenza rispetto alle regole di trasmissione; non crea di per sé una dipendenza da una previsione nel ramo fisso. È una deduzione diretta dai due documenti, non una prova di come il server attuale gestisca record incoerenti.

| Codice | Nome | Dati commerciali del ramo fisso |
| --- | --- | --- |
| `014629ESVML01XXGDUAUDFIX2610CIEE` | DUAL EE FIX INFODRIVE | 228 €/anno + 0,2772 €/kWh |
| `014629ESVML01XXGSEEUDFIX2610CAEE` | FIX EE ASSISTENZA | 228 €/anno + 0,2772 €/kWh |
| `014629ESVML01XXGSEEUDFIX2610CIEE` | FIX EE INFODRIVE | 228 €/anno + 0,2772 €/kWh |
| `014629ESVML01XXGSEEUDFIX2610SAEE` | FIX EE | 228 €/anno + 0,2772 €/kWh |
| `014629ESVML01XXGDUAUDFIX2610SAEE` | DUAL EE FIX | 228 €/anno + 0,2772 €/kWh |
| `000555ESFFL01XXENERGIASICUR1026B` | Energi@Sicura | 108 €/anno + 0,1635 €/kWh in tutte le tre fasce |
| `022188ESFML01XX0000OEPROCASA0726` | Protecta Casa | 216 €/anno + 0,189 €/kWh; vedere nota sotto |
| `001686GSFML00XXSC1026DO000000000` | +SICURA_GAS | 144 €/anno + 0,98 €/Smc |
| `001686GSFML00XXGFC1026DO00000000` | GAS FIX CASA | 102 €/anno + 0,87 €/Smc |

I nomi contenenti “DUAL” non sono stati usati come filtro: questi record dichiarano `OFFERTA_SINGOLA=SI`. Le componenti indicate non sono la bolletta totale; rimangono dispacciamento dove previsto, rete, oneri, imposte, sconti applicabili e ammissibilità al profilo.

**Protecta Casa, precisazione:** entrambe le componenti sono marcate `TIPOLOGIA=02`, nelle macroaree `01` e `04`. La regola v5.0 p.26 che subordina l'applicazione di una componente opzionale al filtro “Energia Verde” riguarda esplicitamente la macroarea `06` FER. Non costituisce una regola generale per azzerare tutte le componenti `02` di qualunque macroarea. Le equazioni v4.2 di energia/commercializzazione usano le componenti `04` e `01`; la lettura documentale produce `216 + 0,189 × C`, senza indice. A 2.700 kWh il subtotal è 726,30 €, prima delle altre voci. L'etichetta opzionale fuori FER resta da conservare come anomalia da verificare rispetto al comportamento ufficiale; non autorizza a presentare energia o commercializzazione gratuite.

**Conseguenza operativa:** non classificare come mista un'offerta per la sola presenza di un indice, non richiedere un forward superfluo per il calcolo fisso e non cancellare il campo originale. La verifica della conformità al tracciato resta separata dalla scelta dell'algoritmo. Nessuna decisione automatica di esclusione delle nove offerte è giustificata dalla sola presenza del campo.

## 2. Sei offerte miste con due prezzi applicabili allo stesso intervallo

Record interessati, tutti “Senza Pensieri” domestici:

| Codice | Quota annuale | Prezzo indicato nei due intervalli |
| --- | ---: | ---: |
| `029886GSVML01XXSENZAPENSIDOMGAS3` | 144 € | 0,08 €/Smc |
| `029886GSVML01XXSENZAPENSIDOMGAM3` | 192 € | 0,10 €/Smc |
| `029886GSVML01XXSENZAPENSIDOMGAL3` | 240 € | 0,12 €/Smc |
| `029337GSVML01XXSENZAPENSIDOMGAS3` | 144 € | 0,08 €/Smc |
| `029337GSVML01XXSENZAPENSIDOMGAM3` | 192 € | 0,10 €/Smc |
| `029337GSVML01XXSENZAPENSIDOMGAL3` | 240 € | 0,12 €/Smc |

Per ciascun record la stessa componente macroarea `04` contiene due `IntervalloPrezzi` privi di scaglione e periodo. Uno ha `TIPO_PREZZO=01`, l'altro `02`. Il riferimento è PSV mensile, codice `14`; nessun coefficiente o altro campo definisce una ripartizione dei consumi.

Le regole v4.2 p.38 prescrivono di applicare il ramo fisso o variabile **alternativamente** secondo tipo prezzo, scaglione e periodo. Le specifiche v5.0 pp.27 e 59 definiscono il significato di `TIPO_PREZZO`; non introducono una ripartizione 50/50, una precedenza dell'ordine XML o la somma dei due rami quando gli intervalli coincidono.

**Esito:** la famiglia mista è descritta ufficialmente e può essere supportata. Questi sei record non determinano univocamente quale ramo applicare ai medesimi consumi. Non è giustificato scegliere il più basso, prendere la prima riga, sommare entrambe, o dividere i consumi a metà. La coincidenza dei valori numerici non elimina l'ambiguità: nel ramo variabile si aggiunge anche l'indice.

Una risoluzione richiede un record ufficiale che distingua gli intervalli oppure una regola ufficiale che ne definisca la precedenza. Una verifica del risultato pubblico del Portale può descrivere il comportamento osservato su un profilo, ma da sola non dimostra una regola universale né rende corretta una ripartizione inventata. Le condizioni pubblicate sui siti dei fornitori non sono fonti ammesse e non costituiscono una dipendenza del progetto.

### Verifica osservata sul Portale pubblico

Il 27 ottobre il coordinatore ha completato una ricerca pubblica sul Portale per `029886GSVML01XXSENZAPENSIDOMGAS3`: Milano, cliente domestico non vulnerabile, contatore inferiore a G6, 1.400 Smc/anno, offerta mista. Il [dettaglio ufficiale](https://www.ilportaleofferte.it/portaleOfferte/it/dettaglio_offerta_ml.page), dipendente dalla sessione di confronto, mostra **2.628,61 €/anno**. Nel dettaglio prezzi sono visibili quota annuale 144 € e una riga “Spread Gas” da 0,080000 €/Smc, qualificata dall'interfaccia come componente variabile; la seconda riga fissa coincidente dell'XML non compare separatamente.

Questo prova che **il Portale produce un risultato per quel caso**. Profilo, percorso e valori osservati sono conservati nell'[evidenza UI](./evidenze/formule-2026-10-27/portale-ui-cases.json). Non è corretto affermare che l'offerta sia non calcolabile dal Portale. Il limite riguarda la riproduzione univoca del suo trattamento a partire dall'export e dal testo delle regole. Non si deduce un criterio universale “prima riga”, “ultima riga”, “solo variabile” o “somma” dal solo dettaglio mostrato. Anche i valori e le etichette fiscali osservati richiedono riconciliazione prima di usarli come risultato atteso del nostro motore; non sono stati reinterpretati silenziosamente.

## 3. Tre offerte gas con scaglioni sovrapposti: il problema dipende anche dal consumo

Codici:

- `000670GSVML56XXXGMCONVENZIONECOR` — CONVENZIONE CORPORATE GAS;
- `000670GSVML56XXGASPREZZONETTOAMI` — PREZZO NETTO ZERO AMICO GAS;
- `000670GSVML56XXXXXGMPREZZONETTO0` — PREZZO NETTO ZERO GAS.

La componente spread contiene per tutti lo stesso schema:

| Intervallo | Prezzo €/Smc |
| --- | ---: |
| Default, senza limiti | 0 |
| 0–500 | 0 |
| 0–1.000 | 0 |
| 501–1.000 | 0,05 |
| Da 1.001 | 0,10 |

La specifica v5.0 pp.62–63 definisce un'applicazione progressiva: ciascun prezzo si applica alla parte di consumo nel proprio scaglione. Le regole v4.2 p.39 e v5.0 pp.28–29 riservano il default alle porzioni di consumo/tempo **non coperte** dagli intervalli specifici. Il default non risolve un conflitto fra due intervalli entrambi specifici.

Nell'appendice v5.0 il codice 550 di p.68 vieta sovrapposizioni per fascia **elettrica**; non va citato come divieto esplicito gas che quel testo non contiene. Nessuna delle regole consultate fornisce per questi record gas una precedenza del tipo “vince lo scaglione più stretto”.

**Esito per profilo:** fino a 500 Smc i due intervalli applicabili indicano entrambi zero: il contributo dello spread sulla parte effettivamente consumata è univoco. Non si sommano due prezzi per lo stesso consumo solo perché due righe lo coprono. Per consumi superiori a 500 Smc, nella porzione 501–1.000 possono applicarsi zero oppure 0,05: resta un'ambiguità effettiva.

A 1.400 Smc, le due interpretazioni danno rispettivamente **40 € oppure 65 €** per la componente spread, prima delle altre voci e delle imposte. La differenza è 25 €. Questi due importi illustrano il conflitto, non sono due scenari commerciali da offrire all'utente né limiti ufficiali di prezzo. Il record non consente di selezionarne uno con le regole pubblicate.

**Conseguenza:** la calcolabilità va valutata anche rispetto al profilo. Un problema in uno scaglione non raggiunto può non alterare il calcolo, pur restando una difformità da conservare; una sovrapposizione con prezzi diversi nei consumi effettivi impedisce un unico risultato documentato. Restano da applicare gli altri requisiti del profilo, per esempio la convenzione aziendale dove richiesta.

## 4. Sconto “dal settimo mese” con campo DURATA=7

Nel perimetro domestico il record è `000535GSVML06XXCNPLUSGADOM202604`, “CON NOI PLUS DOMESTICI”. Lo sconto materia prima dichiara:

- `VALIDITA=02`, condizione `00`, IVA `01`;
- `TIPOLOGIA=03`, `UNITA_MISURA=04`, prezzo 0,03 €/Smc;
- `PeriodoValidita/DURATA=7`;
- descrizione testuale: applicazione a partire dal settimo mese.

**Questione risolta per il calcolo strutturato:** `DURATA=7` significa i **primi sette mesi** dall'attivazione. Lo precisano v5.0 p.61, con l'esempio dei primi tre mesi, e v4.2 p.42. Il campo non significa “dal mese sette” e non definisce un periodo di attesa.

La formula documentale è `0,03 × somma dei consumi nei primi sette mesi`. Per il periodo di stima concordato che inizia a novembre, si tratta dei consumi di novembre–maggio. Nel gas non si può assumere automaticamente `consumo annuo × 7/12`: serve il profilo mensile pertinente. Gli altri sconti del record vanno trattati secondo i rispettivi campi; i condizionati non si sottraggono indiscriminatamente.

La contraddizione con la descrizione resta visibile come evidenza originaria. Non si corregge il campo da una nota libera e non si cercano condizioni alternative fuori dal Portale. Questo chiarisce la riproduzione del **metodo pubblicato sui campi strutturati**; non certifica quale descrizione sia contrattualmente corretta.

## Esito dell'approfondimento

| Questione iniziale | Esito documentale |
| --- | --- |
| Fissa con indice presente | Ramo fisso; l'indice non viene aggiunto. Conservare incoerenza del tracciato. |
| Componenti opzionali fuori FER | Non generalizzare la regola del filtro verde. Usare le equazioni pertinenti e conservare l'anomalia; una stima con componenti azzerate non è giustificata. |
| Sei miste con intervalli coincidenti | Famiglia supportabile; i sei record restano non univoci con la documentazione disponibile. |
| Tre sovrapposizioni gas | Parte prezzo univoca fino a 500 Smc; ambiguità economica per consumi che attraversano 501–1.000. |
| DURATA=7 contro descrizione | Calcolo sui primi sette mesi; divergenza testuale conservata. |

Non serve rinviare l'intera famiglia delle miste o degli scaglioni. Serve distinguere le regole che il motore deve saper eseguire dai record che non determinano un prezzo unico per il profilo, e non trasformare ogni segnalazione di qualità in un'esclusione automatica.

## Verifica successiva richiesta dall'utente: entrambe simulate

Il 27 ottobre, su richiesta esplicita dell'utente, un subagent GPT-6.1 Terra ha effettuato nuove simulazioni sul Portale. Con lo stesso profilo a Pescara (domestico non vulnerabile, 1.400 Smc annui, cottura/acqua calda/riscaldamento, portata < G6), il Portale mostra:

| Offerta | Vendita gas | Totale annuo stimato |
| --- | ---: | ---: |
| PREZZO NETTO ZERO GAS, `000670GSVML56XXXXXGMPREZZONETTO0` | 1.314,19 € | 2.381,31 € |
| Senza Pensieri S Domestico, `029886GSVML01XXSENZAPENSIDOMGAS3` | 1.421,91 € | 2.655,99 € |

Entrambe sono dunque effettivamente simulate dal Portale per questo profilo. Il rifiuto iniziale di PREZZO NETTO ZERO a Milano è coerente con la restrizione territoriale dell'XML e non è un problema di calcolabilità. Le righe di prezzo visibili e la differenza di 107,72 € nella vendita non bastano a identificare la regola applicata ai record; le etichette fiscali di Senza Pensieri richiedono inoltre riconciliazione. Il successivo approfondimento, richiesto dall'utente, ha completato 500/1.000 Smc per entrambe, aggiunto 1.200/2.000 per entrambe e 1.001 per PREZZO NETTO. Nessun motore di produzione è stato implementato.

Questa verifica non giustifica eccezioni al requisito Q32: la nostra interpretazione delle regole deve essere completata, senza dichiarare impossibile il calcolo o approvare esclusioni. [Resoconto, profili ed evidenze UI](./simulazioni-due-offerte-2026-10-27.md).

La vendita di Senza Pensieri sui cinque consumi osservati è riproducibile con quota annuale 144 €, un solo spread di 0,08 €/Smc e una componente indice media implicita coerente. Non è dimostrata una regola generale di precedenza per tutte le miste. Per PREZZO NETTO la progressività annuale semplice e due ipotesi di assegnazione mensile/soglia non spiegano tutti i campioni; i residui non sono attribuibili con certezza al solo spread. Per Senza Pensieri a 1.000 Smc l'HTML restituito dal server conferma IVA esposta 516,44 € su una base netta più imposte di 1.565,82 €: anche il 22% sull'intera base darebbe soltanto 344,48 €. La causa resta ignota e non va riprodotta come regola fiscale verificata. La ricostruzione completa è pertanto ancora aperta, con ostacoli circoscritti e riproducibili.
