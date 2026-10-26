# Risultati del confronto — direzione A

Bozza del 26 ottobre 2026. La direzione visuale è approvata; i confini di verifica sotto descritti sono proposti e attendono conferma prima della pubblicazione come specifica sul tracker. Questa tranche riguarda l'interfaccia dei risultati, dalla revisione di un profilo già disponibile alla scheda dell'offerta. Non esaurisce il progetto luce/gas, OCR, acquisizione quotidiana e MCP.

## Problem Statement

Una persona che confronta le utenze domestiche deve capire cosa conviene per i propri consumi, quanto potrebbe spendere e quali condizioni deve rispettare. Una lunga classifica o un risparmio privo di assunzioni non bastano a decidere. La stessa interfaccia deve essere utile quando il contratto attuale non è ricostruibile o quando è preferibile mantenerlo.

## Solution

Adottare la direzione A: un consiglio motivato, il costo annuo stimato, il risparmio solo quando confrontabile e poche alternative spiegate. Rendere disponibili la classifica, le ipotesi e una scheda dell'offerta prima del passaggio al fornitore. Luce e gas sono indipendenti e utilizzabili senza account, con riepilogo complessivo quando entrambe le forniture sono confrontabili sullo stesso periodo.

L'interfaccia riceve risultati strutturati da un unico servizio di confronto. Durante lo sviluppo, risposte sintetiche esplicitamente indicate consentono di verificare il percorso. L'utilizzo pubblico come comparatore richiede il successivo collegamento a catalogo e calcolo validati.

## User Stories

1. Come utente domestico, voglio vedere un consiglio motivato prima della classifica, per capire quale scelta prendere in considerazione.
2. Come utente, voglio vedere il costo annuo stimato dell'offerta, per confrontare l'intero periodo e non soltanto il prezzo della materia energia.
3. Come utente, voglio un risparmio stimato rispetto al contratto attuale calcolato su basi confrontabili, per valutare il beneficio del cambio.
4. Come utente con contratto attuale incompleto, voglio vedere i costi delle alternative e i dati mancanti, per proseguire senza un risparmio inventato.
5. Come utente con un'offerta già competitiva, voglio che il consiglio possa essere di restare, per evitare un cambio senza vantaggio.
6. Come utente, voglio che un beneficio dipendente dai prezzi futuri sia presentato come condizionato, per comprenderne il limite.
7. Come utente, voglio confrontare i diversi scenari disponibili, per vedere quando il vantaggio cambia.
8. Come utente con un risparmio piccolo, voglio vedere l'importo senza una soglia che decida al mio posto, per valutarne personalmente l'utilità.
9. Come utente che preferisce il fisso, voglio che il consiglio rispetti questa preferenza, per cercare stabilità nel prezzo dell'energia.
10. Come utente, voglio sapere che il prezzo fisso dell'energia non rende fisso il totale della bolletta, per interpretare correttamente la proposta.
11. Come utente, voglio un equivalente mensile secondario e indicato come media, per orientarmi senza confonderlo con una rata prevista.
12. Come utente, voglio rivedere consumi, periodo, località e caratteristiche della fornitura, per correggere i dati che influenzano il confronto.
13. Come utente, voglio confermare i dati dubbi prima di confrontare, per evitare risultati basati su informazioni non verificate.
14. Come utente che modifica i dati, voglio ricevere un nuovo confronto coerente, per non leggere il vecchio consiglio come se fosse ancora aggiornato.
15. Come utente con una sola fornitura disponibile, voglio completare il confronto luce o gas autonomamente, per iniziare senza entrambe le bollette.
16. Come utente, voglio aggiungere l'altra fornitura in seguito e ritrovare i dati della prima durante il percorso, per non ricominciare da capo.
17. Come utente con luce e gas, voglio vedere la spesa complessiva stimata quando i periodi sono compatibili, per valutare il totale delle due scelte.
18. Come utente, voglio consultare la classifica con il suo criterio di ordinamento, per esplorare oltre la raccomandazione.
19. Come utente, voglio aprire una scheda con costo, durata, requisiti dichiarati e codice offerta, per verificare la proposta prima di uscire dall'app.
20. Come utente, voglio raggiungere un collegamento verificato del fornitore, per proseguire la sottoscrizione sul suo sito.
21. Come utente senza collegamento specifico all'offerta, voglio poter consultare il codice e l'eventuale sito verificato del venditore, per cercarla senza un collegamento inventato.
22. Come utente da telefono o tastiera, voglio completare il percorso con contenuti leggibili e comandi accessibili, per utilizzare il confronto senza scorrimento orizzontale.
23. Come utente, voglio sapere se i dati sono di esempio, quali sono le fonti e a quale periodo si riferiscono, per capire su cosa si basa il risultato.
24. Come utente, voglio ricevere un'indicazione comprensibile quando non ci sono risultati, il calcolo non è disponibile o mancano informazioni, per sapere come proseguire senza false raccomandazioni.
25. Come utente, voglio arrivare al risultato senza creare un account, per valutare il servizio prima di scegliere eventuali funzioni di salvataggio.

## Implementation Decisions

### Decisioni confermate

- La struttura dei risultati segue la variante A scelta dall'utente. Il prototipo risolve la gerarchia visuale; importi, offerte, formula illustrativa e profilo ridotto non sono specifiche del dominio.
- Valgono le decisioni di prodotto Q1–Q13: raccomandazione motivata, gratuità iniziale, forniture indipendenti, nessun account obbligatorio, costo/risparmio annui primari, revisione dei dati e dettagli prima del fornitore.
- Il primo rilascio del prodotto farà sottoscrivere sul sito del fornitore. La lettura della bolletta resta l'ingresso principale previsto per il prodotto completo; il suo trattamento temporaneo è una decisione approvata da implementare nella tranche OCR.

### Contratto applicativo proposto per questa tranche

- Separare la presentazione da un servizio di confronto indipendente da React e dal futuro trasporto MCP. Il medesimo risultato potrà essere esposto dai due canali; questa tranche implementa il consumo web e il confine sostituibile, non il server MCP.
- Il servizio riceve un profilo confermato, la fornitura e le preferenze. Il profilo conserva periodo e unità dei consumi, dati territoriali e caratteristiche necessarie; il contratto attuale è facoltativo. I campi necessari e le relative assunzioni devono essere concordati con il motore reale: i pochi campi del prototipo non sono uno schema definitivo.
- Il risultato identifica profilo, fornitura, periodo di stima, versioni di catalogo/regole/scenario e provenienza. Riporta disponibilità del confronto, raccomandazione e ragioni, eventuale contratto attuale confrontabile, offerte ordinate, costi stimati, risparmio quando disponibile, requisiti, ipotesi e limiti. Ammissibilità, calcolo e ordinamento competono al servizio; la UI presenta l'esito.
- La disponibilità del costo di un'alternativa è distinta dalla disponibilità del risparmio. Se manca la base attuale, il risparmio è assente, non zero. Una raccomandazione condizionata conserva le ipotesi da cui dipende.
- Le risposte di sviluppo coprono risparmio confrontabile, preferenza per il fisso, convenienza a restare, vantaggio condizionato, contratto attuale incompleto, dati del profilo insufficienti, nessuna offerta e servizio non disponibile. Sono marcate come sintetiche; non riusano la formula proporzionale del prototipo come calcolo tariffario.
- La revisione dei dati chiede una nuova valutazione al servizio. Durante l'attesa o dopo un errore, il precedente risultato non viene presentato come aggiornato. La seconda fornitura conserva uno stato indipendente. Il riepilogo combinato usa soltanto risultati compatibili e ne mostra eventuali limiti.
- La scheda riporta i dati dichiarati dell'offerta e le informazioni disponibili senza trasformare un dato mancante in un requisito soddisfatto. Il passaggio esterno usa soltanto un URL verificato; se manca, mostra codice e canali verificati disponibili.
- La riscrittura iniziale mantiene lo stato del percorso in memoria. Salvataggio del profilo, sessioni persistenti e ripresa tra dispositivi non fanno parte di questa tranche.
- L'interfaccia usa il sistema di componenti già presente. Verificare focus, etichette, navigazione da tastiera, errori dei campi e larghezze ridotte. Le varianti alternative e i comandi del prototipo restano nel branch di riferimento.

## Testing Decisions

**Proposta da confermare con l'utente.** Verificare comportamenti osservabili attraverso due confini, evitando test su dettagli dei componenti o sulla formula dimostrativa:

1. **Risultato del servizio di confronto.** Usare risposte controllate per verificare che un profilo e le preferenze producano la richiesta corretta e che l'interfaccia rispetti l'esito restituito: nessun risparmio inventato, condizioni e periodi preservati, consiglio di restare correttamente presentato. Questa verifica non certifica l'esattezza economica delle fixture. Quando il motore sarà implementato, i suoi test useranno casi numerici indipendentemente verificati allo stesso confine.
2. **Percorso completo nel browser.** Dati disponibili → revisione/conferma → risultato A → classifica/scheda → passaggio al fornitore. Coprire le due forniture, modifica dei dati, preferenza per il fisso, i casi economici sopra elencati, stati di errore e assenza di risultati, tastiera e telefono. Verificare che gli esempi siano riconoscibili e non attivino contratti.

Non risultano suite di dominio o end-to-end già presenti nel repository. Le prove manuali del prototipo e i controlli TypeScript/lint sono precedenti utili per il percorso, non un'infrastruttura di test da promuovere. La scelta dello strumento di test è un dettaglio da definire nell'implementazione; servono pochi casi significativi ai confini indicati.

La parità web/MCP sarà verificata nella tranche MCP, passando lo stesso profilo e le stesse versioni al servizio condiviso.

## Out of Scope

- Motore tariffario reale, interpretazione di tutte le formule, imposte e arrotondamenti.
- Importazione quotidiana, storico del catalogo e costruzione delle curve previsionali.
- Upload, estrazione di testo, OCR e cancellazione effettiva dei documenti.
- Server MCP, autenticazione, profili salvati, notifiche e sincronizzazione tra dispositivi.
- Rilevamento automatico delle condizioni nascoste nelle note.
- Sottoscrizione in app e confronto delle offerte congiunte luce/gas.
- Pubblicazione del prototipo come comparatore reale o uso di dati a pagamento.

## Further Notes

- Fonte delle scelte: [design del prodotto](./design-prodotto.md). Vocabolario: [glossario](../GLOSSARY.md).
- Riferimento visuale conservato: branch `codex/prototype-confronto`, commit `28ec254`, variante A. Le varianti B/C documentano le alternative esplorate; non fanno parte della prima implementazione.
- [Studio di fattibilità](./studio-fattibilita.md): fonti, campi del profilo e proposte del motore sono contesto tecnico, con il loro stato di validazione. La scelta A non approva automaticamente tutte le proposte dello studio.
- L'interfaccia può essere implementata e verificata con risposte sintetiche prima delle integrazioni. Il rilascio del confronto reale richiede catalogo e calcolo validati; le previsioni variabili richiedono fonte, copertura, metodologia e condizioni applicabili all'acquisizione e al riuso pubblico qualificate, mantenendo il costo dei dati a zero. L'accesso API GME è una dipendenza specifica, non un blocco indiscriminato di ogni attività sui dati.
- L'upload reale richiede anche scelta e verifica del trattamento presso il fornitore OCR, cancellazione dopo la conferma e scadenza delle sessioni abbandonate. Questi punti restano aperti.
- La specifica non è ancora pubblicata sul tracker; la conferma dei confini di verifica precede quel passaggio. Una volta pubblicata, collegare l'issue al commit del prototipo e suddividere l'implementazione in attività eseguibili.
