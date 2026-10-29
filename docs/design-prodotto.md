# Design del prodotto

Intervista di design avviata il 26 ottobre 2026. Questo documento raccoglie le scelte confermate e le decisioni ancora aperte. Per ambito del progetto, fonti e vincoli tecnici si veda lo [studio di fattibilità](./studio-fattibilita.md).

## Decisioni confermate

| ID | Decisione | Conseguenza per l'esperienza |
| --- | --- | --- |
| Q1 | Il risultato principale è un consiglio motivato; la classifica completa rimane accessibile. | Presentare una scelta principale e poche alternative spiegate. Il consiglio può essere di mantenere l'offerta attuale quando il confronto lo giustifica. |
| Q2 | “Carica la bolletta” è l'ingresso principale, affiancato dall'inserimento manuale dei dati. | Il documento facilita la personalizzazione; chi non lo ha a disposizione può comunque usare il servizio. |
| Q3 | Il primo confronto può essere completato senza creare un account. | L'utente può arrivare al risultato prima di decidere se salvare il proprio profilo. Le modalità di salvataggio restano da definire. |
| Q4 | La raccomandazione parte dal costo annuo stimato più basso e rispetta la preferenza dell'utente per il prezzo fisso. | Distinguere il vantaggio economico nello scenario stimato dalla stabilità del prezzo dell'energia. I criteri di ammissibilità precedono il confronto economico. |
| Q5 | Se i consumi sono disponibili ma il contratto attuale non è ricostruibile, mostrare comunque le alternative e il loro costo stimato. | Non esporre un risparmio numerico rispetto all'attuale; indicare quali dati mancano per completare quel confronto. |
| Q6 | Ogni fornitura può essere confrontata autonomamente; l'altra può essere aggiunta in seguito. | Una sola bolletta luce o gas basta per iniziare il relativo percorso. Quando entrambe le forniture sono presenti, mostrare anche il riepilogo della spesa complessiva. |
| Q7 | Se il vantaggio cambia al variare dello scenario di prezzo, presentare la raccomandazione come condizionata e affiancare il contratto attuale all'alternativa quando confrontabile. | Esplicitare da cosa dipende il vantaggio. Per risparmi piccoli mostrare l'importo e lasciare all'utente la valutazione, senza una soglia universale che decida automaticamente se cambiare. |
| Q8 | Dopo la lettura della bolletta, richiedere la conferma dei dati essenziali in una schermata compatta e modificabile. | Evidenziare i dati dubbi e rendere visibili consumi, comune e caratteristiche della fornitura prima dei risultati. |
| Q9 | Aprire una scheda sintetica dell'offerta prima del passaggio al sito del fornitore. | Riunire costo, durata, requisiti dichiarati e codice offerta. Nel primo rilascio la sottoscrizione avviene sul sito del fornitore. |
| Q10 | Progettare prima per il telefono, con adattamento al desktop. | Passaggi brevi, azioni accessibili e nessuna dipendenza dallo scorrimento orizzontale. |
| Q11 | Dare priorità al costo annuo stimato e al risparmio annuo stimato. | L'equivalente mensile è secondario e indicato come media, non come importo previsto della rata. |
| Q12 | Decisione iniziale: eliminare l'originale dopo estrazione e conferma. Superata da Q25 per la prima versione interna. | Nella prima versione interna si conservano i documenti senza cancellazione automatica. Questo non introduce una nuova funzione utente di cronologia o salvataggio profili. |
| Q13 | Adottare la variante A — Il consiglio — del prototipo dei risultati. | Raccomandazione dominante, costo annuo e risparmio in evidenza, spiegazione del confronto e alternative successive. La resa si adatta al telefono mantenendo questa gerarchia. |

Le decisioni Q1–Q12 sono state confermate dall'utente in quattro giri successivi; Q12 è stata poi modificata da Q25 per la prima versione interna. Dopo aver esaminato il prototipo, l'utente ha confermato Q13 con «va bene A». Le ulteriori proposte UX presenti nello studio di fattibilità non costituiscono ancora decisioni approvate.

## Percorso concordato

Ingresso con bolletta o dati manuali → conferma dei dati letti dalla bolletta → raccomandazione e classifica consultabile → scheda dell'offerta → sito del fornitore.

Luce e gas possono essere completati in momenti diversi. Se il contratto attuale non è ricostruibile, il percorso prosegue con i costi stimati delle alternative e senza quantificare un risparmio rispetto all'attuale.

## Prototipo visuale

Il primo prototipo confronta tre strutture della schermata risultati, usando gli stessi dati sintetici: consiglio in primo piano, confronto affiancato, elenco con dettaglio. Include revisione del profilo e scheda dell'offerta. **La variante A è stata scelta il 26 ottobre 2026.** Le tre varianti rimangono nel branch `codex/prototype-confronto` come riferimento della scelta.

La scelta approva la direzione visuale e la gerarchia della schermata risultati. Nomi delle offerte, importi, formula illustrativa e campi ridotti del profilo restano esempi del prototipo. La [specifica della prima tranche](./spec-risultati-a.md) descrive la riscrittura dell'interfaccia e i due confini di verifica successivamente confermati dall'utente.

Non è ancora una specifica finale o un comparatore funzionante: OCR, acquisizione dei dati e calcolo delle tariffe non sono implementati. Il prototipo non carica né conserva bollette; per la prima versione interna la conservazione è ora definita da Q25.

## Primo percorso completo con dati reali

Intervista `grill-with-docs` avviata il 27 ottobre 2026 su richiesta dell'utente. L'obiettivo è definire il primo percorso completo e verificabile, poi ricavarne una specifica e tutti i ticket necessari a quel perimetro, con dipendenze esplicite per sviluppare in parallelo le attività indipendenti. Le decisioni Q1–Q13 restano confermate salvo la modifica di Q12 tramite Q25; luce e gas domestici, dati gratuiti e applicazione inizialmente gratuita rimangono vincoli del progetto.

La [proposta di ingestion](./design-ingestion.md) e lo [studio delle fonti](./studio-fattibilita.md) sono materiali per questa intervista, non sostituiscono decisioni approvate. La specifica UI già pubblicata rimane distinta: il codice locale della prima attività usa risposte sintetiche e non certifica il calcolo reale.

### Giro 1 — decisioni confermate

Risposte dell'utente del 27 ottobre 2026: Q14 «Caricamento bolletta subito»; Q17 «No, subito supporto sia fisse che variabili»; Q15 e Q16 confermate. L'ingresso manuale rimane l'alternativa già approvata in Q2; non sostituisce il caricamento nel primo traguardo.

| ID | Decisione | Conseguenza |
| --- | --- | --- |
| Q14 | Caricamento della bolletta ed estrazione già nel primo percorso reale. | Comprendere upload, estrazione, conferma/correzione e conservazione secondo Q25; non rinviare OCR a una consegna successiva. |
| Q15 | Web e MCP disponibili sullo stesso confronto. | Stesso motore e risultati equivalenti a parità di profilo/versioni; il client MCP fornisce i dati già estratti. |
| Q16 | Prima versione destinata alla verifica interna, su dati reali e casi riproducibili. | La consegna precede il rilascio pubblico, ma deve completare davvero il percorso concordato. |
| Q17 | Supporto sia delle offerte fisse sia delle variabili per luce e gas nel primo traguardo. | Qualificare le fonti gratuite e il metodo dei prezzi previsionali come dipendenza necessaria della consegna; un percorso solo fisso non soddisfa il traguardo. |

Le risposte determinano i giri successivi: profili e operazioni supportati, copertura delle offerte, metodo di confronto, gestione dei dati mancanti o in ritardo e modalità operative. La verifica delle fonti, delle regole e dei riferimenti tariffari è lavoro di ricerca dell'agente, non una decisione da demandare all'utente. Anche il calcolo delle offerte fisse richiede dati territoriali, rete, oneri, imposte e condizioni qualificati: nessuna copertura completa è già dimostrata.

### Giro 2 — decisioni confermate

La [ricerca sull'estrazione](./ricerca-estrazione-bolletta-2026-10-27.md) distingue lettura del testo, interpretazione dei campi e conferma. L'utente ha scelto Vercel AI SDK con un modello vision e indicato la famiglia Gemini Flash come candidato iniziale sulla base della propria esperienza. Versione del modello, canale di accesso, condizioni e costi rimangono da qualificare; la scelta dell'SDK non seleziona automaticamente AI Gateway. Nessuna bolletta è stata trasmessa. La ricerca sui prezzi è già raccolta nello studio e negli approfondimenti GME/MiFIR; la scelta della fonte richiede ancora qualificazione tecnica.

L'utente ha confermato Q18, Q19 e Q22 il 27 ottobre. Per Q20 ha indicato la scelta tecnica; successivamente ha confermato Q21 e scelto Vercel per l'hosting.

| ID | Stato | Decisione o punto residuo |
| --- | --- | --- |
| Q18 | Confermata | Cambio fornitore per utenze domestiche già attive, senza cambio intestatario; voltura, subentro e nuova attivazione fuori da questo primo percorso. |
| Q19 | Confermata | PDF nativi, PDF scansionati e foto JPG/PNG; limiti di pagine/peso e gestione di altri formati da definire con le prove. |
| Q20 | Scelta tecnica confermata; modello da qualificare | Vercel AI SDK con un modello vision; Gemini Flash candidato iniziale, non modello/versione già validati sulle nostre bollette. La scelta del canale deve rispettare la politica della prima versione interna definita in Q25, che non richiede cancellazione automatica o zero retention. |
| Q21 | Confermata | Costi tecnici per OCR e infrastruttura ammessi; hosting su Vercel. Dati energetici e app restano gratuiti. Budget preciso, database e storage non sono ancora scelti; non è stata autorizzata una spesa illimitata o effettuata alcuna attivazione. |
| Q22 | Confermata | Regole tariffarie verificate e prezzi previsionali gratuiti qualificati; ammettere differenze spiegabili e riproducibili rispetto al Portale, senza richiedere identità degli importi. |

Q22 rende ora discutibili il periodo annuale e la politica sui prezzi mancanti. Modello/versione e condizioni operative dell'estrattore devono essere qualificati rispetto a Q19–Q21. Campioni di verifica e tolleranze saranno ricavati dall'audit delle regole e portati nella specifica, senza inventare una soglia economica prima di conoscere le regole di arrotondamento.

### Giro 3 — decisioni confermate

L'utente ha confermato Q23 e Q24 e sostituito la proposta Q25 con «Per la prima versione non voglio preoccuparmi della conservazione dei dati, li teniamo e basta». La documentazione conferma il supporto AI SDK per il provider Google e input documentali, senza imporre AI Gateway. Le distinzioni tecniche sulla conservazione nella [qualifica Gemini](./ricerca-estrazione-bolletta-2026-10-27.md#verifica-successiva-vercel-ai-sdk-e-gemini-vision-per-le-bollette) restano documentazione della fonte; non costituiscono un requisito di cancellazione per questa versione.

| ID | Decisione | Conseguenza |
| --- | --- | --- |
| Q23 | Decisione iniziale: dodici mesi dal mese successivo; **sostituita da Q44 il 29 ottobre 2026**. | Ora si adotta la stessa finestra del Portale: quattro trimestri solari dal trimestre corrente, con date esplicite e nessuna promessa sulla data di attivazione. |
| Q24 | Confronto incompleto quando mancano prezzi previsionali utilizzabili. | Sospendere la raccomandazione complessiva interessata; conservare profilo, motivazione e informazioni consultabili. Non sostituire silenziosamente i prezzi né presentare un confronto solo fisso come completo. |
| Q25 | Conservare i documenti nella prima versione interna, senza cancellazione automatica. | Non implementare eliminazione dopo conferma, scadenza delle sessioni abbandonate o requisito di zero retention del provider per questa consegna. Q25 sostituisce Q12 in questo ambito; non approva una politica definitiva per il futuro rilascio pubblico. |

Il periodo scelto guida la verifica della copertura dei prezzi. La conservazione serve al percorso e alla verifica interna: non introduce automaticamente account, cronologia personale o altre funzioni di archivio nell'interfaccia. Le copie della nostra applicazione restano separate dal catalogo pubblico.

### Giro 4 — universo e criterio di copertura confermati

L'utente ha confermato Q26 con la correzione «senza placet». Dopo gli esempi di Q27, ha scelto di decidere la copertura analizzando frequenza e convenienza delle formule: «Se una formula si presenta spesso oppure risulta molto conveniente non possiamo escluderla dalla prima versione». Il criterio è confermato; l'elenco concreto delle formule necessarie va ricavato dall'audit.

| ID | Decisione da prendere | Proposta da discutere |
| --- | --- | --- |
| Q26 | Confermata: universo del confronto | Offerte domestiche del mercato libero su territorio nazionale, valutando luce e gas separatamente. PLACET e pacchetti congiunti dual fuel esclusi dal primo traguardo; conservare e verificare comunque i requisiti di adesione delle offerte individuali. |
| Q27 | Confermato: copertura guidata dai dati | Misurare frequenza e rilevanza economica delle formule nell'universo Q26, limitato alle offerte dichiarate simulabili da Q29. Una formula frequente **oppure** molto conveniente deve essere inclusa nella prima versione, anche se complessa. Nessuna esclusione preventiva basata sulla difficoltà; definire il perimetro concreto dopo l'audit e prima dei ticket. |
| Q28 | Confermato: fonti delle offerte e regole di calcolo | Fare riferimento esclusivamente agli open data del Portale Offerte e ai relativi tracciati e metodi ufficiali. Non consultare siti o documenti ospitati dai fornitori per ricerca, acquisizione, integrazione, correzione o verifica delle condizioni economiche. |
| Q29 | Confermata: prima fase solo offerte dichiarate simulabili | Limitare catalogo operativo e confronto della prima fase alle offerte dichiarate simulabili dal Portale. Le altre offerte restano una possibile estensione della seconda fase; la ricerca è conservata, ma acquisizione, normalizzazione e calcolo di tali offerte non sono requisiti della prima consegna. |

Q29 è stata confermata dall'utente dopo la verifica dei canoni: «per ora prendiamo in considerazione solo le offerte dichiarate come simulabili, lasciandoci per una seconda fase la possibilità di includere anche le altre». È un confine di prodotto, non una valutazione della convenienza delle offerte escluse. La simulabilità deve provenire dalla classificazione ufficiale, con fonte e versione; non si deduce dal nome commerciale, dalla formula apparentemente semplice o dal successo del nostro calcolo. Rate e canoni dichiarati simulabili restano ammissibili nell'universo Q26. Le offerte dichiarate simulabili ma ancora problematiche per il nostro motore restano casi da qualificare nella prima fase: non diventano non simulabili per definizione. Luce e gas, prezzi fissi e variabili, OCR e MCP restano nel primo traguardo.

Q28 è stata precisata dall'utente durante l'audit: «Noi dobbiamo fare riferimento agli open data del portale offerte e ai loro metodi di calcolo, non consulteremo mai i siti dei fornitori». Note e condizioni già contenute nell'export restano dati del Portale. Gli URL presenti nei record non autorizzano a seguirli come fonti. Un'ambiguità va risolta attraverso i tracciati e i metodi ufficiali; se questi non bastano, si espone il limite del record senza inventare valori o reperire condizioni esterne. Distinguere una formula non supportata dal motore da un record non calcolabile con i dati ufficiali disponibili.

Q27 non riduce il requisito Q17: il primo traguardo deve produrre confronti reali verificati sia fissi sia variabili per luce e gas. Una lacuna nei prezzi necessari ai casi coperti rimane un confronto incompleto secondo Q24, non un modo per dichiarare completato il supporto variabile. L'audit conta codici offerta unici e distingue le condizioni di ammissibilità dalla struttura dei prezzi. Valuta la convenienza su profili e ipotesi espliciti: il prezzo della sola materia energia non dimostra il costo annuo complessivo più basso. Un caso non ancora valutato non equivale a un caso poco conveniente o rinviabile.

Esempi illustrativi per Q27, con importi inventati e senza attestare la presenza o frequenza di offerte specifiche nel catalogo:

| Caso | Esempio commerciale semplificato | Comportamento necessario |
| --- | --- | --- |
| Fasce | 0,15 €/kWh in F1, 0,10 €/kWh in F2/F3 | Usare i consumi di ciascuna fascia. |
| Prezzo promozionale | 0,10 €/kWh per tre mesi, poi 0,16 €/kWh | Applicare i prezzi ai consumi dei periodi pertinenti. |
| Sconto con base e durata | 10% sulla sola componente energia per sei mesi | Non applicarlo all'intera bolletta né all'intero anno. |
| Struttura mista | Prezzo fisso per sei mesi, poi indice e spread | Combinare i due metodi nella stessa stima annuale. |
| Canone onnicomprensivo | 900 €/anno per un consumo di riferimento di 2.700 kWh, con conguaglio di 0,20 €/kWh sulla differenza | Interpretare il conguaglio e le componenti già incluse, evitando doppi conteggi. |

Rete, oneri e imposte rimangono necessari in ogni caso, secondo quanto è già incluso nell'offerta. Gli scaglioni regolati del gas non sono un'eccezione facoltativa. Le [regole v4.2 già esaminate](./studio-fattibilita.md#motore-di-confronto) descrivono fasce, validità temporali, sconti, strutture miste e canoni. La precedente ipotesi di rinviare alcune formule particolari è superata dal criterio Q27: prima vanno misurate frequenza e rilevanza economica. L'analisi semantica delle condizioni nascoste nelle note resta distinta e non prioritaria.

L'[audit del 27 ottobre](./audit-formule-offerte-2026-10-27.md) ha analizzato tutti i record dei due export e selezionato 1.916 offerte luce e 1.571 gas domestiche, singole, aperte al cambio fornitore nel giorno considerato. Sconti presenti nel 29,4% e 32,6%; esempi reali mostrano inversioni del confronto relativo anche per sconti percentuali rari e differenze materiali dovute a scaglioni/periodi. La proposta risultante include fasce, sconti, scaglioni e validità temporali. Sei miste gas restano da qualificare: non sono state escluse per scarsa frequenza. La priorità delle famiglie non equivale a dichiarare tutti i record calcolabili; non è ancora disponibile una classifica completa nazionale. Il criterio Q27 è confermato, il perimetro concreto resta da chiudere sull'evidenza raccolta.

Il [successivo approfondimento dei canoni](./esito-approfondimenti-formule-2026-10-27.md) corregge un limite del primo audit: le offerte a rata costante sono già presenti negli XML e usano le normali tariffe sottostanti; canoni reali sono pubblicati anche nelle pagine ufficiali separate senza calcolo. Queste pagine contengono 1.058 schede luce e 249 gas di tutte le categorie, senza i campi necessari a ricavare il medesimo denominatore domestico. Non si considera più il canone una formula soltanto teorica. La proposta iniziale di acquisire anche quella fonte nella prima fase è superata da Q29: l'analisi è conservata per una possibile seconda fase. Nessun sito di fornitore è una dipendenza.

Nella UX vanno distinti costo annuo stimato, media mensile e rata commerciale: una rata costante può accompagnare anche un prezzo dell'energia variabile e prevedere conguagli. Per i canoni non si aggiungono nuovamente le voci già incluse; un prezzo «a partire da» non determina il costo applicabile a qualunque profilo. Offerta acquisita, formula supportata e record calcolabile per quel profilo sono stati distinti nell'analisi; i relativi casi di verifica dovranno entrare nella specifica prima dei ticket.

La [qualifica conclusiva dei canoni](./verifica-calcolabilita-canoni-2026-10-27.md) distingue cinque schede gas con dati commerciali completi, quattro luce con applicabilità del minimo non determinata e quattro schede con prezzi realmente assenti. Sono provati i cinque punti gas al riferimento e un caso 300→350 Smc; per il caso generale resta da qualificare l'attribuzione delle basi IVA. Questi casi, pubblicati senza simulazione, sono ora fuori dalla prima fase per Q29 anche quando un calcolo puntuale è possibile. I risultati restano utili per valutare l'estensione futura. Le aliquote fiscali recuperate per Milano dall'interfaccia pubblica del Portale rimangono invece utili anche al calcolo delle offerte ordinarie simulabili. Q27 si applica al nuovo perimetro e nessuna formula aggiuntiva è approvata automaticamente.

Dopo la conferma dell'intesa: `to-spec` con accordo sui punti di verifica, `to-tickets` con approvazione di dimensioni e dipendenze, quindi `implement-spec` con TDD, integrazione e review. Il backlog risultante copre il perimetro concordato; gli incrementi successivi non vengono dichiarati eseguibili finché dipendono da decisioni ancora aperte.

### Ripresa dell'intervista — punti necessari alla chiusura

Ricognizione del 27 ottobre 2026 dopo Q29, aggiornata con le risposte dell’utente al giro 5. Q30, Q31, Q33 e Q34 confermate; Q35 corretta escludendo la conservazione della sessione senza account. Su Q32 l’utente richiede il calcolo delle offerte simulabili e chiede evidenze prima di discutere eccezioni: la proposta di classifica parziale e sospensione del consiglio non è approvata. Il perimetro Q14–Q29 non viene riaperto e la qualifica delle offerte ufficialmente non simulabili non blocca questa specifica.

#### Giro 5 — risposte e punto da chiarire

| ID | Stato e ambito | Decisione o punto da chiarire |
| --- | --- | --- |
| Q30 | Confermata: Dati del profilo mancanti o incompleti | Chiedere solo i dati indispensabili mancanti prima del confronto. Ammettere valori convenzionali soltanto quando previsti da un metodo ufficiale qualificato, dichiarati e confermati; non annualizzare arbitrariamente una bolletta bimestrale. Il contratto attuale non ricostruibile segue già Q5: alternative senza risparmio numerico. |
| Q31 | Confermata: Numero e composizione dei documenti | Una bolletta per fornitura, anche composta da più pagine o foto. Se il documento contiene luce e gas, riconoscere due profili indipendenti. Rinviare l'aggregazione di più bollette di periodi diversi. |
| Q32 | Requisito di calcolo; eventuali eccezioni da discutere solo con evidenze | Le offerte dichiarate simulabili nel perimetro devono essere calcolabili dal nostro motore: una lacuna implementativa è lavoro da completare, non una ragione di esclusione. L’utente non approva la proposta di classifica parziale/sospensione del consiglio e chiede evidenze di eventuali limiti dei dati ufficiali. I casi documentati di intervalli coincidenti e scaglioni sovrapposti restano da risolvere: non provano l’impossibilità di implementare il calcolo e non autorizzano esclusioni. |
| Q33 | Confermata: Requisiti di adesione o sconto non ancora confermati | Chiedere conferma dei requisiti che incidono sull'accesso o sul costo, per esempio la disponibilità alla domiciliazione. Se restano sconosciuti, mostrare l'offerta come condizionata, senza trattare il requisito come soddisfatto o il beneficio come certo. Distinguere questo caso dalla semantica economica indeterminata di Q32 e dall'analisi delle condizioni nascoste nelle note, non prioritaria. |
| Q34 | Confermata: Aggiornamento delle fonti in ritardo | Utilizzare l'ultimo catalogo valido con date e avviso, soltanto entro una finestra di utilizzabilità qualificata e con offerte/parametri ancora applicabili; oltre la finestra sospendere i nuovi consigli interessati. Soglie specifiche per fonte da proporre sulla base della continuità osservata, senza confondere fonte invariata e controllo fallito. Q24 continua a governare i prezzi previsionali mancanti. |
| Q35 | Confermata con correzione: nessuna sessione persistente senza account | Non conservare né ripristinare la sessione anonima dopo ricaricamento o chiusura. Lo stato del percorso resta in memoria durante l’utilizzo. Q25 continua a governare la conservazione dei documenti per la verifica interna, senza creare una sessione recuperabile o una cronologia per l’utente. La risposta non introduce account nel primo percorso. |

#### Qualifiche di competenza dell'agente

**Decisione successiva su Q32, 27 ottobre 2026:** dopo il reverse engineering e la ricerca storica, l'utente approva il minimo del campo numerico `PREZZO` fra intervalli applicabili in conflitto, con default usato soltanto per parti non coperte dagli specifici. È una scelta del nostro motore condiviso web/MCP, non una precedenza interna del Portale dimostrata. Il dubbio primo/minimo non blocca più la specifica e non autorizza esclusioni. Ambito, tracciabilità ed esempi sono nella [regola di precedenza](./design-ingestion.md#precedenza-degli-intervalli-decisione-approvata-il-27-ottobre-2026). Q36 conferma successivamente il metodo IVA ufficiale corretto, senza riprodurre l'anomalia osservata.

**Evidenze aggiornate su Q32:** le [simulazioni richieste dall'utente](./simulazioni-due-offerte-2026-10-27.md) confermano che il Portale calcola sia PREZZO NETTO ZERO GAS sia Senza Pensieri S Domestico. Il [reverse engineering successivo](./reverse-engineering-gas-2026-10-27.md) riproduce la vendita dei campioni e la priorità dello specifico sul default. La scelta minimo/primo è ora risolta per il nostro motore dalla decisione esplicita dell'utente; non è una prova della precedenza interna del Portale. Q36–Q38 chiudono anche la scelta sull'IVA, il pareggio numerico con tipo diverso e il metodo mensile gas, senza escludere le offerte.

Il [modello dell'anomalia IVA](./reverse-engineering-iva-2026-10-27.md) è compatibile con una somma ripetuta del cumulato energia nella base al 10% e con un residuo al 22% troncato a zero; ha superato controlli separati dalla calibrazione. Questo qualifica il comportamento osservato, non lo rende fiscalmente corretto né approva la sua riproduzione nel nostro motore. Q22 ammette differenze spiegate rispetto al Portale; Q32 continua a richiedere il calcolo delle offerte simulabili del perimetro.

#### Giro 6 — decisioni confermate dopo il reverse engineering

L'utente ha risposto «Sì a tutte» a Q36, Q37 e Q38. Le tre raccomandazioni diventano decisioni approvate:

| ID | Ambito | Decisione approvata |
| --- | --- | --- |
| Q36 | Trattamento dell'IVA quando il risultato del Portale diverge dal metodo ufficiale pubblicato | Applicare il metodo fiscale ufficiale correttamente; documentare lo scarto e mantenere il caso anomalo come prova di regressione, senza replicare il comportamento difettoso per ottenere lo stesso totale. |
| Q37 | Pareggio del minimo numerico fra intervalli contemporaneamente applicabili con tipo fisso e variabile diverso | Preferire il ramo variabile a parità di `PREZZO`, coerentemente con Senza Pensieri; conservare formula e indice del ramo. È un criterio del nostro motore, non una nuova regola interna del Portale dimostrata né una scelta del ramo economicamente più basso. |
| Q38 | Metodo per gli scaglioni gas quando il modello mensile osservato differisce dalla progressività annuale semplice | Adottare il modello predittivo verificato: selezione dello scaglione mediante consumo cumulato a metà mese, prezzo applicato al consumo dell'intero mese, rispettando la precedenza approvata. Tracciarlo come metodo inferito e versionato, vincolato alle prove di regressione; non presentarlo come formula esplicita della guida ufficiale. |

Sono qualifiche tecniche dell'agente, non domande da trasferire all'utente: fonte gratuita e trasformazione dei prezzi previsionali sull'intero periodo, copertura luce/fasce/gas e diritto di riuso; matrice completa delle formule; campi minimi e provenienza del profilo/contratto attuale; contratti di catalogo, scenario, confronto, estrazione e adattatori; proposta operativa Vercel con database/storage/accesso interno e budget motivato. La versione del modello vision e i limiti iniziali richiedono una proposta verificabile; le misure di accuratezza, costo e latenza su bollette reali diventano criteri di accettazione dello sviluppo, non capacità già certificate.

Prima di pubblicare la specifica finale: chiudere le decisioni, concordare i punti di verifica di `to-spec`, sintetizzare i contratti e i criteri di accettazione senza semantiche ignote nascoste nei ticket. Poi proporre con `to-tickets` poche attività complete e verificabili, con dipendenze reali, riassorbendo i precedenti ticket sintetici nel nuovo perimetro. Nessun nuovo ticket è pubblicato da questo giro.

#### Giro 7 — decisioni confermate su contratti previsionali e verifiche

Preparata la [proposta dei contratti del primo percorso reale](./contratti-primo-percorso-reale.md): profilo e provenienza dei campi, ricostruzione dell'attuale, estrazione/conferma, risultato comune web/MCP, errori e versioni. È una proposta da consolidare, non un'implementazione. Il checkout esaminato contiene ancora lo starter; non prova che gli altri branch del prototipo siano integrati.

L'audit dello snapshot GME corregge un punto della qualifica: novembre/dicembre mensili più i trimestri 2027 coprono temporalmente il periodo novembre 2026–ottobre 2027 per baseload e gas. F1/F2/F3, conversione gas, selezione dei contratti e canale sistematico rimangono dipendenze reali. Lo storico indici del Portale non contiene tre colonne F1/F2/F3, quindi non basta a qualificare da solo una ripartizione per fascia.

L'utente ha confermato entrambe con «Sì a tutto»: Q39 e Q40 sono approvate.

| ID | Ambito | Decisione approvata |
| --- | --- | --- |
| Q39 | Selezione fra prezzi di contratti GME con consegne sovrapposte | Usare il trimestrale quando disponibile per il trimestre e il mensile per i mesi altrimenti scoperti, come novembre/dicembre nel campione. Applicare questa priorità a prescindere da quale prezzo sia minore, conservando fonte, contratto e sessione di ogni mese. La qualifica del canale e delle fasce rimane necessaria. |
| Q40 | Punti di verifica da portare a `to-spec` | Un contratto principale profilo confermato + versioni → confronto comune web/MCP; prove documento → campi per l'estrazione e acquisizione → catalogo pubblicato per l'importatore; pochi percorsi completi browser/MCP per l'integrazione. Verificare il comportamento attraverso queste interfacce, con fixture ufficiali e controlli indipendenti, senza riscrivere la logica negli adapter. |

#### Giro 8 — qualifica tecnica completata e metodo di fascia da decidere

La [conversione gas](./qualifica-conversione-gas-2026-10-27.md) è qualificata come normalizzazione al riferimento comparabile: EUR/MWh × 0,0107, con distinzione fra PCS convenzionale, PCS locale e coefficiente C. Non richiede una nuova scelta dell'utente.

La [ricerca sulle fasce](./qualifica-scenario-fasce-2026-10-27.md) ha individuato pubblicazioni GME mensili ufficiali di prezzi storici F1/F2/F3 con ore. Gli indici coprono i dodici consuntivi completi più recenti; tre PDF sono stati recuperati e letti. Non sono stati identificati forward diretti F1/F2/F3 nei canali esaminati: il metodo seguente è una proposta esplicita, non una qualifica già approvata da Q39.

| ID | Decisione richiesta, non ancora approvata | Raccomandazione |
| --- | --- | --- |
| Q41 | Costruzione delle fasce dello scenario elettrico quando la fonte forward fornisce baseload | Derivare la struttura relativa F1/F2/F3 dal mese corrispondente nei dodici consuntivi GME completi più recenti e normalizzarla, con le ore future delle fasce, al baseload selezionato secondo Q39. Dichiarare l'elaborazione propria e la provenienza; versionare calendario, fonti e metodo. I consumi personali non determinano i prezzi di mercato. Non presentare i valori derivati come forward AU recuperati né la normalizzazione come prova di accuratezza. |

**Riesame di Q41:** l'utente ha chiesto se esista un metodo più pulito, senza approvare la proposta. La normalizzazione del singolo mese storico non è stata dimostrata la scelta migliore e rimane un benchmark. L'[audit delle alternative](./alternative-scenario-fasce-2026-10-27.md) distingue AU diretto, curva vincolata a più quotazioni correnti e ripartizione storica. Prima di chiedere una nuova scelta occorre verificare il numero di indici/fasce realmente richiesto dai record e dal metodo domestico; non confondere fasce dello spread con fasce dell'indice, né Peakload con F1.

**Decisione del 28 ottobre 2026 — Q41 accettata per la prima versione:** dopo il riesame delle alternative e il chiarimento sui prezzi AU utilizzati dal Portale, l'utente decide di procedere per ora con il nostro metodo. Si adotta come metodo iniziale la proposta Q41 sopra: prezzi GME selezionati secondo Q39 e struttura relativa storica mensile F1/F2/F3 normalizzata al baseload. Il riesame precedente rimane nella cronologia, ma la scelta di metodo non è più aperta. È uno scenario elaborato dall'applicazione, non una replica della curva AU; non è stata dimostrata una precisione equivalente. Parsing completo, calendario, controlli e backtest rimangono verifiche da completare, insieme alla qualifica del canale dati. L'audit del Portale ha confermato che F2 e F3 possono incidere distintamente anche su offerte domestiche triorarie: vanno conservate entrambe.

**Esperimento successivo richiesto dall'utente:** la [sonda AU del 28 ottobre](./prova-sonda-au-2026-10-28.md) ricava medie annue implicite F1/F2/F3 da un'offerta semplice e riproduce sette nuove simulazioni entro un centesimo, compresa una seconda offerta dello stesso venditore. È una prova positiva per le medie annue nel campione, non l'acquisizione dei quattro trimestri o del mese aggiuntivo richiesto dalla nostra finestra. Q41 resta il metodo iniziale approvato; la nuova evidenza permette verifiche rispetto al Portale senza dichiarare risolta la copertura temporale.

**Completamento richiesto dopo la prima prova:** il [recupero trimestrale completo](./recupero-indici-au-2026-10-28.md) supera il limite dell'esperimento annuale. Attraverso distribuzioni mensili sintetiche coerenti sono stati isolati20coefficienti luce (F0/F1/F2/F3/F23 per quattro trimestri) e4gas, verificati su nuovi profili temporali e offerte di altri venditori. Lo snapshot e gli script sono persistiti. Questo rende tecnicamente concreta una fonte implicita alternativa allo scenario Q41; non costituisce ancora un servizio di acquisizione operativo o una decisione dell'utente di sostituire Q41. Rimane il limite preciso del mese aggiuntivo della nostra finestra, non coperto da un quinto trimestre ufficiale dimostrato.

**Q42 approvata — priorità dello scenario, 28 ottobre 2026:** implementare come strada principale il recupero dei coefficienti previsionali impliciti dalle simulazioni del Portale, secondo l'esperimento sopra. Se non si riesce a renderlo utilizzabile, affidabile e operativo, ripiegare sui dati GME con la nostra elaborazione Q39/Q41. Q41 è quindi conservata come soluzione di ripiego, non più come prima scelta. La priorità riguarda il servizio di scenario condiviso da web e MCP; non autorizza sostituzioni silenziose o una mescolanza non dichiarata delle fonti. Il manifesto identifica metodo effettivo, provenienza, copertura e verifiche. La gestione del mese aggiuntivo della finestra approvata resta da risolvere esplicitamente: non è approvata un'estensione del Q4 corrente al Q4 dell'anno successivo.

L'acquisizione sistematica e l'accesso API GME rimangono una dipendenza esterna esplicita; nessun contatto è stato autorizzato o inviato da queste risposte. La futura integrazione non sarà dichiarata completa finché non siano verificati canale utilizzabile, permessi, continuità e aggiornamenti. Questa dipendenza non blocca la definizione dei contratti o lo sviluppo indipendente OCR/catalogo, ma va rappresentata nel piano prima di pubblicare attività come eseguibili.

Preparata la [bozza locale della specifica del percorso reale](./spec-primo-percorso-reale.md), secondo struttura Problem/Solution/User Stories/Implementation/Testing/Out of Scope. Non è pubblicata sul tracker né dichiarata ready-for-agent: Q41 è stata successivamente accettata come metodo iniziale e i vincoli esterni restano espliciti. I ticket #3–#5 esistenti sono ancora la tranche con dati sintetici; sono stati riletti senza modificarli.

- Chiudere la matrice delle formule entro Q26/Q29: fasce, sconti, scaglioni e periodi, combinazioni osservate, sei miste gas e record ancora ambigui. Portare all'utente la copertura concreta con evidenze prima di fissare la specifica finale; non trasformare l'assenza di un calcolo in scarsa convenienza.
- Qualificare fonte gratuita e metodo per i dodici mesi previsionali; completare l'inventario dei riferimenti territoriali, fiscali e dei profili di consumo. Distinguere dati disponibili, trasformazioni verificate e lacune ancora bloccanti.
- Definire i campi minimi del profilo e la ricostruzione del contratto attuale dai dati ammessi, applicando Q5 quando non è confrontabile per l'intero periodo.
- Qualificare modello/canale OCR, errori e ripresa, provenienza dei campi, costi, latenza e limiti di file/pagine con campioni rappresentativi. La scelta AI SDK + vision e la famiglia candidata non dimostrano ancora l'accuratezza.
- Proporre infrastruttura minima e costi concreti, persistenza e accesso all'ambiente interno; specificare i contratti tra acquisizione, catalogo, scenario, profilo, confronto e adattatori web/MCP. Nessuna nuova decisione su hosting o cancellazione automatica.

#### Dipendenze delle decisioni successive

- Q30/Q31 e qualifica OCR → schema del profilo, gestione dei documenti e casi di conferma/correzione.
- Q32/Q33/Q34 e qualifica delle fonti/formule → stati di disponibilità, raccomandazione e copertura effettivamente promessa.
- Q35 → stato anonimo solo in memoria, nessuna ripresa persistente; separazione dai documenti conservati per la verifica interna secondo Q25.
- Esiti precedenti → conferma dell'intesa e accordo sui punti di verifica in `to-spec` → specifica pubblicata → proposta di ticket verificabili con dipendenze → approvazione di dimensioni e dipendenze in `to-tickets` → pubblicazione dei ticket.

OCR e ingestion possono essere sviluppati in parallelo una volta concordati i rispettivi contratti; il confronto completo dipende anche dal calcolo qualificato e dalla loro integrazione. Le prove da completare durante lo sviluppo diventano criteri di accettazione espliciti, mentre una decisione di prodotto o una semantica ancora ignota non va nascosta dentro un ticket dichiarato pronto.

## Decisioni operative del 29 ottobre 2026

| ID | Decisione approvata | Conseguenza |
| --- | --- | --- |
| Q43 | Recupero dei coefficienti con script separato, lanciato manualmente una volta al mese; validazione e importazione nel DB di uno snapshot versionato. | Nessuna integrazione delle sonde nel percorso utente e nessuno scheduler necessario nella prima versione. Web e MCP leggono la stessa versione pubblicata; mantenere fonte, evidenze e controlli. Catalogo offerte quotidiano distinto da aggiornamento mensile degli indici. |
| Q44 | Allineare il periodo di stima al Portale: quattro trimestri solari dal primo giorno del trimestre corrente alla data della simulazione. Sostituisce Q23. | A ottobre 2026 il periodo è 1 ottobre 2026–30 settembre 2027. Eliminato il precedente mese aggiuntivo ottobre 2027. Applicare la stessa finestra alle alternative e al contratto attuale; date visibili, senza promettere una decorrenza contrattuale. |

Q42 mantiene la priorità del recupero implicito, con GME + nostra stima come ripiego. Q43 riduce l'automazione iniziale e Q44 elimina il disallineamento temporale: i richiami precedenti al mese aggiuntivo restano cronologia, non una dipendenza aperta. Le fixture e le verifiche del calcolo devono usare il nuovo periodo, compresi profili/scaglioni gas e cambi di trimestre; gli esperimenti precedenti sul periodo novembre→ottobre conservano le date originali e non sono una verifica retroattiva del periodo ottobre→settembre. La copertura del ripiego GME va ricontrollata sul nuovo periodo, senza dichiarare sufficiente lo snapshot già acquisito per la vecchia finestra.

## Esito dell'ultimo giro operativo — 29 ottobre 2026

| ID | Decisione dell'utente | Conseguenza |
| --- | --- | --- |
| Q45 | Monitorare i costi senza fissare un budget a priori. Corregge la proposta economica dell'agente. | Nessun tetto50EUR/mese o sottolimite OCR20USD approvato. Tracciare costi per provider, documento/tentativo, token/retry, storage e consumi. Conservare protezioni tecniche contro doppie chiamate, concorrenza incontrollata e timeout. |
| Q46 | Approvati i limiti iniziali dei documenti. | PDF fino a10MB e20pagine; alternativa fino a10foto JPG/PNG,10MB per foto e30MB totali. Oltre limite inserimento manuale; nessun taglio silenzioso. |
| Q47 | Approvata la politica sui dati non aggiornati. | Catalogo precedente con avviso per massimo48ore dalla data/versione fonte utilizzabile e solo con offerte/parametri applicabili; oltre sospendere i consigli interessati. Un nuovo download non ringiovanisce una vecchia fonte. Snapshot coefficienti del mese corrente e quattro trimestri coerenti; nessun trascinamento automatico al nuovo mese. |

Le decisioni operative non certificano il completamento delle qualifiche Peak/OffPeak o della matrice fiscale/territoriale nazionale, che restano a carico dell'agente. Nessun servizio attivato con questa registrazione.

## Passaggio a to-spec e to-tickets completato — 29 ottobre 2026

L'utente ha confermato le sei attività e le dipendenze. Pubblicata la [spec reale#6](https://github.com/TommyBez/la-mia-bolletta/issues/6) e i ticket#7–#12 come sotto-issue, con etichetta ready-for-agent e sette relazioni di blocco native verificate. Frontiera iniziale:#7catalogo/riferimenti,#8scenario mensile,#9bolletta/profilo. Confronto luce#10 e gas#11 dipendono da#7/#8; integrazioneA#12 da#9/#10/#11. Nessuna modifica ai ticket sintetici#3–#5 o alla precedente spec#1.

Le qualifiche nazionali hanno individuato e verificato fonti e procedimenti, non attestato dataset già completamente popolati: riconciliazioni e copertura per tutti i comuni sono criteri del ticket#7. Peak/OffPeak è affrontato con coefficienti annui effettivi e verifiche per firma economica, senza fingere curve trimestrali o un mapping fisico dimostrato; le nuove fisse e le componenti regolate devono passare i controlli del ticket#8 prima dell'accettazione del confronto luce. L'importazione mensile resta manuale e separata dall'applicazione. Il motore e il percorso reale sono ora lavoro delle attività pubblicate, non già implementati da questa fase di specifica.

## Discussione tecnica successiva — Q48/Q49

Q49 approvata dall'utente: Postgres su Neon per dati strutturati/versioni e Vercel Blob privato per file originali. La scelta non certifica risorse configurate o migrazioni eseguite.

Q48 rimane in discussione: l'utente chiede di valutare Vercel Workflow per l'importazione. Confrontare Cron→Workflow con Cron→Function semplice, mantenendo script mensile coefficienti manuale Q43, motore condiviso indipendente dall'orchestrazione e pubblicazione atomica Q34. La richiesta di valutazione non è un'approvazione automatica della nuova dipendenza o dell'intero disegno tecnico. Nessuna implementazione applicativa avviata.

### Q48 approvata

L'utente conferma l'applicazione Next.js modulare e l'orchestrazione Cron→Vercel Workflow per l'import quotidiano. Workflow per fornitura, originaliBlob, normalizzazione in staging, controlli e pubblicazione transazionalePostgres. Stepidempotenti e batch limitati; passare riferimenti/hash/ID e non interiXML nello stato. I moduli di acquisizione/normalizzazione/pubblicazione restano separati dal runtimeWorkflow e verificabili attraverso le interfacce concordate. Q43 mantiene lo script AU mensile manuale. Questa è una decisione architetturale, non un'implementazione o uno smoke test già eseguito.

### Q50/Q51 approvate — schema e formule

L'utente conferma il modello ibrido: metadati identificativi/ricercabili e versioni in colonne relazionaliPostgres; componenti economiche, intervalli, fasce, periodi e sconti inJSONB normalizzato e validato; XML originali inBlob privato conhash/riferimento; parametri, riferimenti e coefficienti come insiemi versionati separati.

Le formule sono dati tipizzati interpretati dal motore tramite regole versionate: quote annue, prezzo per consumo, indice+spread, scaglioni/periodi, sconti e coefficienti effettivi qualificati. Nessun codice eseguibile dalDB. Prezzi e coefficienti conservano precisione decimale, con arrotondamenti soltanto nei punti previsti dai metodi. La conferma non aggiunge nuovi linguaggi/esecutori di espressioni o unaformulauniversale non qualificata.

### Q53 approvata; Q52 da chiarire sul dominio ufficiale

Q53 confermata: confronto sincrono e stateless sul server, condiviso da web/MCP, profilo confermato e preferenze in ingresso; combinazione compatibile di versioni fissata per risultato/classifica/dettaglio. Nessuna sessione o profilo di confronto persistito nelDB. Importazione eOCR separati; prestazioni da verificare sui cataloghi reali.

SuQ52 l'utente propone di identificare l'offerta secondo il dominio e riferirsi alla validità, poiché ritiene che altre modifiche richiedano una nuova offerta. Non è una conferma del modello precedente di versionamento generico. Verifica diretta delle specifiche AUv5.0, §TO2.0051 p45: identitàCOD_OFFERTA+PIVA_UTENTE; offerta attiva modificabile inDATA_FINE, modalitàattivazione, pagamenti,URLOFFERTA eoffertecongiunte; prima dell'attivazione possono cambiare tuttiiparametri; scaduta modificabile soloDATA_INIZIO/DATA_FINE. Proposta rivista da concordare: separare identitàcommerciale dalla storia delle osservazioni ammesse, senza usare le date come identità né trattare ogni acquisizione come nuovaoffertaeconomica. Le modifiche economiche inattese su un'offerta giàattiva sono anomalie da verificare, non normalievoluzioni automaticamenteaccettate.

### Q52 approvata nella formulazione corretta

L'utente conferma la distinzione tra identità commerciale, validità e osservazioni tecniche. Chiaveufficiale COD_OFFERTA+PIVA_UTENTE, date per sottoscrivibilità/riaperture, storia delle variazioni ammesse. Riutilizzare contenuti invariati tra acquisizioni: nessuna nuova offerta commerciale giornaliera. Per offerte attive, modifiche economiche inattese sono anomalie da verificare; prima dell'attivazione valgono gli aggiornamenti più ampi ammessi dal processoAU. Conservare gli originali e le osservazioni necessarie alla riproducibilità senza confondere una versione interna del dato con una nuovaofferta del venditore.

### Q54–Q56 approvate — librerie, interfacce e verifica

Q54: Drizzle per schema/query/migrazioniPostgres; Zod per validazione runtime e tipiTypeScript dei dati normalizzati e dei contratti web/MCP; decimal.js per calcoli economici con precisione e arrotondamenti controllati. Pin di versioni compatibili nel lockfile durante l'implementazione, senza cambiare i metodi di calcolo sulla base dei default di libreria.

Q55: quattro operazioni del modulo condiviso — validareprofilo, confrontareofferte, leggeredettaglio, leggerestatodati. Web tramite endpointJSON e MCP tramite tool dedicati, entrambi adapter dello stesso modulo. Estrazione bolletta separata e solo web; nessuna importazione o scrittura amministrativa esposta come toolMCP.

Q56: Vitest per moduli e integrazioni conPostgres isolato; Playwright per il percorso browser. Restano i seamQ40 approvati e il ciclo red→green: stessi ingressi dei chiamanti, risultati attesi indipendenti, test di comportamento; nessuna dipendenza dei test numerici daReact o dalruntimeWorkflow. Le prove di pubblicazione/lettura devono attraversare l'adapterPostgres reale, non solo una finta persistenza.

Il giro tecnicoQ48–Q56 è confermato. Consolidare specifica e ticket prima dell'implementazione; le scelte interne reversibili non richiedono altri giri di conferma se rispettano queste interfacce, invarianti e criteri.
