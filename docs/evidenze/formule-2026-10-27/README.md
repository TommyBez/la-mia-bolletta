# Evidenze dell'audit formule del 27 ottobre 2026

Risultati e limiti nel [rapporto principale](../../audit-formule-offerte-2026-10-27.md). Questi script Python usano solo la libreria standard e servono alla ricerca: non sono l'importer né il motore di calcolo dell'applicazione.

Fonti ammesse per le offerte: open data del Portale e tracciati/metodi ufficiali, secondo Q28. Gli URL dei venditori eventualmente presenti negli estratti JSON sono campi originali dell'export: gli script non li consultano e non vanno usati per integrare i dati. Il manifesto esclude i documenti dei fornitori esaminati prima del chiarimento dell'utente.

## File conservati

- `manifest.json`: URL ufficiali, date, dimensioni e SHA-256 dei cataloghi e dei documenti; hash degli script.
- `classification.csv`: una riga per codice domestico, 3.598 righe dati, filtri e famiglie sovrapposte. Il CSV riduce i flag ai gruppi principali; il JSON completo rigenerabile contiene anche i dettagli.
- `summary.json`: conteggi per filtro, P.IVA, caratteristiche e combinazioni osservate.
- `audit-luce.md`, `audit-gas.md`: analisi dei singoli ambiti.
- `electricity-examples.json`, `gas-examples.json`: campi dei record e calcoli decimali dei casi economici, con ipotesi e limiti.
- `audit-electricity.py`, `audit_gas.py`: audit descrittivi dei due tracciati.
- `audit-electricity-examples.py`, `gas-economic-cases.py`: esempi mirati, con controlli sulle strutture attese. Non sono algoritmi generali per tutte le offerte. Il secondo importa `audit_gas.py` dalla stessa cartella.
- `summarize-audits.py`: produce il riepilogo compatto e il CSV dai due JSON completi.
- `portale-ui-cases.json`: verifica manuale della mista SenzaPensieri su un profilo sintetico nel comparatore ufficiale; valori osservati, dati del profilo e limiti. Non è un risultato atteso già riconciliato del futuro motore.

L'approfondimento successivo dei canoni e delle pagine separate senza calcolo è conservato nella [cartella dedicata](../canone-2026-10-27/README.md). Integra la copertura delle fonti senza cambiare i conteggi XML di questo audit.

Gli XML originali, circa 36 MB complessivi per il 27 ottobre, restano locali. Per recuperarne esattamente le versioni analizzate usare gli URL del manifesto e verificarne i checksum. Se la fonte restituisce byte diversi o rimuove i file, non dichiarare riprodotto questo snapshot.

## Ripetere l'analisi

Comandi dalla radice del repository. Gli input locali utilizzati sono `/tmp/la-mia-bolletta-20261027-E.xml` e `/tmp/la-mia-bolletta-20261027-G.xml`; possono essere ottenuti così:

```sh
python3 - <<'PY'
import hashlib, json, pathlib, urllib.request
manifest = json.loads(pathlib.Path('docs/evidenze/formule-2026-10-27/manifest.json').read_text())
for source in manifest['catalog_files']:
    if source['publication_date'] != '2026-10-27':
        continue
    request = urllib.request.Request(source['url'], headers={'User-Agent': 'la-mia-bolletta-research/1.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != source['sha256']:
        raise ValueError('La versione restituita dalla fonte è diversa: ' + source['url'])
    path = pathlib.Path('/tmp/la-mia-bolletta-20261027-' + source['supply'] + '.xml')
    path.write_bytes(data)
    print(path)
PY
mkdir -p /tmp/la-mia-bolletta-formule-verifica
python3 docs/evidenze/formule-2026-10-27/audit-electricity.py /tmp/la-mia-bolletta-20261027-E.xml --date 2026-10-27 --out /tmp/la-mia-bolletta-formule-verifica/electricity.json
python3 docs/evidenze/formule-2026-10-27/audit_gas.py /tmp/la-mia-bolletta-20261027-G.xml --date 2026-10-27 --output /tmp/la-mia-bolletta-formule-verifica/gas.json
python3 docs/evidenze/formule-2026-10-27/summarize-audits.py /tmp/la-mia-bolletta-formule-verifica/electricity.json /tmp/la-mia-bolletta-formule-verifica/gas.json --out-dir /tmp/la-mia-bolletta-formule-verifica
python3 docs/evidenze/formule-2026-10-27/audit-electricity-examples.py /tmp/la-mia-bolletta-20261027-E.xml --out /tmp/la-mia-bolletta-formule-verifica/electricity-examples.json
PYTHONDONTWRITEBYTECODE=1 python3 docs/evidenze/formule-2026-10-27/gas-economic-cases.py /tmp/la-mia-bolletta-20261027-G.xml --output /tmp/la-mia-bolletta-formule-verifica/gas-examples.json
```

Gli script dei conteggi accettano file/date differenti per ripetere l'audit, ma sono stati qualificati sullo schema osservato: non sostituiscono la validazione di un tracciato futuro. Gli script degli esempi usano i codici di questo snapshot e devono interrompersi se quei record cambiano o scompaiono. Nessuna ricerca automatica di un'offerta sostitutiva.

Per la tabella primo anno si contano gli sconti con `VALIDITA=01/02` e condizione `00`. Il tracciato ammette anche validità dettagliate: nello snapshot verificato non ci sono sconti con il solo `PeriodoValidita` e senza `VALIDITA`. Il futuro motore dovrà interpretare anche questa possibilità, senza trattare questo predicato di audit come regola universale.

Il confronto tra 26 e 27 ottobre serve solo a registrare variazioni di codici. Non prova stabilità delle frequenze durante l'anno. Il controllo di schema e delle dichiarazioni non dimostra la coerenza di tutte le condizioni testuali.
