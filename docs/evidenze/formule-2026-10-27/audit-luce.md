# Audit formule luce — export del 27 ottobre 2026

## Dati e riproducibilità

Fonte: [export ML elettrico ufficiale](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml), link individuato da root nella [pagina Open Data](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page).

SHA256 `7c01ff47e716f5de6743d27f5489d0fd6e84fea4dc03f73148e38b8fc09b4c7a`.

Codifiche da [AU Trasmissione Offerte Mercato Retail v5.0, 15 dicembre 2025, pp.52–63](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true); calcoli selezionati confrontati con [regole v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), sezioni sconti e componenti impresa.

```sh
python3 audit-electricity.py PO_Offerte_E_MLIBERO_20261027.xml --date 2026-10-27 --out audit-electricity.json --csv audit-electricity.csv
python3 audit-electricity-examples.py PO_Offerte_E_MLIBERO_20261027.xml --out audit-electricity-examples.json
```

Non è un motore di calcolo dell'app. Lo script descrittivo legge tutti i record e salva una riga per ogni offerta domestica, con selezione e flag; le categorie si sovrappongono. Lo script economico calcola due esempi selezionati con aritmetica decimale e verifiche sulla struttura attesa.

## Universo

- 3.626 record e 3.626 codici unici; nessun duplicato di codice.
- 1.974 domestici (`TIPO_CLIENTE=01`).
- 1.941 sottoscrivibili singolarmente (`OFFERTA_SINGOLA=SI`); 33 esclusi perché solo in abbinamento.
- 1.916 includono cambio fornitore (`01`) oppure sempre (`99`) in almeno una delle occorrenze ripetute di `TIPOLOGIA_ATT_CONTR`; 25 esclusi perché solo altre operazioni.
- Tutti i 1.916 intersecano il giorno 27 ottobre 2026 nell'intervallo DATA_INIZIO/DATA_FINE.
- 328 PIVA distinte nel campo `PIVA_UTENTE`.

Il filtro di validità è sul **giorno**, non prova che un'offerta fosse già attivabile a una particolare ora. Territorio, potenza, consumo, residenza, modalità di pagamento e requisiti contrattuali restano da applicare per il singolo utente. Queste sono frequenze di codici pubblicati, non quote di mercato, famiglie commerciali indipendenti o numero di utenti interessati.

## Frequenze nell'universo selezionato

| Caratteristica | Offerte | Quota su 1.916 | PIVA distinte |
| --- | ---: | ---: | ---: |
| Fisso | 442 | 23.07% | 123 |
| Variabile | 1474 | 76.93% | 308 |
| Fasce (tutte) | 1208 | 63.05% | 280 |
| Tre fasce | 1103 | 57.57% | 260 |
| Biorarie | 100 | 5.22% | 36 |
| Peak/offpeak | 5 | 0.26% | 3 |
| Prezzi distinti tra fasce | 98 | 5.11% | 42 |
| Almeno uno sconto | 563 | 29.38% | 153 |
| Almeno uno sconto non condizionato | 234 | 12.21% | 80 |
| Sconto non condizionato con validità 01/02 | 223 | 11.64% | 77 |
| Almeno uno sconto condizionato | 410 | 21.40% | 108 |
| Sconto percentuale | 23 | 1.20% | 9 |
| Sconto a consumo | 59 | 3.08% | 25 |
| Sconto con scaglioni di consumo | 13 | 0.68% | 5 |
| Prezzo con scaglioni | 10 | 0.52% | 4 |
| Scaglioni prezzi standard con valori diversi | 9 | 0.47% | 3 |
| Periodo validità prezzo | 16 | 0.84% | 3 |
| Periodo validità prezzo standard | 15 | 0.78% | 2 |
| Cambio effettivo prezzo standard per periodo | 0 | 0.00% | 0 |
| Periodo validità sconto | 14 | 0.73% | 7 |
| Componente opzionale | 141 | 7.36% | 38 |
| FER standard | 333 | 17.38% | 49 |

Zero offerte classificate miste, FLAT, onnicomprensive oppure onnicomprensive a canone. I nomi commerciali “Flat” e “Canone Zero” non determinano la classificazione: contano i campi strutturati. Zero calendari personalizzati delle fasce, zero coefficienti indice diversi da uno, zero combinazioni di più riferimenti indice, zero prezzi standard per kW o una tantum.

L'indice presente è PUN mensile (1.423 offerte), trimestrale (48), bimestrale (9), PE (1). I conteggi includono **7 offerte classificate fisse con riferimento indice ancora presente**: non trasformarle automaticamente in miste né sommare l'indice senza qualificare la regola. Trentanove record indicano COEFFICIENTE esplicito, tutti uguali a 1.

Delle 16 offerte con PeriodoValidita prezzi, 15 hanno componenti standard: 12 Gas Sales e 3 NeN. In queste 15, il prezzo specifico e quello di default coincidono a parità di fascia; **non sono quindici cambi di prezzo nel primo anno**. Il sedicesimo caso è una componente opzionale. Gli scaglioni con prezzi standard differenti sono invece reali: 2 codici Edison Dynamic, 4 Iren e 3 con codice venditore 000670.

I 223 sconti non condizionati con validità ingresso/entro12mesi sono una dichiarazione XML; non sono una prova che i requisiti nel testo siano coerenti. Il noto caso A2A Bonus10 resta nel dato dichiarato. La rilevazione semantica delle anomalie non è stata implementata.

Nel giorno precedente lo stesso filtro produceva 1.931 codici/326 PIVA, 1.217 a fasce e 559 con sconto. È un controllo su due snapshot consecutivi, non una misura di stabilità nel tempo.

## Esempio economico: una formula rara può cambiare l'ordine

Nell'export sono solo 23 le offerte con sconto percentuale (1,20%). Prendendo **2.700 kWh annui**, limitatamente alle quote commerciali del venditore e agli sconti non condizionati del primo anno:

| Offerta e codice | Formula dal file | Quota prima degli sconti | Quota dopo sconti |
| --- | --- | ---: | ---: |
| Plenitude Fixa Time 24 Smart Luce `026160ESFML56XXLFIXA24VSMA151026` | 144 €/anno + 0,2079 €/kWh; sconto 30% sulla sola energia | 705,33 € | 536,931 € |
| IREN LOCK&FIX `000208ESFML02XX000IEDOLCFX261027` | 147 €/anno + 0,155 €/kWh; bonus 12 € nel primo anno | 565,50 € | 553,50 € |

Lo sconto percentuale vale **168,399 € prima dell'IVA**. Ignorando tutti gli sconti Plenitude supera Iren di 139,83 €; includendo quelli non condizionati risulta inferiore di 16,569 € sul subtotal commerciale. Entrambi hanno monoraria, CdispD codice14, nessun'altra componente regolata esplicita, nessuna componente opzionale/onnicomprensiva nel record e nessun vincolo geografico strutturato.

Questa è una dimostrazione dell'effetto della formula, **non una classifica dell'intero mercato e non la spesa annua totale**. Non sono simulati rete, oneri, imposte o piena ammissibilità del profilo. Iren richiede domiciliazione e bolletta digitale; Plenitude ha anche 5% condizionato alla domiciliazione, che qui non è applicato e per cui non si presume la modalità di cumulo. I prezzi XML sono già comprensivi delle perdite. Il risultato dimostra che la rarità da sola non basta a scartare lo sconto percentuale.

## Esempio economico: scaglioni

IREN PRIMA SCELTA LUCE NEW, codice `000208ESFML02XX00IEDOPRIMN261027`, dichiara 0,1573 €/kWh per i primi 3.000 kWh e 0,1903 €/kWh oltre. A 4.500 kWh, la sola quota energia corretta è **757,35 €**; applicare il primo prezzo a tutti i consumi darebbe 707,85 €, sottostimando di **49,50 € prima dell'IVA**. Non è una prova che questa offerta sia competitiva, ma misura l'errore economico evitato dal supporto degli scaglioni.

## Implicazione per Q27

La frequenza rende essenziali fasce e sconti. Per gli sconti percentuali, benché rari, il dato reale documenta un impatto rilevante e una possibile inversione dell'ordine relativo: vanno compresi nell'audit dei candidati della prima versione. Le formule a scaglioni richiedono benchmark su profili: non si possono eliminare per la sola frequenza bassa. Per le formule assenti il dato di un giorno non dimostra assenza permanente; conservarne la categoria e riesaminare la copertura su nuove acquisizioni. L'esatta competitività nazionale di tutti i casi resta da verificare con il motore completo, fonti previsionali qualificate e ammissibilità del profilo.
