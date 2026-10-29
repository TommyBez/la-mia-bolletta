# Valutazione Vercel Workflow per l'importazione

29 ottobre 2026. **Q48 approvata dall’utente dopo la valutazione; nessuna implementazione ancora eseguita.** Nessun pacchetto installato, costo o servizio attivato, nessuna modifica GitHub. Q49 (Postgres su Neon e Blob privato) è stata confermata dall'utente; Q48 conferma Cron→Workflow per l’import quotidiano. Lo script AU mensile resta manuale e separato, come Q43.

## Raccomandazione

Usare **Cron come attivatore e Vercel Workflow come orchestratore dell'import quotidiano**. Non sostituisce i moduli di catalogo/calcolo né richiede un backend separato da Next.js. La ragione concreta è riprendere importazioni e acquisizioni di riferimenti dopo errori transitori, con risultati dei passi persistiti e osservabilità, senza costruire un sistema di ripresa proprietario.

Il volume XML campionato (circa21MB luce e15MB gas) da solo non dimostra che una Function non basti. Il beneficio aggiuntivo è nella sequenza download→originali→normalizzazione→staging→controlli→pubblicazione e nel popolamento a lotti dei riferimenti nazionali. Una sola Function sarebbe inizialmente più semplice, ma retry selettivi, checkpoint e ripresa sarebbero responsabilità applicativa.

## Fatti verificati nelle fonti correnti

- Workflow è documentato come esecuzione durevole con risultati dei passi persistiti e replay, ripresa dopo crash/deploy e osservabilità. L'orchestrazione è sandboxed/deterministica; gli step hanno accesso Node completo per rete, Blob e DB. [Overview Vercel](https://vercel.com/docs/workflows), [workflows e step](https://workflow-sdk.dev/docs/foundations/workflows-and-steps).
- L'integrazione Next.js usa `workflow/next` e `withWorkflow`; la guida tratta esplicitamente Next16.1+ e l'esclusione dei percorsi interni dal proxy matcher. Questo è compatibilità **documentale** della lineaNext16, non un test eseguito qui su Next16.4.3. La documentazione corrente è marcata Workflow5.x; alcune funzionalità come il runtimeQuickJS sono sperimentali. Nessuna versione precisa è stata selezionata o installata: pin e smoke test della combinazione SDK/Next sono criteri implementativi. [Guida Next.js](https://workflow-sdk.dev/docs/getting-started/next).
- Il run complessivo non ha limite di durata, ma **ciascuno step ha i limiti runtime delle Vercel Functions**. Il Workflow non rende illimitata una singola operazione di parsing. Sul runtime predefinito i limiti documentati includono25.000eventi,10.000step e50MBpayload; è consigliato suddividere/bundlare il lavoro ben prima dei limiti per non rallentare replay. Non progettare uno step per ogni offerta/comune. [Limiti correnti](https://vercel.com/docs/workflows/pricing).
- Argomenti e risultati vengono serializzati e persistiti. Per gli XML usare riferimenti Blob, digest e metadati; il fatto che bytearray e stream siano supportati non rende conveniente archiviare ripetutamente interi XML o array normalizzati nel log. [Serializzazione](https://workflow-sdk.dev/docs/foundations/serialization).
- Gli step possono essere ritentati: gli effetti esterni devono essere idempotenti. Lo stepId stabile tra retry è utile, ma non sostituisce l'identità di dominio per duplicati fra run distinti. Workflow documenta anche coordinamento dei run tramite hook; per questo import è ragionevole mantenere la chiave di import/lease nelDB e vincoli univoci sulle scritture. Non è una garanzia automatica di exactly-once per Blob o SQL. [Idempotenza](https://workflow-sdk.dev/docs/foundations/idempotency).
- Cron da solo non ritenta gli errori; la consegna è best-effort e può mancare o duplicarsi. Cron→Workflow migliora il recupero dopo l'avvio, ma **non dimostra che ogni avvio Cron sia consegnato**: ogni esecuzione deve riconciliare il lavoro pendente e permettere avvio manuale. [Gestione Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- La fatturazione Workflow considera eventi, dati scritti e dati conservati; si aggiungono Functions e Queues. Blob e DB rimangono voci distinte. La documentazione corrente non supporta presumere costo zero del Workflow su Pro o convenienza economica già misurata. Q45 resta monitoraggio senza budget preventivo. [Pricing Workflow](https://vercel.com/docs/workflows/pricing).

## Confronto applicato al progetto

| Aspetto | Cron→una Function | Cron→Workflow |
| --- | --- | --- |
| Import breve e atomico | Meno meccanismi iniziali | Integrazione SDK aggiuntiva |
| Errore dopo download/normalizzazione | Ripartenza da capo o checkpoint scritti da noi | Passi completati persistiti; retry controllati del passo fallito |
| Riferimenti nazionali a lotti | Cursor/job/lease e riattivazione da costruire | Orchestrazione durevole dei lotti, sempre con cursor e dati applicativi nelDB |
| Osservabilità | Log e stato import applicativo | Log/stato import più osservabilità dei passi |
| Durata | Un'unica durata Functions | Durata complessiva estesa, limite Functions per ciascuno step |
| Duplicati e pubblicazione | Vincoli/lease/transazione applicativi | Gli stessi vincoli restano necessari |
| Costi | Compute e storage/DB | Compute, storage/DB più eventi/persistenza/Queues Workflow |

## Disegno proposto

1. **Avvio e riconciliazione.** EndpointCron protetto o comando operativo avvia un run con `importId`, fornitura, periodo logico e versione del parser. Un vincolo/lease nelDB impedisce che run concorrenti pubblichino la stessa importazione. Riconciliare import incompleti dall'ultima pubblicazione valida; non presumere un avvio giornaliero garantito.
2. **Manifesto e acquisizione.** Individuare il set richiesto e scaricare/conservare gli originali in Blob privato, con digest, URL, data fonte e data acquisizione. Retry dei soli guasti transitori; errore permanente o file incompatibile interrompono quella pubblicazione. Un nuovo download non ringiovanisce la fonteQ47.
3. **Normalizzazione e staging.** Leggere i riferimenti Blob negli step, normalizzare con il modulo catalogo e scrivere staging immutabile associato all'import. Elaborare lotti con concorrenza limitata; ritentare un lotto non duplica righe. Tra gli step passano soltanto riferimenti/count/checkpoint, non l'intero catalogo.
4. **Qualifica.** Verificare integrità del manifesto, conteggi, formule, riferimenti/efficacia/copertura, incompatibilità e report errori. Dati incompleti non diventano zero e un record complesso non viene eliminato per far passare il controllo.
5. **Pubblicazione.** Una transazioneSQL verifica che la versione non sia superata e sposta il puntatore alla nuova versione soltanto dopo tutti i controlli. Se il run si interrompe dopo ilcommit e prima della conferma dello step, il retry deve riconoscere ilcommit già completato. Gli altri run non possono far regredire la versione. In caso di errore rimane la precedente versione con stato/date reali.

Luce e gas hanno pubblicazioni indipendenti secondo il contratto già approvato. Si possono orchestrare run distinti per fornitura senza creare un run per ogni record. La popolazione massiva dei riferimenti può usare lotti/childrun delimitati, senza esportare un fan-out incontrollato di migliaia di chiamate.

**Separazione delle responsabilità:** il modulo catalogo contiene parsing, controlli, regole e interfaccia di pubblicazione; Workflow coordina quando eseguirli e come riprendere. I test di comportamento del catalogo non devono conoscere il meccanismo interno di replay. Lo script mensile AU continua a produrre uno snapshot validato da importare; nessunCron mensile viene introdotto.

## Verifiche prima dell'accettazione

- Smoke test della versione SDK scelta su Next16.4.3, build e run locale/preview; protezione deployment/proxy non devono intercettare impropriamente i percorsi interni. Nessun indebolimento dell'autorizzazione dei comandi operativi.
- Fallimento transitorio in un lotto: nessun ridownload o duplicato delle parti già completate, ripresa osservabile.
- Doppio avvio e fallimento dopo ilcommit finale: una sola pubblicazione efficace, nessuna regressione a una versione vecchia.
- XML reale e lotti di riferimenti rispettano limiti di memoria/tempo perstep; input/output del Workflow restano compatti. La dimensione degli step si sceglie misurando, non dal solo numero di righe.
- Misurare compute, eventi, quantità scritta/conservata, Queues, Blob eDB. Lo storico tecnico Workflow non sostituisce originali e provenienza conservati nell'archivio del progetto.

## Proposta da discutere

**Q48 aggiornata, ancora da confermare:** applicazione Next.js organizzata in moduli, con Workflow come adapter di orchestrazione per l'import quotidiano, attivato daCron e avviabile manualmente; modulo di confronto indipendente dal runtimeWorkflow. Q49 confermata. Non ancora installato o sviluppato nulla relativo aWorkflow.
