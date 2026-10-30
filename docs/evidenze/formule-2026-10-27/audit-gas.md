# Audit delle formule gas — export del 27 ottobre 2026

## Esito

Gli sconti sono frequenti e possono ribaltare il confronto fra due offerte reali. Anche scaglioni e periodi, pur rari, producono differenze economiche misurabili: non è motivato escluderli per la sola frequenza. Le sei offerte miste richiedono invece chiarimenti sui dati: gli intervalli pubblicati non dicono come ripartire fisso e variabile. La loro rarità non prova una scarsa convenienza.

## Fonti e riproducibilità

- [Export ufficiale gas ML del 27 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml), scoperto dalla [pagina open data](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page). SHA256 `1c8c944a6911980c9946ea58e0fdd1b60cbeb795634e07e73f324eb75ae558df`.
- [AU, Trasmissione Offerte Mercato Retail v5.0, 15 dicembre 2025](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), tracciato disponibile dal 1 aprile 2026, pp. 52–62. Le codifiche sono state lette dalla fonte: domestico `01`; singola `SI`; cambio fornitore `01` oppure `99` (sempre); tipo offerta `01` fisso, `02` variabile, `03` FLAT, `04` mista. FLAT e canone onnicomprensivo sono concetti distinti. Indici `14` PSV mensile, `03` PSV trimestrale, `10` PSV bimestrale, `15` Psbil mensile, `06` Cmem. Le componenti impresa `TIPOLOGIA=01` sono standard, `02` opzionali.
- [AU, Regole per il calcolo della spesa v4.2, 5 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), pp. 37–42: calcolo gas, scaglioni e periodi, sconti. Il costo comprende anche rete, oneri e imposte. Le formule in questo audit non sostituiscono quel calcolo completo.

Strumenti solo di analisi, libreria standard Python, nessuna modifica all'applicazione:

```bash
python3 audit_gas.py /tmp/la-mia-bolletta-20261027-G.xml --date 2026-10-27 --output /tmp/audit-gas.json
PYTHONDONTWRITEBYTECODE=1 python3 gas-economic-cases.py /tmp/la-mia-bolletta-20261027-G.xml --output /tmp/gas-economic-cases.json
```

Comandi eseguiti da questa cartella; il secondo script importa `compact` dal primo. Gli importi sono calcolati con `Decimal`, con assert sui presupposti dei casi scelti. Il JSON completo rigenerato contiene anche campi economici, condizioni e provenienza di ogni record. Le evidenze persistenti sono [riepilogo](./summary.json), [classificazione dei domestici](./classification.csv) ed [esempi economici con estratti originali](./gas-examples.json). Il [README](./README.md) riporta i comandi dalla radice del repository e il recupero delle fonti.

## Denominatori

Conteggi elaborati dall'export citato sopra; un codice offerta conta una sola volta. Non ci sono codici duplicati nel file. I fornitori sono contati attraverso `PIVA_UTENTE`, non attraverso nomi commerciali o gruppi societari.

| Filtro cumulativo | Offerte | PIVA distinte |
| --- | ---: | ---: |
| Tutto il file gas ML | 2.830 | 323 |
| Clienti domestici | 1.624 | 306 |
| Sottoscrivibili singolarmente | 1.587 | 304 |
| Cambio fornitore ammesso | 1.571 | 303 |
| Validità dell'offerta interseca il 27 ottobre 2026 | 1.571 | 303 |

Restano da applicare, al singolo profilo, località, consumo, modalità di pagamento e requisiti contrattuali. Essere nell'insieme da analizzare non significa essere sottoscrivibile da qualsiasi famiglia italiana. Nel sottoinsieme ci sono 215 offerte con zone esplicite e 359 con almeno una condizione marcata limitante; i gruppi si sovrappongono. I file PLACET e dual fuel non sono inclusi; sono escluse inoltre le 37 offerte gas domestiche sottoscrivibili solo in abbinamento.

## Frequenza osservata nel perimetro di 1.571 offerte

Le caratteristiche si possono sovrapporre: non sommare le righe come categorie esclusive. Numeri misurati sull'export, non quote di contratti sottoscritti né frequenze storiche.

| Struttura/campo | Offerte | % | PIVA |
| --- | ---: | ---: | ---: |
| Prezzo fisso | 278 | 17,7% | 92 |
| Prezzo variabile | 1.287 | 81,9% | 300 |
| Prezzo misto | 6 | 0,4% | 2 |
| Sconti presenti | 512 | 32,6% | 145 |
| Sconti con almeno un importo non nullo | 506 | 32,2% | 144 |
| Sconti dichiarati non condizionati, ingresso/entro 12 mesi | 197 | 12,5% | 78 |
| Stessi sconti, con almeno un importo non nullo | 191 | 12,2% | 77 |
| Sconto fisso ingresso/entro 12 mesi non condizionato | 167 | 10,6% | 68 |
| Sconto vendita ingresso/entro 12 mesi non condizionato | 29 | 1,8% | 18 |
| Percentuale, ingresso/entro 12 mesi non condizionata | 10 | 0,6% | 3 |
| Scaglioni commerciali su componenti standard | 9 | 0,6% | 4 |
| Periodi di validità su prezzi standard | 8 | 0,5% | 3 |
| Periodo di validità con prezzo diverso dal default | 1 | 0,06% | 1 |
| Periodi di validità sugli sconti | 13 | 0,8% | 7 |
| Periodi su sconti ingresso/entro 12 mesi non condizionati | 8 | 0,5% | 6 |
| Componenti impresa opzionali | 154 | 9,8% | 40 |
| Componenti regolate di vendita esplicitamente selezionate | 384 | 24,4% | 86 |
| FLAT / onnicomprensive / canoni onnicomprensivi | 0 / 0 / 0 | 0% | 0 |
| Combinazioni di più indici / coefficienti diversi da 1 | 0 / 0 | 0% | 0 |

Gli scaglioni commerciali qui contati sono `ComponenteImpresa/IntervalloPrezzi/CONSUMO_DA` o `CONSUMO_A`: non sono gli scaglioni regolati di rete e imposte, comunque necessari nel calcolo gas. Nel file non ci sono prezzi con `PeriodoValidita/DURATA` inferiore a 12 mesi; sette degli otto casi con un periodo ripetono esattamente il prezzo di default. La presenza di un tag temporale non dimostra quindi una promozione con cambio prezzo nel primo anno.

Indici dichiarati, sempre nel perimetro: PSV mensile 1.160; Psbil mensile 93; PSV trimestrale 24; PSV bimestrale 11; Cmem 7; nessun indice 276. Sono conteggi di presenza del riferimento, indipendenti da `TIPO_OFFERTA`: comprendono le sei miste e due offerte classificate fisse che riportano anche il PSV. Queste ultime sono `001686GSFML00XXSC1026DO000000000` e `001686GSFML00XXGFC1026DO00000000`: l'audit le segnala, non risolve arbitrariamente il conflitto.

Sei dei dieci sconti percentuali non condizionati del primo anno sono di tipologia `04` e prezzo `0`: non devono essere presentati come vantaggi economici reali. La verifica dell'importo è distinta dalla presenza strutturale della formula.

## Esempi economici reali

Gli importi seguenti derivano dai prezzi nei record del medesimo export. Il consumo di 1.400 Smc è un'ipotesi di prova, non una dichiarazione sui consumi della famiglia media. Non si inventa una previsione PSV: quando l'indice è comune alle due offerte, il suo costo è lasciato esplicitamente fuori dal confronto relativo.

### Un bonus ribalta l'ordine fra due offerte

Profilo comune: utenza domestica già attiva, cambio fornitore, addebito diretto e bolletta digitale, permanenza per tutti i primi 12 mesi. Entrambi i record hanno durata 12 mesi, PSV mensile `14`, nessun limite territoriale o di consumo strutturato, nessuna componente regolata di vendita aggiuntiva e nessuna clausola marcata limitante. Le condizioni testuali pubblicate sono state lette, ma non è stata effettuata una validazione di un contratto firmato.

| Offerta / codice | Quota annua | Quota su 1.400 Smc | Bonus primo anno, prima IVA | Parte commerciale senza bonus | Con bonus |
| --- | ---: | ---: | ---: | ---: | ---: |
| Union Web PO, `027208GSVML01XX00000000000033846` | 144 € | 1.400 × 0,075 = 105 € | 144 € al 12° mese | 249 € | 105 € |
| GASXPLUS, `028330GSVML01XXDOPSV26091A010500` | 60 € | 1.400 × 0,055 = 77 € | 20 € in quattro rate | 137 € | 117 € |

Senza bonus GASXPLUS risulta inferiore di 112 € nella parte commerciale. Applicando i bonus, Union risulta inferiore di 12 €. Si ribalta l'ordine di questa parte del costo. I campi di entrambi gli sconti indicano condizione `00`, validità `01`/`02` e IVA `01` (prima IVA); il testo GASXPLUS richiede 12 mesi consecutivi attivi, quello Union il raggiungimento del dodicesimo mese. Le ipotesi della prova li soddisfano.

**Non sono due bollette da 105 e 117 euro.** Mancano il costo dell'indice comune, rete, oneri e imposte. Questa prova giustifica la necessità di interpretare i bonus, senza dichiarare la migliore offerta dell'intero mercato o il risparmio totale dopo imposte.

### Uno scaglione raro vale 38,50 € nella quota commerciale

Edison Dynamic Gas, codice `000190GSVML13XXLGSPGX001X14XXXX5`, contiene nella macroarea `04`:

- 0–700 Smc: 0,055 €/Smc;
- da 701 Smc: 0,11 €/Smc;
- prezzo di default: 0,11 €/Smc.

A 1.400 Smc, la componente è `700 × 0,055 + 700 × 0,11 = 115,50 €`. Usare solo il default produrrebbe `1.400 × 0,11 = 154 €`: **38,50 € di differenza**, prima IVA e sulle sole componenti considerate. Non è una classifica contro altri fornitori, ma dimostra che ignorare la formula altera concretamente il risultato.

### Un periodo raro vale 133 € rispetto al default

ALTIS26GAS_DOMESTICO, codice `000579GSVML25XXPSVVARIABILED2025`, contiene nella macroarea `02` un prezzo di 0,095 €/Smc per 12 mesi e fino a 200.000 Smc, con default 0. A 1.400 Smc i primi dodici mesi richiedono **133 €** di questa componente; leggere solo il default li cancellerebbe erroneamente. L'offerta ha anche quota fissa e sconto, che qui non vengono sommati perché la prova isola l'effetto del periodo. È limitata alla provincia di Belluno. È un caso raro che richiede supporto per non produrre falsa convenienza.

## Casi non risolti da questa analisi

- Le sei miste “Senza Pensieri” hanno due intervalli default sovrapposti con `TIPO_PREZZO=01` e `02`, senza scaglione o periodo che spieghi la ripartizione. Non sommare entrambi, non trattare automaticamente metà fisso e metà variabile. Occorre qualificare la condizione della stessa versione offerta prima di valutarne la competitività.
- Tre offerte di `PIVA_UTENTE` corrispondente al prefisso `000670` contengono scaglioni sovrapposti (`0–500`, `0–1000`, `501–1000`): lo script preserva i campi; non inventa una priorità per renderli calcolabili.
- `CON NOI PLUS DOMESTICI` ha sconto testuale “a partire dal 7° mese”, ma `PeriodoValidita/DURATA=7` esprime i primi sette mesi secondo le regole AU. È una divergenza da conservare e verificare, non una formula da interpretare silenziosamente in base alla sola nota.
- L'assenza di FLAT e canoni nel singolo export gas non prova l'assenza futura. Il criterio Q27 richiede osservare anche la rilevanza economica prima di escludere le formule presenti ma rare; dove la semantica è ambigua, l'esito è “da qualificare”, non “non conveniente”.
