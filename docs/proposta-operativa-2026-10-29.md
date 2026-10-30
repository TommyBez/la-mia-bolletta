# Proposta operativa per il primo percorso reale — 29 ottobre 2026

**Stato aggiornato dopo Q45–Q47:** costi monitorati senza budget preventivo; limiti documentali e politica di freschezza approvati. Architettura e dettagli tecnici restano proposte da implementare/verificare, non servizi configurati. Verifica documentale corrente; nessun provisioning, account, credenziale, modello invocato o costo attivato. Non cambia Q1–Q44: dati energetici gratuiti, Vercel, AI SDK + vision, documenti conservati privatamente senza cancellazione automatica, nessun account applicativo/sessione anonima ripristinabile; coefficienti importati con script manuale mensile e catalogo quotidiano separati.

## Scelta tecnica raccomandata

**Q49 confermata:** Postgres su Neon e Vercel Blob privato. **Q48 in valutazione:** Vercel Workflow per import, senza automatizzare il recupero mensile dei coefficienti.

| Elemento | Proposta minima | Motivo e confine |
| --- | --- | --- |
| Hosting | Progetto Vercel Pro; Functions Node nella stessa area europea del DB | Il piano preciso e la configurazione disponibili nell'account non sono stati letti. Nessun upgrade automatico autorizzato. |
| Dati strutturati | Neon Postgres, inizialmente piano Free, accesso pooled/serverless; migrazioni SQL versionate tramite Drizzle | Catalogo, componenti normalizzate, riferimenti, manifesti, snapshot indici, registri import e job OCR. Pubblicazione transazionale; no database per istanza di Function. |
| File | Vercel Blob **privato**, originali bollette e fonti ufficiali; riferimenti e SHA256 nel DB | File separati dal DB, deduplicazione per digest per fonti uguali, versioni esplicite. Nessuna URL pubblica delle bollette. Nessuna cancellazione automatica. |
| Accesso prima consegna | Vercel Authentication davanti al deployment interno su URL preview protetto | La prima consegna usa un URL preview protetto, senza esporre un dominio pubblico production non protetto. Gli operatori/tester accedono tramite il controllo del deployment; non si sviluppano account dell'applicazione. Il gate di infrastruttura non salva il profilo anonimo. |
| MCP interno | Stesso motore/API, accesso automatizzato al deployment protetto mediante il meccanismo ufficiale di bypass e segreto nel client autorizzato | Verificare con il client effettivo la trasmissione dell'header; non esporre il segreto nel browser, nei tool results o nei log. No OCR MCP. |
| OCR | AI SDK, provider Google diretto `@ai-sdk/google`, candidato `gemini-3.8-flash` tramite Gemini Developer API a pagamento | Nessun AI Gateway necessario per questo primo flusso. Modello, versione SDK, prompt/schema e parametri registrati per tentativo. PDF/immagini → candidati → conferma umana, mai profilo automaticamente confermato. |
| Job | Richiesta OCR limitata nel tempo, registro tentativi e lease in Postgres; nessuna coda esterna iniziale | La richiesta invia soltanto un riferimento al file. Doppio clic non raddoppia la chiamata. Timeout/errore producono riprova esplicita o inserimento manuale. Il documento rimane nell'archivio privato, ma il percorso non viene ripreso dopo reload. |

Neon pubblica oggi piano Free con100 CU-ore mensili e1 GB storage per progetto; il piano Launch è a consumo. È sufficiente come **ipotesi di pilot**, non una prova che il catalogo versionato entri in1 GB per sempre. Misurare dimensione normalizzata e crescita; non imporre cancellazioni per farlo rientrare. [Neon pricing](https://neon.com/pricing).

Vercel pubblica Pro a 20 USD/mese e20 USD di usage credit incluso. Costo marginale dell'account, seat e inclusioni disponibili sono da leggere in fase di provisioning; non si sommano o sottraggono crediti senza verificare la fattura del team. [Vercel pricing](https://vercel.com/pricing).

Vercel Authentication protegge deployment e permette accesso al team/utenti approvati. La verifica finale deve comprendere **anche** route API, upload e lettura dei documenti; non basta vedere il gate sulla homepage. Il bypass per automazione è un accesso privilegiato esplicito, non un modo per rendere pubblico il deployment. [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

## Upload e protezione degli originali

Il limite Functions di4,5 MB rende inadeguato far transitare PDF grandi attraverso la route applicativa. Usare **upload diretto browser → Blob privato**, con token ristretto emesso dal server dopo autorizzazione, vincoli su percorso/MIME/dimensione e associazione al job. Il callback di completamento deve essere compatibile con la protezione del deployment, senza aprire route a chiamate arbitrarie. Il server verifica oggetto, dimensioni effettive, tipo reale e digest prima dell'estrazione. [Client uploads](https://vercel.com/docs/vercel-blob/client-upload), [Functions limits](https://vercel.com/docs/functions/limitations).

Una Function legge l'oggetto privato e passa byte o contenuto file al provider; non presumere che Gemini possa aprire un URL Blob privato. La lettura per la UI passa da una route autorizzata o URL a scadenza appropriato; credenziali Blob rimangono sul server. Capability/job token di durata limitata possono rimanere nella memoria della pagina e spariscono al reload: non diventano localStorage, sessione recuperabile o cronologia. I documenti restano consultabili per gli operatori autorizzati nell'archivio interno previsto daQ25. [Private Blob](https://vercel.com/docs/vercel-blob/private-storage), [Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk).

## Modello, capacità e costo

Il catalogo ufficiale corrente presenta `gemini-3.8-flash` come stabile e consiglia3.8 Flash/3.5 Flash-Lite per nuovi progetti; l'accesso ai modelli2.5 è limitato ai progetti che li hanno già utilizzati. Proporre automaticamente2.5 Flash a un progetto nuovo sarebbe quindi scorretto. La scelta3.8 Flash è un **candidato documentale**, non prova della qualità sulle nostre bollette. [Catalogo modelli](https://ai.google.dev/gemini-api/docs/models).

Gemini documenta comprensione nativa di PDF e output strutturati; AI SDK documenta il provider Google e input PDF. La combinazione modello/canale/SDK esatta deve passare un vero smoke test su PDF nativo, scansione e foto prima di essere dichiarata pronta. Output conforme allo schema non dimostra valori corretti. [PDF Gemini](https://ai.google.dev/gemini-api/docs/document-processing), [Google AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/google).

Tariffe Standard3.8 Flash verificate oggi:0,75 USD per milione token input e3,75 USD output, inclusi thinking token, fino al31 dicembre2026; dal1 gennaio2027 rispettivamente1,50 e7,50 USD. Esempio aritmetico, **non costo misurato per bolletta**:10.000 token input e2.000 output costano0,015 USD oggi,0,030 USD con il listino successivo. Token visivi, ragionamento, retry e documenti più lunghi cambiano il totale. Nessun grounding/ricerca web nell'estrazione. [Pricing Gemini](https://ai.google.dev/gemini-api/docs/pricing).

Il canale Developer API e il suo uso sui dati devono essere configurati come Paid Services con progetto fatturato; la ricerca precedente documenta i vincoli EEA e distingue file, log progetto, abusi e cache. Q25 non richiede zero retention. Non attribuire a questo canale condizioni di Vertex o Gateway. Verificare impostazioni effettive e aggiornamenti delle condizioni al provisioning. [Terms](https://ai.google.dev/gemini-api/terms), [ricerca OCR precedente](./ricerca-estrazione-bolletta-2026-10-27.md).

## Limiti proposti per la prima consegna interna

Sono guardrail iniziali da approvare per il prodotto e da misurare, non limiti certificati del modello:

- Una bolletta per fornitura, PDF fino a 10 MB e20 pagine; in alternativa massimo 10 foto JPG/PNG della stessa bolletta,10 MB per foto e30 MB complessivi. Documento superiore: messaggio preciso e inserimento manuale sempre disponibile; non tagliare pagine senza dirlo.
- Massimo 2 estrazioni globali contemporanee e1 per percorso; quando occupate, richiesta riprovabile senza perdere i campi già inseriti. Nessun servizio Redis/queue obbligatorio per questo carico.
- Timeout provider90 secondi per tentativo; massimo 1 retry automatico soltanto per errore transitorio. Budget totale job180 secondi e Function configurata con margine entro il piano effettivo. Non usare `after`/`waitUntil` come promessa di durata illimitata.
- Controllo token prima dell'inferenza dove il canale lo supporta; envelope iniziale30.000 token input e6.000 output complessivi di ragionamento/output. Superamento esplicito anziché troncamento invisibile. Rate/token limits reali del progetto da verificare. Nessuna chiamata illimitata a un modello più costoso se il primo fallisce.
- Monitorare token e costo effettivo per tentativo/job, incluse chiamate fallite e retry, insieme ai consumi mensili per provider. Q45 non approva budget monetari preventivi né blocchi automatici al raggiungimento di una spesa: eliminati i precedenti20USD/mese OCR e50EUR/mese complessivi. I limiti di token, concorrenza e tempo rimangono protezioni tecniche, non soglie di spesa mensili.
- Monitorare la crescita dell'archivio, separando bollette e fonti ufficiali e deduplicando i contenuti invariati. Nessuna cancellazione automatica; nessuno stop arbitrario a5GB derivato dalla proposta economica superata. Gestire esplicitamente le quote effettive dei provider.

## Monitoraggio economico — Q45

L'utente ha scelto di monitorare i costi senza definire un budget a priori. Registrare costo OCR per documento/tentativo, token, retry, storage/operazioni e consumi infrastrutturali; riportare le voci mensili e distinguere stime da fatturazione effettiva. Nessuna soglia monetaria preventiva approvata. I listini citati sopra descrivono prezzi dei provider, non uno stanziamento dell'utente. Nessun servizio o costo attivato da questo documento.

## Criteri di accettazione OCR e runtime

Verifiche da inserire nei ticket, non fatti già conseguiti:

1. Corpus annotato e congelato di almeno 30 casi rappresentativi:10 PDF nativi,10 scansioni e10 set fotografici; luce/gas, fisse/variabili, almeno 5 venditori, multipagina, annuo distinto dal periodo, unità diverse, dati mancanti/illeggibili e almeno un documento con entrambe le forniture. Usare bollette anonimizzate autorizzate; fixture inventate non certificano accuratezza sui documenti reali.
2. Confronto con annotazioni: riportare conteggi corretti/assenti/errati per ciascun campo essenziale e per documento, non solo validità JSON. Le evidenze devono indicare pagina/estratto quando disponibili e non inventare coordinate.
3. Target proposto di utilità: almeno 95% dei campi essenziali leggibili corretti sul corpus, con breakdown per formato e campo, e tutti gli errori/incoerenze deterministiche bloccati prima di `ready`. Non equivale a95% garantito in produzione. I casi senza annuale, illeggibili o incoerenti restano `needs_input`, mai un consumo annualizzato inventato.
4. Conferma utente obbligatoria anche con estrazione corretta. Nessun candidato produce automaticamente un confronto confermato. Riprova e correzione manuale funzionano anche dopo429, timeout o provider indisponibile.
5. Misurare costo completo e tempi p50/p95 sul corpus reale; target operativo iniziale p95 ≤ 60s a1 job e completamento/errore entro 180s. Se il target non è raggiunto, ottimizzare modello/input o proporre una modifica esplicita dei limiti; non dichiararlo passato sulla base dei documenti del provider.
6. Due job simultanei e doppio invio non superano la concorrenza prevista; misurare il costo effettivo; tentativo scaduto libera correttamente il lease. Un reload non ripristina il profilo, ma non elimina il documento dall'archivio privato.
7. Un utente non autorizzato non legge documenti/job né ottiene token upload; il client MCP autorizzato completa il confronto nel deployment protetto. Questa verifica è distinta dal solo test locale o build riuscita.
8. Import giornaliero e import manuale mensile degli indici pubblicano versioni atomiche; errore conserva la versione precedente con data reale. Nessuna inferenza OCR per scaricare coefficienti AU, nessuno scheduler mensile introdotto controQ43.

## Esito delle scelte operative

Q45: monitoraggio dei costi senza budget a priori. Q46: approvati PDF10MB/20pagine o10foto, con limiti complessivi e percorso manuale descritti sopra. Q47: approvata politica di freschezza nel documento di chiusura. Queste scelte non certificano accuratezza del modello o infrastruttura configurata. Il corpus reale e i benchmark rimangono dipendenze della validazione durante lo sviluppo.
