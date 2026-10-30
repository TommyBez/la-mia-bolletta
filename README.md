# La mia bolletta

Applicazione gratuita per confrontare le offerte domestiche di luce e gas con un'esperienza più chiara. Legge una bolletta o un profilo manuale, richiede la conferma dei dati e confronta le offerte simulabili del Portale Offerte. Web e MCP condividono il motore; il client MCP esegue l'OCR autonomamente. Le fonti energetiche sono gratuite e ufficiali.

## Stato

Questo branch implementa la [specifica del primo percorso reale #6](https://github.com/TommyBez/la-mia-bolletta/issues/6): acquisizione con Vercel Workflow, versioni in Neon, originali in Blob privato, coefficienti mensili ricavati dal simulatore ufficiale, confronto luce/gas e quattro operazioni MCP autenticate.

La schermata risultati segue la **direzione A: consiglio motivato in primo piano**, costo annuo, risparmio quando il contratto attuale è ricostruibile e alternative successive. Il confronto non presenta una classifica completa se una formula in perimetro non è calcolabile. Nessun dato sintetico viene usato come ripiego nell'applicazione reale.

L'OCR usa Vercel AI SDK → AI Gateway → Gemini Flash, autenticato con OIDC. Il collegamento e il caricamento privato sono verificati con documenti sintetici; l'accuratezza su un corpus di bollette reali autorizzate è ancora da qualificare. Lo stato operativo delle fonti si legge da `/api/data-status`; la presenza del codice non equivale alla qualifica dei dati del mese.

Avvio, comandi operatore e verifiche: [guida del percorso reale](./docs/avvio-primo-percorso-reale.md).

## Riferimento visuale

Il prototipo con le tre varianti e dati interamente sintetici è conservato nel [branch codex/prototype-confronto](https://github.com/TommyBez/la-mia-bolletta/tree/codex/prototype-confronto). Sono disponibili le [istruzioni di avvio e i limiti](https://github.com/TommyBez/la-mia-bolletta/blob/88539ca/app/prototype/confronto/README.md).

Le offerte e la formula illustrativa di quel prototipo non rappresentano dati reali o il motore tariffario di questo branch. Il percorso applicativo reale è `/confronto`.

## Documentazione

- [Decisioni di design](./docs/design-prodotto.md)
- [Specifica del primo percorso reale](./docs/spec-primo-percorso-reale.md)
- [Architettura tecnica](./docs/architettura-tecnica.md)
- [Contratti e confini di verifica](./docs/contratti-primo-percorso-reale.md)
- [Specifica della prima tranche risultati A](./docs/spec-risultati-a.md)
- [Vocabolario del dominio](./GLOSSARY.md)
- [Design dell’acquisizione quotidiana dei dati](./docs/design-ingestion.md)
- [Studio di fattibilità](./docs/studio-fattibilita.md)
- [Approfondimento GME](./docs/approfondimento-gme-2026-10-26.md)
- [Verifica MiFIR](./docs/verifica-mifir-2026-10-26.md)

Stack: Next.js, React, TypeScript, Tailwind, shadcn/Base UI, Drizzle/PostgreSQL, decimal.js, Vercel Workflow/Blob e AI SDK. Le regole specifiche di questa versione di Next.js sono in [AGENTS.md](./AGENTS.md).
