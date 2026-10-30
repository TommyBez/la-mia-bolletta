# OCR su quattro bollette reali — 30 ottobre 2026

I quattro PDF autorizzati dall’utente sono stati ricevuti e utilizzati. Il precedente stato «in attesa dell’invio» è superato. Originali, testo estratto, annotazioni con valori attesi, risposte grezze, job ID e capability rimangono privati: qui sono pubblicati soltanto conteggi e costi senza dati personali.

## Metodo e perimetro

Quattro documenti indipendenti, due venditori, due luce e due gas; tutti PDF nativi multipagina, da 8 a 12 pagine, con prezzi variabili. Nessuna scansione, foto, contratto fisso o bolletta con entrambe le forniture. Le riprove dello stesso documento non aumentano la dimensione del campione.

Prima di ispezionare le risposte del modello sono state congelate annotazioni da estrazione testuale indipendente e controllo visivo delle pagine originali. Sono annotate 52 celle: 37 valori leggibili attesi e 15 assenze attese. Non sono tutti i campi possibili del contratto: l’accuratezza riportata riguarda esclusivamente queste annotazioni. Il confronto normalizza maiuscole del comune, decimali equivalenti e date italiane esplicite in ISO; non modifica le annotazioni per adattarle alle risposte.

Il campione è servito a diagnosticare e correggere il prompt: **non è un holdout indipendente** e non dimostra accuratezza generale su altri documenti, fornitori o formati. La conferma umana resta obbligatoria.

## Esiti osservati

| Versione | Ambiente | Valori corretti / leggibili | Mancanti | Errati | Assenze rispettate |
| --- | --- | --- | --- | --- | --- |
| v2, prima prova | Preview protetta precedente | 28 / 37 | 9 | 0 | 15 / 15 |
| v3 | Web locale, Blob/DB/Gateway reali | 35 / 37 | 2 | 0 | 15 / 15 |
| v4 | Web locale, Blob/DB/Gateway reali | 37 / 37 | 0 | 0 | 15 / 15 |
| v4, riprova di due documenti | Nuova preview protetta | 17 / 17 | 0 | 0 | 9 / 9 |

Dettagli per campo, formato e documento nei report JSON accanto a questo file. «Nessun errore» vale soltanto per le celle annotate, non per ogni possibile informazione contenuta nei PDF.

Due documenti denominano “annuo” un consumo riferito a otto mesi. In tutte le prove il valore è rimasto assente come consumo di dodici mesi, con avviso: non sono stati inventati mesi, date o annualizzazioni. Gli altri due contengono dodici mesi completi e raggiungono `ready` dopo risoluzione del comune ufficiale e conferma del profilo. Nessuna condizione economica corrente ignota è stata prorogata per inventare un risparmio.

## Correzioni e verifica del percorso

- Il candidato normalizza `DD/MM/YYYY` in `YYYY-MM-DD`, conserva il valore originale e respinge date impossibili. La regressione al confine documento → candidati è stata prima riprodotta (RED), poi risolta (GREEN).
- Il prompt distingue esplicitamente riscaldamento combinato con cottura/acqua calda da un uso sconosciuto; normalizza le date, riconosce lo storico rilevato e consente la somma delle fasce sui soli dodici mesi del periodo dichiarato.
- L’unità leggibile rimane disponibile anche quando il valore annuo manca: non viene confusa l’assenza di un anno completo con l’assenza dell’unità.
- Il percorso luce da PDF reale a confronto è riuscito anche con viewport telefono 390 × 844; il gas è stato riprovato nella preview usando Enter per confermare e avviare il confronto. Nessun profilo viene confermato automaticamente dal modello.

Codice verificato: `80223b285b20415c28ee6eb483b172cdec02a66e`. [Preview interna protetta](https://la-mia-bolletta-f3r8w8n8k-tommasos-projects-bb9d6551.vercel.app/confronto), deployment `dpl_5bSwsJHx9Yz93gwfQychdWdqBjx4`. Modello `google/gemini-3.8-flash` tramite Vercel AI SDK/Gateway con OIDC; prompt `bill-candidates-v4`. Nessuna promozione in produzione.

157 test, TypeScript e lint del percorso reale verdi. [CI del commit OCR](https://github.com/TommyBez/la-mia-bolletta/actions/runs/41024476892) riuscita, build inclusa.

## Costo e latenza

Le quattro letture finali v4 costano **0,076722 USD**, circa 0,01918 USD a documento, secondo il Gateway. Tempi provider p50 25.096 ms, p95 44.445 ms; caricamento → risposta OCR da 26.580 a 52.050 ms. Su quattro osservazioni il p95 coincide con il massimo e non è una stima robusta della latenza in produzione.

Le due riprove v4 nella preview costano 0,036822 USD, con provider da 29.043 a 30.454 ms. L’intera sessione comprende 14 chiamate riuscite e nessun retry/fallimento: **0,27219225 USD** complessivi, inclusi diagnosi e riprove. Quattordici chiamate restano quattro documenti indipendenti. Costi documentati dal Gateway, non una stima di tutti i costi infrastrutturali, Blob o imposte. [Consumi aggregati](all-usage.json).

## Cosa resta da qualificare

La ricezione e la prima misura reale sono concluse. Il qualificatore attuale restituisce ancora `qualified: false` per la copertura: riproduce la proposta operativa di 30 casi, dieci per formato, cinque venditori, fisse/variabili e un documento con entrambe le forniture. Questi numeri provengono dalla [proposta operativa](../../proposta-operativa-2026-10-29.md), non da una garanzia del modello né da questa prova. Le quattro bollette non vengono scartate e non viene richiesta una nuova autorizzazione per usarle.

#9 e #12 conservano visibile la qualifica estesa ancora aperta; il motivo non è più «bollette non inviate». Non sono documentate accuratezza su scansioni/foto, contratti fissi, altri venditori o un holdout nuovo. Il target numerico è raggiunto soltanto sulle annotazioni del piccolo campione utilizzato per le correzioni.
