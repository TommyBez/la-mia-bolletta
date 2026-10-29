# Contratti proposti per il primo percorso reale

Proposta tecnica, 27 ottobre 2026. Riferimenti: [glossario](../GLOSSARY.md), [decisioni Q1–Q38](./design-prodotto.md), [acquisizione](./design-ingestion.md), [risultati A](./spec-risultati-a.md), [estrazione](./ricerca-estrazione-bolletta-2026-10-27.md). Q36–Q38 confermate dall’utente. Non è un'implementazione o una nuova decisione dell'utente. Nessuna fonte esterna consultata.

## 1. Profilo confermato

Web, inserimento manuale e MCP producono lo stesso oggetto di dominio per una fornitura alla volta. Il motore riceve dati normalizzati confermati e non un PDF. Uno stesso documento può originare due profili indipendenti, luce e gas.

### Campi comuni necessari al confronto

- Versione dello schema; fornitura luce/gas; revisione del profilo per distinguere le risposte a richieste precedenti.
- Utenza domestica già attiva, operazione cambio fornitore senza cambio intestatario: perimetro Q18, non scelta di default per una situazione ignota.
- Comune univoco mediante codice territoriale ufficiale, con denominazione di presentazione. CAP/stringa OCR è un candidato da risolvere, non un identificativo sufficiente. Provincia, regione, zona climatica e ambiti tariffari sono risolti dal motore usando riferimenti territoriali qualificati e versionati, non richiesti tutti all'utente.
- Consumo annuo, unità, periodo al quale si riferisce e natura rilevato/stimato/dichiarato, con provenienza. Il periodo storico dei consumi resta distinto dai dodici mesi futuri di stima. Un importo speso o un consumo bimestrale non sostituiscono l'annuo. Q30 vieta annualizzazioni arbitrarie.
- Stato di conferma dei campi essenziali e delle eventuali assunzioni proposte. Il cliente MCP può attestare che l'utente li ha confermati; l'asserzione non certifica che l'OCR sia corretto. L'inserimento manuale esplicito è una provenienza valida.

### Luce

- Consumo annuo totale in kWh.
- Potenza impegnata in kW.
- Domestico residente/non residente, con valore esplicito: non dedurlo da indirizzo o categoria testuale ambigua.
- Ripartizione per fasce disponibile: dati annui F1/F2/F3 o altra configurazione riconosciuta dalla fonte, con periodo coerente e somma compatibile con il totale secondo arrotondamenti documentati. Non richiedere tutte le configurazioni contemporaneamente.
- Se le fasce mancano, totale più un profilo convenzionale ufficiale è utilizzabile soltanto se qualificato dal metodo, mostrato e confermato (Q30). Nessun 33/31/36 o altra percentuale inserita come default senza qualifica e conferma.

### Gas

- Consumo annuo in Smc. Un valore in m³ rimane in quell'unità finché la conversione ufficiale e i relativi parametri non sono disponibili; non sostituire Smc a m³ nel parser.
- Uso/categoria riconosciuta: cottura, acqua calda, riscaldamento e combinazioni, oppure categoria ufficiale derivata senza ambiguità. La relativa distribuzione mensile è determinata da profilo e territorio ufficiali, versionati.
- Classe/portata del misuratore nel formato normalizzato accettato dal metodo tariffario. Nessun G6 implicito per dato assente.
- Misure temporali se effettivamente disponibili e utilizzabili dal metodo; non inventarle per colmare i mesi. La prima versione con consumo annuo usa il profilo convenzionale qualificato.

### Ammissibilità e preferenze: valori distinti

- Preferenza prezzo fisso/nessuna preferenza, separata dai dati fisici. Q4 influenza la raccomandazione; non cambia consumi o formule.
- Disponibilità ai metodi di pagamento e agli ulteriori requisiti dichiarati dalle offerte: soddisfatto/non soddisfatto/sconosciuto per requisito. Il motore restituisce quali conferme servono, anziché trasformare una lista vuota in consenso universale.
- Eventuale stato di cliente vulnerabile solo ove richiesto dal metodo/perimetro delle offerte considerate; non assegnare automaticamente NO. Non chiedere dati personali non necessari se nessuna regola selezionata li usa.
- Inammissibilità certa esclude quell'offerta dal ranking ammissibile con motivo; requisito sconosciuto mantiene un'offerta condizionata e non applica il relativo sconto come certo (Q33). Un conflitto di semantica economica non diventa requisito cliente.

Nome, CF, IBAN, POD/PDR, numero cliente e indirizzo completo non sono input obbligatori della ricerca ordinaria. Se presenti nel documento conservato sono dati privati; non vengono copiati nel catalogo pubblico o richiesti dal MCP per comparare.

## 2. Provenienza dei campi ed estrazione

L'estrattore restituisce candidati, non un profilo già approvato. Per campo: percorso dello schema; valore originale/unità; valore normalizzato se determinabile; origine (`documento`, `manuale`, `client_mcp`, `derivazione_ufficiale`); riferimento al documento e pagina/estratto, quando disponibili; esito presente/assente/ambiguo/non valido; assunzione proposta e relativo metodo; conferma/correzione dell'utente. Un confidence score del modello non sostituisce questi stati.

Le correzioni conservano la distinzione tra valore letto e valore confermato. Per i dati MCP la prova documentale non è obbligatoria: il client non deve trasmettere bollette né inventare pagina/estratto. Può fornire un riferimento locale descrittivo non dereferenziato dal server. OCR server-side resta un'operazione della web app, non un tool MCP.

Interface concettuale minima:

- `extractBill(documentReference)` → esito estrazione, candidati dei profili presenti, problemi del documento/estrazione. Un documento illeggibile è distinguibile da un errore temporaneo del provider.
- `validateProfile(profileCandidate)` → profilo normalizzato più campi mancanti/errori/assunzioni da confermare, oppure profilo pronto. Validazione usata anche dai dati manuali e MCP.
- `compare(profileConfirmed, preferences, currentContract?, versions?)` → risultato comune, con eventuale richiesta di input. Catalogo e scenario sono dipendenze del motore, non interpretati dall'adapter UI/MCP.

La scelta dei nomi precisi e dello schema tecnico è implementativa. I tre comportamenti sopra sono i contratti da fissare; non impongono tre chiamate HTTP o una rete di microservizi.

## 3. Contratto attuale e risparmio

Il contratto attuale è facoltativo. Non confondere il suo codice con la versione del contratto: sono necessari evidenza delle condizioni applicabili, data di decorrenza e validità, componenti commerciali e loro formule, tipo fisso/variabile, indice/coefficienti/spread dove pertinenti, scaglioni, periodi, sconti e condizioni effettivamente applicabili, eventuali costi documentati di cambio/recesso che incidano sul confronto.

Le condizioni possono provenire dalla bolletta confermata o dalla versione pertinente di un'offerta nell'archivio ufficiale del Portale. L'export corrente non sostituisce silenziosamente la versione contrattuale originaria. Non si seguono URL del fornitore per integrare/correggere il contratto (Q28).

Per quantificare il risparmio, l'attuale deve essere ricostruibile per l'intero periodo di stima comune, sui medesimi consumi, scenario e regole fiscali delle alternative. Una scadenza dopo sei mesi senza dati per il seguito non autorizza a prorogare il prezzo per dodici. Rinnovi o evoluzioni sono usati solo se le condizioni pertinenti sono disponibili e qualificabili; altrimenti il contratto rimane non confrontabile sul periodo intero.

Stati del contratto: assente, incompleto, confrontabile, non confrontabile sul periodo; ognuno riporta dati/motivi mancanti. In Q5 le alternative continuano a essere calcolate; `risparmio = assente` e non zero. Nessuna differenza tra spesa storica in bolletta e costo prospettico viene etichettata come risparmio omogeneo.

## 4. Risultato comune web/MCP

Il risultato identifica:

- Versione schema, revisione/hash del profilo e fornitura.
- Data di calcolo e periodo di stima esplicito: quattro trimestri solari dal trimestre corrente, come il Portale (Q44, sostituisce Q23).
- Manifesto/catalogo, parametri/regole, scenario e metodi/profili territoriali usati. Le versioni fissate restano uguali per dettaglio/paginazione del medesimo confronto.
- Copertura dichiarata: domestiche, singole, mercato libero, ufficialmente simulabili; esclusioni PLACET/dual/non simulabili. Nessuna dichiarazione di completezza nazionale se non verificata sul manifesto.
- Disponibilità del confronto e motivi; separata confrontabilità dell'attuale.
- Raccomandazione (cambiare/restare/condizionata/non disponibile) e motivazioni coerenti con Q4–Q7.
- Offerte ordinate ammissibili e offerte condizionate distinguibili; identità/versione/codice, venditore, validità, costo annuo stimato e componenti, requisiti/risposte, bonus applicati e non applicati, assunzioni e limiti.
- Risparmio per alternativa solo quando il contratto è confrontabile; media mensile secondaria (Q11).
- Dettaglio riutilizzabile nei due canali; collegamento di uscita ufficialmente disponibile e validato, oppure codice/canali disponibili senza URL inventato. Validare l'URL non significa acquisire condizioni dal sito fornitore.
- Distinzione tra dati sintetici e dati reali. Le fixture restano test, non un fallback del confronto reale.

Gli importi sono valori economici tipizzati con valuta/unità e precisione interna definita dal motore; presentazione italiana e arrotondamento a centesimi non determinano i calcoli intermedi. Catalogo/regole/scenario sono parte del risultato riproducibile. Q36 usa IVA normativa corretta, Q37 seleziona variabile sul pareggio numerico, Q38 usa il modello mensile approvato: queste policy entrano nella versione delle regole, non negli adapter.

## 5. Esiti e correzioni

- `needs_input`: elenco puntuale dei campi del profilo mancanti, incoerenti o non confermati; non genera classifica apparentemente valida.
- `ready`: confronto disponibile; contratto attuale facoltativo e separatamente qualificato.
- `no_eligible_offers`: ricerca completa con nessuna offerta ammissibile; distinto da guasto o mancanza dei dati. Le sole offerte condizionate non diventano automaticamente ammissibili.
- `incomplete_data`: fonte/catalogo/scenario o parametro necessario non utilizzabile; segue Q24/Q34, con ragioni/date. Non trasforma il confronto in solo-fisso per dichiararlo completo.
- `temporarily_unavailable`: errore operativo riprovabile con messaggio e possibilità di ripresa, senza inventare prezzi o riciclare un risultato superato.

Non sono obbligatori questi nomi nel codice; sono distinzioni osservabili. Una formula non ancora implementata su un'offerta simulabile è lavoro da completare, non un criterio per accettare definitivamente una classifica parziale (Q32).

Modificare il profilo incrementa la revisione e invalida l'attualità del risultato precedente; una risposta tardiva a una revisione vecchia non sostituisce quella corrente. Luce e gas hanno revisioni/stati indipendenti. Il riepilogo complessivo somma solo risultati compatibili; il risparmio complessivo manca se manca una base attuale necessaria, mentre i costi delle alternative possono restare disponibili.

## 6. Sessione anonima e conservazione

Q35: nessuna sessione anonima ripristinabile dopo reload/chiusura, nessun profilo in localStorage/cookie/cronologia recuperabile. Durante il percorso lo stato è in memoria nel client. Nessun account obbligatorio.

Q25: documenti web conservati nell'archivio privato interno per percorso e verifica, senza cancellazione automatica. Riferimenti tecnici di upload/job non diventano una funzione di sessione recuperabile o una lista pubblica; Q35 non impone di perdere i file conservati. L'accesso ai documenti e ai job deve restare protetto nel deployment interno. Un confronto può essere computazionalmente stateless pur usando cataloghi e originali persistenti. MCP non crea documenti né cronologia per conto del client.

## 7. Confini di verifica che abilitano il parallelo

Un seam principale: ingresso confermato → risultato del modulo di confronto, usato da web e MCP. Test con snapshot ufficiali immutabili e scenari espliciti qualificati, valori attesi indipendenti e policy approvate. Gli adapter non ripetono ammissibilità, calcolo o ranking.

Seam aggiuntivo per la variabilità effettiva del vision provider: documento → candidati, con casi mancanti/ambigui e revisione umana; non testare solo la conformità JSON. Sul corpus misurare correttezza dei campi, assenza di invenzioni, costo, latenza e limiti. Le soglie misurate diventano acceptance criteria, non fatti già acquisiti.

Percorso browser completo: upload o manuale → conferma/correzione → confronto reale A → classifica/scheda → collegamento ufficiale, con equivalenza web/MCP sullo stesso profilo e versioni. Include luce/gas indipendenti, fixed/variable/mixed, condizioni, attuale incompleto, input insufficienti, errore aggiornamento e risultati superati.

L'importatore è verificabile attraverso pubblicazione/lettura/stato del catalogo già descritti nel design ingestion: un import incompleto non viene pubblicato, la versione precedente rimane identificabile; nessuna pubblicazione fuori ordine. OCR e ingestion non si bloccano reciprocamente una volta fissati i contratti; confronto e integrazione usano fixture conformi fino alla connessione ai dati reali. Fixture conformi non valgono come prova di completezza del prodotto.

## 8. Stato effettivo della worktree

Audit read-only: in questa worktree `app/page.tsx` è lo starter Next; `package.json` espone dipendenze UI/Next e nessuna implementazione OCR/catalogo/calcolo/MCP individuata dalla ricerca dei nomi rilevanti. Non risultano suite di dominio/end-to-end. La documentazione della tranche sintetica e del prototipo si riferisce anche a branch separati: non attestare qui un'interfaccia già collegata a dati sintetici senza verificare quel branch/PR. Non è stata eseguita una prova runtime; l'audit è statico.

## 9. Scenario previsionale: qualifica ancora aperta

**Aggiornamento Q42:** recupero implicito dal Portale come canale principale da implementare; GME + nostra stima Q39/Q41 come ripiego se il primo non diventa utilizzabile e operativo. Il [recupero sperimentale](./recupero-indici-au-2026-10-28.md) ha isolato20coefficienti luce e4gas con controlli separati. Il contratto dello scenario deve conservare anche sonde/input, metodo di deduzione, incertezza e controlli, oltre alla fonte effettiva. Quanto segue descrive la qualifica del ripiego GME. **Q43/Q44 approvate il 29 ottobre:** script separato lanciato manualmente una volta al mese, validazione e importazione nel DB; app e MCP leggono lo snapshot pubblicato. Periodo di stima allineato ai quattro trimestri dal trimestre corrente del Portale: il precedente mese aggiuntivo è eliminato.

Lo snapshot [GME già acquisito](./evidenze/gme-2026-10-26/control-prices-snapshot.json) copre temporalmente novembre 2026–ottobre 2027 per luce baseload e gas, combinando mesi e trimestri. La copertura novembre 2026–ottobre 2027 si riferisce alla vecchia finestra Q23. Con Q44 va riverificata sul periodo ottobre 2026–settembre 2027: questo campione GME non dimostra la copertura di ottobre 2026. **Q39 approvata:** usare il trimestrale quando disponibile e il mensile per i mesi altrimenti scoperti, indipendentemente dal prezzo minore. Il minimo approvato per gli intervalli delle offerte **non si applica** ai diversi prodotti di mercato. La scelta della sessione utilizzabile, delle conversioni e delle trasformazioni resta tracciata nel manifesto dello scenario.

Lo scenario dovrà conservare, per ogni mese/indice/fascia, valore e unità, osservazione/contratto/sessione fonte, conversioni e trasformazioni, versione del metodo, copertura, stato di utilizzabilità. Il motore riceve uno scenario immutabile già risolto; web e MCP non scelgono fonti o fallback separati. Un dato mancante non diventa zero.

La [conversione gas è ora qualificata](./qualifica-conversione-gas-2026-10-27.md): EUR/MWh × 0,0107 produce EUR/Smc al riferimento convenzionale P = 0,03852 GJ/Smc. Conservare fattore, base energetica e provenienza; non applicare il coefficiente C a consumi già in Smc né presentare la conversione come prova di identità fra prezzo di controllo GME e indice contrattuale di altro editore.

Restano da qualificare F1/F2/F3 e canale di raccolta sistematica. Il CSV storico ufficiale del Portale, riletto il 27 ottobre, contiene PUN, PSV, PE, CMEM, Pfor e Psbil, non tre serie F1/F2/F3: non è sufficiente da solo per proporre una trasformazione per fascia. L'ambiente interno non risolve automaticamente il punto della raccolta sistematica GME documentato nell'[approfondimento](./approfondimento-gme-2026-10-26.md).

Questi punti sono dipendenze esplicite della qualifica tecnica e dell'integrazione finale. Una prova con fixture complete permette sviluppo parallelo ma non soddisfa la consegna reale né certifica la disponibilità del canale produttivo. Nessun nuovo account, contatto o costo è stato attivato.

**Q40 approvata:** i confini di verifica del §7 sono confermati: confronto comune profilo/versioni → risultato, documento → campi, acquisizione → pubblicazione atomica del catalogo, più i percorsi completi di integrazione web/MCP. L'approvazione dei test non certifica la disponibilità delle fonti ancora da qualificare.
