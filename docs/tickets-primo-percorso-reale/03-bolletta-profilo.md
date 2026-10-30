# 03: Bolletta o inserimento manuale → profilo confermato

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/9; dipendenze native verificate.

## What to build

Una persona carica la bolletta o compila i dati, corregge i candidati estratti e conferma un profilo luce/gas pronto per il confronto. È dimostrabile prima del motore reale.

## Acceptance criteria

- [x] PDF nativi/scansioni e foto stessa bolletta, Q46:10MB/20paginePDF o10foto con10MBperfoto/30MBtotali; oltrelimite messaggio e percorso manuale, nessun troncamento.
- [x] Upload diretto in archivio privato e lettura autorizzata; documenti conservati secondoQ25, profilo e jobtoken in memoria secondoQ35, nessuna sessione ripristinata alreload.
- [x] AI SDK e Gemini Flash candidato sul canale qualificato; candidati per campo con unità, periodo, provenienza e pagina/estratto disponibile; ambiguità/mancanze esplicite e conferma obbligatoria.
- [x] Validazione condivisa con input manuale/MCP: annuo distinto dal periodo, somma fasce e unità, comune non ambiguo, nessuna annualizzazione inventata.
- [x] Timeout, providerindisponibile, doppioinvio e concorrenza gestiti con recupero esplicito/manuale; Q45 costi misurati per tentativo e provider senza budget monetario imposto.
- [ ] Verifica documento→candidati→correzione→profilo e browser mobile/tastiera; corpus reale autorizzato e annotato, metriche per campo/formato, costo e latenza misurati. Fixture sintetiche non certificano accuratezza reale.

## Blocked by

Nessuno: può partire subito dopo approvazione della specifica e del piano.

## Verifica residua

Ricevuti e annotati quattro PDF reali autorizzati. Il prompt v4 produce 37 valori corretti su 37 leggibili annotati e 15 assenze corrette; due documenti con anno completo arrivano al confronto reale, quelli con otto mesi richiedono integrazione. Corretti date, uso combinato gas, storico e unità; verificati anche telefono e tastiera. [Resoconto con costi, metriche per campo/formato e limiti](../evidenze/ocr-reale-2026-10-30/README.md).

La qualifica estesa resta aperta: quattro PDF nativi, due venditori, soli contratti variabili, nessun holdout indipendente. Il gate non è più la mancata ricezione dei documenti. Non dichiarare passata la proposta di copertura 30 casi con scansioni/foto/fisse e bolletta con entrambe le forniture.
