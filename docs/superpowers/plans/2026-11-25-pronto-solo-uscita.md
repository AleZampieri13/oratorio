# «Pronto» lo segna solo l'uscita — piano di lavoro (versione 39)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** la cucina non ha più tasti che cambiano lo stato dei piatti; l'uscita segna Pronto (anche in parte) e vede gli ordini uniti in una riga sola.

**Architecture:** cucina e bar usano la stessa funzione `renderRepView` (app/js/04-cucina.js): le si passa un'opzione che toglie i tasti solo per la cucina. All'uscita la lista «In preparazione» (`#o-wip`, `renderUscita`) raggruppa gli ordini uniti come già fa la cucina, riusando `readyItM`, `gNowOf`, il campo `kqg` e l'attributo `data-gqk` (aggiornati da `qtyLabels` in 11-avvio.js).

**Tech Stack:** HTML/JS senza build, Firebase Realtime Database; prove con `test/serata.html` (serata simulata nel browser, database finto).

**Spec:** `docs/superpowers/specs/2026-11-25-pronto-solo-uscita-design.md`

## Global Constraints
- Solo la **cucina** perde i tasti; il **bar** tiene tutto (stessa `renderRepView`).
- Nessuna impostazione «chi segna pronto»: regola fissa.
- Il pronto in parte resta all'uscita: singolo, per scelte (Naturale/Frizzante) e per ordini uniti.
- Nessuna scritta «2ª volta» o simile: il resto è una riga col solo nome del piatto.
- Tutte le scritte dell'app in maiuscolo via CSS come oggi (non cambiare lo stile).
- Versione 39: `app/index.html` (due volte «Versione 39»), `app/sw.js` (`ordini-oratorio-v39`).

## Review Focus
1. Cucina con reparto fisso (cuoco con reparto in Persone) **e** cucina «Tutti»: in nessuno dei due ci sono tasti — anche nel ramo di `renderKitchen` senza reparti (`#k-queue` con `data-set="…|pronta"`, `#k-ready` con «Portato»/`data-kunready`).
2. Il bar continua ad avere «Pronto», «Pronti N», «Tutto pronto», «Annulla», «Portato».
3. Schede della cucina senza tasto ancora allineate: `kWrapCard` oggi tratta l'ultimo figlio come tasto.
4. Ordine unito dove il piatto di un ordine è già pronto e quello dell'altro no: la riga unita somma solo i chiamati.
5. Uscita con un reparto per stand (`#o-reps` / reparto in Persone): la riga unita compare solo nello stand del suo reparto e segna solo quello.

Ognuno ha il suo controllo nella serata simulata (Task 1 per 1-3, Task 2 per 4-5).

## Come si prova (vale per tutti i task)
1. `powershell -NoProfile -ExecutionPolicy Bypass -File test\genera-prova.ps1` (rigenera la copia di prova da `app/`).
2. Avvia il server con preview_start `{name:"ordini-prova"}` (porta 5520).
3. Apri `http://localhost:5520/serata.html?ordini=80`, «Avvia la serata», aspetta la fine: in fondo deve dire **0 non ok**. Poi lo stesso con `&caos=1`.

---

### Task 1: Cucina senza tasti, il pronto lo fa l'uscita

**Files:**
- Modify: `app/js/04-cucina.js` (`renderRepView`, `renderKitchenRep`, `renderKitchen`, `kWrapCard`)
- Modify: `app/js/05-bar.js` solo se serve passare l'opzione esplicita
- Test: `test/serata.html` (`cookAct`, `uscitaAct`, `caosAct`, controlli finali)

**Interfaces:**
- Produces: `renderRepView(sc, ids, opts)` con `opts.noBtn === true` → nessun `button` in `#k-queue` e `#k-ready`, nessun campo `input.qtyin` in `#k-queue`; quantità mostrate come `<b>N</b>` (scelte: un `<b>` per scelta). Senza `opts` comportamento identico a oggi (bar).

- [ ] **Step 1: Cambia la serata simulata (prima del codice)**
  - `cookAct(n)`: niente più clic; solo le letture (`frittoVedeExtra`, `cucinaVedeBar`). Aggiungi `STAT.kTasti += qa(n,"#k-queue button, #k-ready button, #k-queue input.qtyin").length`.
  - `uscitaAct()`: segna pronto dalla `#o-wip` a ogni giro (non più con probabilità `.08`): fino a 3 tasti `button[data-oready]` (e dal Task 2 anche `button[data-ogm]`); con probabilità `PR(.15)` prima abbassa un campo `input.qtyin[data-kqi]` a `floor(q/2)` e verifica come oggi in `cookAct` che il resto sia rimasto da preparare (`STAT.kParz`, `STAT.kParzKo`).
  - Il pronto in parte per scelta (`kScParz`) resta al bar, invariato.
  - `caosAct`: il blocco «cucina: pronto per sbaglio, poi Annulla» (`#k-ready button[data-runready]`) va tolto; l'annullo all'uscita (`oAnnulla`) c'è già.
  - Togli `unreadyDone` / «Il Fritto annulla un pronto»; in controllo 605 togli `"unready"` dall'elenco dei `cz` obbligatori.
  - Controlli nuovi: `check(STAT.kTasti===0,"Cucina: nessun tasto Pronto / Portato / Annulla né campi")`; `check(qa("bar","#b-queue button").length>0||STAT.barPronti>0,"Il bar ha ancora i suoi tasti")` (conta `STAT.barPronti` in `barAct` a ogni clic); allineamento: per ogni cuoco, ogni `#k-queue .kcard` ha un `.kbody` e il suo ultimo figlio non è vuoto.
  - Il controllo 565 (`tuttoPronto>0`) vale ora per il bar: conta `STAT.tuttoPronto` in `barAct` quando clicca `data-rsetall`.
  - Il controllo 606 (`kParz`) ora dice «Uscita: pronti in parte …».

- [ ] **Step 2: Esegui la serata simulata — deve fallire**
  Atteso: NO su «Cucina: nessun tasto…».

- [ ] **Step 3: Implementa**
  - `renderKitchenRep(sc)` chiama `renderRepView(sc,{…},{noBtn:true})`; con `noBtn` niente `btn1`, niente tasto «Tutto pronto», quantità `<b>` invece di `qtyField`/`kQtyHtml` (scelte: `kscn`), e `#k-ready` righe senza `<span class="row">` di tasti.
  - Ramo senza reparti di `renderKitchen`: togli il tasto `data-set="…|pronta"` da `#k-queue` e i tasti di `#k-ready`.
  - `kWrapCard`: se l'ultimo figlio non è un `button`, mette nel `.kbody` tutti i figli dal terzo in poi.
  - Gli handler `data-kunready` e quelli globali restano (servono al bar).

- [ ] **Step 4: Serata simulata normale e con `&caos=1`** — atteso **0 non ok** in tutte e due.

- [ ] **Step 5: Commit** `Cucina: niente tasti Pronto/Portato/Annulla, il pronto lo segna l'uscita`

---

### Task 2: Uscita, ordini uniti in una riga sola

**Files:**
- Modify: `app/js/04-cucina.js` (`renderUscita` → `#o-wip`, nuovo handler `data-ogm`)
- Test: `test/serata.html` (`waiterAct` o passo dedicato, `uscitaAct`, controlli finali)

**Interfaces:**
- Consumes: `unitiOf(o)`, `gKey(o)`, `gNums(G)`, `gNome(G)`, `itsQ(its)`, `gNowOf(key,q)`, `scMerge(ps)`, `readyItM(ents)` (ents = `[[numero,k,r],…]`), `oReadyReps(c,sc)`, campo `qtyField("kqg", key, x, q, label)` con tasto `data-gqk="${key}"` (`qtyLabels` in 11-avvio.js aggiorna la scritta).
- Produces: riga unita in `#o-wip` con tasto `button[data-ogm="12>k>r,13>k>r"]` e `data-gqk="${gKey}|${kBase(k)}|${r}"`.

- [ ] **Step 1: Serata simulata**
  - Unisci qualche cliente: un cameriere con 2+ clienti seduti tocca «Unisci» e poi un altro cliente (`button[data-pkj]` in 03-camerieri.js), almeno 3 volte a serata (`STAT.unisci`).
  - `uscitaAct`: se in `#o-wip` c'è un `button[data-ogm]`, con probabilità `PR(.3)` abbassa il suo campo `input.qtyin[data-kqg]` a `floor(q/2)` e clicca; verifica che le porzioni pronte siano esattamente quelle scritte e che le porzioni chiamate rimaste nel gruppo siano `q - x` (`STAT.oUniti`, `STAT.oUnitiKo`).
  - Controlli: `check(STAT.unisci>=3&&STAT.oUniti>0&&!STAT.oUnitiKo.length,"Uscita: ordini uniti in una riga, pronti in parte giusti")`; nessuna riga di `#o-wip` di un ordine unito mostra un solo numero se l'altro ordine ha lo stesso piatto chiamato; con uno stand di un reparto (`o-reps`) la riga unita compare solo se il piatto è del suo reparto.

- [ ] **Step 2: Esegui — deve fallire** (manca `data-ogm`).

- [ ] **Step 3: Implementa**
  - In `renderUscita` raggruppa `wip` (esclusi `asportoSubito`) come `rG`: stesso `gKey` e stesso `kBase(k)`; gruppi con un solo pezzo restano la riga di oggi.
  - Riga unita: «n. 12 + 13», nome/i cliente, quantità sommata con campo `kqg` se ≥ 2, scelte sommate con `scMerge`, tasto «Pronto» / «Pronti N».
  - Handler `data-ogm`: per ogni reparto `r` in `oReadyReps` del primo pezzo chiama `readyItM(ents con quel r)`; toast come l'handler `data-rsetm` della cucina. Prima l'ordine col numero più basso (lo fa già `readyItM`).

- [ ] **Step 4: Serata simulata normale e `&caos=1`** — **0 non ok**.

- [ ] **Step 5: Commit** `Uscita: ordini uniti in una riga sola, anche per i pronti in parte`

---

### Task 3: Versione 39, CHANGELOG e manuale

**Files:**
- Modify: `app/index.html` (due «Versione 38» → 39), `app/sw.js` (`ordini-oratorio-v39`), `CHANGELOG.md` (sezione `## 39` in cima), `docs/manuale-img/manuale.html` (cucina e uscita; schermate `cucina.png`, `cucina-reparto.png`, `uscita.png` rifatte dall'app di prova)

- [ ] **Step 1:** versione e CHANGELOG: due voci — «Cucina: niente più tasti Pronto / Portato / Annulla: il pronto lo segna l'uscita (anche in parte)» e «Uscita: ordini uniti in una riga sola, anche per i pronti in parte».
- [ ] **Step 2:** manuale: la pagina cucina dice che la cucina solo prepara; la pagina uscita spiega Pronto, pronti in parte e ordini uniti. Rifare le tre schermate. Il PDF si rigenera dall'HTML (stampa in PDF) — se non si riesce in automatico, dirlo all'utente.
- [ ] **Step 3:** serata simulata finale normale e `&caos=1`: **0 non ok**.
- [ ] **Step 4: Commit** `Versione 39: il pronto lo segna l'uscita, ordini uniti all'uscita`

La pubblicazione su Firebase la fa l'utente dal suo terminale, dopo una prova con i telefoni.
