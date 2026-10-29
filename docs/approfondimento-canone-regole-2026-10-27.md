# Canone fisso, rata costante e offerte onnicomprensive

Ricerca del 27 ottobre 2026, nel perimetro Q28: esclusivamente open data, tracciati e metodi ufficiali del Portale Offerte/Acquirente Unico. Nessun dato proveniente dai siti dei fornitori entra nelle conclusioni.

**Qualifica successiva:** la [verifica conclusiva](./verifica-calcolabilita-canoni-2026-10-27.md) risolve il criterio fiscale del conguaglio, dimostra la normalizzazione del canone lordo nei casi coperti e individua le reali informazioni mancanti. Le cautele sotto sul trasferimento automatico dei prezzi non sono un divieto di ricavare valori netti con formule e imposte ufficiali.

**Risposta principale:** un'offerta con canone fisso può essere confrontata, ma il canone da solo non rappresenta necessariamente la spesa annua. Il modello ufficiale dell'offerta onnicomprensiva a canone comprende un consumo di riferimento, un conguaglio anche per consumi inferiori e imposte aggiuntive. Inoltre, una rata mensile costante può essere una modalità di pagamento di una normale offerta a consumo: il suo nome non seleziona l'algoritmo.

**Riscontro sul catalogo:** la verifica parallela ha trovato offerte a canone reali nella pagina ufficiale delle offerte non confrontabili. Lo zero dei flag negli XML non significa quindi zero offerte a canone pubblicate sul Portale. Questo introduce un confine di acquisizione e di calcolo, descritto sotto, senza richiedere alcuna consultazione dei fornitori.

## Fonti e verifica

- [AU, Trasmissione Offerte Mercato Retail v5.0, 15 dicembre 2025](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), in particolare pp. 27–29, 52–53, 58–62, 70.
- [AU, Regole per il calcolo della spesa annua v4.2, 5 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), pp. 5–6, 10, 14–15, 26–30, 31, 33–35, 39–42, 46.
- [Export ML luce del 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml) e [gas dello stesso giorno](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml): la misura di presenza è separata nell'[audit](./audit-formule-offerte-2026-10-27.md).

Sono stati letti integralmente i passaggi pertinenti dei PDF ufficiali già acquisiti e verificata anche la pagina 40 delle regole mediante rendering del PDF, per escludere che l'anomalia del simbolo `λ` descritta sotto fosse un errore di estrazione testuale. Versioni e checksum dei documenti sono nel [manifesto dell'audit](./evidenze/formule-2026-10-27/manifest.json).

## Sei concetti da tenere distinti

| Espressione | Come si riconosce e cosa comporta |
| --- | --- |
| **Quota fissa di commercializzazione** | Una componente, normalmente in €/anno, che si aggiunge a energia, rete, oneri e imposte nel ramo ordinario. Non significa bolletta annua interamente fissa. |
| **Prezzo fisso** | `TIPO_OFFERTA=01`: prezzo della componente determinato anziché indicizzato. Il costo dipende comunque da consumi e altre voci. |
| **Rata costante** | Modalità di ripartizione dei pagamenti eventualmente descritta nei testi dell'export. Nel tracciato esaminato non è una famiglia di calcolo equivalente al canone onnicomprensivo. Non dedurre la spesa annua moltiplicando una rata testuale per dodici. |
| **FLAT** | `TIPO_OFFERTA=03`, con taglia di consumo. È presente nel tracciato, ma la qualificazione del suo algoritmo corrente presenta una contraddizione documentale descritta sotto. |
| **Onnicomprensiva** | `OFFERTA_ONNICOMPRENSIVA=01`, solo domestici, prezzo fisso o variabile. Il ramo annuo evita di risommare separatamente rete e oneri già ricompresi. |
| **Onnicomprensiva a canone** | `OFFERTA_ONNICOMPRENSIVA=02`, solo domestici, prezzo fisso o variabile, con `CONSUMO_CANONE` e componente di conguaglio. È questa la famiglia per la quale il documento espone una formula esplicita con consumo di riferimento. |

Le codifiche derivano dalle specifiche v5.0, pp. 27–28, 52 e 70. La distinzione della rata è una conclusione sul tracciato e sul metodo esaminati, non un'affermazione sulle modalità commerciali di uno specifico venditore.

## Canone onnicomprensivo a prezzo fisso: formula determinata

Le regole v4.2, p. 27 per luce e p. 40 per gas, definiscono:

```text
S = C + p × (Q − Qrif)
```

- `C`: componente impresa con `MACROAREA=01`, `UNITA_MISURA=01`, dunque **€/anno**.
- `p`: componente con `MACROAREA=02`; `UNITA_MISURA=03` €/kWh per luce, `04` €/Smc per gas.
- `Q`: consumo annuo del profilo, nella stessa unità del prezzo.
- `Qrif`: consumo di riferimento in `DettaglioOfferta/CONSUMO_CANONE`.
- `S`: spesa di commercializzazione del ramo onnicomprensivo, prima delle ulteriori operazioni su sconti e imposte.

Le specifiche v5.0, p. 28, precisano che il conguaglio riguarda consumi **in difetto o in eccesso**. La formula contiene `Q − Qrif`, non `max(Q − Qrif, 0)`. A consumi inferiori, un prezzo di conguaglio positivo riduce il risultato; non è corretto addebitare sempre almeno il canone introducendo un minimo che la formula non prevede.

Esempio puramente illustrativo, non tratto da un'offerta: `C=900 €/anno`, `Qrif=2.700 kWh`, `p=0,20 €/kWh`.

| Consumo annuo | Calcolo | Subtotale prima di sconti/imposte |
| --- | --- | ---: |
| 2.400 kWh | 900 − 60 | 840 € |
| 2.700 kWh | 900 + 0 | 900 € |
| 3.000 kWh | 900 + 60 | 960 € |

Il canone di 900 € non si moltiplica per dodici: il campo è già annuale. `900 / 12 = 75 €` sarebbe soltanto la media mensile di quel subtotale al consumo di riferimento, non una rata contrattuale accertata e non il totale mensile comprensivo di imposte. La schermata deve mantenere la distinzione già scelta in Q11.

### Come può cambiare la convenienza

Consideriamo due canoni ipotetici, entrambi con lo stesso trattamento onnicomprensivo e confrontati prima di sconti/imposte:

- A: 900 €/anno, riferimento 2.700 kWh, conguaglio 0,20 €/kWh.
- B: 960 €/anno, riferimento 3.000 kWh, conguaglio 0,15 €/kWh.

| Consumo | A | B |
| --- | ---: | ---: |
| 2.400 kWh | 840 € | 870 € |
| 3.000 kWh | 960 € | 960 € |
| 3.600 kWh | 1.080 € | 1.050 € |

Il canone nominale più basso non identifica il vincitore per tutti i consumi. Algebricamente la formula fissa diventa `(C − p × Qrif) + p × Q`: il punto di pareggio dipende da tutti e tre i parametri. Il confronto con un'offerta ordinaria deve riallineare le voci incluse, prima di usare questo ragionamento: una quota onnicomprensiva non è confrontabile direttamente con il solo costo della materia energia di un'altra offerta.

## Cosa include il risultato, imposte e sconti

Per le offerte onnicomprensive, le regole v4.2 pp. 27 e 40 danno il ramo annuo:

```text
Spesa annua = S
            − sconto una tantum applicato prima IVA
            + imposte
            − sconto una tantum applicato dopo IVA
```

Rete, oneri e le altre componenti già aggregate non sono risommate nelle rispettive righe ordinarie. Le **imposte restano un addendo esplicito**: non si può presentare il canone trasmesso come automaticamente comprensivo di accisa e IVA. Per luce si applicano le regole richiamate nel §3.1.6; per gas nel §4.1.4, con le relative distinzioni territoriali e scaglioni. Non inventare l'aliquota o il profilo dal nome dell'offerta.

Il ramo esplicito mostra gli sconti una tantum, collocati prima o dopo IVA secondo `IVA_SCONTO`; i capitoli degli sconti richiedono validità all'ingresso/entro dodici mesi e condizione `00`. Non applicare per analogia al canone un generico sconto percentuale destinato alla macroarea energia: le offerte onnicomprensive espongono macroaree 01/02, mentre la formula dello sconto percentuale ordinario richiama la macroarea 04. Un caso futuro che combini questi campi dovrà essere interpretato secondo il ramo ufficiale, senza inventare una base di sconto.

La famiglia onnicomprensiva senza consumo di riferimento è distinta: `OFFERTA_ONNICOMPRENSIVA=01` non abilita automaticamente `Q − Qrif`. Nelle specifiche usa anch'essa una componente annua e una a consumo; la sottrazione del consumo di riferimento appartiene solo al tipo `02`. La pagina delle regole non espone per il tipo `01` una distinta formula indicizzata altrettanto dettagliata: non trasferire senza verifica il ramo del canone a una onnicomprensiva variabile.

## Canone a prezzo variabile

Il tracciato ammette il canone sia fisso sia variabile; una quota annuale fissata non elimina necessariamente l'esposizione all'indice del conguaglio.

**Luce, regole p. 27:**

```text
S = C + [media dei quattro forward trimestrali F0 × (1 + λ) + p] × (Q − Qrif)
```

Il fattore delle perdite si applica all'indice come indicato dall'algoritmo, non di nuovo allo spread già trasmesso comprensivo delle perdite. Le regole luce assumono consumi costanti durante l'anno; non si sostituiscono arbitrariamente profili mensili al calcolo pubblicato. Occorre qualificare anche l'allineamento con l'orizzonte Q23 dell'applicazione, che differisce dall'uso del trimestre corrente descritto dal Portale.

**Gas, formula effettivamente stampata a p. 40:**

```text
S = C + [(Σ indice_mese × consumo_mese / Q) × (1 + λ) + p] × (Q − Qrif)
```

L'indice è quindi pesato sui consumi dei dodici mesi. Una semplice media aritmetica dei prezzi non è equivalente per un profilo gas stagionale. Il consumo mensile deriva dal profilo convenzionale ufficiale previsto dalle regole, non da `Q/12`.

**Punto non risolto del documento:** il `λ` compare realmente anche in questa formula gas, confermato visivamente nel PDF. L'appendice p. 46 lo definisce tra i parametri **EE** come perdite di rete; il CSV parametri ML gas del 26 ottobre esaminato non contiene `lambda`, mentre quello luce lo contiene. Non c'è in questo passaggio una definizione specifica per il gas. Non è fondato applicare automaticamente il valore elettrico, impostarlo a zero o cancellarlo come presunto refuso. La formula fissa non dipende da questo parametro; il ramo gas variabile richiede chiarimento attraverso la documentazione ufficiale prima di dichiararne una riproduzione qualificata.

Con `Q=0`, il ramo gas variabile presenta inoltre una divisione per zero. Le pagine esaminate non specificano una convenzione per questo limite: non sostituire un risultato arbitrario. I limiti di consumo e la validazione del profilo vanno considerati prima del calcolo.

## FLAT: presenza nel tracciato e contraddizione fra documenti

La v5.0 della trasmissione, p. 27, mantiene la tipologia `03` e descrive una sola componente di materia energia con intervallo di ammissibilità `CONSUMO_MIN`–`CONSUMO_MAX`. Il valore della componente, in €/kWh nell'esempio luce, viene moltiplicato per il **massimo della taglia**. Il Portale, nell'esempio del tracciato, calcola anche trasporto, oneri e imposte prendendo quel massimo come consumo di riferimento. Eventuali compensazioni per consumi inferiori o superiori sono descritte nel testo e dichiarate escluse da quella stima.

Questa descrizione non è il modello del canone onnicomprensivo con conguaglio. In particolare, non autorizza a usare il consumo effettivo al posto del massimo della taglia o a importare nel calcolo compensazioni testuali.

**Tuttavia le regole di calcolo v4.2, p. 5, riportano nella revisione 3.02 del 21 gennaio 2022 “Eliminazione offerte FLAT”.** Non contengono un capitolo operativo FLAT attuale, mentre il tracciato v5.0 conserva le istruzioni e il codice. Dunque la famiglia esiste nel vocabolario della trasmissione, ma il suo algoritmo corrente non è qualificato dalla sola lettura dei due documenti. L'audit precedente deve essere inteso come rilevazione del codice, non come conferma di un ramo di calcolo corrente già pronto.

Per la prima versione non ha senso aggiungere un algoritmo FLAT basandosi automaticamente su una descrizione potenzialmente conservata per compatibilità. Se la tipologia compare negli export, occorre trattare esplicitamente questa compatibilità tra versione del tracciato e metodo di calcolo; nessuna fonte del fornitore è necessaria o ammessa per risolverla.

## Canoni reali pubblicati come non confrontabili

Il Portale pubblica un insieme distinto nelle pagine [offerte elettriche non confrontabili](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) e [offerte gas non confrontabili](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS). Le specifiche v5.0, §7.2 pp. 63–65, prevedono una trasmissione dedicata per le offerte che non possono essere simulate con gli algoritmi pubblicati: vengono mostrate in una pagina separata fino alla disponibilità di algoritmi idonei. La presenza sulla pagina non equivale dunque a una spesa annua calcolata dal Portale.

Nel testo pubblicato sul Portale per **Fastweb Luce Flat Light**, valido dal 24 ottobre al 15 novembre 2026, si leggono canone a partire da 768 €/anno, riferimento 1.500 kWh, potenza fino a 6 kW e conguaglio di 0,28 €/kWh sia per minor consumo sia per eccedenza. Il canone è dichiarato comprensivo di materia, trasporto, contatore, oneri, accise e IVA. È anche indicato un bonus mensile condizionato a un contratto di telecomunicazioni. Il testo precisa che la scelta dipende da potenza, consumo dichiarato e tipologia d'uso.

Questi elementi dimostrano l'esistenza della struttura a canone e la rilevanza della verifica. **Non bastano per trasferire automaticamente 768 nel campo `PfixOC` del calcolo strutturato**:

- Il prezzo è espresso “a partire da”: non è ancora qualificata l'applicabilità a ogni profilo. Questa dicitura da sola non prova che il canone cambi con il profilo, né che sia il motivo per cui l'offerta è nella sezione senza simulazione.
- Comprende imposte, mentre l'algoritmo strutturato aggiunge le imposte dopo il subtotal: sommarle di nuovo produrrebbe un doppio conteggio. Neppure una divisione automatica per l'aliquota IVA ricostruisce in generale accise e altre dipendenze del profilo.
- Le informazioni sono testo pubblicato nella pagina non confrontabile, non i campi economici strutturati dell'XML; la pagina esaminata non espone il codice offerta necessario a un collegamento certo con un'altra versione.
- La denominazione commerciale “Flat” non prova che il tipo tecnico sia `TIPO_OFFERTA=03`.

Nella pagina gas, le offerte Fastweb Gas Flat richiedono espressamente di avere o sottoscrivere la fornitura luce dello stesso venditore. La loro ammissibilità va valutata rispetto all'esclusione dei pacchetti congiunti e al confronto indipendente deciso in Q26; non si possono inserire automaticamente come alternative gas liberamente sottoscrivibili.

Per queste pagine la conclusione corretta è **offerta pubblicata e da coprire nell'inventario**, con calcolabilità da determinare rispetto al metodo ufficiale e ai dati effettivamente esposti. L'assenza dagli XML non giustifica una dichiarazione di copertura completa del mercato o l'esclusione economica della famiglia. La presenza nella pagina non giustifica nemmeno una classifica ricostruita inventando i campi mancanti. Le formule illustrate sopra restano strumenti per comprendere la struttura; gli esempi numerici ipotetici non sono stime delle offerte Fastweb.

## Durate, unità e verifiche necessarie

Le specifiche v5.0 distinguono `DettaglioOfferta/DURATA` — durata delle condizioni economiche in mesi, `-1` indeterminata — dai periodi dei singoli prezzi. `DURATA` del periodo indica i primi mesi, `VALIDO_FINO` il limite temporale e `MESE_VALIDITA` il mese solare; sono modalità alternative. La presenza di una quota annua non autorizza a ignorare questi intervalli. Se il primo anno contiene valori differenti, servono segmenti coerenti e il default nei periodi scoperti, secondo le regole ufficiali. Le sezioni specifiche del canone non definiscono ogni possibile combinazione di periodi e conguagli: non dichiararle tutte supportate senza casi ufficiali.

La tabella del tracciato p. 52 descrive `CONSUMO_CANONE` come espresso in kWh anche nel formato comune; il paragrafo 21 a p. 28 e le formule distinguono invece chiaramente prezzi gas €/Smc. È un'incoerenza della descrizione dell'unità: il confronto dimensionale gas deve essere in Smc, senza introdurre una conversione kWh arbitraria.

I controlli minimi per qualificare un caso di canone sono:

1. Cliente domestico, `OFFERTA_ONNICOMPRENSIVA=02`, tipo fisso o variabile; una componente macroarea 01 e una macroarea 02, unità corrette e consumo di riferimento presente.
2. Periodo di stima, durata e ammissibilità del consumo coerenti; distinguere assenza del campo da zero.
3. Prove sotto, al livello e sopra il consumo di riferimento; nessun azzeramento artificiale dei conguagli negativi.
4. Somma delle voci senza duplicare rete/oneri, con accise/IVA e sconti nel ramo corretto.
5. Per variabili, osservazioni e ponderazioni ufficiali; il punto su `λ` gas resta una lacuna documentale esplicita.
6. Costo annuo e media mensile distinti dal piano delle rate: ciò che non è determinabile dall'export non viene ricostruito dai siti dei fornitori.

Questa nota qualifica il metodo e i suoi limiti. L'[approfondimento del catalogo](./approfondimento-canone-catalogo-2026-10-27.md) documenta anche la presenza di canoni reali nell'elenco pubblico separato, senza attestarne la convenienza o la sufficienza dei prezzi per ogni profilo. L'assenza dei flag negli XML non autorizza a escludere offerte chiamate “rata costante” che sono calcolabili come normali tariffe. La decisione di copertura segue Q27 sulla base dei record effettivi e della rilevanza economica, mantenendo separati metodo supportato, record calcolabile e forma di pagamento. Le [conclusioni congiunte](./esito-approfondimenti-formule-2026-10-27.md) aggiornano la proposta di perimetro.
