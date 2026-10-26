# La mia bolletta

Studio di un'applicazione gratuita per confrontare le offerte domestiche di luce e gas con un'esperienza più chiara. Il progetto prevede lettura della bolletta, confronto basato sui consumi e funzioni equivalenti via MCP, con OCR eseguito dal client MCP. Le fonti dei dati devono essere gratuite.

## Stato

La ricerca delle fonti e le prime decisioni di prodotto sono documentate. Per la schermata risultati è stata scelta la **direzione A: consiglio motivato in primo piano**, costo e risparmio annui, spiegazione e alternative successive.

La [specifica #1](https://github.com/TommyBez/la-mia-bolletta/issues/1) descrive la prima tranche dell'interfaccia e i confini di verifica confermati. Importatore di produzione, calcolo tariffario, OCR e server MCP restano da implementare. La base applicativa su questo branch è ancora lo starter Next.js.

## Riferimento visuale

Il prototipo con le tre varianti e dati interamente sintetici è conservato nel [branch codex/prototype-confronto](https://github.com/TommyBez/la-mia-bolletta/tree/codex/prototype-confronto). Sono disponibili le [istruzioni di avvio e i limiti](https://github.com/TommyBez/la-mia-bolletta/blob/88539ca/app/prototype/confronto/README.md).

La prima implementazione riscriverà la direzione A sulla base della specifica. Le offerte e la formula illustrativa del prototipo non rappresentano dati reali o un motore tariffario.

## Documentazione

- [Decisioni di design](./docs/design-prodotto.md)
- [Specifica della prima tranche risultati A](./docs/spec-risultati-a.md)
- [Vocabolario del dominio](./GLOSSARY.md)
- [Design dell’acquisizione quotidiana dei dati](./docs/design-ingestion.md)
- [Studio di fattibilità](./docs/studio-fattibilita.md)
- [Approfondimento GME](./docs/approfondimento-gme-2026-10-26.md)
- [Verifica MiFIR](./docs/verifica-mifir-2026-10-26.md)

Stack presente: Next.js, React, TypeScript, Tailwind e componenti shadcn/Base UI. Le regole specifiche di questa versione di Next.js sono in [AGENTS.md](./AGENTS.md).
