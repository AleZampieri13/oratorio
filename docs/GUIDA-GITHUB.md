# Guida: GitHub e Netlify per Ordini Oratorio

Questa guida è per chi non ha mai usato GitHub. Non serve scrivere comandi: si usa **GitHub Desktop**, un programma con le finestre.

---

## 1. A cosa serve

Oggi l'app si aggiorna così: zip → estrai → trascini la cartella su Netlify. Funziona, ma:
- non resta traccia di cosa è cambiato tra una versione e l'altra;
- se una versione nuova ha un problema, tornare indietro è scomodo;
- per provare una modifica bisogna pubblicarla sul sito vero.

Con GitHub:

| Prima | Dopo |
|---|---|
| Zip in Download | Tutte le versioni salvate in un posto solo, con data e descrizione |
| Trascini la cartella su Netlify | Premi «Push» e Netlify pubblica da solo in circa un minuto |
| Per tornare indietro cerchi lo zip vecchio | Un clic su Netlify ripubblica la versione di prima |
| Le prove si fanno sul sito vero | Ogni prova ha il suo link separato, il sito vero non cambia |

**Parole che incontrerai**

| Parola | Cosa vuol dire |
|---|---|
| Repository (repo) | La cartella del progetto, salvata su GitHub con tutta la sua storia |
| Commit | Una «fotografia» delle modifiche, con una frase che dice cosa è cambiato |
| Push | Mandare i commit dal tuo computer a GitHub |
| Branch (ramo) | Una copia di lavoro separata, per provare senza toccare la versione vera. Quella vera si chiama `main` |
| Deploy | Netlify che mette online una versione |
| Deploy Preview / Branch deploy | Un link di prova che Netlify crea per un ramo |

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
└── netlify.toml         ← dice a Netlify di pubblicare la cartella app/
```

I file in `js/` sono numerati: il browser li carica in quell'ordine.

| File | Cosa contiene |
|---|---|
| `config.js` | Collegamento a Firebase (vero e di prova) |
| `01-base.js` | Stato dell'app, ruoli, accesso con PIN e QR, funzioni comuni |
| `02-cassa.js` | Nuovo ordine, modifica, rettifica, annullo |
| `03-camerieri.js` | Clienti del cameriere, chiamate, consegne |
| `04-cucina.js` | Cucina con reparti e uscita piatti |
| `05-bar.js` | Bar e scorte bevande |
| `06-avvisi.js` | Suoni, vibrazioni e avvisi |
| `07-persone.js` | Persone, file, ingresso camerieri |
| `08-riepilogo.js` | Riepilogo, tempi, chiusura cassa |
| `09-listino.js` | Menù, portate, prezzi, reparti |
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

### 3.4 Collega Netlify a GitHub
1. Vai su **app.netlify.com** e apri il sito **giovanichef**.
2. **Site configuration → Build & deploy → Continuous deployment → Link repository**.
3. Scegli **GitHub**, autorizza Netlify, e scegli il repository `ordini-oratorio`.
4. Impostazioni:
   - **Branch to deploy:** `main`
   - **Base directory:** vuoto
   - **Build command:** vuoto
   - **Publish directory:** `app` (è già scritto nel file `netlify.toml`, Netlify lo legge da solo)
5. **Deploy**. Dopo un minuto apri giovanichef.netlify.app: in basso nella schermata di accesso deve esserci la versione nuova.

> Da questo momento **non trascinare più cartelle** su Netlify: pubblica tutto quello che arriva su `main`.

### 3.5 (Consigliato) Link di prova per ogni ramo
In Netlify: **Site configuration → Build & deploy → Branches and deploy contexts**:
- **Deploy Previews:** attivo
- **Branch deploys:** «All»

Così ogni ramo ha il suo indirizzo, tipo `prova-tavoli--giovanichef.netlify.app`.

### 3.6 (Consigliato) Un Firebase di prova
I link di prova, se non fai niente, usano **lo stesso database della serata vera**. Per provare senza rischi:
1. Su **console.firebase.google.com** crea un secondo progetto, es. `giovanichef-prova`, e configuralo come il primo (Authentication → Anonimo; Realtime Database in Europa; stesse regole).
2. Copia il suo blocco `firebaseConfig` (Impostazioni progetto → Le tue app).
3. Incollalo in `app/js/config.js` al posto di `var CONFIG_PROVA = null;` (oppure chiedi a Claude di farlo).

Da quel momento:
- **giovanichef.netlify.app** → database vero
- **qualsiasi altro indirizzo** (link di prova, computer) → database di prova, e il titolo della pagina comincia con «PROVA»

---

## 4. Il lavoro di tutti i giorni

### 4.1 Una modifica piccola, pubblicata subito
1. La modifica viene fatta nella cartella (da te o da Claude).
2. Apri GitHub Desktop: a sinistra vedi i file cambiati, a destra cosa è cambiato (rosso = tolto, verde = aggiunto).
3. In basso a sinistra scrivi una frase chiara nel **Summary**, es. `Cassa: il resto si vede più grande`.
4. **Commit to main**.
5. **Push origin** (in alto).
6. Dopo circa un minuto Netlify pubblica. Controlla il numero di versione in basso nella schermata di accesso.

### 4.2 Una modifica da provare prima
1. In GitHub Desktop: **Current branch → New branch**, nome tipo `prova-uscita-piatti`.
2. Fai le modifiche, poi **Commit to prova-uscita-piatti** e **Publish branch**.
3. Netlify crea il link di prova (lo trovi in Netlify → Deploys). Provate con i telefoni.
4. Se va bene: su github.com apri il repository → **Compare & pull request** → **Create pull request** → **Merge pull request**. Netlify pubblica sul sito vero.
5. Se non va bene: in GitHub Desktop torna su `main`; il ramo si può cancellare (Branch → Delete).

### 4.3 Tornare indietro (es. durante una serata)
**Il modo più veloce (10 secondi):** Netlify → **Deploys** → clicca una versione precedente che funzionava → **Publish deploy**. Il sito torna subito a quella versione.

Poi, con calma, sistemate il codice: in GitHub Desktop → **History** → tasto destro sul commit sbagliato → **Revert changes in commit** → Push.

> Ricorda: dopo un «Publish deploy» manuale, il prossimo Push su `main` ripubblica l'ultima versione del codice.

---

## 5. Lavorare con Claude sul progetto

1. Apri Claude (scheda Code) **nella cartella `ordini-oratorio`**.
2. Chiedi le modifiche come hai fatto finora. Claude:
   - modifica i file in `app/`,
   - aggiorna il numero di versione (in `index.html` e in `sw.js`),
   - fa girare la **serata simulata** per controllare di non aver rotto niente,
   - aggiorna `CHANGELOG.md`.
3. Tu controlli in GitHub Desktop cosa è cambiato, fai **Commit** e **Push**. Per le modifiche grosse usa un ramo (punto 4.2).

**Ogni volta che cambia l'app va aumentata la versione**, sia in `index.html` («Versione N», due punti) sia in `sw.js` (`ordini-oratorio-vN`). Così i telefoni capiscono che devono scaricare quella nuova.

---

## 6. La serata simulata

È una pagina che apre insieme tutti i «telefoni» (casse, cucina, uscita, bar, camerieri) e fa girare una serata intera su un **database finto**, controllando che i conti tornino, che i numeri non si ripetano, che nessuna portata resti bloccata, eccetera.

- Si trova in `test/serata.html`. Prima di usarla va aggiornata la copia di prova con `test/genera-prova.ps1`.
- Va aperta da un piccolo server sul computer (Claude lo avvia da solo).
- Parametri utili: `serata.html?auto=1&ordini=200&casse=4&camerieri=21&file=7`.
- Prima di ogni versione nuova è meglio farla girare: se dice «0 non ok», si può pubblicare.

Non prova la rete vera, i telefoni veri e due persone che premono nello stesso istante. Per quello, prima di una serata importante, conviene una prova con 2 o 3 telefoni.

---

## 7. Prima di ogni serata: lista di controllo

- [ ] La versione in basso nella schermata di accesso è quella giusta su tutti i telefoni
- [ ] Listino e prezzi controllati; reparti assegnati alle portate
- [ ] Porzioni impostate in Cucina → Porzioni (vanno rimesse a ogni nuovo evento)
- [ ] Persone e PIN pronti; reparti assegnati ai cuochi; uscita piatti
- [ ] Prenotazioni importate
- [ ] Fondo cassa inserito
- [ ] QR dei camerieri pronto
- [ ] Durante la serata: scaricare l'Excel un paio di volte come copia
- [ ] A fine serata: chiusura cassa, poi «Nuovo evento» (la serata va in «Serate passate»)

---

## 8. Se qualcosa va storto

| Problema | Cosa fare |
|---|---|
| Dopo un aggiornamento l'app non parte | Netlify → Deploys → versione precedente → **Publish deploy** |
| Un telefono mostra ancora la versione vecchia | Chiudere e riaprire l'app con la rete; se non basta, ricaricare la pagina due volte |
| GitHub Desktop dice «conflict» | Non toccare niente e chiedi a Claude: ti guida passo passo |
| Hai fatto Push di qualcosa di sbagliato | History → Revert changes in commit → Push |
