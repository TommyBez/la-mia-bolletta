# Ricerca di un controllo storico per la precedenza degli intervalli

**Decisione successiva dell'utente, 27 ottobre 2026:** adottare il minimo numerico fra intervalli applicabili in conflitto. La ricerca sotto conserva il proprio esito sperimentale; la scelta progettuale è approvata anche se primo/minimo non sono stati distinti empiricamente. La [specifica operativa](./design-ingestion.md#precedenza-degli-intervalli-decisione-approvata-il-27-ottobre-2026) mantiene il default come fallback e chiude questo punto decisionale.

Ricerca del 27 ottobre 2026. Obiettivo: trovare nell'archivio ufficiale un'offerta con due intervalli concorrenti, nella stessa componente, con prezzo numerico maggiore nel primo, così da distinguere scelta del primo e scelta del minimo.

## Risultato

Esaminati **36 export aggiuntivi**, 71.653 record inclusi i duplicati fra date, 27.128 codici offerta distinti. Trovate 63 coppie potenzialmente concorrenti con prezzi o tipi differenti: **nessuna con prezzo numerico maggiore nel primo intervallo**. Non esiste quindi, in questo campione, una nuova simulazione che distingua le due ipotesi. Nessuna conclusione di ricerca esaustiva dell'intero archivio.

| Catalogo | Periodo/campioni | Export | Record |
| --- | --- | ---: | ---: |
| Elettrico | 2025: 1 aprile e 1 ottobre | 2 | 5168 |
| Gas | 2025: 1 gennaio, febbraio, aprile, maggio, luglio, agosto, ottobre, novembre | 8 | 13957 |
| Dual fuel | 2026: 1 gennaio, aprile, luglio, ottobre | 4 | 118 |
| Elettrico | 2026: 1 gennaio, aprile, luglio, settembre | 4 | 11358 |
| Gas | 2026: giorni 1 e 15 da gennaio a settembre | 18 | 41052 |

## Acquisizione ufficiale e correzione dei precedenti 404

Usato il [modulo ufficiale di ricerca Open data](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page), tramite gli stessi parametri pubblici `tipologia=ML`, `tipoOfferta=gas/elettrico/dual`, `periodoRiferimento=intervalloTemporale`, `dateDa` e `dateA` in formato gg/mm/aaaa. Gli URL scaricati sono stati confrontati con i link effettivamente presenti nelle risposte del modulo; nessuna fonte fornitore o mirror.

**I precedenti 404 di settembre e luglio erano dovuti a URL costruiti con mese a due cifre.** Il percorso pubblicato usa `2026_9`, non `2026_09`, mentre la data nel nome del file mantiene due cifre. Sono stati scaricati con successo anche [gas 1 settembre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_9/PO_Offerte_G_MLIBERO_20260901.xml) e [gas 1 luglio 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_7/PO_Offerte_G_MLIBERO_20260701.xml). Non è lecito usare i precedenti errori come evidenza di indisponibilità storica.

## Perimetro della scansione

Lo scanner confronta intervalli fratelli nella stessa componente, fascia e unità, con consumi sovrapposti. Separa default da specifici: la loro precedenza è già stata verificata e non è il dubbio residuo. Considera sia periodi uguali sia diversi; per questi ultimi segnala eventuali candidati da verificare temporalmente. Nelle 63 coppie emerse i periodi sono uguali. Non include collisioni tra componenti distinte.

Sono presenti 1.246 componenti con almeno una diminuzione di prezzo lungo la sequenza XML, ma le inversioni non soddisfano tutti i requisiti del confronto: cambiano fascia/unità o non c'è sovrapposizione, oppure si tratta di default contro specifico. Non è dunque dimostrato un ordinamento globale dell'XML per prezzo.

La famiglia storica CASA SICURA contiene anche due quote fisse senza delimitazioni a 60 e 132 €/anno, ancora con il minimo per primo. Simularla potrebbe corroborare la selezione di un solo prezzo, ma non risolverebbe primo/minimo; non è stata presentata come un controllo discriminante.

Il dubbio riguarda il **minimo numerico del campo PREZZO**, non il costo economico completo del ramo. In Senza Pensieri il ramo fisso e quello variabile hanno PREZZO identico, ma solo il secondo include l'indice; il comportamento già osservato non sceglie il ramo economicamente meno costoso.

## Evidenze e riproduzione

- [audit.json](./evidenze/storico-precedenza-2026-10-27/audit.json): 36 URL ufficiali, SHA-256, conteggi e tutte le coppie rilevate.
- [official-index-links.json](./evidenze/storico-precedenza-2026-10-27/official-index-links.json): collegamenti verificati nelle risposte dell'archivio.
- [scan-history.py](./evidenze/storico-precedenza-2026-10-27/scan-history.py): scanner offline standard-library, eseguibile con una o più directory contenenti gli XML originali. Le copie acquisite sono in `/tmp/lmb-historical-root`, `/tmp/lmb-historical-search`, `/tmp/lmb-history-2025`; non si presumono permanenti.

La verifica termina con un risultato negativo circoscritto. Le regole primo/minimo restano entrambe compatibili con questo campione, non diventano equivalenti in generale. Non è stata modificata la logica del motore applicativo.
