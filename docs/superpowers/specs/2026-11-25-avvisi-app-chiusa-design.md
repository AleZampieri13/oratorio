# Avvisi ai camerieri con l'app chiusa — progetto

## Perché
Alla serata del 21/11/2026 i camerieri sono rimasti fermi alla distribuzione anche mezz'ora ad aspettare i piatti: con l'app **chiusa** non ricevono nessun avviso (oggi suono e vibrazione funzionano solo con l'app aperta in primo piano). Lo scopo è **lasciarli liberi** di servire e sparecchiare e chiamarli quando il piatto è pronto.

**Successo:** con l'app chiusa (anche schermo spento, anche iPhone) il cameriere riceve la notifica «Pronto» entro pochi secondi da quando l'uscita (o il bar) lo segna.

## Obiettivi
Notifiche di sistema ad app chiusa per i tre avvisi che il cameriere ha già oggi dentro l'app (`checkEvents` in `app/js/06-avvisi.js`):
1. **Pronto** — «Pronto: Pizzoccheri · n. 12» (ordini uniti: un avviso solo, «n. 12 + 13», come `gAvvisi`).
2. **Non ancora pronto** — un pronto annullato («Non ancora pronto: Pizzoccheri · n. 12»).
3. **Ordine annullato** dalla cassa — «Ordine n. 12 annullato».

Destinatari: gli stessi di oggi, i camerieri del cliente (`ownerId(o)` + `sharedIds(o)`, 03-camerieri.js). Asporto «mandato subito» senza cameriere: nessuno.

## Non obiettivi / anti-obiettivi
- **Niente a pagamento**: niente piano Blaze di Firebase, niente carta di credito (Cloudflare Workers gratuito).
- **Niente app da scaricare** (scartato ntfy).
- **Niente «manca poco»**: deciso di lasciarlo stare.
- Niente notifiche alla cassa (ha sempre l'app aperta).
- Niente chiave di servizio di Firebase dentro Cloudflare: il Worker non legge né scrive il database.

## Vincoli
- Molti camerieri hanno **iPhone**: Web Push solo da iOS 16.4 e solo con l'app aggiunta alla schermata Home e aperta da lì. Il permesso si chiede solo dopo un tocco.
- Su iPhone ogni push **deve** mostrare una notifica (altrimenti Safari può togliere l'iscrizione).
- Il sito è su Firebase Hosting (`giovanichef.web.app`); si pubblica dal terminale dell'utente con l'account dell'oratorio. Il Worker si pubblica allo stesso modo (wrangler), account Cloudflare con l'email dell'oratorio.
- Accesso al database solo per telefoni registrati col codice (regole generate da `tools/regole.py`).
- Nessun test né serata simulata adesso (decisione dell'utente); prima di una serata serve una prova vera con 2-3 iPhone e 1 Android.

## Approcci considerati
- **A — il telefono che agisce prepara, il Worker spedisce (scelto).** Il telefono che segna Pronto / Annulla / annulla l'ordine legge dal database gli indirizzi di notifica dei camerieri e li manda al Worker col testo; il Worker controlla che chi chiama sia un telefono dell'app e spedisce. Il Worker non tocca il database: nessuna chiave potente.
- B — il Worker legge il database da solo: scartato, serve una chiave di servizio di Firebase in Cloudflare senza vantaggi.
- ntfy: scartato, app in più.

## Come funziona

### Per il cameriere
- Nella pagina del cameriere, finché gli avvisi non sono attivi su quel telefono, una striscia **«Attiva avvisi»**. Tocco → richiesta di permesso → iscrizione salvata.
- iPhone in Safari (non dalla Home): la striscia spiega «Condividi → Aggiungi a Home», poi aprire dall'icona (lì il telefono va registrato col link/codice, già previsto).
- Permesso negato: la striscia dice come riattivarlo dalle impostazioni del telefono.
- Nella stessa pagina **«Disattiva avvisi»** quando sono attivi.
- Notifica: titolo «Pronto» / «Non ancora pronto» / «Ordine annullato», testo «Pizzoccheri · n. 12». Tocco → apre (o porta avanti) l'app sulla pagina del cameriere.
- Le notifiche dello stesso ordine si sostituiscono (stesso `tag` per ordine/gruppo). Anche con l'app aperta la notifica può comparire (*scelta mia*: semplice, ed è obbligatorio su iPhone).

### Dati
- `push/<idPersona>/<idTelefono>` = `{endpoint, keys:{p256dh, auth}, t, ua}`. `idPersona` = la persona della sessione (`S.me.id`); `idTelefono` = l'uid Firebase del telefono (un cameriere può avere più telefoni).
- Regole (in `tools/regole.py`): leggere `push` = chiunque abbia una sessione valida (`ANY`); scrivere `push/$p/$uid` = solo il telefono `auth.uid === $uid` con sessione la cui persona è `$p`, oppure cancellare (anche il master/capo, per «libera»). Poi rigenerare `database.rules.json` e pubblicare con `--only hosting,database`.
- Cancellazione: quando il cameriere esce, viene «liberato» o tocca «Disattiva»; e quando il Worker risponde che un indirizzo è scaduto (404/410), il telefono che ha mandato lo cancella.

### Chi manda
Il telefono che fa l'azione, **dopo** che la scrittura nel database è riuscita:
- uscita o bar segnano un piatto **pronto** (anche in parte, anche ordini uniti, anche asporto) → «Pronto»;
- uscita o bar annullano un pronto → «Non ancora pronto»;
- la cassa (o il master) annulla un ordine (`burnOrder`) → «Ordine annullato».

Una funzione sola, `avvisaCamerieri(tipo, ordini, piatto)`, raccoglie i destinatari, legge `push/<id>` di ognuno, chiama il Worker. Se fallisce non blocca niente (l'avviso dentro l'app resta come oggi). Un solo invio per azione, anche quando l'azione segna più piatti insieme («Tutto pronto»: un avviso con i piatti elencati).

### Il Worker (Cloudflare)
- Cartella nuova `worker/` nel progetto (`wrangler.toml`, `src/index.js`), pubblicato dall'utente con `npx wrangler deploy`.
- Un solo indirizzo: `POST /invia` con `{token, a:[{endpoint, keys}], titolo, testo, tag}`.
- Controlli: `token` = ID token Firebase del telefono (firma Google, `aud` = `giovanichef-65d46`, non scaduto); richiesta solo dall'origine del sito (CORS `giovanichef.web.app` e domini in `SITI_VERI`); al massimo 20 indirizzi per richiesta, testo corto.
- Spedisce con Web Push (VAPID). Risponde con l'elenco degli indirizzi scaduti.
- Segreti in Cloudflare: la chiave privata VAPID. La chiave pubblica VAPID e l'indirizzo del Worker vanno in `app/js/config.js`.
- *Scelta mia:* librerie `jose` (token) e una libreria Web Push compatibile con i Worker (es. `@block65/webcrypto-web-push`); chi costruisce può sceglierne un'altra equivalente.

Nota sulla sicurezza: un token anonimo di Firebase lo può ottenere chiunque apra il sito, ma senza codice d'accesso non può leggere gli indirizzi di notifica dal database, quindi non ha a chi mandare. Accettabile.

### Service worker (`app/sw.js`)
- `push`: mostra la notifica (titolo, testo, `tag`, icona `icon-192.png`).
- `notificationclick`: porta avanti una finestra dell'app già aperta o ne apre una.

### Cosa fa l'utente una volta sola (con istruzioni passo passo nel README)
1. Account Cloudflare gratuito con l'email dell'oratorio.
2. Generare le chiavi VAPID con un comando preparato.
3. `npx wrangler secret put VAPID_PRIVATA` e `npx wrangler deploy` dal suo terminale.
4. Pubblicare il sito con `--only hosting,database`.

## Altre scelte mie
- La striscia «Attiva avvisi» compare a chiunque apra la pagina Camerieri (anche il capo camerieri), non nelle altre pagine.
- Pronto in parte: il testo dice quanti, «Pronti 3 Pizzoccheri · n. 12».
- Le modifiche entrano nella prossima versione dell'app (numero e CHANGELOG come al solito).

## Lasciato a chi costruisce
Testi esatti delle istruzioni iPhone, aspetto della striscia (stile delle strisce esistenti come «Suono bloccato»), struttura interna del Worker.
