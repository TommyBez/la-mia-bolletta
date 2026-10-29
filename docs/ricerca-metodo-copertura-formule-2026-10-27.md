# Come scegliere la copertura delle formule sulla base dei dati

Ricerca del 27 ottobre 2026. Supporta la decisione Q27 del [design del prodotto](./design-prodotto.md): una formula frequente **oppure** economicamente rilevante deve essere inclusa nella prima versione. Non definisce una soglia approvata e non costituisce un motore di calcolo implementato.

Q28 vincola questa ricerca agli open data del Portale e ai metodi/tracciati ufficiali. La consultazione dei fornitori avviata prima di questa precisazione è stata interrotta; i relativi documenti sono esclusi dalle fonti e dalle conclusioni. Nessun campo degli export viene integrato o corretto sulla loro base.

## Fonti primarie verificate

- [AU, Trasmissione Offerte Mercato Retail v5.0, 15 dicembre 2025](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true): scaricato integralmente, 70 pagine. SHA-256 `4a31f0f32c0324ae4883f99af0e37a382f631813f3740d00730e2767eabd2c46`.
- [AU, Regole per il calcolo della spesa annua v4.2, 5 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf): regole economiche, distinte dalle sole codifiche del tracciato.
- [Export mercato libero gas del 26 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261026.xml) e [luce dello stesso giorno](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261026.xml): file locali esaminati per gli esempi di questa nota. L'audit di frequenza principale può utilizzare una pubblicazione successiva, da indicare separatamente.

## Interpretazione dei campi

Le corrispondenze seguenti provengono dalle specifiche AU, non dal nome commerciale delle offerte.

| Campo | Significato rilevante per l'audit | Pagine AU v5.0 |
| --- | --- | --- |
| `TIPO_CLIENTE` | `01` domestico; `02` altri usi; `03` condominio domestico gas. Quest'ultimo non va aggregato automaticamente ai singoli utenti domestici. | 52 |
| `OFFERTA_SINGOLA` | `SI` sottoscrivibile singolarmente; `NO` solo insieme all'altra fornitura. | 52 |
| `TIPOLOGIA_ATT_CONTR` | `01` cambio fornitore; `99` sempre. Altri valori riguardano prima attivazione, riattivazione e voltura. | 53 |
| `TIPO_OFFERTA` | `01` fisso; `02` variabile; `03` FLAT; `04` mista. | 52 |
| `OFFERTA_ONNICOMPRENSIVA` | `01` onnicomprensiva; `02` onnicomprensiva a canone. È distinto dal precedente campo. | 52 |
| `IntervalloPrezzi/TIPO_PREZZO` | Per la formula mista, distingue prezzo fisso `01` e variabile `02` nel singolo intervallo. | 59 |
| `ComponenteImpresa/TIPOLOGIA` | `01` standard; `02` opzionale. Una componente opzionale non è automaticamente dovuta da tutti. | 58 |
| `MACROAREA` | `01` commercializzazione fissa; `02` commercializzazione sul consumo; `04` prezzo energia; `05` una tantum; `06` FER/energia verde. | 58 |
| `UNITA_MISURA` dei prezzi | `01` €/anno; `02` €/kW; `03` €/kWh; `04` €/Smc; `05` €. L'unità è parte della formula. | 59 |
| `PeriodoValidita` | Durata dall'attivazione, scadenza mese/anno oppure mesi solari. Non è la finestra di sottoscrivibilità dell'offerta. | 27, 59, 61 |
| `RiferimentiPrezzoEnergia` | Indice, eventuale coefficiente e fascia. Più riferimenti possono formare una combinazione lineare. La ripetizione per fasce non equivale a sommare tutti gli indici su tutti i consumi. | 28, 53–54 |
| `Sconto/Condizione` | `00` incondizionato; `01`, `02`, `03`, `99` indicano condizioni. AU esclude gli sconti condizionati dalla propria stima. | 61 |
| `Sconto/VALIDITA` | Ingresso `01`, entro dodici mesi `02`, oltre dodici mesi `03`; il campo può essere sostituito dalla validità temporale dettagliata. | 60–61 |
| `Sconto/IVA_SCONTO` | `01` sì; `02` no. Non confondere il codice numerico dell'XML con le parole usate nelle formule del documento di calcolo. | 61 |
| `Sconto/PrezziSconto/TIPOLOGIA` | `01` fisso; `02` potenza; `03` vendita; `04` sconto su tutela. | 61–62 |

Tre distinzioni evitano errori nella classificazione. Il tipo tecnico FLAT è descritto nel tracciato tramite una taglia di consumo; non è sinonimo di rata mensile costante e non è il canone onnicomprensivo. Le regole di calcolo v4.2 registrano però la sua eliminazione nel 2022: la descrizione del tracciato non qualifica da sola un algoritmo corrente. Il canone onnicomprensivo usa invece un consumo di riferimento e un conguaglio sulla differenza. La componente FER standard può rappresentare il prezzo dell'energia verde: non va sommata come supplemento a un prezzo base che si presume presente. [Specifiche AU v5.0, §§18–22, pp. 26–28](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true). La [verifica delle regole sui canoni](./approfondimento-canone-regole-2026-10-27.md) documenta questa incompatibilità e le formule effettivamente disponibili.

## Frequenza: contare le offerte realmente interessate

Il denominatore riproducibile è il numero di **codici offerta unici** nell'universo dichiarato, per fornitura e data. Il conteggio delle componenti o delle righe XML gonfierebbe le formule con più fasce. Affiancare il numero di venditori distinti evita di scambiare molte varianti dello stesso venditore per ampia diffusione.

Tenere separati tre insiemi: domestiche presenti nell'export; domestiche sottoscrivibili singolarmente per cambio fornitore alla data analizzata; offerte ammissibili a uno specifico profilo. L'ultimo richiede residenza, territorio, limiti di consumo/potenza e condizioni. Un `LIMITANTE=01` non significa automaticamente che ogni utente sia escluso: occorre conoscere la condizione e il profilo. Queste distinzioni discendono dai campi delle specifiche AU pp. 52–60.

Le caratteristiche si sovrappongono: una variabile può avere fasce, scaglioni e sconto insieme. Riportare sia la frequenza di ogni caratteristica sia le combinazioni effettive. La copertura finale è l'unione dei codici completamente calcolabili, non la somma delle percentuali delle singole caratteristiche.

La presenza di un campo non prova un effetto economico: un unico intervallo di consumo aperto può coincidere con un prezzo costante; una durata di dodici mesi può coprire l'intero periodo di stima; un bonus condizionato o oltre il primo anno non può essere sottratto indiscriminatamente. Conservare il conteggio strutturale e separare quello dei casi che cambiano davvero il calcolo.

Una fotografia giornaliera misura il catalogo osservato, non la frequenza durante l'anno né le quote di mercato dei clienti. Ripetere l'audit su acquisizioni successive e conservare gli identificativi; non conteggiare la stessa offerta ogni giorno come un'offerta nuova.

## Convenienza: cosa possiamo dimostrare prima del motore completo

La misura finale è il costo annuo stimato su un insieme esplicito di profili, con lo stesso periodo e scenario per tutte le offerte, dopo la verifica dei requisiti. Servono anche rete, oneri, imposte, sconti e componenti dovute; le regole AU v4.2 separano queste voci nei capitoli 3 e 4. Il prezzo unitario più basso, il maggiore bonus e lo spread minore, isolatamente, non dimostrano la convenienza.

È comunque possibile fare confronti relativi rigorosi **entro gruppi controllati**. A titolo di metodo, per due offerte indicizzate con:

- stessa esposizione all'indice in ogni periodo e fascia, comprese perdite e coefficienti;
- identiche componenti regolate e identico trattamento di rete/oneri;
- stessi requisiti soddisfatti dal profilo;
- quote annuali e spread costanti, senza altre differenze economiche non contabilizzate;

la differenza prima delle imposte può essere espressa come `Δquota_annua + consumo × Δspread − Δsconti_applicabili`. Il prezzo futuro comune si elimina algebricamente. Questo permette di misurare un vantaggio relativo senza inventare una previsione. È una deduzione matematica dalle formule, non un diverso algoritmo ufficiale né la stima completa della bolletta.

Per offerte fisse omogenee vale un ragionamento analogo con `prezzo × consumo`. La soglia di consumo che ribalta l'ordine fra quota fissa e prezzo variabile si calcola dall'uguaglianza dei due importi. Se IVA, basi imponibili o applicazione temporale degli sconti differiscono, il confronto va completato anche su quei termini prima di tradurlo in euro di risparmio finale.

Non sono eliminabili come termine comune: indici o coefficienti diversi, quote di consumo fisso/variabile, fasce diverse, calendario promozionale differente, sconti su basi diverse, servizi obbligatori, canoni che includono rete/oneri e strutture fiscali differenti. Questi casi richiedono calcolo specifico. Per gas, una media annuale non pesata sostituita al profilo mensile può alterare proprio il vantaggio di una promozione invernale. [Regole AU v4.2, §§3.4 e 4.3](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf).

Per decidere la copertura, affiancare quindi alla prevalenza:

1. Profili e scenari per i quali almeno un'offerta della famiglia è prima o tra le alternative più convenienti.
2. Differenza di costo tra la migliore offerta ammissibile e la migliore che rimarrebbe escludendo quella famiglia.
3. Ampiezza dei requisiti e diffusione tra venditori, per non generalizzare un'offerta locale o riservata.
4. Esito **non determinabile** quando mancano semantica o dati: non trasformarlo in “poco conveniente”.

Queste misure sono una proposta di valutazione. L'agente può scegliere profili e scenari espliciti per le prove; i risultati non introducono automaticamente nuove soglie di completamento del prodotto. Le formule frequenti possono già motivare l'inclusione, mentre quelle rare richiedono comunque il vaglio economico concordato dall'utente.

## Caso concreto: sei miste gas da interpretare con le fonti ufficiali

Nel file gas del **26 ottobre**, sei offerte domestiche hanno `TIPO_OFFERTA=04`: famiglie Senza Pensieri S/M/L, di due P.IVA. L'esempio Open S ha codice `029886GSVML01XXSENZAPENSIDOMGAS3`, validità 8–31 ottobre, quota annuale 144 €, indice `14` (PSV mensile) e due `IntervalloPrezzi` della stessa componente, entrambi 0,08 €/Smc: uno fisso e uno variabile. Nei due intervalli non ci sono periodo, fascia o intervallo di consumo che distinguano quando applicarli.

Il controllo sull'export del 27 ottobre conferma gli stessi sei codici e record invariati. L'[audit aggiornato](./audit-formule-offerte-2026-10-27.md) usa il 27 ottobre come fotografia principale e conserva entrambe le provenienze.

Non è giustificato né sommarli meccanicamente né scegliere quello apparentemente più conveniente. Le regole AU per le miste applicano i prezzi in funzione di fascia, scaglione e periodo; dal record non è ricostruibile una ripartizione fra i due prezzi. [Export gas del 26 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261026.xml), [regole v4.2, §4.3.1, p.38](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf).

Questo è un esito di interpretazione ancora incompleta, non la dimostrazione che la famiglia sia poco conveniente, che il venditore abbia violato una regola o che il Portale mostri un costo sbagliato. Il seguito necessario è verificare come i tracciati e i metodi ufficiali prescrivano di trattare questi intervalli. Se i dati ufficiali non determinano un risultato univoco, il record resta non calcolabile con motivazione esplicita. Non si seguono i collegamenti `URL_OFFERTA` per completarlo. La bassa frequenza non basta a escludere il supporto della formula mista, e la qualità del singolo record va distinta dalla copertura del motore.

Nel medesimo snapshot XML non risultano offerte domestiche FLAT né campi `OFFERTA_ONNICOMPRENSIVA` in luce o gas. L'[approfondimento del catalogo](./approfondimento-canone-catalogo-2026-10-27.md) ha però verificato canoni reali nelle pagine ufficiali separate senza calcolo della spesa e rate costanti negli XML ordinari. Lo zero non descrive quindi l'intero Portale e non motiva il rinvio dei canoni. Le [conclusioni aggiornate](./esito-approfondimenti-formule-2026-10-27.md) integrano queste fonti e la successiva qualifica dei casi ambigui.

È stato inoltre controllato il ramo delle combinazioni di indici negli export del **27 ottobre**, limitando il filtro strutturale a domestico, offerta singola e cambio fornitore/sempre: 1.916 offerte luce e 1.571 gas. Nessuna presenta più di un `RiferimentiPrezzoEnergia`; 39 luce e 35 gas valorizzano `COEFFICIENTE`, sempre con valore `1`. In questa fotografia il coefficiente esplicito non genera quindi una formula economicamente diversa. Non attribuire priorità elevata alle combinazioni solo perché lo schema le ammette, ma preservare i campi e rilevare nuovi casi nei successivi aggiornamenti. Questo controllo non sostituisce l'ammissibilità al profilo. Fonti: [export luce del 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml) e [gas dello stesso giorno](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml).

## Conseguenza per specifica e verifiche

La specifica deve indicare per ogni famiglia: codici campione, formula risolta, dati necessari, requisiti, confronto di riferimento e copertura misurata. Separare “riconosciuta dal parser” da “calcolata correttamente”. La matrice deve includere le combinazioni osservate, senza sostituire sconti o dati mancanti con zero.

Il risultato dell'audit può confermare le famiglie da includere e individuare le poche che richiedono approfondimento; non autorizza a presentare come completo un confronto che esclude silenziosamente possibili vincitrici. La fonte previsionale, l'orizzonte concordato Q23 e il trattamento dei dati mancanti Q24 rimangono dipendenze esplicite del percorso reale.
