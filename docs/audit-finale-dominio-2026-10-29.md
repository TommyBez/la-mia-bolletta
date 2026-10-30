# Audit finale del dominio prima di to-spec

29 ottobre 2026. Audit delle evidenze esistenti e tre nuove simulazioni mirate del Portale, senza siti dei fornitori. Non modifica le decisioni Q1–Q44, non pubblica ticket e non certifica un motore già implementato.

## Risultato operativo

Le decisioni di perimetro e le regole controversie principali sono chiuse. Non emerge una nuova scelta di prodotto da chiedere all'utente sul calcolo. La verifica tecnica residua riguarda soprattutto **Peak/OffPeak** e l'assemblaggio coerente dei riferimenti nazionali. Non sono ragioni per escludere offerte simulabili o ridurre la consegna.

Parte delle frasi «ancora da qualificare» nelle note del 27 ottobre descrive ricerca precedente, ormai superata: non riaprire minimo/primo, sei miste gas, IVA anomala, mese aggiuntivo o acquisizione automatica mensile.

## Matrice di chiusura

| Area | Evidenza / stato | Lavoro residuo e natura |
| --- | --- | --- |
| Periodo e prezzo previsionale | Q42–Q44: recupero implicito, script mensile manuale, DB, quattro trimestri dal corrente | Implementazione importazione/versioni/controlli; nessuna nuova scelta |
| PUN F0/F1/F2/F3/F23 e PSV | 24 coefficienti e holdout fra offerte/venditori in [recupero AU](./recupero-indici-au-2026-10-28.md) | Rendere ripetibile l'operazione mensile, controllare sonde scadute e indici necessari; criterio di accettazione |
| Periodicità PUN/PSV diverse | Tracciato v5 p53 nota7: i forward usati sono trimestrali, indipendentemente dalla periodicità di fatturazione | Normalizzazione dei codici 01/08/12 PUN e03/10/14 PSV; non inventare nuove curve |
| Psbil gas codice15 | Tracciato v5 p54 nota8: per la stima usa forward PSV | Riusare PSV secondo regola ufficiale, distinguendo l'indice contrattuale originale |
| PE05 e CMEM06 | Tracciato v5 p54 note9/10: solo in abbinamento a Sconto/PrezziSconto/TIPOLOGIA04. Regole v4.2 prevedono il ramo sconto su tutela con PUN/PSV e componenti regolate | Implementare il ramo e acquisire componenti regolate pertinenti. Non è automaticamente una previsione aggiuntiva mancante |
| Peak/OffPeak | Cinque record, tariffa07; tracciato v5 p56 nota14 definisce le due fasce standard dei mercati all'ingrosso e rinvia al Vademecum PCE | Semantica di trasformazione dei consumi e coefficienti specifici ancora da dimostrare. Non assimilare F1 a Peak o F23 a OffPeak |
| Quota fissa, uniforme, fasce, sconti, validità | Frequenze ed esempi Decimal nell'[audit formule](./audit-formule-offerte-2026-10-27.md); metodi AU documentati | Implementazione e regressioni con valori attesi indipendenti, non nuove decisioni |
| Scaglioni concorrenti / misti | Q32/Q37: minimo numerico, specifico prima default, variabile al pareggio; Q38: cumulato mensile midpoint | Verificare entrambe le permutazioni XML e soglie. È policy approvata, non lacuna aperta |
| IVA di Senza Pensieri | Q36: IVA normativa, anomalia osservata conservata come divergenza | Test specifico della divergenza; non riprodurre il difetto |
| Fisse con indice incoerente | Qualifica dei nove casi: ramo fisso non somma l'indice | Test del parser e calcolo, mantenere campo originale |
| Componenti opzionali fuori FER | Protecta Casa: regola opzionalità FER non si estende a quote01/04; formula documentale disponibile | Caso runtime/fixture di conferma puntuale; non azzerare arbitrariamente i costi |
| Rate costanti | NeN e Gelsia nell'XML hanno normali componenti fisse/variabili | Presentazione rata distinta dal costo e conguagli; implementazione |
| Canoni senza simulazione | Fuori fase1 per Q29 | Nessun blocco alla specifica della prima consegna |
| Canoni strutturati / FLAT nuovi | Zero nei campi strutturati del campione qualificato, metodi documentati ma tipo FLAT storico e lambda gas nel ramo variabile controversi | Il controllo di aggiornamento deve rilevare nuove famiglie e obbligare qualifica prima di attestare copertura; non dichiararle testate oggi |
| Profili gas nazionali | Regole v4.2 p45: C1 zoneB–F, C2, T1 per anno termico2026/27, percentuali mese ottobre–settembre | Estrazione e controllo somme/precisione/rotazione della finestra Q44; la fonte esiste già |
| Profilo luce convenzionale | Regole v4.2 p9: domestico33/31/36 in assenza dati; Q30 richiede proposta e conferma | Implementazione e validazione della conferma; non chiedere di scegliere percentuali nuove |
| Rete/oneri/IVA | CSV parametri ML luce e gas acquisiti; descrizioni ambiti/classi/scaglioni | Tipizzazione unità, efficacia, compatibilità con regole e versione; disponibilità del CSV non equivale a parser già completo |
| Accise e addizionali gas | Dettaglio ufficiale Imposte → Corrispettivi unitari acquisito per Milano e Pescara; CSV non contiene le aliquote | Assemblare una matrice nazionale e verificare rappresentatività/casi territoriali. Canale dimostrato puntualmente, copertura nazionale non ancora attestata |
| Comune e territorio | geoService pubblico verificato oggi: codIstat, denominazione, flag esclusioneEE/gas | Risolve identità del comune, non restituisce zona climatica/regione/ambito. Integrare tabelle ufficiali versionate |
| Contratto attuale | Q5 e contratto §3: facoltativo, dati bolletta/archivio ufficiale; nessun rinnovo inventato | Implementazione ricostruzione e stati di confrontabilità; nessuna domanda prodotto |

## Peak/OffPeak: prova che la lacuna non è solo un nome

Sonda reale `029878ESVFL03XX000002DOM2VAR2BIO`, DOMESTICO VARIABILE BIO: indice12, tariffa07, fisso144 €/anno, spread0,0242 identico per componenti07 e08, dispacciamento14. Nessuno sconto condizionato richiesto. Normale modulo pubblico, domestico residente, Pescara,3kW; totale3000kWh.

| Consumi annui F1/F2/F3 | Vendita osservata |
| --- | ---: |
| 1000/1000/1000 | 845,50 € |
| 3000/0/0 | 843,22 € |
| 0/0/3000 | 849,00 € |

Per il primo profilo la sonda trioraria SPECIAL produce821,29 €, fisso120 e spread0,0275. Un riuso diretto dei medesimi coefficienti triorari predirebbe `821,29 +24 +(0,0242−0,0275)×3000 =835,39`, diverso da845,50. Il dettaglio conferma tariffa07 e prezzi Peak/OffPeak, con calendario separato. Non si può quindi chiudere il caso rinominando le fasce o supponendo indiceF0 senza test.

Queste tre osservazioni **non identificano ancora** calendario esatto del mapping F1/F2/F3→Peak/OffPeak e quattro coefficienti per ciascuna fascia. La strada concreta è riusare la sonda mensile con controlli del profilo e recuperare coefficienti/mapping pertinenti, più un holdout su un secondo record. È lavoro tecnico dell'agente, non una decisione da demandare all'utente.

Le [risposte e checksum](./evidenze/audit-finale-dominio-2026-10-29/manifest.json) sono conservati. La configurazione visualizzata riporta Peak nei feriali e OffPeak sabato/domenica; gli intervalli testuali sono etichette del grafico, non sostituiscono una qualificazione delle ore di mercato e delle festività.

## Fonti nazionali: cosa è reperito e cosa resta da assemblare

1. **Profili di consumo:** [Regole di calcolo AU v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), p45. Il campione è già allineato ottobre2026–settembre2027; le precedenti prove novembre→ottobre non validano retroattivamente ogni scaglione sulla nuova finestra.
2. **Tariffe gas per ambito:** [pagina ARERA distribuzione/misura/oneri](https://www.arera.it/area-operatori/prezzi-e-tariffe/tariffe-di-distribuzione-misura-oneri-generali), [RTDG art43](https://www.arera.it/fileadmin/allegati/docs/22/RTDG_Alla___aggiornato_.pdf), più CSV ML del Portale. La RTDG esaminata riporta il periodo2020–2025: è fonte esatta del modello ambiti, non va dichiarata da sola prova di efficacia tariffaria2026. I CSV del Portale esaminati contengono valoriTAU1/TAU3 per ambiti/classi/scaglioni. Parsing e associazione al periodo restano da fare.
3. **Imposte gas:** [guida ARERA](https://www.arera.it/bolletta/guida-alla-lettura-delle-voci-di-spesa-gas) identifica accisa, addizionale regionale e IVA e chiarisce che l'addizionale varia per regione. La [pagina tabellare ARERA Imposte sul gas](https://www.arera.it/dati-e-statistiche/dettaglio/imposte-sul-gas), aperta oggi, etichetta Relazione annuale2023: non è stata spacciata per tabella vigente2026. Il canale corrente direttamente osservato è il dettaglio del calcolatore Portale, già [verificato per Milano](./verifica-calcolabilita-canoni-2026-10-27.md#fonti-fiscali-effettivamente-recuperabili). Per una matrice nazionale occorre coprire tutti i casi regionali e le differenze territoriali dell'accisa, non soltanto un comune per macroarea.
4. **Comune→zona climatica:** ARERA [rapporto436/2025, nota20](https://www.arera.it/fileadmin/allegati/docs/25/436-2025-I-com.pdf) rimanda esplicitamente all'AllegatoA del DPR412/1993 e successive modifiche. Il geoService del Portale non fornisce questo mapping nella risposta light verificata; la fonte normativa esiste, ma non è stata scaricata e riconciliata qui con tutte le fusioni comunali. Non inventare zona dalla sola provincia.

L'assenza di un unico CSV nazionale pronto non significa indisponibilità dei dati. L'importatore di riferimenti è una dipendenza concreta del costo completo, con controlli di efficacia e territorialità; la copertura non va attestata prima che il dataset sia costruito e verificato.

## Confine fra decisione, ricerca e sviluppo

**Non richiedono nuove approvazioni:** riuso indici periodicità/Psbil; uso dei profili ufficiali; parser di rete/oneri; acquisizione delle aliquote via fonti ufficiali; fixtures del periodoQ44; criteri numerici basati sugli arrotondamenti.

**Richiedono ancora un esito tecnico prima di promettere copertura completa:** Peak/OffPeak e matrice territoriale/fiscale nazionale. Sono indagini assegnabili all'agente o attività esplicite che bloccano l'accettazione del confronto nazionale completo. Una promessa generica «supporta tutte le simulabili» non risolve la semantica ignota né autorizza classifica parzialeQ32.

**Vere scelte dell'utente rimaste per il percorso:** nel dominio economico non ne emergono da questo audit. Provider infrastrutturali, limiti/budget OCR e eventuale gestione dei dati non disponibili appartengono ad altre verifiche; queste ultime devono rispettare Q24/Q34 già approvate. Non chiedere di nuovo se includere gas, variabili, bolletta, canoni non simulabili o rinnovi ignoti.

## Proposta operativa da decidere, non SLA misurato

Una finestra iniziale di48ore per utilizzare l'ultimo catalogo completo durante un guasto può essere proposta all'utente, entro validità ed efficacia dei dati, con ritardo visibile. È una policy provvisoria, non una soglia dimostrata dai soli campioni quotidiani27/28ottobre. Il semplice download ripetuto della stessa vecchia fonte non deve azzerare l'età dei dati: separare data della versione/pubblicazione fonte e `fetchedAt`.

Per i coefficienti AU, una policy coerente con l'aggiornamento mensile è richiedere uno snapshot del mese corrente e dei quattro trimestri pertinenti; il passaggio al nuovo mese non riutilizza automaticamente quello precedente. È una decisione di utilizzabilità da fissare; non affermare che i prezzi diventino matematicamente errati allo scoccare della mezzanotte né inventare un aggiornamento ufficiale già avvenuto. Le conseguenze devono rispettare Q24/Q34: nessun solo-fisso spacciato per confronto completo e nessun risultato precedente presentato come nuovo.

## Esiti successivi dell'indagine e passaggio ai ticket

Le due qualifiche individuate in questo audit sono state affrontate prima della pubblicazione del piano:

- [Peak/OffPeak](./qualifica-peak-offpeak-2026-10-29.md): operatore annuo effettivo per fingerprint,14verifiche più4controlli; cinque variabili e due delle otto fisse correnti verificate. Non sono otto curve trimestrali né un mapping fisico universale. Pipeline e controlli per ogni restante fingerprint sono criteri del ticket#8 prima del confronto luce#10.
- [Territorio/profili](./qualifica-riferimenti-territoriali-2026-10-29.md):7894comuni/regione/setteambiti, profiliAU, join climatico conservativo con eccezioni elencate e canale operativo verificato per comuni fusi/ambigui. [Fiscalità](./qualifica-fiscalita-gas-2026-10-29.md):32comuni/19regioni, subtotaliprogressivi e nuovi consumi verificati. Completare popolamento e riconciliazioni nazionali è un criterio del ticket#7, non una copertura esaustiva già acquisita.

Pubblicata la spec#6 e i ticket#7–#12 con sotto-issue e dipendenze native approvate/verificate. Non rimangono nuove domande di prodotto da trasferire all'utente; il lavoro tecnico e i relativi controlli sono espliciti nelle attività. Le proposte Q45–Q47 riportate sopra sono state risolte: costi monitorati senza budget preventivo, limiti documentali e freschezza approvati.
