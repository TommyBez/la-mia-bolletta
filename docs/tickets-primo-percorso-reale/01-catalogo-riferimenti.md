# 01: Catalogo quotidiano e riferimenti ufficiali consultabili

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/7; dipendenze native verificate.

## What to build

Un operatore acquisisce le offerte luce/gas e i riferimenti ufficiali, pubblica una versione coerente e ne consulta stato e contenuti. Un import fallito lascia riconoscibile la versione precedente.

## Acceptance criteria

- [x] Acquisizione quotidiana idempotente di offerte simulabili ML e parametri; originali, checksum e manifesti persistiti, pubblicazione atomica per fornitura e nessuna pubblicazione fuori ordine.
- [x] Normalizzazione delle componenti conserva intervalli, condizioni, indici, periodi, campi originali e riferimenti; nessuna semplificazione che elimini formule difficili.
- [x] Riferimenti nazionali territoriali, fiscali e profili qualificati associati a fonte/versione/efficacia; distinguere il codice comune della fonte Portale dal codiceISTAT corrente e riconciliare fusioni/rinominazioni con crosswalk documentato; controlli di copertura e ambiguità impediscono di dichiarare pronto un insieme incompleto.
- [x] Comando operativo e lettura applicativa mostrano versione pubblicata, copertura, date fonte/acquisizione ed errore; originali privati separati dal catalogo consultabile.
- [x] Q47: ritardo dichiarato, massimo48ore entro applicabilità; riscaricare una vecchia fonte non ne rinnova la freschezza.
- [x] Test acquisizione→pubblicazione→lettura verificano file mancanti/corrotti, modifiche aURL invariato, concorrenza e luce/gas indipendenti. Nessun nuovo motore di costo in questo ticket.

## Blocked by

Nessuno: può partire subito dopo approvazione della specifica e del piano.
