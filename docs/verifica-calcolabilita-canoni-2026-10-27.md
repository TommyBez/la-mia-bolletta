# Canoni: cosa possiamo calcolare con le sole fonti del Portale

Verifica conclusiva del 27 ottobre 2026 sulle tredici schede a canone/rata individuate nelle pagine ufficiali senza calcolo. Comprende lettura integrale dei testi, controllo dell'HTML e dei servizi pubblici osservati, tracciati e regole ufficiali, riferimento normativo richiamato dal Portale e tre simulazioni fiscali con profilo sintetico. Nessun sito o documento dei fornitori consultato. Non è una classifica del mercato né un motore già implementato.

**Decisione successiva Q29:** l'utente ha limitato la prima fase alle offerte dichiarate simulabili dal Portale. Queste tredici schede senza simulazione restano quindi fuori dalla prima consegna, anche nei casi numericamente ricostruibili. La ricerca è conservata per una possibile seconda fase; le conclusioni matematiche non costituiscono requisiti di implementazione della prima. Rimangono rilevanti le prove fiscali riutilizzabili anche sulle offerte ordinarie. Riferimento operativo: [design del prodotto](./design-prodotto.md).

## Risposta

**Sì, alcuni casi sono già calcolabili. Non abbiamo invece una base completa per calcolare tutte queste schede per qualsiasi profilo.** La presenza nella sezione senza simulazione non dimostra impossibilità matematica. Anche l'assenza di campi XML o l'indicazione di un canone comprensivo delle imposte non sono, da sole, impedimenti.

| Casi verificati | Esito con dati e regole ufficiali | Limite concreto |
| --- | --- | --- |
| Rate costanti negli XML, per esempio NeN e Gelsia | Usano il normale calcolo fisso/variabile; nessun nuovo algoritmo dovuto alla rata | Restano le normali dipendenze del costo completo, compreso lo scenario di prezzo per le variabili. La rata iniziale non coincide necessariamente con la spesa definitiva. |
| Cinque Fastweb Gas Flat | Canone, consumo incluso e conguaglio sono presenti. Calcolabili i cinque punti al consumo di riferimento e il caso verificato Light 300→350 Smc | Per generalizzare a qualsiasi consumo serve qualificare l'attribuzione delle basi IVA al canone aggregato e al conguaglio, soprattutto attraversando i 480 Smc. Le imposte territoriali si possono leggere dal Portale: non sono prezzi commerciali mancanti. |
| Quattro Fastweb Luce Flat: Start, Light, Pro, Ultra | Formula e trattamento fiscale disponibili, dato il canone applicabile | Il testo fornisce un minimo “a partire da”, ma non stabilisce se quel minimo si applichi a tutti i profili ammessi né come scegliere un eventuale altro importo. Non è dimostrata una specifica matrice nascosta. |
| Fastweb Luce Flat Partner Light | Non determinabile dai dati pubblici controllati | Mancano importo del canone e prezzo/meccanismo quantitativo del conguaglio. La soglia di 1.500 kWh è presente. Non usare i prezzi della diversa Light. |
| Casa Mia No Stress 800/1500/2500 | Non determinabili dai dati pubblici controllati | Mancano prezzo della rata, tariffa sottostante e regola di riconciliazione. La sola espressione rata costante non identifica un canone onnicomprensivo. |

I dati delle schede provengono dalle pagine ufficiali [luce](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) e [gas](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS). La [matrice dei tredici casi](./verifica-casi-canoni-2026-10-27.md) conserva nomi, identificativi pubblici, cifre, condizioni e limiti.

## Un calcolo concreto, oltre al consumo incluso

Fastweb Gas Flat Light pubblica **660 €/anno imposte incluse per 300 Smc**, con conguaglio di **1,50 €/Smc** in entrambe le direzioni. Il canone gas è un valore esatto, senza la dicitura “a partire da” delle schede luce.

Il riferimento ufficiale richiamato dal Portale prescrive prezzi unitari al netto delle imposte, salvo indicazione esplicita diversa. Il canone e lo sconto sono dichiarati lordi; il conguaglio segue quindi il criterio netto. Questa interpretazione è documentata nella [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md), con il Codice di condotta commerciale vigente e il documento degli indicatori del Portale. La mancanza di una ripetizione dell'etichetta fiscale accanto al conguaglio non è un'informazione del tutto irrisolvibile.

Per Milano domestico abbiamo letto nel dettaglio fiscale pubblico di un'offerta ordinaria:

- a 300 Smc: accisa 36,78 €, addizionale regionale zero;
- a 350 Smc: accisa 45,53 €, addizionale regionale zero;
- la variazione rimane nello scaglione con IVA al 10% sulla parte a consumo.

Ancorando il calcolo al canone lordo dichiarato, la componente invariata del canone non deve essere tassata nuovamente:

```text
660 + [1,50 × (350 − 300) + (45,53 − 36,78)] × 1,10
= 752,125 € → 752,13 €
```

È una stima del contratto descritto a un consumo effettivo di 350 Smc, senza sconto condizionato. Non prova che un nuovo cliente che dichiara 350 Smc possa scegliere la taglia Light: ammissibilità alla sottoscrizione e calcolo del conguaglio sono verifiche distinte. Non è una stima della Fastweb calcolata dall'interfaccia del Portale: il Portale fornisce descrizione, metodo e dati fiscali; l'aritmetica è nostra, ripetibile nello [script di verifica](./evidenze/canone-2026-10-27/check-method.py).

Al consumo di riferimento, senza conguaglio, i cinque canoni gas determinano già **432 € / 660 € / 1.104 € / 1.536 € / 1.956 €** rispettivamente per 150/300/600/900/1.200 Smc. Lo sconto di 10 €/mese è condizionato al mantenimento della luce: non lo sottraiamo automaticamente dalla stima basata sul criterio del Portale per gli sconti non condizionati. La dipendenza dalla luce è un requisito reale di queste offerte, distinto dalla calcolabilità.

## Il limite fiscale rimasto è specifico

Le [regole v4.2, pp.27 e 40](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf) definiscono il subtotale del canone fisso come `C + p × (Q − R)`, seguito dalle imposte. Per il gas, §4.1.4 pubblica scaglioni e formule fiscali, ma i passaggi esaminati non esplicitano come attribuire il canone aggregato, comprensivo dei consumi di riferimento, e il conguaglio alle diverse basi IVA. Il dettaglio pubblico ordinario conferma anche importi al 22% con consumi inferiori a 480 Smc: sarebbe errato applicare il 10% all'intera bolletta.

Nel caso 300→350 la parte variata resta soggetta alla stessa aliquota e il problema dell'allocazione invariata del canone si annulla. La dimostrazione non si estende automaticamente quando cambia la ripartizione fra scaglioni IVA. La [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md) mostra perché due normalizzazioni ancorate allo stesso canone lordo possono divergere oltre soglia; non propone di adottarne arbitrariamente una.

L'informazione necessaria per chiudere il caso generale è quindi **una regola ufficiale di attribuzione alle basi IVA del canone onnicomprensivo e del termine `p × (Q − R)`**, oppure dati ufficiali equivalenti che la rendano univoca. Non manca un altro prezzo del venditore nelle cinque schede gas.

## Come sono stati cercati i dati mancanti

La [verifica delle superfici pubbliche](./verifica-fonti-canoni-2026-10-27.md) ha controllato integralmente 1.058 schede luce e 249 gas, modali, attributi, form, JavaScript pertinenti e tutti i dieci download collegati dalla pagina Open Data. I dettagli delle non simulabili sono già nell'HTML; non è emerso un secondo servizio prezzi o un export dedicato collegato. Una ricerca lessicale estesa sulle 1.307 descrizioni ha prodotto diciannove candidati: i tredici canoni/rate esaminati e sei prodotti di altra struttura, riletti e separati nella nota dei casi.

I CSV gas non contengono le aliquote di accisa e addizionale richieste dal metodo. La verifica non si è fermata a questa assenza: il dettaglio pubblico “Imposte → Corrispettivi unitari” le espone. Per Milano sono stati acquisiti tutti e quattro gli scaglioni e controllati risultati a 300, 350 e 1.600 Smc. Le [prove UI](./evidenze/canone-2026-10-27/public-discovery/gas-tax-ui-cases.json) e i [riferimenti delle fonti](./evidenze/canone-2026-10-27/public-discovery/gas-tax-references.json) sono conservati. È dimostrata l'acquisibilità per il profilo verificato, non un dataset nazionale già costruito.

Il codice offerta non esposto nelle modali è un limite di identità/versionamento e di collegamento al servizio ordinario, non una variabile della formula. La finestra di adesione non è la durata del prezzo; l'assenza di `DURATA` numerico non rende automaticamente sconosciuto il primo canone annuo espressamente pubblicato. Non sono qualificati rinnovi o anni successivi.

## Conseguenza per il progetto

L'inventario deve distinguere prezzi assenti, importo applicabile non determinato, regola fiscale da qualificare e dati fiscali pubblici ancora da acquisire sistematicamente. Sono problemi diversi e richiedono attività diverse. Non si escludono i canoni per la sola categoria non simulabile; non si dichiara completo il confronto generale sulla base di un singolo punto o di un esempio entro lo stesso scaglione IVA.

Questa verifica aggiorna e prevale sulle precedenti cautele generiche di [esito degli approfondimenti](./esito-approfondimenti-formule-2026-10-27.md) e [chiarimento sulla calcolabilità](./chiarimento-calcolabilita-portale-2026-10-27.md). Non introduce una fonte del fornitore, un algoritmo fiscale autonomo o ticket già approvati.
