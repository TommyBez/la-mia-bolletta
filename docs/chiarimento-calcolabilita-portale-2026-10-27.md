# Pubblicazione e calcolabilità delle offerte

Chiarimento del 27 ottobre 2026 sulla contestazione «le offerte pubblicate sul Portale devono essere tutte calcolabili». Verifica circoscritta della documentazione ufficiale già acquisita e della descrizione del caso Fastweb Luce Flat Light. Nessun sito o documento del fornitore consultato.

La successiva [verifica completa sui tredici casi](./verifica-calcolabilita-canoni-2026-10-27.md) precisa cosa si può già calcolare e quali dati o regole mancano davvero. In particolare, il lordo del canone e la collocazione nella sezione senza simulazione non impediscono da soli la ricostruzione.

## La distinzione prevista dal Portale

La pubblicazione sul Portale non implica necessariamente una stima nel comparatore ordinario. Le fonti ufficiali descrivono espressamente un secondo percorso:

- La [FAQ del Portale, domanda sulle offerte senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/domande_frequenti.page#FAQ1095), definisce una sezione per offerte la cui spesa annua non può essere simulata con le regole correntemente utilizzate dal gestore. Sono pubblicate descrizioni delle caratteristiche principali.
- Le [specifiche AU v5.0, §7.2, pp. 63–65](https://siiportale.acquirenteunico.it/documents/11387888/11426817/Funzionamento+e+Specifiche+del+Processo+di+Trasmissione+Offerte+Mercato+Retail_v5.0.pdf/c7fb0256-ce8d-0977-3356-227cfaa91443?version=1.0&t=1765796222946&download=true), prevedono un tracciato per trasmettere tali offerte e pubblicarle in una pagina dedicata. Quando diventano disponibili algoritmi idonei, il venditore può ritrasmetterle nel tracciato ordinario perché entrino nei risultati della ricerca.
- Il [documento ARERA 245/2025/R/com, p. 26, nota 16](https://www.arera.it/fileadmin/allegati/docs/25/245-2025-R-com.pdf), conferma la distinzione fra offerte generalizzate simulabili e non simulabili, richiamando l'articolo 10, comma 8, del Regolamento di funzionamento. È un documento di consultazione: qui si usa il richiamo descrittivo della distinzione, senza presentare le successive proposte come disposizioni già approvate.

Questo dimostra un'eccezione esplicita all'idea che ogni pubblicazione debba già avere un calcolo nel comparatore. Non dimostra che le condizioni contrattuali siano incomplete, che l'offerta sia matematicamente impossibile da calcolare o che il venditore sia inadempiente. La qualificazione è relativa agli algoritmi del Portale.

Il tracciato di trasmissione delle non simulabili richiede, fra l'altro, codice offerta e tipo cliente. L'assenza di questi campi nelle schede HTML osservate riguarda la loro esposizione pubblica nella pagina: non autorizza ad affermare che Acquirente Unico non li possieda.

## Correzione della spiegazione sul caso Fastweb

La [pagina ufficiale delle offerte luce senza calcolo](https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType=ELETTRICO) contiene la scheda Fastweb Luce Flat Light (`modal-14146`). La [descrizione acquisita](./evidenze/canone-2026-10-27/selected-portal-descriptions.json) riporta: canone annuo a partire da 768 €, consumo fino a 1.500 kWh, potenza fino a 6 kW, conguaglio e sconto condizionato. Afferma inoltre che la scelta della fascia considera potenza, consumo e tipologia d'uso.

La spiegazione precedente era troppo categorica in due punti:

1. La dicitura «a partire da» **non dimostra da sola** che per questo stesso prodotto vi siano canoni diversi secondo il profilo. La frase sulla scelta della fascia non è una tabella dei prezzi per profilo. Non è stato dimostrato quale parametro determini un eventuale aumento rispetto a 768 €.
2. Non è stato dimostrato che la mancanza di una tale tabella sia **il motivo** per cui questa offerta è nella sezione senza calcolo. La pagina e il documento generale non pubblicano una diagnosi tecnica individuale della scheda.

La formulazione sostenuta dalle evidenze è: **il Portale pubblica questa offerta nella sezione senza stima; il testo osservato non è stato qualificato come base sufficiente per applicare 768 € indistintamente a tutti i profili ammessi.** È un limite della nostra verifica, non la prova che i prezzi contrattuali non esistano o che nessun calcolo sia possibile.

Per il progetto rimangono separate tre verifiche: presenza nella fonte ufficiale, sufficienza dei dati pubblicamente acquisibili per il profilo, applicabilità di un metodo ufficiale. Non si introduce un algoritmo alternativo o si esclude una famiglia come sconveniente per risolvere questa distinzione.
