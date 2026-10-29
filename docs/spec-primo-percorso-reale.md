# Primo percorso completo con dati reali — specifica

Stato: **specifica pubblicata con to-spec**, 29 ottobre 2026: https://github.com/TommyBez/la-mia-bolletta/issues/6. Sei attività pubblicate con to-tickets (#7–#12), con sotto-issue e dipendenze native verificate. Q1–Q56, punti di verifica Q40 e suddivisione in sei attività con dipendenze sono confermati dall'utente; Q44 sostituisce il periodo originario Q23. Q42 stabilisce il recupero implicito dal Portale come strada principale e conserva GME + Q39/Q41 come ripiego. Popolamento dei riferimenti, controlli dello scenario e implementazione sono lavoro dei ticket, non capacità già presenti nella worktree.

## Problem Statement

Una persona con una bolletta domestica luce o gas vuole capire se conviene cambiare offerta, quanto potrebbe spendere e quali condizioni deve rispettare. Il confronto richiede dati aggiornati, consumi corretti e ipotesi coerenti. Il prototipo e i risultati sintetici non consentono ancora questo percorso su dati reali.

## Solution

Prima consegna interna gratuita: caricare una bolletta o inserire i dati, confermarli, confrontare le offerte domestiche singole del mercato libero dichiarate simulabili dal Portale, ricevere il consiglio nella direzione A ed esplorare alternative e dettagli. Luce e gas, prezzi fissi e variabili sono compresi. Lo stesso confronto è disponibile via MCP con dati già estratti dal client. Un catalogo quotidiano versionato, uno scenario esplicito e regole condivise rendono ogni risultato verificabile.

## User Stories

1. Come utente domestico, voglio iniziare dalla luce o dal gas, per usare il servizio con una sola bolletta.
2. Come utente, voglio caricare un PDF nativo, una scansione o foto JPG/PNG, per partire dal documento che possiedo.
3. Come utente, voglio usare più pagine o foto della stessa bolletta, per includere tutti i dati necessari.
4. Come utente, voglio inserire manualmente i dati, per proseguire quando il documento non è utilizzabile.
5. Come utente, voglio vedere i campi estratti e i dati dubbi, per correggerli prima del confronto.
6. Come utente, voglio distinguere consumo annuo e consumo del periodo fatturato, per non basare la stima su una quantità sbagliata.
7. Come utente, voglio ricevere richieste puntuali per i dati mancanti, per completare soltanto ciò che serve.
8. Come utente, voglio confermare comune, consumi e caratteristiche della fornitura, per controllare il profilo utilizzato.
9. Come utente, voglio confrontare senza creare un account, per completare il percorso subito.
10. Come utente, voglio conoscere il periodo convenzionale della stima, allineato ai quattro trimestri del Portale, per comprendere a cosa si riferiscono i costi anche quando il trimestre è già iniziato.
11. Come utente, voglio confrontare offerte fisse e variabili, per valutare costo e stabilità del prezzo dell'energia.
12. Come utente che preferisce il fisso, voglio che il consiglio rispetti la preferenza, per vedere alternative adatte alla mia scelta.
13. Come utente, voglio confermare requisiti e disponibilità ai metodi di pagamento, per ricevere offerte alle quali posso aderire.
14. Come utente, voglio riconoscere offerte e sconti condizionati, per non considerare certo un beneficio non confermato.
15. Come utente, voglio vedere il costo annuo comprensivo delle componenti dovute, per confrontare l'intera fornitura.
16. Come utente, voglio un consiglio motivato nella direzione A, per capire quale scelta valutare prima della classifica.
17. Come utente, voglio il risparmio rispetto al contratto attuale quando ricostruibile, per valutare un vantaggio omogeneo.
18. Come utente con contratto attuale incompleto, voglio comunque vedere le alternative, per proseguire senza un risparmio inventato.
19. Come utente con un contratto competitivo, voglio ricevere anche un consiglio di restare, per evitare un cambio senza vantaggio.
20. Come utente, voglio vedere le ipotesi dei prezzi futuri e gli scenari disponibili, per comprendere quando il vantaggio cambia.
21. Come utente, voglio distinguere media mensile e rata commerciale, per non scambiare una media per una bolletta promessa.
22. Come utente, voglio correggere il profilo e ottenere un nuovo risultato, per confrontare con i dati aggiornati.
23. Come utente, voglio evitare risultati superati dopo una modifica, per non scegliere su una richiesta precedente.
24. Come utente, voglio aggiungere l'altra fornitura durante il percorso, per mantenere indipendenti luce e gas.
25. Come utente, voglio un totale complessivo soltanto con risultati compatibili, per non sommare periodi o scenari incoerenti.
26. Come utente, voglio esplorare classifica e scheda dell'offerta, per verificare requisiti, durata, costi e codice.
27. Come utente, voglio raggiungere il collegamento ufficialmente disponibile del fornitore, per proseguire la sottoscrizione esterna.
28. Come utente, voglio motivi e date quando i dati non sono utilizzabili, per distinguere mancanza di risultati da un guasto.
29. Come utente da telefono o tastiera, voglio completare ogni passaggio, per usare il servizio senza ostacoli di navigazione.
30. Come utente di un client MCP, voglio confrontare dati già estratti dal client, per ottenere lo stesso risultato della web app senza inviare il documento al tool.
31. Come verificatore interno, voglio ricondurre un risultato a profilo, fonti, catalogo, regole e scenario, per riprodurre ogni importo.
32. Come verificatore interno, voglio conservare privatamente i documenti della prima versione, per controllare l'estrazione senza introdurre una cronologia anonima recuperabile.
33. Come verificatore interno, voglio controllare gli aggiornamenti quotidiani e i relativi errori, per sapere quale catalogo è effettivamente pubblicato.
34. Come utente, voglio che un guasto dell'aggiornamento non pubblichi dati parziali, per consultare una versione identificabile e coerente.
35. Come utente, voglio un confronto basato solo sulle fonti ufficiali concordate e su dati gratuiti, per riconoscerne provenienza e assunzioni.
36. Come operatore interno, voglio lanciare manualmente lo script mensile e importare coefficienti validati nel DB, per aggiornare lo scenario senza eseguire simulazioni del Portale nel percorso utente.
37. Come operatore interno, voglio che un'importazione dei coefficienti incompleta o incoerente non sostituisca lo snapshot pubblicato, per conservare una versione identificabile e controllare il motivo del rifiuto.

## Implementation Decisions

- Ambito: domestiche nazionali, cambio fornitore su utenze attive senza cambio intestatario, offerte singole ufficialmente simulabili; esclusi PLACET, dual fuel e offerte senza simulazione. Le formule frequenti o economicamente rilevanti restano comprese anche quando complesse.
- Fonti delle offerte e relativi metodi: Portale Offerte/AU/SII/ARERA; nessuna integrazione delle condizioni economiche dai siti dei fornitori. I collegamenti dei record servono al passaggio esterno, non a correggere i dati.
- Catalogo Q48: Cron avvia Vercel Workflow indipendenti per fornitura; step di acquisizione, staging, controlli e pubblicazione. Operazioni idempotenti e batch limitati, riferimenti Blob tra step e transazione finale nel DB. Acquisizione quotidiana idempotente, originali e manifesti, normalizzazione, qualifica e pubblicazione atomica per fornitura; versione precedente conservata su errore. Compatibilità dei parametri verificata, non dedotta dalla sola data del file.
- Q52: identità commerciale per COD_OFFERTA+PIVA_UTENTE; validità e osservazioni acquisite distinte. Contenuti invariati riutilizzati. Aggiornamenti ammessi secondo stato nel processo AU; modifiche economiche inattese su offerte attive segnalate per verifica, senza trattarle come normale nuova offerta dello stesso codice. I riferimenti storici conservano i dati osservati e gli originali, non inventano nuove identità commerciali.
- Q50/Q51: metadati e versioni relazionali, componenti economiche normalizzate e validate in JSONB, XML originali in Blob privato; parametri e scenari separati. Il motore interpreta componenti tipizzate con regole versionate, senza codice eseguibile nel DB. Precisione decimale preservata e arrotondamenti nei punti previsti.
- Q53: confronto sincrono e stateless sul server con input confermato e combinazione compatibile di versioni fissata per risultato/classifica/dettaglio; nessun profilo o sessione di confronto persistito nel DB. Prestazioni da verificare sul catalogo reale.
- Calcolo e ammissibilità in un modulo condiviso indipendente dalla presentazione. Gli adattatori web e MCP non duplicano formule, ordinamento o raccomandazione.
- Riferimenti nazionali: anagrafica ISTAT, regioni e sette ambiti gas da RTDG corrente; profili di consumo dalla guida AU. Conservare codice comune attuale e codice restituito dal Portale come identificativi distinti con corrispondenza versionata. Fusioni e nomi ambigui non si risolvono per somiglianza. Un profilo operativo gas dedotto dalla vendita del Portale rimane distinto dalla classificazione climatica normativa.
- Fiscalità: acquisire le aliquote ufficialmente esposte per codice comune e deduplicare solo dopo l'acquisizione; non estendere aliquote del capoluogo a tutta la regione. Fonte, data osservazione ed efficacia normativa eventualmente disponibile sono distinte. Il completamento del dataset nazionale e le riconciliazioni residue sono criteri dell'importatore, senza attestare copertura già materializzata.
- Peak/OffPeak: calendario dei mercati all'ingrosso distinto da F1/F23. Per le famiglie osservate si qualificano coefficienti annui effettivi attraverso sonde pubbliche e controlli su nuovi profili; si conservano firma economica/versione dell'offerta, componenti comprese, dominio di validità e incertezza. Non chiamarli indici AU trimestrali o sommare nuovamente spread/dispacciamento già inclusi. Nuovi record, prezzi diseguali o componenti regolate richiedono controlli dedicati: l'attività scenario deve completarli prima che il confronto luce sia accettato. Nessun ramo del motore hardcoded sul codice di una singola offerta e nessuna estensione oltre i casi verificati.
- Profilo confermato: comune univoco, consumo annuo e periodo/unità, caratteristiche luce o gas, provenienza e requisiti. Nessuna annualizzazione arbitraria, nessuna unità o caratteristica inventata. I dati mancanti generano una richiesta esplicita.
- Contratto attuale facoltativo: ricostruzione per l'intero periodo usando bolletta e archivio ufficiale pertinente. Senza condizioni sufficienti, alternative disponibili e risparmio assente. Il prezzo dopo la scadenza delle condizioni non viene prolungato automaticamente.
- Periodo comune Q44: quattro trimestri solari dal primo giorno del trimestre corrente alla data della simulazione, come il Portale. Esempio: consultazione a ottobre 2026 → 1 ottobre 2026–30 settembre 2027. È una finestra convenzionale di confronto, non una promessa sulla data di attivazione. Catalogo, parametri, regole e scenario sono versionati e associati al risultato e ai suoi dettagli.
- Intervalli: specifici prima del fallback; fra concorrenti applicabili minimo numerico del prezzo; a parità numerica fra fisso e variabile preferire variabile mantenendo l'indice. La regola non sceglie il costo annuo minimo fra formule differenti e non dipende dall'ordine XML.
- Scaglioni commerciali gas: scelta mediante cumulato a metà mese, prezzo applicato al mese intero secondo il metodo sperimentale approvato; imposte e componenti regolate mantengono i propri metodi.
- IVA: formule fiscali ufficiali corrette; anomalia osservata di Senza Pensieri documentata come divergenza nota, non riprodotta per ottenere parità artificiale.
- Prezzi previsionali, Q42/Q43: dati gratuiti; script separato dall'applicazione, lanciato manualmente una volta al mese, per il recupero dei coefficienti impliciti dalle simulazioni del Portale, con distribuzioni mensili sintetiche, scomposizione delle componenti note e verifiche su profili/offerte separati dalla calibrazione. Versionare sonde, input, risposte, metodo, incertezza, copertura e stato. Sono valori dedotti, non un file AU pubblicato. Importare nel DB uno snapshot validato e versionato; l'applicazione e MCP leggono la stessa versione senza eseguire le sonde. Lo scenario non viene dichiarato completo se mancano indici/fasce o mesi necessari. Q44 allinea il periodo ai quattro trimestri del Portale ed elimina il precedente mese aggiuntivo.
- Ripiego Q39/Q41, se il recupero dal Portale non diventa utilizzabile e operativo: prezzi GME trimestrali preferiti, mensili per mesi altrimenti scoperti; proporzioni mensili F1/F2/F3 dal mese corrispondente nei dodici consuntivi completi più recenti, normalizzate al baseload con ore future delle fasce. Conservare F2/F3 distinte e derivare F23 dalle ore, senza usare i consumi personali per costruire prezzi di mercato. Dichiarare la nostra elaborazione e il metodo effettivamente utilizzato, identico per web/MCP; nessun fallback o riempimento di buchi non tracciato. Parsing completo, calendario, casi limite e backtest rimangono criteri di verifica.
- Scenario gas: normalizzazione da EUR/MWh a EUR/Smc mediante fattore 0,0107 al riferimento convenzionale P = 0,03852 GJ/Smc, con fattore, convenzione energetica, fonte e versione conservati. Nessuna conversione ulteriore del volume già in Smc; nessuna promessa di identità fra prezzo GME elaborato e indice contrattuale di altro editore.
- Estrazione web: Vercel AI SDK con modello vision tramite Vercel AI Gateway e autenticazione OIDC (canale confermato il 29 ottobre); Gemini Flash candidato da qualificare. Output come candidati con evidenze, campi assenti/ambigui e conferma umana obbligatoria; stesso profilo normalizzato per ingresso manuale e MCP. Nessun OCR server-side nel tool MCP.
- Infrastruttura Q49 confermata: Postgres su Neon per dati/versioni/job, archivio Vercel Blob privato per originali, deployment interno protetto con Vercel Authentication e accesso MCP automatizzato autorizzato. Riutilizzare risorse esistenti quando compatibili; account e configurazioni effettive da verificare in implementazione. Upload diretto al Blob, controlli server prima dell'estrazione e nessuna credenziale esposta nel browser.
- Prima consegna interna su Vercel; documenti e fonti persistiti privatamente, stato anonimo del percorso in memoria e non recuperabile dopo ricaricamento/chiusura. Provider e configurazione devono essere verificati sul canale reale.
- Luce e gas indipendenti, revisioni dei profili e risposte tardive gestite; totale completo soltanto con risultati compatibili. Assenza di offerte ammissibili, dati mancanti e guasto operativo sono esiti distinti.

- Q45: misurare e rendere consultabili i costi per provider e operazione, incluse estrazioni/retry, token, archivio e consumi infrastrutturali; nessun budget preventivo o blocco su soglia monetaria mensile. I tetti50EUR e20USD della proposta sono superati.
- Q46: PDF fino a10MB/20pagine oppure fino a10foto JPG/PNG,10MB per foto e30MB complessivi; documento oltre limite → messaggio esplicito e percorso manuale, senza pagine troncate silenziosamente.
- Q47: ultimo catalogo valido con avviso fino a48ore dalla data/versione fonte utilizzabile, entro validità di offerte/parametri; poi sospendere i consigli interessati. Snapshot indici del mese corrente, coerente con i quattro trimestri. Nessuna sostituzione silenziosa o rinnovo di freschezza riscaricando file vecchi.

- Q54: Drizzle per schema/query/migrazioni Postgres; Zod per contratti e JSONB normalizzato con validazione runtime; decimal.js per calcoli economici. Versioni compatibili fissate nel lockfile, conservando decimali nei trasporti e nella persistenza.
- Q55: quattro operazioni condivise: validazione del profilo, confronto, dettaglio dell'offerta e stato dei dati. Adapter web via endpoint JSON e adapter MCP via tool dedicati richiamano lo stesso modulo. Estrazione solo web; nessun import amministrativo nei tool MCP.

## Testing Decisions

Punti di verifica approvati in Q40 e strumenti confermati in Q56: Vitest per moduli e integrazioni con Postgres isolato, Playwright per browser. Sviluppo red→green con casi osservabili ai seam concordati. Verificare comportamento osservabile e risultati, senza vincolare i test alla struttura privata dei moduli.

1. Confronto: profilo confermato e versioni note producono risultati numerici, ammissibilità e consiglio verificati mediante casi indipendenti. Parità fra web e MCP a parità di input/versioni.
2. Catalogo: acquisizione → pubblicazione/lettura/stato. Originali ufficiali congelati, download mancanti o corrotti, correzione a URL invariato, aggiornamenti concorrenti e indipendenza luce/gas. Nessun catalogo parziale leggibile.
3. Estrazione: documento → candidati e problemi → conferma. Corpus annotato comprendente PDF nativi, scansioni, foto, bolletta multipagina e doppia fornitura; distinguere annuo da consumo del periodo, unità e dati mancanti. Misurare errori, costo, latenza e limiti sul canale reale. Non attestare tali misure prima dell'esecuzione.
4. Integrazione: browser da caricamento/manuale a risultato A, classifica, dettaglio e collegamento controllato; equivalenza MCP, telefono/tastiera, modifiche concorrenti, contratto attuale incompleto e fonti non utilizzabili. I test non attivano contratti di energia.
5. Metodi: fixture di fasce, scaglioni, validità, sconti, miste, componenti regolate, territori e fiscalità; prezzo minimo in entrambi gli ordini, pareggio fisso/variabile, specifico contro default e soglie mensili gas.
6. Confronto con il Portale: distinguere metodo, periodo, prezzi previsionali e anomalia IVA. Definire le tolleranze in base a precisione e arrotondamenti documentati; non introdurre una soglia arbitraria che nasconda errori. La media implicita ricavata dalle prove non viene presentata come curva forward ufficiale.
7. Coefficienti mensili: script separato → controlli indipendenti → importazione atomica → lettura dello stesso snapshot da web/MCP. Verificare errori, record mancanti, sonde scadute, versioni importate fuori ordine e cambio di trimestre. Il semplice inserimento di numeri nel DB non dimostra che lo scenario sia valido.
8. Copertura nazionale: inventario esplicito delle formule osservate, inclusi Peak/OffPeak, con casi numerici indipendenti per ogni semantica qualificata. Matrice dei riferimenti territoriali, fiscali e dei profili ufficiali con fonte/versione/efficacia; casi di confine tra ambiti e regimi. Le famiglie ancora da qualificare sono prerequisiti dichiarati del calcolo completo, non esclusioni implicite delle offerte simulabili.

In questa worktree non sono state individuate suite di dominio/end-to-end o moduli OCR/catalogo/calcolo/MCP già implementati. Le prove del prototipo e gli script di ricerca sono precedenti da riusare come evidenze, non certificazione del percorso reale.

## Out of Scope

- Rilascio pubblico in questa prima consegna interna; condizioni operative pubbliche restano da qualificare prima di aprirla.
- Account applicativi, cronologia anonima recuperabile, profili salvati, notifiche e sincronizzazione fra dispositivi.
- Voltura, subentro, nuova attivazione; PLACET, pacchetti dual fuel e offerte non simulabili.
- Aggregazione di più bollette della medesima fornitura, sottoscrizione in app, analisi automatica delle condizioni nascoste nelle note.
- Dati energetici a pagamento o condizioni ricavate dai siti dei fornitori.
- Promessa di identità numerica con il Portale o di importi futuri garantiti.

## Further Notes

- La suddivisione in sei attività è approvata: catalogo/riferimenti, scenario mensile e ingresso bolletta/manuale possono partire in parallelo; confronto luce e gas dipendono dai primi due e procedono in parallelo; percorso completo A dipende da ingresso e due confronti. Nessun blocco aggiuntivo o dipendenza fittizia dalla precedente tranche sintetica.
- Le qualifiche del 29 ottobre hanno materializzato7.894comuni/regione/ambito, sette profili AU e casi fiscali verificati per32comuni di19regioni. Non equivalgono a copertura climatica/fiscale esaustiva: eccezioni, codici storici e popolamento rimanente fanno parte dei criteri di accettazione del catalogo. Le prove Peak hanno separato casi ordinari/regolati e rilevato nuove fisse nell'export successivo; la pubblicazione dello scenario richiede verifiche sul catalogo effettivo, non solo sul campione storico.

- Controllo del 29 ottobre: [chiusura della specifica](./chiusura-specifica-2026-10-29.md), con Q45 corretta dall’utente e Q46/Q47 approvate, audit di dominio e prerequisiti tecnici espliciti.

- Decisioni e cronologia: [design del prodotto](./design-prodotto.md).
- Contratti proposti e stato della qualifica: [primo percorso reale](./contratti-primo-percorso-reale.md).
- Acquisizione e manifesti: [design ingestion](./design-ingestion.md).
- Direzione visuale e precedente tranche sintetica: [specifica A](./spec-risultati-a.md), issue #1 e ticket #3–#5. Queste attività non comprendono il nuovo percorso dati e vanno raccordate al nuovo backlog senza dichiararle completate.
- La priorità dello scenario è chiusa con Q42: recupero implicito dal Portale, GME + nostra stima come ripiego. Q43 prevede lancio manuale mensile dello script e importazione DB, Q44 allinea il periodo al Portale. Restano esplicite le verifiche operative e le dipendenze dal canale dati; la conversione gas GME è documentata nella relativa qualifica. Non dichiarare disponibili dati o permessi non ancora verificati.
