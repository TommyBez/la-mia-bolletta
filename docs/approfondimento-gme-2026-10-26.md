# GME come fonte per le stime di La mia bolletta

**Aggiornamento del 27 ottobre:** Q39 approva trimestrali prima dei mensili per mesi scoperti; lo snapshot copre temporalmente novembre 2026–ottobre 2027 per baseload e gas. La [conversione gas al riferimento convenzionale](./qualifica-conversione-gas-2026-10-27.md) è qualificata con fattore 0,0107. Le sezioni sotto conservano l'audit iniziale: l'assenza di Q4 2026 non è da sola un buco nel periodo scelto. Restano distinti fasce previsionali e acquisizione sistematica.

Verifica del 26 ottobre 2026. Vincoli: dati gratuiti; applicazione e MCP pubblici totalmente gratuiti nella fase iniziale. Questo documento qualifica una fonte; non attesta un'integrazione di produzione.

## Valutazione

GME merita una verifica prioritaria: pubblica prezzi di controllo per contratti futuri di elettricità e gas, dispone di risultati quotidiani strutturati e di un'API ufficiale esplicitamente gratuita. I campioni pubblici contengono direttamente tutti i quattro trimestri del 2027 anche per il gas, dove il campione EEX finora analizzato richiedeva ricostruzioni.

Restano due punti concreti: autorizzazione al nostro uso pubblico e sistematico, e qualificazione del metodo dei prezzi di controllo, inclusi aggiornamento e coerenza tra prodotti. La disponibilità istituzionale non dimostra equivalenza con i dati AU del Portale Offerte.

## Ruolo della fonte

GME organizza e gestisce i mercati italiani di elettricità, gas e prodotti ambientali. È interamente partecipato da GSE, a sua volta interamente partecipato dal MEF; opera nel quadro degli indirizzi ministeriali e della regolazione ARERA. È una fonte primaria per i propri mercati. [Profilo aziendale](https://www.mercatoelettrico.org/it-it/Home/GME/ProfiloAziendale), [struttura societaria](https://www.mercatoelettrico.org/it-it/Home/SocietaTrasparente/Organizzazione).

## Dati pubblici effettivamente letti

Le date seguenti sono quelle del selettore della pagina, verificate insieme alle righe della tabella nel DOM. Non dimostrano che ogni prezzo sia stato ricalcolato in quella giornata. Gli importi sono prezzi all'ingrosso in EUR/MWh, non costi finali della bolletta.

### Elettricità MTE: Baseload, sessione selezionata 23 ottobre 2026

[Pagina ufficiale](https://gme.mercatoelettrico.org/it-it/Home/Esiti/Elettricita/MTE/Esiti/Baseload).

| Prodotto | Prezzo di controllo EUR/MWh |
| --- | ---: |
| Novembre 2026 | 219,44 |
| Dicembre 2026 | 221,31 |
| Gennaio 2027 | 229,95 |
| Q1 2027 | 202,91 |
| Q2 2027 | 149,82 |
| Q3 2027 | 164,46 |
| Q4 2027 | 168,39 |
| Anno 2027 | 171,28 |

Nel campione le colonne prezzi degli scambi, prezzo di riferimento, bid/ask e volumi mercato/OTC riportavano trattini. Non vanno convertiti in prezzi pari a zero. Le posizioni aperte complessive erano 137.350 MWh. È presente un tab Peakload, non esaminato in questa verifica della pagina quotidiana.

### Gas MT-GAS: giorno selezionato 25 ottobre 2026

[Pagina ufficiale](https://gme.mercatoelettrico.org/it-it/Home/Esiti/Gas/MT-GAS/Esiti/MT-GAS).

| Codice prodotto | Prezzo di controllo EUR/MWh |
| --- | ---: |
| BoM-2026-10-3 | 80,930 |
| CY-2027 | 72,840 |
| M-2026-11 | 85,760 |
| M-2026-12 | 84,159 |
| M-2027-01 | 86,877 |
| Q-2027-01 | 86,302 |
| Q-2027-02 | 70,490 |
| Q-2027-03 | 74,423 |
| Q-2027-04 | 72,694 |
| SS-2027 | 75,388 |
| WS-2027/2028 | 71,335 |

Le altre colonne prezzi/scambi/posizioni aperte riportavano trattini. I trimestri Q3 e Q4 sono disponibili direttamente. SS indica il semestre estivo, WS quello invernale, CY l'anno di calendario e BoM il residuo del mese.

Entrambe le pagine espongono il pulsante ESPORTA XLSX. La [pagina download MTE](https://gme.mercatoelettrico.org/Home/Esiti/Elettricita/MTE/Download/EsitiMTE) descrive archivi compressi XML. Il contenuto degli export XLSX/XML non è stato scaricato in questa verifica. Il download delle offerte pubbliche va distinto dai risultati riepilogativi.

Le evidenze delle pagine sono salvate in [daily-public-evidence.json](./evidenze/gme-2026-10-26/daily-public-evidence.json).

### Utilizzo immediato senza API

Dalle tabelle già acquisite è stato ricavato uno snapshot strutturato di 19 contratti: 8 elettrici Baseload e 11 gas. Sono disponibili [JSON](./evidenze/gme-2026-10-26/control-prices-snapshot.json) e [CSV](./evidenze/gme-2026-10-26/control-prices-snapshot.csv), con codice contratto, prezzo di controllo, unità, data selezionata sul sito, data di osservazione e URL della fonte. I valori decimali sono preservati; i due formati sono stati riletti e confrontati.

Lo snapshot permette di lavorare sul prototipo e sul calcolo senza attendere credenziali API. Questa normalizzazione usa le evidenze locali già raccolte: non è un nuovo aggiornamento dei prezzi né un importatore quotidiano. Mancano Peakload/F1/F2/F3 e, nelle sole tabelle quotidiane campionate, Q4 2026. L'autorizzazione al riuso pubblico e alla raccolta sistematica rimane distinta dall'accesso tecnico senza API.

## Che cosa rappresentano i prezzi di controllo

Sono valori attribuiti da GME ai contratti e utilizzati per verificare le garanzie e valutare l'esposizione degli operatori. Possono essere presenti anche senza scambi: l'assenza di negoziazioni non li rende automaticamente inutilizzabili, ma impedisce di descriverli come medie di transazioni effettive.

- Elettricità: l'art. 102.5 della [Disciplina ME vigente](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101_Testo_Integrato_ME.pdf), p. 71, prevede determinazione giornaliera sulla base delle offerte presentate/concluse, anche mediante procedure che coinvolgano gli operatori. La [DTF ME 07 rev. 12](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101DTF07rev12ME.pdf), §4.3.5, non aggiunge una formula completa replicabile.
- Gas: l'art. 72.5 della [Disciplina MGAS del 18 maggio 2026](https://www.mercatoelettrico.org/Portals/0/Documents/it-it/20260518_Disciplina_MGAS.pdf), p. 64, ammette anche altri indicatori e procedure con gli operatori, oltre alle offerte presentate/concluse in un arco temporale.
- Il prezzo di riferimento è una grandezza distinta, legata alla media degli scambi ponderata per quantità. Per MTE, in assenza di contratti conclusi, non viene determinato: [DTF MTE 04 rev. 1](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101DTF04rev1MTE.pdf). Per il gas: [DTF MGAS 11 rev. 1](https://www.mercatoelettrico.org/Portals/0/Documents/it-it/20170920_DTF_11_rev01MGAS.pdf).

Nelle discipline e DTF esaminate non è stata individuata una formula pubblica esaustiva che permetta di ricostruire tutti i prezzi di controllo, né un fornitore esterno specifico per i casi senza scambi. Va chiesto a GME quale documentazione descriva la procedura effettiva.

### Due riscontri da approfondire sulla qualità

1. Novembre, dicembre e Q1 elettricità nella pagina del 23 ottobre coincidono con i valori di fine settembre della newsletter. La coincidenza è un fatto osservato; non prova da sola che i dati siano obsoleti o errati. La data della sessione non deve diventare automaticamente la data di rivalutazione del singolo prezzo.
2. Nei dati gas del 25 ottobre, la media dei quattro prezzi trimestrali ponderata per i giorni del 2027 (90, 91, 92, 92) è 75,9357 EUR/MWh, mentre il contratto annuale è valorizzato 72,840. Analogamente, Q2 e Q3 pesati per i giorni danno 72,4672, contro 75,388 del semestre estivo. Sono confronti aritmetici indicativi, non prove di un errore GME o di un arbitraggio eseguibile. Mostrano però che non si devono mescolare senza criterio prezzi mensili, trimestrali, semestrali e annuali per costruire una curva. La causa della differenza non è stata accertata.

Per l'app, una prima prova dovrebbe usare una famiglia coerente di contratti, conservare i valori originali e segnalare discrepanze e ripetizioni prima di formulare una stima.

## API ufficiale gratuita

La [pagina API](https://www.mercatoelettrico.org/it-it/Home/InterfacciaAPI) collega il [manuale utente](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20251015Manuale_Utente_API.pdf), la [guida tecnica](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20251015Manuale_tecnico_API.pdf) e le [condizioni aggiornate al 13 ottobre 2026](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20261013CONDIZIONI_GENERALI_API.pdf).

La guida documenta i dataset necessari:

| Finalità | Platform | Segment | DataName | Campo prezzo |
| --- | --- | --- | --- | --- |
| Risultati elettricità a termine | PublicMarketResults | MTE | ME_MTEResults | CheckPrice |
| Risultati gas a termine | PublicMarketResults | MT-GAS | GAS_ContinuousTrading | CheckPrice |
| Date di pubblicazione | PublicMarketResults | Metadata | Publications_Updates | Metadati di aggiornamento |

Per luce e gas si vedano rispettivamente §5.41 pp. 40–41 e §5.14 pp. 17–18 della guida. Il servizio usa autenticazione JWT e risposte contenenti JSON compresso in ZIP e codificato Base64. Il percorso base documentato è `https://api.mercatoelettrico.org/request/api/v1/`, con `POST Auth`, `POST RequestData` e `GET GetMyQuotas`.

Esempio costruito dalla documentazione, non eseguito con credenziali:

```json
{
  "Platform": "PublicMarketResults",
  "Segment": "MTE",
  "DataName": "ME_MTEResults",
  "IntervalStart": 20261023,
  "IntervalEnd": 20261023,
  "Attributes": {}
}
```

Sono ammesse persone fisiche e giuridiche. L'abilitazione richiede modulo e documentazione firmata, verifica e credenziali. Le quote di richieste/dati dipendono dall'utenza; non sono stati individuati limiti numerici generali garantiti. La password ha scadenza semestrale. Nessun account è stato creato e nessuna chiamata autenticata è stata eseguita.

### Gratuità e uso pubblico

Le condizioni API dichiarano all'art. 3 fornitura gratuita e a tempo indeterminato. Questo risolve il dubbio sul costo ordinario del canale API.

L'art. 5 limita però la licenza standard a uso informativo privato, con attribuzione, personale e non cedibile/sublicenziabile. L'art. 6 riguarda gli usi economici/commerciali. L'art. 6bis riserva a espressa autorizzazione scritta estrazione e raccolta sistematica o analisi automatizzata per qualsiasi finalità, richiamando anche il servizio API. Una riserva analoga compare nelle [condizioni del sito](https://gme.mercatoelettrico.org/it-it/Home/CondizioniUtilizzo/).

La documentazione tecnica contempla espressamente software personalizzati e client REST: non si conclude che sia vietato il normale funzionamento delle API. Occorre invece confermare che l'abilitazione copra l'import giornaliero e il riuso pubblico specifico nell'app e nell'MCP. Un servizio gratuito resta pubblico e non coincide con l'uso privato.

Non è stato trovato un tariffario per questa autorizzazione aggiuntiva, né una garanzia che venga concessa senza corrispettivi. La richiesta deve quindi specificare costo zero come condizione del progetto. Scaricare PDF anziché usare API non elimina la questione del riuso.

## Confronto con il Portale Offerte

Il [metodo ARERA](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa) descrive una media di quotazioni forward su un intervallo significativo del mese precedente, riferita ai quattro trimestri dal trimestre corrente, aggiornata mensilmente. Una singola quotazione giornaliera GME o il valore di fine mese non sono già quella media.

Possiamo adottare le stesse regole di calcolo delle offerte e costruire una nostra serie di prezzi da GME. Non è accertato che AU usi questi stessi valori, né è dimostrato che non li impieghi tra le fonti. Non è stata misurata una differenza in euro rispetto al Portale.

La copertura richiede attenzione al calendario: nelle tabelle quotidiane di ottobre i trimestri negoziabili sono quelli del 2027, mentre il Portale parte da Q4 2026. Le osservazioni del mese precedente possono contenere il trimestre corrente; l'accesso storico e la copertura vanno verificati nell'API prima di promettere parità di periodo.

Le [specifiche MTE](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20250101DTF01rev6MTE.pdf) prevedono baseload e peakload. Questi due profili non forniscono direttamente F1/F2/F3. Le [specifiche MT-GAS](https://www.mercatoelettrico.org/Portals/0/Documents/it-IT/20251001_DTF07rev4MGAS.pdf) coprono mesi, trimestri, semestri e anno; la consegna è al PSV secondo la disciplina MGAS. La conversione gas da EUR/MWh a EUR/Smc richiede il fattore energetico coerente con le regole del confronto.

## Report verificati

Quattro PDF pubblici sono stati scaricati direttamente senza credenziali; dimensioni e hash sono nel [manifest](./evidenze/gme-2026-10-26/report-manifest.json).

- [Newsletter del 14 ottobre, dati settembre](https://gme.mercatoelettrico.org/Portals/0/Documents/Newsletter/20261014Newsletter.pdf), p. 11: prezzi di controllo MTE a fine mese, compreso Q4 2027. Tabelle controllate anche visivamente.
- [Sintesi gas settembre](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT//202609_Dati_di_sintesi_gas_mensile.pdf): prezzi MT-GAS a fine mese, compreso Q4 2027. Testo estratto anche localmente.
- [Report gas settimana 43, pubblicato il 26 ottobre](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT//20261026ReportSettimanaleGas43-2026.pdf): contiene la tabella MT-GAS riferita all'ultima sessione della settimana. È un PDF immagine nel campione acquisito; il testo locale risulta vuoto e l'estrattore remoto perdeva le etichette dei contratti. La tabella è stata verificata visivamente.
- [Report elettrico settimana 43](https://gme.mercatoelettrico.org/Portals/0/Documents/it-IT//20261026MGPreportsettimanale43.pdf): acquisito come ulteriore pubblicazione, non usato come prova della curva MTE.

Questi risultati rendono l'API preferibile come canale produttivo rispetto alla lettura automatica dei report. I report restano utili per controlli e verifica documentale.

## Prossimo passo concreto

Ottenere conferma scritta da GME del permesso gratuito per il caso d'uso, insieme a chiarimenti sulla formazione e sulla data effettiva dei prezzi di controllo. Dopo riscontro positivo, verificare con credenziali i due dataset, lo storico del mese precedente e la continuità su più sessioni. Quindi confrontare alcune stime con il Portale, a parità di offerte, consumi e periodo.

### Bozza di richiesta, non inviata

Destinatario per condizioni d'uso: `info@mercatoelettrico.org`; per abilitazione API: `SupportoAPI@mercatoelettrico.org`, secondo la documentazione del servizio.

Oggetto: Utilizzo gratuito dei dati MTE e MT-GAS per comparatore domestico e servizio MCP

Stiamo studiando un'applicazione pubblica per confrontare offerte domestiche di elettricità e gas, inizialmente totalmente gratuita. Vorremmo acquisire una volta al giorno tramite API i risultati MTE e MT-GAS, in particolare i prezzi di controllo, conservarne lo storico e usarli per stimare la spesa delle offerte. L'app e un'interfaccia MCP fornirebbero gratuitamente i confronti, indicando GME come fonte e distinguendo le nostre elaborazioni dai dati originali.

Chiediamo se l'abilitazione API e un'eventuale autorizzazione ai sensi degli artt. 5 e 6bis possano coprire questo uso senza alcun corrispettivo, inclusa la conservazione e l'elaborazione dei dati. Chiediamo inoltre di precisare se sia consentito esporre i singoli valori con la fonte, oltre ai risultati derivati, e quali obblighi o limiti si applichino.

Per qualificare correttamente i dati, chiediamo documentazione sulla determinazione dei prezzi di controllo MTE/MT-GAS in assenza di scambi, sugli indicatori utilizzati e sul mantenimento di valori precedenti. È disponibile la data di effettiva rivalutazione per ciascun contratto? Come vanno interpretate differenze tra contratti annuali/semestrali e i trimestri corrispondenti? È disponibile via API lo storico necessario a calcolare medie delle osservazioni del mese precedente?

Nessun messaggio è stato inviato, nessuna adesione sottoscritta e nessun importatore di produzione implementato durante questo approfondimento.
