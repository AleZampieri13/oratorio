# Ordini Oratorio

App per gestire le serate a tavola dell'oratorio: cassa, camerieri, cucina divisa per reparti, uscita piatti e bar, tutti collegati in tempo reale dal telefono.

- **Online:** https://giovanichef.netlify.app
- **Dati:** Firebase Realtime Database (progetto `giovanichef-65d46`)
- **Versione attuale:** vedi in basso nella schermata di accesso, e `CHANGELOG.md`

## Chi fa cosa

| Ruolo | Schermata |
|---|---|
| Master | Tutto: listino, persone, evento, chiusura cassa, archivio |
| Cassa | Nuovi ordini, prenotazioni, modifica (prima che un cameriere prenda l'ordine), rettifica, offerte |
| Capo camerieri | Camerieri, file, QR d'ingresso, sposta e condividi clienti |
| Cameriere | I suoi clienti: chiama le portate (in qualsiasi ordine) e le porta |
| Cucina | Chiamate da preparare. Con un reparto assegnato vede solo il suo reparto |
| Uscita piatti | Piatti pronti, per fila: segna «Consegnato» se il cameriere se ne dimentica |
| Bar | Bevande da preparare e scorte |

## Cartelle

```
app/      ← il sito (Netlify pubblica solo questa cartella, vedi netlify.toml)
test/     ← copia di prova con database finto + serata simulata
docs/     ← GUIDA-GITHUB.md: come si lavora con GitHub e Netlify
```

Dentro `app/`: `index.html` (schermate), `css/app.css` (aspetto), `js/config.js` (collegamento Firebase), `js/01-…11-*.js` (funzionamento, un file per argomento, caricati in ordine), `sw.js` (funzionamento senza rete).

## Pubblicare una versione

1. Aumenta la versione in `app/index.html` (due volte «Versione N») e in `app/sw.js` (`ordini-oratorio-vN`).
2. Aggiorna `CHANGELOG.md`.
3. Fai girare la serata simulata (sotto) e controlla «0 non ok».
4. Commit e Push su `main`: Netlify pubblica da solo. Dettagli in `docs/GUIDA-GITHUB.md`.

## Provare senza toccare i dati veri

1. `test/genera-prova.ps1` crea in `test/` una copia dell'app che usa un database finto nel browser.
2. Avvia un server nella cartella `test` (es. `py -m http.server 5501 --directory test`) e apri:
   - `http://localhost:5501/` → l'app di prova (ogni scheda del browser è un telefono diverso)
   - `http://localhost:5501/serata.html?auto=1` → **serata simulata**: tutti i telefoni lavorano da soli e alla fine compare l'elenco dei controlli.
     Parametri: `ordini=200&casse=4&camerieri=21&file=7&seme=123`

La serata simulata non prova la rete vera né i telefoni veri: prima di una serata importante, fate anche una prova con qualche telefono.
