# Sonda AU luce: periodi contrattuali e identificabilità dei trimestri

**Aggiornamento runtime, stesso giorno:** l'esito statico sotto riguarda la strada dei periodi contrattuali. Una strada diversa, l'invio di consumi mensili sintetici nel normale modulo anonimo, produce invece dodici coefficienti distinti e coerenti con le medie annue. I risultati sono nella sezione finale. Non confondere l'assenza delle quattro offerte necessarie con l'impossibilità di recuperare i trimestri attraverso il modulo.

## Esito dell'audit

Nel catalogo ufficiale luce del 27 ottobre 2026 **non ho trovato quattro offerte con quattro esposizioni temporali distinte e documentate all'indice AU**, tali da recuperare i quattro valori trimestrali da normali simulazioni annuali. Questa conclusione riguarda il catalogo esaminato e questa via contrattuale; non dimostra che il recupero sia impossibile attraverso consumi mensili o altre risposte del Portale.

Gli sconti temporanei osservati sono importi additivi in €/kWh, non percentuali temporanee del prezzo indicizzato. Sottrarre un importo noto modifica il termine noto dell'equazione, non i pesi dei quattro indici ignoti. Le undici offerte variabili con sconti percentuali non associano alcun `PeriodoValidita` a tali sconti: la percentuale opera sulla medesima combinazione annua, salvo altre semantiche da dimostrare con runtime.

Un candidato diverso è la sola offerta mista luce **Alperia Power Eco Neves**, non domestica, con prezzo fisso per i primi1000kWh e variabile oltre soglia. Il record non ha periodi temporali sui due rami. Potrebbe essere sondato per verificare se il superamento della soglia porta il motore a pesare diversamente i trimestri oppure soltanto a moltiplicare una media annuale. L'XML da solo non prova la prima possibilità. In questo audit non sono state eseguite richieste al simulatore.

## Fonti ufficiali e perimetro

- [XML luce mercato libero del 27 ottobre 2026](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml), copia analizzata `/tmp/la-mia-bolletta-20261027-E.xml`, SHA256 `7c01ff47e716f5de6743d27f5489d0fd6e84fea4dc03f73148e38b8fc09b4c7a`.
- [Regole ufficiali del calcolo della spesa v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), §§3.4.1.5–6 pp24–25, validità condizioni economiche pp25–26, sconto vendita e validità pp29–30.
- [Prova runtime delle medie implicite](./prova-sonda-au-2026-10-28.md), evidenza distinta da questo audit statico.

Nessun sito o documento del fornitore è stato usato. Sono stati letti anche record non domestici: una sonda tecnica potrebbe essere utile per gli stessi indici pur senza includere tali offerte nel prodotto domestico. Questa equivalenza dell'indice andrebbe verificata prima di riutilizzare il valore.

## Conteggi riproducibili

Audit di ogni elemento `offerta` del file, cercando tag per nome locale indipendentemente dal namespace. Il file contiene3626record:2955con `TIPO_OFFERTA=02`,670fissi01,1misto04. Questi conteggi riguardano tutto l'export, senza filtro di territorio o simulabilità domestica: non vanno confusi con il perimetro di catalogo finale dell'applicazione.

| Risultato | Conteggio |
| --- | ---: |
| Variabili02 con almeno un `PeriodoValidita` | 35 |
| Di cui domestiche01 / non domestiche02 | 12 /23 |
| Sconti percentuali unità06 nelle variabili02 | 18nodi,11offerte |
| Sconti percentuali con `PeriodoValidita` | 0 |
| Componenti impresa con periodi nelle variabili02 | 10nodi |

I periodi degli sconti in €/kWh osservati sono:12mesi (8nodi),4mesi (36nodi),1mese (6nodi),3mesi (2nodi),mese solare01 (19nodi). Alcuni record hanno più sconti per fascia; i nodi non sono offerte distinte.

Le dieci componenti impresa con periodi sono:

| Codice | Componente / periodo | Capacità di distinguere i trimestri dell'indice |
| --- | --- | --- |
| `000579ESVFL25XXEEPUN26XDOMESTICO` | Macroarea02,12mesi | Componente additiva; non quattro pesi dell'indice |
| `000579ESVFL25XXEEPUNX26ALTRIXUSI` | Macroarea02,12mesi | Come sopra |
| `000788ESVOL01XXPNBTAU1426X1X0000` | Macroarea06,12mesi | Componente additiva |
| `000788ESVOL01XXVWEBE02426X3X0000` | Macroarea06,fino12/2028 | Intero orizzonte corrente coperto; componente additiva |
| `000788ESVOL01XXPN50DM1426X1X0000` | Macroarea06,fino12/2028 | Come sopra |
| `000788ESVOL01XXVWEBE02426X1X0000` | Macroarea06,fino12/2028 | Come sopra |
| `000788ESVOL01XXPUNCON1426X1X0000` | Macroarea06,12mesi | Componente additiva |
| `000788ESVOL01XXENEIMP1426X1X0000` | Macroarea06,fino12/2028 | Componente additiva |
| `024349ESVFL01XXDINAMI16520241101` | Macroarea04,fino12/2000 più default | Periodo scaduto nel record; non trattarlo come una finestra futura |
| `029748ESVML01XX261021LDSURF00000` | Macroarea06,12mesi | Componente additiva zero |

Due esempi domestici con promozioni brevi sono `027095ESVML02XXLUCESPRINTIGL0426` e `027095ESVFL02XXLUCESPRINTFASCEXX`: contengono sconti vendita tipologia03, unità03, con durate1e3mesi. Questi campi sono **€/kWh**, anche se il testo commerciale può evocare una percentuale: non vanno modellati come moltiplicatori dell'intero indice AU.

## Semantica che impedisce di scambiare uno sconto additivo per una nuova equazione

Le regole ufficiali distinguono:

1. sconto vendita in corrispettivo, unità03/04: importo unitario sui consumi pertinenti;
2. sconto vendita percentuale, unità06: agisce sul prezzo indicizzato comprensivo di spread;
3. validità temporale: `DURATA` primi mesi dall'attivazione/interrogazione, `VALIDO_FINO` mese limite, `MESE_VALIDITA` mese solare; modalità alternative.

Se un'offerta semplice produce `S=A+q×media(P1,P2,P3,P4)`, uno sconto additivo di durata breve dà `S'=A+q×media(P1,P2,P3,P4)−K`, con K ricavato dallo sconto e dai pesi dei consumi. Dopo avere sottratto i costi noti resta la stessa equazione sugli indici. Uno sconto percentuale limitato a un trimestre potrebbe invece dare un'equazione indipendente, ma nel campione non esiste la relativa combinazione strutturata percentuale+periodo. Sconti percentuali validi tutto l'anno scalano la stessa riga e non aumentano il rango.

## Unica mista: candidato da sottoporre a runtime, non soluzione già dimostrata

`000368ESVML02XX5015672X261027XVE`, **Alperia Power Eco Neves**:

- cliente02(non domestico), tipo04(misto), indice12(PUN), monoraria01;
- quota fissa199€/anno;
- prezzo energia fisso0,19580€/kWh, consumo0–1000, `TIPO_PREZZO=01`;
- spread0,01100€/kWh, consumo1001inpoi, `TIPO_PREZZO=02`;
- ulteriore quota variabile0,00600€/kWh e dispacciamenti separati;
- nessun `PeriodoValidita` nei due intervalli energia.

La regola mista pp25–26 dispone l'applicazione alternativa delle formule fisso/variabile per fascia, scaglione e periodo in base a `TIPO_PREZZO`. Non definisce qui una regola mensile specifica che renda la soglia cumulativa un selettore del trimestre. In particolare non si deve trasferire senza prova la regola di punto medio ricostruita per le offerte gas a questo record elettrico.

Prova discriminante suggerita: simulare diversi totali che facciano superare1000kWh in momenti differenti secondo le due ipotesi, sottrarre tutte le componenti note e verificare se il coefficiente della quantità variabile rimane costante. Se rimane costante, è ancora la media annuale; se cambia, servono pesi temporali e controlli indipendenti per identificare i trimestri. Questa nota non presenta tali query come eseguite.

## Conclusione operativa

L'audit chiude la ricerca della semplice scorciatoia «quattro promozioni percentuali con quattro durate diverse» nel catalogo corrente: i record richiesti non ci sono. Non chiude la ricerca di trimestri AU nel Portale. Restano vie tecniche distinte: verificare il trattamento dei consumi mensili nel normale flusso e provare il candidato misto con una previsione discriminante. Qualsiasi esito negativo va limitato al flusso realmente verificato.

## Prova runtime successiva: dodici coefficienti da consumi mensili

Il modulo pubblico inoltra `misureMensili` normalizzate. Lo script pubblico [forniture.js](https://www.ilportaleofferte.it/portaleOfferte/resources/static/js/forniture.js?rdm=2023), funzione `normalizzaMensili`, conserva le quantità per fascia e la competenza; lo script `confrontaOfferte.js` le serializza nel modulo. Sono stati costruiti consumi sintetici propri su dodici mesi storici settembre2025–agosto2026, con3000kWh concentrati in un solo mese e una sola fascia. Nessuna chiamata a un archivio di forniture personali, nessun account né identificativo di un utente reale.

L'offerta sonda è **+ CASA SPECIAL**, codice `001686ESVFL00XXES3PC1026DO000000`, già verificata nella [prova annuale](./prova-sonda-au-2026-10-28.md). I totali annuali dichiarati coincidono con quelli mensili; i profili normalizzati restituiti dal Portale sono stati controllati, incluso il mese attivo.

### Correzione essenziale dello schema

Una prima variante inviava erroneamente lo stesso consumo sia in `delta_misure_monoraria` sia in una fascia. La variante corretta manda `delta_misure_monoraria=null` e quantità soltanto in F1/F2/F3. Il Portale conserva null come0nel profilo normalizzato. Il risultato cambia, quindi la prima variante è **input incoerente da scartare**, non una curva AU alternativa o un errore del Portale.

L'ordine dei dodici mesi nella variante qui raccolta è crescente. Il JavaScript pubblico costruisce normalmente la lista in ordine decrescente; la verifica dell'invarianza rispetto all'ordine è stata affidata al processo principale e va citata dal suo rapporto. Non usare la sola presenza della lista nel profilo per dedurre tutti i dettagli dell'algoritmo temporale. Analogamente il flag DTO `consumiMensiliPresenti` resta false, ma l'importo varia con il mese a quantità annua costante: il flag da solo non dimostra che la lista sia ignorata.

### Risposte corrette

Importi della sola vendita, €/anno. I casi F2/F3 sono otto nuove query eseguite da questo audit; i quattro casi F1 sono stati acquisiti in parallelo dall'agente principale e letti dagli stessi file locali.

| Mese storico con tutti i3000kWh | F1 | F2 | F3 |
| --- | ---: | ---: | ---: |
| Dicembre2025 | 1011,23 | 998,18 | 895,17 |
| Febbraio2026 | 942,34 | 945,53 | 849,88 |
| Maggio2026 | 664,53 | 733,62 | 667,19 |
| Agosto2026 | 710,25 | 753,32 | 684,21 |

Scomponendo con quota fissa120€/anno, spread0,0275€/kWh, CdispD0,016776€/kWh e lambda0,1 verificati nella [sonda annuale](./prova-sonda-au-2026-10-28.md):

`indice_implicito = ((vendita−120)/3000−0,0275−0,016776)/1,1`.

| Mese attivo della sonda | F1 €/kWh | F2 €/kWh | F3 €/kWh |
| --- | ---: | ---: | ---: |
| Dicembre2025 | ≈0,229819 | ≈0,225864 | ≈0,194649 |
| Febbraio2026 | ≈0,208943 | ≈0,209910 | ≈0,180925 |
| Maggio2026 | ≈0,124758 | ≈0,145695 | ≈0,125564 |
| Agosto2026 | ≈0,138613 | ≈0,151664 | ≈0,130722 |

Si tratta di valori impliciti dedotti, non di una serie ufficiale scaricata. Il mapping a Q4corrente/Q1/Q2/Q3successivi è compatibile con l'ordinamento dei mesi e il metodo ufficiale; la verifica intra-trimestre e la validazione su altri profili vengono eseguite dall'agente principale, quindi non sono dichiarate qui come nuove query di questo audit.

### Controllo indipendente delle medie

Le medie dei quattro importi sono F1=832,0875€, F2=857,6625€, F3=774,1125€. Gli importi annui già osservati o implicati dal modello annuale sono rispettivamente832,09€,857,66€,774,115€prima dell'arrotondamento del modelloF3. Le differenze sono compatibili con arrotondamenti al centesimo.

Questo controllo è importante: la variante con monoraria duplicata **non** ricostruiva la media annuale; quella corretta sì. Non sostituisce i controlli di ordine, trimestre, quantità e seconda offerta, ma elimina una falsa pista e mostra che le dodici quantità ricavate non sono semplicemente prezzi storici estranei al confronto.

### Evidenze persistite

[Tabella dei dodici coefficienti e risposte](./evidenze/sonda-au-luce-periodi-2026-10-28/coefficient-table.json), [manifest SHA256](./evidenze/sonda-au-luce-periodi-2026-10-28/manifest.json), [script pulito](./evidenze/sonda-au-luce-periodi-2026-10-28/probe-clean-monthly.py). Cartella `clean/` con profili e frammenti economici; `invalid-double-mono/` conserva separatamente la variante errata per diagnosticare la correzione. Non utilizzare quest'ultima cartella per un catalogo di prezzi. Nessun cookie/token è conservato nei frammenti economici.

## Estensione monoraria F0: quattro coefficienti e verifica su altro venditore

Otto simulazioni monorarie valide eseguite in questa estensione: quattro calibrazioni mensili, una distribuzione uniforme sui dodici mesi, una simulazione annuale senza dati mensili, un profilo temporale nuovo e lo stesso profilo su un secondo venditore. Un tentativo annuale preliminare si è fermato su un'asserzione locale relativa agli argomenti ammessi, prima di inviare la simulazione: corretto lo script e ripetuto; non è un rifiuto del Portale.

### Offerte e schema

Sonda **A2A Easy Luce**, `000294ESVML01XXA2AEasyL261033991`, XML ufficiale27ottobre: monoraria01, indice12, contributo fisso150€/anno, dispacciamento14CdispD, nessuno sconto né altre componenti regolate esplicite. L'unico corrispettivo variabile del venditore è zero, denominatoSpread ma posto in macroarea06. La componente nulla non modifica l'importo; non è stata usata per presumere una semantica universale per macroarea06.

Secondo venditore: **FLEXI MONO ENERGY**, `028979ESVML01XX00000000003515106`, quota fissa120€/anno, spread0,022€/kWh **macroarea04**, stesso indice12 e dispacciamento14; nessuno sconto. Il controllo trasferisce il valore F0 a un record con spread strutturato nella macroarea consueta.

Input del modulo `tipoTariffa=monoraria`; consumi mensili soltanto in `delta_misure_monoraria`, tutte le sei fasce null; totale annuo `consF0=3000`, fasce annue null. Ordine mensile decrescente come il JavaScript pubblico. Profili server verificati: `monoraria=true`, totale3000; nei mesi attivi3000monorari e zero nelle sei fasce dopo normalizzazione server. Nessuna duplicazione dei consumi.

### Calibrazione F0

`F0_implicita = ((vendita−150)/3000−0,016776)/1,1`.

| Mese storico con3000kWh monorari | Vendita A2A, € | F0 implicita €/kWh |
| --- | ---: | ---: |
| Dicembre2025 | 905,82 | ≈0,213785 |
| Febbraio2026 | 851,00 | ≈0,197173 |
| Maggio2026 | 630,03 | ≈0,130213 |
| Agosto2026 | 657,11 | ≈0,138419 |

### Controlli non usati per rifittare i valori

Prima delle query sono state registrate le predizioni per la simulazione annuale e per il profilo nuovo:600kWh novembre2025,900gennaio2026,1200aprile2026,300luglio2026, tutti gli altri mesi zero. Questi mesi sono diversi dai quattro usati per la calibrazione.

| Controllo | Predizione vendita non arrotondata, € | Portale, € |
| --- | ---: | ---: |
| A2A,250kWh per ciascuno dei12mesi | 760,990 | 760,99 |
| A2A,3000kWh annuali senza misure mensili | 760,990 | 760,99 |
| A2A,nuovo profilo novembre/gennaio/aprile/luglio | 754,187 | 754,19 |
| FLEXI MONO ENERGY,stesso nuovo profilo | 790,187 | 790,19 |

La media dei quattro importi A2A è760,99€. Per il nuovo profilo la previsione è `0,2×905,82+0,3×851,00+0,4×630,03+0,1×657,11=754,187`. Per il secondo venditore la variazione nota è `120−150+0,022×3000=36`, quindi790,187. Non è stato cambiato alcun coefficiente dopo avere osservato questi risultati.

Questa verifica è più forte del solo recupero della media: la diversa combinazione temporale, costruita con mesi non calibrati, e la variazione del venditore sono entrambe spiegate al centesimo. È coerente con quattro prezzi trimestrali condivisi dall'indice monorario. Non stabilisce un diritto di riuso, non estende il recupero a tutti gli indici né inventa il trimestre esterno alla finestra del Portale.

Evidenze: [risultati F0](./evidenze/sonda-au-luce-periodi-2026-10-28/f0/results.json), [predizioni prima delle query](./evidenze/sonda-au-luce-periodi-2026-10-28/f0/predictions-before-query.json), [script](./evidenze/sonda-au-luce-periodi-2026-10-28/f0/probe-f0.py). Nella stessa cartella sono conservati tutti gli otto profili, i dettagli economici sanificati e gli estratti XML delle due offerte.

## Controlli ulteriori sul triorario comunicati dal processo principale

Il processo principale ha inoltre verificato senza rifittare i coefficienti F1 una distribuzione nuova600/900/1200/300kWh nei mesi novembre/gennaio/aprile/luglio: previsione821,785€, Portale821,78€ suSPECIAL; previsione862,285€, Portale862,28€ suUNICA. Le query e il controllo dell'ordine della lista appartengono al rapporto del processo principale e non sono conteggiati come eseguiti da questo audit.
