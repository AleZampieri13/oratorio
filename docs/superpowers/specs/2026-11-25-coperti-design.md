# Coperti scritti in cassa — progetto

## Perché
- Ci saranno serate **senza menù** (solo piatti da soli): oggi ogni ordine fa 0 coperti, quindi riepilogo ed Excel non dicono quante persone hanno mangiato.
- Negli ordini misti (3 menù + 1 persona che prende una pizza da sola) i coperti contati sono meno delle persone.
- In futuro forse si farà **pagare il coperto**: servirà il numero di persone per ordine. Il prezzo è fuori da questo lavoro; il numero va salvato già ora.

Alla serata del 21/11 il cassiere ha detto che «i menù non li conta come coperti»: nel codice ogni menù (anche Bambini) vale 1 coperto; probabilmente non li vedeva da nessuna parte mentre faceva l'ordine.

## Approcci considerati
- Campo solo quando non c'è nessun menù: scartato, negli ordini misti si perdono persone.
- **Campo sempre presente, compilato da solo col numero dei menù (scelto dall'utente).**

## Come funziona
1. **Cassa — nuovo ordine, Modifica, Rettifica:** sotto i menù la riga **Coperti** con `−` [campo] `+`. Il campo si può anche **scrivere** (tastiera numerica).
   - Parte dal numero dei menù (0 senza menù); se si cambiano i menù il campo li segue **finché il cassiere non lo cambia a mano** (con − / + o scrivendo); da lì resta come l'ha messo lui. *Scelta mia.*
   - Può essere **minore, uguale o maggiore** dei menù (deciso dall'utente). Minimo 0. Vuoto = come i menù.
   - Non obbligatorio (chi prende solo una birra fa 0 coperti).
   - Modifica / Rettifica: il campo mostra i coperti salvati e **non cambia quando si cambiano i menù** (deciso dall'utente); si cambia solo a mano.
2. **Salvataggio:** ogni ordine nuovo o modificato salva `coperti` (numero). Gli ordini vecchi senza `coperti` contano i menù come oggi: le serate già fatte non cambiano.
3. **Prenotazioni:** se il file ha «Totale persone», la prenotazione salva `coperti` = quel numero; scegliendola in cassa il campo parte da lì (e conta come «toccato a mano»). Nelle serate senza menù il totale non va più sul primo menù quando non esiste. In un arrivo in parte il campo parte dal numero dei menù rimasti.
4. **Dove si usa:** al posto del conto fatto dai menù ovunque si mostrano i coperti come persone: scheda del cameriere (e «Unisci», storico), riepilogo del master, Excel (foglio ordini colonna «Coperti», foglio prenotazioni, riepilogo), archivio delle serate, pallino «N coperti» della prenotazione in cassa.
   - **Non** cambia: porzioni di cucina e bar, «restano N coperti» delle prenotazioni in parte (sono menù), il controllo «i coperti non si possono più togliere» della rettifica (riguarda i menù).

## Fuori
- Prezzo del coperto.
- Campo scrivibile anche per menù e piatti da soli.

## Regole del database
Nessun cambio: `tools/regole.py` non limita i campi di `ordini/<n>` e la cassa scrive già ordini e prenotazioni.
