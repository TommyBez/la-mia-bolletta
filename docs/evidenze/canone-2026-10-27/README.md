# Evidenze sui canoni e sulle rate, 27 ottobre 2026

Risultati nella [sintesi](../../esito-approfondimenti-formule-2026-10-27.md) e nell'[analisi del catalogo](../../approfondimento-canone-catalogo-2026-10-27.md). Fonti esclusivamente ufficiali Portale Offerte/Acquirente Unico; nessun sito o documento dei fornitori consultato.

La [verifica conclusiva della calcolabilità](../../verifica-calcolabilita-canoni-2026-10-27.md) integra il riferimento normativo ufficiale richiamato dal Portale, l'ispezione delle superfici pubbliche, tre simulazioni fiscali e prove numeriche. Distingue dati mancanti da dati presenti ma non ancora sufficienti a qualificare tutti i profili.

## File conservati

- `audit-catalog.py`: analisi locale dei quattro XML ML del 26/27 ottobre e delle due pagine ufficiali senza calcolo. Usa la libreria standard Python, senza richieste di rete. È uno script di ricerca per questo snapshot, non l'importatore dell'app.
- `catalog-audit.json`: hash degli input, scansione globale dei campi speciali, conteggi per ambito e tipo, candidati testuali relativi alle rate, conteggi delle pagine e campi dei casi selezionati. La ricerca delle frasi non è un censimento esaustivo delle rate.
- `selected-portal-descriptions.json`: descrizioni integrali pubblicate dal Portale per otto schede luce e cinque gas, con URL, identificativi della pagina e hash del testo normalizzato. La selezione comprende anche tre rate Casa Mia No Stress e una Partner Light senza prezzi sufficienti: non sono tredici canoni completamente determinati.
- `manifest.json`: URL e SHA-256 delle pagine, dimensioni, hash dello script e degli artefatti derivati. Gli XML e i documenti ufficiali sono anche registrati nel [manifesto dell'audit formule](../formule-2026-10-27/manifest.json).
- `check-method.py`, `method-check.json`: calcoli decimali ripetibili, cinque canoni gas al riferimento, esempio Gas Light Milano 300→350 Smc, esempio luce condizionale e dimostrazione dell'effetto di diverse allocazioni IVA. Le ipotesi sono parte dei risultati; non sono preventivi prodotti dal Portale.
- `public-discovery/inspect-public-pages.py`, `public-discovery/inspection.json`: modali, campi HTML, risorse JavaScript osservate, dieci download Open Data e checksum delle nuove acquisizioni.
- `public-discovery/gas-tax-ui-cases.json`: profilo sintetico Milano, tre consumi 300/350/1.600 Smc, importi e righe fiscali letti dal dettaglio ufficiale dell'offerta ordinaria APIU. Nessun identificativo di sessione conservato.
- `public-discovery/gas-tax-references.json`: CSV parametri ML/PLACET, aliquote IVA, assenza delle righe accisa/addizionale in quei CSV, risposta geografica e checksum.

Le pagine complete contengono **1.058 schede luce e 249 gas**. Sono stati verificati documento HTML completo, corrispondenza con il numero dichiarato e unicità degli ID. Questi identificativi non sono `COD_OFFERTA`; le schede non espongono tutti i campi necessari a selezionare lo stesso sottoinsieme domestico degli XML. Gli hash delle tredici descrizioni coincidono con quelli dell'analisi delle pagine.

Gli input originali restano locali in `/tmp`. Il manifesto registra i nomi e i checksum degli HTML; gli XML usano i nomi `la-mia-bolletta-20261026-E.xml`, `la-mia-bolletta-20261026-G.xml`, `la-mia-bolletta-20261027-E.xml`, `la-mia-bolletta-20261027-G.xml`. Gli URL HTML restituiscono una pagina corrente: un nuovo download può essere diverso. Senza gli stessi byte non si dichiara riprodotto lo snapshot del 27 ottobre. Non seguire i link ai venditori per completare un record.

## Ripetere la verifica locale

Dalla radice del repository, con i sei input presenti e i checksum verificati:

```sh
python3 docs/evidenze/canone-2026-10-27/audit-catalog.py --directory /tmp --out /tmp/canone-catalog-verifica.json
cmp docs/evidenze/canone-2026-10-27/catalog-audit.json /tmp/canone-catalog-verifica.json
```

La ripetizione con gli input conservati ha prodotto lo stesso JSON. Il confronto byte per byte assume anche la stessa directory degli input, perché i percorsi sono inclusi nei metadati. Gli importi estratti dal testo restano campi descrittivi: non sono una formula generalizzata, una classifica o una stima completa per un profilo.

La [verifica separata dell'interfaccia ufficiale](../formule-2026-10-27/portale-ui-cases.json) riguarda una mista gas ordinaria, non le schede senza calcolo.

Per ripetere le nuove prove numeriche dagli input conservati:

```sh
python3 docs/evidenze/canone-2026-10-27/check-method.py > /tmp/canone-method-verifica.json
cmp docs/evidenze/canone-2026-10-27/method-check.json /tmp/canone-method-verifica.json
```

Lo script legge le descrizioni, il CSV parametri luce locale e le prove UI salvate, controlla la coerenza dei casi fiscali e non accede alla rete. Ripetere la matematica non equivale a rieseguire l'interfaccia del Portale; le osservazioni UI rimangono evidenze datate. Il modello generale IVA dei canoni gas oltre i casi qualificati resta esplicitamente aperto.
