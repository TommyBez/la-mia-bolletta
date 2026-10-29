# 05: Profilo manuale → confronto gas reale via web e MCP

**Stato:** pubblicato: https://github.com/TommyBez/la-mia-bolletta/issues/11; dipendenze native verificate.

## What to build

Una persona conferma un profilo gas manuale e ottiene costi e offerte reali ordinate in web/MCP, con profilo territoriale, scaglioni e imposte applicati.

## Acceptance criteria

- [ ] Confronto fisso/variabile con tutte le famiglie gas simulabili nel perimetro, distribuzioni ufficiali e riferimentoSmc; nessuna conversione arbitraria dam³.
- [ ] RegoleQ36–38: minimo numerico fra specifici applicabili, defaultsolo scoperti, variabile alpareggio; scaglioni commerciali mediante cumulato a metàmese, prezzoall’interomese. Imposte/regolati mantengono metodi propri.
- [ ] Fiscalità normativa corretta, anomaliaSenza Pensieri mantenuta come divergenza nota; non replicareIVA erronea per forzareparità.
- [ ] Matrice territoriale/fiscale efficace e consumo anno termico/finestraQ44 verificati; nessuna estensione delle proveNov→Ott aOtt→Sett senza test.
- [ ] Stessi contratti di risultato/errori, revisioni e versioni del confronto luce. Nessun ranking dichiarato completo escludendo record complessi.
- [ ] Testprofilo/versioni→costo e percorsoweb/MCP con valori attesi indipendenti, soglie commerciali/fiscali, profili e confini territoriali. Implementazione autonoma rispetto al ticketluce.

## Blocked by

1, 2
