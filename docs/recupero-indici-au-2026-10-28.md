# Recupero degli indici previsionali impliciti del Portale — 28 ottobre 2026

**Decisioni successive, 29 ottobre 2026 — Q43/Q44:** esecuzione manuale mensile dello script separato e importazione dello snapshot validato nel DB; app e MCP consumano la stessa versione. La finestra di stima è allineata al Portale (quattro trimestri dal trimestre corrente). Il limite del mese aggiuntivo discusso sotto descrive il precedente requisito Q23, ora superato. Rimangono da verificare copertura degli indici e funzionamento dell'importazione.

## Conclusione

Il recupero **non è limitato alle medie annue**. Inviando al normale calcolatore pubblico distribuzioni mensili sintetiche coerenti si possono separare quattro coefficienti temporali per ciascuna fascia/indice esaminato. I coefficienti ricavati riproducono nuove distribuzioni mensili e altre offerte senza ricalibrazione. È un'estrazione indiretta dai risultati ufficiali, con incertezza da arrotondamento, non il download della serie AU destinata agli operatori.

Le prove correnti coprono PUN F0, F1, F2, F3, F23 e PSV gas: **20 coefficienti luce e4 gas**. Non attestano automaticamente gli altri indici o tutte le formule dell'export. Le prove sono svolte il 28 ottobre, non costituiscono un aggiornamento quotidiano già in produzione. Lo [snapshot JSON](./evidenze/sonda-au-luce-trimestri-2026-10-28/implicit-indices-snapshot.json) raccoglie valori, unità, provenienza e incertezza.

## Metodo che risolve l'identificabilità

Un consumo annuo restituisce una media dei quattro trimestri. Aumentarlo moltiplica la stessa equazione. Per avere quattro equazioni indipendenti occorre invece cambiare **quando** viene consumata l'energia.

Il JavaScript pubblico [forniture.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/forniture.js?rdm=2023), insieme a [confrontaOfferte.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/confrontaOfferte.js), espone il formato `misureMensili`, `statoMisure=3`, `usaConsumi=SI`. Il normale modulo di confronto accetta anche in sessione anonima i valori sintetici forniti dall'analista. Non è stato interrogato alcun endpoint di forniture autenticate, usato un identificativo di una fornitura reale o letto un consumo personale.

Si mantengono il totale annuo, la fascia, il comune, la potenza e le componenti dell'offerta; si concentra il consumo mensile in dicembre, febbraio, maggio e agosto. Gli altri undici valori sono zero. La matrice delle quattro distribuzioni è diagonale: ciascuna simulazione isola un coefficiente. Gli input sono consumi **storici sintetici**: le loro date non vanno confuse con le date di consegna future. Le etichette Q4/Q1/Q2/Q3 derivano dal calendario e dal metodo ufficiale dei quattro trimestri, non dal considerare il 2025 un anno di consegna futuro.

Per la luce si sottraggono quota fissa, spread e CdispD e si rimuove il fattore perdite secondo [regole ufficiali v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf) e [parametri ML del 28 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_E_20261028.csv). Sul gas ZERO FLEX ha spread zero e quota fissa174 €/anno: `(vendita−174)/Smc` isola il coefficiente direttamente dalla vendita, senza ricorrere all'IVA.

Il dettaglio server restituito è stato controllato: totali e dodici quantità mensili corrispondono agli input. La presenza dei campi nella risposta, da sola, non è stata usata come prova: si sono verificati cambiamenti dei risultati, coerenza con le medie annue, controllo all'interno dello stesso trimestre e predizioni indipendenti.

## Risultati luce trioraria

Prezzi impliciti approssimati in €/kWh, netti di spread, CdispD e perdite.

| Gruppo temporale | F1 | F2 | F3 |
| --- | ---: | ---: | ---: |
| Q4 | 0,229819 | 0,225864 | 0,194649 |
| Q1 | 0,208943 | 0,209910 | 0,180925 |
| Q2 | 0,124758 | 0,145695 | 0,125564 |
| Q3 | 0,138613 | 0,151664 | 0,130722 |

Sonda + CASA SPECIAL, fisso120 €, spread0,0275 €/kWh, CdispD0,016776 €/kWh, lambda0,10. Ogni coefficiente è ricavato da3000kWh concentrati in un solo mese/fascia. Incertezza del solo arrotondamento: circa±0,000001515 €/kWh, prima di eventuali altre incertezze del metodo.

Controlli ulteriori: ottobre e dicembre danno la stessa vendita F1; invertire l'ordine dei record mensili non cambia dicembre; distribuire uniformemente il consumo su dodici mesi restituisce832,09 €, identico alla simulazione annuale senza dati mensili. Le medie delle quattro simulazioni per fascia coincidono con i coefficienti annui precedentemente ricavati entro gli arrotondamenti.

## Predizioni indipendenti luce

Le quantità dei nuovi profili sono state fissate e i risultati attesi registrati prima delle query. Nessun coefficiente è stato modificato dopo queste risposte.

| Profilo e offerta | Vendita prevista non arrotondata, € | Portale, € |
| --- | ---: | ---: |
| F1: novembre600, gennaio900, aprile1200, luglio300; SPECIAL | 821,785 | 821,78 |
| Stesso profilo, UNICA con quota144 e spread0,033 | 862,285 | 862,28 |
| Tutte le fasce e trimestri, SPECIAL | 797,232 | 797,23 |
| Stesso profilo, POWER HOME4ALL, altro venditore, quota120 e spread0,0198 | 774,132 | 774,13 |

Il profilo misto usa, in F1/F2/F3: novembre100/200/300, gennaio200/300/100, aprile300/100/200, luglio400/400/400. È diverso da ogni calibrazione a singolo mese/fascia. La verifica comprende pertanto esposizioni temporali diverse e trasferibilità a un altro venditore, non soltanto un fit sulla sonda.

## Monorario e gas

Il monorario F0 è stato estratto con A2A Easy Luce e verificato su FLEXI MONO ENERGY di un altro venditore. La vendita annuale ordinaria, il profilo mensile uniforme e la media delle quattro calibrazioni coincidono a760,99 €. Un nuovo profilo stagionale dà754,187 € previsti →754,19 € Portale; sull'altra offerta790,187 € →790,19 €. Dettagli e quattro valori in [sonda luce](./sonda-au-luce-periodi-2026-10-28.md).

Il biorario F23 è stato estratto con GIUSTA LUCE BIO DOMESTICA e verificato su ONDA BLUE2.0 di un altro venditore. Spostare i consumi fra F2 e F3 lascia invariato dicembre; il consumo F1 coincide invece con la curva trioraria al netto delle diverse condizioni commerciali. Il profilo mensile uniforme dà880,93 €, pari alla media delle quattro calibrazioni entro l'arrotondamento. I nuovi profili stagionali danno875,829 € →875,83 € e759,474 € →759,47 €. Quattro coefficienti F23 e controlli nella [sonda bioraria](./sonda-au-biorario-2026-10-28.md). F23 non viene confusa con OffPeak.

Sul gas, i quattro coefficienti diretti sono Q4≈0,85685833, Q1≈0,84325000, Q2≈0,62185000, Q3≈0,57515833 €/Smc. Le nuove distribuzioni mensili predicono ZERO FLEX979,145 € →979,15 € e Senza Pensieri S1045,145 € →1045,15 €. Le due offerte hanno quote fisse e spread diversi. Questi valori coincidono anche con gli intervalli precedentemente ricavati da un metodo indipendente basato sull'anomalia IVA. La via diretta non dipende da quell'anomalia e non ne riproduce il comportamento nel motore fiscale applicativo. Dettagli: [sonda gas](./sonda-au-gas-trimestri-2026-10-28.md).

## Errori esplorativi separati dai risultati qualificati

Le prime richieste luce valorizzavano contemporaneamente i consumi monorari e quelli per fascia negli stessi record mensili. Questa rappresentazione è incoerente e produce risultati diversi; tali query sono state invalidate e non usate per estrarre la curva. Le prove qualificate tengono `delta_misure_monoraria=null` quando i consumi sono per fascia, e viceversa. L'ordine decrescente del client ufficiale è stato riprodotto e controllato sperimentalmente.

Il precedente errore aritmetico nella predizione annuale a4000kWh rimane documentato nella [prima prova](./prova-sonda-au-2026-10-28.md); non era un'anomalia del Portale. Nessun errore esplorativo è stato corretto adattando la curva ai risultati di verifica.

## Cosa cambia per il progetto e limite residuo

La frase «abbiamo soltanto medie annue» è superata dalle prove qui raccolte. Abbiamo un metodo programmatico sperimentale per recuperare coefficienti trimestrali impliciti dalle simulazioni, con verifiche separate. Non serve presumere che i dati esclusi dall'XML siano matematicamente irrecuperabili.

Restano distinti:

- **Orizzonte:** [ARERA](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa) documenta quattro trimestri dal trimestre corrente. Recuperarli non dimostra un quinto trimestre o un prezzo autonomo per ottobre2027, richiesto dalla finestra progettuale novembre2026–ottobre2027. Il gruppo Q4 non va rinominato automaticamente Q4 dell'anno successivo.
- **Copertura:** i test qualificano gli indici e le formule esaminati. Non attestano ogni indice alternativo, Peak/OffPeak o componente del catalogo senza una verifica equivalente. La sonda bioraria è trattata in una nota separata.
- **Operatività:** gli script dimostrano recupero e riproducibilità, non sono ancora un servizio mensile con controllo variazioni, sostituzione della sonda scaduta e pubblicazione atomica di una curva validata. L'aggiornamento degli indici AU è mensile, distinto dall'acquisizione quotidiana delle offerte.

**Decisione successiva dell'utente, Q42:** implementare questa strada come principale; se non si riesce a renderla utilizzabile e operativa, ripiegare su GME + nostra stima Q39/Q41. Q41 resta approvata come ripiego. Questa scelta non modifica la finestra del confronto né autorizza una copertura temporale non verificata.

## Evidenze riproducibili

- [Dodici coefficienti luce, risposte e quattro holdout](./evidenze/sonda-au-luce-trimestri-2026-10-28/quarter-results.json); [verifica offline Decimal](./evidenze/sonda-au-luce-trimestri-2026-10-28/verify-quarter-holdouts.py); [manifest SHA256 e REA](./evidenze/sonda-au-luce-trimestri-2026-10-28/manifest.json). REA ha analizzato staticamente i due script pubblici, Evidence parent `ev_f1d97fd3e2991074b249ecaedecfd2950f4246921bb7ed55e53eda7ba65c2bd7`; questa analisi non è stata scambiata per esecuzione del calcolo server.
- [Monorario e controlli](./sonda-au-luce-periodi-2026-10-28.md), con manifest e risposte separate per gli input invalidati.
- [Gas diretto: matrice, coefficienti e due holdout](./evidenze/sonda-au-gas-2026-10-28/monthly/direct-quarter-results.json); [verifica offline Decimal](./evidenze/sonda-au-gas-2026-10-28/monthly/verify-direct-quarter-prices.py).

Tutte le acquisizioni provengono dal Portale o da documenti ufficiali; nessun sito del fornitore consultato e nessun messaggio inviato a terzi.
