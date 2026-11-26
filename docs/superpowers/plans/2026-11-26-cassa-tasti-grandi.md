# Cassa a tasti grandi: piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** nella scheda Cassa, nuovo ordine e «Modifica ordine» si compongono con tasti grandi (un tocco = +1). Accanto c'è uno scontrino fisso con «−», totale, pagamento e il tasto finale. Gli ordini si salvano esattamente come oggi.

**Architecture:** cambia solo la presentazione. Lo stato resta quello di oggi: `S.qty`, `S.sqty`, `S.cambi`, `S.cop` per il nuovo ordine; `S.eqty`, `S.esqty`, `S.ecambi`, `S.xCop` per la modifica. Restano anche i calcoli (`bill`, `menuNetto`, `payPlan`, `paintTotal`) e i salvataggi (`createOrder`, `x-save`, `saveFix`). Le nuove funzioni di disegno `tilesHtml` e `receiptHtml` sostituiscono `stepperHtml` e `singlesHtml` **solo in cassa**: le usa ancora chi le chiama altrove. Gli elementi HTML spostati tengono il loro `id`, così i gestori di oggi continuano a funzionare. La modifica prende il posto del modulo nuovo ordine **nascondendolo**, senza svuotarlo: in questo modo l'ordine a metà resta com'è.

**Tech Stack:** HTML, CSS e JavaScript a mano, senza build; Firebase Realtime Database.

**Spec:** `docs/superpowers/specs/2026-11-26-cassa-tasti-grandi-design.md`

## Global Constraints
- Stile: solo i token di `:root` in `app/css/app.css` (colori, `--f-display`, `--f-body`, `--r`). Il maiuscolo globale (`body{text-transform:uppercase}`) resta.
- Tasti alti almeno **64 px**. Schermo di riferimento: tablet in orizzontale da **1024 × 700 px utili** in su. Su **1280 × 800** i circa 30 tasti dei piatti da soli stanno senza scorrere (5 per riga).
- Sotto **760 px** le due colonne vanno una sotto l'altra: tasti 2 per riga, poi lo scontrino.
- Non cambiare: forma dei dati salvati in `ordini/…` e `prenotazioni/…`, `bill`, `menuNetto`, `payPlan`, `stockProblems`, `stockProblemsDelta`, `stockBlockMsg`, `fixCalc`, `saveFix`, la logica di `createOrder` e `x-save`.
- `.stepper` e `stepperHtml` restano: li usano anche camerieri (`.wsc`), conto diviso (`#c-parts`) e rettifica (`fixStep`).
- Testi: italiano semplice, come il resto dell'app. Le etichette nuove sono quelle del progetto: «Cambia piatto», «+ Note cucina», «+ Asporto», «+ Offerta», «+ Dividi conto», «esaurito», «ne restano N», «manca X», «Prenotazione: Nome · Togli».
- Verifica: si lavora in `app/`. Si prova con `powershell -ExecutionPolicy Bypass -File test\genera-prova.ps1`, poi preview `ordini-prova` (http://localhost:5520/index.html: crea il master, il listino e le prenotazioni a mano) oppure `serata.html`. Le copie in `test/` non vanno nel commit.
- Ultimo task: versione **50** in `app/index.html` (2 punti), `app/sw.js` (`CACHE = "ordini-oratorio-v50"`) e `CHANGELOG.md`.

## Review Focus
1. **Ultima porzione.** Con 1 porzione rimasta, il tocco che la usa spegne il tasto per chi non è master, mentre il master può ancora toccarlo. In Modifica di un ordine che contiene già l'ultima porzione, quel tasto non risulta esaurito.
2. **Ordine a metà e Modifica.** Il cassiere mette 2 piatti, scrive il nome, sceglie POS, apre «Modifica» su un altro ordine e chiude: ritrova tutto com'era. Vale anche se nel frattempo ha salvato la modifica.
3. **Prenotazione.** Scelta una prenotazione, i tasti si riempiono e compare l'etichetta. Se si corregge il nome, il legame resta; «Togli» svuota tutto come oggi (`resetForm`). Senza prenotazioni, il campo è un semplice nominativo.
4. **Flussi a due tocchi.** L'asporto diretto chiede ancora «Conferma e manda in cucina». Il master con un piatto esaurito vede ancora «premi di nuovo per venderle lo stesso». «Il resto è un'offerta» funziona ancora.
5. **Listini diversi.** Senza menù non c'è la sezione Menù e i coperti si mettono a mano. Con i menù compaiono anche «Cambia piatto» e «manca X», e le voci bambini dei piatti da soli sono tasti separati.

---

### Task 1: Nuova disposizione della scheda Cassa

**Files:**
- Modify: `app/index.html` (sezione `#p-cassa`, righe ~124-196)
- Modify: `app/css/app.css` (regole nuove in fondo, sotto un commento `/* cassa a tasti grandi */`)

**Interfaces:**
- Produces: contenitore `#c-form` (`.cmain`, griglia a due colonne) con `#c-left` (colonna dei tasti) e `#c-right` (scontrino, `.creceipt`, `position:sticky`). Sotto c'è `.cbelow` con `#c-asp-panel`, il pannello Ordini e `#c-histbox`.
- Produces: `#x-panel` sta **dentro** `.cmain`, come fratello di `#c-form`, e usa la stessa griglia (`#x-left`, `#x-right`).
- Tutti gli `id` di oggi restano nel DOM.

- [ ] **Step 1:** In `#c-left` vanno, in quest'ordine: `.cbig` (biglietto e conteggio), `#c-searchbox` con `#c-sel` e `#c-nome`, `#c-steppers` (menù), `#c-sing-box`, e la riga degli extra `.cextra` con `#c-note` (nascosta finché non si apre), `.check` di `#c-asp` con `#c-asp-row`, e `#c-coprow`. In `#c-right` vanno `#c-last-wrap`, `#c-cambi`, `#c-paid-row`, `#c-paybox`, `#c-create` e `#c-msg`. `#c-stock` resta nel DOM con `hidden`.
- [ ] **Step 2:** CSS. `.cmain` è una griglia `minmax(0,1.35fr) minmax(320px,.65fr)`. `#c-right` ha `position:sticky; top:<altezza dell'intestazione>`, `max-height:calc(100dvh - …)` e `overflow:auto`. Sotto 760 px una sola colonna e `#c-right` non è sticky. `.cbelow` è il vecchio `.grid2`.
- [ ] **Step 3: Verifica.** Rigenera la copia di prova e apri la Cassa a 1280 × 800 (`resize_window`). Le due colonne sono affiancate, la lista ordini è sotto, e un ordine creato con gli stepper vecchi si salva (compare in «Ordini»). Nessun errore in console.
- [ ] **Step 4: Commit** con il messaggio `Cassa: disposizione a due colonne (tasti a sinistra, scontrino a destra)`.

### Task 2: Tasti dei menù e dei piatti da soli, con porzioni

**Files:**
- Modify: `app/js/02-cassa.js` (`renderSteppers`, `refreshStepLabels`, gestori `#c-steppers` e `#c-sing`, `renderStock`)
- Modify: `app/css/app.css`

**Interfaces:**
- Produces: `tileLeft(pid:string, f:{righe,singoli,cambi}, base?:object) -> number|null` mette insieme `stockLeft(pid)` e il fabbisogno `cop(righeFor(f,pid))`. Se c'è `base` (l'ordine salvato), toglie il fabbisogno già coperto, come `stockProblemsDelta`. Restituisce `null` se il piatto non ha limite.
- Produces: `tilesHtml(list, qty, attr:string, f, base?) -> string`. Per ogni voce un `<button class="ctile" attr="id">` con il nome, il prezzo (o «prezzo non impostato»), il numerino `.ctq` se la quantità è > 0, la striscia `--c:repColor(rep)` per i piatti da soli, e lo stato: «ne restano N» (`tileLeft` > 0 con limite), «esaurito» (`tileLeft` ≤ 0) oppure, per i menù, «manca X» (come `stepperHtml` oggi). Un tasto esaurito ha `aria-disabled="true"` e classe `.out`. È anche `disabled` **solo se** `!isBoss()`.
- Produces: `singleTilesHtml(qty, attr, f, base?)` raggruppa per reparto come `singlesHtml`, riusando `.xgroup` e `.cgrp`.
- Gli attributi restano `data-step` e `data-sstep`; nel tasto non c'è `data-d`, quindi il tocco vale sempre +1.

- [ ] **Step 1:** Scrivi `tileLeft`, `tilesHtml` e `singleTilesHtml` vicino a `stepperHtml`. Per il nuovo ordine il fabbisogno `f` si costruisce come in `stockProblems`: `{righe:buildRighe(S.qty), singoli:buildSingoli(S.sqty), cambi:ccC()}`.
- [ ] **Step 2:** `renderSteppers` e `refreshStepLabels` usano i tasti. La sezione Menù (`.csec` e `#c-steppers`) è nascosta se `S.varianti` è vuoto. `renderStock` nasconde sempre `#c-stock`.
- [ ] **Step 3:** I gestori di `#c-steppers` e `#c-sing` aggiungono +1 se `b.dataset.d` manca. Un tasto `disabled` non arriva al gestore; il master tocca anche i tasti `.out`.
- [ ] **Step 4:** CSS. `.ctiles` è una griglia `repeat(auto-fill,minmax(150px,1fr))`, gap 8 px. `.ctile` è alto almeno 64 px, con sfondo `--surface`, bordo `--line`, nome in `--f-display` e bordo sinistro 6 px `var(--c)`. `.ctq` è il numerino tondo in `--accent`. `.ctile.out` è grigio (`--wait-bg`, testo `--done`). Il testo dello stato usa `--danger` per «esaurito» e «manca X» e `--call` per «ne restano N». Sotto 760 px, 2 per riga.
- [ ] **Step 5: Verifica** nella copia di prova, con un listino di 4 reparti e una trentina di piatti da soli, senza menù.
  - A 1280 × 800 si vedono tutti i tasti senza scorrere, 5 per riga, e non c'è la sezione Menù.
  - Imposta una porzione a 2 su un piatto. Due tocchi mostrano «ne restano 1» e poi «esaurito». Per un cassiere il tasto non si tocca più; per il master sì, e «Crea ordine» chiede di premere di nuovo.
  - Aggiungi un menù al listino: la sezione Menù compare in cima. Rendi esaurito un piatto del menù: sul tasto del menù compare «manca X».
- [ ] **Step 6: Commit** con il messaggio `Cassa: menù e piatti da soli come tasti grandi, con porzioni sul tasto`.

### Task 3: Scontrino con «−», cambi e opzioni a scomparsa

**Files:**
- Modify: `app/js/02-cassa.js` (`renderSteppers`, `cambiHtml` (solo dove viene messo), nuovi gestori in `#c-right`, `resetForm`)
- Modify: `app/index.html` (contenitore `#c-lines` in cima a `#c-right`, tastini `.cmore`)
- Modify: `app/css/app.css`

**Interfaces:**
- Consumes: `tilesHtml` e `bill` (Task 2).
- Produces: `receiptHtml(pre:"c"|"x", qty, sqty, cc) -> string`. Ha una riga per ogni menù e piatto da solo con quantità > 0: `<b>N ×</b> nome`, importo, e il bottone `−` con `data-rm="m:<id>"` (menù) oppure `data-rm="s:<id>"` (piatto da solo). Sotto una riga di menù c'è il bottone «Cambia piatto» con `data-cadd="1"` (lo stesso attributo che oggi apre il modulo dei cambi) e, a seguire, l'HTML di `cambiHtml(pre,…)`. Se non c'è niente: «Tocca un piatto per aggiungerlo».
- Produces: i tastini `.cmore` (`data-more="note|asp|off|split"`) aprono e chiudono `#c-note`, la riga asporto, la riga offerta (`#c-off-row`) e il conto diviso (equivale a toccare «Dividi conto» in `#c-split`). Lo stato aperto/chiuso sta in `S.more = {note,asp,off}` e `resetForm` lo azzera. Un tastino si mostra già aperto quando il suo campo ha un valore, per esempio note scritte o asporto spuntato da una prenotazione.

- [ ] **Step 1:** `receiptHtml` va in `#c-lines`, che `renderSteppers` ridisegna. Il vecchio `#c-cambi` non è più usato per il nuovo ordine: i cambi stanno nello scontrino. I gestori dei cambi (`box.addEventListener` su `cambiHtml`) vanno agganciati a `#c-lines` per `pre="c"` (oggi sono agganciati a `#c-cambi` e `#x-cambi`, ~riga 203).
- [ ] **Step 2:** Gestore di `data-rm`: −1 su `S.qty` o `S.sqty` (minimo 0), poi `S.stockWarn=null`, `renderSteppers()` e `$("c-msg").textContent=""`, come i gestori di oggi.
- [ ] **Step 3:** Tastini `.cmore` e `S.more`. Il riquadro «Totale, pagamento, ricevuto» (`#c-paybox`) è sempre visibile sotto le righe, quando oggi è visibile. «Crea ordine» resta in fondo allo scontrino.
- [ ] **Step 4:** CSS. `.creceipt` ha bordo 2 px `--accent`. Le righe hanno il `−` tondo da 40 px. Il totale è in `--f-display` grande. I tastini `.cmore` hanno il bordo tratteggiato, come nella bozza.
- [ ] **Step 5: Verifica.**
  - Ordine normale: 3 tocchi su piatti, nome, Contanti, «Ricevuto 20», «Crea ordine». A 1280 × 800 non si scorre mai, il resto è giusto e l'ordine salvato è uguale a uno fatto con la versione 49 (stessi campi in `ordini/N`).
  - Il «−» toglie e allo zero la riga sparisce.
  - Con un menù: «Cambia piatto» apre il modulo, il cambio compare sotto la riga e si toglie.
  - Il conto diviso si apre da «+ Dividi conto» e lo scontrino scorre.
  - Restano a posto «Il resto è un'offerta», la conferma dell'asporto diretto e l'ultimo ordine con «Annulla ordine».
- [ ] **Step 6: Commit** con il messaggio `Cassa: scontrino con − e cambi, note/asporto/offerta/conto diviso a scomparsa`.

### Task 4: Prenotazione nel campo del nominativo

**Files:**
- Modify: `app/index.html` (`#c-searchbox`: `#c-search` sparisce come campo visibile, `#c-nome` diventa il campo unico; `#c-sel` va sopra)
- Modify: `app/js/02-cassa.js` (`renderSearch`, gestore `input` di `#c-nome`, `selectPren`, `renderSel`)

**Interfaces:**
- Produces: la ricerca legge `#c-nome`, ma solo se `!S.selPren` e ci sono prenotazioni (`prensArr().length`). I risultati vanno in `#c-results`, sotto il campo, come oggi.
- `#c-search` resta nel DOM con `hidden`, così chi ne legge il valore riceve una stringa vuota.
- `selectPren` scrive `p.nome` in `#c-nome` e chiude i risultati.
- `renderSel` mostra «Prenotazione: Nome · Togli»: `#c-sel` con il bottone `#c-sel-x` esistente, ora con il testo «Togli».

- [ ] **Step 1:** Sposta la ricerca su `#c-nome`. Con una prenotazione scelta, scrivere nel campo cambia solo il nome e non cerca. Senza prenotazioni nel database, il campo non cerca mai. `hideDone` e la pulizia di `.bad` restano.
- [ ] **Step 2:** `#c-prencount` («N gestite su M») resta accanto al biglietto.
- [ ] **Step 3: Verifica.** Importa 3 prenotazioni con dei piatti nel modello Excel.
  - Scrivi «ros»: compare il risultato. Sceglilo: i tasti si riempiono, c'è l'etichetta e il «già pagato» è nello scontrino se previsto.
  - Correggi il nome: l'etichetta resta. «Crea ordine» segna la prenotazione come arrivata (`prenotazioni/<id>/stato`).
  - Nuovo ordine, scegli una prenotazione, «Togli»: il modulo si svuota.
  - Svuota le prenotazioni: il campo è solo nominativo.
- [ ] **Step 4: Commit** con il messaggio `Cassa: la prenotazione si cerca nel campo del nominativo`.

### Task 5: Modifica e Rettifica al posto del nuovo ordine

**Files:**
- Modify: `app/index.html` (`#x-panel` dentro `.cmain`; `#x-left` con `#x-steppers`, `#x-sing-box`, `#x-coprow`, `#x-nome`, `#x-note`; `#x-right` con `#x-lines`, `#x-paid`, `#x-total`, `#x-off`, `#x-pay-row`, `#x-save`, `#x-del-row`, `#x-confirm-row`, `#x-msg`; `#x-fix` e `#x-lockmsg` occupano tutta la larghezza)
- Modify: `app/js/02-cassa.js` (`openEdit`, `closeEdit`, `renderEditSteppers`, gestori `#x-steppers` e `#x-sing`, rimozione da scontrino)

**Interfaces:**
- Consumes: `tilesHtml`, `singleTilesHtml` e `tileLeft` con `base=o` (Task 2); `receiptHtml("x",…)` (Task 3).
- Produces: `openEdit(n)` nasconde `#c-form` (`hidden`) e mostra `#x-panel` al suo posto, con titolo «Modifica ordine N · Nome» oppure «Rettifica ordine N». Non scorre la pagina, perché il pannello è già in vista. Prima mette `S.cf=null`.
- Produces: `closeEdit()` nasconde `#x-panel`, rimostra `#c-form` e mette `S.cf=null`. **Non** chiama `resetForm` e non tocca `S.qty`, `S.sqty`, `S.cambi`, i campi o il pagamento del nuovo ordine.
- `renderEditSteppers` disegna i tasti con `f={righe:buildRighe(S.eqty),singoli:buildSingoli(S.esqty),cambi:ccX()}` e `base=orderByNum(S.editOrder)`, e mette lo scontrino in `#x-lines`. I gestori dei cambi per `pre="x"` si agganciano a `#x-lines`.

- [ ] **Step 1:** Sposta il markup del pannello come descritto in Files. `#x-cambi` non è più usato.
- [ ] **Step 2:** `openEdit` e `closeEdit` come in Interfaces. Anche chi oggi chiude la modifica di nascosto (in `11-avvio.js:46`, quando l'ordine sparisce) deve far ricomparire `#c-form`: passa da `closeEdit()`.
- [ ] **Step 3:** Tasti e scontrino della modifica: +1 dal tasto e −1 da `data-rm` dentro `#x-lines`, su `S.eqty` e `S.esqty`.
- [ ] **Step 4:** Rettifica (`isLocked`): `#x-body` resta nascosto come oggi. `#x-fix` e `#x-lockmsg` si vedono a tutta larghezza dentro `#x-panel`, con lo stesso flusso `renderFix` di oggi e solo lo stile adattato.
- [ ] **Step 5: Verifica.**
  - Componi un ordine nuovo a metà (2 piatti, nome, POS, ricevuto), apri «Modifica» su un ordine in attesa, aggiungi un piatto, «Salva modifiche», «Chiudi»: l'ordine nuovo è intatto. Ripeti chiudendo senza salvare.
  - Apri un ordine già partito: compare la rettifica, si toglie un piatto non chiamato e la restituzione è giusta.
  - In Modifica di un ordine che ha l'ultima porzione di un piatto, quel tasto non è «esaurito».
  - «Annulla ordine» con la sua conferma funziona.
- [ ] **Step 6: Commit** con il messaggio `Cassa: Modifica e Rettifica a tasti grandi, al posto del nuovo ordine senza perderlo`.

### Task 6: Schermi stretti, versione 50 e prova finale

**Files:**
- Modify: `app/css/app.css`, `app/index.html` («Versione 50» in 2 punti), `app/sw.js` (`CACHE`), `CHANGELOG.md` (voce `## 50`), `docs/manuale-img/manuale.html` (solo le frasi sulla cassa che citano «− / +», lo stock o la ricerca prenotazione separata)

- [ ] **Step 1:** Controlla la Cassa a 375 × 812 (`resize_window` preset mobile), 1024 × 700 e 1280 × 800. Niente scorrimento orizzontale. A 375 i tasti sono 2 per riga e lo scontrino sta sotto. A 1024 lo scontrino resta fisso mentre la colonna dei tasti scorre.
- [ ] **Step 2:** Prova nel tema scuro (`colorScheme: "dark"`): numerini, tasti `.out` e scontrino si leggono.
- [ ] **Step 3:** Versione 50 e CHANGELOG, in una o due frasi semplici come le voci precedenti, per esempio: «**Cassa:** menù e piatti sono tasti grandi (un tocco = uno in più); a destra lo scontrino con «−», totale, pagamento e «Crea ordine» sempre in vista. Anche Modifica ordine funziona così.» Aggiorna il manuale dove descrive la cassa.
- [ ] **Step 4:** Serata simulata (`serata.html`, 25 ordini) senza errori in console, e controllo a mano dei 5 punti di Review Focus.
- [ ] **Step 5: Commit** con il messaggio `Versione 50: cassa a tasti grandi`.
