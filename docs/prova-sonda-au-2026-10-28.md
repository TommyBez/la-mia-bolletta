# Prova di estrazione indiretta delle medie AU — 28 ottobre 2026

**Esito successivo:** il limite alle sole medie annue di questa prima prova è stato superato. La [verifica completa successiva](./recupero-indici-au-2026-10-28.md) recupera quattro coefficienti temporali per F0/F1/F2/F3/F23 e gas mediante consumi mensili sintetici, con nuovi holdout e controlli tra venditori. Questa nota conserva il primo esperimento e i suoi errori corretti, non lo stato finale dell'indagine.

## Esito

La sonda funziona per ricavare **coefficienti medi annui impliciti per fascia**, nel campione elettrico verificato. La formula ricavata da tre simulazioni del 27 ottobre riproduce sette nuove simulazioni ufficiali del 28 ottobre con scarti inferiori a un centesimo, compresa una seconda offerta dello stesso venditore con diversa quota fissa e spread. Non sono stati ricavati univocamente i quattro prezzi trimestrali per fascia, né verificati gas, altri indici o tutti i venditori.

## Fonti e protocollo

- Normale modulo pubblico anonimo del [Portale Offerte](https://www.ilportaleofferte.it/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page), con validazione del codice offerta e successivo dettaglio della spesa. Nessun account o dato personale reale; profili sintetici, Pescara, domestico residente, 3 kW. Nessun sito del fornitore consultato.
- [Catalogo XML ufficiale del 27 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/offerteML/2026_10/PO_Offerte_E_MLIBERO_20261027.xml): estratti conservati per le due offerte valide durante la prova.
- [Parametri ML ufficiali del 28 ottobre](https://www.ilportaleofferte.it/portaleOfferte/resources/opendata/csv/parametriML/2026_10/PO_Parametri_Mercato_Libero_E_20261028.csv): `lambda=0.100000`, `cdispd=0.016776`; CSV completo archiviato.
- [Regole per il calcolo v4.2](https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf), §§3.4.1.5–6: media dei quattro indici trimestrali, perdite sul forward, spread già comprensivo delle perdite. La formula domestica pubblicata illustra F1/F23; il comportamento triorario distinto è verificato sperimentalmente, senza presumere che tutti i casi domestici siano biorari.
- [ARERA, metodologia](https://www.arera.it/dati-e-statistiche/dettaglio/it/dati/stimaspesa): quattro trimestri dal trimestre corrente, aggiornamento mensile.

Offerta sonda **+ CASA SPECIAL**, `001686ESVFL00XXES3PC1026DO000000`: indice codice12, quota fissa120 €/anno, spread0,0275 €/kWh identico F1/F2/F3, dispacciamento CdispD. Il dettaglio ufficiale conferma le componenti.

I tre punti di calibrazione precedenti sono F1/F2/F3=3000/0/0 →832,09 €, 1000/2000/0 →849,14 €, 1000/0/2000 →793,44 €. La formula iniziale, mantenuta invariata per tutte le verifiche, è:

`vendita = 120 + 0,237363333333… × F1 + 0,245888333333… × F2 + 0,218038333333… × F3`.

Sono coefficienti di vendita comprensivi di spread, perdite e CdispD, non direttamente l'indice AU. I consumi server normalizzati sono stati controllati per ogni risposta: il totale coincide con la somma delle fasce, senza fallback a percentuali standard.

## Verifiche nuove, senza rifittare i coefficienti

Importi della sola **vendita**, non della spesa complessiva comprensiva di rete, oneri e imposte. Predizioni da valori di calibrazione già arrotondati: tolleranza fissata a2centesimi; scarto effettivo massimo0,005 € rispetto al valore predetto non arrotondato.

| Offerta | F1/F2/F3 kWh | Predizione dalla formula, € | Portale, € |
| --- | --- | ---: | ---: |
| SPECIAL | 1000/1000/1000 | 821,290000 | 821,29 |
| SPECIAL | 2000/500/1500 | 1044,728333… | 1044,73 |
| SPECIAL | 2000/2000/2000 | 1522,580000 | 1522,58 |
| SPECIAL | 1500/0/0 | 476,045000 | 476,04 |
| SPECIAL | 0/3000/0 | 857,665000 | 857,66 |
| SPECIAL | 1000/1000/2000 | 1039,328333… | 1039,33 |
| UNICA | 1000/1000/1000 | 861,790000 | 861,79 |

La seconda offerta **+ CASA UNICA**, `001686ESVFL00XXES2PC1026DO000000`, mantiene indice, fasce e dispacciamento; l'XML dichiara quota fissa144 € e spread0,033 €/kWh. La predizione è `821,29 + (144−120) + (0,033−0,0275)×3000 = 861,79`. Il numero è stato registrato prima della query. La verifica dimostra trasferibilità tra questi due record, non automaticamente tra ogni prodotto.

**Errore aritmetico nella predizione iniziale:** per2000/500/1500 era stato registrato1044,09 €. Il Portale ha restituito1044,73 €. Il ricalcolo indipendente con Decimal mostra che la formula originaria dava già1044,728333…; non è stato necessario cambiare coefficienti o intercetta. Il numero preregistrato rimane visibile nel file originale. Il temporaneo tentativo di attribuire lo scarto a un'intercetta118,085 è stato falsificato dagli altri controlli e ritirato. Non esiste, in queste prove, un'anomalia4000kWh da imputare al Portale.

## Medie di indice ricavabili

Applicando la scomposizione verificata `indice_medio_implicito = (coefficiente_vendita − spread − CdispD)/(1+lambda)`:

| Fascia | Media annua implicita, €/kWh | €/MWh |
| --- | ---: | ---: |
| F1 | circa0,175534 | circa175,534 |
| F2 | circa0,183284 | circa183,284 |
| F3 | circa0,157966 | circa157,966 |

Questi valori sono **dedotti dalle simulazioni**, non un file AU pubblicato o valori trimestrali certificati. L'approssimazione include l'arrotondamento delle risposte al centesimo; non pubblicare tutte le cifre del calcolo come precisione acquisita. Sono compatibili con le sette risposte e la scomposizione delle componenti esaminate.

## Limite decisivo per sostituire lo scenario

Ogni media annua fornisce una combinazione dei quattro valori trimestrali. Cambiare soltanto i consumi annui per fascia non cambia i pesi temporali e non identifica quattro incognite indipendenti. Per recuperare i trimestri occorrono simulazioni con almeno quattro pesature temporali indipendenti e note per ogni indice/fascia, verificandone l'effettivo uso da parte del server. La presenza di campi mensili nel JavaScript pubblico non costituisce una prova runtime di questa possibilità; in questa prova non sono stati inviati consumi mensili o usate funzionalità collegate a forniture autenticate.

Inoltre la finestra ufficiale corrente ottobre2026–settembre2027 non copre ottobre2027 del periodo progettuale novembre2026–ottobre2027. Nessuna estrapolazione di quel mese è stata dimostrata. La scelta Q41 rimane il metodo iniziale approvato: questo esperimento ne offre un riferimento ufficiale implicito per controlli e una possibile alternativa da qualificare, senza sostituirla silenziosamente.

## Materiale riproducibile

[Risultati e coefficienti](./evidenze/sonda-au-2026-10-28/results.json), [predizioni registrate](./evidenze/sonda-au-2026-10-28/predictions-before-query.json), [manifest con URL e SHA256](./evidenze/sonda-au-2026-10-28/manifest.json), [script](./evidenze/sonda-au-2026-10-28/probe-public-form.py). Nella stessa cartella sono conservati i profili normalizzati, gli estratti economici HTML senza cookie/token, le validazioni pubbliche, gli estratti XML e il CSV parametri. Gli script derivano dal probe pubblico precedente; richiedono accesso di rete e non costituiscono un servizio di acquisizione già operativo.
