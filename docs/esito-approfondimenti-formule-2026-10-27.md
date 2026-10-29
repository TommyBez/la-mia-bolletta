# Esito degli approfondimenti: canoni, rate e casi ambigui

27 ottobre 2026. Seguito dell'[audit iniziale](./audit-formule-offerte-2026-10-27.md), richiesto prima di chiudere la copertura del primo percorso. Tutte le nuove verifiche usano esclusivamente XML, pagine e documenti ufficiali del Portale Offerte/Acquirente Unico. Nessun sito di fornitore consultato.

**Aggiornamento conclusivo:** la [verifica della calcolabilità](./verifica-calcolabilita-canoni-2026-10-27.md) ha distinto le informazioni realmente assenti dalle cautele non necessarie. Cinque canoni gas hanno prezzi commerciali completi; sono determinati i valori al riferimento e un caso fuori riferimento. Imposte incluse e assenza di campi XML non bloccano da sole il calcolo. Restano applicabilità del minimo luce, prezzi assenti in quattro schede e attribuzione delle basi IVA per generalizzare il gas. Le aliquote fiscali mancanti nei CSV sono state recuperate per Milano dal dettaglio pubblico del Portale.

## Risultato che modifica la copertura

**Le offerte a canone esistono nel Portale.** Il precedente zero riguardava i campi degli XML, non l'intero insieme pubblicato. Il primo audit era insufficiente a decidere la priorità dei canoni: esiste una pagina ufficiale separata di offerte senza calcolo della spesa. Sono state acquisite integralmente **1.058 schede luce e 249 gas**; comprendono tutti i clienti e non sono un denominatore domestico qualificato.

Gli XML ordinari contengono già offerte a rata costante, da calcolare con le normali componenti economiche. La ricerca mirata identifica **28 record luce e 26 gas** con frasi relative a piani/opzioni di rata, presso 12 e 14 P.IVA. È una selezione testuale verificabile, non un censimento esaustivo né una classificazione automatica.

Fonti, codici e descrizioni sono nell'[approfondimento del catalogo](./approfondimento-canone-catalogo-2026-10-27.md); le prove ripetibili sono nella [cartella canoni](./evidenze/canone-2026-10-27/README.md).

## Cosa significa “fisso” nei casi reali

| Caso | Dato ufficiale osservato | Come confrontarlo |
| --- | --- | --- |
| Quota fissa | Una componente in €/anno | È soltanto una parte della spesa. |
| NeN Due Luce | XML: prezzo fisso 0,153 €/kWh + 108 €/anno; rata ricalcolata sui consumi | Usare prezzi, consumi e altre voci; dodici rate iniziali non sono automaticamente il costo definitivo. |
| Gelsia Rata Fissa Gas | XML: PSV mensile + 0,117 €/Smc + 129 €/anno; pagamenti con conguaglio | La rata è fissa, il prezzo dell'energia è variabile. |
| Fastweb Luce Flat Light | Pagina senza calcolo: canone **a partire da** 768 €/anno, riferimento 1.500 kWh, conguaglio 0,28 €/kWh, imposte dichiarate incluse | Presenza nella sezione senza simulazione verificata. Non è ancora qualificata l'applicabilità universale di 768 €; la dicitura da sola non dimostra prezzi diversi per profilo né il motivo della non simulabilità. |

I prezzi commerciali XML citati non sono bollette complete. Nella pagina luce sono verificate quattro taglie Fastweb con descrizioni economiche, una variante Partner Light incompleta e tre Veneto Gas&Power Casa Mia No Stress a rata costante senza prezzi sufficienti. Nella pagina gas cinque Fastweb Gas Flat richiedono una fornitura luce dello stesso venditore: la dipendenza va valutata rispetto al confronto indipendente e all'esclusione dei pacchetti congiunti di Q26.

Gli ID delle schede HTML non sono `COD_OFFERTA`. Non è stato trovato un download strutturato separato nella pagina Open Data. L'acquisizione mediante HTML ufficiale è tecnicamente dimostrata; non è già implementata nell'app né rende determinabili tutti i prezzi.

## Il canone nei metodi ufficiali

Per il canone onnicomprensivo strutturato a prezzo fisso, le regole prevedono `subtotale = canone annuo + prezzo del conguaglio × (consumo − consumo di riferimento)`.

Il conguaglio vale anche quando si consuma meno. Esempio ipotetico: 900 €/anno, riferimento 2.700 kWh, conguaglio 0,20 €/kWh producono subtotali di 840 €, 900 € e 960 € con consumi di 2.400, 2.700 e 3.000 kWh. Si trattano poi sconti e imposte; rete e oneri già ricompresi non si sommano nuovamente.

La formula non qualifica automaticamente il prodotto concreto. I canoni Fastweb pubblicati in testo includono imposte, mentre il ramo strutturato le aggiunge: copiarne il prezzo e aggiungere IVA/accise sarebbe errato. Il valore luce è indicato come “a partire da”; il testo collega alle caratteristiche della fornitura la scelta della fascia, senza specificare una relazione completa fra caratteristiche e canone. Da ciò non si deduce che il prezzo cambi necessariamente per ogni profilo o che questa sia la causa della non simulabilità. La conclusione verificata è che l'offerta compare nella sezione senza calcolo e non abbiamo ancora qualificato l'applicazione universale di quell'importo. Il [chiarimento sulla calcolabilità](./chiarimento-calcolabilita-portale-2026-10-27.md) separa questi fatti dalle inferenze.

La [verifica delle regole](./approfondimento-canone-regole-2026-10-27.md) individua due limiti ulteriori:

- Il tipo tecnico **FLAT** sopravvive nel tracciato v5.0, mentre le regole registrano la sua eliminazione nel 2022. Il nome commerciale Flat non prova l'appartenenza a quel tipo; occorre qualificare la compatibilità prima di usare il ramo storico.
- La formula del **canone gas variabile** contiene `λ`, definito per l'elettricità e non per il gas nei riferimenti esaminati. Il simbolo è stato verificato visivamente nel PDF. Non assegnargli arbitrariamente un valore. Questo problema non riguarda il canone fisso.

## Questioni chiuse e limiti residui

L'[analisi dei casi ambigui](./qualifica-casi-formule-2026-10-27.md) contiene regole e codici per ciascun esito.

| Caso | Esito |
| --- | --- |
| Nove fisse con un indice presente | Il metodo fisso non aggiunge l'indice. Conservare l'anomalia senza trasformarle in variabili. |
| Componenti opzionali fuori FER | La regola legata alla scelta di energia verde non si estende automaticamente a qualsiasi quota opzionale. Non azzerare energia/commercializzazione per analogia. |
| Sconto `DURATA=7`, testo “dal settimo mese” | Applicare il campo ai primi sette mesi usando i consumi mensili; conservare la divergenza. |
| Tre scaglioni gas sovrapposti | Fino a 500 Smc la parte interessata vale zero in entrambi gli intervalli; sopra manca una precedenza documentata tra prezzi diversi. |
| Sei miste con intervalli coincidenti | Famiglia descritta ufficialmente; precedenza dei due rami non univoca nei documenti. Il Portale produce una stima per il caso provato, ma ciò non definisce una regola generale riproducibile. |
| Canoni delle pagine senza calcolo | Presenza verificata; mancano in diversi casi prezzi per il profilo, campi strutturati, codice e calcolo pubblicato. Non equivale a scarsa convenienza. |

La prova del Portale sulla mista `029886GSVML01XXSENZAPENSIDOMGAS3`, profilo sintetico Milano domestico, 1.400 Smc, contatore inferiore a G6, produce **2.628,61 €/anno**; il dettaglio mostra quota annua 144 € e una riga spread variabile 0,08 €/Smc. L'[evidenza UI](./evidenze/formule-2026-10-27/portale-ui-cases.json) conserva dati e limiti. Non se ne deducono una precedenza universale, una ripartizione 50/50 o una curva previsionale. Non è una raccomandazione e l'orizzonte del Portale non è stato dichiarato uguale a Q23.

## Proposta precedente e decisione sul primo percorso

**La successiva decisione Q29 dell'utente limita la prima fase alle offerte dichiarate simulabili dal Portale.** L'acquisizione e il calcolo delle schede senza simulazione non sono più proposti come requisiti della prima consegna; restano una possibile estensione della seconda fase. Le rate e gli eventuali canoni dichiarati simulabili restano nel perimetro, così come la qualifica dei record simulabili ambigui. Il criterio Q27 si applica all'interno di questo universo.

La proposta di ricerca precedente, conservata per tracciabilità e superata da Q29 quanto all'inclusione delle non simulabili nella prima fase, era:

1. **Calcolare le offerte a rata negli XML** con il normale metodo fisso/variabile. Distinguere rata descritta, costo annuo stimato e media mensile.
2. **Includere i canoni nell'analisi della copertura e nell'inventario delle fonti.** L'assenza dagli XML non motiva più il rinvio. Prevedere esplicitamente l'acquisizione delle pagine ufficiali senza calcolo per rappresentare quell'insieme.
3. **Separare offerta acquisita, formula supportata e record calcolabile per il profilo.** Conservare le descrizioni senza dati sufficienti con il limite spiegato, senza importi o posizioni inventate. Non dichiarare che la migliore tra le calcolate sia necessariamente la migliore di tutte le pubblicate.
4. **Rendere esplicite le dipendenze residue:** interpretazione di miste/sovrapposizioni, compatibilità FLAT, parametro del canone gas variabile, informazioni economiche mancanti delle schede senza calcolo. Nessuna dipendenza dai siti dei fornitori.

Sono conclusioni di ricerca e una proposta di perimetro, non ticket approvati o un nuovo algoritmo adottato. Con il vincolo dei metodi ufficiali non si aggiunge di nascosto un metodo autonomo per offerte che il Portale pubblica senza calcolo. Q27 rimane valido: formule frequenti o molto convenienti non vanno escluse; una convenienza non determinabile non diventa scarsa convenienza.

I prezzi previsionali gratuiti qualificati e gli altri riferimenti del costo completo restano le dipendenze già documentate. L'approfondimento chiude i punti interpretabili con le fonti esaminate e identifica dati o regole mancanti; non certifica la classifica completa del mercato.
