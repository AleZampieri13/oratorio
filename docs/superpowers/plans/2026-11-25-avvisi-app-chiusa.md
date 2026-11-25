# Avvisi ai camerieri con l'app chiusa — piano di lavoro

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** notifiche di sistema ad app chiusa per «Pronto», «Non ancora pronto» e «Ordine annullato», spedite da un Cloudflare Worker gratuito.

**Architecture:** il telefono del cameriere si iscrive (Web Push, VAPID) e salva l'iscrizione in `push/<idPersona>/<uidTelefono>` (radice del database, con `fdb`, non dentro `ev`). Il telefono che fa l'azione legge le iscrizioni dei camerieri del cliente e chiama `POST <WORKER>/invia`; il Worker verifica l'ID token Firebase e spedisce. Il Worker non tocca il database.

**Tech Stack:** HTML/JS senza build (app), Cloudflare Worker con wrangler (cartella `worker/`, ES module), librerie `jose` e una libreria Web Push per Worker (es. `@block65/webcrypto-web-push`).

**Spec:** `docs/superpowers/specs/2026-11-25-avvisi-app-chiusa-design.md`

## Global Constraints
- Niente a pagamento, niente app da scaricare, niente chiave di servizio Firebase in Cloudflare.
- Progetto Firebase `giovanichef-65d46`; origini ammesse dal Worker = domini in `SITI_VERI` di `app/js/config.js` (+ `http://localhost:5520` per l'app di prova).
- Titoli notifica esatti: «Pronto», «Non ancora pronto», «Ordine annullato». Testo: «Pizzoccheri · n. 12»; in parte «Pronti 3 Pizzoccheri · n. 12»; ordini uniti «n. 12 + 13».
- Striscia solo nella pagina Camerieri: «Attiva avvisi» / «Disattiva avvisi».
- Max 20 iscrizioni per richiesta al Worker.
- Un errore di invio non blocca mai l'azione (niente `await` che ritarda il tasto; errori solo in console).
- **Niente test né serata simulata** (decisione dell'utente). Verifica = rilettura del codice; la prova vera con i telefoni la fa l'utente dopo la pubblicazione.
- Non pubblicare niente: Worker e sito li pubblica l'utente.

## Review Focus
1. iPhone in Safari (non dalla Home): `PushManager` assente → la striscia mostra le istruzioni «Aggiungi a Home», non un errore.
2. «Esci»: la cancellazione di `push/<id>/<uid>` va fatta **prima** di togliere `sessioni/<uid>` (dopo le regole la rifiuterebbero).
3. «Libera» del capo/master: cancella tutto `push/<id>` del cameriere.
4. Ordini uniti e «Tutto pronto»: un solo invio per azione e per cameriere, con i piatti elencati.
5. Worker che risponde «scaduti»: il telefono che ha mandato cancella quelle iscrizioni (cerca per `endpoint`).

---

### Task 1: Il Worker

**Files:**
- Create: `worker/wrangler.toml`, `worker/package.json`, `worker/src/index.js`, `worker/README.md`

**Interfaces:**
- Produces: `POST /invia` body `{token:string, a:[{endpoint, keys:{p256dh, auth}}], titolo:string, testo:string, tag:string}` → `200 {inviati:number, scaduti:[endpoint]}`; `401` token non valido; `400` richiesta sbagliata (più di 20 iscrizioni, titolo > 40 o testo > 200 caratteri). `OPTIONS` per CORS.
- Produces: segreto Cloudflare `VAPID_PRIVATA`; variabili in `wrangler.toml`: `VAPID_PUBBLICA`, `VAPID_SUBJECT` (`mailto:` con l'email dell'oratorio — chiederla all'utente, non scriverla tu), `PROGETTO="giovanichef-65d46"`, `ORIGINI` (elenco separato da virgole).

- [ ] **Step 1:** token: verifica RS256 con le chiavi pubbliche `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`, `aud === PROGETTO`, `iss === "https://securetoken.google.com/"+PROGETTO`, non scaduto.
- [ ] **Step 2:** CORS solo per `ORIGINI`; ogni altra origine → 403.
- [ ] **Step 3:** spedizione Web Push (payload JSON `{titolo,testo,tag}`, TTL 300 s, urgenza `high`); 404/410 → in `scaduti`.
- [ ] **Step 4:** `worker/README.md`: passi per l'utente (account Cloudflare con l'email dell'oratorio, `npx web-push generate-vapid-keys` o comando equivalente, `npx wrangler login`, `npx wrangler secret put VAPID_PRIVATA`, `npx wrangler deploy`, dove copiare chiave pubblica e indirizzo in `app/js/config.js`). In PowerShell usare `npx.cmd`.
- [ ] **Step 5: Commit** `Worker Cloudflare per gli avvisi ad app chiusa`

### Task 2: Iscrizione del cameriere, service worker e regole

**Files:**
- Create: `app/js/12-notifiche.js` (aggiungerlo a `index.html` dopo `11-avvio.js` e alla lista `CORE` di `app/sw.js`)
- Modify: `app/js/config.js` (`var PUSH_WORKER = ""; var PUSH_VAPID = "";` — vuoti = avvisi spenti, nessuna striscia)
- Modify: `app/index.html` (striscia nella pagina Camerieri), `app/sw.js` (`push`, `notificationclick`), `app/js/01-base.js` («Esci»), `app/js/07-persone.js` («Libera»), `tools/regole.py` + `database.rules.json` rigenerato

**Interfaces:**
- Produces: `pushPronto() -> bool` (configurato e supportato); `pushAttiva() -> Promise<void>`; `pushDisattiva() -> Promise<void>`; `pushTogli(idPersona, uid?) -> Promise<void>`; `renderPushBar()` chiamata da `renderAll`.

- [ ] **Step 1:** regole in `tools/regole.py`, a radice: `"push": {".read": ANY, "$p": {".write": "<master o capo che cancella>", "$uid": {".write": f"{ACC} && auth.uid === $uid && {SS}.child('u').val() === $p"}}}` (la parte master/capo solo con `!newData.exists()`). Rigenera con `py tools\regole.py`.
- [ ] **Step 2:** `pushAttiva`: `Notification.requestPermission()` dentro il tocco, `serviceWorker.ready`, `pushManager.subscribe({userVisibleOnly:true, applicationServerKey: PUSH_VAPID})`, salva `fdb("push/"+S.me.id+"/"+authUid()).set({endpoint, keys, t:Date.now(), ua:navigator.userAgent.slice(0,120)})`.
- [ ] **Step 3:** `renderPushBar`: solo se `S.role==="camerieri"` e `pushPronto()`; stati: da attivare / istruzioni iPhone (iOS e non `navigator.standalone` né `display-mode: standalone`) / permesso negato / attivi («Disattiva avvisi»). Stile come `#sndbar`.
- [ ] **Step 4:** `sw.js`: `push` → `showNotification(titolo,{body:testo, tag, icon:"icon-192.png", badge:"icon-192.png", renotify:true})`; `notificationclick` → `clients.matchAll` + `focus()` oppure `openWindow("./")`.
- [ ] **Step 5:** «Esci» (01-base.js): `await pushTogli(S.me.id, authUid())` prima di `sessioni/... remove()` e `pushManager` `unsubscribe()`. «Libera» (07-persone.js): `fdb("push/"+id).remove()`.
- [ ] **Step 6:** rileggi e controlla i punti 1-3 di Review Focus.
- [ ] **Step 7: Commit** `Camerieri: Attiva avvisi (notifiche ad app chiusa), regole push`

### Task 3: Mandare gli avvisi dalle azioni

**Files:**
- Modify: `app/js/12-notifiche.js`, `app/js/03-camerieri.js` (`setStato`), `app/js/04-cucina.js` (`setPart`, `readyItM`, `splitCalled` con `rs`, handler uscita `data-oready`, `data-oreadyall`, `data-ounready`, `data-runready`, `data-rsetall`, `data-rsetm`, e il nuovo `data-ogm` se c'è), `app/js/01-base.js` (`burnOrder`), `CHANGELOG.md`, versione (`app/index.html`, `app/sw.js`: prossimo numero dopo l'ultimo nel CHANGELOG)

**Interfaces:**
- Consumes: `ownerId(o)`, `sharedIds(o)`, `unitiOf(o)`, `gNums(G)`, `piattoNome(k)`, `pushPronto()`.
- Produces: `avvisaCamerieri(tipo:"pronto"|"nonpronto"|"annullato", voci:[{n:number, k?:string, q?:number}])` — non restituisce niente da aspettare; raggruppa per cameriere, un invio per cameriere.

- [ ] **Step 1:** `avvisaCamerieri`: destinatari = `ownerId` + `sharedIds` di ogni ordine (esclusi `asportoSubito` senza cameriere); per ognuno `fdb("push/"+id).once("value")`; testo come in Global Constraints (più piatti: «Pizzoccheri, Sciatt · n. 12»); `tag` = `"o"+gKey`; `token = await firebase.auth().currentUser.getIdToken()`; `fetch(PUSH_WORKER+"/invia",…)`; `scaduti` → cancella le iscrizioni con quell'`endpoint`. Tutto in `try/catch` senza bloccare.
- [ ] **Step 2:** chiamala **una volta per azione dell'utente**, dopo che la scrittura è riuscita, nei punti dove un piatto diventa `pronta` per tocco di uscita o bar (non nei passaggi interni chiamati con `silent`, ma alla fine dell'handler), dove torna `chiamata` da `pronta` (Annulla), e in `burnOrder` (`"annullato"`).
- [ ] **Step 3:** rileggi e controlla i punti 4-5 di Review Focus.
- [ ] **Step 4:** CHANGELOG: «**Avvisi con l'app chiusa (camerieri):** nella pagina Camerieri «Attiva avvisi». Arrivano anche con l'app chiusa o lo schermo spento: Pronto, Non ancora pronto, Ordine annullato. Su iPhone l'app va aggiunta alla schermata Home (iOS 16.4 o più recente). Serve il Worker su Cloudflare (vedi worker/README.md).»
- [ ] **Step 5:** README del progetto: sezione «Avvisi ad app chiusa» con rimando a `worker/README.md` e la pubblicazione `--only hosting,database`.
- [ ] **Step 6: Commit** `Avvisi ai camerieri ad app chiusa: Pronto, Non ancora pronto, Ordine annullato`
