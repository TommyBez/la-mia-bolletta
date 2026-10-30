# Verifica dei dati dei tredici casi a canone o rata

27 ottobre 2026. Esame integrale delle otto schede luce e cinque gas selezionate nell'approfondimento, confrontate con tre offerte ordinarie a rata. Solo dati già acquisiti dal Portale Offerte; nessun sito, PDF o URL dei fornitori consultato. Questa nota verifica i dati dei casi; la compatibilità completa con il ramo fiscale e gli sconti del metodo ufficiale è distinta dalla possibilità di eseguire una moltiplicazione.

## Fonti e perimetro verificato

- [Pagina ufficiale luce senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO), 1.058 schede nel documento acquisito.
- [Pagina ufficiale gas senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS), 249 schede.
- [Descrizioni integrali dei tredici casi](./evidenze/canone-2026-10-27/selected-portal-descriptions.json), con ID della pagina e hash. Origine e checksum degli HTML nel [manifesto](./evidenze/canone-2026-10-27/manifest.json).
- [XML luce ML](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml) e [XML gas ML](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261027.xml), 27 ottobre.
- [Regole AU v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), pp. 27 e 40: ramo onnicomprensivo a canone; pp. 22–26 e 37–39: rami ordinari. [Tracciato AU v5.0](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), §7.2: trasmissione delle offerte senza simulazione.

Le schede HTML sono state cercate integralmente per venditore, nome e menzioni del nome nelle descrizioni. Risultano cinque schede Fastweb luce, cinque gas e tre Casa Mia No Stress; nessuna scheda omonima supplementare con altri dati. Negli XML non risultano nomi o menzioni di questi prodotti Flat/Casa Mia. Questo è un riscontro sui documenti del 27 ottobre, non una prova che AU non possieda ulteriori dati nei propri sistemi. Gli identificativi `modal-...` non sono codici offerta e non consentono un collegamento certo con un'altra tariffa.

### Ricerca di altri possibili canoni nelle 1.307 schede

Per verificare che la selezione non dipendesse soltanto dai nomi già noti, è stata ripetuta una ricerca su **nome e descrizione di tutte le schede**, sostituendo gli underscore con spazi e ignorando maiuscole/minuscole. Gruppi lessicali, sovrapponibili:

| Gruppo | Schede intercettate |
| --- | ---: |
| rata/rate fissa, costante o mensile; flat; forfait/forfettario | 17 |
| canone/canoni | 10 |
| consumo incluso/di riferimento; quantità, soglia o taglia entro 80 caratteri da kWh/Smc | 11 |
| onnicomprensivo, tutto incluso, all inclusive, pacchetto, plafond | 5 |

L'unione comprende **19 schede uniche**: tutte le tredici già selezionate e sei ulteriori. Le sei descrizioni sono state rilette integralmente:

- **ENERCOM Sempre Leggeri Luce**, `modal-13856`, e **Sempre Leggeri Gas**, `modal-13858`: offerte indicizzate PUN/PSV con una quota a consumo azzerata fino a 2.000 kWh/500 Smc e pari a 0,0139 €/kWh o 0,10 €/Smc oltre soglia. Sono casi di prezzo per scaglioni, non canoni con consumo incluso né rate costanti. Non sono stati dichiarati interamente calcolabili da questa nota: il testo non riporta tutte le altre componenti e menziona un canale locale di adesione.
- **Be One Condominio 10/20/30/40**, `modal-9262`, `modal-9261`, `modal-9259`, `modal-9260`: rateizzazione in tre mesi di un costo di attivazione una tantum, con prezzo gas indicizzato CMEMm. La rata riguarda quell'onere iniziale, non l'intera bolletta; inoltre il testo è rivolto ai condomini.

La ricerca non ha quindi fatto emergere altri canoni o rate della bolletta oltre ai tredici casi. È una verifica lessicale con rilettura dei candidati, **non un censimento semantico garantito** di tutte le possibili formulazioni commerciali. Il numero tredici rimane il perimetro dei casi analizzati, non una stima delle quote di mercato o di tutte le offerte domestiche senza calcolo.

## Matrice dei valori effettivamente pubblicati

`C` indica qui l'importo annuo descritto nella pagina, **non il valore al netto delle imposte richiesto dal campo del ramo AU**. `p` è il corrispettivo descritto per il conguaglio. I prezzi testuali non sono stati copiati nei campi fiscali del metodo strutturato.

**Aggiornamento della qualifica fiscale:** il testo delle schede non specifica netto/lordo per `p`, ma il criterio generale ufficiale risolve la lettura conforme: prezzi unitari al netto delle imposte salvo esplicita indicazione contraria. Il [documento del Portale sugli indicatori v2.0, p.9](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/0f7a9b80925931637af9050c90350ee2.pdf) richiama l'[art.5.1(a) del Codice di condotta commerciale vigente dal 1° aprile 2026](https://www.arera.it/fileadmin/allegati/docs/18/366-18_ti.pdf), applicabile a qualunque forma di comunicazione. Pertanto `p` si legge netto, mentre canone e sconto hanno dichiarazioni esplicite di inclusione delle imposte. La [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md) documenta la normalizzazione e le restanti dipendenze: non si mantiene il trattamento fiscale del conguaglio come dato privo di qualunque regola.

| Scheda | ID | C descritto, €/anno | Consumo descritto | p in eccesso e difetto | Stato dei dati economici |
| --- | --- | ---: | ---: | ---: | --- |
| Fastweb Luce Flat Start | 14147 | da 564 | 800 kWh | 0,30 €/kWh | C minimo dichiarato, volume e conguaglio presenti; applicabilità del C da qualificare. p netto secondo il criterio ufficiale |
| Fastweb Luce Flat Light | 14146 | da 768 | 1.500 kWh | 0,28 €/kWh | Stesso limite |
| Fastweb Luce Flat Pro | 14148 | da 1.044 | 2.500 kWh | 0,27 €/kWh | Stesso limite |
| Fastweb Luce Flat Ultra | 14154 | da 1.560 | 4.500 kWh | 0,25 €/kWh | Stesso limite |
| Fastweb Luce Flat Partner Light | 14156 | **Assente** | fino a 1.500 kWh | **Assente** | Non si determina neppure il canone al volume descritto; mancano anche inclusioni fiscali e meccanismo di conguaglio |
| Casa Mia No Stress 800 | 14142 | **Assente** | 800 kWh nel nome/testo | **Assente** | Solo indicazione di rata costante; manca il prezzo della rata e la tariffa sottostante |
| Casa Mia No Stress 1500 | 14143 | **Assente** | 1.500 kWh nel nome/testo | **Assente** | Stesso limite |
| Casa Mia No Stress 2500 | 14144 | **Assente** | 2.500 kWh nel nome/testo | **Assente** | Stesso limite |
| Fastweb Gas Flat Start | 14151 | 432 | 150 Smc | 1,60 €/Smc | Canone esatto lordo e conguaglio netto presenti; normalizzazione fiscale secondo la verifica del metodo |
| Fastweb Gas Flat Light | 14155 | 660 | 300 Smc | 1,50 €/Smc | Stesso limite |
| Fastweb Gas Flat Pro | 14157 | 1.104 | 600 Smc | 1,46 €/Smc | Stesso limite |
| Fastweb Gas Flat Maxi | 14158 | 1.536 | 900 Smc | 1,42 €/Smc | Stesso limite |
| Fastweb Gas Flat Ultra | 14159 | 1.956 | 1.200 Smc | 1,38 €/Smc | Stesso limite |

Per i nove Fastweb con prezzi completi il testo descrive espressamente il conguaglio tanto per consumi superiori quanto per consumi inferiori alla quantità inclusa. Per Partner Light e Casa Mia la sola quantità nel testo non basta a ricostruire un `CONSUMO_CANONE` con la medesima semantica: non è documentato il meccanismo economico.

## Imposte, sconti, requisiti e tempo

### Quattro Fastweb luce con prezzi

**Inclusioni esplicite:** il canone comprende materia, trasporto, contatore, oneri, accise e IVA. Lo sconto di 10 €/mese è dichiarato IVA inclusa. Il testo **non applica un'etichetta fiscale esplicita al corrispettivo di conguaglio**: l'affermazione sulle imposte si riferisce al canone, mentre gli extra consumi sono elencati fra le esclusioni dal canone. Il criterio generale ufficiale riportato sopra permette però di interpretare `p` al netto: il silenzio della scheda non costituisce più una lacuna senza regola. Il coefficiente del conguaglio in difetto è indicato numericamente; la lettura €/kWh deriva dal contesto e dal medesimo coefficiente esplicitamente unitario in eccesso.

**Requisiti descritti:** clienti domestici, potenza fino a 6 kW. Il testo indica consumi fino al volume della taglia e poi disciplina gli sforamenti: è errato interpretare il volume come un tetto che renda impossibile un costo oltre soglia. È però distinto il tema di quale taglia sia sottoscrivibile con il consumo annuo dichiarato; il testo non documenta una regola completa di selezione o una libera scelta di qualsiasi taglia per qualsiasi profilo.

**Sconto:** 10 €/mese per clienti dei servizi di telecomunicazione indicati o adesione contestuale, subordinato al mantenimento del servizio e valido per massimo due contratti energia. Non è uno sconto incondizionato. Per un anno intero con requisito mantenuto l'importo aritmetico è 120 €; questo non qualifica automaticamente il trattamento nello specifico algoritmo AU, che distingue validità, condizioni e applicazione fiscale degli sconti. Non è stata individuata una durata minima del servizio telecom nella descrizione.

**Tempo:** tutte e quattro le schede espongono validità di adesione 24 ottobre–15 novembre 2026. La descrizione parla di canone bloccato e conguaglio alla fine dell'anno; non espone un distinto numero di mesi per la durata delle condizioni economiche. La data 15 novembre **non è** la scadenza del prezzo per un cliente attivato. L'assenza di `DURATA` numerico non è da sola la prova che manchi un prezzo annuale: esistono C annuo e un ciclo annuale descritti. La copertura contrattuale dell'orizzonte e gli eventuali rinnovi restano da distinguere dal valore del canone.

**“A partire da”:** la frase collega potenza, consumi e uso alla scelta della fascia. Non dice quale attributo faccia variare il canone della stessa Light, né che un aumento avvenga. Restano compatibili con il testo una cifra applicabile a tutti gli ammessi a quella taglia e una cifra minima applicabile a un sottoinsieme: non si può scegliere una delle due letture solo dalla locuzione. Non è dimostrato che questo sia il motivo della collocazione nella sezione senza simulazione.

### Cinque Fastweb gas

**Inclusioni esplicite:** C è un importo annuo esatto, senza “a partire da”, comprensivo di vendita, rete, oneri e imposte. Sconto di 10 €/mese IVA inclusa. Come per luce, il corrispettivo dei consumi aggiuntivi e del rimborso non ha un'esplicita indicazione netto/lordo; il criterio ufficiale lo interpreta al netto. Non serve inventare una variazione di C per area geografica: il testo non la dichiara. La ricostruzione del canone netto e della spesa lorda a un consumo diverso richiede il trattamento fiscale del profilo, sviluppato nella [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md).

**Requisiti descritti:** domestici, punti di riconsegna a uso civile; una fornitura Fastweb Energia Luce già attiva oppure sottoscritta contestualmente. La dipendenza dalla luce è reale, ma il testo ammette anche chi ne sia già titolare: non è corretto chiamarle tutte obbligatoriamente una nuova attivazione dual fuel. Il criterio Q26 sull'indipendenza va applicato esplicitamente, senza confonderlo con un dato economico assente. Il volume è incluso nel canone con conguaglio in entrambe le direzioni, quindi non è una soglia oltre la quale la spesa sia indescrivibile.

**Sconto:** 10 €/mese finché rimane attiva la luce. Con mantenimento del requisito per dodici mesi, la riduzione aritmetica descritta è 120 €. Non applicarla a un profilo privo del requisito né attribuirle automaticamente la codifica AU di uno sconto non condizionato.

**Tempo:** adesione 24 ottobre–15 novembre 2026; regolazione a fine anno contrattuale espressamente descritta. Nessuna durata pluriennale del prezzo dichiarata. Non confondere finestra di adesione e anno contrattuale.

### Partner Light e Casa Mia

Partner Light descrive soltanto un'offerta a canone per consumi fino a 1.500 kWh e l'energia rinnovabile, senza C, p, imposte, sconti o durata economica. La finestra di adesione è 24 ottobre–15 novembre 2026. Non si possono importare i 768 € dalla Light ordinaria: variante, nome e ID sono diversi e manca il codice offerta per un collegamento certo.

Le tre Casa Mia dichiarano soltanto rata costante, volume indicato ed energia verde. Non specificano importo, prezzo unitario, inclusioni fiscali, conguaglio, sconti o durata economica. La finestra di adesione è 24 ottobre–31 dicembre 2026. Non si può stabilire se siano acconti su una tariffa ordinaria oppure canoni comprensivi di consumi: attribuire loro la formula dei Fastweb sarebbe inventare dati e condizioni.

## Quali calcoli si possono già fare e quali no

**Esiste almeno un calcolo parziale determinato per i gas.** Per Gas Flat Light con consumo esattamente pari a 300 Smc, il conguaglio è zero e il testo indica C = 660 €/anno, imposte incluse. Per un anno intero di mantenimento della fornitura luce, la riduzione descritta è 120 €, dunque 540 € nel semplice conto contrattuale. Questo esempio riguarda esclusivamente le voci indicate e le condizioni assunte; non è una stima verificata del comparatore né un'autorizzazione a trasferire lo sconto condizionato nel metodo AU. Dimostra però che “nessun importo è calcolabile” sarebbe eccessivo.

**Fuori dal volume incluso il conguaglio va trattato al netto.** Per Gas Light a 400 Smc, `660 + 1,50 × 100 = 810 €` mescolerebbe canone lordo e conguaglio netto: non è il totale qualificato. La precedente ipotesi di due letture fiscali equivalenti è superata dal criterio ufficiale. Si ricostruisce il canone netto al consumo di riferimento, si applica il conguaglio netto e si ricalcolano le imposte per il consumo del profilo, secondo la [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md). Non occorre conoscere ogni voce interna del canone se la funzione fiscale può essere invertita con i dati ufficiali pertinenti. La verifica di tali tabelle e del relativo trattamento resta nel documento del metodo; non è una mancanza di C, volume o p della scheda.

**Quattro schede non consentono neppure il punto di riferimento:** Partner Light e Casa Mia non forniscono C. Per queste, una formula AU completa non risolve la mancanza di un importo da inserire.

Per le quattro luce con prezzi, un conto come `768 + 0,28 × (Q − 1.500)` mescolerebbe importi lordi e netti. Va normalizzato secondo le regole ufficiali, mantenendo separata la questione ancora aperta dell'applicabilità di C al profilo. Non si interpreta più `p` come un valore fiscale privo di criterio.

## Controllo con le rate già presenti negli XML

| Record ordinario | Tariffa presente | Durata e ammissibilità presenti | Esito della verifica |
| --- | --- | --- | --- |
| NeN Due Luce, `029748ESFML01XX261021LDDUE000000` | Fissa, componente FER standard 0,153 €/kWh, quota vendita 108 €/anno, dispacciamento identificato | Durata 24 mesi; adesione 21 ottobre–4 novembre; domestica, singola, cambio fornitore | La rata non impedisce il ramo ordinario AU. Non manca un canone da ricostruire; restano le normali componenti regolate e imposte |
| NeN Due Gas, `029748GSFML01XX261021GDDUE000000` | Fissa, 0,62 €/Smc e 120 €/anno | Stesse durata e adesione; domestica, singola, cambio fornitore | Stessa conclusione; il ricalcolo della rata dopo dodici mesi non sostituisce i prezzi strutturati |
| Gelsia Rata Fissa Gas, `002505GSVML03XX00000000GMGRATAKN` | Variabile, indice PSV mensile `14`, spread 0,117 €/Smc, quota 129 €/anno | Durata 12 mesi; adesione 12 ottobre–11 novembre; domestica e singola; 633 comuni elencati, incluso Milano | Il conguaglio è esplicitamente differenza fra pagamenti effettuati e consumi valorizzati ai corrispettivi. Il costo si stima con il ramo variabile ordinario; rimane necessario il prezzo previsionale qualificato |

Questi valori XML sono componenti commerciali e non totali IVA inclusa. Gelsia ha inoltre uno sconto strutturato condizionato di 9 €/anno per pagamento e bolletta elettronica; non si applica automaticamente. Le descrizioni dei piani mensili non cambiano il costo della tariffa sottostante e non autorizzano a sostituire la stima con dodici rate. La disponibilità di campi economici non equivale a una verifica completa già eseguita di imposte, forward, ammissibilità e parità numerica col Portale.

## Conclusione circoscritta ai dati

Gli ostacoli non sono tutti uguali: **quattro schede mancano dei prezzi essenziali; quattro luce richiedono di qualificare l'applicabilità del canone indicato; le cinque gas forniscono i tre valori economici esatti e la convenzione ufficiale risolve la lettura fiscale del conguaglio.** Il raccordo fra canone lordo, formula AU e imposte del profilo è un'elaborazione distinta, descritta nella [verifica del metodo](./verifica-metodo-canoni-2026-10-27.md), non una generica assenza dei prezzi commerciali. I gas hanno anche un caso al volume di riferimento aritmeticamente determinabile. Le rate ordinarie hanno una tariffa strutturata e non introducono un problema autonomo di formula.

Codice non esposto, enum non trasmesso nella pagina e sconto condizionato non sono ciascuno, da soli, prove di impossibilità matematica. Sono rispettivamente limiti di identità/provenienza, di mappatura al metodo e di ammissibilità/calcolo dello sconto. Per dichiarare una classifica secondo il Portale serve chiudere questi raccordi, non semplicemente riconoscere i tre numeri C, Q e p.
