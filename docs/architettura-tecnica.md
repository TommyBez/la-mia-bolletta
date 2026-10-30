# Architettura tecnica concordata

Decisioni Q48–Q56 confermate nella discussione con l'utente il 29 ottobre 2026. Riferimento di prodotto: [specifica #6](https://github.com/TommyBez/la-mia-bolletta/issues/6). Questo documento fissa il disegno condiviso, non attesta implementazioni già eseguite.

## Moduli e interfacce

Un'applicazione Next.js modulare in TypeScript. Catalogo, scenario, bolletta/profilo e confronto hanno implementazioni indipendenti dai trasporti web/MCP e dall'orchestrazione Workflow. Le quattro operazioni condivise sono validazione del profilo, confronto, dettaglio dell'offerta e stato dei dati. Web mediante endpoint JSON, MCP mediante tool dedicati; import e scritture amministrative non sono tool pubblici. L'estrazione documentale è separata e solo web.

Il confronto è sincrono e stateless: profilo confermato e preferenze in ingresso, combinazione compatibile di versioni fissata per risultato/classifica/dettaglio. Nelle richieste successive si reinviano profilo e riferimenti alle versioni; non si persiste una sessione di confronto nel DB. Le prestazioni si verificano sui cataloghi reali prima di introdurre job per questa operazione.

## Persistenza e identità

Postgres su Neon per dati strutturati/versioni e Blob privato per originali. Identità, metadati ricercabili e validità sono relazionali; struttura economica normalizzata/validata in JSONB. Parametri, riferimenti e scenari sono insiemi versionati separati. Gli originali conservano hash e provenienza.

L'identità commerciale è COD_OFFERTA + PIVA_UTENTE. Validità, osservazioni delle acquisizioni e contenuto commerciale sono distinti. Riutilizzare dati invariati; una proroga non crea una nuova offerta commerciale. Gli aggiornamenti seguono gli stati previsti da AU: offerta attiva con campi limitati modificabili, non ancora attiva con correzioni più ampie, scaduta con riapertura tramite date. Variazioni economiche inattese sullo stesso codice già attivo richiedono verifica, senza normalizzarle silenziosamente come ordinaria evoluzione.

Drizzle gestisce schema, query e migrazioni; Zod valida i contratti e i dati normalizzati a runtime. I tipi statici non sostituiscono questa validazione. Lo schema di persistenza e i contratti di dominio hanno responsabilità distinte: non generare automaticamente una copia pubblica di ogni tabella.

## Formule e precisione

Componenti economiche come dati tipizzati interpretati da regole versionate: quote, prezzi unitari, indici/spread, scaglioni, periodi, sconti, coefficienti effettivi qualificati. Nessun codice eseguibile salvato nel DB. decimal.js per l'aritmetica economica; valori decimali esatti in persistenza/trasporto e arrotondamenti nei punti previsti dal metodo, non dai default della libreria. Le regole Q36–Q38 e le qualifiche economiche rimangono applicabili.

## Importazione

Cron attiva Workflow indipendenti per luce e gas. Passi: acquisizione/originali, normalizzazione in staging, controlli e pubblicazione transazionale. Tra passi solo riferimenti Blob, hash, identificativi, cursori e conteggi. Batch e concorrenza limitati; ogni step rispetta i limiti Functions. Idempotenza delle scritture e controllo contro pubblicazioni fuori ordine rimangono nell'applicazione, anche quando Workflow ripete uno step.

Lo script dei coefficienti resta manuale mensile e separato dall'applicazione: validazione, import atomico nel DB e lettura dello snapshot pubblicato. Nessuna simulazione del Portale nella richiesta di confronto utente.

## Verifica e ordine di lavoro

### Canale OCR confermato durante lo sviluppo

Il 29 ottobre l'utente ha precisato: Vercel AI SDK con accesso al modello vision mediante Vercel AI Gateway e autenticazione OIDC. Il progetto collegato riceve `VERCEL_OIDC_TOKEN` dal runtime Vercel; in locale si aggiorna con `vercel env pull`. Non sono richieste chiavi Google dirette. Il modello della famiglia Gemini Flash rimane soggetto alla verifica sul corpus e alla disponibilità effettiva nel catalogo Gateway. I costi sono registrati, senza introdurre un budget preventivo.

Vitest per moduli e integrazioni con Postgres isolato; Playwright per browser. Seam Q40 già concordati: profilo/versioni→confronto; documento→candidati/conferma; acquisizione→pubblicazione/lettura; percorsi completi web/MCP. Red→green una capacità alla volta, valori attesi indipendenti e verifiche reali della persistenza attraverso le interfacce. I test numerici non dipendono da React o dal runtime Workflow.

Versioni compatibili delle librerie fissate nel lockfile durante lo sviluppo e verificate con smoke test. Nessuna nuova soglia di spesa: costi monitorati secondo Q45. Limiti documentali Q46 e freschezza Q47 già confermati.

Frontiera di sviluppo: #7 catalogo/riferimenti, #8 coefficienti e #9 ingresso bolletta/manuale. #10 luce e #11 gas dopo #7/#8; #12 percorso completo dopo #9/#10/#11. Suddivisione e dipendenze restano quelle approvate.
