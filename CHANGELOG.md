# Versioni

## 36
- Se il master cambia ruoli o reparti di una persona già dentro, le sue schede si aggiornano subito (con un avviso).
- **Permessi per ruolo nel database:** i PIN stanno in una parte del database che nessuno può leggere; all'accesso il database controlla il PIN (o il QR del cameriere) e da lì sa il ruolo. Ogni ruolo può scrivere solo quello che gli serve (es. listino: master e cassa; persone: master, e il capo per i camerieri; nuovo evento e archivio: master). Regole generate da `tools/regole.py`.
- Serata simulata anche sull'emulatore di Firebase con le regole vere (`?emu=1`), con i controlli di cosa ogni ruolo non può fare.
- **«Pronto entro (minuti)» per ogni piatto** nel Listino (vuoto = 15): oltre quel tempo dalla chiamata il piatto diventa rosso in cucina, al bar e sulla scheda del cameriere.
- **Uscita piatti:** nuova lista «Appena consegnati» con «Non consegnato» (per 3 minuti).
- **Telefono non autorizzato:** si può incollare il link o scrivere il codice (utile su iPhone con l'app sulla schermata Home).
- **Rettifica:** se un piatto tolto non ha il prezzo da solo, l'app avvisa di scrivere a mano quanto restituire.
- **Camerieri:** i clienti finiti sono più piccoli e in fondo. 🔔 in alto per provare il suono.
- Tolto il codice della v35 che non serviva più (bevande ed extra a parte).
- **Cassa:** titoli «Menù» e «Piatti da soli» più grandi con una linea; ogni reparto dei piatti da soli ha il suo titolo con il colore del reparto.
- **Camerieri:** linguette dei reparti e «Chiama» più grandi; la linguetta aperta ha il colore del reparto, quelle finite diventano grigie (sempre apribili). «Portato» si annulla: dall'avviso o con «Non portato» sul piatto (per 3 minuti); le schede finite restano visibili 3 minuti.
- **Ordine per reparto:** le frecce ↑↓ sono sui reparti (linguette del cameriere, cassa, listino); i piatti seguono il loro reparto.
- **Bar per reparto:** se ci sono più reparti «Bar» (es. Bar e Caffetteria), nella pagina Bar si filtra per reparto (Tutti / …). In Persone si può assegnare un reparto anche a chi fa il bar: vede solo quello.
- **Accesso solo con il link o il QR:** link e QR contengono un codice; senza, il telefono vede «Telefono non autorizzato» e il database non risponde. In Evento: «Cambia codice di accesso» (poi tutti riaprono il link nuovo).
- Pubblicata su Firebase Hosting: **giovanichef.web.app**.
- **Piatti al posto delle portate.** Nel Listino ci sono i **reparti** (uno o più segnati «Bar»), i **piatti** (ognuno con un solo reparto e il prezzo da solo); il **colore** è del reparto (cucina, uscita, bar e linguette del cameriere) e i **menù fissi** fatti di piatti. Acqua e caffè sono piatti del Bar e possono stare nei menù. Spariscono portate ed extra.
- **Cameriere:** sulla scheda di ogni cliente i reparti sono linguette (un pallino dove c'è da chiamare); in ogni reparto si chiama un piatto alla volta o **«Chiama tutto»**. In cima i piatti pronti con «Porta».
- **Cucina e bar:** le chiamate sono raggruppate per cliente, con «Pronto» per ogni piatto e «Tutto pronto». Il Bar vede i reparti bar; cucina e uscita «Tutti» solo gli altri. «Al banco» consegna le cose del bar a chi non ha cameriere.
- **Cassa:** menù in alto, sotto i piatti da soli divisi per reparto. Porzioni per piatto (cucina e bar).
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
