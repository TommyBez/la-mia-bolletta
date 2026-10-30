# Anomalia IVA Senza Pensieri: modello generale verificabile

27 ottobre 2026. Solo XML del Portale, simulazioni del modulo pubblico e regole ufficiali v4.2 p.33–34 e profili p.45. Nessun sito fornitore. Le risposte server e gli script sono nelle [evidenze della fase 2](./evidenze/reverse-engineering-gas-2026-10-27/phase2/).

## Risultato

L'anomalia è compatibile con una **somma ripetuta del cumulato mensile della sola quota energia**, nella costruzione dell'imponibile al 10%. La parte relativa a rete, oneri e accise rimane conteggiata una volta. Il residuo di imponibile viene poi assegnato al 22%, troncato a zero quando negativo.

Non abbiamo il codice server. Si tratta di un modello predittivo del comportamento, non di una descrizione certa della riga difettosa. Il modello riproduce sia la forma della curva al variare dei consumi sia l'effetto di un diverso spread e di un diverso profilo mensile.

## Formula candidata

Per ciascuno dei dodici mesi, ordinati novembre→ottobre:

- `q_m` = quota del consumo del mese che ricade nei **primi 480 Smc**, con ripartizione progressiva esatta; qui non si usa il criterio midpoint individuato per la vendita PREZZO NETTO.
- `r_m` = numero di mesi dal mese m all'ultimo mese incluso: 12, 11, …, 1.
- `P_m` = indice mensile previsto; per il modello lo rappresentiamo mediante quattro valori trimestrali.
- `s` = spread, 0,08 per S e 0,12 per L.
- `B_nonenergia` = imponibile al 10% per rete/oneri/accise, senza energia e quota fissa del venditore.

Il comportamento osservato è compatibile con:

```
IVA10_anomala = 0.10 * [B_nonenergia + SUM_m r_m * q_m * (P_m + s)]
IVA22 = MAX(0, 0.22 * [netto + imposte - IVA10_anomala / 0.10])
```

Il moltiplicatore `r_m` è proprio quello prodotto da `SUM(cumulatoEnergiaMensile)`: l'energia di novembre viene ricontata dodici volte, quella di dicembre undici, e così via.

Per eliminare `B_nonenergia`, il confronto con ZERO FLEX (spread zero e medesimo indice) o PREZZO NETTO (spread effettivo zero nella fascia dei primi 480) dà:

```
IVA10_S - IVA10_controllo
 = 0.10 * SUM_m q_m * [(r_m - 1) * P_m + r_m * 0.08]
```

Questa forma consente la verifica senza assumere un valore arbitrario dei corrispettivi di rete o della quota fissa. Le diverse quote fisse dei venditori non entrano in questa parte al 10%.

## Calibrazione e prove separate

Calibrazione: sette confronti RISC a 100, 500, 1.000, 1.159, 1.200, 1.400, 2.000 Smc, e uno senza riscaldamento a 1.200. Anche le due medie dell'indice già vincolate dalle vendite sono imposte come intervalli. Ciascuna differenza fra IVA arrotondate ammette un errore inferiore a un centesimo; non si forza un unico prezzo futuro a partire da importi arrotondati.

Esiste una famiglia di quattro valori trimestrali non negativi che soddisfa **tutti** questi vincoli. Un vertice ammissibile è circa Q4=0,85683205; Q1=0,84324643; Q2=0,62199624; Q3=0,57503104 €/Smc. Questi numeri sono **parametri impliciti compatibili**, non quotazioni ufficiali recuperate, né l'unica soluzione.

Prove successive NON incluse nella calibrazione:

| Prova | Previsione | Osservazione |
|---|---:|---:|
| S, RISC, 1.500 Smc | IVA10 non arrotondata in 536,032–536,058 € | 536,05 € |
| S, cottura+acqua, 100 Smc, controllo IVA10 9,98 € | intervallo compatibile con 67,36 € considerando entrambi gli arrotondamenti | 67,36 € |
| L−S, RISC, 100 Smc | differenza non arrotondata 3,9349888112 € | 3,94 € |
| L−S, cottura+acqua, 100 Smc | differenza non arrotondata 2,9687477332 € | 2,97 € |

Le due ultime prove sono particolarmente forti: non dipendono da alcun prezzo PSV calibrato. Dipendono solo dalla differenza di spread, 0,04, e dai pesi ufficiali. Una normale IVA del 10% darebbe una differenza di 0,40 €; il comportamento osservato è invece amplificato dal numero di ripetizioni mensili.

Per RISC la somma ponderata delle ripetizioni è 9,837472028; per cottura+acqua è 7,421869333. Sono numeri derivati dai profili ufficiali, non parametri adattati alle osservazioni.

## Perché IVA22 diventa zero

A S10, netto+imposte=201,65 €; IVA10 esposta=9,27 €. L'imponibile anomalo corrispondente è circa 92,7 € e `(201,65−92,7)*22% = 23,969 €`, che coincide con 23,97 € esposti.

A S100, invece, IVA10=92,67 implica un imponibile al 10% di circa 926,7 €, superiore all'intera base netta+imposte=305,07 €. Il residuo è negativo e il modello lo tronca a zero. Questo spiega insieme la voce IVA10 e la scomparsa dell'IVA22; non si tratta di un importo fiscale corretto semplicemente etichettato male.

La prova a consumi molto più elevati, quando il totale imponibile supera nuovamente l'imponibile al 10% gonfiato, potrebbe controllare anche il ritorno della voce IVA22. Non è indispensabile per i quattro holdout già verificati, ma rimane un limite esplicito della verifica del troncamento.

## File di verifica

[verify-iva-model.py](./evidenze/reverse-engineering-gas-2026-10-27/phase2/verify-iva-model.py) usa NumPy e un'enumerazione dei vertici del politopo a quattro dimensioni (nessuna dipendenza SciPy). Vincola i dati di calibrazione, determina intervalli di previsione e verifica separatamente i quattro holdout. Output: [iva-model-results.json](./evidenze/reverse-engineering-gas-2026-10-27/phase2/iva-model-results.json).

Non modifica il motore applicativo e non introduce correzioni per nome offerta. Il comportamento è descritto come anomalia sperimentale del ramo misto; non va assunto come regola fiscale da riprodurre automaticamente in produzione.

### Ulteriore holdout sul residuo al 22%

Prima della query L a 10 Smc con RISC era stata prevista IVA10 fra 9,66 e 9,67 € e IVA22 fra 44,30 e 44,34 €, a partire da S10 e dalle sole differenze contrattuali. Risultato: IVA10 **9,66 €**, IVA22 **44,32 €**, netto 297,48 €, imposte 0,57 €, totale 352,02 €. È un secondo caso positivo del residuo al 22%, oltre a S10; il controllo è incluso negli assert dello script senza cambiare la calibrazione degli otto campioni.

L'output strutturato è [iva-model-results.json](./evidenze/reverse-engineering-gas-2026-10-27/phase2/iva-model-results.json) e separa gli otto campioni di calibrazione dai cinque controlli holdout (due valori S, due differenze L−S, un caso L10 per IVA10/22).

Fonte dei profili e delle formule normative: [Regole ufficiali v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), pp. 33–34 e 45. Per la precedenza degli intervalli vedere il [dossier principale](./reverse-engineering-gas-2026-10-27.md).
