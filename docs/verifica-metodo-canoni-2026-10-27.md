# Canoni: dati economici disponibili e applicazione del metodo ufficiale

Verifica del 27 ottobre 2026. Sono esaminate le tredici schede già acquisite dal Portale: quattro Fastweb Luce Flat con prezzi, Partner Light, tre Casa Mia No Stress e cinque Fastweb Gas Flat. Nessun sito o documento del fornitore consultato. Questa nota verifica la sufficienza matematica dei dati: identità del record, ammissibilità e completezza della fonte restano verifiche distinte.

## Esito

**La famiglia a canone è calcolabile con il metodo ufficiale. Il fatto che il canone sia pubblicato comprensivo di imposte non impedisce di calcolarla.** Occorre separare le schede:

| Schede | Cosa è già determinato | Cosa impedisce oggi un costo completo per qualsiasi profilo |
| --- | --- | --- |
| Quattro Fastweb Luce Flat con prezzi | Consumo di riferimento, importo minimo annuo, prezzo unitario del conguaglio, segno del conguaglio, sconto e condizione | Non è definita l'applicabilità dell'importo minimo a ogni profilo ammesso: il testo non dichiara né che sia universale né come ricavare un eventuale altro importo. Per un canone applicabile confermato il calcolo luce è possibile. |
| Cinque Fastweb Gas Flat | Canone annuo esatto, riferimento, prezzo unitario del conguaglio, sconto e condizione; al riferimento il totale prima dello sconto condizionato coincide con il canone. È determinato anche il caso Light Milano 300→350 Smc descritto sotto | Per generalizzare servono la fiscalità del territorio e la regola di attribuzione del canone alle basi IVA quando si attraversa la soglia 480 Smc. Le aliquote sono assenti nei CSV, ma sono state recuperate per Milano nel dettaglio ufficiale. Non manca un ulteriore prezzo commerciale dichiarato. |
| Fastweb Luce Flat Partner Light | Soglia di 1.500 kWh e descrizione dell'energia verde | Assenti importo annuo e prezzo/meccanismo quantitativo di conguaglio. Non si possono prendere i prezzi della diversa scheda Light per somiglianza del nome. |
| Tre Casa Mia No Stress | Rata costante e soglie nominali 800/1.500/2.500 kWh | Assenti importo della rata, tariffa sottostante e regola di riconciliazione. La soglia da sola non determina una spesa. |

Fonti delle tredici schede: pagine ufficiali [luce](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) e [gas](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=GAS), con [descrizioni conservate e relativi hash](./evidenze/canone-2026-10-27/selected-portal-descriptions.json). Le verifiche di disponibilità delle fonti aggiuntive sono nell'[analisi delle superfici pubbliche](./verifica-fonti-canoni-2026-10-27.md).

## Il trattamento fiscale del prezzo unitario ha una regola ufficiale

Il [documento del Portale sugli indicatori, v2.0, p.9](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/0f7a9b80925931637af9050c90350ee2.pdf) richiama il criterio dei corrispettivi al netto delle imposte. Il suo ambito algoritmico riguarda le offerte simulabili; per verificare che il criterio non fosse limitato ai campi dell'XML è stato controllato il riferimento normativo.

Il [Codice di condotta commerciale pubblicato come vigente dal 1° aprile 2026, art.5.1(a), pp.7–8](https://www.arera.it/fileadmin/allegati/docs/18/366-18_ti.pdf) applica il criterio a qualunque forma di comunicazione: valore unitario netto delle imposte, salvo dichiarazione che il prezzo le comprende. La medesima regola è presente nella [versione pubblicata per il 1° novembre 2026](https://www.arera.it/fileadmin/allegati/docs/18/allegato-a-ccc-aggiornato.pdf), collegata dalla pagina ufficiale dei testi integrati.

Di conseguenza la lettura conforme alla regola è: canone lordo perché dichiarato tale; sconto di 10 € lordo perché dichiarato IVA inclusa; corrispettivo unitario del conguaglio netto, in assenza di una dichiarazione contraria riferita a quel corrispettivo. Il testo esclude espressamente gli extra-consumi dalle voci comprese nel canone. Non si deve presentare il silenzio del singolo prezzo unitario come assenza di qualsiasi criterio fiscale. Questa è un'interpretazione normativa documentata, non una verifica delle fatture emesse dal venditore.

Non sono quindi mantenute come due stime equivalenti le letture arbitrarie «0,28 lordo» e «0,28 netto»: il criterio ufficiale seleziona la seconda salvo informazione esplicita contraria. Se un altro testo ufficiale pubblicato sul Portale la contraddicesse, il conflitto andrebbe conservato e risolto; non è stato individuato nelle schede esaminate.

## Dal canone lordo al metodo del Portale

Le [regole della spesa v4.2, pp.27 e 40](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf) usano `S(Q) = C + p × (Q − R)`, seguito dal calcolo di imposte e sconti pertinenti. `C` è il canone prima delle imposte, `p` il conguaglio netto, `R` il consumo di riferimento. Il conguaglio è anche negativo per consumi inferiori.

Sia `T(Q, profilo, componenti)` la funzione che applica le imposte ufficiali alle componenti. Se il testo pubblica un canone lordo esatto `G` al riferimento `R`, la conversione è possibile quando sono note le basi fiscali delle componenti. Non basta in generale una funzione del solo subtotale aggregato: nel gas le basi IVA fissa e a consumo possono avere aliquote diverse.

```text
C = soluzione di T(R, profilo, componenti del canone C) = G
Spesa(Q) = T(Q, profilo, componenti di C e del conguaglio p × (Q − R))
```

Quando l'attribuzione alle basi fiscali è fissata, è una trasformazione algebrica del metodo, non un secondo prezzo inventato. Il valore ricavato va conservato come dato derivato, con profilo, attribuzione fiscale e versione: non come componente originale trasmessa dal venditore.

Per la luce domestica, con `v = 10%` e accisa `A(Q)` determinata da residenza, potenza e consumo, si ottiene esplicitamente:

```text
C = G / (1 + v) − A(R)
Spesa(Q) = G + (1 + v) × [p × (Q − R) + A(Q) − A(R)]
```

Questo mostra perché dividere soltanto per l'IVA non è la conversione generale completa, ma anche perché l'accisa inclusa **non rende impossibile** la conversione: è un termine conosciuto una volta fissato il profilo. Non si aggiungono rete e oneri un'altra volta.

Per il gas il medesimo ragionamento usa §4.1.4: accisa, addizionale regionale e IVA per gli scaglioni pertinenti. Non è corretto applicare indistintamente `G / 1,10` o `G / 1,22`. La verifica dell'offerta ordinaria APIU GAS SICURO24CASA a Milano, 300 Smc, mostra contemporaneamente IVA al 10% per 35,38 € e al 22% per 10,47 €: stare sotto 480 Smc non comporta il 10% su ogni voce. Il documento non espone una regola specifica che ripartisca il canone lordo comprensivo dei consumi di riferimento fra queste basi. La distinzione non blocca i casi in cui l'allocazione si elimina per differenza, come la prova seguente.

## Prove numeriche e loro limiti

### Luce: la normalizzazione è eseguibile

Caso condizionale Fastweb Light: assumendo che il canone pubblicato di 768 € sia applicabile, cliente residente con potenza fino a 3 kW, riferimento 1.500 kWh e consumo 1.400 kWh. L'accisa è zero a entrambi i consumi secondo §3.1.6.1; il parametro ufficiale `iva_c` è 0,10. Con conguaglio netto 0,28 €/kWh:

`Spesa = 768 + 1,10 × 0,28 × (1.400 − 1.500) = 737,20 €`.

Non è un preventivo certo della scheda Light: dimostra che fiscalità e algoritmo non bloccano il calcolo quando il canone applicabile è noto. Il limite di quella scheda resta l'applicabilità dei 768 €, non una generica impossibilità di usare importi IVA inclusa.

### Gas: cinque punti di spesa sono determinati

Al consumo di riferimento il conguaglio è zero. I canoni sono espressamente comprensivi delle imposte e non sono accompagnati da «a partire da»:

| Scheda | Consumo annuo di riferimento | Totale pubblicato, prima dello sconto condizionato | Semplice conto contrattuale se la condizione permane per 12 mesi |
| --- | ---: | ---: | ---: |
| Start | 150 Smc | 432 € | 312 € |
| Light | 300 Smc | 660 € | 540 € |
| Pro | 600 Smc | 1.104 € | 984 € |
| Maxi | 900 Smc | 1.536 € | 1.416 € |
| Ultra | 1.200 Smc | 1.956 € | 1.836 € |

L'ultima colonna non è la base del confronto secondo il Portale: §3.4.7/4.3.6 considera gli sconti non condizionati, mentre qui è richiesta una fornitura luce attiva. È solo l'aritmetica dello sconto esplicitamente pubblicato. La stessa distinzione vale per lo sconto telecom delle offerte luce. La disponibilità per un cliente esclusivamente gas resta un problema di ammissibilità rispetto a Q26, non di formula.

Le prove sono ripetibili con [check-method.py](./evidenze/canone-2026-10-27/check-method.py); [risultati e checksum](./evidenze/canone-2026-10-27/method-check.json). Il test usa esclusivamente descrizioni e parametri salvati, senza rete. Non è un motore generale dell'applicazione.

### Gas: un costo diverso dal riferimento è determinabile

Per Milano la tabella pubblica del dettaglio del Portale riporta accisa 0,044 €/Smc per i primi 120 Smc, 0,175 €/Smc da 121 a 480, addizionale regionale zero. Le due simulazioni sintetiche dell'offerta ordinaria APIU GAS SICURO24CASA confermano accisa **36,78 € a 300 Smc** e **45,53 € a 350 Smc**. La [prova UI conservata](./evidenze/canone-2026-10-27/public-discovery/gas-tax-ui-cases.json) include anche una simulazione a 1.600 Smc che espone tutti e quattro gli scaglioni. Non sono aliquote ricostruite da una bolletta privata o dal sito del venditore.

Nel caso Fastweb Gas Flat Light, `G=660`, `R=300`, `p=1,50` netto. Il passaggio da 300 a 350 Smc resta nella fascia IVA a consumo del 10%; la parte del canone già inclusa nel totale di riferimento non cambia. L'eventuale ripartizione originaria del canone fra aliquote diverse si elimina per differenza:

```text
Spesa(350) = 660 + 1,10 × [1,50 × (350 − 300) + (45,53 − 36,78)]
           = 752,125 € → 752,13 €
```

È un costo ricavato con i dati e i criteri ufficiali, senza lo sconto condizionato. Non dimostra che un nuovo cliente che dichiari già 350 Smc sia ammesso alla taglia Light: testo della taglia e regola sugli extra permettono di calcolare il consumo del contratto, mentre ammissibilità alla sottoscrizione e raccomandazione rimangono distinte. Il caso non riguarda l'anno dopo il rinnovo.

### Gas: perché non estendere automaticamente la stessa scorciatoia oltre 480 Smc

La stessa aliquota non copre una variazione che attraversa 480 Smc. A 500 Smc due allocazioni ipotetiche illustrano l'informazione necessaria:

- **A:** tutto il canone netto è una quota fissa al 22%; la componente netta `p × (Q−R)` è ripartita proporzionalmente sui consumi effettivi per applicare le fasce IVA.
- **B:** si separano un residuo fisso `C−pR` e una componente `pQ`, applicando le fasce IVA alla seconda.

Entrambe si possono ancorare esattamente allo stesso totale lordo di 660 € a 300 Smc; non basta confrontare due canoni netti uguali, perché sarebbero basi diverse. Il controllo decimale ancorato dà a 500 Smc **950,982 € e 953,142 €** per la parte commerciale lorda, prima di aggiungere lo stesso contributo di accise/addizionali: differenza **2,16 €**. Sotto 480 Smc la medesima differenza si annulla, come deve accadere nel caso 350.

Queste non sono due alternative di prezzo da mostrare all'utente, né due algoritmi entrambi prescritti dal Portale. È una prova della necessità di scegliere e documentare l'allocazione fiscale: l'equivalenza algebrica del subtotale netto non garantisce l'equivalenza del totale con aliquote diverse. Nei capitoli del canone e delle imposte esaminati non è stata trovata una prescrizione che selezioni l'allocazione per questi canoni lordi. Non si assume che il Portale effettui A o B.

Il punto documentale preciso è questo: p.40 identifica `PfixOC` con macroarea 01 e unità €/anno, mentre §4.1.4 pp.33–34 esprime l'IVA tramite `IVAFn × IMPONIBILE`. Non specifica come ripartire fra le basi al 10% e al 22% un canone che incorpora già un consumo di riferimento, né se il termine `p × (Q−R)` si attribuisca alle fasce sui consumi effettivi `Q`, alla sola differenza `Q−R` o alla differenza fra due basi sui consumi inclusi/effettivi. Il solo metadato €/anno non documenta quella trasformazione. La tabella fiscale dell'offerta ordinaria mostra l'esistenza delle due aliquote; non prova il mapping del canone. Serve questa regola, oppure una rappresentazione ufficiale delle basi del canone che renda la regola superflua: non un generico chiarimento su tutte le imposte.

## Informazioni davvero mancanti e informazioni che non bloccano il calcolo

| Informazione | Stato e conseguenza |
| --- | --- |
| Regola matematica del canone fisso | Presente nel metodo ufficiale: nessuna necessità di inventarne una. |
| Consumo incluso e conguaglio delle nove Fastweb con prezzi | Presenti; il segno del conguaglio è esplicito. Non occorre una previsione PUN/PSV per questi prezzi fissi. |
| Regola generale netto/lordo | Presente; canone e sconto hanno una dichiarazione esplicita di inclusione delle imposte. Non conteggiarla come informazione del tutto assente. |
| Canone gas esatto | Presente per tutte le cinque taglie; nessuna tabella commerciale ulteriore è dimostrata necessaria. |
| Aliquote territoriali gas necessarie a un consumo diverso dal riferimento | Assenti nei CSV ML/PLACET controllati, ma recuperate dal dettaglio ufficiale per Milano. Sono sufficienti alla prova 300→350. Va coperta la fiscalità degli altri territori; non usare un forfait. |
| Ripartizione fiscale del canone gas quando cambiano le aliquote applicabili | La formula netta è nota; l'allocazione del canone lordo alle basi IVA non è specificata nei passaggi esaminati. Non è lecito scegliere automaticamente una diversa scomposizione solo perché ha lo stesso subtotale netto. |
| Applicabilità del canone luce minimo | Non risolta nella scheda. Non è dimostrata l'esistenza di una matrice diversa; manca il dato che consenta di scegliere universalmente il minimo o un altro importo. |
| Durata delle condizioni | Le schede parlano di canone annuo bloccato e conguaglio annuale. Non si deduce che manchi un prezzo del primo anno solo perché non è esposto il campo `DURATA`. Le date di pubblicazione/sottoscrizione non sono la durata del prezzo. Nessuna estensione a rinnovi o anni successivi è qualificata. |
| Codice offerta e flag XML del ramo | Utili per identità, aggiornamenti e interoperabilità; la loro mancata esposizione HTML non impedisce da sola l'aritmetica dei numeri già presenti. |
| Importi Partner Light e Casa Mia | Mancano realmente nelle descrizioni; le altre schede non possono sostituirli. |

La non identificabilità del canone luce minimo è dimostrabile senza dichiarare che esista davvero una specifica tabella nascosta. Due relazioni ipotetiche, «768 € per ogni profilo ammesso» e «768 € per un sottoinsieme, importo superiore per altri profili», sono entrambe compatibili con il testo osservato. Nessun campo della scheda seleziona la relazione corretta. Questo è un controesempio logico sulla sufficienza dell'informazione, non una ricostruzione dei prezzi del venditore.

**Conclusione:** non va respinta l'intera famiglia dei canoni, né richiesta una fonte del fornitore per principio. Sono determinabili i cinque valori gas al riferimento e almeno il caso Light Milano 350 Smc; la generalizzazione richiede copertura fiscale territoriale e un'allocazione IVA qualificata nei casi in cui cambia l'aliquota. Le quattro schede luce con prezzo hanno un punto specifico da risolvere sul canone applicabile. Le altre quattro schede non contengono i prezzi necessari. La presenza nella sezione senza simulazione del Portale non è, da sola, una prova di impossibilità matematica.
