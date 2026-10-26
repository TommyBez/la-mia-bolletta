# Verifica dei dati gratuiti EEX tramite MiFIR

Verifica del 26 ottobre 2026 per La mia bolletta. L'applicazione sarà totalmente gratuita nella fase iniziale; sono esclusi dati e licenze a pagamento.

## Esito

Il servizio gratuito Deutsche Börse MiFIR contiene effettivamente prezzi e proposte dei futures Italian Power e gas PSV. Sono stati scaricati e letti **82 file gzip, 340.772 messaggi**, con confronto degli identificativi con i documenti ufficiali EEX. Il conteggio dei messaggi non equivale al numero di transazioni o quotazioni indipendenti.

Per la luce base sono stati osservati mesi e trimestri che coprono novembre 2026–ottobre 2027. Per il gas sono presenti mesi, trimestri, stagioni e anni: i dati consentono una ricostruzione parziale, compreso Q3 2027 implicito, ma non determinano ancora una curva completa senza ulteriori ipotesi. Questi dati non sono settlement, non sono i forward AU e non garantiscono continuità o liquidità futura.

## Accesso, condizioni e prove conservate

La [pagina ufficiale Deutsche Börse](https://www.mds.deutsche-boerse.com/mds-en/real-time-data/Delayed-data) pubblica i collegamenti ai canali pretrade e posttrade EEX, con ritardo di 15 minuti. I [termini specifici MFS](https://mfs.deutsche-boerse.com/DEEX-posttrade) concedono uso gratuito senza commercializzazione dei dati e non garantiscono accuratezza, completezza o tempestività. La [policy V3.0](https://www.mds.deutsche-boerse.com/resource/blob/5322802/8a82ea41893249520d1b5fb4878c8dad/data/Market%20Data%20Policy%20Guidelines%20and%20FAQ_V3_0.pdf), pagina 17, include esplicitamente EEX. Il modello iniziale gratuito del comparatore e dell'MCP è coerente con questi testi. Dopo conferma specifica dell'utente è stato accettato il dialogo MiFIR; nessun acquisto, abbonamento o contatto con il fornitore.

Sono stati esaminati:

- [Consolidato luce del 23 ottobre](https://mfs.deutsche-boerse.com/api/download/DEEX-posttrade-daily-2026-10-23.json.gz), integralmente.
- [Consolidato gas del 23 ottobre](https://mfs.deutsche-boerse.com/api/download/DPOW-posttrade-daily-2026-10-23.json.gz), integralmente.
- [Pretrade luce del 26 ottobre, 11:10 UTC](https://mfs.deutsche-boerse.com/api/download/DEEX-pretrade-2026-10-26T11_10.json.gz).
- 79 file pretrade gas distinti: 12 del 23 ottobre e 67 del 26 ottobre; 305.382 messaggi complessivi, di cui 1.490 PSV. Quattro copie identiche sono state escluse.

I link ai singoli file possono scadere con la finestra del servizio. Il [manifest](./evidenze/mifir-2026-10-26/manifest.json) conserva URL, hash SHA-256, dimensione e conteggio dei messaggi. Sono conservati anche [risultati posttrade](./evidenze/mifir-2026-10-26/posttrade-coverage.json) e [risultati pretrade](./evidenze/mifir-2026-10-26/pretrade-coverage.json).

La scansione di tutti i minuti disponibili è stata interrotta dopo risposte HTTP 429. Una richiesta singola dopo l'attesa è riuscita. I 79 file gas non costituiscono quindi un censimento completo della finestra; non osservare un contratto in essi non dimostra che sia assente in tutti gli altri minuti. Un tentativo alternativo nel servizio di consultazione MVS non ha fornito evidenza aggiuntiva affidabile ed è escluso dai conteggi.

## Identificazione corretta dei contratti

Nei file acquisiti `instrumentIdentificationCode` corrisponde al **ProductISIN**, da combinare con `contractDate`. Non va usato da solo come identificativo della singola scadenza. Il controllo dei 944 record Italian Power/PSV nei due consolidati non ha rilevato mancate corrispondenze o conflitti.

| Prodotti | Codici | ProductISIN principali |
| --- | --- | --- |
| Italian Power base mese/trimestre/anno | FDBM / FDBQ / FDBY | DE000A1RREN9 / DE000A1RREP4 / DE000A1RREQ2 |
| Italian Power peak | FDPM / FDPQ / FDPY | Da mantenere distinto dal base |
| PSV mese/trimestre/stagione/anno | GCBM / GCBQ / GCBS / GCBY | Mese DE000A160LU7; trimestre DE000A160LV5 |

Fonti di mappatura: [codici prodotti EEX](https://www.eex.com/fileadmin/EEX/Downloads/Trading/Specifications/Product_Codes/20260922_EEX_Products_Shortcodes.xlsx), [dettagli elettricità](https://www.eex.com/fileadmin/EEX/Downloads/Trading/Specifications/Contract_Details/eex-contract-details-xls-data_20260911.xlsx), [dettagli gas](https://www.eex.com/fileadmin/EEX/Downloads/Trading/Specifications/Contract_Details/20260717_Contract_Details_file_for_Gas_Futures.xlsx). Una data come gennaio 2027 può identificare un mese, Q1 o l'anno, secondo il prodotto.

## Luce: copertura osservata

Ultimi prezzi numerici disponibili nel consolidato del 23 ottobre, in €/MWh. Non sono settlement né medie giornaliere.

| Periodo base | Messaggi con prezzo / totali | Ultimo prezzo |
| --- | ---: | ---: |
| Novembre 2026 | 453 / 483 | 249,00 |
| Dicembre 2026 | 140 / 160 | 251,00 |
| Q1 2027 | 127 / 134 | 216,50 |
| Q2 2027 | 3 / 4 | 155,50 |
| Q3 2027 | 5 / 5 | 170,00 |
| Q4 2027 | 13 / 14 | 174,25 |
| Anno 2027 | 61 / 61 | 179,25 |

Il pretrade del 26 ottobre 11:10 contiene anche bid e ask per novembre, dicembre e tutti i quattro trimestri 2027. La presenza di pochi scambi su alcuni trimestri rende necessario un controllo di liquidità e ampiezza dello spread.

Questi strumenti coprono l'orizzonte novembre–ottobre, ma non sono dodici prezzi mensili indipendenti. Distribuire il prezzo trimestrale fra mesi o fasce richiede un metodo dichiarato. Le fasce F1/F2/F3 non sono ricavabili automaticamente dal solo baseload. Il Q4 2026 aveva già terminato la negoziazione: la sua assenza dal consolidato del 23 ottobre non indica un errore dell'importatore.

## Gas: copertura osservata e derivabile

Nel consolidato del 23 ottobre, ultimi prezzi numerici PSV: novembre 2026 **94,65**, dicembre **95,35**, gennaio 2027 **94,95**, marzo **90,575 €/MWh**. I tre record Q1 2027 non contengono `price`. Sono presenti anche dati annuali più lontani, non sufficienti a riempire automaticamente i mesi mancanti.

Ultime osservazioni pretrade nel campione:

| Periodo PSV | Bid €/MWh | Ask €/MWh | Timestamp UTC |
| --- | ---: | ---: | --- |
| Novembre 2026 | 93,20 | assente | 23/10 16:00:00 |
| Q1 2027 | assente | 95,20 | 26/10 11:10:40 |
| Q2 2027 | 76,805 | 77,55 | 26/10 11:10:58 |
| Estate 2027 | 74,50 | 75,30 | 26/10 11:10:19 |
| Inverno 2027 | 67,825 | 68,53 | 26/10 11:10:55 |
| Anno 2027 | 78,13 | 78,90 | 26/10 11:08:05 |

La tabella mantiene le diverse date: non rappresenta una curva simultanea. Tutti i 98 record di profondità Q1 2027 osservati hanno il bid esplicitamente vuoto.

### Q3 2027 implicito

I volumi contrattuali ufficiali sono 4.392 MWh per Estate 2027, 2.184 per Q2 e 2.208 per Q3. L'identità Estate = Q2 + Q3 permette di ricavare prezzi sintetici indicativi:

```text
Q3 bid = (74,50 × 4392 − 77,55 × 2184) / 2208 = 71,48315 €/MWh
Q3 ask = (75,30 × 4392 − 76,805 × 2184) / 2208 = 73,81136 €/MWh
Midpoint derivato = 72,64726 €/MWh
```

È una derivazione aritmetica dai record del minuto 11:10, non un prezzo Q3 pubblicato direttamente. Le osservazioni distano circa 39 secondi: non è dimostrata eseguibilità simultanea. Lo spread sintetico non è un intervallo di confidenza del futuro prezzo del gas.

### Limite su Q4 2027

Nel minuto comune 11:07 sono presenti Cal27 bid/ask 78,13/79,00, Estate27 74,50/75,40 e Q1 ask 95,25, con bid assente. I volumi ufficiali danno Cal27 − Q1 − Estate27 = Q4:

```text
Q4 bid sintetico = (78,13 × 8760 − 95,25 × 2160 − 75,40 × 4392) / 2208
                = 66,81250 €/MWh
```

L'ask sintetico richiede il bid Q1, che manca. Non si può quindi ricavare un midpoint Q4 univoco dalle sole osservazioni. Un valore puntuale richiederebbe un'altra osservazione o un'ipotesi aggiuntiva esplicita. Per i pesi vanno usati i volumi gas ufficiali: Q1/Q4 gas sono 2.160/2.208 MWh, diversi dai corrispondenti elettrici 2.159/2.209.

## Implicazioni per l'importatore e il confronto

### Acquisizione programmatica verificata

Un controllo ulteriore del 26 ottobre ha verificato anche l'individuazione automatica dei file, senza browser: il [JavaScript pubblico della pagina MFS](https://mfs.deutsche-boerse.com/app.js) legge `/api/<nome-canale>` e costruisce i collegamenti `/api/download/<nome-file>` dagli elementi di `CurrentFiles`. Le richieste HTTP dirette a [DEEX-posttrade](https://mfs.deutsche-boerse.com/api/DEEX-posttrade) e [DPOW-posttrade](https://mfs.deutsche-boerse.com/api/DPOW-posttrade) hanno restituito JSON valido, con 2.210 file dichiarati per canale, data di generazione e consolidato giornaliero del 23 ottobre. Sono endpoint effettivamente usati dal sito; non è stata verificata una promessa di stabilità/versionamento come API pubblica documentata.

Il download diretto e la lettura dei gzip erano già stati verificati. Il programma può quindi leggere l'elenco, selezionare i file non ancora acquisiti e scaricarli, seguendo normalmente i redirect. Il redirect osservato punta a un URL firmato di breve durata: conservare l'URL MFS sorgente, senza riutilizzare quello temporaneo. La procedura ordinaria non richiede clic ripetuti nel browser.

Per un servizio affidabile restano necessari archiviazione propria entro la breve finestra di disponibilità, cache, gestione HTTP 429, riprese dopo errori e verifica di completezza. I consolidati posttrade riducono il numero di download per gli scambi; i pretrade richiedono una raccolta più frequente se si vogliono ricostruire le proposte senza perdere gli aggiornamenti.

### Lettura e interpretazione

Il formato effettivo è NDJSON dentro gzip: una riga per messaggio. Nei pretrade coesistono aggiornamenti `bestBid`/`bestAsk` e record di profondità; non vanno contati come quotazioni indipendenti. Un aggiornamento del solo ask non cancella il bid; un array bid vuoto in un record di profondità è invece informazione esplicita. I file rappresentano aggiornamenti nel minuto, non l'elenco completo di ogni strumento quotato.

Nei consolidati target tutti gli identificatori transazione sono distinti e `mmtModificationInd` è `-`. I record senza prezzo hanno `pendingPriceIndicator=U` e `mmtTransactionCategory=Z`; non vanno trasformati in zero né usati per sostituire l'ultimo prezzo numerico. Un importatore di produzione deve comunque gestire rettifiche, cancellazioni, differimenti e duplicati fra file.

La soluzione gratuita può usare EEX come fonte di mercato verificata, separando prezzi osservati, prezzi sintetici e assunzioni statistiche. Servono limiti di anzianità, controllo dello spread, una politica per le scadenze senza due lati e un metodo di distribuzione dei consumi. Per replicare esattamente il Portale rimangono diverse sia la fonte sia la metodologia AU; un modello proprio va presentato come tale.

Questo lavoro è un audit dei dati e una verifica matematica delle derivazioni. Non sono stati implementati un servizio di acquisizione continuativa o un modello previsionale validato.
