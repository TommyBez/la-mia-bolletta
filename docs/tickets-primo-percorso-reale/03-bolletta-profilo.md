# 03: Bolletta o inserimento manuale → profilo confermato

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/9; dipendenze native verificate.

## What to build

Una persona carica la bolletta o compila i dati, corregge i candidati estratti e conferma un profilo luce/gas pronto per il confronto. È dimostrabile prima del motore reale.

## Acceptance criteria

- [ ] PDF nativi/scansioni e foto stessa bolletta, Q46:10MB/20paginePDF o10foto con10MBperfoto/30MBtotali; oltrelimite messaggio e percorso manuale, nessun troncamento.
- [ ] Upload diretto in archivio privato e lettura autorizzata; documenti conservati secondoQ25, profilo e jobtoken in memoria secondoQ35, nessuna sessione ripristinata alreload.
- [ ] AI SDK e Gemini Flash candidato sul canale qualificato; candidati per campo con unità, periodo, provenienza e pagina/estratto disponibile; ambiguità/mancanze esplicite e conferma obbligatoria.
- [ ] Validazione condivisa con input manuale/MCP: annuo distinto dal periodo, somma fasce e unità, comune non ambiguo, nessuna annualizzazione inventata.
- [ ] Timeout, providerindisponibile, doppioinvio e concorrenza gestiti con recupero esplicito/manuale; Q45 costi misurati per tentativo e provider senza budget monetario imposto.
- [ ] Verifica documento→candidati→correzione→profilo e browser mobile/tastiera; corpus reale autorizzato e annotato, metriche per campo/formato, costo e latenza misurati. Fixture sintetiche non certificano accuratezza reale.

## Blocked by

Nessuno: può partire subito dopo approvazione della specifica e del piano.
