# Fiscalità gas: fonte per comune e matrice osservata

29 ottobre 2026. Fonti utilizzate: esclusivamente calcolatore pubblico del Portale, parametri ufficiali e documentazione ARERA. Nessuna pagina del fornitore consultata; le descrizioni dei componenti presenti nel dettaglio sono dati pubblicati dal Portale. Nessun dato personale reale o account usato.

## Risultato concreto

È stata materializzata una matrice di **32 comuni, rappresentativi di19regioni**, con quattro aliquote di accisa e quattro aliquote dell'addizionale regionale per comune. Il dettaglio del Portale restituisce i dati anche per le eccezioni territoriali e climatiche. Per tutte le32simulazioni a4000Smc, la somma progressiva calcolata dalle aliquote riproduce il subtotale **Imposte** entro mezzo centesimo. Due ulteriori simulazioni con volumi differenti confermano il calcolo senza adattare le aliquote.

Questa è una matrice osservata e verificata, **non l'intero mapping di ogni comune italiano né una certificazione normativa di tutte le aliquote vigenti**. La fonte di acquisizione è qualificata: la procedura per popolare il DB nazionale può interrogare il Portale per codice ISTAT, senza dedurre l'aliquota dal solo capoluogo o dalla regione. L'esecuzione esaustiva e i controlli di copertura sono un'attività esplicita dell'importatore di riferimenti.

## Acquisizione e campione

Sonda ZERO FLEX `000971GSVML01XXPROD1300109202600`, domestico, cambio fornitore, uso riscaldamento+cottura+acqua, contatore classe1, consumo sintetico4000Smc. Normale modulo anonimo del [Portale](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page), validazione dell'offerta, confronto e dettaglio. Nessun endpoint di forniture autenticate.

Il consumo4000 supera tutte le soglie120/480/1560 e rende visibili tutte le aliquote. Il parser legge le etichette **Accisa** e **Add. reg.** nel blocco Corrispettivi unitari delle imposte; non confonde una voce assente con un'aliquota zero. Gli zeri dei comuni esenti sono effettivamente pubblicati come `0,000000`.

Comuni: Torino, Aosta, Milano, Trento, Bolzano, Venezia, Trieste, Genova, Bologna, Firenze, Perugia, Ancona, Roma, Pescara, Campobasso, Napoli, Bari, Potenza, Catanzaro, Palermo, Latina, Frosinone, Rieti, Cittaducale, L'Aquila, Sassello, Ascoli Piceno, Santo Stefano d'Aveto, Anzio, Nettuno, Viterbo, Portoferraio. Le due province autonome sono osservate separatamente. La regione Sardegna non è qualificata dal campione: per Cagliari il Portale non restituisce la sonda e il geoService espone esplicitamente `esclusoOffertaGas=1`. Questo singolo flag non dimostra da solo che ogni comune sardo sia escluso.

## Regimi ed eccezioni osservati

Accisa ordinaria, in €/Smc: **0,044 /0,175 /0,170 /0,186**. Accisa ridotta osservata: **0,038 /0,135 /0,120 /0,150**. Soglie rispettivamente0–120,121–480,481–1560,oltre1560Smc. Sono aliquote acquisite per comune, non assegnazioni regionali inventate.

| Caso | Accisa osservata | Addizionale regionale osservata, quattro scaglioni €/Smc |
| --- | --- | --- |
| Roma | ordinaria | 0,022 /0,030990 /0,030990 /0,030990 |
| Latina, Frosinone, Rieti, Cittaducale | ridotta | 0,019 /0,030990 /0,030990 /0,030990 |
| Pescara | ridotta | 0,019 /0,023241 /0,025823 /0,025823 |
| L'Aquila | ridotta | 0,010330 in tutti gli scaglioni |
| Genova | ordinaria | 0,022 /0,025800 /0,025800 /0,025800 |
| Sassello | ordinaria | 0,015500 in tutti gli scaglioni |
| Santo Stefano d'Aveto | ordinaria | 0,010300 in tutti gli scaglioni |
| Catanzaro | ridotta | 0,005165 in tutti gli scaglioni |
| Aosta, Milano, Trento, Bolzano, Trieste, Palermo | come nel file per comune | addizionale esplicita zero |

Le aliquote e i risultati di tutti gli altri comuni sono nel [dataset normalizzato](./evidenze/fiscalita-gas-2026-10-29/tax-matrix-observed.json). Anche Anzio, Nettuno e Portoferraio sono stati acquisiti proprio per evitare di assegnare una classe fiscale per analogia con una descrizione territoriale generica. Nelle risposte ottenute risultano accisa ordinaria; ciò è un'osservazione del calcolatore, non una ricostruzione normativa dei confini dell'ex Cassa del Mezzogiorno.

## IVA ed efficacia

Il [CSV ufficiale ML gas del29ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_G_20261029.csv), acquisito e conservato, espone `iva_f1=0,10`, `iva_f2=0,10`, `iva_f3=0,22`, `iva_f4=0,22`, `iva_ui=0,22`. La [guida ARERA corrente](https://www.arera.it/bolletta/guida-alla-lettura-delle-voci-di-spesa-gas) distingue IVA10% per primi480mc annui e22% per consumi ulteriori e quote fisse. Il semplice fatto che l'HTML esponga una riga “IVA5%” a importo zero non introduce un'aliquota applicabile.

Il prospetto [ARERA Imposte sul gas](https://www.arera.it/dati-e-statistiche/dettaglio/imposte-sul-gas) è etichettato Relazione annuale2023. Il suo [XLSX](https://www.arera.it/fileadmin/allegati/dati/gas/impostegas.xlsx), effettivamente scaricato e letto, riporta **“a gennaio2022”** e IVA5% temporanea2021/22: non può diventare la baseline2026. Conferma storicamente l'esistenza di eccezioni Liguria E/F e Abruzzo E/F, ma alcuni valori divergono dalla fonte corrente osservata (per esempio Catanzaro). Non si è corretto il Portale con una vecchia tabella, né si è dichiarata dimostrata una modifica normativa sulla base della differenza.

Il dettaglio del Portale non fornisce `validFrom/validTo` legislativi per ogni aliquota: il dataset registra **osservazione29ottobre2026**, input, codice comune e fonte. Non inventa una decorrenza normativa e non garantisce che l'aliquota rimanga invariata nei trimestri futuri. Per la stima si conserva la versione dei parametri applicata dal calcolatore alla consultazione, distinta dalla tariffazione di bollette storiche o da una consulenza fiscale.

## Verifiche numeriche separate

Le32osservazioni a4000Smc permettono la verifica di tutte le soglie. Il calcolo offline usa porzioni120,360,1080,2440Smc; somma separatamente accisa e addizionale. Nessun fit della spesa imponibile o dell'IVA.

Holdout con aliquote già acquisite a4000:

| Comune e volume | Imposte previste non arrotondate | Portale |
| --- | ---: | ---: |
| Genova500Smc | 84,124 € | 84,12 € |
| L'Aquila1600Smc | 205,288 € | 205,29 € |

La verifica riguarda il subtotale delle imposte sul volume, non una prova automatica di tutte le basi imponibili IVA. Q36 continua a imporre IVA normativa, senza replicare l'anomalia di Senza Pensieri.

## Implementazione nazionale: lavoro specificabile, copertura da verificare

1. Partire dall'elenco ufficiale dei comuni e codici ISTAT coerente con il Portale; considerare esplicitamente i flag di esclusione gas.
2. Acquisire per ciascun comune gas ammesso il blocco fiscale dalla simulazione ufficiale, con consumi che espongano tutti gli scaglioni. Usare sonde nazionali validate e sostituibili; mantenere limiti di concorrenza, cache e manifesti.
3. Conservare il mapping **codice ISTAT→versione del regime fiscale**. Deduplicare tuple identiche dopo acquisizione, non inferirle prima dal capoluogo. Questo evita il problema di ricostruire confini storici o climatici per assegnare imposte che il Portale restituisce già per comune.
4. Verificare il numero atteso dei comuni, mancanze, risposte di esclusione, tuple e progressività. Nessuna pubblicazione nazionale completa finché restano comuni senza riferimento qualificato. Le eccezioni e divergenze normative devono rimanere visibili, non coperte da default.
5. Versionare separatamente la data fonte osservabile e il momento di acquisizione. Pubblicare atomicamente la matrice qualificata e i parametri IVA compatibili; una ricopiatura non rinnova l'efficacia.

Questa procedura dimostrata sui32casi chiude la domanda “dove recuperare le aliquote anche nelle eccezioni?” senza richiedere nuovi dati all'utente o siti dei fornitori. Non dichiara già eseguito l'import esaustivo né una riconciliazione legislativa nazionale indipendente. L'eventuale divergenza tra calcolatore e normativa attuale va qualificata con fonti ufficiali prima di correggere valori nel motore, come già scelto per l'IVA.

## Evidenze e riproduzione

[Probes e codici](./evidenze/fiscalita-gas-2026-10-29/probes.json), [esiti di acquisizione](./evidenze/fiscalita-gas-2026-10-29/acquisition-results.json), [matrice](./evidenze/fiscalita-gas-2026-10-29/tax-matrix-observed.json), [holdout](./evidenze/fiscalita-gas-2026-10-29/holdout-results.json), [script acquisizione](./evidenze/fiscalita-gas-2026-10-29/probe-tax.py), [verifica offline Decimal](./evidenze/fiscalita-gas-2026-10-29/normalize-and-verify.py), [manifest SHA256](./evidenze/fiscalita-gas-2026-10-29/manifest.json). I frammenti HTML contengono solo dettagli economici, senza cookie o token di richiesta.
