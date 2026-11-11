# Guida: GitHub e Firebase per Ordini Oratorio

Questa guida è per chi non ha mai usato GitHub. Non serve scrivere comandi: si usa **GitHub Desktop**, un programma con le finestre.

---

## 1. Come funziona oggi

- **Il sito** è su **https://giovanichef.web.app** (Firebase Hosting, progetto `giovanichef-65d46`, account dell'oratorio oratoriopare@gmail.com).
- **Il codice** è su GitHub (repository privato): lì resta la storia di tutte le versioni.
- **Pubblicare** = un comando dal terminale (lo lancia Claude, vedi punto 4). Mandare il codice su GitHub **non** pubblica niente da solo.
- **Accesso:** il sito si apre solo con il link o il QR che contengono il codice di accesso.

**Parole che incontrerai**

| Parola | Cosa vuol dire |
|---|---|
| Repository (repo) | La cartella del progetto, salvata su GitHub con tutta la sua storia |
| Commit | Una «fotografia» delle modifiche, con una frase che dice cosa è cambiato |
| Push | Mandare i commit dal tuo computer a GitHub |
| Branch (ramo) | Una copia di lavoro separata, per provare senza toccare la versione vera. Quella vera si chiama `main` |
| Deploy | Pubblicare una versione su giovanichef.web.app |

---

## 2. Com'è fatta la cartella del progetto

```
ordini-oratorio/
├── app/                 ← quello che va online (solo questa cartella viene pubblicata)
│   ├── index.html       ← le schermate
│   ├── css/app.css      ← l'aspetto (colori, dimensioni)
│   ├── js/config.js     ← il collegamento a Firebase
│   ├── js/01-base.js … js/11-avvio.js   ← il funzionamento, diviso per argomento
│   ├── sw.js            ← fa aprire l'app anche senza rete
│   └── icone, manifest
├── test/                ← copia di prova con database finto e serata simulata (non va online)
├── docs/                ← questa guida
├── README.md            ← descrizione del progetto
├── CHANGELOG.md         ← cosa è cambiato in ogni versione
├── firebase.json        ← dice a Firebase di pubblicare la cartella app/
└── database.rules.json  ← regole del database (chi può leggere e scrivere)
```

I file in `js/` sono numerati: il browser li carica in quell'ordine.

| File | Cosa contiene |
|---|---|
| `config.js` | Collegamento a Firebase (vero e di prova) |
| `01-base.js` | Stato dell'app, ruoli, accesso con PIN e QR, funzioni comuni |
| `02-cassa.js` | Nuovo ordine, modifica, rettifica, annullo |
| `03-camerieri.js` | Clienti del cameriere, chiamate, consegne |
| `04-cucina.js` | Cucina con reparti e uscita piatti |
| `05-bar.js` | Bar per reparto e consegna al banco |
| `06-avvisi.js` | Suoni, vibrazioni e avvisi |
| `07-persone.js` | Persone, file, ingresso camerieri |
| `08-riepilogo.js` | Riepilogo, tempi, chiusura cassa |
| `09-listino.js` | Reparti, piatti, menù fissi, prezzi |
| `10-evento.js` | Prenotazioni, Excel, nuovo evento, archivio |
| `11-avvio.js` | Aggiornamento delle schermate e collegamento a Firebase |

---

## 3. Prima configurazione (una volta sola, circa 20 minuti)

### 3.1 Crea l'account GitHub
1. Vai su **github.com** → **Sign up**.
2. Usa una mail che controlli; scegli un nome utente (es. `oratorio-giovanichef`).
3. Attiva la **verifica in due passaggi** (Settings → Password and authentication): l'account controlla il sito dell'oratorio, va protetto.

### 3.2 Installa GitHub Desktop
1. Scarica da **desktop.github.com** e installa.
2. Aprilo e accedi con l'account appena creato (**Sign in to GitHub.com**).
3. Quando chiede nome e mail per i commit, lascia quelli proposti.

### 3.3 Metti il progetto su GitHub
1. In GitHub Desktop: **File → Add local repository…** e scegli la cartella `ordini-oratorio`.
   - Se dice che non è un repository, clicca **create a repository** e poi **Create repository** (lascia le opzioni come sono).
2. In alto a destra clicca **Publish repository**.
3. **Lascia spuntato «Keep this code private»**: il codice contiene il collegamento al vostro Firebase, non deve essere pubblico.
4. **Publish repository**. Ora su github.com trovi il progetto.

### 3.4 Firebase sul computer
Lo strumento di Firebase si avvia con `npx` e serve l'accesso con l'account dell'oratorio (già fatto il 11/11/2026). Se un giorno chiede di nuovo l'accesso:
```
npx.cmd -y firebase-tools@15.35.0 login:add
```
e scegli **oratoriopare@gmail.com** (non l'account della ditta).

---

## 4. Il lavoro di tutti i giorni

### 4.1 Pubblicare una modifica
1. La modifica viene fatta nella cartella (da Claude o da te) e provata con la serata simulata.
2. Commit e Push su GitHub (GitHub Desktop: **Commit to main**, poi **Push origin**), così resta la storia.
3. Pubblicazione, dal terminale nella cartella del progetto:
```
npx.cmd -y firebase-tools@15.35.0 deploy --only hosting --project giovanichef-65d46 --account oratoriopare@gmail.com
```
   Se sono cambiate anche le regole del database, al posto di `hosting` scrivi `hosting,database`.
4. Controlla su giovanichef.web.app che sia uscita la versione nuova (ricarica la pagina).

### 4.2 Tornare indietro (es. durante una serata)
**Il modo più veloce:** console.firebase.google.com → progetto **giovanichef-65d46** → **Hosting** → sito **giovanichef** → **Cronologia delle release** → sulla versione che funzionava: **⋮ → Ripristina**. Il sito torna subito a quella versione.

Poi, con calma, sistemate il codice: in GitHub Desktop → **History** → tasto destro sul commit sbagliato → **Revert changes in commit** → Push, e ripubblicate.

### 4.3 Copia di sicurezza del database
Prima di una serata (Claude lo fa per te):
```
npx.cmd -y firebase-tools@15.35.0 database:get / -o backupsackup-AAAA-MM-GG.json --project giovanichef-65d46 --account oratoriopare@gmail.com
```
La cartella `backups` resta solo sul computer (contiene anche il codice di accesso: non condividerla).

---

## 5. Lavorare con Claude sul progetto

1. Apri Claude (scheda Code) **nella cartella `ordini-oratorio`**.
2. Chiedi le modifiche come hai fatto finora. Claude:
   - modifica i file in `app/`,
   - aggiorna il numero di versione (in `index.html` e in `sw.js`),
   - fa girare la **serata simulata** per controllare di non aver rotto niente,
   - aggiorna `CHANGELOG.md`.
3. Commit, Push e pubblicazione (punto 4.1): di solito li fa Claude, tu puoi controllare in GitHub Desktop cosa è cambiato.

**Ogni volta che cambia l'app va aumentata la versione**, sia in `index.html` («Versione N», due punti) sia in `sw.js` (`ordini-oratorio-vN`). Così i telefoni capiscono che devono scaricare quella nuova.

---

## 6. La serata simulata

È una pagina che apre insieme tutti i «telefoni» (casse, cucina, uscita, bar, camerieri) e fa girare una serata intera su un **database finto**, controllando che i conti tornino, che i numeri non si ripetano, che nessun piatto resti bloccato, eccetera.

- **Per lanciarla:** doppio clic su `test\AVVIA-SERATA-SIMULATA.bat`. Si apre il browser: in alto scegli quanti ordini, casse, camerieri e file, poi **Avvia la serata**.
- «Serata n.» cambia la sequenza casuale: con lo stesso numero la serata si ripete identica (utile per rifare la stessa prova dopo una correzione).
- Si apre anche una finestra «Server prova»: chiudila quando hai finito.
- Prima di ogni versione nuova è meglio farla girare: se dice «0 non ok», si può pubblicare.

Non prova la rete vera, i telefoni veri e due persone che premono nello stesso istante. Per quello, prima di una serata importante, conviene una prova con 2 o 3 telefoni.

---

## 7. Prima di ogni serata: lista di controllo

- [ ] La versione in basso nella schermata di accesso è quella giusta su tutti i telefoni
- [ ] Listino controllato: ogni piatto nel suo reparto, menù e prezzi giusti, il Bar segnato «Bar»
- [ ] Porzioni impostate in Cucina → Porzioni (vanno rimesse a ogni nuovo evento)
- [ ] Persone e PIN pronti; reparti assegnati ai cuochi; uscita piatti
- [ ] Prenotazioni importate
- [ ] Fondo cassa inserito
- [ ] QR dei camerieri pronto (generato da giovanichef.web.app)
- [ ] Copia di sicurezza del database (punto 4.3)
- [ ] Durante la serata: scaricare l'Excel un paio di volte come copia
- [ ] A fine serata: chiusura cassa, poi «Nuovo evento» (la serata va in «Serate passate»)

---

## 8. Se qualcosa va storto

| Problema | Cosa fare |
|---|---|
| Dopo un aggiornamento l'app non parte | Firebase → Hosting → Cronologia delle release → versione precedente → **Ripristina** |
| Un telefono dice «Telefono non autorizzato» | Riaprire il link o il QR (Evento → «Mostra link e QR»), oppure incollare il link nella schermata |
| Un telefono mostra ancora la versione vecchia | Chiudere e riaprire l'app con la rete; se non basta, ricaricare la pagina due volte |
| GitHub Desktop dice «conflict» | Non toccare niente e chiedi a Claude: ti guida passo passo |
| Hai fatto Push di qualcosa di sbagliato | History → Revert changes in commit → Push |
