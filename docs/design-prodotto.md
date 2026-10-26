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
| Q12 | Conservare l'originale della bolletta solo durante estrazione e revisione, eliminandolo dopo la conferma. | Conservare i dati necessari al confronto; una nuova lettura richiede un nuovo caricamento. Il salvataggio del profilo è una scelta esplicita. |
| Q13 | Adottare la variante A — Il consiglio — del prototipo dei risultati. | Raccomandazione dominante, costo annuo e risparmio in evidenza, spiegazione del confronto e alternative successive. La resa si adatta al telefono mantenendo questa gerarchia. |

Le decisioni Q1–Q12 sono state confermate dall'utente in quattro giri successivi. Dopo aver esaminato il prototipo, l'utente ha confermato Q13 con «va bene A». Le ulteriori proposte UX presenti nello studio di fattibilità non costituiscono ancora decisioni approvate.

## Percorso concordato

Ingresso con bolletta o dati manuali → conferma dei dati letti dalla bolletta → raccomandazione e classifica consultabile → scheda dell'offerta → sito del fornitore.

Luce e gas possono essere completati in momenti diversi. Se il contratto attuale non è ricostruibile, il percorso prosegue con i costi stimati delle alternative e senza quantificare un risparmio rispetto all'attuale.

## Prototipo visuale

Il primo prototipo confronta tre strutture della schermata risultati, usando gli stessi dati sintetici: consiglio in primo piano, confronto affiancato, elenco con dettaglio. Include revisione del profilo e scheda dell'offerta. **La variante A è stata scelta il 26 ottobre 2026.** Le tre varianti rimangono nel branch `codex/prototype-confronto` come riferimento della scelta.

La scelta approva la direzione visuale e la gerarchia della schermata risultati. Nomi delle offerte, importi, formula illustrativa e campi ridotti del profilo restano esempi del prototipo. La [bozza di specifica della prima tranche](./spec-risultati-a.md) descrive la riscrittura dell'interfaccia e le verifiche proposte.

Non è ancora una specifica finale o un comparatore funzionante: OCR, acquisizione dei dati e calcolo delle tariffe non sono implementati. Per Q12 restano da definire la scadenza delle sessioni abbandonate e il trattamento degli originali presso eventuali fornitori OCR; il prototipo non carica né conserva bollette.
