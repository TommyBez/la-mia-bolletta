# 02: Coefficienti mensili: script manuale, importazione e lettura

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/8; dipendenze native verificate.

## What to build

Un operatore lancia lo script separato, valida i coefficienti impliciti e importa uno snapshot nel DB; il servizio restituisce la versione utilizzabile e i relativi metodi.

## Acceptance criteria

- [ ] Q43: esecuzione manuale mensile, nessuno scheduler e nessuna simulazione Portale nel confronto utente. Nessun dato energetico a pagamento.
- [ ] Sonde e condizioni ufficiali, input sintetici, risposte sanificate, componenti sottratte, incertezza e verifiche indipendenti conservati. Gestire sonde scadute e cambiamenti del calcolatore.
- [ ] F0/F1/F2/F3/F23, PSV e periodicità equivalenti; per Peak/OffPeak qualificare coefficienti annui effettivi per firma economica/versione dei record osservati, distinguendo fisse/variabili e componenti regolate, con componenti incluse e dominio dichiarati. Completare controlli sulle nuove fisse del catalogo29ottobre con prezziPeak/Offdiversi; nessuna pubblicazione come scenario completo prima dei controlli. Non presentarli come8forwardtrimestrali né fare IF sul codice offerta; nessuna rinomina arbitraria Peak→F1 o OffPeak→F23.
- [ ] Importazione valida atomica, rifiuto di record mancanti/incoerenti e versioni fuori ordine; interfaccia operativa mostra esito e versione leggibile dall’applicazione.
- [ ] Q44/Q47: quattro trimestri dal trimestre corrente e snapshot del mese corrente; dati assenti non diventanozero. RipiegoGME+nostra elaborazione è esplicito e validato se il recupero non è operativo, mai sostituzione silenziosa.
- [ ] Test script/importazione→lettura con snapshot congelati e risultati numerici indipendenti; testano le formule di deduzione e i controlli, non soltanto validitàJSON.

## Blocked by

Nessuno: può partire subito dopo approvazione della specifica e del piano.

## Qualifica Peak/OffPeak disponibile e confine della consegna


Il29ottobre2026 sono stati verificati14casi numerici e4controlli di invarianza mensile/configurazione. Cinque variabili osservate sono coperte; nell'export del29ottobre sono presenti anche otto nuove fisse con prezziPeak/Offdiversi, di cui due rappresentanti verificati. Completare la qualifica di tutti i fingerprint prima di pubblicare uno scenario completo: gli altri sei non sono già testati.

Per questo ramo le distribuzioni mensili non hanno separato i trimestri: NON dichiarare recuperati otto forwardPeak/Off. La ricetta qualificata è una vendita annua effettiva `A + b1*F1 + b2*F2 + b3*F3`, con unità, componenti comprese e applicabilità esplicite. Tre profili a consumo concentrato in una sola fascia calibrano i coefficienti; un nuovo profilo misto e di volume differente deve verificarli. Codice/fingerprint sono dati per selezionare lo snapshot, non condizioni hardcoded nel motore.

Esempi ufficiali per fixture indipendenti:

| Record | A, euro/anno | Vendite con3000kWh soltanto inF1/F2/F3, euro | Nuovo profiloF1/F2/F3 | Vendita osservata, euro |
| --- | ---: | --- | --- | ---: |
| 029878ESVFL03XX000002DOM2VAR2BIO |144|843,22 /844,28 /849,00|1234/987/1779|1080,07|
| 024632ESVFL01XXSTDDOMVARPOP00007 |194,30 (153,12+PCV41,18)|990,91 /993,21 /985,61|876/543/2100|1125,43|
| 003450ESFML01XX00000010073721026 |133,2311|708,93 /688,60 /654,73|1200/700/2000|840,77|

A e b comprendono le componenti di vendita dichiarate dalla calibrazione: non sommare di nuovo spread,PCV/PPE,dispacciamento già inclusi. Rete/oneri/imposte restano separati. Il casoSTD è passato anche a6kWnonresidente per il medesimo profilo, ma non autorizza un dominio universale: conservare i vincoli testati. Il precedente tentativo di sottrarre un soloPPEscalare è stato falsificato e scartato. Tolleranze da propagazione degli arrotondamenti dei campioni e dell'osservazione, non soglie scelte per nascondere residui.

Acquisire il catalogo effettivo tramite [OpenData ufficiali](https://www.ilportaleofferte.it/portaleOfferte/it/open-data.page). Regole e configurazionePeak/Offsono definite dal tracciatoAU e dal VademecumPCErichiamato dalla nota14; questa ricetta operativa non afferma di aver ricostruito un mapping fisico universale delle fasce.
