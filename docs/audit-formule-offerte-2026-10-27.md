# Copertura delle formule: frequenza e rilevanza economica

Audit del 27 ottobre 2026 per Q27 del [design del prodotto](./design-prodotto.md). Il criterio confermato è includere nella prima versione le formule frequenti **oppure** molto convenienti. La complessità tecnica, da sola, non motiva un'esclusione.

**Perimetro successivamente confermato, Q29:** la prima fase considera soltanto le offerte dichiarate simulabili dal Portale. Frequenza e rilevanza economica si valutano in tale universo; le offerte senza simulazione restano una possibile seconda fase. Le analisi dei canoni esterni agli XML restano ricerca conservata, non dipendenze della prima consegna. Un record dichiarato simulabile ma ambiguo per il nostro calcolo non diventa per questo fuori perimetro.

**Aggiornamento dopo l'approfondimento dei canoni:** i conteggi qui sotto riguardano gli XML ordinari. Il Portale pubblica anche offerte senza calcolo della spesa in pagine separate, dove sono stati verificati canoni reali. Lo zero nei campi XML non ne dimostra l'assenza dal Portale. La [sintesi aggiornata](./esito-approfondimenti-formule-2026-10-27.md) corregge la precedente proposta di considerarli soltanto teorici e riporta la qualifica dei casi ambigui.

**Perimetro delle fonti, Q28:** l'analisi usa gli open data del Portale e i tracciati/metodi ufficiali. Le verifiche sui siti dei fornitori, avviate prima del chiarimento dell'utente, sono state interrotte ed escluse dalla base documentale e dalle conclusioni. I conteggi e tutti gli esempi numerici qui conservati derivano dagli XML del Portale.

**Esito:** fasce e sconti sono diffusi; uno sconto percentuale, pur raro, cambia concretamente l'ordine relativo tra offerte reali. Scaglioni e validità temporali possono modificare il risultato di decine o centinaia di euro. Non c'è quindi evidenza per limitare il primo motore a quota fissa più prezzo uniforme. La convenienza dell'intero mercato non è ancora calcolata: le formule miste con dati ambigui restano da qualificare, non diventano automaticamente rinviabili.

## Fonte, perimetro e metodo

Sono stati scaricati i collegamenti effettivi dalla [pagina Open Data del Portale Offerte](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page), aggiornati al **27 ottobre**, senza presumere il nome del file. Fonti del conteggio: [XML luce](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml) e [XML gas](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml). Codifiche interpretate tramite le specifiche AU v5.0; esempi economici verificati sulle regole di calcolo v4.2. Documenti e checksum sono nel [manifesto](./evidenze/formule-2026-10-27/manifest.json); le corrispondenze sono nella [nota metodologica](./ricerca-metodo-copertura-formule-2026-10-27.md).

| Filtro cumulativo | Luce | Gas |
| --- | ---: | ---: |
| Record nei file ML, tutti codici unici | 3.626 | 2.830 |
| Domestici | 1.974 | 1.624 |
| Sottoscrivibili singolarmente | 1.941 | 1.587 |
| Cambio fornitore ammesso e validità nel giorno analizzato | **1.916** | **1.571** |
| P.IVA distinte nell'ultimo insieme | 328 | 303 |

Il filtro usa cliente `01`, offerta singola `SI`, almeno un'attivazione `01`/`99` e intersezione dell'intervallo di sottoscrivibilità con il giorno analizzato. PLACET e pacchetti congiunti sono esclusi secondo Q26. Non sono ancora applicati i requisiti di ogni specifico utente: territorio, consumi, potenza, residenza, pagamento e altre condizioni. Le frequenze descrivono codici pubblicati, non quote di mercato dei clienti o disponibilità per ogni famiglia italiana.

Le caratteristiche sono sovrapposte: una variabile può avere fasce, sconti e scaglioni insieme. Il [CSV](./evidenze/formule-2026-10-27/classification.csv) contiene tutti i **3.598 codici domestici**, inclusi quelli esclusi dai filtri successivi; il [riepilogo JSON](./evidenze/formule-2026-10-27/summary.json) contiene conteggi, fornitori e combinazioni. Non si sommano le percentuali per ottenere una copertura complessiva.

## Frequenze osservate

Denominatori: 1.916 luce e 1.571 gas.

| Caratteristica | Luce | Gas | Lettura |
| --- | ---: | ---: | --- |
| Prezzo fisso | 442 (23,1%) | 278 (17,7%) | Già richiesto nel primo percorso |
| Prezzo variabile | 1.474 (76,9%) | 1.287 (81,9%) | Già richiesto; fonti previsionali ancora da qualificare |
| Fasce orarie | 1.208 (63,0%) | — | Comprendono 1.103 triorarie, 100 biorarie, 5 peak/offpeak |
| Almeno uno sconto | 563 (29,4%) | 512 (32,6%) | Presenza strutturale, non diritto automatico allo sconto |
| Sconto dichiarato non condizionato, ingresso/entro 12 mesi | 223 (11,6%) | 197 (12,5%) | Nel gas 191 hanno importo non nullo; sei dichiarano 0% |
| Sconto percentuale, qualsiasi validità/condizione | 23 (1,2%) | 18 (1,1%) | Raro ma economicamente rilevante nell'esempio luce |
| Sconto con scaglioni di consumo | 13 (0,7%) | 23 (1,5%) | Base e condizioni vanno interpretate |
| Prezzi standard con scaglioni differenti | 9 (0,5%) | 9 (0,6%) | Alcuni record gas hanno intervalli sovrapposti da chiarire |
| Periodo di validità su prezzi standard | 15 (0,8%) | 8 (0,5%) | Solo un caso gas cambia valore rispetto al default |
| Periodo di validità sugli sconti | 14 (0,7%) | 13 (0,8%) | Distinto dalla finestra di sottoscrizione |
| Prezzo misto | 0 | 6 (0,4%) | Due P.IVA; formula non ricostruibile con certezza dai record |
| FLAT / onnicomprensivo / canone onnicomprensivo | 0 / 0 / 0 | 0 / 0 / 0 | Nessun caso strutturato negli XML; canoni reali presenti nelle pagine separate senza calcolo |
| Più indici o coefficiente diverso da 1 | 0 | 0 | Ammessi dallo schema, non osservati qui |

Il prezzo dichiarato uguale nelle fasce non basta a eliminare la distinzione: per le variabili può cambiare la componente indicizzata. Viceversa, un tag `PeriodoValidita` non prova che il prezzo cambi: nei 15 casi luce standard e in sette degli otto gas il valore specifico coincide col default. La distinzione fra componenti standard e opzionali è essenziale; i prezzi FER standard sono presenti in **333 offerte luce** e non vanno automaticamente sommati come un extra facoltativo.

Dettaglio verificabile: [relazione luce](./evidenze/formule-2026-10-27/audit-luce.md) e [relazione gas](./evidenze/formule-2026-10-27/audit-gas.md).

## Rilevanza economica: prove con offerte reali

Le prove seguenti misurano **componenti commerciali e differenze relative**, con consumi espliciti. Non sono bollette complete né classifiche nazionali. Non inventano una curva previsionale: nel confronto gas il termine PSV è identico e viene lasciato fuori da entrambi i subtotali.

### Uno sconto raro ribalta il confronto luce

A **2.700 kWh**, i record Plenitude Fixa Time 24 Smart e IREN LOCK&FIX riportano:

| Offerta | Prima degli sconti | Dopo gli sconti non condizionati del primo anno |
| --- | ---: | ---: |
| Plenitude: 144 €/anno + 0,2079 €/kWh; sconto energia 30% | 705,33 € | 536,931 € |
| Iren: 147 €/anno + 0,155 €/kWh; bonus 12 € | 565,50 € | 553,50 € |

Lo sconto percentuale incide per **168,399 € prima dell'IVA**. Ignorando gli sconti Plenitude supera Iren di 139,83 €; applicando quelli dichiarati non condizionati scende sotto di 16,569 € su questo subtotal. Iren richiede addebito e bolletta digitale; il 5% condizionato aggiuntivo di Plenitude non è applicato e non se ne presume il cumulo. Questo dimostra la rilevanza della formula anche con una frequenza dell'1,2%, senza dimostrare che queste siano le migliori offerte disponibili. Codici, campi e calcoli: [evidenza luce](./evidenze/formule-2026-10-27/electricity-examples.json).

### Anche il bonus gas cambia l'ordine

A **1.400 Smc**, con lo stesso PSV mensile e ipotesi di permanenza per dodici mesi:

| Offerta | Parte commerciale prima del bonus | Dopo il bonus |
| --- | ---: | ---: |
| Union Web PO: 144 €/anno + 0,075 €/Smc; bonus 144 € al dodicesimo mese | 249 € | 105 € |
| GASXPLUS: 60 €/anno + 0,055 €/Smc; bonus 20 € | 137 € | 117 € |

L'ordine si ribalta. Entrambi i record consentono il cambio fornitore, senza limiti territoriali o di consumo strutturati; la prova assume addebito, bolletta digitale e permanenza dodici mesi. Gli importi **escludono il costo dell'indice comune, rete, oneri e imposte**. Codici, condizioni e aritmetica: [evidenza gas](./evidenze/formule-2026-10-27/gas-examples.json).

### Scaglioni e periodi rari producono errori materiali se ignorati

- **IREN Prima Scelta Luce**, a 4.500 kWh: primi 3.000 a 0,1573 €/kWh, resto a 0,1903. Applicare il primo prezzo ovunque sottostima la sola quota energia di **49,50 € prima dell'IVA**.
- **Edison Dynamic Gas**, a 1.400 Smc: primi 700 a 0,055 €/Smc, resto a 0,11. Applicare sempre il default 0,11 sovrastima quella componente di **38,50 € prima dell'IVA**.
- **ALTIS26GAS**, a 1.400 Smc: una componente vale 0,095 €/Smc nei primi dodici mesi, con default zero. Ignorare il periodo omette **133 € di costo**, non un risparmio. L'offerta è limitata alla provincia di Belluno; non è una disponibilità nazionale.

Queste prove misurano l'effetto delle formule; non attestano la posizione delle offerte nella classifica completa. Gli scaglioni commerciali sono distinti dagli scaglioni regolati di rete e imposte gas, comunque obbligatori nel calcolo.

## Casi da qualificare, senza dedurne scarsa convenienza

Le **sei miste gas** hanno due intervalli fisso/variabile sovrapposti senza ripartizione chiara. I sei record risultano identici negli export del 26 e 27 ottobre. La loro interpretazione va verificata esclusivamente rispetto ai tracciati e metodi ufficiali; i siti dei fornitori non sono una fonte integrativa. I campi e i riferimenti ufficiali sono nella [nota metodologica](./ricerca-metodo-copertura-formule-2026-10-27.md#caso-concreto-sei-miste-gas-da-interpretare-con-le-fonti-ufficiali).

Sono inoltre emersi tre record gas con scaglioni sovrapposti, nove offerte classificate fisse con riferimento a un indice ancora presente (sette luce, due gas), e un caso in cui il testo dello sconto non coincide con il periodo strutturato. Vanno conservati e qualificati per calcolare quei record; non provano violazioni del venditore o errori nella classifica del Portale. Questo controllo puntuale dei campioni non implementa né rende prioritario un rilevatore automatico delle condizioni nascoste nelle note.

L'[approfondimento successivo](./qualifica-casi-formule-2026-10-27.md) risolve la scelta del ramo fisso per le nove offerte con indice e interpreta `DURATA=7` come primi sette mesi secondo il tracciato. Per gli scaglioni, il conflitto di prezzo si manifesta sopra 500 Smc. Una prova pubblica conferma che il Portale calcola una delle miste; resta da qualificare la riproduzione del trattamento degli intervalli coincidenti, non l'esistenza di un risultato ufficiale.

## Perimetro proposto sulla base dell'evidenza

1. **Includere fasce e sconti**, con importi fissi, percentuali, basi, durata e condizioni: frequenza ed esempi economici lo giustificano. Gli sconti dichiarati condizionati o oltre il primo anno non si sottraggono indiscriminatamente.
2. **Includere scaglioni commerciali e validità temporali**: non c'è una base economica per escluderli e ignorarli crea errori significativi. Le combinazioni reali devono avere casi di verifica.
3. **Verificare le miste sui tracciati e metodi ufficiali**: poche offerte e convenienza non determinabile non costituiscono una giustificazione per rinviare una formula. Se il singolo record resta ambiguo con le fonti ufficiali, dichiararlo non calcolabile con quei dati. Questo limite del record è distinto dal mancato supporto della famiglia e non introduce una dipendenza dai siti dei fornitori.
4. **Applicare Q29 anche ai canoni:** rate e canoni dichiarati simulabili rientrano nell'analisi della prima fase. I canoni individuati nelle pagine senza calcolo sono esclusi dalla prima consegna per decisione di perimetro, senza dedurne scarsa convenienza; ricerca e prove restano disponibili per una possibile seconda fase. Il tipo tecnico FLAT e le combinazioni di più indici restano non osservati negli XML; un'eventuale futura comparsa dichiarata simulabile richiede qualificazione del metodo corrente. Dettagli nella [sintesi aggiornata](./esito-approfondimenti-formule-2026-10-27.md).

Il criterio Q27 è confermato dall'utente; questa è la proposta concreta risultante dall'audit, non una specifica già approvata. Per affermare che una formula rara può essere esclusa per scarsa convenienza serve ancora il confronto completo, su profili e scenari, della migliore offerta disponibile con e senza quella famiglia. Un esito non determinabile resta aperto. Non è stata introdotta una soglia arbitraria di frequenza o risparmio.

Nel giorno precedente il perimetro era 1.931 luce e 1.570 gas. Fra i due file entrano/escono **26/41 codici luce** e **16/15 gas**. Il controllo conferma che la misura va associata alla versione del catalogo; non costituisce una serie storica sufficiente a stimare frequenze annuali.

## Riproducibilità e verifica

Nella [cartella delle evidenze](./evidenze/formule-2026-10-27/README.md) sono salvati cinque script di sola analisi, manifesto con URL/checksum, classificazione completa, conteggi e campioni economici. Sono stati rieseguiti dalla copia nel repository: lettura di tutti i 6.456 record, assenza di codici duplicati, filtri e calcoli Decimal verificati. Un controllo indipendente ha verificato le codifiche e gli esempi.

L'applicazione e il motore di confronto non sono stati implementati da questo audit. Il percorso rimane: chiudere l'intesa sul perimetro, `to-spec` con punti di verifica condivisi, `to-tickets` con dimensione e dipendenze approvate, poi sviluppo. La qualifica dei prezzi previsionali e degli altri riferimenti tariffari resta una dipendenza esplicita del percorso reale.
