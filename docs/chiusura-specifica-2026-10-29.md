# Chiusura del primo percorso reale — controllo del 29 ottobre 2026

Stato: audit completato; Q45 corretta dall’utente, Q46/Q47 approvate; specifica ancora locale. Nessuna nuova infrastruttura o spesa attivata, nessun ticket creato o modificato.

## Stato verificato

- La worktree corrente contiene lo starter UI e le ricerche/documenti; non un motore, ingestion, OCR o MCP implementati. Nessuna suite di dominio individuata. Branch `codex/risultati-a`.
- GitHub letto oggi: spec#1 e ticket#3/#4/#5 ancora aperti. Riguardano la precedente tranche sintetica, non attestano il nuovo percorso reale. Non modificarli o chiuderli implicitamente quando si prepara il nuovo backlog.
- Q1–Q44 restano le decisioni approvate. Q23 è superata da Q44; Q41 è ripiego di Q42. Aggiornamento coefficienti mensile manuale con script separato/import DB; offerte aggiornate quotidianamente; confronto sulla finestra del Portale.
- Q40 chiude i confini di verifica: profilo confermato/versioni→confronto condiviso, documento→candidati, acquisizione→catalogo pubblicato, percorsi completi web/MCP. Non richiedono una nuova conferma.

## Esito dei due audit

L'[audit di dominio](./audit-finale-dominio-2026-10-29.md) distingue semantica ancora ignota da normale implementazione. Periodicità degli indici, Psbil, PE/CMEM, profili gas e default luce hanno fonti ufficiali o decisioni già disponibili. I casi gas concorrenti e l'IVA anomala sono chiusi come policy Q36–Q38. Canoni senza simulazione fuori fase1 per Q29.

Restano due qualifiche tecniche, a carico dell'agente: Peak/OffPeak (cinque record osservati, tre nuove prove dimostrano che non basta rinominare F1/F2/F3) e assemblaggio nazionale dei riferimenti fiscali/territoriali con efficacia verificata. Sono prerequisiti dell'accettazione del confronto nazionale, non decisioni da chiedere all'utente e non motivi per escludere offerte. La fonte dei profili gas nazionali esiste già nella guida AU: estrarla non richiede una nuova ricerca di mercato.

La [proposta operativa](./proposta-operativa-2026-10-29.md) raccomanda Vercel, Neon Postgres e Blob privato, deployment interno protetto, AI SDK con provider Google diretto e Gemini Flash corrente candidato. Contiene limiti, prezzi ufficiali in valuta originale, condizioni del canale, upload diretto, metriche e guardrail. Queste capacità documentate non sono misure già superate su bollette reali. Librerie e dettagli di implementazione restano responsabilità tecnica dell'agente.

## Decisioni operative confermate

| ID | Decisione approvata | Motivo / confine |
| --- | --- | --- |
| Q45 | Monitorare i costi senza definire un budget a priori. Nessun tetto mensile complessivo o sottolimite OCR approvato. | Misurare costi di hosting, DB, storage e OCR, con volumi e costo per estrazione. I precedenti50EUR/mese e20USD OCR sono proposte superate, non limiti applicativi. Restano controlli tecnici su doppie chiamate, concorrenza e timeout. |
| Q46 | Una bolletta per fornitura: PDF fino a10MB/20pagine, oppure fino a10foto JPG/PNG,10MB per foto e30MB totali; oltre limite percorso manuale. | Limiti iniziali del pilot, non limiti del modello né permesso di tagliare pagine silenziosamente. Qualità, costo e tempi da misurare su corpus autorizzato rappresentativo durante lo sviluppo. |
| Q47 | Catalogo in ritardo consultabile con avviso per massimo48ore dalla data/versione fonte utilizzabile, con offerte/parametri ancora applicabili; oltre sospendere i consigli interessati. Coefficienti del mese corrente, coerenti con i quattro trimestri richiesti; al nuovo mese nessun riuso silenzioso dello snapshot precedente. | Politica prudenziale iniziale approvata, non SLA empiricamente dimostrato. Acquisire nuovamente un vecchio file non ne rinnova la freschezza. Cambi di efficacia o copertura prevalgono sulla finestra massima. GME resta ripiego Q42 esplicito e validato, non sostituzione opaca per un import fallito. |

Nessuna nuova domanda su gas/luce, fisse/variabili, disponibilità dati pagati, conservazione documenti, account o finestre di calcolo: sono già decisi.

## Criteri di accettazione da portare ai ticket

- Matrice delle formule e dei riferimenti con fonti/versioni/efficacia; risultato nazionale completo soltanto dopo le qualifiche dichiarate.
- Fixture indipendenti e tolleranze giustificate da arrotondamenti; differenza IVA nota mantenuta. Verificare gas/scaglioni sulla finestra Q44, senza dichiarare che le vecchie prove novembre→ottobre testino automaticamente ottobre→settembre.
- Import manuale mensile→validazione→DB atomico→stesso snapshot web/MCP. Nessun numero mancante sostituito con zero, nessun aggiornamento fuori ordine pubblicato.
- OCR su corpus annotato autorizzato (proposta30documenti rappresentativi), metriche per campo/formato, costi e latenze misurati, conferma/correzione obbligatorie. Nessuna credenziale o corpus reale presenti/validati per questa prova documentale.
- Upload/lettura privati e accesso MCP realmente provati nel deployment interno; misurazione dei costi, timeout, doppio invio e provider indisponibile verificati.

## Passaggi successivi

Q45–Q47 ricevute e registrate; completare le qualifiche tecniche prima di dichiarare risolte le semantiche del motore. Confermare l'intesa finale di grill-with-docs, consolidare/pubblicare la spec con to-spec, poi proporre poche slice verticali con dipendenze in to-tickets. L'implementazione dell'intero percorso non è un prerequisito per scrivere i ticket; una semantica ancora ignota non va però mascherata da implementazione già specificata. Il piano può rendere esplicite indagini verificabili e i blocchi che risolvono. Pubblicare la suddivisione dei ticket soltanto dopo approvazione della granularità e delle dipendenze.

## Esito del percorso Matt

Spec#6 pubblicata e sei ticket#7–#12 approvati/pubblicati con sotto-issue e blocchi nativi verificati. Frontiera:#7/#8/#9; poi#10/#11 in parallelo; infine#12. Le qualifiche successive all'audit sono nella nota sui riferimenti territoriali, in quella fiscale gas e nella qualifica Peak/OffPeak; le attività esplicitano completamento dati e controlli senza estendere i campioni a una copertura nazionale inesistente. Il vecchio elenco «passaggi successivi» sopra conserva la sequenza concordata, ormai eseguita.
