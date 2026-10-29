# Alternative più pulite alla forma F1/F2/F3 dello stesso mese dell'anno precedente

**Aggiornamento del 28 ottobre:** eseguita una [prova concreta con offerta sonda](./prova-sonda-au-2026-10-28.md). Medie annue implicite elettriche per fascia ricavate dalla vendita e dalle componenti ufficiali spiegano sette nuove simulazioni, inclusa una seconda offerta dello stesso venditore, entro un centesimo. Non sono ancora identificati i singoli trimestri. Le sezioni sotto conservano il contesto della ricerca precedente e i limiti ancora pertinenti.

**Esito finale successivo dello stesso giorno:** anche il limite ai soli coefficienti annui è stato superato. Il [recupero attraverso consumi mensili sintetici](./recupero-indici-au-2026-10-28.md) identifica quattro coefficienti per F0/F1/F2/F3/F23 e gas, con verifiche su nuovi profili temporali e altri venditori. I valori impliciti e l'incertezza sono salvati in uno snapshot. Le considerazioni precedenti sull'identificabilità descrivono la sola via dei consumi annuali: non sono una prova d'impossibilità del recupero trimestrale. Rimane il limite del quinto trimestre non dimostrato, oltre all'operatività del futuro acquisitore.

Ricerca del 27 ottobre 2026. Solo fonti primarie ufficiali AU/GME/ARERA/EEX/ICE e documentazione di mercato; nessun sito fornitore, account, nuovo accordo o fonte a pagamento. Nessuna modifica al repository.

## Conclusione

Non è dimostrato che la proposta precedente sia il metodo migliore. Normalizzare una forma storica al baseload verifica una coerenza algebrica, non la qualità della previsione. È ragionevole trattarla come benchmark da confrontare, non farla approvare già come metodo produttivo definitivo.

Le strade, in ordine di pulizia dei dati, sono:

1. **Valori AU diretti per fascia**, se acquisibili gratuitamente con un canale e diritti applicabili al progetto. Sono il riferimento più vicino al Portale; nei canali pubblici verificati non è stata trovata una serie completa scaricabile. Non dichiarare che non esistano altrove.
2. **Curva di mercato a risoluzione fine già pubblicata e riutilizzabile gratuitamente**, se trovata. EEX/GME verificati offrono soprattutto contratti Base/Peak; non identificata qui una curva italiana gratuita completa F1/F2/F3 o oraria a dodici mesi.
3. **Curva propria vincolata a più quotazioni correnti**, per esempio Baseload e Peakload, con calendario esatto e forma oraria regolarizzata. Usa più informazione corrente del solo Baseload; conserva comunque ipotesi per la parte non identificata dal mercato. Qualità da dimostrare con backtest e impatto sul confronto, non da presumere.
4. **Ripartizione storica mensile dello stesso mese**, proposta precedente: semplice e verificabile, ma usa un solo anno, non sfrutta il differenziale Base/Peak e non è ancora validata. Buon benchmark, non metodo automaticamente preferibile.

## Cosa dicono le fonti primarie

### Base/Peak non corrispondono a F1/F2/F3

- [GME, Glossario](https://gme.mercatoelettrico.org/it-it/Home/Glossario), sezione Tipologie contratti su MTE: Base copre tutte le ore; Peak le ore dal nono al ventesimo esclusi sabati/domeniche. La [DTF MTE corrente già letta](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101DTF01rev6MTE.pdf) elenca Base/Peak.
- [ARERA, fasce orarie](https://www.arera.it/en/bolletta/glossario-dei-termini/dettaglio/fasce-orarie): F1 lun–ven 08–19 escluse festività; F2 include altre ore feriali e sabato; F3 notte, domeniche e festività.
- [ICE, Italian Power Financial Peak Futures](https://www.ice.com/products/57609951): Peak 08–20, esclusi weekend ma indipendentemente dalle festività. Contratti fino a 156 mesi, ma questa scheda non prova disponibilità gratuita delle quotazioni, accesso programmatico o una terza serie F2/F3.

La differenza è reale: Peak comprende 19–20 feriale (F2) e può comprendere festività (F3); F1 dura undici ore e le esclude. Pertanto Peak non può essere rinominato F1. Anche assumendo prezzi costanti dentro ogni fascia, Base e Peak forniscono due vincoli per tre prezzi; senza questa assunzione la curva oraria ha ancora più gradi di libertà. Il prezzo Offpeak ricavato da Base e Peak è una conseguenza dei due, non un terzo vincolo indipendente.

La relazione di conservazione della media è:

`P_offpeak = (h_base * P_base - h_peak * P_peak) / (h_base - h_peak)`

ma Offpeak non è F23. Questa è una derivazione matematica, non un metodo ufficiale AU.

### AU definisce/calcola gli indici; non implica una quotazione quotata per ogni fascia

Fonte nuova: [AU, chiarimenti all'indagine di mercato 1/2020](https://www.acquirenteunico.it/sites/default/files/documenti/CHIARIMENTI_AVVISO_FORWARD.pdf). L'oggetto è il servizio di definizione e calcolo di indici delle quotazioni forward per il Portale. Le domande citano esplicitamente profilazione power F1/F2/F3 e rappresentatività della metodologia. AU risponde che la specifica tecnica sarà inviata ai candidati considerati idonei. Non è una metodologia pubblica leggibile, né una conferma dei dettagli contenuti nelle domande. È un documento storico del 2020, non prova del metodo operativo odierno.

[ARERA rapporto 346/2024/I/com](https://www.arera.it/fileadmin/allegati/docs/24/346-2024-I-com.pdf), nota 54: dall'ottobre 2022 l'aggiornamento degli indici forward è mensile anziché trimestrale. Non trasformare il vecchio documento 2020 in una regola corrente di aggiornamento trimestrale.

### EEX e nuovi prodotti 2026

[EEX Power Futures](https://www.eex.com/en/markets/power/power-futures) documenta la curva Italian Power con mesi/trimestri/anni. Le pagine e i documenti ufficiali trovati non espongono una curva italiana F1/F2/F3 gratuita completa.

La pagina EEX indicizza il comunicato dell'11 settembre 2026: Top-to-Bottom (TB) Power Futures al 21 settembre, Solar contracts rinviati. I TBx sono spread tra prezzi alti e bassi del giorno per copertura batterie; non sono contratti nelle fasce ARERA e non vanno interpretati come F1/F2/F3. Non sono stati scaricati nuovi file MiFIR per questa verifica; l'audit precedente resta evidenza della copertura Base, non di nuovi prodotti specifici per fascia.

## Calibrare dai risultati del Portale

Alternativa da verificare, non già acquisita: con offerte semplici e profili di consumo opportunamente diversi si possono ricavare coefficienti medi impliciti, sottraendo quote/spread noti. È più vicino ai risultati ufficiali dei prezzi ricostruiti da mercato, ma ha limiti:

- Un coefficiente medio annuo non identifica automaticamente quattro trimestri distinti.
- Il periodo ufficiale parte dal trimestre corrente, mentre il progetto ha approvato dodici mesi dal mese successivo: ottobre 2027 del progetto non è necessariamente coperto dalla curva ufficiale corrente ottobre 2026–settembre 2027.
- Periodi promozionali/scaglioni richiedono coefficienti temporali, non una sola media annua.
- Occorrono controlli indipendenti, identificabilità, arrotondamenti e prova di continuità; non un fit a un'unica offerta.
- I forward sono espressamente esclusi dagli open data. Una deduzione da simulazioni non dimostra un nuovo diritto di raccolta sistematica/redistribuzione, né diventa una serie pubblicata direttamente da AU.

Questa strada può servire bene da verifica indipendente o calibrazione diagnostica. Non è già la fonte produttiva più pulita senza qualificare i punti sopra. Nessuna nuova simulazione live è stata eseguita in questo sottotask.

## Raccomandazione per il parent

Sospendere l'approvazione del semplice rapporto storico. Prima completare l'audit dell'indice effettivamente richiesto dalle offerte (non confondere spread per fascia e indice per fascia). Se la previsione distinta serve davvero:

- cercare prioritariamente un canale AU diretto applicabile al progetto;
- acquisire e verificare il Peakload oltre al Baseload già acquisito;
- confrontare un modello orario vincolato Base/Peak con il benchmark storico, su prezzi successivamente realizzati e sull'impatto nelle classifiche/costi;
- approvare la metodologia solo con evidenze e limiti espliciti. Non assumere che il modello più complesso sia più accurato.

Una curva completamente determinata dai soli prezzi di borsa senza ipotesi aggiuntive non è stata trovata nei canali gratuiti verificati. Dire semplicemente “esiste un metodo migliore ed esatto” sarebbe ancora una promessa non dimostrata.

## Controllo aggiuntivo sul foglio ARERA

Scaricato il [file ufficiale di stima della spesa elettrica](https://www.arera.it/fileadmin/allegati/operatori/elettricita/stima_spesa_energia_elettrica.xlsx), collegato dalla [pagina metodologica ARERA](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa). Il file esaminato contiene 50 fogli visibili, nessun foglio nascosto, nessuna formula e nessun nome definito; i fogli espongono spese di profili tipo e percentuali di consumo, non una curva forward per fascia. Questo controllo riguarda esclusivamente il contenuto del file acquisito, non prova che ogni altra pubblicazione ARERA sia priva di dati di supporto.

SHA-256 del file acquisito il 27 ottobre 2026: `7f0e6fae276e62a016a321c3d9876ed30351682c1cbefa2b1b63bd1477bdc134`.

La precedente Q41 resta una proposta non approvata, ora riesaminata. Non viene promossa a scelta produttiva sulla sola base della normalizzazione algebrica. Nessun prezzo storico viene trattato come previsione di fascia osservata.

## Audit degli indici effettivamente necessari e prova del Portale

# Audit: quali indici per fascia servono davvero

27 ottobre 2026. Solo lettura dell'export elettrico ufficiale locale e delle guide AU/SII; nessun sito fornitore o ricerca esterna. Non modifica repository né decide un metodo previsionale.

## Perimetro riproducibile

File `/tmp/la-mia-bolletta-20261027-E.xml`, fonte ufficiale:
https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml

Filtro: TIPO_CLIENTE=01, OFFERTA_SINGOLA=SI, almeno una TIPOLOGIA_ATT_CONTR in {01,99}; validità che include il giorno 27 ottobre 2026, confrontando le date, non l'istante di acquisizione. Questo ricostruisce i 1.916 record del precedente audit. Usando invece mezzogiorno preciso si ottengono 1.912 record, perché alcune offerte iniziano più tardi nel giorno: non confondere i due denominatori.

Il fatto che questo sia l'export ML corrente costituisce il contesto di simulabilità già adottato nel progetto; il filtro sopra non cerca un campo XML separato che certifichi la simulabilità.

## Conteggi

| Tipo | Numero |
|---|---:|
| Fisse |442|
| Variabili |1474|
| Miste |0|

Le 442 fisse non richiedono previsioni per il prezzo fisso della materia energia. Sette riportano comunque un riferimento indice (6 codice12,1 codice01): non aggiungere l'indice a una fissa soltanto perché il campo esiste.

| TIPOLOGIA_FASCE variabile | Significato tracciato v5 p56 | Record |
|---|---|---:|
|01|monorario|373|
|03|F1,F2,F3|1030|
|91|F1/F2+F3|66|
|07|Peak/OffPeak|5|

Riferimenti indice delle variabili: 1417 codice12 PUN mensile;47 codice01 PUN trimestrale;9 codice08 PUN bimestrale;1 codice05 PE. Tutte hanno **un solo** RiferimentiPrezzoEnergia; nessuna valorizza FASCIA_PREZZO. Non esiste in questi record una combinazione di più indici di fascia espliciti.

## Cosa significa, e cosa NON dimostra

Il tracciato v5 pp53–54 descrive codici01/08/12 come periodicità del PUN Index GME; una nota precisa che i forward del Portale restano trimestrali indipendentemente dalla periodicità. Nessuno dei tre codici identifica da solo F0 versus F1/F2/F3.

Il campo FASCIA_PREZZO assente indica indice applicato alla totalità dei consumi. **Questo non dimostra che il valore dell'indice sia necessariamente monorario F0**, perché la guida del calcolo collega comunque il valore forward alla fascia usata dalla formula. Non si deve inferire F0 dalla sola assenza del campo.

Le righe di SPREAD/FER per fascia non sono tre indici di mercato: sono corrispettivi del venditore da applicare ai consumi della fascia. Moltissimi record presentano tre spread uguali, ma il loro TIPOLOGIA_FASCE resta03. L'uguaglianza degli spread non prova un unico prezzo futuro dell'indice.

## Il passaggio ufficiale più importante

Regole AU v4.2, p24, §3.4.1.5 **Utente domestico**: il caso non monorario pubblicato usa forward F1 sulla CONSF1 e forward F23 sulla somma CONSF2+CONSF3, oltre ai corrispettivi pertinenti; segue la variante monoraria con forward F0.

P25 §3.4.1.6 **Utente NON domestico**: il caso per fasce usa invece tre forward distinti F1/F2/F3.

Quindi la documentazione domestica dà una motivazione concreta per partire da **F1 e F23**, anziché proporre automaticamente tre scenari distinti. Ma il §3.4.1.5 non esplicita la riconduzione delle 1.030 offerte domestiche triorarie tipo03 alla sua formula bioraria: non dichiarare questa riduzione già dimostrata per tutte. Le 66 biorarie tipo91 corrispondono direttamente al caso F1/F23 pubblicato. Le 373 monorarie non hanno il problema delle fasce previsionali. Le 5 Peak/OffPeak vanno qualificate secondo il relativo calendario; non mappare automaticamente Peak su F1.

## Codici campione e test discriminante proposto

- `001686ESVFL00XXES3PC1026DO000000`, + CASA SPECIAL, variabile tipo03, indice12; spread identico nelle tre fasce.
- `001686ESVFL00XXPC1026DO000000000`, + CASA, variabile tipo03, indice12; utile controllo analogo.
- `000502ESVFL01XXPNPCCLM1709260200`, PiuControllo Active Casa Luce Medium SL, variabile bioraria91.
- `000294ESVML01XXSmartCas261033983`, Smart Casa+ Luce, monoraria01.
- `029878ESVFL03XX000000DOM8VAR8BIO`, DOMESTICO VARIABILE BIOM, Peak/OffPeak07.

Prova primaria utile sul Portale: profilo domestico e + CASA SPECIAL, totale e F1 costanti; scambiare i consumi F2 e F3. Con spread uguali e formula F1/F23 la **vendita** non cambia. Se la vendita cambia, il Portale usa una distinzione ulteriore da ricostruire. Mantenere tutte le altre condizioni/versioni identiche. Questa prova non è stata eseguita dal presente audit read-only.

## Conclusione

Non è corretto dire che tutte le offerte richiedano tre prezzi previsionali: 442 fisse non li richiedono per la materia energia e373 variabili sono monorarie. È anche scorretto ridurre tutte le variabili a F0 solo perché l'indice XML è unico. Per i domestici la guida pubblicata distingue F0 oppure F1/F23; il caso triorario concreto e Peak/OffPeak richiedono verifica prima di adottare un metodo di shaping a tre fasce.

Dettaglio dei record selezionati: `/tmp/lmb-actual-index-bands.json`.

## Prova runtime successiva — esito discriminante

Su richiesta del parent è stato eseguito il normale modulo pubblico, in tre sessioni anonime nuove, con il codice + CASA SPECIAL, Pescara068028, domestico residente,3kW,prezzoVariabile,tipoTariffa=fasce,3.000kWh,nessun FER opzionale. Predizione registrata prima delle query: se il motore applicasse soltanto F1/F23, scambiare F2/F3 a F1/totale costanti non modificherebbe la vendita, poiché il record ha tre spread identici0,0275.

| Profilo F1/F2/F3 kWh | Vendita elettrica | Totale |
|---|---:|---:|
|1000/2000/0|849,14€|1234,63€|
|1000/0/2000|793,44€|1173,37€|
|3000/0/0|832,09€|1215,88€|

La risposta HTML server conserva `currentFilterJSON`: tutte e tre le quantità `consF1`, `consF2`, `consF3`, totale`consF0=3000`,potenza3,residentetrue sono state controllate. Nessun fallback convenzionale delle percentuali. Rete138,39€,oneri99,46€,imposte35,41€ restano identici. Il tipo offerta interno è02,tariffa03.

**L'ipotesi di una sola F23 per questa offerta domestica trioraria è confutata:** il cambio F2→F3 sposta la vendita di55,70€. Il Portale tratta dunque diversamente F2 eF3 almeno per questo caso. Non basta la formula domestica bioraria pubblicata per ridurre tutte le1030offerte tipo03 a due prezzi previsionali. Il terzo controllo verifica anche sensibilitàF1.

Questo non recupera univocamente dodici prezzi mensili o quattro prezzi trimestrali per fascia. Le differenze fra quote energia implicite sono però identificabili a periodo costante: a consumo totale fisso, coefficiente effettivoF2−F3=.02785€/kWh;F2−F1=.008525€/kWh;F3−F1=−.019325€/kWh. Non chiamare questi coefficienti quotazioni forward ufficiali acquisite: includono effetti dell'indice/perdite, salvo ulteriore scomposizione delle componenti.

Script: `/tmp/lmb-ee-swap-probe.py`. Risposte normalizzate e frammenti economici sanificati: `/tmp/lmb-ee-swap-results/profile-2000-0.json`, `profile-0-2000.json`, `profile-0-0.json`, e rispettivi `cost-*.html`. Nessun token/cookie nel materiale conservato. Validazioni per codice in `validation-*.json`.

Copie persistite delle risposte sanificate e dello script: [evidenze triorarie](./evidenze/scenario-fasce-2026-10-27/portale-triorario/). I tre profili normalizzati conservano gli input delle query e i risultati. La prova confuta la riduzione automatica di tutte le offerte domestiche a F1/F23.
