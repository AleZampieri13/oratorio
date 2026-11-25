# Chiudere una prenotazione arrivata in parte — piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dopo «Crea ordine» da una prenotazione che resta in parte, la cassa chiede «Aspetta / Chiudi»; una prenotazione chiusa si può riaprire, e contatori ed Excel la contano come gestita.

**Architecture:** nuovo valore `stato:"chiusa"` sulle prenotazioni (`/prenotazioni/<id>`), oltre a `attesa`, `parziale`, `arrivata`. La domanda sta nel riquadro dell'ultimo ordine (`#c-last`, `renderTicket`), perché `#c-msg` viene svuotato subito dopo la creazione. L'annullo di un ordine (`burnOrder` in 01-base.js) ricalcola già lo stato con `prenStato`, quindi la chiusura si perde da sola: non va toccato.

**Tech Stack:** HTML/JS senza build, Firebase Realtime Database.

**Spec:** `docs/superpowers/specs/2026-11-25-prenotazione-chiusa-design.md`

## Global Constraints
- Parole dei tasti e dello stato, esatte: **Aspetta**, **Chiudi**, **Riapri**, **Chiusa**.
- Testo della domanda: «<nome>: manca 1 coperto» / «<nome>: mancano N coperti» / «<nome>: mancano piatti da soli».
- Pallino nella ricerca: «Chiusa · n. 12 · 3 su 4».
- Contatore: «X gestite su Y» (gestite = arrivata + chiusa), più « · N in parte» se ce ne sono.
- Excel prenotazioni: «Arrivati» = Sì / No / In parte / Chiusa; nuova colonna «Quanti» = «3 su 4». Riepilogo: «Prenotazioni arrivate» solo `arrivata`; nuova riga «Prenotazioni chiuse».
- Nessuna modifica a `database.rules.json` / `tools/regole.py` (la cassa scrive già `prenotazioni`).
- **Niente test né serata simulata** (decisione dell'utente: si aggiornano alla fine di tutte le modifiche). Verifica = rilettura del codice toccato.

## Review Focus
1. Il cassiere crea subito un altro ordine senza rispondere: la domanda della prenotazione precedente sparisce e la prenotazione resta «parziale» (= Aspetta).
2. Dopo 61 s `renderTicket` si ridisegna: la domanda non risposta deve restare.
3. Prenotazione chiusa nella ricerca: oggi i risultati `arrivata` sono `disabled`; la chiusa deve restare toccabile per mostrare «Riapri», ma non deve caricarsi nel modulo finché non si riapre.
4. Due casse: una chiude mentre l'altra ha la stessa prenotazione selezionata — al «Crea ordine» dell'altra lo stato si ricalcola con `prenStato` e torna `parziale`/`arrivata`: accettabile, nessun blocco.
5. Re-import del file con «togli»: le `chiusa` non vanno tolte (`planImport`, riga con `p.stato!=="arrivata"&&p.stato!=="parziale"`).

---

### Task 1: Domanda «Aspetta / Chiudi» dopo «Crea ordine»

**Files:**
- Modify: `app/js/02-cassa.js` (`createOrder` intorno alle righe 375-390, `renderTicket`, `resetForm` se serve)
- Modify: `app/js/10-evento.js` (nuova funzione accanto a `prenRestTxt`)
- Modify: `app/css/app.css` solo se servono stili per la riga della domanda (riusa `.btn small`)

**Interfaces:**
- Produces: `prenMancaTxt(p) -> string` («manca 1 coperto» / «mancano N coperti» / «mancano piatti da soli»), usa `prenLeft(p)`.
- Produces: `S.askPren = {id, n} | null` — impostato in `createOrder` quando lo stato calcolato è `"parziale"`, azzerato alla creazione del prossimo ordine e alla risposta.
- Produces: tasti `button[data-pask="aspetta"]` e `button[data-pask="chiudi"]` dentro `#c-last`.

- [ ] **Step 1:** in `createOrder`, al posto di `prenMsg` (che finisce in `#c-msg`, svuotato subito) imposta `S.askPren={id:pren,n}` se `st==="parziale"`, altrimenti `S.askPren=null`.
- [ ] **Step 2:** in `renderTicket`, se `S.askPren` e la prenotazione è ancora `parziale`, aggiungi in fondo a `#c-last` la riga «<nome>: <prenMancaTxt> · [Aspetta] [Chiudi]». Se lo stato non è più `parziale`, azzera `S.askPren`.
- [ ] **Step 3:** handler su `#c-last`: **Aspetta** → `S.askPren=null`, ridisegna. **Chiudi** → `R("prenotazioni/"+id).update({stato:"chiusa",chiusaT:Date.now(),chiusaDa:myName()})`, `logChange("Prenotazione <nome>: chiusa (<prenMancaTxt>)")`, `S.askPren=null`, ridisegna; errore → `showBanner(errText(e))`.
- [ ] **Step 4:** rileggi `createOrder`/`renderTicket` e controlla i punti 1-2 di Review Focus.
- [ ] **Step 5: Commit** `Cassa: dopo un arrivo in parte chiede Aspetta / Chiudi`

### Task 2: Ricerca, Riapri e contatori

**Files:**
- Modify: `app/js/10-evento.js` (`prenPill`, `renderPrenList` contatore)
- Modify: `app/js/02-cassa.js` (`renderSearch`, click su `#c-results`, `selectPren`)

**Interfaces:**
- Consumes: `prenNums(p)`, `prenLeft(p)`, `cop`, `righe`.
- Produces: `prenQuanti(p) -> {arr:number, tot:number}` in 10-evento.js: `tot=cop(righe(p))`, `arr=tot-cop(prenLeft(p).rr)`.
- Produces: `prenGestite(P) -> number` = numero con stato `arrivata` o `chiusa`.

- [ ] **Step 1:** `prenPill`: per `chiusa` → `<span class="pill ready">Chiusa · n. 12 · 3 su 4</span>` (numeri da `prenNums`, quanti da `prenQuanti`).
- [ ] **Step 2:** `renderSearch`: risultato `chiusa` non `disabled`; toccandolo, invece di `selectPren`, mostra sotto il risultato il tasto `button[data-prenriapri="<id>"]` «Riapri».
- [ ] **Step 3:** «Riapri» → `update({stato:"parziale",chiusaT:null,chiusaDa:null})`, `logChange("Prenotazione <nome>: riaperta")`, poi `selectPren(id)` (carica solo quello che manca, come oggi).
- [ ] **Step 4:** contatori `#c-prencount` (02-cassa.js) e `#e-prencount` (10-evento.js): «X gestite su Y» + « · N in parte».
- [ ] **Step 5:** rileggi e controlla il punto 3 di Review Focus.
- [ ] **Step 6: Commit** `Prenotazioni chiuse: pallino Chiusa, Riapri, contatore gestite`

### Task 3: Excel, import e CHANGELOG

**Files:**
- Modify: `app/js/10-evento.js` (foglio prenotazioni riga ~165-166, riepilogo riga ~174, `planImport` riga ~74)
- Modify: `CHANGELOG.md` (voce nella sezione della prossima versione; se la `## 39` non c'è ancora, creala)

- [ ] **Step 1:** foglio prenotazioni: «Arrivati» aggiunge `chiusa → "Chiusa"`; nuova colonna «Quanti» dopo «Arrivati» = `${arr} su ${tot}` da `prenQuanti` (vuota se `attesa`).
- [ ] **Step 2:** riepilogo: dopo «Prenotazioni arrivate» aggiungi `["Prenotazioni chiuse", n chiuse]`.
- [ ] **Step 3:** `planImport`: tieni anche `p.stato==="chiusa"` quando si tolgono le prenotazioni non più nel file.
- [ ] **Step 4:** CHANGELOG: «**Prenotazione arrivata in parte:** dopo l'ordine la cassa chiede **Aspetta** o **Chiudi**. Una prenotazione chiusa è «Chiusa · 3 su 4», si può riaprire con **Riapri**; il contatore dice «gestite» e nell'Excel c'è «Chiusa» e la colonna «Quanti».»
- [ ] **Step 5: Commit** `Prenotazioni chiuse nell'Excel, nell'import e nel CHANGELOG`

Non pubblicare su Firebase: lo fa l'utente dal suo terminale.
