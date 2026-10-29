# Verifica dei dati pubblici aggiuntivi per i canoni

27 ottobre 2026. Verifica circoscritta alle superfici pubbliche del Portale Offerte. Nessun sito, PDF o endpoint dei fornitori consultato; nessun accesso autenticato. Questa nota risponde alla domanda se oltre alle descrizioni già lette vi siano prezzi strutturati, campi nascosti o un secondo dettaglio ufficiale da acquisire.

## Esito

**Nelle pagine e risorse pubbliche osservate non è emerso un secondo livello di dati economici per i tredici casi selezionati.** Il pulsante “Vai al dettaglio” apre una modale già contenuta nell'HTML: il dettaglio non scarica ulteriori prezzi. I suoi contenuti completi sono quelli salvati nel [JSON delle descrizioni](./evidenze/canone-2026-10-27/selected-portal-descriptions.json).

Questa è una verifica delle superfici elencate sotto, non una prova dell'inesistenza di ogni possibile API interna. Non significa che Acquirente Unico non possieda dati aggiuntivi ricevuti dal venditore. Significa che non sono esposti nei dettagli, nei campi della pagina e nei download ufficialmente collegati che abbiamo esaminato. L'assenza del codice offerta è un limite di identità e collegamento fra fonti; da sola non rende impossibile un'operazione aritmetica con i numeri del testo.

## Superfici controllate

| Superficie ufficiale | Verifica e risultato |
| --- | --- |
| [Pagina luce senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) | Nuovo GET il 27 ottobre: 1.058 modali complete. I testi degli otto casi luce selezionati coincidono con la precedente acquisizione. |
| [Pagina gas senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS) | Nuovo GET: 249 modali complete. I cinque casi gas selezionati sono invariati. |
| Dettagli di tutte le 1.307 schede | Elementi di testo, titoli, contenitori, etichette sconto/servizi e pulsanti di chiusura; nessun `input`, tabella, link di download o script nelle modali. Nessun blocco JSON o JSON-LD nelle pagine. |
| Campi e attributi della pagina | Nessun campo nominato prezzo/canone/consumo/potenza/durata/IVA/codice offerta. I campi nascosti sono commodity, venditori, ordinamento e attivazione del filtro. Gli ID `modal-14146` ecc. sono identificativi locali della pagina. |
| Scorrimento infinito | Lo script inline nasconde inizialmente le schede oltre la decima e poi le rende visibili. Non acquisisce ulteriori pagine o un JSON di prezzi. Le 1.307 modali sono già nei due documenti scaricati. |
| [filtriAvanzati.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/filtriAvanzati.js), righe 407–429 | `ricercaAvanzataNotSII()` invia il form della medesima pagina; i parametri disponibili sono nome, commodity, venditori, presenza sconti/servizi e ordinamento. Non sono presenti campi per consumo, potenza, residenza o stima economica di un profilo. |
| [confrontaOfferte.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/confrontaOfferte.js), righe 856–945 | Il servizio `offertaConfrontoService.json` verificato nel codice è richiamato dal percorso ordinario per controllare un codice offerta di 32 caratteri, con comune, cliente e commodity. Non è un endpoint scoperto per estrarre canoni tramite gli ID delle modali. Nessuna chiamata con codici inventati è stata eseguita. |
| [mainCommon.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/mainCommon.js) | I servizi osservati riguardano questionario, venditori disponibili e geografia; non un dettaglio economico delle modali senza calcolo. |
| [Open Data](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page) | Riletti tutti i collegamenti di download: dieci file, ossia indici storici, offerte/parametri PLACET E/G, offerte/parametri ML E/G e offerte ML dual. Nessun download specifico delle non simulabili è collegato nella pagina osservata. |
| [Ricerca interna per Fastweb Luce Flat Light](https://www.ilportaleofferte.it/portaleOfferte/it/cerca-nel-sito.page?search=Fastweb%20Luce%20Flat%20Light) | Restituisce “Nessun risultato trovato”. È un riscontro aggiuntivo, non una prova di assenza: non è dimostrato che la ricerca CMS indicizzi il catalogo delle offerte. |

I JavaScript sono stati scaricati esclusivamente dagli URL presenti nell'HTML ufficiale. Non sono stati ipotizzati endpoint a partire dai loro nomi e non sono stati seguiti i collegamenti dei venditori.

## Cosa è davvero esposto nei casi selezionati

| Gruppo | Informazioni economiche esposte | Informazioni ulteriori non esposte dalle superfici controllate |
| --- | --- | --- |
| Fastweb Luce Flat Start, Light, Pro, Ultra | Nel testo: canone annuo espresso “a partire da”, consumo di riferimento, corrispettivo del conguaglio anche per consumi inferiori, sconto telecom condizionato, dichiarazione di imposte incluse nel canone. | Nessuna regola aggiuntiva che renda il canone una funzione del profilo; nessuna ulteriore precisazione del trattamento fiscale del prezzo unitario di conguaglio; nessun campo economico strutturato o durata contrattuale delle condizioni. Le date della scheda sono di sottoscrizione, non la durata economica. |
| Fastweb Luce Flat Partner Light | Riferimento a 1.500 kWh/anno e descrizione generica di offerta a canone. | Importo del canone, prezzo/formula del conguaglio, trattamento fiscale e condizioni di sconto non sono specificati nella descrizione, né forniti altrove nel dettaglio. |
| Tre CASA MIA NO STRESS 800/1.500/2.500 | Il testo indica rata costante e taglia; etichetta Energia Verde. | Nessun importo della rata, tariffa sottostante o formula del costo effettivo; non si può inventare un canone onnicomprensivo a partire dalla parola “rata”. |
| Cinque Fastweb Gas Flat | Canoni annui numericamente definiti, soglie, prezzi del conguaglio anche per consumi inferiori, sconto di 10 €/mese IVA inclusa finché resta attiva la luce, requisito di fornitura luce e dichiarazione di imposte incluse nel canone. | Nessuna specificazione aggiuntiva del trattamento fiscale del conguaglio, nessuna scomposizione nei campi del metodo strutturato, nessun campo durata delle condizioni. Qui il canone **non** è descritto “a partire da”: non trasferire al gas un dubbio testuale proprio delle schede luce. |

Il testo Fastweb sulla scelta della fascia in funzione di potenza/consumo/uso non dimostra da solo prezzi diversi per lo stesso prodotto, né la ragione della sua non simulabilità nel Portale. È confermata l'assenza, nelle superfici controllate, di una regola supplementare che risolva quella formulazione; non è dimostrata l'esistenza di una matrice di prezzi non pubblicata.

Questa nota riguarda la disponibilità dei dati. La possibilità di usare una formula ricavata dal testo, la corrispondenza con il metodo ufficiale al netto delle imposte e il trattamento dello sconto condizionato richiedono una valutazione distinta. La mancanza di campi strutturati non rende automaticamente inutilizzabile un numero testuale; viceversa la presenza di canone, soglia e conguaglio non certifica da sola l'equivalenza con la stima ufficiale. In particolare, l'assenza di una precisazione fiscale esplicita **non è da sola un blocco di calcolo**: l'[approfondimento del metodo](./verifica-metodo-canoni-2026-10-27.md) qualifica l'eventuale applicazione della convenzione ufficiale dei prezzi unitari al netto delle imposte. Non va mantenuta un'ambiguità che una regola generale ufficiale risolve.

## Riferimenti fiscali gas: verifica completata nel comparatore pubblico

La ricerca delle sole tabelle di download non era sufficiente. Il Portale espone i valori fiscali nel **dettaglio di una normale offerta**, alla voce Imposte → Corrispettivi unitari. Sono stati completati tre confronti pubblici con profilo sintetico: Milano, ISTAT `015146`, domestico non vulnerabile, cottura cibi e acqua calda sanitaria, contatore mostrato nel dettaglio come `Portata < G6`. L'offerta usata come veicolo per leggere il dettaglio è `034958GSFML01XXAPIUGASICURO24CAS`, APIU' GAS SICURO 24 CASA. Nessun collegamento del fornitore è stato aperto.

Il [dettaglio ufficiale](https://www.ilportaleofferte.it/portaleOfferte/it/dettaglio_offerta_ml.page), dipendente dalla sessione di ricerca, contiene la tabella `#corr_unitari_imposte_gas`. Il caso da 1.600 Smc mostra tutti gli scaglioni domestici:

| Scaglione | Accisa, €/Smc | Addizionale regionale, €/Smc |
| --- | ---: | ---: |
| 0–120 Smc | 0,044000 | 0,000000 |
| 121–480 Smc | 0,175000 | 0,000000 |
| 481–1.560 Smc | 0,170000 | 0,000000 |
| Oltre 1.560 Smc | 0,186000 | 0,000000 |

Gli importi aggregati sono stati letti direttamente per ciascun consumo, poi ricontrollati con gli scaglioni pubblicati; non sono stati ricavati interpolando risultati:

| Consumo | Accisa + addizionale mostrate | IVA 10% mostrata | IVA 22% mostrata |
| --- | ---: | ---: | ---: |
| 300 Smc | 36,78 € | 35,38 € | 10,47 € |
| 350 Smc | 45,53 € | 41,79 € | 10,47 € |
| 1.600 Smc | 259,32 € | 58,48 € | 318,87 € |

Questa tabella IVA descrive l'offerta ordinaria campione, **non** i canoni Fastweb. Il dettaglio mostra le intestazioni IVA 5%, 10%, 22%, ma non espone una tabella delle basi imponibili distinta tra quota fissa e quota energia. Il 22% non nullo sotto 480 Smc dimostra che non basta assegnare il 10% all'intero costo in base al solo consumo. Il trattamento del canone e l'eventuale cancellazione algebrica di termini invariati sono qualificati nell'[analisi del metodo](./verifica-metodo-canoni-2026-10-27.md).

Altre superfici fiscali controllate:

- I CSV correnti [ML gas](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_G_20261027.csv) e [PLACET gas](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametri/2026_10/PO_Parametri_G_20261027.csv) contengono entrambi 96 righe, comprese IVA 10% per F1/F2 e 22% per F3/F4, ma non le righe `ACCFn`, `ACCFnCMZ` o addizionali regionali.
- Il [servizio geografico pubblico con query Milano](https://www.ilportaleofferte.it/portaleOfferte/api/rs/it/portal/geoService.json?cap-comune=Milano), derivato dal JavaScript ufficiale, restituisce ISTAT, denominazione e due flag di esclusione della fornitura; non restituisce aliquote fiscali.
- FAQ e pagina Calcolo della Spesa non hanno esposto una tabella aggiuntiva. La ricerca interna per “accisa” rimanda a un vecchio documento di calcolo v2.0: non è stato usato per attribuire efficacia corrente a parametri storici.

**Conclusione aggiornata:** accise e addizionali sono recuperabili dal Portale per il profilo verificato; non sono un dato definitivamente assente. Sono una fonte pubblica aggiuntiva da acquisire attraverso il dettaglio di una simulazione. Questa verifica dimostra l'acquisibilità puntuale e fornisce tutti gli scaglioni di Milano. Non attesta un export fiscale nazionale completo, una raccolta già implementata o la validità di queste aliquote per altri comuni.

Le [prove UI pulite](./evidenze/canone-2026-10-27/public-discovery/gas-tax-ui-cases.json) conservano profilo, codice, righe DOM e importi di tutti e tre i casi, senza cookie o identificativi di sessione. I [riferimenti fiscali](./evidenze/canone-2026-10-27/public-discovery/gas-tax-references.json) conservano checksum dei CSV, risposta geografica e hash dell'evidenza UI. Sono stati verificati esattamente `120 × 0,044 + 180 × 0,175 = 36,78`, `120 × 0,044 + 230 × 0,175 = 45,53` e `120 × 0,044 + 360 × 0,175 + 1.080 × 0,170 + 40 × 0,186 = 259,32`.

## Prove ripetibili

[Script locale](./evidenze/canone-2026-10-27/public-discovery/inspect-public-pages.py) e [inventario JSON](./evidenze/canone-2026-10-27/public-discovery/inspection.json) conservano URL, checksum e dimensioni di due pagine, tre JS, pagina Open Data e ricerca interna; conteggi di tutte le modali; tutti gli attributi dei tredici casi; campi dei form; download ed endpoint osservati. Lo script non effettua richieste di rete.

Gli originali restano in `/tmp/lmb-canoni-*`, con i percorsi nel JSON. La riesecuzione dalla radice del repository è `python3 docs/evidenze/canone-2026-10-27/public-discovery/inspect-public-pages.py`. I testi delle tredici modali sono stati confrontati con gli HTML del primo audit: invariati. URL dinamici o nuovi byte in futuro non riproducono automaticamente questa verifica.
