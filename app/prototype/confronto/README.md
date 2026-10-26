# Prototipo del confronto

Domanda: quale struttura aiuta a capire la raccomandazione e scegliere consapevolmente un'offerta?

Prototipo temporaneo sul branch `codex/prototype-confronto`. La homepage contiene ancora lo starter: non esisteva una schermata risultati in cui inserire le varianti, perciò il prototipo ha una rotta esplicita dedicata.

## Avvio

```sh
pnpm prototype
```

Aprire `http://localhost:3000/prototype/confronto?variant=A` (usare la porta mostrata da Next se diversa).

- **A — Il consiglio:** raccomandazione in primo piano e alternative successive.
- **B — Il confronto:** contratto attuale e alternative confrontati sulle stesse voci.
- **C — L'esplorazione:** elenco selezionabile e dettaglio dell'offerta.

La barra in basso o le frecce della tastiera cambiano variante mantenendo lo stato locale. Le frecce non vengono intercettate nei campi o nei dialoghi. Il parametro `variant` sopravvive a un ricaricamento; i dati inseriti si azzerano. Il selettore delle varianti è nascosto nelle build di produzione.

## Cosa provare

1. Cambiare variante e confrontare le gerarchie delle informazioni su telefono e desktop.
2. Preferire il prezzo fisso e verificare il cambio di raccomandazione.
3. Usare i quattro casi nella barra del prototipo: risparmio stimato, vantaggio incerto, contratto incompleto, convenienza a restare.
4. Rivedere i dati, modificare i consumi e confermare; aggiungere il gas per il riepilogo delle due forniture.
5. Aprire la scheda dell'offerta e il passaggio simulato al fornitore.

## Limiti deliberati

Le offerte e tutti gli importi sono inventati. `model.ts` adatta i costi al consumo con una formula illustrativa, senza rappresentare un modello tariffario. Comune, potenza e residenza sono modificabili ma non incidono sugli importi. Il contratto attuale mantiene lo stesso costo nei tre scenari dimostrativi. I casi si applicano a entrambe le forniture e la preferenza per il fisso è condivisa.

Non ci sono OCR, upload di documenti, dati di mercato, persistenza, account, motore di calcolo, MCP o sottoscrizioni. La cancellazione degli originali approvata in Q12 è una decisione di prodotto ancora da implementare. Non vengono trasmessi documenti né aperti siti di fornitori.

Le scelte approvate sono in [design-prodotto.md](../../../docs/design-prodotto.md). **Il 26 ottobre 2026 l'utente ha scelto A — Il consiglio.** La domanda sulla struttura dei risultati è quindi risolta: raccomandazione dominante e alternative successive. Questa scelta non valida le fixture o la formula dei costi. Il prototipo viene conservato come riferimento fuori da `main`; la prima implementazione va riscritta secondo la [specifica dedicata](../../../docs/spec-risultati-a.md), con i confini di verifica confermati.

## Verifica del 26 ottobre 2026

TypeScript e Biome sui file modificati passano. Nel browser sono state verificate tutte e tre le varianti a 1440×1000 e 390×844, con assenza di overflow orizzontale anche a 320 px. Verificati cambio variante e URL, preferenza per il fisso, casi di confronto, modifica dei consumi, aggiunta del gas e somma, selezione dell'offerta, dialoghi e chiusura con Escape. Il server Next non segnala errori di compilazione o runtime dopo queste prove. Non sono test di un motore tariffario né una verifica di produzione.
