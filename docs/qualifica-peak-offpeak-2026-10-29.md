# Qualifica operativa Peak/OffPeak — 29 ottobre 2026

## Esito e confine

La famiglia è **calcolabile dalle sole risposte ufficiali** per il primo percorso che usa consumi annui F1/F2/F3, mediante coefficienti annui effettivi versionati per fingerprint economico e periodo di stima. Sono stati verificati tutti i cinque record variabili osservati il27ottobre e due rappresentanti di otto fisse entrate nell'export del29. Non occorre un `if` sul codice offerta: il codice identifica la fonte, mentre il metodo è un operatore lineare su tre quantità, con dati di calibrazione e applicabilità esplicita. La pipeline di importazione dovrà calibrare e verificare ogni fingerprint che usa questa rappresentazione prima di attestare copertura completa.

**Non è stato ricostruito un mapping fisico universale F1/F2/F3→Peak/OffPeak, né recuperata una curva di otto indici trimestrali Peak/OffPeak.** Le sonde mensili che hanno separato i trimestri per F0/F1/F2/F3/F23 qui non cambiano la vendita nelle prove effettuate. Il dato acquisibile e necessario per l'input annuo è quindi un **coefficiente annuo effettivo della vendita**, non una quotazione di mercato Peak o un prezzo AU puro da rinominare.

## Fonti e perimetro

- [Tracciato AU v5.0](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), p56nota14 nella copia acquisita: tariffa07 eredita le due fasce standard dei mercati all'ingrosso se non esiste una configurazione settimanale esplicita. Le componenti07/08 indicano Peak/OffPeak. La copia locale usata è `/tmp/la-mia-bolletta-trasmissione-v5.txt`; il collegamento al PDF deve essere confrontato con il manifesto precedente se la fonte sostituisce il documento.
- [Vademecum PCE ufficiale GME](https://www.mercatoelettrico.org/Portals/0/Documents/it-it/20250101_Vademecum_PCE.pdf), p18: Peak08–20lunedì–venerdì, sabato/domenica esclusi; OffPeak complemento. Le ore sono intervalli fisici; le etichette9–20 della UI sono periodi di consegna, non autorizzano a spostare l'inizio alle09.
- [XML ufficiale luce del29ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261029.xml), SHA256 `55c522617793f9d92cd50c0561d07711c6985e361199acbf276b023e4386ffe0`:13domestiche tariffa07, cinque variabili e otto fisse. Il27ottobre erano state osservate le cinque variabili. Le otto fisse hanno prezzi Peak/OffPeak differenti, senza periodi o sconti; i loro record sono conservati. Il conteggio non esprime disponibilità per ogni utente.
- [Modulo pubblico Portale](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page): sessioni anonime nuove e consumi sintetici. Parametri normalizzati e tipo offerta effettivo verificati; per le fisse `tipoOffertaForm=prezzoFisso`, `tipoOfferta=FISSO`, dettaglio01. Nessun dato di fornitura reale o sito del fornitore utilizzato.
- [Parametri elettrici ML](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_E_20261029.csv):CdispD; PCV nel record con componenti regolate. PPE non trovata nei CSV ML/PLACET esaminati: non inventata da un valore nominale arrotondato della scheda.

## Prove che separano questo ramo dalle altre fasce

Sonda `029878ESVFL03XX000002DOM2VAR2BIO`: fisso144€/anno, spread0,0242€/kWh uguale Peak/OffPeak, CdispD0,016776. Con3000kWh tuttiF1, la vendita è843,22€, sia senza misure mensili, sia concentrando tutto in dicembre, sia in maggio. Il profilo server mantiene realmente i dodici mesi. Il nuovo profilo mensile misto con annuo1000/1000/1000 dà845,50€, identico all'annuale.

Una configurazione storica esplicita `f_lunedi=32-2,80-1,96-2` e analoga per altri giorni viene conservata dal server ma non cambia il test dicembreF1:843,22€. Non dedurre dal solo echo del campo che sia usata dal ramo. Il calendario PCE ufficiale non basta a dimostrare quale riprofilazione del consumo usi internamente questo calcolatore.

## Operatore annuo per i record senza componenti regolate aggiuntive

Rappresentazione: `vendita = A + b1*consF1 + b2*consF2 + b3*consF3`.

Dalle tre calibrazioni della sonda, A144, vendite843,22€ per3000F1,849,00€ per3000F3 e845,50€ per1000in ogni fascia:

| Coefficiente della vendita | €/kWh |
| --- | ---: |
| b1 | 0,233073333333… |
| b2 | 0,233426666666… |
| b3 | 0,235000000000… |

Sono coefficienti comprensivi dello spread e del dispacciamento della sonda, non prezzi Peak/OffPeak puri. Nel gruppo osservato senza regolate, variazioni note di quota fissa e spread uniforme si trasferiscono come `ΔA+Δspread*consumoTotale`. Quattro record hanno questa forma, con prezzi fra fasce uguali e senza periodi economici. Gli sconti SEPA/bolletta online di due record sono fissi e condizionati, non richiesti nelle sonde; non sono assimilati a sconti percentuali temporanei.

### Verifiche non utilizzate per la calibrazione

| Record / caso | Predizione non arrotondata, € | Portale, € |
| --- | ---: | ---: |
| Sonda,3000tuttiF2 | 844,280000 | 844,28 |
| Sonda,1234/987/1779 | 1080,069613 | 1080,07 |
| BIOM,192€/anno, stesso spread e profilo | 1128,069613 | 1128,07 |
| BIO R,144€/anno, stesso spread e profilo | 1080,069613 | 1080,07 |
| TARIFFA EV di altro venditore,144€/anno, spreadzero | 983,269613 | 983,27 |
| Sonda,1500/2000/2500 | 1547,963333 | 1547,96 |
| Sonda,700/400/900 | 612,022000 | 612,02 |

Nessuna modifica ai coefficienti dopo queste risposte. I codici completi e i profili sono nei file originali e nel manifest.

## Ramo con componenti regolate: nessun falso coefficiente PPE scalare

Il quinto record variabile `024632ESVFL01XXSTDDOMVARPOP00007` ha quota153,12, contributo0,065389uguale sulle fasce07/08, CdispD e ComponentiRegolate01/02. La scheda espone PCV41,18 e PPE−0,010270. La sola aggiunta della PPE nominale scalare non riproduce le risposte: è stato registrato il fallimento, senza allargare arbitrariamente la tolleranza o adattare i coefficienti delle altre offerte.

Una prima ipotesi di PPE annua scalare ricavata da un confronto a4000kWh non ha generalizzato ai nuovi2000/6000kWh. Anche un tentativo di inferire tre componenti regolate da quei tre profili misti era malcondizionato rispetto agli arrotondamenti; non è la prova di tre prezzi PPE ufficiali. Tutte queste predizioni restano nel registro, ma non fanno parte della ricetta operativa selezionata.

La ricetta generale per questo fingerprint acquisisce invece tre coefficienti **complessivi della vendita** con le componenti regolate incluse, separando la parte fissa153,12+41,18=194,30:

| Calibrazione3000kWh | Vendita osservata, € | b_i=(vendita−194,30)/3000 |
| --- | ---: | ---: |
| SoloF1 | 990,91 | 0,265536666666… |
| SoloF2 | 993,21 | 0,266303333333… |
| SoloF3 | 985,61 | 0,263770000000… |

Questi coefficienti spiegano i tre profili misti già acquisiti entro il centesimo. Il nuovo holdout, registrato dopo le tre calibrazioni e prima della query, usa876/543/2100kWh, totale3519: **1125,42983€ previsti →1125,43€ osservati**. Stesso profilo su6kW non residente: vendita ancora1125,43€, mentre rete/oneri/imposte cambiano. Questa prova non estende automaticamente il dato a qualunque territorio/regime: tali caratteristiche entrano nell'applicabilità del fingerprint se pertinenti.

La forma del dato è la stessa degli altri record: A e tre coefficienti annui della vendita. La presenza di regolate e la forma delle componenti determinano la ricetta di acquisizione, **non un ramo di codice che riconosce l'ID del venditore**. Non si sommano di nuovo PCV/PPE o spread quando sono già inclusi nel coefficiente/versione pubblicata. Sconti condizionati e costi regolati non compresi nella vendita restano gestiti dai rispettivi moduli.

## Nuove fisse: prova di calcolabilità del metodo, non dichiarazione8/8 runtime

Nel catalogo29ottobre sono entrate otto fisse Peak/OffPeak con prezzi diversi. Le due sondate hanno stessa quota133,2311 e CdispD; differiscono nei prezzi dell'energia:

- FIX FAMILY CUN4 `003450ESFML01XX00000010073721026`:0,171083Peak/0,162393Off;
- FIX FAMILY SEMPRE ZERO XS `003450ESFML01XX00000010073781026`:0,168773Peak/0,160083Off.

Le tre vendite a3000kWh in una sola fascia sono rispettivamente708,93/688,60/654,73 e701,84/681,47/648,03€. Da queste si ricavano tre coefficienti annui con A133,2311. Il nuovo profilo1200/700/2000kWh, totale3900, fissato dopo la calibrazione e prima delle query, dà:

| Record | Predizione non arrotondata, € | Portale, € |
| --- | ---: | ---: |
| CUN4 | 840,762670 | 840,77 |
| SEMPRE ZERO XS | 831,796336… | 831,79 |

Gli scarti sono inferiori al limite propagato dagli arrotondamenti dei tre campioni (0,005×3900/3000) e della nuova risposta (0,005), complessivamente0,0115€. Non è stata aggiustata una costante per far passare la prova.

È stata esplorata la ricostruzione di una matrice2×3 dai due vettori di prezzi; i risultati non giustificano una conversione fisica conservante universale e la matrice è sensibile agli arrotondamenti. Questa via non è stata usata per dichiarare acquisiti pesi Peak/OffPeak. Il dato operativo rimane il coefficiente annuo per fingerprint, verificabile senza pretendere che l'output del calcolatore rappresenti sempre una redistribuzione fisica del totale.

Le altre sei fisse sono dello stesso schema XML (prezzi07/08 differenti, quota annua, nessun periodo/sconto), ma non sono state interrogate in questa ricerca. La loro calibrazione e il relativo holdout fanno parte della pipeline di qualifica del catalogo prima dell'accettazione nazionale. La prova stabilisce una via concreta, non una certificazione di calcolo già eseguito su ogni record o sulla futura comparsa di una nuova formula.

## Contratto dati e criteri di accettazione per implementazione

Ogni riga di coefficiente deve avere: tipo `annual_effective_sale`, base input `annual_F1_F2_F3`, periodo di stimaQ44, mese di acquisizione, fingerprint economico/versione offerta, versione parametri/metodo, A, b1/b2/b3, componenti già incluse, vincoli del profilo, stati degli sconti, input/risposte di calibrazione e risultato di un holdout indipendente. L'identità del record è **dato** per la selezione dello snapshot; l'algoritmo del motore rimane generico.

Il fingerprint deve comprendere tipo offerta07, indici, configurazione oraria, componenti/unità/fasce/prezzi, periodi, regolate, dispacciamento, sconti e condizioni che cambiano il calcolo. Include la finestra di confronto e le caratteristiche fisiche che incidono sulla vendita. Non riutilizzare coefficienti del mese passato, di un'altra versione o dopo una modifica economica solo perché il codice offerta è uguale.

- Lo script mensile già approvato può calibrare ogni fingerprint di questa famiglia e importare i coefficienti insieme al resto dello scenario. Non è una simulazione live durante il percorso utente.
- Pubblicare solo coefficienti con profilo server coerente, calibrazioni compatibili con i limiti dell'offerta e almeno un holdout a consumi diversi. Scegliere il volume di calibrazione entro le soglie del record;3000non è un default universale.
- Non sommare componenti già incluse; rete, oneri e imposte si calcolano separatamente. Applicare gli sconti condizionati con le regole qualificate, non trattarli come parte della calibrazione senza tracciarli.
- Nuove configurazioni, spread Peak≠Off, periodi/promozioni temporali, indicizzazioni o sconti percentuali non presenti nelle classi verificate richiedono qualificazione e holdout propri. Non autorizzare una formula universale sulla base di questo campione. Lo stesso vale per periodi di stima o input mensili non coperti dalle prove.
- Un contratto attuale richiede lo stesso livello di applicabilità/versione. Se non ricostruibile per tutto il periodo resta non confrontabile secondoQ5; non si estende uno snapshot commerciale corrente alle vecchie condizioni del cliente.
- L'accettazione del confronto completo richiede che tutti i fingerprint rilevanti dello snapshot siano qualificati; l'assenza del coefficiente non è un'esclusione economica dell'offerta e non autorizza una classifica parziale spacciata per completa.

Questa è una metodologia empirica verificata, da etichettare come tale, coerente con il recupero di coefficienti impliciti approvato inQ42–Q44. Non modifica il calendario ufficiale Peak/OffPeak e non è prova che il Portale implementi internamente la stessa funzione lineare.

## Riproducibilità

[Predizioni precedenti alle query](./evidenze/peak-offpeak-2026-10-29/predictions-before-query.json), [risposte sanificate e manifest](./evidenze/peak-offpeak-2026-10-29/manifest.json), [verifica numerica indipendente](./evidenze/peak-offpeak-2026-10-29/verify-annual-effective.py). Gli script di replay e i record XML del29 sono nello stesso archivio. Nessun token/cookie salvato nei frammenti economici; nessun servizio o costo attivato.
