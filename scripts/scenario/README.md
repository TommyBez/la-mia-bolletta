# Coefficienti mensili del Portale

Questi comandi sono destinati all'operatore. Nessun cron e nessuna richiesta di confronto avvia simulazioni sul Portale. Gli indici sono **dedotti dal simulatore ufficiale**, non un file forward pubblicato da AU. Non sono prezzi a termine Peak/Off Peak.

1. Pubblicare il catalogo ufficiale corrente con il comando catalogo. `node --import tsx scripts/scenario/prepare.ts electricity /percorso/piano-luce.json` (oppure `gas`) prepara il piano dal catalogo DB e dai parametri correnti, selezionando sonde semplici di venditori diversi senza codici fissi nel programma. Se non trova due candidati qualificabili segnala la fascia da approfondire; non inventa una sonda. Controllare il piano prima del lancio mensile. In alternativa preparare un piano per il mese corrente usando soltanto offerte presenti in quell'XML e parametri ufficiali correnti. Il piano dichiara `catalogVersionId`, `acquisitionMonth`, `commodity`, `officialSources:[{url,kind:'official_offer'}]`, `quarterlyProbes` e `annualProbes`. I dati di esempio di ottobre non vanno etichettati come un altro mese.
2. Per ogni fascia, la sonda trimestrale dichiara `offerCode`, `offerType`, `band`, `fixedAnnual`, `spread`, `additiveUnit`, `multiplier`, `consumption` e un oggetto `holdout` con condizioni di un'altra offerta semplice. F0 usa misure monorarie; F23 usa F2 su un'offerta F1/F23; le altre usano la fascia corrispondente. Gas usa BASE. Tutti i numeri economici sono stringhe decimali.
3. `annualProbes` comprende **tutte** le offerte `priceBandCode='07'` del catalogo corrente, fisse e variabili: `{offerCode,supplierVat,fingerprint,offerType}`. Il fingerprint viene dal normalizzatore del catalogo, non dal solo codice. Ogni fingerprint riceve quattro calibrazioni (tre fasce pure e un secondo volume per identificare la quota fissa) e holdout misti indipendenti a più volumi, potenze e stati di residenza. L'effetto annuale include tutte le componenti già comprese nella riga vendita; non sommare nuovamente spread, dispacciamento, PCV o PPE.
4. Eseguire manualmente (Python standard library, nessuna dipendenza Python):

   ```sh
   python3 scripts/scenario/acquire_batch.py --plan /percorso/piano.json --out /percorso/acquisizione --workers 3
   ```

   Il batch include anche la qualifica strutturale Peak: limiti dell’XML, assenza di scaglioni/prezzi per kW/periodi/sconti applicabili, nuovi controlli a1000/20000kWh ove ammissibili e a10/20kW nelle due residenze. Il consumo zero è ammesso dall’intercetta solo con questa prova esplicita; il massimo5000kWh delle otto fisse rimane un limite reale dell’offerta. Al massimo tre sessioni anonime indipendenti. Le parti completate sono riprendibili solo nello stesso mese, con identico piano e digest degli originali verificati. Il riuso conserva il timestamp originario e non finge una nuova acquisizione. Le parti incomplete sono ricalcolate. Un'offerta assente/scaduta o un formato cambiato interrompono l'acquisizione; aggiornare il piano usando l'export ufficiale. Il comando non conserva cookie, token, HTML integrale o dati di persone reali.
5. Il candidato `snapshot.json` contiene calibrazioni, predizioni registrate prima degli holdout, controlli, incertezza degli arrotondamenti, dominio applicabile e riferimenti ai file sanificati con SHA256. Non è ancora pubblicato. Mese e trimestre seguono Europe/Rome anche sul server UTC. Il periodo è esattamente i quattro trimestri dal trimestre corrente. Le misure storiche sintetiche sono N−13…N−2 e i raggruppamenti trimestrali sono verificati mediante holdout con mesi diversi.
6. Per il gas completare il candidato con i sei coefficienti CCR annuali domestici prima della pubblicazione:

   ```sh
   node --import tsx scripts/scenario/acquire-gas-annual-regulated.ts --xml /percorso/gas-ufficiale.xml --scenario /percorso/acquisizione/snapshot.json --out /percorso/acquisizione-ccr
   ```

   Il comando acquisisce quattro calibrazioni per ogni profilo C1 B/C/D/E/F e C2, da due venditori a due volumi, poi registra la predizione e verifica un holdout a2400Smc in un secondo comune. L’intervallo del coefficiente deriva soltanto dagli arrotondamenti osservati e dall’incertezza PSV; non sostituisce le quattro tariffe CCR trimestrali applicate a misure esplicite. La qualifica richiede tutti i profili presenti nel catalogo domestico; T1 è fuori dal perimetro attuale. Resta uno script manuale mensile.
7. Collegare al catalogo pubblicato (utile se durante le simulazioni era disponibile soltanto l'hash XML):

   ```sh
   node --import tsx scripts/scenario/operator.ts bind-catalog /percorso/acquisizione/snapshot.json
   node --import tsx scripts/scenario/operator.ts validate /percorso/acquisizione/snapshot.json
   node --import tsx scripts/scenario/operator.ts import /percorso/acquisizione/snapshot.json
   node --import tsx scripts/scenario/operator.ts status electricity
   node --import tsx scripts/scenario/operator.ts status gas
   ```

   L'operatore richiede `DATABASE_URL` e, per importare gli originali, `BLOB_READ_WRITE_TOKEN`, caricati dall'ambiente Next. Non stampare i valori. La validazione controlla il catalogo nel DB, il mese, ogni coefficiente e holdout, tutti i fingerprint Peak, i sei profili CCR quando richiesti dal catalogo e il digest di ogni file. Gli originali vanno nel Blob **privato** prima della pubblicazione atomica PostgreSQL. Un errore non sostituisce il puntatore valido; il replay è idempotente e una pubblicazione vecchia non può superare una più recente.

Web e MCP usano `createScenarioService(db).getScenario({commodity,versionId?,requiredAnnualFingerprints,requiredAnnualRegulatedProfiles})`. Il chiamante passa i fingerprint e i profili CCR richiesti dal catalogo fissato per il confronto (`requiredAnnualRegulatedProfilesForCatalog`). Il dato assente, scaduto o fuori dominio produce `incomplete_data`, mai zero. `calculateAnnualEffectiveSales` controlla il dominio Peak prima del calcolo; `resolveScenarioCoefficient` distingue gli alias ufficiali di periodicità dalla necessità di un metodo diverso (PE/CMEM).

Il ripiego GME resta dichiarato non qualificato per la finestra corrente e tutte le fasce necessarie. Non viene attivato automaticamente né presentato come un collegamento già implementato.

Verifica locale: `pnpm exec vitest run tests/scenario` usa il PostgreSQL isolato indicato da `TEST_DATABASE_URL`, con migrazioni reali del progetto. La presenza di fixture nei test non rende disponibile lo scenario reale: verificarlo con `status` dopo l'importazione.

L’incertezza del modello annuo è conservata attraverso le osservazioni al centesimo e il metodo versionato: l’intercetta ricavata da due volumi ha errore massimo0,015EUR e ogni pendenza0,02/N, con N=3000kWh nel protocollo attuale. Il costo stimato propaga0,015+sommaConsumi×0,02/N; il confronto con una nuova osservazione aggiunge0,005EUR per il suo arrotondamento. Non arrotondare anticipatamente i coefficienti. Le componenti del costo usano precisione50cifre e il totale viene presentato a centesimi.
