# Vincoli Vercel per il primo percorso con dati reali

Verifica documentale: 27 ottobre 2026. Ricerca soltanto: nessun account, progetto, segreto o infrastruttura modificato. Hosting Vercel confermato; nessun piano o provider di persistenza ancora dedotto da questa scelta. Le dimensioni XML (circa 21 MB luce e 15 MB gas) sono input della ricerca, non nuove misure svolte qui.

## Capacità e limiti verificati

| Tema | Fatto documentato | Conseguenza per il progetto |
| --- | --- | --- |
| Frequenza cron | Hobby: massimo una esecuzione giornaliera per cron e finestra di avvio di un'ora. Pro/Enterprise: fino a una volta al minuto, precisione al minuto. 100 cron per progetto su tutti i piani. | Il solo aggiornamento quotidiano non impone Pro. Recuperi automatici frequenti o raccolte infragiornaliere richiedono valutare il piano o un altro trigger. |
| Ambiente e orario | Il cron invia una GET all'URL del deployment production; espressioni in UTC. | La validazione in preview non dimostra il funzionamento del cron. Il cambio ora italiano va considerato se si desidera un orario locale preciso. |
| Affidabilità cron | Nessun retry automatico delle invocazioni fallite; consegna best effort, possibili esecuzioni saltate, duplicate o concorrenti. | Servono stato dell'ultima riuscita, deduplicazione e un recupero esplicito. Il giorno previsto dal cron non certifica la data dei dati scaricati. |
| Durata Functions con Fluid Compute | Node.js: 300 secondi predefiniti; massimo Hobby 300, Pro/Enterprise 800 generalmente disponibili. Estensione a 1800 secondi in beta, con requisiti e configurazione specifici. Il timeout termina l'invocazione. | Misurare download, parsing, normalizzazione e scritture sul piano effettivo prima di decidere la divisione in passi. Non assumere accesso alla beta. |
| Memoria Functions | Hobby: 2 GB/1 vCPU; Pro/Enterprise: default 2 GB/1 vCPU, massimo 4 GB/2 vCPU. | Le dimensioni su disco non equivalgono alla memoria del parser: misurare l'espansione XML e limitare copie e concorrenza. |
| Payload HTTP Functions | Request/response massimo 4,5 MB. | Una bolletta superiore a questa soglia non va inviata come corpo alla normale route OCR. |

Fonti per la tabella: [frequenza e piani cron](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron production e UTC](https://vercel.com/docs/cron-jobs), [errori, concorrenza e consegna cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [limiti Functions](https://vercel.com/docs/functions/limitations).

**Distinzione architetturale:** il limite del payload HTTP non descrive i byte che il codice della Function scarica da una fonte esterna. Ne consegue che i due XML del Portale non sono esclusi dal runtime solo perché superano 4,5 MB; rimangono da verificare durata e memoria dell'importazione reale. Questo è un'inferenza dal campo di applicazione del limite, non una prova prestazionale.

## Upload e lavoro durevole

Vercel Blob supporta upload diretti browser → storage oltre 4,5 MB: il server autorizza e genera un token, mentre il file non transita nella Function. Sono supportati store privati; il loro URL ordinario non è pubblico. La documentazione richiede autorizzazione prima di emettere il token. Questo non implica aggiungere un account utente al primo confronto: il meccanismo di accesso interno/sessione va scelto coerentemente con il prodotto. Fonti: [client upload](https://vercel.com/docs/vercel-blob/client-upload), [private storage](https://vercel.com/docs/vercel-blob/private-storage).

`after()` di Next.js e `waitUntil()` consentono lavoro dopo la risposta, ma non sono un'esecuzione illimitata o un sistema di ripresa. `waitUntil` condivide il timeout della Function; la guida raccomanda `after()` con Next.js 15.1+. Fonte: [API Functions](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).

Vercel Workflow conserva il progresso, ritenta i passi e riprende dopo crash/deploy. La durata complessiva non ha un limite, ma **ogni singolo step resta soggetto al limite Functions**. È una possibilità da scegliere se la ripresa automatica e la suddivisione del lavoro sono necessarie; il volume iniziale da solo non prova che serva. Passare riferimenti ai file e alle versioni tra i passi è una proposta più semplice del serializzare i documenti interi nello stato del workflow. Fonti: [Workflow](https://vercel.com/docs/workflows), [limiti Workflow](https://vercel.com/docs/workflows/pricing).

## Proposta minima, distinta dalle decisioni già prese

- Storage persistente privato per originali delle bollette, snapshot delle fonti e altri file; archivio strutturato per manifesti, versioni, esiti import e risultati. Blob e Postgres sono candidati, non scelte già approvate. Vercel hosting non determina il provider database né il percorso AI Gateway.
- Il confronto legge una versione già pubblicata; download e normalizzazione avvengono fuori dalla richiesta dell'utente. Luce e gas possono pubblicare indipendentemente mantenendo i controlli di compatibilità previsti dal design.
- Import idempotente e riavviabile, con pubblicazione solo alla fine. Un fallimento lascia utilizzabile la precedente versione valida, mostrando la sua vera data; non trasforma dati vecchi in un nuovo catalogo.
- OCR: upload → riferimento a originale persistito → estrazione validata → conferma/correzione. Prima versione interna: originali conservati come richiesto, senza introdurre cancellazione automatica.

Prima dell'esecuzione servono scelte operative su piano Vercel, provider/regione dello storage e database, limiti file/pagine, trigger e recuperi. Sono dettagli da risolvere nell'architettura/ticket, non altre approvazioni necessarie per continuare la progettazione. La prova su file reali deve decidere se basta un job riavviabile entro il timeout o occorrono passi durevoli. I contratti di documento/versione/profilo consentono sviluppo parallelo di OCR e ingestion, con la verifica completa dopo l'integrazione; questa nota non propone né pubblica nuovi ticket.
