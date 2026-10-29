# Qualifica dei riferimenti territoriali e profili nazionali

29 ottobre 2026. Ricerca e materializzazione di fonti primarie istituzionali, senza siti di fornitori o dataset commerciali. Nessuna modifica al motore applicativo o ai ticket. Non si confonde il profilo usato dal Portale con una nuova classificazione climatica legale.

## Esito operativo

Sono materializzati **7.894 codici comunali ISTAT unici**, con denominazione, regione, provincia e appartenenza a uno dei **sette ambiti tariffari gas**. I **sette profili AU gas 2026/27** sono estratti con dodici valori mensili ciascuno e verificati con aritmetica decimale: somma100% entro0,000001 punti percentuali.

La tabella climatica normativa consolidata contiene8.234righe. Il join conservativo per nome normalizzato/provincia/regione associa **7.605 comuni attuali**; rimangono **288 nomi mancanti** e **un caso ambiguo, Trento**. Non è una copertura climatica nazionale completa e non si riempiono le eccezioni per somiglianza del nome o per provincia. Le liste complete sono già nel dataset, non un rinvio generico a una ricerca futura.

È stato inoltre verificato un canale ufficiale per risolvere il **profilo di calcolo** delle eccezioni: con una sonda gas semplice e coefficienti PSV già recuperati, la vendita energia identifica univocamente il profilo C1B/C/D/E/F usato dal Portale. Sono stati verificati un comune fuso non presente nell'allegato storico, un caso normativo ambiguo e un codice comunale storico ancora usato dal Portale; un nuovo consumo verifica il risultato senza rifittare i coefficienti.

## Fonti scaricate e loro efficacia

1. **Anagrafica ISTAT.** [Pagina istituzionale](https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/) e [XLSX permanente](https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx), foglio “CODICI al21_02_2026”. È la versione pubblicata alla data della ricerca, non una dichiarazione di aggiornamento giornaliero. Contiene20regioni e7.894comuni. La riforma Sardegna2026 cambia provincia e codice di tutti i comuni interessati; denominazioni e codici storici non vanno mescolati al codice corrente.
2. **Ambiti gas vigenti.** [Delibera ARERA532/2025](https://www.arera.it/atti-e-provvedimenti/dettaglio/25/532-25) prolunga la regolazione al2026–2027. L'[effettivo Allegato B RTDG](https://www.arera.it/fileadmin/allegati/docs/25/_532-25_Allegato_B_-_RTDG.pdf), art43.2 pp45–46, è stato scaricato e letto: include esplicitamente l'ambito Sardegna, oltre ai sei ambiti continentali/Sicilia. Il primo URL ipotizzato con nome diverso restituiva “File non disponibile”; quella risposta è conservata come tale, non come PDF letto. Anche il [comunicato ARERA10giugno2026](https://www.arera.it/comunicati-operatore/dettaglio/tariffe-di-riferimento-provvisorie-2026-pesi-per-la-determinazione-dei-contributi-e-valori-della-tariffa-di-riferimento-dufficio) espone i sette ambiti. Il mapping salvato usa chiavi semantiche proprie, non presume numerazioni interne del Portale.
3. **Classificazione climatica normativa.** [DPR412/1993, Allegato A nella banca normativa istituzionale DEF](https://def.giustiziatributaria.gov.it/DocTribFrontend/getAttoNormativoDetail.do?ACTION=getArticolo&articolo=Allegato+A&codiceOrdinamento=60A+++++0000000&id=%7B0E4DC3BD-3B00-45E2-9CA6-B4DECB631C36%7D), testo consolidato indicato in vigore dal9agosto2016, modificato dalDM27giugno2016. Il testo HTML contiene l'intera tabella; estratto come dato inerte senza eseguire lo script della pagina. Il DPR art2 consente aggiornamenti e provvedimenti comunali: il match di un nome attuale non certifica l'assenza di atti locali successivi. Vi sono refusi e nomi storici nella fonte, per esempio BAIROL invece di Bairo; non sono corretti con fuzzy matching automatico.
4. **Profili di consumo.** [Regole AUv4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), appendice p45: C1zoneB–F, C2cottura/ACS, T1tecnologico, ottobre2026–settembre2027. L'estrazione conserva l'ordine dei mesi e la precisione originaria; non normalizza silenziosamente i piccoli residui di arrotondamento.

Il file ISTAT “Variazioni amministrative1991–2025” scaricato dalla stessa pagina contiene **conteggi aggregati**, non il crosswalk puntuale di tutti i comuni fusi: non è stato usato per inventare predecessori. I codici ISTAT alternativi per layout provinciali sono conservati come **codifiche per assetto geografico**, non come prova che il comune esistesse nell'anno indicato. Per esempio il nuovo Castegnero Nanto ha lo stesso nuovo codice nei campi di layout: quei campi non sostituiscono le date di istituzione.

## Copertura materializzata Comune→regione→ambito

| Ambito geografico | Comuni ISTAT |
| --- | ---: |
| Nord occidentale | 1.488 |
| Nord orientale | 2.887 |
| Centrale | 590 |
| Centro-sud occidentale | 928 |
| Centro-sud orientale | 829 |
| Meridionale | 795 |
| Sardegna | 377 |
| Totale | 7.894 |

Questo è il mapping geografico delle tariffe, non una dichiarazione che gas naturale e offerte siano disponibili in ogni comune. I flag ufficiali di esclusione del Portale rimangono necessari per il perimetro della ricerca.

## Eccezioni climatiche: metodo verificato sul Portale

Sonda **ZERO FLEX**, codice000971GSVML01XXPROD1300109202600: quota174€/anno, spreadzero. Sono usati i quattro PSV indipendenti di [questa qualifica](./sonda-au-gas-trimestri-2026-10-28.md). A1200Smc con riscaldamento, le vendite attese per i profili pubblicati sono:

| Profilo | Vendita attesa non arrotondata, € |
| --- | ---: |
| C1B | 1.190,282230 |
| C1C | 1.179,997818 |
| C1D | 1.173,355617 |
| C1E | 1.180,163273 |
| C1F | 1.166,781584 |

Il più piccolo divario fra candidati supera0,16€, mentre la tolleranza prudente della prova è0,02€ considerando arrotondamenti delle due acquisizioni. Non si usano rete, imposte o IVA per identificare il profilo.

| Comune/codice usato | Vendita osservata | Esito |
| --- | ---: | --- |
| Borgo d'Anaunia022252,1200Smc | 1.166,78€ | Solo C1F compatibile; nome attuale assente dalla tabella normativa storica |
| Borgo d'Anaunia022252,600Smc | 670,39€ | Holdout: C1F predice670,390792€ senza rifit |
| Trento022205,1200Smc | 1.166,78€ | Solo C1F compatibile come **profilo operativo Portale** |
| Castegnero024027,1200Smc | 1.180,16€ | Solo C1E compatibile sul vecchio codice riconosciuto dal Portale |

La previsione600Smc è stata registrata prima di leggere la risposta; la richiesta era già partita. La formula e i coefficienti erano già fissati indipendentemente. I nuovi profili server normalizzati confermano comune, volume e usoRISC; per la prima query Trento il parser precedente conservava solo richiesta/script e dettaglio economico, non il profilo JSON completo.

**Trento:** nella fonte DEF compaiono due righe, `TN E2567 194 TRENTO` e `TN F3001 431 TRENTO`. Si conserva il conflitto. La risposta del Portale dimostra quale profilo usa la simulazione, non autorizza a rinominare legalmente Trento in zonaF. Separare nel modello il dato normativo dal profilo di calcolo dedotto e dalla sua provenienza/versione.

**Castegnero Nanto:** l'ISTAT corrente identifica il nuovo comune024129, istituito21febbraio2026. Il geoService del Portale interrogato per “Castegnero” restituisce ancora Castegnero024027. La sonda con024129 non trova l'offerta, mentre con024027 calcola. Questo non prova da solo che ogni servizio del Portale ignori il nuovo codice; dimostra che non si può sostituire ciecamente il codice attuale al codice riconosciuto dalla fonte. Serve un crosswalk versionato e documentato, eventualmente mantenendo le identità territoriali originarie, senza scegliere arbitrariamente un solo predecessore del comune fuso.

**San Teodoro:** il conflitto fra il comune sicilianoME(zonaE) e quello sardo storicamenteNU(zonaB) è risolto dal contesto regionale della tabella e dal codice corrente113021/regione20. Non si assegna una zona attraverso il solo nome globale.

**ZonaA:** l'appendiceAU non pubblica un C1A. I due comuni della tabella normativa in zonaA, Porto Empedocle084028 e Lampedusa e Linosa084020, restituiscono entrambi `esclusoOffertaGas=1` nel geoService ufficiale. Lampedusa ha anche esclusioneEE. Per il perimetro ufficiale osservato non serve inventare una riga C1A; il flag va letto come stato della fonte, non trasformato in prova astratta di assenza di qualunque rete/combustibile nel territorio.

## Cosa è chiuso e cosa rimane implementazione/accettazione

Sono qualificati i canali e i metodi: anagrafica ufficiale corrente, sette ambiti vigenti2026–27, profili nazionali e loro precisione, parser della tabella normativa, lista finita delle eccezioni e un metodo sperimentale verificato per identificare il profilo operativo delle eccezioni riconosciute dal Portale.

Il dataset non viene spacciato per mappa climatica completa e aggiornata di tutti i comuni. Nel ticket dei riferimenti servono: riconciliare le288assenze e l'ambiguità, verificare codici riconosciuti dal Portale e successioni temporali, mantenere evidenze delle eccezioni, testare efficacia e copertura. Il confronto nazionale completo non si dichiara passato finché ogni comune gas applicabile non ha riferimenti utilizzabili. Non è una nuova scelta di prodotto da chiedere all'utente, né un permesso di escludere offerte simulabili.

## Riproduzione

Cartella [evidenze](./evidenze/riferimenti-territoriali-2026-10-29/): `build-territorial-references.py` materializza i dataset e verifica7894identità,20regioni,7ambiti e somme dei profili; `verify-portal-profiles.py` controlla identificazione univoca, holdout e flag dei casiA. Richiedono il Python conopenpyxl già disponibile nel runtime workspace; nessun costo o installazione. I file `municipalities.json`, `coverage.json`, `unresolved-climate.json`, `gas-profiles-2026-2027.json`, `portal-profile-checks.json` e il manifest con URL/SHA256 rendono il risultato riproducibile. Le copie raw istituzionali sono conservate; nessun cookie/CSRF nei frammenti economici pubblicati.
