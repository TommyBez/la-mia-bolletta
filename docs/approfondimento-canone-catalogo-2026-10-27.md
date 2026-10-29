# Canoni e rate: verifica del catalogo e delle offerte senza calcolo

Verifica del 27 ottobre 2026, esclusivamente su open data e pagine ufficiali del Portale Offerte. Nessun collegamento a siti o documenti dei fornitori è stato seguito. Questa nota integra e corregge la portata della conclusione “zero canoni” del primo audit: lo zero riguarda determinati campi negli XML esaminati, non ogni prodotto presentato nel Portale come canone o rata.

## Risultato principale

Ci sono due evidenze diverse:

1. Gli XML contengono offerte descritte come **rata fissa/costante**, classificate a prezzo fisso oppure variabile e dotate delle normali componenti economiche. Vanno confrontate tramite queste componenti e le regole ufficiali; la rata è una modalità di pagamento, spesso con conguaglio.
2. La pagina ufficiale **Offerte senza il calcolo della spesa** contiene veri prodotti a canone onnicomprensivo, fra cui Fastweb Luce Flat e Gas Flat. Non è corretto dedurre dalla loro assenza strutturata negli XML che siano solo formule teoriche. Il Portale le pubblica però senza una stima ufficiale; acquisirne le descrizioni non autorizza automaticamente a dichiarare una classifica calcolata secondo il suo algoritmo.

## Verifica degli XML, anche fuori dal filtro domestico

Fonti: export ML [luce 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml) e [gas 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml), controllati anche rispetto ai file del 26 ottobre già acquisiti. I file sono quelli collegati dalla [pagina Open Data](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page).

La scansione ha riguardato **tutti i tag a ogni profondità**, non solo il percorso atteso sotto `DettaglioOfferta`. Nei quattro file non compare alcun tag contenente `CANONE`, `ONNICOM` o `FLAT`; nessun record ha `TIPO_OFFERTA=03`. Questi fatti descrivono i byte osservati. Non dimostrano che il formato teorico non preveda i campi o che ogni prodotto a canone debba essere presente in questi export.

| File | Tutti i record | Tipi presenti nell'intero file |
| --- | ---: | --- |
| Luce 26 ottobre | 3.657 | 703 fissi, 2.954 variabili |
| Gas 26 ottobre | 2.850 | 411 fissi, 2.433 variabili, 6 misti |
| Luce 27 ottobre | 3.626 | 670 fissi, 2.955 variabili, 1 misto |
| Gas 27 ottobre | 2.830 | 395 fissi, 2.429 variabili, 6 misti |

L'unica mista luce del 27 è fuori dal sottoinsieme domestico: il precedente conteggio domestico di zero miste luce resta corretto.

La ricerca testuale, senza aprire gli URL, conferma che le parole commerciali non sono una classificazione affidabile. Nel perimetro domestico/singolo/cambio fornitore del 27 ottobre:

| Indizio testuale, almeno una volta nel record | Luce, su 1.916 | Gas, su 1.571 |
| --- | ---: | ---: |
| “canone” o “canoni” | 45 | 37 |
| “rata” o “rate” | 64 | 54 |
| “flat” | 19 | 13 |
| Frasi mirate a piani/opzioni di rata | 28, presso 12 P.IVA | 26, presso 14 P.IVA |

L'ultima riga usa espressioni come rata fissa, costante, finanziaria o mensile e undici fatture di pari importo. È un insieme riproducibile di candidati, **non un censimento esaustivo delle rate** né una nuova classificazione automatica. Include opzioni facoltative. Le semplici parole “canone” e “rate” ricorrono anche in commercializzazione, canone RAI, telefonia e bonus rateizzati.

## Esempi reali già negli open data

I fatti seguenti provengono dalle descrizioni e dai campi economici degli XML citati. I nomi dei venditori non indicano consultazioni dei loro siti.

| Offerta e codice | Classificazione e componenti nell'XML | Conseguenza |
| --- | --- | --- |
| NeN Due Luce — `029748ESFML01XX261021LDDUE000000` | Fissa `01`; 0,153 €/kWh e 108 €/anno. La descrizione prevede rata mensile calcolata sui consumi e ricalcolo dopo dodici mesi. | La rata non sostituisce il prezzo unitario nella stima annua. |
| NeN Due Gas — `029748GSFML01XX261021GDDUE000000` | Fissa `01`; 0,62 €/Smc e 120 €/anno; rata con ricalcolo basato su consumi e componenti regolate. | Stesso principio per il gas. |
| IREN SMART NO STRESS LUCE VERDE — `000208ESFML07XX00IEDOFLATS261027` | Fissa `01`; energia verde standard 0,168 €/kWh e quota 159 €/anno; rata ricalcolata considerando la differenza fra pagamenti e consumi effettivi. | Non è un tetto definitivo alla spesa; non sommare la componente FER a un prezzo base immaginario. |
| Gelsia Rata Fissa Gas — `002505GSVML03XX00000000GMGRATAKN` | Variabile `02`, PSV mensile, spread 0,117 €/Smc e 129 €/anno. La descrizione elenca piani mensili da 49 a 169 €, con conguaglio sui corrispettivi e consumi effettivi. | **Rata fissa non implica prezzo dell'energia fisso**. |
| ACOS ENERGIA FLAT — `000715GSVML01XXGMENERGIAFLAT2507` | Variabile `02`, PSV mensile, spread 0,065 €/Smc, 144 €/anno e componenti regolate esplicite. Undici fatture in acconto e una di conguaglio. | Il nome FLAT non la rende `TIPO_OFFERTA=03`. |
| Tea Zen Luce — `001227ESFML15XX38600002026T64080` | Fissa `01`, 0,169 €/kWh e 192 €/anno. La descrizione parla di rata comprensiva delle varie voci e conguaglio a fine anno sui consumi effettivi. | Anche una rata che include imposte e rete può essere un acconto sul costo effettivo. |
| Bee Flat — `000432ESFML01XXAPEBEEFLAT2026V04` | Fissa `01`, 0,2313 €/kWh e 144 €/anno. | Il nome non basta a dedurre canone, volume incluso o FLAT ufficiale. |

Questi valori sono le sole componenti indicate, non bollette complete. Il calcolo deve aggiungere o trattare le altre voci secondo le regole ufficiali e applicare i requisiti del profilo. La media mensile della nostra stima e la rata commerciale eventualmente descritta devono restare distinguibili nell'interfaccia.

## La categoria ufficiale senza calcolo della spesa

La [FAQ del Portale](https://www.ilportaleofferte.it/portaleOfferte/it/domande_frequenti.page) descrive una sezione per offerte non simulabili con le regole correnti. Le [specifiche AU v5.0, §7.2, pp. 63–65](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true) definiscono un tracciato distinto per la loro pubblicazione; il successivo passaggio nel confronto richiede algoritmi idonei e ritrasmissione nel tracciato ordinario.

Sono state scaricate integralmente le due pagine pubbliche collegate dal percorso di confronto:

- [Elettricità: offerte senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO): **1.058 schede**, con 1.058 identificativi di modale distinti e numero dichiarato dalla pagina coincidente.
- [Gas: offerte senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS): **249 schede**, con 249 identificativi distinti e numero dichiarato coincidente.

Questi sono conteggi di tutte le schede della rispettiva pagina, **non conteggi di offerte domestiche indipendenti**. Le schede non espongono i campi strutturati `TIPO_CLIENTE`, `TIPOLOGIA_ATT_CONTR`, `OFFERTA_SINGOLA` o il `COD_OFFERTA`; l'identificativo `modal-...` della pagina non deve essere scambiato per il codice offerta. Il solo testo non consente un denominatore domestico completo e affidabile. Anche i nomi possono ripetersi.

La pagina Open Data esaminata espone gli XML ML ordinari e i relativi parametri, ma non un download separato delle offerte senza calcolo. Le pagine HTML sono una fonte pubblica ufficiale ulteriore; il loro uso nell'ingestion è una scelta da rendere esplicita, distinta dall'importazione dei file già previsti. Non è dimostrato un export numerico completo per questa categoria.

## Canoni effettivamente pubblicati nella sezione senza calcolo

### Elettricità

La [pagina ufficiale elettrica](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) contiene quattro Fastweb Luce Flat con importi descritti e una variante Partner Light. Le prime quattro riportano clienti domestici fino a 6 kW e validità di sottoscrizione 24 ottobre–15 novembre 2026.

| Scheda pubblica | ID della pagina | Consumo di riferimento | Canone annuo dichiarato **a partire da** | Corrispettivo descritto per conguaglio |
| --- | --- | ---: | ---: | ---: |
| Start | `modal-14147` | 800 kWh | 564 € | 0,30 €/kWh |
| Light | `modal-14146` | 1.500 kWh | 768 € | 0,28 €/kWh |
| Pro | `modal-14148` | 2.500 kWh | 1.044 € | 0,27 €/kWh |
| Ultra | `modal-14154` | 4.500 kWh | 1.560 € | 0,25 €/kWh |
| Partner Light | `modal-14156` | 1.500 kWh | Non riportato nella scheda | Non riportato nella scheda |

Le quattro descrizioni complete prevedono conguaglio anche per consumi inferiori alla quantità inclusa, non solo pagamento degli extra. Dichiarano compresi materia prima, rete/contatore, oneri, accise e IVA; escludono canone RAI, extra-consumi, costi accessori e bonus sociale. Lo sconto di 10 €/mese è condizionato al mantenimento di un contratto di telecomunicazioni indicato dal testo; non va applicato a tutti i profili. Il testo collega la scelta della fascia a potenza, consumo e uso, ma non esplicita una relazione completa fra caratteristiche e canone. La dicitura “a partire da” non dimostra da sola prezzi diversi per lo stesso prodotto, né spiega il motivo della non simulabilità: segnala un punto da qualificare prima di applicare l'importo a ogni profilo.

Ci sono inoltre tre schede **CASA MIA NO STRESS** di Veneto Gas&Power, taglie 800/1.500/2.500 kWh, ID `modal-14142`, `modal-14143`, `modal-14144`. Le brevi descrizioni confermano la rata costante, ma non riportano prezzi o una formula sufficienti per stimare il costo.

### Gas

La [pagina ufficiale gas](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS) contiene cinque Fastweb Gas Flat, con la stessa validità 24 ottobre–15 novembre 2026:

| Scheda pubblica | ID della pagina | Consumo di riferimento | Canone annuo dichiarato | Corrispettivo descritto per conguaglio |
| --- | --- | ---: | ---: | ---: |
| Start | `modal-14151` | 150 Smc | 432 € | 1,60 €/Smc |
| Light | `modal-14155` | 300 Smc | 660 € | 1,50 €/Smc |
| Pro | `modal-14157` | 600 Smc | 1.104 € | 1,46 €/Smc |
| Maxi | `modal-14158` | 900 Smc | 1.536 € | 1,42 €/Smc |
| Ultra | `modal-14159` | 1.200 Smc | 1.956 € | 1,38 €/Smc |

Le descrizioni prevedono anche il conguaglio della quantità non consumata e dichiarano incluse vendita, rete, oneri e imposte. Richiedono di essere già titolari di una fornitura Fastweb Energia Luce o di sottoscriverla contestualmente; lo sconto mensile di 10 € IVA inclusa dura finché la fornitura luce rimane attiva. Questa dipendenza deve essere valutata rispetto a Q26, che esclude pacchetti congiunti: non si può trattare automaticamente il gas come offerta indipendente aperta a tutti. La pagina non fornisce il flag strutturato `OFFERTA_SINGOLA` per risolvere da sola l'ammissibilità al nostro perimetro.

I nomi delle dieci schede Fastweb Flat non compaiono negli XML ML del 27 ottobre, che contengono altre offerte Fastweb fisse/variabili. In assenza del codice offerta nelle schede HTML, non si afferma un confronto per identità di codice: il risultato è una verifica dei nomi e dei campi disponibili.

## Conseguenza per il progetto

La frase da mantenere è: **nei file XML analizzati non sono presenti record classificati FLAT o campi di canone onnicomprensivo; nel Portale sono però presenti offerte a rata e canoni veri, con due disponibilità informative differenti**.

Le rate già descritte negli XML non giustificano un'esclusione dal motore ordinario. Per i canoni delle pagine senza calcolo, la sola presenza pubblica non dimostra che siano più convenienti, ma smentisce l'idea che non siano osservabili presso la fonte ufficiale. Vanno tenuti nell'analisi della copertura, senza inventare importi mancanti, ricalcolare due volte imposte incluse o attribuire al Portale un calcolo che esso non pubblica per quelle schede. Restano separati: acquisizione delle descrizioni ufficiali, sufficienza dei dati per calcolare, eventuale metodo aggiuntivo da approvare e ammissibilità del singolo profilo.

## Artefatti riproducibili

Script, risultati, manifesto e descrizioni integrali dei tredici casi HTML sono conservati nella [cartella delle evidenze](./evidenze/canone-2026-10-27/README.md). Lo script usa solo la libreria standard, non effettua richieste e non apre URL dei fornitori. Legge i quattro XML e i due HTML completi; verifica conteggio delle schede, identificativi unici e chiusura dei documenti. I file HTML originali restano locali, `/tmp/portale-nonconfrontabili-E-20261027.html` e `/tmp/portale-nonconfrontabili-G-20261027.html`; il manifesto registra URL, dimensioni e checksum. Sono stati ricontrollati i conteggi e gli hash delle descrizioni selezionate. La struttura e il contenuto delle pagine possono cambiare: questa è una prova di acquisibilità attuale, non un connettore di produzione.
