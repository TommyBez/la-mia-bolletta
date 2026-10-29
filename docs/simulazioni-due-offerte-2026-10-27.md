# Simulazioni sul Portale Offerte, 27 ottobre 2026

**Aggiornamento successivo:** il [reverse engineering con nuove prove discriminanti](./reverse-engineering-gas-2026-10-27.md) identifica un modello mensile predittivo compatibile con tutti i campioni di vendita qui riportati e con quelli aggiuntivi. Le conclusioni sotto descrivono lo stato precedente a tale verifica; non costituiscono più un blocco sulla riproduzione numerica della vendita nei due casi. Rimangono distinti la precedenza generale degli intervalli e l'anomalia fiscale.

Fonte: interfaccia pubblica del [Portale Offerte](https://www.ilportaleofferte.it/portaleOfferte/). Profilo sintetico, nessun accesso autenticato o sito fornitore. Le pagine di dettaglio dipendono dalla sessione; gli snapshot e lo screenshot sono nelle [evidenze](./evidenze/simulazioni-due-offerte-2026-10-27/).

## Milano

Per gas domestico non vulnerabile, CAP 20121, 1.400 Smc/anno, cottura, acqua calda e riscaldamento, classe «Fino a G6», il Portale ha accettato `029886GSVML01XXSENZAPENSIDOMGAS3` e mostrato Senza Pensieri S Domestico a **2.628,61 €/anno**, valida 08/10–31/10/2026. Il risultato riproduce la precedente osservazione nel file [casi UI](./evidenze/formule-2026-10-27/portale-ui-cases.json); i dettagli dei componenti lì conservati derivano dalla precedente sessione. La nuova visita ha confermato il totale, non riaperto il dettaglio. L'icona indica sconti non sempre applicabili; non si assume soddisfatto lo sconto condizionale.

Lo stesso campo codice ha segnalato PREZZO NETTO ZERO GAS «Offerta non disponibile per il CAP o Comune inserito». L'XML ufficiale limita l'area a regioni 13 e 14 e province 044, 109 e 043: Milano è fuori. Questo non prova che l'offerta non sia simulabile.

## Pescara

Per consentire la verifica territoriale ho scelto Pescara (suggerimento del Portale, ISTAT 068028), sempre domestico non vulnerabile, cottura, acqua calda e riscaldamento, consumo 1.400 Smc, classe visualizzata nel dettaglio «Portata < G6». PREZZO NETTO ZERO GAS `000670GSVML56XXXXXGMPREZZONETTO0` è stata accettata e il Portale ha prodotto **2.381,31 €/anno**. Data ricerca 27/10/2026; validità offerta 22/10–22/11/2026; condizioni economiche 12 mesi. Il Portale indica una stima annua e previsioni disponibili alla consultazione, senza esplicitare nelle schermate osservate date iniziale e finale del periodo di stima.

| Voce mostrata | Euro |
| --- | ---: |
| Vendita gas naturale | 1.314,19 |
| Rete gas | 426,82 |
| Oneri generali di sistema | 74,57 |
| Spesa netta imposte | 1.815,58 |
| Imposte | 197,96 |
| IVA 5% | 0,00 |
| IVA 10% | 62,68 |
| IVA 22% | 305,09 |
| Totale stimato | 2.381,31 |

Il dettaglio indica offerta variabile, PSV mensile, 120 €/anno di commercializzazione; cambio fornitore o voltura, attivazione da qualsiasi canale, consumi «Sempre». Nella quota energia espansa compaiono 0 €/Smc da 0 a 500, 0 da 0 a 1000 e 0,10 da 1001; il testo della componente menziona 0,05 €/Smc da 501 a 1000, ma una riga separata a 0,05 non è visibile. La mancata visualizzazione non dimostra che il server escluda quel valore dal calcolo né chiarisce il criterio applicato alle sovrapposizioni. Lo screenshot e lo snapshot espanso documentano il dato.

Con una nuova ricerca indipendente per codice e lo stesso profilo a Pescara, **Senza Pensieri S Domestico** risulta **2.655,99 €/anno**: vendita 1.421,91 €, rete 426,82 €, oneri 74,57 €, netto 1.923,30 €, imposte 197,96 €, IVA 5% 0 €, IVA 10% 534,72 €, IVA 22% 0 €. Queste etichette fiscali sono trascritte come mostrate e richiedono riconciliazione. Il dettaglio indica offerta mista, PSV mensile, condizioni economiche 12 mesi, attivabile per tutte le prestazioni e senza limite di consumo; 24 €/anno Club 0 è uno sconto non sempre applicabile con requisiti specifici, non assunto nel profilo. Il [dettaglio](./evidenze/simulazioni-due-offerte-2026-10-27/senza-pensieri-pescara-1400-ax.txt) conserva i requisiti visualizzati.

## Prove a consumi diversi e ricostruzione

Ricerche indipendenti del 27/10/2026, con il medesimo profilo Pescara. Importi annui in euro, trascritti dal dettaglio; IVA 5% sempre zero.

| Consumo | Offerta | Vendita | Rete | Oneri | Netto | Imposte | IVA 10% | IVA 22% | Totale |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 500 | Prezzo Netto | 536,40 | 189,25 | 15,17 | 740,82 | 66,72 | 61,94 | 41,38 | 910,86 |
| 500 | Senza Pensieri | 600,40 | 189,25 | 15,17 | 804,82 | 66,72 | 463,26 | 0,00 | 1.334,79 |
| 1.000 | Prezzo Netto | 952,79 | 321,23 | 48,17 | 1.322,19 | 139,63 | 62,51 | 184,08 | 1.708,42 |
| 1.000 | Senza Pensieri | 1.056,79 | 321,23 | 48,17 | 1.426,19 | 139,63 | 516,44 | 0,00 | 2.082,27 |
| 1.001 | Prezzo Netto | 953,63 | 321,49 | 48,24 | 1.323,36 | 139,78 | 62,51 | 184,36 | 1.710,02 |
| 1.200 | Prezzo Netto | 1.143,59 | 374,02 | 61,37 | 1.578,98 | 168,80 | 62,61 | 246,77 | 2.057,17 |
| 1.200 | Senza Pensieri | 1.239,35 | 374,02 | 61,37 | 1.674,74 | 168,80 | 526,79 | 0,00 | 2.370,34 |
| 1.400 | Prezzo Netto | 1.314,19 | 426,82 | 74,57 | 1.815,58 | 197,96 | 62,68 | 305,09 | 2.381,31 |
| 1.400 | Senza Pensieri | 1.421,91 | 426,82 | 74,57 | 1.923,30 | 197,96 | 534,72 | 0,00 | 2.655,99 |
| 2.000 | Prezzo Netto | 1.863,87 | 585,42 | 111,72 | 2.561,01 | 298,66 | 62,68 | 491,24 | 3.413,57 |
| 2.000 | Senza Pensieri | 1.969,59 | 585,42 | 111,72 | 2.666,73 | 298,66 | 542,66 | 0,00 | 3.508,04 |

[Snapshot 500 Prezzo Netto](./evidenze/simulazioni-due-offerte-2026-10-27/netto-500-ax.txt), [1.000 Prezzo Netto](./evidenze/simulazioni-due-offerte-2026-10-27/netto-1000-ax.txt), [1.200 Prezzo Netto](./evidenze/simulazioni-due-offerte-2026-10-27/netto-1200-ax.txt), [500 Senza Pensieri](./evidenze/simulazioni-due-offerte-2026-10-27/senza-500-ax.txt), [1.000 Senza Pensieri](./evidenze/simulazioni-due-offerte-2026-10-27/senza-1000-ax.txt). Le immagini corrispondenti sono nella stessa cartella.

La vendita Senza Pensieri è compatibile, ai centesimi mostrati, con 144 €/anno + 0,08 €/Smc + una stessa componente PSV stimata implicita di circa 0,83279 €/Smc, rispettivamente 416,40 €, 832,79 € e 1.165,91 € nei tre profili. Questo è un riscontro numerico compatibile con il ramo variabile, non una prova del codice interno o della selezione generale dei rami misti.

Prezzo Netto a 500 e 1.000 è compatibile con 120 € più la stessa componente PSV, senza contributo netto distinguibile del valore 0,05 nei campioni. A 1.400, sottraendo 120 e 1.165,91 dalla vendita restano 28,28 €; a 1.200, usando l'indice medio ricavato dai campioni, restano circa 24,24 €. Il trattamento esatto degli scaglioni sovrapposti rimane non identificato: il controllo indipendente a 1.200 smentisce una prima ipotesi che prevedeva una vendita di circa 1.127,66 €. La mancata riga 0,05 nella UI non dimostra esclusione dal calcolo.

Le etichette IVA di Senza Pensieri sono anomale anche a 500 e 1.000: il Portale mostra rispettivamente 463,26 € e 516,44 € sotto «IVA 10%» e zero sotto «IVA 22%». La loro somma compare nel totale; non si è verificata la causa né corretto il dato. I totali delle due offerte differiscono quindi anche per queste voci, oltre che per la vendita. Le cifre sono stime del Portale alla data indicata e non prezzi futuri garantiti.

Ulteriori prove indipendenti: [1.001 Smc](./evidenze/simulazioni-due-offerte-2026-10-27/netto-1001-ax.txt) e [2.000 Smc](./evidenze/simulazioni-due-offerte-2026-10-27/netto-2000-ax.txt). Da 1.000 a 1.001 la vendita aumenta di 0,84 €, senza un salto di circa 20 €: questo confuta l’ipotesi che il coefficiente residuale osservato a 1.200 e 1.400 si applichi improvvisamente a tutto il consumo appena oltre 1.000. Il valore a 2.000 coincide con una previsione alternativa basata su cumulato mensile, che però non ha previsto il caso 1.200: non basta a stabilire il meccanismo.

Una nuova ricerca Senza Pensieri a 1.400 conferma [in lista](./evidenze/simulazioni-due-offerte-2026-10-27/senza-1400-lista-ax.txt) il totale 2.655,99 €, uguale al dettaglio: la voce IVA osservata partecipa al totale. Il pulsante ufficiale «Esporta dettaglio» ha aperto `/portaleOfferte/do/export/exportDettaglio`, bloccato dal browser con `ERR_BLOCKED_BY_CLIENT`; nessun export è stato ottenuto. La causa della voce fiscale rimane ignota.

Le ulteriori simulazioni [Senza Pensieri 1.200](./evidenze/simulazioni-due-offerte-2026-10-27/senza-1200-ax.txt) e [2.000](./evidenze/simulazioni-due-offerte-2026-10-27/senza-2000-ax.txt) danno, dopo sottrazione dei 144 € e dello spread ipotizzato di 0,08 €/Smc, rispettivamente 999,35 € e 1.665,59 €, coerenti con circa 0,83279 €/Smc. Sottraendo tali basi implicite e i 120 € dalla vendita Prezzo Netto si ottengono residui 24,24 €, 28,28 € e 78,28 € per 1.200, 1.400 e 2.000 Smc. Sono residui, non spread identificati con certezza: il trattamento degli intervalli potrebbe incidere anche sulla quota indice. La progressività annuale semplice 0 fino a 1.000 e 0,10 sull’eccedenza darebbe 20, 40 e 100 €, non questi residui. Nessuna formula alternativa è dimostrata.

Una [risposta HTML server indipendente](./evidenze/simulazioni-due-offerte-2026-10-27/senza-1000-server-sanitized.html), con [profilo di richiesta](./evidenze/simulazioni-due-offerte-2026-10-27/senza-1000-request-profile.json), riporta già a 1.000 Smc l’IVA 10% di 516,44 € e il totale 2.082,27 €. Non è quindi un valore introdotto soltanto dalla visualizzazione JavaScript. Applicando anche il 22% all’intera base esposta netto più imposte (1.565,82 €) si ottengono circa 344,48 €, meno di 516,44 €: il dato non è riconciliabile usando soltanto le aliquote e le basi esposte. La causa lato server resta sconosciuta.

## Esito e limite della ricostruzione

Le prove richieste sono complete; la ricostruzione dell'intero calcolo non lo è. Il [riepilogo numerico](./evidenze/simulazioni-due-offerte-2026-10-27/reconciliation.json) riproduce ai centesimi la vendita di Senza Pensieri su tutti e cinque i consumi osservati usando `144 + C × (0,08 + 0,832793)`. Il valore 0,832793 è una media annua implicita compatibile con questi risultati arrotondati, non una quotazione ufficiale acquisita né una ricostruzione univoca dei dodici prezzi mensili. Nessun requisito di parità con le curve forward del Portale è dichiarato soddisfatto.

Per PREZZO NETTO restano da spiegare i residui della vendita in presenza degli intervalli sovrapposti; per Senza Pensieri resta da spiegare la base e l'algoritmo della voce IVA restituita dal server. I campioni supplementari hanno confutato spiegazioni semplici, non identificato una regola generale. Non aggiungere correzioni ad hoc al motore per far coincidere questi importi e non classificare le offerte come non simulabili.

Riferimenti ufficiali riletti per la ricostruzione:

- [Regole di calcolo della spesa annua v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), §§4.1.4, 4.3.1, 5 e appendice: imposte, formule fisse/variabili/miste, periodo dei forward e profili mensili gas. Le regole del ramo misto non forniscono una precedenza esplicita per i due intervalli coincidenti del caso.
- [Tracciato AU v5.0](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), pp.62–63: l'esempio degli scaglioni applica ciascun prezzo alla porzione di consumo corrispondente; non risolve la sovrapposizione specifica osservata.
- [JavaScript pubblico del modulo di confronto](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/confrontaOfferte.js): usato per verificare validazione del codice, campi e invio dei moduli ufficiali. In questo file non è esposto l'algoritmo tariffario server. La conferma HTTP ha usato una nuova sessione anonima e il medesimo profilo sintetico; nessun cookie o token di sessione è conservato nel repository.

Per chiudere la ricostruzione serve un chiarimento ufficiale sul trattamento dei record sovrapposti e sulla voce IVA anomala, oppure una regola pubblica aggiuntiva che spieghi e predica questi campioni. Non è stato contattato alcun soggetto esterno e non è stata attivata alcuna fonte a pagamento.
