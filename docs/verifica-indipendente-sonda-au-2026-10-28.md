# Verifica indipendente della sonda AU — 28 ottobre 2026

Analisi matematica delle evidenze già raccolte; nessuna nuova richiesta al Portale eseguita da questa verifica. Le nuove prove runtime sono un'attività distinta. Questa nota registra le predizioni prima della loro osservazione.

## Campione e fonti

Offerta reale `001686ESVFL00XXES3PC1026DO000000`, **+ CASA SPECIAL**, profilo domestico residente, Pescara, 3 kW. Le risposte ufficiali conservate riportano:

| Consumi F1/F2/F3, kWh | Vendita energia, euro |
| --- | ---: |
| 3000/0/0 | 832,09 |
| 1000/2000/0 | 849,14 |
| 1000/0/2000 | 793,44 |

Fonti primarie archiviate: [profilo F1](./evidenze/scenario-fasce-2026-10-27/portale-triorario/profile-0-0.json), [profilo F2](./evidenze/scenario-fasce-2026-10-27/portale-triorario/profile-2000-0.json), [profilo F3](./evidenze/scenario-fasce-2026-10-27/portale-triorario/profile-0-2000.json), [dettaglio economico ufficiale](./evidenze/scenario-fasce-2026-10-27/portale-triorario/cost-0-0.html). Origine: normale modulo pubblico del [Portale Offerte](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page).

Il dettaglio espone quota fissa di commercializzazione 120 euro/anno, spread 0,027500 euro/kWh identico nelle tre fasce e CDISPd 0,016776 euro/kWh. Quest'ultima voce impedisce di identificare automaticamente l'indice AU sottraendo soltanto lo spread. Vanno inoltre verificati il trattamento delle perdite e l'eventuale variazione temporale delle componenti.

## Modello falsificabile e valori identificabili

Assumendo linearità nell'intervallo esaminato:

`S(x1,x2,x3) = A + c1*x1 + c2*x2 + c3*x3`.

I tre punti hanno identico totale 3000. Quindi, senza conoscere A, identificano soltanto:

- `c2-c1 = (849,14-832,09)/2000 = 0,008525 euro/kWh`;
- `c3-c1 = (793,44-832,09)/2000 = -0,019325 euro/kWh`;
- `c2-c3 = 0,027850 euro/kWh`;
- `A+3000*c1 = 832,09 euro`.

Condizionando ulteriormente alla quota fissa effettiva **A=120 euro**, i coefficienti aggregati sono:

| Coefficiente | Euro/kWh |
| --- | ---: |
| c1 | 0,237363333333… |
| c2 | 0,245888333333… |
| c3 | 0,218038333333… |

Questi sono coefficienti annui effettivi della **vendita**, comprensivi delle componenti variabili pertinenti. Non sono ancora forward AU puri. L'intercetta effettiva A può essere verificata con almeno un campione a totale diverso, senza imporre che coincida con il solo valore contrattuale visibile.

## Verifica runtime e correzione dell'errore aritmetico

Il controllo 1000/1000/1000, ottenuto mediando i due profili F2/F3, predice **821,29 euro** e il Portale restituisce **821,29 euro**.

Per il controllo 2000/500/1500, totale4000, la valutazione corretta del modello originale è:

`120 + 2000*0,237363333333… + 500*0,245888333333… + 1500*0,218038333333… = 1044,728333333… euro`.

Il Portale restituisce **1044,73 euro**: il modello passa anche questo controllo.

**Errore nella prima verifica indipendente:** era stato comunicato1044,09 euro invece di1044,728333…, pur riportando gli stessi coefficienti corretti. Era un errore aritmetico di questa analisi, non un'anomalia del Portale. La predizione numerica preregistrata1044,09 rimane errata; il modello originale con A120 non è stato modificato e il suo ricalcolo coincide con il risultato osservato. La successiva ipotesi A≈118,085 e le predizioni che ne discendevano erano fondate su quell'errore e sono ritirate. Non esiste in queste evidenze uno scarto4000 da spiegare con arrotondamenti percentuali o intercette diverse.

Le verifiche persistite sono riepilogate in [results.json](./evidenze/sonda-au-2026-10-28/results.json), con risposte ufficiali nella stessa cartella:

| Offerta e consumi F1/F2/F3 | Formula originale, euro prima dell'arrotondamento | Portale, euro |
| --- | ---: | ---: |
| SPECIAL1000/1000/1000 |821,290000|821,29|
| SPECIAL2000/500/1500 |1044,728333|1044,73|
| SPECIAL2000/2000/2000 |1522,580000|1522,58|
| SPECIAL1500/0/0 |476,045000|476,04|
| SPECIAL0/3000/0 |857,665000|857,66|
| SPECIAL1000/1000/2000 |1039,328333|1039,33|
| UNICA1000/1000/1000 |861,790000|861,79|

Tutti e sette i controlli sono compatibili con il modello entro0,005euro rispetto al valore non arrotondato. I mezzi centesimi sono coerenti con i coefficienti stimati da importi già arrotondati: non identificano da soli la modalità di arrotondamento interna. La verifica trasferita a UNICA usa la diversa offerta `001686ESVFL00XXES2PC1026DO000000`, con componenti dichiarate nel relativo XML ufficiale archiviato; la predizione861,79 è stata comunicata prima della query, secondo il registro della prova principale.

## Scomposizione dei coefficienti

Sottraendo da c1/c2/c3 lo spread0,0275 e CDISPd0,016776, si ottengono rispettivamente0,1930873333,0,2016123333 e0,1737623333 euro/kWh. Il file [parametri ufficiali acquisito il28ottobre](./evidenze/sonda-au-2026-10-28/PO_Parametri_Mercato_Libero_E_20261028.csv) conferma CDISPd e lambda0,100000.

Applicando la scomposizione `I_f=(c_f−spread−CDISPd)/(1+lambda)`, verificata nella prova principale, risultano:

| Fascia | Media annua implicita dell'indice, euro/kWh |
| --- | ---: |
|F1|0,175533939393…|
|F2|0,183283939393…|
|F3|0,157965757575…|

Sono medie annue implicite condizionate alla formula e al profilo temporale del Portale, ricavate da risultati arrotondati. La coincidenza dei controlli e dell'altra offerta sostiene la trasferibilità nel contesto verificato; non certifica ogni formula/offerta né trasforma le medie in una curva trimestrale acquisita direttamente da AU.

## Perché tre medie non sono dodici prezzi trimestrali

Il [metodo ufficiale ARERA](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa) descrive quattro valori trimestrali a partire dal trimestre corrente, aggiornati mensilmente. Per ciascuna fascia, un coefficiente annuale è una combinazione pesata dei quattro valori, oltre alle altre componenti della formula.

Se tutte le simulazioni mantengono gli stessi pesi temporali, cambiare il totale annuo moltiplica la stessa equazione: non crea quattro informazioni indipendenti. Per recuperare quattro prezzi occorrono almeno quattro combinazioni temporali linearmente indipendenti, con pesi noti e componenti accessorie controllate; con arrotondamenti si ottengono intervalli compatibili anziché necessariamente valori esatti.

Questa verifica non dimostra che il Portale consenta o impedisca di costruire tali combinazioni tramite consumi mensili, periodi dell'offerta o altre modalità del modulo: è una condizione matematica da verificare sperimentalmente. Una media annua ricostruita, anche validata, non autorizza a chiamare acquisita l'intera curva trimestrale né a coprire mesi esterni all'orizzonte ufficiale.
