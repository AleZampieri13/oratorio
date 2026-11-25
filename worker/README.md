# Worker «avvisi» (notifiche ai camerieri con l'app chiusa)

Piccolo programma che gira gratis su Cloudflare (account dell'oratorio, sottodominio `oratoriopare.workers.dev`).
Il telefono che segna «Pronto» (o annulla) gli manda le iscrizioni dei camerieri e il testo; lui controlla che sia un telefono dell'app e spedisce le notifiche. **Non tocca il database.**

Indirizzo dopo la pubblicazione: `https://avvisi.oratoriopare.workers.dev` (va in `app/js/config.js`, `PUSH_WORKER`).

## Prima volta

Tutti i comandi da PowerShell **dentro la cartella `worker`** del progetto.

1. Collegare il terminale a Cloudflare (fatto il 25/11/2026):
   ```
   npx.cmd -y wrangler login
   ```
2. Chiavi per le notifiche (fatto il 25/11/2026; la pubblica è già in `wrangler.toml`):
   ```
   npx.cmd -y web-push generate-vapid-keys
   ```
   La **privata** non va mai scritta nei file del progetto né incollata nelle chat.
3. Salvare la chiave privata su Cloudflare (incollala quando la chiede, poi Invio):
   ```
   npx.cmd -y wrangler secret put VAPID_PRIVATA
   ```
   Se chiede di creare il Worker «avvisi», rispondi sì.
4. Pubblicare:
   ```
   npx.cmd -y wrangler deploy
   ```
   Alla fine scrive l'indirizzo, tipo `https://avvisi.oratoriopare.workers.dev`.

## Controllo veloce

Aprendo l'indirizzo nel browser deve rispondere `{"errore":"origine non ammessa"}`: vuol dire che è acceso e rifiuta chi non è il sito.

## Se cambi le chiavi

Se generi chiavi nuove: metti la nuova pubblica in `wrangler.toml` (`VAPID_PUBBLICA`) e in `app/js/config.js` (`PUSH_VAPID`), rifai i passi 3 e 4 e ripubblica il sito. I camerieri dovranno toccare di nuovo «Attiva avvisi».

## Costi

Piano gratuito: 100.000 richieste al giorno. Una serata ne usa qualche centinaio.
