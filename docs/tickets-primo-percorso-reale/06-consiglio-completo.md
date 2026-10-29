# 06: Consiglio A e percorso completo con bolletta, alternative e luce/gas

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/12; dipendenze native verificate.

## What to build

Dal caricamento di una bolletta si arriva al consiglioA, al confronto con il contrattoattuale quando ricostruibile, alla classifica/scheda e al fornitore; luce/gas rimangono indipendenti con riepilogo coerente.

## Acceptance criteria

- [x] Collegare realmente il profilo confermato daOCR/manuale ai due confronti eMCP; percorso completo nella preview interna protetta, non soltanto fixture o build.
- [x] Ricostruire attuale da bolletta confermata o archivio ufficiale pertinente; rinnovi ignoti non prolungati. Senza condizioni sufficienti niente risparmio inventato, alternative disponibili.
- [x] ConsiglioA motivato: cambiare/restare/condizionato, preferenza fisso, costorisparmioannui primari, media mensile distinta dalla rata e ipotesi esplicite.
- [x] Classifica e scheda conservano identità/versione/codice, condizioni, costi, scadenze e collegamento ufficialmente disponibile validato; mai siti fornitori per integrare condizioni.
- [x] Luce/gas con revisioni indipendenti, aggiunta secondafornitura e totale solo con periodi/versioni compatibili; niente risparmio totale senza base attuale completa.
- [x] Test completi da documento/manuale a risultato/dettaglio, correzioni e risposte tardive, contratto incompleto e restare, web/MCP equivalenti, telefono/tastiera. Documentare scarti noti e costi reali senza promettere risparmio garantito.
- [x] Raccordare eventuale UI già consegnata dai ticket#3–#5 senza dipendenza fittizia né chiusura/modifica implicita di quei ticket; tutto il nuovo percorso reale deve essere verificato.

## Blocked by

3, 4, 5

## Gate di chiusura

Implementazione e sei percorsi browser verificati nella preview interna protetta; #12 resta aperto finché #9 non completa la qualifica del corpus OCR reale. [Esiti del 30 ottobre](../verifica-primo-percorso-reale-2026-10-30.md).
