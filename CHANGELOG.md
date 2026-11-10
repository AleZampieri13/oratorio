# Versioni

## 34
- **Suono degli avvisi:** tre note più forti e più lunghe; l'audio si attiva al momento giusto del tocco (alcuni telefoni Android non lo attivavano).
- Pulsante **«Prova suono»** in cucina, camerieri, uscita e bar: suona, vibra e dice se il telefono blocca l'audio.
- Scritta rossa **«Suono bloccato dal telefono: tocca qui»** quando il telefono ha fermato l'audio (es. dopo aver cambiato app).

## 33
- **Uscita piatti per reparto:** il filtro in alto ora è per reparti della cucina (Tutti / Primo / Fritto / …), non più per file. Su ogni piatto si vedono il nome dei piatti dei reparti, il cameriere e la sua fila.
- In Persone si può assegnare un reparto anche a chi fa l'uscita (come per i cuochi): vede solo i piatti di quel reparto. Senza reparto vede tutto e può scegliere.

## 32
- **Porzioni esaurite:** la cassa non può vendere oltre le porzioni (o le bevande) rimaste; vede «esaurito» accanto a menù, singole e bevande. Il master può forzare. Vale anche per le modifiche.
- **Rettifica** degli ordini già partiti (cassa e master): si tolgono le portate non ancora chiamate e le bevande; finché nessuna portata è chiamata anche i coperti. L'app calcola quanto restituire. Le rettifiche finiscono nel registro e nell'Excel.
- **Uscita piatti:** nuovo ruolo. Piatti pronti divisi per fila, con «Consegnato» se il cameriere se ne dimentica; elenco di quello che è in preparazione.
- **Tempi della cucina** in Evento e nell'Excel: preparazione per portata e per reparto, attesa al bancone.
- **Serate passate:** «Nuovo evento» archivia la serata (con un nome) invece di cancellarla; dall'archivio si riscarica l'Excel. Le porzioni vanno reimpostate a ogni evento.
- Corretto: dopo aver creato un menù nel Listino non se ne poteva creare un secondo senza cambiare scheda.
- Codice diviso in più file (`css/`, `js/`), service worker che prende i file dalla rete (pagina e codice sempre della stessa versione), `config.js` pronto per un Firebase di prova.

## 31
- La modifica in cassa è possibile finché un cameriere non prende l'ordine.
- Le portate si chiamano in qualsiasi ordine (quello del Listino è solo suggerito).
- Corretto: dopo il rientro col QR restava la scritta «sessione scaduta».

## 30
- Modifica e annullo degli ordini (prima non si apriva), numeri degli ordini annullati «bruciati», registro modifiche.
- Reparti della cucina: ogni cuoco vede solo il suo reparto; una portata con più reparti è pronta quando hanno finito tutti.
- Il master entra subito dopo il primo avvio; «Asporto» in cucina e al bar; avviso alla cassa per le bevande d'asporto; avviso per nomi doppi nell'import.

## 29
- Versione di partenza (fatta in chat su Claude e caricata su Netlify a mano).
