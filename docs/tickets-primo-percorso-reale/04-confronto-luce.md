# 04: Profilo manuale → confronto luce reale via web e MCP

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/10; dipendenze native verificate.

## What to build

Una persona conferma un profilo luce manuale e ottiene costi, ammissibilità e offerte reali ordinate nella webapp; un clientMCP ottiene lo stesso esito dal medesimo motore.

## Acceptance criteria

- [x] Usare catalogo e scenario realmente pubblicati, riferimenti efficaci e quattro trimestriQ44; versione/revisione del profilo e delle fonti accompagnano ogni risultato.
- [x] Supportare formule luce osservate in perimetro: fisse/variabili, fasce inclusePeak/OffPeak, sconti e condizioni, intervalli, validità e componenti regolate/fiscali.
- [x] Q32: offerta simulabile non ancora implementata impedisce di dichiarare completo il ranking; non eliminarla silenziosamente.
- [x] Profilo insufficiente, requisito sconosciuto, nessuna offerta ammissibile, fonti incomplete e guasto distinti. Nessun risultato precedente valido dopo modifica; dati sintetici mai fallback reale.
- [x] Adattatori web/MCP non duplicano formule o ordinamento. MCP riceve dati già estratti, nienteOCRserver; accesso interno autorizzato e nessun segreto nelbrowser.
- [x] Test al confineprofilo/versioni→confronto e percorsobrowser/MCP, numeri indipendenti, arrotondamenti motivati. Le formule sono isolate dalla presentazione per consentire il parallelo con il gas.

## Blocked by

1, 2
