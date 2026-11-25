# Chiudere una prenotazione arrivata in parte — progetto

## Perché
Alla serata del 21/11/2026: una prenotazione da 4, ne arrivano 3. Oggi resta «Arrivati in parte» per tutta la serata. Due problemi, tutti e due da risolvere:
- **in cassa** il cassiere non sa se deve aspettare qualcuno;
- **dopo la serata** contatore ed Excel dicono «in parte» per gente che non è mai arrivata.

I soldi e i coperti della serata non sono sbagliati (si contano dagli ordini): è solo chiarezza.

## Approcci considerati
- **La cassa lo chiede subito dopo «Crea ordine» (scelto).** Il cassiere decide quando lo sa; niente da ricordare.
- Tasto «Chiudi» sulla prenotazione: scartato, alla serata il cassiere non ricordava neanche le funzioni che c'erano.
- Chiusura automatica a fine serata: scartato, in cassa il dubbio resta.

## Come funziona
1. **Dopo «Crea ordine»** da una prenotazione che resta in parte, il messaggio della cassa diventa:
   > Rossi: manca 1 coperto  ·  **Aspetta**  ·  **Chiudi**

   («mancano N coperti» al plurale; se restano solo piatti da soli: «mancano piatti da soli».)
   - **Aspetta:** come oggi (stato «parziale»), il messaggio sparisce.
   - **Chiudi:** la prenotazione passa a stato **«chiusa»**.
   - Se il cassiere non tocca niente vale «Aspetta» (come oggi).
2. **Ricerca in cassa:** una prenotazione chiusa mostra «Chiusa · n. 12 · 3 su 4» (pallino come «Arrivati»). Toccandola compare il tasto **Riapri**: torna «parziale» e si seleziona come oggi (si carica solo quello che manca).
3. **Contatore** in cassa e in Evento: «32 gestite su 32» dove *gestite* = arrivate + chiuse; se ce ne sono in parte resta « · 2 in parte».
4. **Excel, foglio prenotazioni:** colonna «Arrivati» = «Sì» / «No» / «In parte» / **«Chiusa»**; nuova colonna **«Quanti»** = coperti arrivati su prenotati, es. «3 su 4». Nel riepilogo «Prenotazioni arrivate» conta anche le chiuse? *No* — scelta mia: resta solo «arrivata»; aggiungo la riga «Prenotazioni chiuse».

Parole: **Aspetta**, **Chiudi**, **Riapri**, **Chiusa** (scelte con l'utente: una parola sola per tasto).

## Casi particolari (scelte mie)
- **Annullo** di un ordine di una prenotazione chiusa: lo stato si ricalcola come oggi (`prenStato`), quindi torna «parziale» o «attesa» — la chiusura si perde, il cassiere deciderà di nuovo.
- **Re-import del file prenotazioni** con «togli quelle che non ci sono»: le chiuse si tengono, come le arrivate e le parziali.
- Nessun cambio alle regole del database: la cassa può già scrivere `prenotazioni`.

## Non obiettivi
- Prenotazioni dove non arriva nessuno: restano «No» come oggi.
- Nessuna chiusura automatica.

## Da toccare
`app/js/02-cassa.js` (messaggio dopo «Crea ordine», ricerca, Riapri, contatore), `app/js/10-evento.js` (`prenPill`, contatore Evento, Excel, `planImport`), `CHANGELOG.md`. Nessun test o serata simulata adesso (decisione dell'utente: si aggiorna tutto alla fine).
