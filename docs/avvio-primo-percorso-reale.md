# Avvio e verifica del percorso reale

Implementazione della [specifica #6](https://github.com/TommyBez/la-mia-bolletta/issues/6). Il codice separa catalogo/riferimenti, scenario, bolletta/profilo e confronto; web e MCP chiamano le stesse operazioni. Lo stato di qualifica numerica e del corpus OCR deve essere verificato nelle evidenze: una build riuscita non lo sostituisce.

## Ambiente locale

Node 24 e pnpm nella versione fissata da `packageManager`. Collegare il progetto Vercel e scaricare le variabili senza pubblicarne i valori:

```sh
pnpm install --frozen-lockfile
vercel link
vercel env pull .env.local
pnpm db:migrate
pnpm dev --port 3100
```

Neon e Blob **privato** sono collegati a Development/Preview. L'OCR usa Vercel AI SDK, AI Gateway e OIDC; non richiede una chiave Google. `CRON_SECRET` protegge l'importazione; `MCP_ACCESS_TOKEN` è una credenziale distinta per i quattro tool in sola lettura. Nessuno dei due viene esposto al browser. I valori da configurare sono elencati in `.env.example`.

## Dati

- [Catalogo e riferimenti](../scripts/catalog/README.md): acquisizione, pubblicazione, controllo e riprocessamento degli originali archiviati. Cron giornaliero avvia due Workflow indipendenti. Su Vercel il cron è attivo soltanto nei deployment di produzione: la preview interna si verifica avviando lo stesso endpoint autenticato, senza pretendere un cron di preview.
- [Scenario mensile](../scripts/scenario/README.md): preparazione, acquisizione da lanciare **manualmente**, controlli indipendenti, importazione e lettura dal DB. Non viene eseguita alcuna simulazione del Portale nel confronto utente.
- `GET /api/data-status` espone date, copertura e versioni. `GET /api/municipalities?q=...` cerca identità ufficiali dei comuni. Gli originali non sono pubblici.

Il catalogo usa la data della fonte per il limite di 48 ore. Uno scenario di un mese precedente non viene riutilizzato automaticamente. Risultato, classifica e scheda fissano catalogo, parametri, riferimenti, scenario e metodo; la paginazione reinvia profilo e versioni. Nessuna sessione anonima viene ripristinata dopo il reload.

## Test

Creare un PostgreSQL **locale e dedicato ai test**, senza riutilizzare il database applicativo:

```sh
docker run --name lmb-test-pg -e POSTGRES_PASSWORD=lmb_local_test_only -e POSTGRES_DB=lmb_test -p 127.0.0.1:55432:5432 -d postgres:17-alpine
```

Impostare `TEST_DATABASE_URL=postgresql://postgres:lmb_local_test_only@127.0.0.1:55432/lmb_test` in `.env.test.local`. Ogni file Vitest crea un database temporaneo proprio, applica le migrazioni e lo elimina dopo aver chiuso le connessioni; nessun test interroga Neon. Il setup rifiuta host/porte diversi dall'istanza locale dedicata.

```sh
pnpm test
pnpm typecheck
pnpm lint:real
pnpm test:e2e
node --import tsx scripts/verify/parity.ts http://localhost:3100
```

Playwright usa Chrome e il server locale sulla porta 3100; `E2E_BASE_URL` seleziona un deployment già avviato. Le prove con dati reali verificano le fonti pubblicate, senza sostituirle con esempi in caso di errore. I controlli numerici usano valori attesi indipendenti e documentano gli scarti del simulatore. La prova di parità usa un profilo sintetico pubblico, le stesse versioni e tutti i campi salvo l'istante del calcolo; non stampa credenziali.

Per la preview interna, il browser aggiunge il token OIDC locale soltanto all'origine del deployment. `LMB_LIVE_OCR_SMOKE=1` abilita la prova a costo misurato con PDF sintetico generato dal test. Nelle Function l'AI SDK risolve automaticamente OIDC dal contesto Vercel; non richiedere la sola variabile d'ambiente locale come condizione preventiva.

`scripts/verify/parity.ts URL electricity` e `scripts/verify/parity.ts URL gas` verificano entrambe le forniture. `scripts/verify/workflow.ts URL` avvia i due import nella preview autorizzata; `scripts/verify/workflow.ts URL status` ne legge l'esito applicativo. Per lo stato asincrono usare anche `workflow inspect run ID --backend vercel --env preview` con progetto e team corretti.

Esito della consegna e limiti: [verifica del 30 ottobre](./verifica-primo-percorso-reale-2026-10-30.md).

Il corpus di bollette reali autorizzate è una verifica distinta dai test sintetici di upload/provider: misurare correttezza per campo/formato, costo e latenza prima di dichiarare qualificato l'OCR. Le bollette conservate non devono finire in Git, screenshot pubblici o commenti dei ticket.

## Costi osservati

L'operatore può consultare tentativi, token, durata, costi comunicati dal Gateway e tentativi dal costo ignoto, aggregati per modello:

```sh
node --import tsx scripts/bill/usage.ts 2026-10-01T00:00:00Z 2026-11-01T00:00:00Z
```

L'intervallo include l'inizio ed esclude la fine. Il resoconto non contiene nomi dei file, testo delle bollette o credenziali. Il costo stimato e quello comunicato dal Gateway restano distinti; un errore senza dati di fatturazione è un costo ignoto, non zero. Per Blob, database, funzioni e Workflow usare il consumo effettivamente misurato nei relativi pannelli Vercel/Neon: i token OCR non rappresentano l'intera fattura infrastrutturale. Non sono configurati budget monetari preventivi.
