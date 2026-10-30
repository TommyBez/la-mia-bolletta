# Sonda gas: quattro coefficienti trimestrali impliciti — 28 ottobre 2026

## Risultato

**Aggiornamento conclusivo della stessa ricerca:** il recupero è stato poi ottenuto anche **direttamente dalla vendita, senza usare l'anomalia IVA**, inviando profili mensili sintetici al normale modulo pubblico. Quattro sonde isolano i quattro gruppi trimestrali; due ulteriori simulazioni con una distribuzione mensile nuova e due offerte diverse confermano la curva entro un centesimo. Questa è la via principale, più semplice e precisa. L'analisi IVA sotto rimane un riscontro indipendente coerente, non una dipendenza del recupero.

### Recupero diretto mediante consumi mensili

Il corpo del normale form pubblico accetta `usaConsumi=SI`, `statoMisure=3` e dodici misure mensili sintetiche ordinate dalla più recente alla meno recente, da202608 a202509. Ogni record contiene `competenza_consumi` nel formatoYYYYMM e `delta_misure_gas`; le altre misure sono nulle nell'input e normalizzate a zero dal server. Non sono usati identificativi di fornitura, account, letture reali o endpoint di acquisizione di dati privati.

**Le date sono il calendario del profilo di consumo fornito come input**, non date di quotazioni storiche scaricate. Il dettaglio server conserva le dodici misure e cambia effettivamente la vendita in base al mese concentrato. L'esperimento misura quindi i coefficienti previsionali applicati dal simulatore a quella forma mensile.

Offerta ZERO FLEX, quota fissa174 €/anno, spreadzero. Concentrando tutti i1200Smc in un mese e azzerando gli altri undici, `indice_implicito = (vendita−174)/1200`:

| Mese del profilo | Gruppo trimestrale | Vendita Portale, € | Indice implicito, €/Smc |
| --- | --- | ---: | ---: |
| 202512 | Q4 | 1202,23 | circa0,85685833 |
| 202602 | Q1 | 1185,90 | circa0,84325000 |
| 202605 | Q2 | 920,22 | circa0,62185000 |
| 202608 | Q3 | 864,19 | circa0,57515833 |

Il sistema di disegno è `1200×I4`: rango4, senza ricostruzione fiscale o problema di pesi trimestrali collineari. L'incertezza dovuta a0,005 € di arrotondamento della vendita è circa±0,000004167 €/Smc per ogni coefficiente. I quattro valori centrali ricavati sono anche compatibili con i più larghi bound indipendenti ottenuti dall'IVA.

**Holdout registrato prima delle query:** nuovo profilo con120Smc a dicembre,240 a febbraio,360 a maggio e480 ad agosto. La curva precedente predice:

| Offerta | Vendita prevista non arrotondata, € | Vendita Portale, € |
| --- | ---: | ---: |
| ZERO FLEX, quota174/spread0 | 979,145 | 979,15 |
| Senza Pensieri S, quota144/spread0,08 | 1045,145 | 1045,15 |

Entrambe le risposte confermano il profilo mensile richiesto e la previsione senza cambiare i coefficienti. L'IVA anomala della seconda offerta non entra nel confronto: si usa esclusivamente la riga vendita.

Evidenze della via diretta: [predizioni prima degli holdout](./evidenze/sonda-au-gas-2026-10-28/monthly/predictions-before-holdout.json), [coefficienti, intervalli e risultati](./evidenze/sonda-au-gas-2026-10-28/monthly/direct-quarter-results.json), [verifica offline con Decimal](./evidenze/sonda-au-gas-2026-10-28/monthly/verify-direct-quarter-prices.py). Input mensili sintetici, profili normalizzati e frammenti economici sono archiviati nelle sei sottocartelle della stessa directory.

### Verifica indipendente mediante l'anomalia IVA

**Per il gas non siamo limitati a una sola media annua.** Il modello dell'anomalia IVA di Senza Pensieri, insieme a due medie di vendita con diversi profili di uso, fornisce un sistema di **rango quattro** per quattro coefficienti trimestrali. Gli arrotondamenti al centesimo impediscono di ottenere quattro numeri esatti, ma gli intervalli compatibili sono stretti e calcolabili. Sei nuove simulazioni pubbliche del 28 ottobre, registrate dopo le predizioni, confermano vendite e differenze IVA previste senza ricalibrare il modello.

Questo recupera coefficienti **impliciti condizionati al modello empirico**, non un file AU né una certificazione indipendente che la loro etichetta e precisione coincidano con la serie distribuita agli operatori. Non si riproduce l'IVA anomala nel motore fiscale applicativo: la si utilizza esclusivamente come misura sperimentale per isolare i coefficienti energia.

## Fonti ammesse e campione

- [Modulo pubblico Portale Offerte](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page), con profili sintetici anonimi: domestico, Pescara, contatore classe1, cottura+acqua (CCAC, chiamato CC negli script) oppure riscaldamento+cottura+acqua (RISC).
- [XML ufficiale gas del 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml): Senza Pensieri S `029886GSVML01XXSENZAPENSIDOMGAS3`, fisso144 €/anno, spread0,08 €/Smc; ZERO FLEX `000971GSVML01XXPROD1300109202600`, fisso174 €/anno, spreadzero. Entrambe indicizzate al medesimo indice codice14. Estratti XML conservati.
- [Regole ufficiali v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), pp33–34 e45: formula normativa e profili mensili. Il modello IVA anomalo è una deduzione dalle risposte, non la formula normativa documentata.
- [Ricostruzione IVA precedente](./reverse-engineering-iva-2026-10-27.md) e [otto calibrazioni e cinque holdout precedenti](./evidenze/reverse-engineering-gas-2026-10-27/phase2/iva-model-results.json).

Nessun sito del fornitore consultato, nessun account o consumo reale acquisito. Il campo profilo normalizzato di ogni nuova risposta conferma volume, uso e codice offerta richiesti.

## Perché le equazioni separano i trimestri

La normale vendita delle due offerte dà medie ponderate diverse per RISC e CCAC. L'anomalia IVA, invece, pesa più volte la quota energia dei primi480Smc: il consumo di novembre ha dodici ripetizioni, dicembre undici, fino all'ultimo mese una. Variando il volume annuo, i primi480Smc si esauriscono in mesi diversi, quindi cambiano i pesi dei coefficienti trimestrali anche mantenendo il profilo ufficiale.

Per ciascuna prova, eliminata la base non energetica mediante ZERO FLEX:

`10 × (IVA10_S − IVA10_ZERO) − 0,08 × Σ_m(r_m × q_m) = Σ_m((r_m−1) × q_m × P_m)`.

`q_m` è la parte del consumo mensile compresa nei primi480Smc; `r_m=12,11,…,1`. Ogni mese appartiene a uno dei quattro gruppi trimestrali. La stessa formula già verificata viene utilizzata senza aggiungere casi per le nuove prove.

Gli otto confronti IVA originari, più le due medie di vendita, producono una matrice di rango4. Il vincolo per una differenza fra due IVA arrotondate ammette errore inferiore a0,01 € (quindi0,10 € sull'imponibile prima del fattore10); ogni normale vendita ammette0,005 €. Lo script enumera i vertici del politopo non negativo, trova minimo e massimo di ogni coefficiente e verifica separatamente le nuove osservazioni.

## Intervalli ricavati prima delle nuove query

Unità: €/Smc, **coefficiente energia implicito**.

| Gruppo trimestrale del modello | Minimo compatibile | Massimo compatibile | Ampiezza |
| --- | ---: | ---: | ---: |
| Q4 | 0,85682937 | 0,85686053 | 0,00003116 |
| Q1 | 0,84322165 | 0,84334645 | 0,00012480 |
| Q2 | 0,62114849 | 0,62205321 | 0,00090472 |
| Q3 | 0,57491740 | 0,57580639 | 0,00088899 |

Non è corretto fermarsi all'espressione «esiste una famiglia di soluzioni» per descrivere il risultato precedente: una famiglia stretta dovuta agli arrotondamenti è diversa da quattro prezzi non identificabili. Qui i quattro coefficienti sono separabili, con precisione differente. Non scegliere una singola soluzione e presentarne tutte le cifre come certe.

## Sei nuove simulazioni, tre confronti indipendenti

Le predizioni sono nel [file registrato prima delle query](./evidenze/sonda-au-gas-2026-10-28/predictions-before-query.json). I risultati sotto **non** sono entrati nella calibrazione usata per predirli.

| Uso e consumo | Vendita ZERO, € | Vendita S, € | IVA10 ZERO, € | IVA10 S, € | Differenza IVA osservata, € | Differenza non arrotondata prevista, € |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| CCAC2000Smc | 1696,41 | 1826,41 | 62,61 | 528,27 | 465,66 | 465,65267–465,66829 |
| RISC1350Smc | 1298,27 | 1376,27 | 62,68 | 534,06 | 471,38 | 471,37313–471,38868 |
| CCAC480Smc | 539,38 | 547,78 | 58,09 | 333,55 | 275,46 | 275,45144–275,46775 |

Tutte le differenze IVA sono compatibili con i limiti registrati e con gli arrotondamenti. Anche le vendite ZERO ricadono negli intervalli previsti, considerando l'arrotondamento della risposta, mentre la differenza S−ZERO rispetta esattamente `−30 + 0,08 × consumo` nei tre campioni.

Soltanto **dopo** queste verifiche lo script aggiunge le nuove misure ai vincoli per un risultato raffinato. Il sistema complessivo rimane fattibile; il limite inferiore Q3 diventa0,57495822 e gli altri limiti cambiano poco. Non si è forzato il conteggio degli esiti positivi attraverso un fit successivo.

## Cosa è chiuso e cosa resta distinto

1. **Identificabilità numerica gas:** dimostrata direttamente con quattro profili mensili e soltanto la vendita. Il modello IVA offre anche un riscontro indipendente a rango4 con bound espliciti.
2. **Prova predittiva:** quattro sonde mensili e due nuovi holdout diretti; separatamente otto calibrazioni IVA originarie, cinque holdout precedenti e tre nuove coppie IVA. Nessun aggiustamento dopo gli holdout.
3. **Serie AU ufficiale e consegne:** i quattro gruppi sono quelli usati dal modello empirico novembre→ottobre: Q4 su novembre/dicembre/ottobre, Q1 su gennaio–marzo, Q2 aprile–giugno, Q3 luglio–settembre. Questa associazione di trimestre non dimostra da sola quale anno di consegna il server attribuisca al valore Q4. **Non interpretare automaticamente il coefficiente come quotazione autonoma per ottobre2027.** La metodologia [ARERA](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa) descrive la curva corrente a partire dal trimestre in corso; la finestra progettuale dal mese successivo è una decisione distinta.
4. **Copertura:** queste sonde verificano l'indice gas condiviso dalle due offerte. La verifica elettrica è una ricerca separata dell'agente principale. Le prove gas non attestano un servizio quotidiano stabile o diritti di redistribuzione.
5. **Utilità immediata:** i quattro coefficienti con i rispettivi intervalli sono un riferimento empirico assai più informativo della sola media annua. Possono verificare calcoli e differenze rispetto allo scenario proprio, mantenendo provenienza, mese di acquisizione e incertezza.

## Riproduzione ed evidenze

[Script numerico senza rete](./evidenze/sonda-au-gas-2026-10-28/verify-bounds-and-holdouts.py), [output con rango, bound e controlli](./evidenze/sonda-au-gas-2026-10-28/bounds-and-holdouts.json), [manifest SHA256](./evidenze/sonda-au-gas-2026-10-28/manifest.json). Lo script richiede Python+NumPy e conserva esplicitamente i dati di calibrazione separati dai nuovi holdout. Nella cartella sono archiviati i sei profili normalizzati, i frammenti economici HTML senza token/sessioni, gli estratti XML e lo script di replay del normale modulo pubblico. Nessuna modifica al motore applicativo o ad altri documenti di progetto.
