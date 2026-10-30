# OCR: elementi per le decisioni sul primo percorso reale

**Stato delle decisioni di prodotto aggiornato al 27 ottobre:** AI SDK e modello vision confermati, Gemini Flash candidato, costi tecnici ammessi e hosting Vercel. Q25 richiede di conservare le bollette della prima versione interna senza cancellazione automatica; supera in questo ambito Q12 e la proposta di zero retention. Le sezioni seguenti conservano la ricerca svolta e distinguono le capacità dei provider: non reintroducono un requisito di cancellazione. Lo stato corrente è in [design-prodotto.md](./design-prodotto.md).

Verifica del 27 ottobre 2026. Ricerca documentale, senza bollette caricate, richieste di inferenza, credenziali o implementazione. La prima ricognizione precedeva la scelta dell’utente di Vercel AI SDK con modello vision e Gemini Flash come candidato; la verifica successiva è riportata in fondo. Ambito richiesto: upload subito, luce/gas e fisse/variabili; web e MCP condividono il confronto, mentre il client MCP estrae autonomamente i dati.

## Vincoli già decisi nel progetto

`docs/design-prodotto.md` Q8 richiede conferma/correzione dei campi essenziali. Q25 supera Q12 per la prima versione interna: conservare gli originali senza cancellazione automatica, senza un requisito di zero retention del provider. Lo studio iniziale proponeva testo da PDF nativi, OCR per scansioni/immagini e provenienza dei campi. La scelta tecnica successiva è Vercel AI SDK con modello vision; modello/versione e canale devono essere qualificati e l’accuratezza sulle bollette non è ancora misurata.

## Tre operazioni da distinguere

1. Acquisire testo e geometria delle pagine.
2. Interpretare quel contenuto nei campi del profilo: consumo annuo e periodo, fasce, unità, località, caratteristiche, contratto attuale quando disponibile.
3. Verificare e far confermare i dati prima del calcolo.

Questa è una distinzione progettuale: una buona trascrizione del testo non dimostra che il consumo annuo sia stato distinto da quello del solo periodo fatturato. Il secondo punto richiede regole o un modello di estrazione; non è automaticamente risolto dall'OCR.

## Fatti tecnici verificati

**PDF nativi.** PDF.js offre `getTextContent` per pagina; i `TextItem` includono testo, matrice di trasformazione, larghezza e altezza. È quindi possibile conservare pagina e posizione del testo come evidenza senza inviare necessariamente il documento a un servizio esterno. Il progetto è un parser/renderizzatore PDF, non un estrattore specializzato di bollette. [API PDF.js](https://mozilla.github.io/pdf.js/api/draft/api.js.html), [progetto Mozilla](https://github.com/mozilla/pdf.js/).

**Scansioni e immagini con elaborazione locale.** Tesseract.js funziona in browser e Node attraverso WebAssembly. Non legge direttamente PDF: occorre renderizzare le pagine in immagini. I formati documentati includono JPG e PNG; i risultati possono includere `blocks`, HOCR e TSV, oltre al testo. Un risultato senza parole è un esito valido, non necessariamente un'eccezione: il nostro flusso deve riconoscerlo e chiedere correzione/nuovo documento. Queste possibilità non provano precisione o velocità sulle bollette italiane. [README](https://github.com/naptha/tesseract.js/blob/master/README.md), [FAQ PDF](https://github.com/naptha/tesseract.js/blob/master/docs/faq.md), [formati](https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md), [output](https://github.com/naptha/tesseract.js/blob/master/docs/api.md).

**Formati fotografici.** Il Tesseract nativo non supporta direttamente HEIC e AVIF. Se includiamo fotografie da telefono, occorre verificare la catena concreta di acquisizione/conversione e non assumere che ogni foto caricata sia JPEG. [Formati Tesseract](https://tesseract-ocr.github.io/tessdoc/InputFormats.html).

**Servizio multimodale esterno, esempio OpenAI.** I PDF possono essere inviati a modelli compatibili; il parsing include testo e immagini delle pagine, aumentando il consumo di token. La documentazione indica limiti di dimensione, ma non stabilisce quale limite sia adatto all'app. È una possibilità tecnica a consumo: il costo per bolletta va misurato sul corpus e sul modello, non dedotto da una cifra generica per documento. [File inputs](https://developers.openai.com/api/docs/guides/file-inputs).

**Struttura e correttezza sono diverse.** Structured Outputs consente di imporre lo schema, ma la documentazione esplicita che il contenuto può ancora essere errato e che input incompatibili possono generare valori inventati. Il contratto deve ammettere dati mancanti e agganciare i campi a evidenze controllabili; il punteggio di sicurezza dichiarato da un modello non sostituisce la verifica. [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

**Conservazione esterna, stesso esempio.** La documentazione API OpenAI dichiara che i dati non vengono usati per training salvo adesione esplicita; i log di controllo degli abusi possono contenere input/output e sono conservati per un massimo ordinario di 30 giorni, con eccezioni descritte. ZDR e MAM richiedono approvazione. `store:false` gestisce lo stato applicativo della risposta e non equivale da solo a ZDR. La cancellazione della copia nell'app non prova la cancellazione di ogni copia presso il fornitore. Non sono state verificate disponibilità o configurazione di queste opzioni per un account del progetto. [Data controls](https://developers.openai.com/api/docs/guides/your-data).

## Decisioni dell'utente, fatti dell'agente

Stato delle decisioni individuate nella ricognizione iniziale, aggiornato secondo `design-prodotto.md`:

- Elaborazione tramite AI SDK e modello vision confermata; Gemini Flash candidato. Il canale concreto resta da qualificare.
- Costi tecnici ammessi e hosting Vercel confermati da Q21; resta da definire un limite operativo sulla base dei costi misurati.
- PDF nativi/scansionati e foto JPG/PNG confermati da Q19. Q31 conferma una bolletta per fornitura, anche composta da più pagine o foto; l'aggregazione di più bollette è rinviata. Restano da qualificare attraverso le prove i limiti di pagine/peso.
- Conservazione senza cancellazione automatica confermata da Q25 per la prima versione interna. Non riaprire Q12 o introdurre requisiti di zero retention.

L'agente deve invece verificare: alternative compatibili con tali vincoli, versioni/runtime, comportamento su documenti reali anonimizzati, provenienza dei campi, costi misurati, tempi/memoria e condizioni effettive dei provider. Non chiedere all'utente di scegliere una libreria o garantire l'accuratezza.

## Criterio per la prova successiva

Confrontare sullo stesso campione anonimizzato PDF nativi, scansioni e foto; includere consumi annuali/mensili, fasce, unità, doppia fornitura, campi assenti e documento illeggibile. Misurare correttezza dei campi necessari, errori non segnalati, capacità di chiedere correzioni, costo e latenza. Conferma dell'utente già obbligatoria; nessuna promessa di lettura universale derivata dalla sola documentazione.


## Verifica successiva: Vercel AI SDK e Gemini vision per le bollette

Verifica documentale del 27 ottobre 2026. Nessuna installazione, credenziale, inferenza o trasmissione di documenti. Nessun modello esatto o canale di accesso selezionato. La scelta confermata dall’utente è Vercel AI SDK con un modello vision; Gemini Flash è la famiglia indicata come buon candidato sulla base della sua esperienza.

### Capacità confermate

La documentazione corrente del provider Google di AI SDK espone accesso diretto tramite `@ai-sdk/google`, input file PDF e generazione strutturata tramite `Output`. AI Gateway è un’alternativa di instradamento, non una conseguenza necessaria della scelta SDK; alcune funzionalità differiscono tra accesso diretto e Gateway. Le opzioni effettive vanno verificate contro la versione installata quando si implementerà. [Provider Google AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/google).

Gemini documenta comprensione delle immagini e dei PDF; questi ultimi possono essere passati inline oppure caricati attraverso Files API. Inline è indicato anche per elaborazioni temporanee senza riuso del documento. Ciò rende plausibile una lettura multimodale diretta delle bollette, ma non ne dimostra accuratezza su consumi, periodi, fasce o codici offerta. [Immagini](https://ai.google.dev/gemini-api/docs/image-understanding), [PDF](https://ai.google.dev/gemini-api/docs/document-processing).

Gli output strutturati permettono di richiedere dati conformi a uno schema. Il test di correttezza dei valori resta distinto dalla validità formale: vanno verificati campi, provenienza e casi mancanti nel corpus di bollette concordato. [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).

### Uso dei dati e area geografica

Le condizioni Gemini distinguono servizi gratuiti e a pagamento. Per i servizi gratuiti descrivono uso dei contenuti per miglioramento dei prodotti e possibile revisione umana, ma prevedono un’eccezione: nell’EEA, Svizzera e Regno Unito si applicano le regole di utilizzo dei dati dei servizi a pagamento anche alla quota gratuita. Per i servizi a pagamento, prompt e risposte non sono usati per migliorare i prodotti; restano conservazioni per sicurezza. Inoltre, rendere un client API disponibile a utenti nell’EEA richiede Paid Services, definiti per Gemini API attraverso un progetto associato a fatturazione attiva. Quindi “gratis implica sempre training” sarebbe inesatto; fatturazione, regione e canale effettivi devono essere qualificati. [Condizioni Gemini API, sezioni Use Restrictions / Unpaid Services / Paid Services](https://ai.google.dev/gemini-api/terms).

Non è stato verificato l’account del progetto. Queste condizioni del Developer API non vanno automaticamente attribuite a Vertex AI o a un instradamento tramite Gateway.

### Quattro conservazioni da distinguere

- **File caricati:** Files API prevede cancellazione esplicita ed eliminazione automatica dopo 48 ore. La sola scadenza non soddisfa una cancellazione alla conferma se avviene prima. [Files API](https://ai.google.dev/gemini-api/docs/files).
- **Log del progetto:** la documentazione indica logging predefinito per Interactions e, dal 26 ottobre 2026, per Generate Content nei nuovi progetti. Esistono impostazioni del progetto e controllo `store` per richiesta; la conservazione predefinita dei log è 55 giorni, configurabile. La compatibilità di questi controlli con il provider SDK scelto va verificata prima dell’uso. [Logs and datasets](https://ai.google.dev/gemini-api/docs/logs-datasets).
- **Monitoraggio abusi:** Google documenta 55 giorni per prompt, contesto e output usati per monitorare abusi. Questo è separato dai log controllati dal progetto e non equivale ad addestramento generale dei modelli. [Abuse monitoring](https://ai.google.dev/gemini-api/docs/usage-policies).
- **Cache e stato:** il documento ZDR distingue stato delle interazioni, file, cache esplicita e cache implicita. Per esigenze di ZDR garantito rimanda a Vertex AI. Un invio inline o `store:false` non costituisce da solo una prova di cancellazione di ogni copia. [Zero data retention](https://ai.google.dev/gemini-api/docs/zdr).

Queste distinzioni documentano il comportamento dei provider, ma Q25 ha superato il requisito di cancellazione di Q12 per la prima versione interna. La qualifica del canale deve descrivere la configurazione effettiva senza introdurre un requisito di zero retention. Per l’estrazione non sono necessari strumenti di ricerca o grounding; evitarli riduce ulteriori categorie di trattamento.

### Implicazioni per l’intervista

- Registrare **AI SDK + vision** come decisione, senza trasformarla in scelta di AI Gateway, versione Gemini, accesso diretto/Vertex o schema tariffario.
- Gemini Flash rimane candidato da misurare su PDF originali, scansioni e foto. La scelta modello può essere rinviata alla prova comparativa all’interno della famiglia, senza riaprire il requisito OCR.
- **Q21 è confermata:** costi tecnici ammessi e hosting Vercel; budget preciso e canale del modello ancora da qualificare. Per il canale Gemini Developer API destinato a utenti italiani la ricerca ha individuato la fatturazione attiva come dipendenza concreta.
- L'uso di un modello vision esterno e la conservazione interna secondo Q25 sono già decisi. La qualifica deve documentare logging, condizioni e costi del canale concreto; non rappresenta un'autorizzazione a spesa illimitata.
- **Q22 è stata successivamente confermata:** sono accettati scarti spiegabili nelle stime rispetto al Portale. Questa scelta rimane indipendente dal modello OCR.

La ricerca verifica capacità documentate e vincoli da qualificare; non certifica una configurazione, un prezzo per bolletta o l'accuratezza dell'estrazione.
