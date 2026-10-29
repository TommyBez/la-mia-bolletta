# Conversione dei prezzi gas GME nello scenario di confronto

Verifica del 27 ottobre 2026. Solo fonti ufficiali GME e ARERA, senza account, costi o contatti. Le ricerche hanno restituito anche risultati di fornitori, che non sono stati aperti o usati come evidenza.

## Esito per la specifica

La normalizzazione dello scenario gas al riferimento comparabile **P = 0,03852 GJ/Smc** è tecnicamente qualificata. Per un prezzo energetico in EUR/MWh:

`prezzo_riferimento_EUR_Smc = prezzo_EUR_MWh × (0,03852 / 3,6) = prezzo_EUR_MWh × 0,0107`.

Il valore 0,0107 non è un parametro da chiedere all'utente e non va appreso dalle bollette. È il fattore del riferimento convenzionale scelto per confrontare le offerte. Questo chiude la conversione di unità dello scenario normalizzato; **non dimostra che i prezzi di controllo MT-GAS coincidano con le quotazioni dell'indice contrattuale PSV/ICIS o con i forward AU**. Quella è una distinta qualifica economica della fonte.

## Catena delle fonti

- Le [regole Portale Offerte v4.2, 5 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), appendice p. 47, descrivono CCR e QT per PCS pari a 0,03852 GJ/Smc. È il riferimento già letto nei parametri del progetto; da solo non viene usato per presumere identità fra qualunque indice o contratto.
- La [pagina corrente delle DTF MGAS](https://www.mercatoelettrico.org/it-it/Home/Accesso-ai-Mercati/Gas/M-GAS/Regole/DTF-M-GAS) collega la [DTF 03 rev. 01, pubblicata il 10 gennaio 2018](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20171121_DTF3rev1MGAS.pdf). Il §2, p. 2, definisce EUR/MWh con tre decimali per i prezzi MGAS e comprende MT-GAS. Il documento è stato scaricato e letto; il suo nome file non è la data di pubblicazione indicata sulla copertina.
- Il [Codice di condotta commerciale ARERA, testo valido dal 1 gennaio 2025](https://www.arera.it/fileadmin/allegati/docs/18/CCC25.pdf), art. 5.1 e–f, p. 7, usa P = 0,03852 GJ/Smc e C = 1 per presentare i corrispettivi gas. I facsimili della spesa annua, pp. 45 e 48, riportano lo stesso riferimento. Si cita questa edizione effettivamente letta, senza dichiararla automaticamente l'ultima versione vigente.
- La [pagina ARERA consultata oggi sul servizio di tutela della vulnerabilità](https://www.arera.it/consumatori/valori-vulnerabilita-gas) riporta ancora il riferimento P = 0,03852 GJ/Smc accanto al prezzo per consumi di settembre 2026. È un riscontro corrente del riferimento, non una fonte di tariffe da applicare indiscriminatamente alle offerte libere.
- Il [comunicato ARERA del 4 aprile 2023](https://www.arera.it/comunicati-stampa/dettaglio/it/com-stampa/23/230404) descrive la CMEM come media PSV day ahead e pubblica insieme 12,938944 EUR/GJ, 46,5802 EUR/MWh e 0,498408 EUR/Smc al PCS di riferimento. È un controllo numerico ufficiale diretto: `46,5802 × 0,0107 = 0,49840814`, arrotondato a sei decimali **0,498408**.

Il PDF ARERA indicizzato come edizione in vigore dal 1 aprile 2026, con percorso `366-18_Allegato_A_in_vigore_dall_1_aprile_2026.pdf`, ha restituito “File non disponibile” sia tramite lettura web sia con curl. Non è trattato come documento scaricato o verificato integralmente.

## PCS convenzionale, PCS cliente e coefficiente C

Lo scenario del comparatore deve dichiarare la propria base energetica. Il **PCS P** associa energia a uno Smc; il **coefficiente C** converte il volume del contatore in volume standard. Non sono la stessa conversione e non vanno moltiplicati entrambi per una quantità che è già espressa in Smc.

La bolletta può riportare un PCS locale differente. Non sostituirlo silenziosamente a quello convenzionale dello scenario, né applicare due volte un adeguamento già contenuto nei prezzi o nei consumi. L'eventuale ricostruzione personalizzata del contratto attuale deve preservare la base e i fattori effettivamente dichiarati dalle condizioni ammesse; il confronto deve restare omogeneo. Se il valore OCR è in m³ e manca il parametro necessario alla conversione in Smc, resta un dato da completare secondo Q30.

## Controllo su convenzioni differenti

Un [contratto P-GAS Royalties pubblicato da GME](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250925CondizioniDiFornitura.pdf), §6, distingue GJ(15°C) e MWh(25°C), con un fattore 1,001 nella relativa conversione. È una convenzione esplicita di quel prodotto, non una disposizione della DTF MT-GAS che autorizzi ad aggiungere automaticamente 1,001 al nostro fattore 0,0107.

L'adapter deve quindi conservare prodotto e convenzione energetica della fonte. Se un futuro canale presenta un'unità o una base termica diversa, occorre una trasformazione documentata prima della normalizzazione; non si ricava dalla sola etichetta “gas”. I dati MGAS EUR/MWh e i corrispettivi normalizzati al riferimento ARERA possono essere rappresentati nello scenario come una nostra elaborazione dichiarata, senza promettere identità con l'indice di un altro editore.

## Esempi sullo snapshot GME già acquisito

Applicando il fattore ai contratti selezionabili secondo Q39:

| Consegna | EUR/MWh | EUR/Smc di riferimento |
| --- | ---: | ---: |
| novembre 2026 | 85,760 | 0,9176320 |
| dicembre 2026 | 84,159 | 0,9005013 |
| Q1 2027 | 86,302 | 0,9234314 |
| Q2 2027 | 70,490 | 0,7542430 |
| Q3 2027 | 74,423 | 0,7963261 |
| Q4 2027 | 72,694 | 0,7778258 |

Sono elaborazioni dello [snapshot conservato](./evidenze/gme-2026-10-26/control-prices-snapshot.json), non nuove osservazioni di mercato né quotazioni AU. Il controllo dimensionale e quello numerico ARERA sono stati eseguiti con aritmetica decimale, senza arrotondamenti intermedi; l'arrotondamento del costo finale resta governato dal motore.

## Contratto minimo e punti ancora distinti

Per ogni conversione conservare valore/unità originali, contratto e consegna, sessione della fonte, data di acquisizione, base energetica conosciuta, PCS di riferimento, fattore 0,0107, valore normalizzato e versione del metodo. Non convertire trattini o prezzi assenti in zero.

Non emerge una nuova decisione di prodotto necessaria sul fattore convenzionale. Restano le dipendenze già individuate: qualificazione dei prezzi di controllo come scenario del nostro confronto, uso consentito e canale di acquisizione sistematica, politica di freschezza. La conversione non risolve tali dipendenze e non rende una serie GME un indice contrattuale ICIS.
