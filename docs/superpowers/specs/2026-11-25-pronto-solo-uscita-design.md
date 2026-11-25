# «Pronto» lo segna solo l'uscita — progetto (versione 39)

## Perché
Alla serata del 21/11/2026 i fritti segnavano «Pronto» in cucina e i primi no: non c'era una regola. La ragazza all'uscita ha chiesto alla cucina di non premere e ha segnato tutto lei. In ogni serata c'è sempre qualcuno a distribuire (a volte più «stand», ognuno col suo reparto), quindi la regola diventa fissa: **la cucina cucina, l'uscita segna Pronto**.

Chi era alla distribuzione ha chiesto anche che gli **ordini uniti** («12 + 13») siano una riga sola anche nella sua lista.

## Obiettivi
1. In cucina spariscono, per sempre, tutti i tasti che cambiano lo stato dei piatti: «Pronto», «Pronti N», «Tutto pronto» / «Segna pronti questi», i campi per segnare pronta una parte, e nella lista dei pronti «Portato» e «Annulla».
2. All'uscita, nella lista «In preparazione», gli ordini uniti diventano una riga sola con il piatto sommato («6 Pizzoccheri · n. 12 + 13»), con il campo per segnarne pronta solo una parte («Pronti 4») come oggi in cucina.

## Cosa NON cambia
- **Bar:** usa la stessa schermata della cucina ma tiene tutti i tasti (consegna anche da solo, «Al banco»).
- **Uscita:** resta tutto com'è (pronti in parte, scelte Naturale/Frizzante, «Annulla», «Consegnato», reparto per stand, asporto). Cambia solo la riga degli ordini uniti.
- Camerieri e cassa.
- In cucina restano: le schede da preparare, il suono delle chiamate, il riquadro porzioni («30 / 80») con «+ Aggiungi», il filtro per reparto, lo storico.

## Anti-obiettivi
- Nessuna impostazione «chi segna pronto»: l'utente vuole la regola fissa.
- Non si deve perdere il «pronto in parte»: resta all'uscita (anche per le scelte e ora anche per gli ordini uniti).

## Come funziona dopo
- Una scheda resta in cucina finché l'uscita non segna il piatto pronto, poi sparisce (come oggi quando lo segnava la cucina).
- La lista «Pronti» della cucina resta, solo da leggere (senza tasti). *Scelta mia:* utile per sapere cosa aspetta il cameriere; si può togliere se non serve.
- Ordini uniti all'uscita: «Pronti 4» su «6 Pizzoccheri · n. 12 + 13» segna pronte prima le porzioni dell'ordine col numero più basso; il resto resta da preparare come riga con il solo nome del piatto (nessuna scritta «2ª volta» o simile: l'utente non la vuole), come fa oggi la cucina. *Scelta mia:* riusare la stessa logica della cucina (righe sommate, `kqg` / `data-rsetm`), non scriverne una nuova.

## Approcci considerati
- **Togliere i tasti solo dalla cucina, tenere bar e uscita come sono (scelto).** Semplice, la regola è fissa come vuole l'utente.
- Impostazione in Evento «chi segna Pronto: cucina / uscita»: scartata, l'utente ha detto «definitivamente».
- Togliere i tasti anche al bar: scartato, il bar consegna da solo.

## Da aggiornare insieme
- Serata simulata (`test/serata.html`): il «Pronto» dei piatti di cucina va premuto dall'uscita, compresi pronti in parte e ordini uniti.
- Versione 39 (`app/index.html` due volte, `app/sw.js`), `CHANGELOG.md`.
- Manuale (`docs/manuale-img/manuale.html` e il PDF): pagina della cucina e dell'uscita.

## Lasciato a chi costruisce
Dettagli di aspetto della riga unita all'uscita (seguire lo stile delle righe attuali di «In preparazione»).
