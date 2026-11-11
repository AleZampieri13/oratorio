# Versioni

## 36
- **Piatti al posto delle portate.** Nel Listino ci sono i **reparti** (uno o più segnati «È un bar»), i **piatti** (ognuno con un solo reparto, prezzo da solo, gruppo in cassa, colore) e i **menù fissi** fatti di piatti. Acqua e caffè sono piatti del Bar e possono stare nei menù. Spariscono portate ed extra.
- **Cameriere:** sulla scheda di ogni cliente i reparti sono linguette (un pallino dove c'è da chiamare); in ogni reparto si chiama un piatto alla volta o **«Chiama tutto»**. In cima i piatti pronti con «Porta».
- **Cucina e bar:** le chiamate sono raggruppate per cliente, con «Pronto» per ogni piatto e «Tutto pronto». Il Bar vede i reparti bar; cucina e uscita «Tutti» solo gli altri. «Al banco» consegna le cose del bar a chi non ha cameriere.
- **Cassa:** menù in alto, sotto i piatti da soli divisi per gruppo. Porzioni per piatto (cucina e bar).
- **Prenotazioni:** l'import riconosce menù (Adulti/Bambini), piatti «SOLO …» e TIPO (presente/asporto); in cassa la prenotazione compila anche i piatti da soli e l'asporto. Nuovo pulsante **«Scarica il modello Excel»**.
- Il listino nuovo sta in `config/listino`; al primo avvio nasce da quello della v35, che resta com'era in `config/menu` (si può tornare alla v35).

## 35
- **Extra con gruppo e reparto** (Listino → Bevande ed extra): ogni extra ha un **gruppo** (es. Bevande, Dolci, Altro) con cui è diviso in cassa, e **«Lo prepara»**: il Bar oppure un reparto della cucina.
- Gli extra di un reparto della cucina (es. «Patatine extra» al Fritto) sono una voce a parte sulla scheda del cameriere («Extra Fritto»), si chiamano quando si vuole, li vede solo quel reparto e poi li porta il cameriere o li consegna l'uscita. Il bar vede solo i suoi extra.
- Se si toglie un reparto, i suoi extra tornano al bar.
- Tolto il pulsante «Prova suono» (il suono funziona); resta la scritta «Suono bloccato: tocca qui» quando serve.

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
