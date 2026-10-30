# Reverse engineering numerico intervalli gas — 27 ottobre 2026

**Decisione approvata dopo la ricerca:** usare il minimo numerico fra intervalli applicabili in conflitto, mantenendo la priorità degli specifici sul default. Il dubbio primo/minimo resta scientificamente indistinto nei campioni, ma non è più una decisione aperta della specifica. Vedere la [regola del nostro motore](./design-ingestion.md#precedenza-degli-intervalli-decisione-approvata-il-27-ottobre-2026).

**Estensione storica successiva:** [36 ulteriori export ufficiali del 2025–2026](./ricerca-storico-precedenza-2026-10-27.md), 71.653 record e 63 coppie concorrenti, non hanno fornito un caso con prezzo numerico maggiore per primo. I precedenti 404 di luglio/settembre erano causati dal mese con zero iniziale nell'URL costruito; gli export esistono e sono stati recuperati dai link del modulo ufficiale. Primo e minimo numerico restano indistinguibili nei campioni esaminati.

**Aggiornamento fase 2:** verificata la priorità dello scaglione specifico sul default; esclusa la somma e la scelta dell'ultimo per due offerte di controllo con default duplicati. Primo e minimo fra intervalli equivalenti restano indistinguibili nei dati disponibili. L'[anomalia IVA](./reverse-engineering-iva-2026-10-27.md) è ora riprodotta da un modello di accumulo mensile ripetuto, con controlli fuori calibrazione.

Analisi indipendente basata su `docs/simulazioni-due-offerte-2026-10-27.md`, snapshot locali e profili ufficiali in [Regole ufficiali v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf#page=45), p.45. Nessun sito fornitore. Le nuove osservazioni sono documentate dai JSON e dai frammenti HTML delle risposte server in [evidenze reverse engineering](./evidenze/reverse-engineering-gas-2026-10-27/); gli importi storici sono nel dossier delle simulazioni.

## Risultato principale: modello predittivo per PREZZO NETTO ZERO GAS

Sia C il consumo annuo; w_m il peso mensile del profilo. Sia A_m la somma dei pesi dei mesi precedenti, **partendo dal mese successivo alla simulazione**, quindi novembre in queste prove. Il consumo rappresentativo del mese nel modello è:

`M_m = C * (A_m + w_m / 2)`

L'intero consumo del mese `C*w_m` riceve lo spread 0,10 quando `M_m >= 1001`; altrimenti lo spread effettivo osservato è zero. La vendita è quota fissa120 + quota indice + somma degli spread mensili.

Questo è un modello inferito e predittivo; non una lettura del codice server né una regola ufficiale pubblicata. La forma metà mese può rappresentare più implementazioni equivalenti sui campioni.

### Evidenza iniziale

Profilo riscaldamento zona D: novembre .141177804, dicembre .217751921, gennaio .249674109, febbraio .189434624, marzo .132683819, aprile .069277704; restanti mesi quasi zero.

I residui PN dopo quota fissa e indice implicito sono:

- C1200: 24,24, compatibile con 0,10 ×1200×(marzo+aprile)=24,23538276.
- C1400: 28,28, compatibile con 0,10 ×1400×(marzo+aprile)=28,27461322, considerando arrotondamento indipendente della quota indice.
- C2000: 78,28, compatibile con 0,10 ×2000×(febbraio+marzo+aprile)=78,2792294.

Fra tutte le 729 assegnazioni dei coefficienti0/.05/.1 ai sei mesi di prelievo significativo, queste sono le uniche combinazioni che corrispondono ai residui entro1centesimo. Il conteggio non prova che il motore assegni necessariamente mesi interi, ma rende questa pista precisa.

Il cumulato a inizio mese e quello a fine mese non spiegano insieme1200 e1400. Il cumulato a metà mese sì.

### Previsioni formulate prima dei nuovi risultati e verificate con nuove interrogazioni

- C1500 RISC: residuo previsto58,70942205 (febbraio+marzo+aprile); vendita prevista1427,90. La successiva interrogazione ha restituito1427,90.
- C1100 RISC: residuo7,62054744 (aprile); vendita1043,69, coincidente con nuova osservazione (questo risultato era già noto quando fu formulata la spiegazione midpoint).
- C1157 RISC: distingue soglia1000 da1001. Midpoint1000 prevedeva1106,91; midpoint1001 prevedeva1091,56. Osservato1091,56, compatibile con1001.
- C1159 RISC: dopo la soglia di marzo, vendita prevista nell'intervallo1108,613848–1108,616746; osservato1108,62. Lo scarto rispetto a una previsione puntuale1108,61 non è confutazione: il valore medio indice è identificato solo entro un intervallo dai risultati arrotondati.
- C1200 cottura+acqua calda: da PN osservato1055,68 sono state formulate tre previsioni per Senza Pensieri, utilizzando la differenza delle quote fisse/spread e senza conoscere il suo risultato:1156,09 con cumulato daottobre;1153,44 danovembre;1160,93 dagennaio. La successiva interrogazione ha restituito1153,44. Questo discrimina l'origine del cumulato, invisibile nel profilo D perché ottobre ha prelievo quasi nullo.

I tre ulteriori risultati1422/1424/S1159 sono stati confermati con nuove interrogazioni dopo la comunicazione delle previsioni.

Per C2 da novembre il residuo previsto è22,24051716 (agosto+settembre+ottobre), quindi differenza Senza−PN=24+96−22,24051716=97,75948284.

### Ulteriori previsioni poi confermate con nuove interrogazioni

- C1422 RISC: residuo28,71892857, vendita1332,95.
- C1424 RISC: residuo55,73481133, vendita1361,63.
- Senza C1159 RISC: vendita1201,93; differenza rispetto PN≈93,31265948.

Soglie teoriche di cambio mese, usando limite1001 e profilo D:

| Mese che entra nello spread0,10 | C annuo soglia |
|---|---:|
| aprile |1036,917657|
| marzo |1158,054992|
| febbraio |1423,247411|
| gennaio |2069,178874|

Le minuscole quote dei mesi estivi possono modificare le ultime cifre, non le prove a Smc interi indicate.

## Cosa questo dice della sovrapposizione

Nei mesi con rappresentante fra501 e1000, il modello richiede un contributo netto dello spread pari a zero. È compatibile con la precedenza del ramo0–1000 a zero sul ramo501–1000 a0,05. Non identifica *perché*: primo intervallo XML, ordinamento per limite, o altra normalizzazione possono dare lo stesso risultato.

Non aggiungere una correzione specifica per il nome dell'offerta. Una regola generale candidata che spiega anche Senza è: primo intervallo specifico applicabile, default solo in assenza di intervalli specifici; fra default coincidenti vince il primo. **Questa regola d'ordine non è ancora provata.**

## Senza Pensieri S

La vendita osservata è compatibile con un solo ramo variabile .08 + indice, più144€/anno. Poiché il primo intervallo XML è quello variabile, la scelta del primo intervallo è una possibile spiegazione generale, ma i soli consumi diversi non possono distinguerla da una preferenza per il tipo variabile o da deduplicazione.

La media annua indice desunta dai cinque campioni RISC arrotondati è compatibile con l'intervallo [.8327925,.832795) €/Smc. Non fissare .832793 come curva ufficiale né pretendere coincidenza al centesimo di ogni previsione effettuata con un solo punto di quell'intervallo.

Test di controllo consigliato: offerta ordinaria PSVmensile con unico spread s e quota fissa F, sugli stessi profili RISC eCC+AC. La differenza Senza−controllo deve essere144−F+(.08−s)C. Permette di confermare il contributo variabile unico senza ricavare l'indice da Senza stessa. Per la precedenza generale occorre un'altra offerta mista con ordine invertito o prezzi diversi, non ulteriori consumi di Senza.


## Controllo indipendente finale sul ramo variabile

È stata verificata ZERO FLEX GAS `000971GSVML01XXPROD1300109202600`, ordinaria PSV mensile indice14,174€/anno e spreadzero. A1200Smc la vendita osservata è1173,35 RISC e1087,44 CC+AC. Senza Pensieri a pari profilo è1239,35 e1153,44: entrambe le differenze sono66€, esattamente144−174+0,08×1200. Questo conferma su due profili diversi il contributo effettivo di **un solo spread0,08 più lo stesso indice**. Non dimostra ancora la regola generale di precedenza fra intervalli coincidenti.

## Riproduzione

`python3 docs/evidenze/reverse-engineering-gas-2026-10-27/verify-midpoint.py` usa Decimal, pesi ufficiali completi, ordine novembre→ottobre, limite1001 e risultati osservati. Deriva l'intervallo ammissibile dell'indice dalle osservazioni arrotondate, controlla anche ZERO FLEX e verifica che esista uno stesso indice medio per ciascun profilo che riproduca tutti gli importi ai centesimi. Output in [reconciliation.json](./evidenze/reverse-engineering-gas-2026-10-27/reconciliation.json). Nessuna quotazione futura ufficiale è ricostruita univocamente. Il codice è una verifica sperimentale del modello, non un motore di produzione né documentazione del server.

## Riproduzione e limiti tecnici

Eseguire `python3 docs/evidenze/reverse-engineering-gas-2026-10-27/verify-midpoint.py`: verifica offline 13 campioni di PREZZO NETTO (12 con riscaldamento e uno senza), i campioni Senza e i due controlli ZERO FLEX. Il risultato è in [reconciliation.json](./evidenze/reverse-engineering-gas-2026-10-27/reconciliation.json). Gli importi riguardano vendita gas; la ricostruzione delle imposte resta fuori da questa verifica.

La verifica trova un intervallo comune di valori medi dell'indice compatibile con tutti gli importi arrotondati di ciascun profilo. Non recupera i dodici prezzi forward e non rende ufficiale la media implicita. Le previsioni indipendenti delle soglie a 1.422/1.424 sono il controllo contro il semplice adattamento ai campioni.

L'analisi statica REA del solo JavaScript pubblico `confrontaOfferte.js` è registrata come `ev_590f80fc7a403820f25551adc27e571bb6708d5c1b5db23df03c1c9fc51ec288`; copertura parziale. Il sorgente del modulo assegna il filtro variabile ai tipi interni 02 e 03 (funzione `fillRelatedFields`). Questo riguarda l'invio del modulo, non prova la selezione degli intervalli sul server. I costi osservati sono già presenti nell'HTML della risposta del server.

Il catalogo gas esaminato contiene 2.830 offerte, di cui sei miste domestiche: tutte della famiglia Senza Pensieri S/M/L, tutte con tipo 02 prima di 01 e prezzi identici nei due intervalli. Non fornisce quindi un controesempio con ordine invertito o prezzi diversi per decidere fra first-wins, preferenza del variabile e deduplicazione. La causa generale della precedenza resta non identificata; il comportamento di vendita nei due casi è ora riproducibile sui profili verificati.

## Fase 2 — precedenza degli intervalli e controlli storici

Evidenze e script: [cartella fase 2](./evidenze/reverse-engineering-gas-2026-10-27/phase2/). Profilo pubblico Pescara, domestico non vulnerabile, riscaldamento salvo indicazione diversa. Nessun accesso autenticato né sito fornitore. I frammenti HTML contengono le voci economiche restituite dal server; credenziali e token non sono conservati.

### Default duplicati con prezzi differenti

Gli export ufficiali contengono due offerte variabili ordinarie con stessi quota fissa, indice, componenti regolate e sconto, ma secondo intervallo diverso nella componente Spread:

| Offerta | Codice | Intervalli senza limiti, nell'ordine XML | Vendita a 1.200 Smc |
| --- | --- | --- | ---: |
| Devra Smart Gas | `042441GSVML01XX00DEVRASMARTGAS26` | 0,05 poi 0,20 €/Smc | 1.329,18 € |
| Wattiamo Gas | `042441GSVML01XX0000WATTIAMOGAS26` | 0,05 poi 0,30 €/Smc | 1.329,18 € |

Se il secondo intervallo fosse sommato o sostituisse il primo, ci sarebbe una differenza di 120 €. La differenza osservata è zero. I campioni escludono ultimo, massimo e somma per questi record; rimangono compatibili primo, minimo o una normalizzazione equivalente. Questo è un controllo indipendente dalla codifica del tipo fisso/variabile delle offerte miste.

### Lo specifico prevale sul default, anche quando il default viene prima

L'[export ufficiale gas del 1 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_G_MLIBERO_20261001.xml) contiene PREZZO NETTO ZERO GAS versione 55, codice `000670GSVML55XXXXXGMPREZZONETTO0`, con quota 120 €/anno e indice 14. L'ordine nella componente è default 0, scaglione 500–1.000 a 0,05, scaglione 1.000–999.999.999 a 0,10. Manca il successivo scaglione 0–1.000 a zero della versione 56.

Prima della query si prevedeva circa 972,36 € a 1.000 Smc se lo specifico prevaleva, contro 952,79 € se il default iniziale/minimo azzerava tutto. Il Portale accetta anche questo codice storico e restituisce **972,36 €**. Conferma il ruolo di fallback del default; confuta primo-qualsiasi e minimo-globale, senza decidere primo/minimo fra specifici sovrapposti.

### Copertura della ricerca dei controesempi

Analizzati cinque snapshot: gas 1, 26 e 27 ottobre; elettrico 26 e 27 ottobre. Complessivamente 15.646 record, inclusi i duplicati fra giorni. L'export gas del 1 ottobre ha SHA-256 `7231e13a9c1ddab3a893c26ac9527a11341edb1b417632f88c6f89717d0707ad`. Gli URL ufficiali analoghi del 1 settembre e 1 luglio hanno restituito 404 e non sono stati ritentati.

Lo [scanner](./evidenze/reverse-engineering-gas-2026-10-27/phase2/scan-intervals.py) confronta intervalli fratelli della stessa componente, fascia e unità. Include periodi uguali, periodi diversi e distinzione default/specifico. Risultato: 30 coppie a periodo uguale con prezzi o tipi diversi, nessuna con prezzo maggiore per primo; 352 coppie default/specifico, di cui 178 con periodo esplicito; nessuna coppia non-default con periodi diversi e consumi sovrapposti nel perimetro analizzato. Non analizza collisioni tra componenti diverse e non prova l'assenza di casi discriminanti in altri export.

Quindi **primo e minimo fra intervalli equivalenti rimangono osservazionalmente indistinguibili** nei controlli disponibili. Non implementare una preferenza per ordine XML come se fosse stata dimostrata. Il passo ulteriore realmente discriminante richiede un record ufficiale con ordine inverso o altro criterio concorrente che produca prezzi diversi.

### Verifica del parametro di visualizzazione

Una richiesta di sola consultazione per Senza Pensieri S a 1.000 Smc ha sostituito il campo del modulo di dettaglio `idTipoOfferta=03` con `02`, mantenendo offerta e profilo. Vendita, IVA e totale non sono cambiati. Il test controllato è identificato dal suffisso `type02` nei file; non è il normale invio della UI. Esclude una causa dipendente soltanto da quel parametro nella pagina di dettaglio, non ogni possibile causa di classificazione a monte.

Per l'IVA, il [dossier dedicato](./reverse-engineering-iva-2026-10-27.md) conserva formula, otto campioni di calibrazione, cinque controlli indipendenti e limiti dell'inferenza. Le verifiche non hanno modificato il motore applicativo.
