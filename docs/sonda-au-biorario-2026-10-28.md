# Sonda AU bioraria F23 — 28 ottobre 2026

## Risultato

Sono ricavabili quattro coefficienti previsionali impliciti **F23** distinti, usando la distribuzione mensile sintetica accettata dal normale modulo pubblico del Portale. La loro media riproduce il profilo uniforme e la loro combinazione riproduce due nuove simulazioni su offerte di venditori diversi. Non sono un file di quotazioni pubblicato da AU né una prova di disponibilità del trimestre di consegna Q4 2027.

## Fonti e sonda

- [XML ufficiale luce del 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml), estratti delle due offerte conservati nelle evidenze.
- Normale [modulo pubblico del Portale](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page), validazione codice e dettaglio ufficiale della spesa; nessuna chiamata a forniture private e nessun sito del venditore.
- [Parametri ML luce del 28 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_E_20261028.csv): lambda0,1 e CdispD0,016776 €/kWh, già acquisiti nella prova principale.

Sonda **GIUSTA LUCE BIO DOMESTICA**, `001046ESVFL01XXGIUE1AB1261260401`, cliente domestico, tariffa91 F1/F23, indice12 PUN mensile, quota fissa144 €/anno, spread0,045 €/kWh per entrambe le fasce, dispacciamento14. L'XML contiene uno sconto condizionato al nuovo cliente che non è richiesto dal probe; gli importi di vendita verificati sono compatibili con i soli144 € e spread0,045. Non si presume uno sconto aggiuntivo descritto soltanto nel testo.

Profilo sintetico Pescara, residente,3kW. Input mensile con dodici competenze202509–202608 in ordine decrescente, dati per fasce F1/F2/F3 e monoraria nulla; `usaConsumi=SI`, `statoMisure=3`. Nessun identificativo di fornitura reale. Il server conserva i quantitativi mensili e annui richiesti. Sono state controllate la tariffa91 nel dettaglio e la corrispondenza dei totali.

## Quattro coefficienti F23

Consumo annuo3000kWh, tutto F2 e concentrato nel mese indicato:

| Mese storico impiegato come profilo | Gruppo di trimestre solare | Vendita, € | Indice implicito F23, €/kWh |
| --- | --- | ---: | ---: |
| dicembre2025 | Q4 | 1009,06 | 0,205979394 |
| febbraio2026 | Q1 | 961,06 | 0,191433939 |
| maggio2026 | Q2 | 767,80 | 0,132870303 |
| agosto2026 | Q3 | 785,79 | 0,138321818 |

Formula: `indice = ((vendita−144)/3000−0,045−0,016776)/1,1`.

Le cifre riportano il calcolo sui risultati arrotondati. La sola incertezza dovuta al mezzo centesimo della risposta corrisponde a circa0,000001515 €/kWh per singolo indice, oltre alle assunzioni di scomposizione. Non pubblicare le cifre decimali come precisione certificata AU.

## Verifiche indipendenti dalla scomposizione

1. Dicembre con tutti3000kWh inF3 restituisce **1009,06 €**, identico aF2: la bioraria usa un valore F23 comune, diversamente dal comportamento triorario della sonda SPECIAL.
2. Dicembre con tutti3000kWh inF1 restituisce **1087,73 €**. Dalla sonda SPECIAL del parent si prevedeva `1011,23 + (144−120) + (0,045−0,0275)×3000 =1087,73`. Conferma la coerenza di quota fissa, spread e indiceF1 tra due record di venditori diversi.
3. Distribuzione mensile uniforme250kWh F2 per dodici mesi: previsione media delle quattro vendite **880,9275 €**, Portale **880,93 €**.

## Holdout temporali registrati prima delle query

Distribuzione nuova: novembre600kWh, gennaio900, aprile1200, luglio300, tuttiF2. Nessuno di questi mesi coincide con i quattro mesi di calibrazione. Totale3000kWh.

| Offerta | Previsione non arrotondata, € | Portale, € | Scarto, € |
| --- | ---: | ---: | ---: |
| GIUSTA LUCE BIO DOMESTICA | 875,829 | 875,83 | +0,001 |
| ONDA BLUE LUCE2.0 | 759,474 | 759,47 | −0,004 |

La seconda offerta è `036329ESVFL01XXONDABLUE0EE202620`, indice12, tariffa91, quota fissa120 €, spread0,014215, dispacciamento14, senza sconti XML. La sua previsione differisce esclusivamente per `−24 + (0,014215−0,045)×3000`. Nessun rifit dopo le risposte. La tolleranza fissata prima era2centesimi; entrambe le prove sono compatibili entro mezzo centesimo.

## Cinque offerte domestiche Peak/OffPeak nell'export

I record tipo07 sono:

- `029878ESVFL03XX000000DOM8VAR8BIO`, DOMESTICO VARIABILE BIOM;
- `029878ESVFL03XX000002DOM2VAR2BIO`, DOMESTICO VARIABILE BIO;
- `029878ESVFL05XX000007DOM7VAR7BIO`, DOMESTICO VARIABILE BIO R;
- `024632ESVFL01XXSTDDOMVARPOP00007`, NOIENERGIA PUN INDEX GME DOMESTICA BIO;
- `030032ESVOL01XX0000000000E000041`, TARIFFA EV.

Tutti indicano riferimento12; gli spread utilizzano FASCIA_COMPONENTE07/08. Non è stato verificato in questa prova se il calcolatore usi ulteriori indici Peak/OffPeak, una trasformazione di F1/F2/F3 o altre convenzioni. **F23 non va rinominata OffPeak, né F1 Peak.** Questa è una frontiera distinta da qualificare, non coperta automaticamente dal risultato biorario.

## Evidenze e limite temporale

[Risultati numerici](./evidenze/sonda-au-biorario-2026-10-28/results.json), [predizioni precedenti alle query](./evidenze/sonda-au-biorario-2026-10-28/predictions-before-query.json), [manifest con checksum](./evidenze/sonda-au-biorario-2026-10-28/manifest.json), script e risposte HTML economiche sanificate nella stessa cartella.

Il test dimostra quattro gruppi temporali riutilizzabili nel calcolatore corrente e validati con nuovi mesi. Non distingue autonomamente la consegna Q4 2026 da Q4 2027, né dimostra l'acquisizione di dati per un quinto trimestre. La curva resta una deduzione da simulazioni, con provenienza e data da conservare separatamente dagli open data pubblicati.
