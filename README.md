# Ordini Oratorio

App per gestire le serate a tavola dell'oratorio: cassa, camerieri, cucina divisa per reparti, uscita piatti e bar, tutti collegati in tempo reale dal telefono.

- **Online:** https://giovanichef.web.app (si apre solo con il link o il QR)
- **Dati:** Firebase Realtime Database (progetto `giovanichef-65d46`)
- **Versione attuale:** vedi in basso nella schermata di accesso, e `CHANGELOG.md`

## Chi fa cosa

| Ruolo | Schermata |
|---|---|
| Master | Tutto: listino, persone, evento, chiusura cassa, archivio |
| Cassa | Nuovi ordini, prenotazioni, modifica (prima che un cameriere prenda l'ordine), rettifica, offerte |
| Capo camerieri | Camerieri, file, QR d'ingresso, sposta e condividi clienti |
| Cameriere | I suoi clienti: apre il reparto che serve, chiama i piatti (uno o «Chiama tutto») e li porta |
| Cucina | Chiamate da preparare. Con un reparto assegnato vede solo il suo reparto |
| Uscita piatti | Piatti pronti, per fila: segna «Consegnato» se il cameriere se ne dimentica |
| Bar | Bevande da preparare e scorte |

## Cartelle

```
app/      ← il sito (Firebase pubblica solo questa cartella, vedi firebase.json)
test/     ← copia di prova con database finto + serata simulata
docs/     ← GUIDA-GITHUB.md: come si lavora con GitHub e Firebase
```

Dentro `app/`: `index.html` (schermate), `css/app.css` (aspetto), `js/config.js` (collegamento Firebase), `js/01-…11-*.js` (funzionamento, un file per argomento, caricati in ordine), `sw.js` (funzionamento senza rete).

## Pubblicare una versione

1. Aumenta la versione in `app/index.html` (due volte «Versione N») e in `app/sw.js` (`ordini-oratorio-vN`).
2. Aggiorna `CHANGELOG.md`.
3. Fai girare la serata simulata (sotto) e controlla «0 non ok».
4. Commit e Push su `main`, poi pubblicazione su Firebase (sotto). Dettagli in `docs/GUIDA-GITHUB.md`.

## Provare senza toccare i dati veri

**Doppio clic su `test/AVVIA-SERATA-SIMULATA.bat`.** Prepara la copia di prova (database finto nel browser), accende il server di prova (finestra «Server prova», chiudila per spegnerlo) e apre:
- `http://localhost:5520/serata.html` → **serata simulata**: in alto scegli ordini, casse, camerieri, file e «Serata n.» (stesso numero = stessa serata), poi «Avvia la serata». Alla fine compare l'elenco dei controlli.
- `http://localhost:5520/` → l'app di prova a mano (ogni scheda del browser è un telefono diverso).

Serve Python (già installato su questo computer). Il server è `test/server.py`; la copia di prova la crea `test/genera-prova.ps1`.

La serata simulata non prova la rete vera né i telefoni veri: prima di una serata importante, fate anche una prova con qualche telefono.

## Pubblicare (Firebase Hosting)

L'app è su **https://giovanichef.web.app** (progetto Firebase `giovanichef-65d46`, account dell'oratorio (oratoriopare)).
Dopo una modifica, dal terminale nella cartella del progetto:

```
npx.cmd -y firebase-tools@15.35.0 deploy --only hosting --project giovanichef-65d46 --account oratoriopare@gmail.com
```

**Accesso:** il sito si apre solo con il link o il QR (contengono il codice di accesso, `#k=…`). Le regole del database (anche per ruolo) si generano con `py toolsegole.py` in `database.rules.json` e si pubblicano con `--only hosting,database`. Prima di pubblicarle: serata simulata sull'emulatore (`firebase emulators:start --only database,auth`, `py test\genera-emu.py`, poi `serata.html?emu=1`). Il codice si cambia da Evento → «Cambia codice di accesso».
