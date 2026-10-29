# Catalogo ufficiale: operazioni e verifiche

Il catalogo usa esclusivamente i link XML **simulabili Mercato Libero** e i CSV
parametri scoperti dalla [pagina open data ufficiale](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page).
Il filtro dichiarato comprende clienti domestici, offerta singola e cambio
fornitore (`TIPOLOGIA_ATT_CONTR` contiene `01` oppure `99`, anche se il campo è
ripetuto). Ogni altra formula simulabile rimane nel record; i campi sconosciuti,
gli intervalli sovrapposti, i periodi, gli indici e le condizioni non vengono
rimossi. `sourceRecord` conserva tutto l'albero XML con prezzi come stringhe.

## Comandi

Le credenziali rimangono nell'ambiente, mai negli argomenti del comando.

```sh
node --env-file=.env.local --import tsx scripts/catalog/index.ts refresh all
node --env-file=.env.local --import tsx scripts/catalog/index.ts status all
# Applica un nuovo normalizzatore/riferimenti agli originali già verificati
node --env-file=.env.local --import tsx scripts/catalog/index.ts reprocess all
node --env-file=.env.local --import tsx scripts/catalog/index.ts refresh electricity
```

Il comando restituisce separatamente gli esiti luce e gas; un fallimento non
annulla l'altra commodity. Il Cron Vercel chiama `GET /api/internal/catalog/refresh`
con `Authorization: Bearer $CRON_SECRET`, avviando due Workflow indipendenti.
L'endpoint rifiuta richieste prive del segreto. Il Workflow registra un run ID,
archivia XML/CSV in Blob privato e passa soltanto riferimenti al passo di
normalizzazione/pubblicazione. Inserimenti SQL a lotti e puntatore pubblicato
vengono committati nella stessa transazione, con advisory lock per commodity.

Gli originali hanno un percorso basato su SHA256, non un URL pubblico.
`getCatalogStatus` espone versione pubblicata, manifest, copertura, date fonte,
ultima acquisizione ed eventuale errore. La data del download non sostituisce
la data di pubblicazione: oltre 48 ore la fonte non è pronta.

Lo stesso codice offerta e P.IVA identifica la stessa offerta. La policy segue
TO2.0051 della specifica AU v5.0: aggiornamenti amministrativi ammessi durante
l'attività, modifiche complete prima dell'attivazione e riapertura tramite date.
Una variazione economica inattesa su identità già attiva interrompe la
pubblicazione. Lo storico delle membership conserva l'osservazione usata da
ciascuno snapshot; un codice assente temporaneamente non viene dimenticato.
La versione del normalizzatore entra nell'hash dello snapshot, evitando che
una correzione di codice lasci pubblicata una normalizzazione precedente.

## Riferimenti territoriali e fiscali

```sh
python3 scripts/catalog/collect-geography.py
python3 scripts/catalog/collect-gas-references.py --workers 4 \
  --scenario /percorso/scenario-gas-qualificato-corrente.json \
  --out /percorso/checkpoint-comunali
node --env-file=.env.local --import tsx scripts/catalog/index.ts references /percorso/checkpoint-comunali
node --env-file=.env.local --import tsx scripts/catalog/index.ts refresh all
```

Il repertorio Portale viene acquisito in 26 richieste per prefisso, verificando
che la dimensione dichiarata corrisponda alle righe restituite. Il 29 ottobre
2026 contiene **7.972 località**, di cui **7.964 abilitate luce e 7.593 gas**.
Il repertorio ISTAT corrente contiene 7.894 comuni. Le codifiche alternative
ISTAT qualificano i cambi di provincia; il [riepilogo ufficiale delle variazioni](https://www.istat.it/wp-content/uploads/2026/02/Novita-2026-2017-26febbraio2026.pdf)
qualifica le sette fusioni ancora rappresentate dal Portale tramite i singoli
predecessori. Il crosswalk conserva tutti i predecessori, senza sceglierne uno.

L'ingresso usato dal profilo applicativo è `portalMunicipalityCode`. Il risultato
riporta la località Portale, il territorio tariffario e l'eventuale comune ISTAT
corrente: le due identità rimangono distinte. L'ingresso alternativo tramite
codice ISTAT corrente richiede la località originaria quando il comune è fuso.

La raccolta gas riusa una sessione sintetica per worker e compie una richiesta
al dettaglio per località. Modifica soltanto il codice comunale nel profilo
pubblico a 4.000 Smc, verifica che il Portale restituisca lo stesso profilo e
conserva aliquote, costo vendita e frammento costi sanitizzato. Non conserva
cookie, token CSRF, HTML completo o dati di persone. I checkpoint permettono
la ripresa; HTTP Retry-After e backoff esponenziale regolano i tentativi.

Il profilo operativo C1 viene qualificato tramite una corrispondenza univoca tra
vendita osservata e i cinque profili AU, usando coefficienti PSV **correnti già
qualificati** da un'acquisizione separata. I coefficienti storici del giorno
precedente non vengono assunti equivalenti. La zona climatica normativa resta
un campo distinto: non sostituisce un profilo operativo non verificato.

`ReferenceBundle.coverage` dichiara le località qualificate e quelle mancanti.
Un insieme parziale non rende pronto il gas nazionale; resta possibile leggere
un confronto per una località singolarmente qualificata. I dati regolati
supplementari pubblicati dal Portale/ARERA conservano unità, trimestre, fonte,
data e hash in `regulatedRates`; l'assenza di un dato non significa prezzo zero.

## Verifiche

```sh
pnpm test tests/catalog tests/references
```

I test usano il PostgreSQL Docker isolato indicato da `TEST_DATABASE_URL`, con
migrazioni Drizzle reali. Solo i confini HTTP/Blob sono sostituiti con fixture
pubbliche e uno store di originali per il test; il database non è emulato.
Le prove coprono pubblicazione/lettura, file corrotti, correzioni sullo stesso
URL, idempotenza, snapshot riproducibile, freschezza, concorrenza, ordine delle
fonti, indipendenza delle commodity e anomalie delle identità riapparse.

Il primo caricamento reale in Neon e Blob privato del 29 ottobre 2026 ha
impiegato circa **150 secondi** per commodity; entrambi i caricamenti sono
stati pubblicati. La soglia delle Functions è 300 secondi e va monitorata su
Vercel. Il test locale del trigger Cron ha restituito 202 e avviato due run
Workflow: entrambi sono stati successivamente verificati `completed/published`
tramite Workflow CLI, in circa 227 e 195 secondi complessivi, incluso avvio
a freddo. La prova è in `evidence/workflow-local-20261029.json`; il Cron su un
deployment Vercel non è stato certificato da questa prova locale.

## Stato qualificato del primo caricamento

La raccolta nazionale del 29 ottobre è conclusa: **7.593/7.593 località gas**,
nessun comune mancante, nessun errore di qualificazione, 19 combinazioni fiscali
osservate. Tutte le 7.894 identità ISTAT correnti hanno un crosswalk documentato;
le 7.964 località abilitate luce hanno territorio qualificato. I 152,9 MB dei
frammenti costi sono conservati in 76 archivi Blob privati con hash verificato.
Il manifest permette il riuso senza riscaricare gli originali ad ogni modifica
tecnica. I riepiloghi riproducibili sono in `evidence/national-gas-20261029.json`
e `evidence/publication-20261030.json`.

L'anagrafica usa ragioni sociali ARERA unite per P.IVA stringa esatta, preservando
gli zeri iniziali. Due P.IVA del catalogo non compaiono neppure nell'export generale
ARERA: `03882060712` e `04910210287`. Restano identificabili tramite P.IVA; i nomi
non sono dedotti dai domini commerciali e le offerte non sono eliminate.

Le offerte gas fisse con sola componente energetica opzionale richiedono una
qualificazione supplementare del dato omesso nell'XML. Il Workflow acquisisce
2 calibrazioni e 1 holdout da profilo differente, dal solo Portale, con
concorrenza 2 e checkpoint per fingerprint. **Il riuso vale soltanto per la
stessa data e SHA256 dell'XML quotidiano**: un nuovo file richiede nuove prove,
anche quando le componenti esportate sembrano uguali. Un errore preserva il
catalogo precedente, senza pubblicare una classifica parziale. Le 11 offerte
attuali sono state acquisite automaticamente e le 33 prove archiviate.

`readOfferVersionContext` recupera esclusivamente l'offerta e il supplemento
commerciale del suo snapshot storico, insieme alla versione dei riferimenti.
Non restituisce le tariffe fiscali storiche come tariffe correnti. I riferimenti
fiscali per la stima futura rimangono quelli del confronto attuale.

La cache in memoria contiene solo dati pubblici immutabili per versione:
2 snapshot per commodity e 4 versioni di riferimenti, con deduplicazione delle
letture contemporanee. I dati sono congelati; i chiamanti devono copiare le
strutture prima di modificarle. Il puntatore attuale viene letto ad ogni richiesta,
la validità delle offerte e la freschezza sono ricontrollate ad ogni `at`.
Nessun profilo domestico, risultato o sessione è conservato in questa cache.
