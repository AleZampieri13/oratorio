# Cassa a tasti grandi

Data: 26/11/2026 · Stato: approvato il 26/11/2026

## Perché

L'obiettivo è rendere l'app più facile da usare, partendo dalla Cassa. Non è nato da un problema preciso di una serata. Alla serata la cassa lavora su **tablet o computer**.

Il listino tipico, secondo il committente: i menù si usano **una sola serata all'anno** (2 menù). Le altre serate si vendono solo piatti da soli: 2–3 primi, 2–3 fritti, e in griglia e al bar una decina di voci ciascuno, cioè circa **25–30 tasti** divisi in 4 reparti. Il caso principale da progettare è quindi **solo piatti da soli**.

Oggi il nuovo ordine è un modulo lungo con stepper «− 0 +». Le opzioni che servono di rado (cambi, piatti da soli, note, asporto, conto diviso, offerta) stanno sempre tra il menù e «Crea ordine». Per arrivare al tasto finale bisogna scorrere.

## Obiettivi

- Comporre un ordine normale (menù, nominativo, contanti o POS, Crea ordine) con pochi tocchi e senza scorrere, su un tablet in orizzontale o su un computer.
- Avere sempre in vista il conto che si sta componendo, con totale, pagamento e «Crea ordine» sempre nello stesso posto.
- Usare lo stesso modo di comporre per il nuovo ordine e per «Modifica ordine».

## Fuori dal progetto

- Cambiare lo stile dell'app: verde, caratteri, maiuscolo, tema scuro e colori di stato e reparto restano quelli di oggi.
- Le altre pagine: Camerieri, Cucina, Bar, Uscita, Listino, Evento, Persone.
- Il telefono come cassa principale. Deve continuare a funzionare, ma non è il caso per cui progettiamo.
- Cambiare come gli ordini vengono salvati in Firebase, i conti (`bill`, `menuNetto`, `payPlan`), le regole sulle porzioni o il flusso della rettifica.

## Cosa sarebbe un fallimento

- Un ordine salvato in modo diverso da oggi: altri campi, altri importi, porzioni contate male, cucina o bar che ricevono qualcosa di diverso.
- Una funzione di oggi che sparisce o diventa irraggiungibile (vedi l'elenco «Da conservare»).
- Un cassiere che toglie o aggiunge un piatto senza accorgersene, cioè tocchi involontari che cambiano l'ordine in silenzio.

## Approcci considerati

1. **A. Come oggi ma più corta.** Una colonna, le opzioni rare dietro tastini, una barra fissa con totale e «Crea ordine». È il cambiamento più piccolo.
2. **B. «Cosa prende» a sinistra e «Conto» a destra.** Stepper come oggi, con il conto sempre in vista a destra.
3. **C. Tasti grandi come un registratore di cassa.** Menù e piatti diventano tasti grandi (ogni tocco ne aggiunge uno), a destra uno scontrino con pagamento e «Crea ordine». È la più veloce col dito ma la più diversa da oggi.

**Scelta: C**, decisa dal committente guardando le bozze. Anche «Modifica ordine» passa ai tasti grandi (sempre scelta del committente).

## Com'è fatta (decisioni prese)

### Disposizione (tablet in orizzontale e computer)

```
┌──────────────────────────────────────────┬─────────────────────┐
│ N. 27   [Nominativo o prenotazione *]    │ SCONTRINO           │
│ MENÙ                                     │ 2 × Standard  −  30 │
│ [Standard ②] [Bambini ①] [Senza bresaola]│ 1 × Bambini   −   9 │
│ PIATTI DA SOLI (per reparto, col colore) │   ↳ Cambia piatto   │
│ [Pizzoccheri] [Sciatt] [Patatine ·3 rim.]│ TOTALE     39,00 €  │
│ [Torta ESAURITA]                         │ Contanti|POS|Offerto│
│ + Note cucina  + Asporto  Coperti 3      │ Ricevuto  Resto     │
│                                          │ + Offerta + Dividi  │
│                                          │ [   CREA ORDINE   ] │
├──────────────────────────────────────────┴─────────────────────┤
│ ORDINI: 26 Famiglia Colombo · 25 Rossi · …   [N. da modificare]│
└────────────────────────────────────────────────────────────────┘
```

- **Colonna sinistra (cosa prende):** numero del biglietto, campo nominativo/prenotazione, tasti dei menù, tasti dei piatti da soli divisi per reparto, e una riga con «+ Note cucina», «+ Asporto» e i coperti.
- **Senza menù** (il caso più frequente): la sezione Menù non compare e i piatti da soli, divisi per reparto, occupano tutta la colonna sinistra, partendo subito sotto il nominativo. La sezione Menù compare solo quando nel listino c'è almeno un menù.
- **Schermo di riferimento** (scelta del progettista, perché il modello del tablet non si sa): tablet in orizzontale da **1024 × 700 px utili in su**. Su 1280 × 800 i circa 30 tasti dei piatti da soli devono starci tutti senza scorrere, cioè 5 per riga in 4 gruppi. Su 1024 × 700 possono andare 4 per riga e la colonna sinistra scorre.
- La colonna sinistra può scorrere da sola se i tasti non ci stanno (scelta del progettista); lo scontrino resta fermo accanto.
- **Colonna destra (scontrino):** le righe di quello che è stato messo, i cambi, totale, pagamento, ricevuto e resto, «+ Offerta», «+ Dividi conto» e il tasto «Crea ordine». Deve stare tutta in uno schermo senza scorrere quando l'ordine è normale, cioè senza conto diviso aperto.
- **Sotto:** la lista degli ordini, l'apertura per numero e «+ Offerta» libera, come oggi. Nelle bozze era una striscia, ma la lista di oggi va tenuta con tutte le sue funzioni.

### Tasti

- Ogni menù (`S.varianti`) e ogni voce di `singlesList()` è un tasto. Le voci bambini dei piatti da soli («Pizzoccheri bambini») sono tasti separati, come oggi sono stepper separati.
- Un tocco aggiunge 1. Sul tasto un numerino mostra quanti ne sono stati messi.
- **Togliere:** con un «−» sulla riga dello scontrino. Niente tocco lungo, perché nessuno lo scopre da solo.
- I tasti dei piatti da soli portano una striscia del colore del reparto (`repColor`) e sono raggruppati per reparto come oggi.
- **Porzioni** (scelta del progettista, per non perdere la forzatura del master che c'è oggi):
  - Il tasto mostra «ne restano N». N è `stockLeft` meno quanto ne usa già l'ordine che si sta componendo. In «Modifica ordine» si contano solo le porzioni in più rispetto all'ordine salvato, come fa `stockProblemsDelta`.
  - Quando N arriva a zero il tasto diventa grigio con la scritta «esaurito». Per chi non è master non si può toccare. Per il master resta toccabile.
  - Al salvataggio restano i controlli di oggi (`stockProblems`, `stockBlockMsg`, e per il master «premi di nuovo per venderle lo stesso»).
  - Un menù a cui manca un piatto mostra «manca X» come oggi. Non viene bloccato al tocco: lo blocca il controllo al salvataggio.
  - Il riquadro `c-stock` non serve più.
- Il prezzo mancante («prezzo non impostato») resta segnalato sul tasto.

### Scontrino

- Una riga per ogni menù e piatto da solo con quantità maggiore di zero, con un «−» e l'importo della riga.
- Sotto una riga di menù c'è «Cambia piatto», che apre il modulo dei cambi di oggi (`cambiHtml`: «Al posto di», «Vuole», «Per quante persone», prezzo resta uguale o scala). Anche i cambi già fatti compaiono lì sotto e si tolgono da lì.
- Totale, pagamento (Contanti, POS, Offerto e «Offerto da»), ricevuto e resto funzionano come oggi (`paintTotal`, `paintCash`). Il pagamento anticipato di una prenotazione compare nello scontrino.
- «+ Offerta» e «+ Dividi conto» aprono le parti di oggi dentro lo scontrino. Il conto diviso può far scorrere lo scontrino, ed è accettato.
- Il tasto «Crea ordine» mantiene il comportamento di oggi, compresa la conferma dell'asporto diretto («Conferma e manda in cucina») e il riquadro dell'ultimo ordine con la possibilità di annullarlo entro un minuto.

### Prenotazioni

- La ricerca della prenotazione si sposta nel campo del nominativo: scrivendo compaiono i risultati come oggi. Quando non ci sono prenotazioni il campo è un semplice nominativo.
- Scelta del progettista: una prenotazione scelta compare come etichetta «Prenotazione: Nome · Togli» sopra il campo. Se poi il nome nel campo viene corretto, il legame resta; si scioglie solo con «Togli», come oggi. Mentre è scelta una prenotazione il campo non cerca più.
- Scegliendo una prenotazione, i tasti si riempiono con quello che era prenotato, come fa oggi `selectPren`, e il «già pagato» si vede nello scontrino.

### Modifica ordine

- Il pannello «Modifica ordine» (ordine non ancora partito) usa lo stesso schema: tasti a sinistra e scontrino a destra con nominativo, note, offerta, pagamento e «Salva modifiche». Prende lo spazio del nuovo ordine, con un titolo ben visibile «Modifica ordine N», e si chiude con «Chiudi».
- Scelta del progettista: un nuovo ordine composto a metà **non si perde**. Aprendo la modifica viene messo da parte (quantità, cambi, nominativo, prenotazione scelta, note, asporto, pagamento, parti) e torna com'era alla chiusura. Lo stato della modifica (`S.eqty`, `S.esqty`, `S.ecambi`) resta separato da quello del nuovo ordine. Il modulo dei cambi aperto (`S.cf`) si chiude passando dall'uno all'altro.
- **Rettifica** (ordine già partito, `isLocked`): resta il flusso di oggi (`renderFix`), con la scelta dei piatti non chiamati, gli stepper con «erano N», i coperti e la restituzione. Occupa lo stesso spazio della modifica, con le stesse regole di messa da parte del nuovo ordine. È una scelta del progettista: la rettifica può solo togliere, quindi i tasti che aggiungono non c'entrano. Va solo messa in ordine con lo stile nuovo.
- «Annulla ordine» e la sua conferma restano come oggi.

### Telefono e schermi stretti

- Sotto circa 760 px le colonne vanno una sotto l'altra: tasti a due per riga, poi lo scontrino.
- Funziona, ma non è ottimizzato.

## Da conservare (oggi c'è, deve restare raggiungibile)

Numero del biglietto precompilato e modificabile; conteggio delle prenotazioni gestite; ricerca prenotazione con selezione e «Togli»; nominativo obbligatorio; menù; cambi nel menù; coperti automatici e a mano; piatti da soli per reparto; note per la cucina; asporto con «Subito» o «Lo chiama un cameriere»; «già pagato» delle prenotazioni; pagamento Contanti, POS o Offerto con «Offerto da»; ricevuto e resto; offerta con «Il resto è un'offerta»; conto diviso per piatti o a importi, in parti uguali e con «+ Parte»; messaggi di errore e di porzioni; ultimo ordine con annullo entro un minuto; lista «Asporto da consegnare»; lista ordini con Modifica o Rettifica; apertura per numero; offerta libera; incasso e fondo cassa (`c-mine-panel`); storico; modifica e rettifica; annulla ordine.

## Vincoli

- JavaScript e CSS a mano come oggi, senza framework né build. I file restano `app/index.html`, `app/js/02-cassa.js` e `app/css/app.css`.
- Ogni rilascio aumenta il numero di versione in `index.html` (due punti), in `sw.js` (`CACHE`) e in `CHANGELOG.md`.
- Si prova con la copia di prova (`test/genera-prova.ps1`, poi `test/serata.html`), che usa un database finto.
- Le copie di prova non vanno nel commit.

## Lasciato a chi costruisce

- I nomi delle classi CSS e la struttura del markup, purché lo stile resti quello dei token di `:root`.
- Le misure esatte dei tasti, da tenere almeno a 64 px di altezza per il dito.
- Se riscrivere i render in funzioni nuove o adattare `stepperHtml` e `singlesHtml`.
- Se tenere la lista degli ordini sotto le due colonne o in una terza colonna sugli schermi molto larghi.
