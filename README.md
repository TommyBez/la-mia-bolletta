# La mia bolletta

Studio di un'applicazione gratuita per confrontare le offerte domestiche di luce e gas con un'esperienza più chiara. Il progetto prevede lettura della bolletta, confronto basato sui consumi e funzioni equivalenti via MCP, con OCR eseguito dal client MCP.

## Stato

Ricerca delle fonti e prime decisioni di prodotto documentate. È disponibile un **prototipo visuale con dati interamente sintetici**: non è ancora un comparatore funzionante. OCR, acquisizione quotidiana, calcolo tariffario e server MCP non sono implementati.

## Avviare il prototipo

```sh
pnpm install
pnpm prototype
```

Aprire [il confronto](http://localhost:3000/prototype/confronto?variant=A), usando la porta indicata dal server se diversa da 3000. La barra in basso passa tra tre strutture:

- A — consiglio in primo piano;
- B — confronto affiancato;
- C — elenco e dettaglio.

I controlli permettono di provare luce e gas, la preferenza per il prezzo fisso, la revisione dei dati, quattro casi dimostrativi e il passaggio simulato al fornitore. Tutto lo stato rimane nella pagina e si azzera al ricaricamento. La homepage `/` contiene ancora lo starter Next.js.

Il prototipo è isolato sul branch `codex/prototype-confronto`. **È stata scelta la variante A — Il consiglio.** [Scopo, percorso e limiti del prototipo](./app/prototype/confronto/README.md).

## Documentazione

- [Decisioni di design](./docs/design-prodotto.md)
- [Specifica della prima tranche risultati A](./docs/spec-risultati-a.md)
- [Vocabolario del dominio](./GLOSSARY.md)
- [Studio di fattibilità](./docs/studio-fattibilita.md)
- [Approfondimento GME](./docs/approfondimento-gme-2026-10-26.md)
- [Verifica MiFIR](./docs/verifica-mifir-2026-10-26.md)

Stack presente: Next.js, React, TypeScript, Tailwind e componenti shadcn/Base UI. Le regole specifiche di questa versione di Next.js sono in [AGENTS.md](./AGENTS.md).
