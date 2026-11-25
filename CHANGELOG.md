# Versioni

## 42
- **Avvisi con l'app chiusa (camerieri):** nella pagina Camerieri «Attiva avvisi». Arrivano anche con l'app chiusa o lo schermo spento: Pronto, Non ancora pronto, Ordine annullato. Su iPhone l'app va aggiunta alla schermata Home (iOS 16.4 o più recente). Serve il Worker su Cloudflare (vedi worker/README.md).
- Avvisi bloccati: la striscia dice dove riattivarli in Samsung Internet, in Chrome o su iPhone. La striscia «Attiva avvisi» non è più rossa (il rosso resta per il suono bloccato).

## 41
- **Prenotazione arrivata in parte:** dopo l'ordine la cassa chiede **Aspetta** o **Chiudi**. Una prenotazione chiusa è «Chiusa · 3 su 4», si può riaprire con **Riapri**; il contatore dice «gestite» e nell'Excel c'è «Chiusa» e la colonna «Quanti».

## 40
- **Coperti in cassa:** sotto i menù la riga Coperti (− / + o scrivendo il numero). Parte dal numero dei menù, si può cambiare (anche più o meno dei menù); serve per le serate senza menù e per chi prende solo piatti da soli. Il numero va nella scheda del cameriere, nel riepilogo e nell'Excel. Dal file delle prenotazioni prende «Totale persone».
- In Modifica e Rettifica la riga Coperti mostra quelli salvati e non cambia quando si cambiano i menù: si cambia solo a mano. Gli ordini delle serate passate (senza coperti scritti) contano i menù come prima.

## 39
- **Cucina: niente più tasti Pronto / Portato / Annulla: il pronto lo segna l'uscita (anche in parte).** La cucina vede le schede da preparare (con le quantità, senza campi), le porzioni «30 / 80» con «+ Aggiungi», il filtro per reparto e la lista dei pronti, solo da leggere. Una scheda resta in cucina finché l'uscita non segna il piatto pronto. Il bar non cambia e tiene tutti i suoi tasti.
- **Uscita: ordini uniti in una riga sola, anche per i pronti in parte.** In «In preparazione» lo stesso piatto degli ordini uniti è una riga sola («6 Pizzoccheri · n. 12 + 13») con il campo per segnarne pronta solo una parte («Pronti 4»): prima l'ordine col numero più basso, il resto resta da preparare in una riga sua.

## 38
- **Cucina e bar: porzioni fatte / caricate.** Nel riquadro in alto, sotto ogni piatto, «30 / 80»: porzioni già pronte o portate su quelle caricate con «+ Aggiungi» (0 se non ne sono state caricate). Chi vede un solo reparto conta come fatte quelle dove il suo pezzo è pronto. Quando le fatte arrivano al totale la riga diventa grigia.

## 37
- **Unire più ordini (cameriere):** sulla scheda di un cliente «Unisci» e poi l'altro cliente (es. due famiglie allo stesso tavolo, n. 12 e n. 13). Diventano una scheda sola «12 + 13»: lo stesso piatto è sommato (es. «6 Pizzoccheri»), un «Chiama» chiama tutti e due gli ordini, le scelte (Naturale / Frizzante) si dividono sul totale. Anche cucina, bar e uscita vedono una scheda sola con i piatti sommati e un solo «Pronto» / «Consegnato». «Separa» (tocca due volte) li rimette come prima; «Condividi» e «Sposta» valgono per tutti gli ordini uniti. In cassa restano ordini separati (biglietti, pagamenti, rettifiche non cambiano).
- **Ordini uniti, piatti in parte:** anche sui piatti sommati il numero è un campo («4 / 5»): il cameriere chiama solo una parte (prima l'ordine col numero più basso, il resto diventa «2ª volta») e cucina e bar segnano pronta solo una parte («Pronti 2»). I piatti pronti, in preparazione o portati dello stesso tipo restano una riga sola anche se chiamati in volte diverse.

## 36
- **Cucina e bar:** nelle schede il nome del piatto è come nell'uscita (grande, maiuscolo, colore del reparto) su una riga sua; numero e «Pronto» sotto.
- **Cucina, bar e uscita:** nomi dei piatti e quantità più grandi; tutte le scritte delle schede in maiuscolo.
- **Schede colorate:** in cucina, bar e uscita la scheda ha il colore della portata (più chiaro); se i piatti sono di reparti diversi ogni piatto ha il suo riquadro colorato. In cucina il tempo di attesa compare una volta sola. Tutte le scritte dell'app sono in maiuscolo (non i campi dove si scrive).
- **Cucina, bar e uscita:** niente più righe del menù («3 Standard · 1 Bambini»): sulle schede e nei totali c'è solo il numero di piatti (es. «4 Pizzoccheri»); restano le scelte (Naturale / Frizzante).
- **Scelte e ritardi:** le scelte (es. «6 Naturale») hanno lo stesso colore e carattere del piatto, un po' più piccole (prima diventavano rosse sui piatti in ritardo). Tolta la sottolineatura rossa dei piatti in ritardo: resta il bordo rosso della scheda.
- **Scelte una per riga** nelle schede di cucina, bar e uscita («4 Naturale», sotto «1 Frizzante»).
- **Pronti in parte per scelta:** in cucina, al bar e all'uscita, se un piatto ha 2 o più scelte ogni scelta ha il suo campo («1 / 4 Naturale», «0 / 1 Frizzante»): «Pronti 1» segna pronte solo quelle, le altre restano da preparare con la loro scelta.
- **Stesso piatto chiamato di nuovo:** se il cameriere chiama il resto di un piatto mentre la parte di prima è ancora da preparare, in cucina e al bar diventano una riga sola (le scelte si sommano). Se la parte di prima è già pronta, restano separate. Con una porzione sola il numero è fisso (senza campo) ma con lo stesso stile.
- **Uscita:** «Annulla» su ogni piatto pronto (tocca due volte: «Non pronto?») per rimetterlo da preparare. Il secondo tocco vale anche se nel frattempo la pagina si aggiorna. Numero dell'ordine più grande nelle schede di cucina, bar e uscita.
- **Schede allineate:** in cucina, bar e uscita le schede della stessa riga hanno nome, numero dell'ordine, piatti e tasto alla stessa altezza. Numero dell'ordine e nome del cliente più grandi; se il cliente non sta accanto al numero va intero sulla riga sotto.
- **Orario nelle schede:** ora d'arrivo e minuti passati su una riga («20:15 · 12 min»; in uscita «pronto 20:15 · 3 min»), sempre arancione: il ritardo lo dice il bordo rosso.
- **Storico anche in cassa, cucina, bar e uscita:** tasto in fondo alla pagina che apre l'elenco. Cassa: gli ordini più vecchi dei 15 recenti (con ora e chi li ha fatti, «Modifica» / «Rettifica»). Cucina e bar: i piatti del proprio reparto già pronti o portati (chiamato, pronto, portato). Uscita: i piatti consegnati. Lo storico (anche dei camerieri) ora è in colore neutro.
- **Schermo sempre acceso** anche per camerieri, bar e uscita (prima solo la cucina): finché l'app è aperta il telefono non si blocca da solo, così suono e vibrazione arrivano.
- **Corretto:** la rettifica di un ordine con un cambio «senza … · Scala» dimenticava lo sconto: il totale saliva e, se si toglieva proprio la persona con lo sconto, si restituiva il prezzo pieno del menù. Ora rimborso e totale tengono conto dello sconto.
- **Unione delle righe più sicura:** due righe dello stesso piatto si uniscono solo da chi agisce (il cameriere quando richiama un piatto, chi preme «Annulla» dopo «Pronto» in cucina, bar o uscita), non più da tutti i telefoni insieme: prima due telefoni potevano unire le stesse righe nello stesso momento e sbagliare le scelte (Naturale / Frizzante).
- **Pronti in parte:** in cucina, al bar e all'uscita, se un piatto chiamato ha 2 o più porzioni il numero è un campo da scrivere («3 di 20»): il tasto diventa «Pronti 3»: quelle vanno al cameriere, le altre restano da preparare come «2ª volta». I tasti «Chiama» / «Pronto» non cambiano più larghezza quando cambia la scritta.
- **Uscita:** in alto i totali per piatto (pronti da consegnare e in preparazione). Nelle schede di cucina, bar e uscita il tasto è sempre in fondo, alla stessa altezza; in cassa i tasti «Modifica» / «Rettifica» sono allineati.
- **Camerieri:** «Da chiamare» elenca i piatti (colorati come il loro reparto) invece del numero. Un piatto da chiamare in parte ha il nome sopra e quantità e tasti sotto.
- **Cassa:** scritte più grandi, riquadri come nelle altre pagine. Tutte le pagine possono essere larghe fino a 1400 px.
- **Camerieri:** in fondo alla pagina il tasto viola «Storico» apre i propri clienti finiti (tocca un cliente per vedere piatti e orari). Nome del piatto e tasti restano sulla stessa riga; le scelte (Naturale / Frizzante) sono in colonna con − e + allineati.
- **Chiamare una parte:** sulla scheda del cameriere, se un piatto da chiamare ha 2 o più porzioni, il numero è un campo da scrivere («1 di 3»): parte dal totale; se lo abbassi, «Chiama 1» chiama solo quelle e le altre diventano una riga a parte («Acqua · 2ª volta») da chiamare quando vogliono. «Unisci» le rimette insieme finché non sono chiamate. «Chiama tutto» non chiama le parti tenute per dopo.
- **Prenotazione arrivata in parte:** se in cassa togli dalla prenotazione chi non è ancora arrivato, la prenotazione resta «Arrivati in parte · restano N coperti». Quando arrivano gli altri la cerchi di nuovo e trovi solo quello che manca: secondo ordine, secondo biglietto. Se annulli uno dei due ordini, la prenotazione torna come prima.
- **Cambi nel menù:** in cassa (nuovo ordine e modifica) «+ Cambia un piatto del menù»: al posto di un piatto un altro dello stesso reparto, per quante persone serve (es. 1 Pizzoccheri → Pasta), oppure «Niente» per toglierlo (es. 1 senza Torta); quando si toglie si può scegliere «Scala» e quanto togliere a persona dal prezzo del menù (proposto: il prezzo da solo del piatto). Si possono fare più cambi nello stesso ordine. Il prezzo resta quello del menù; cucina e porzioni contano il piatto nuovo; nell'Excel c'è la colonna «Cambi nel menù».
- **Scelte del cameriere:** nel Listino un piatto può avere un elenco di scelte, una per riga (es. Acqua: Naturale, Frizzante). Prima di chiamare, il cameriere divide le quantità; bar, cucina e uscita vedono «2 Naturale · 1 Frizzante». Se nessuno sceglie vale la prima.
- **Uscita piatti:** l'asporto mandato subito in cucina è una scheda sola con tutti i piatti e «Consegnato tutto»; può segnare «Pronto» i piatti in preparazione (solo i suoi reparti).
- **Conti separati:** in cassa «Dividi il conto»: **per piatti** (ogni parte tocca i menù e i piatti che paga e l'importo si calcola da solo; «Tutto il resto a questa parte»), oppure a importi / in parti uguali, ogni parte con il suo pagamento (contanti con il suo resto, POS, offerto). L'ordine resta uno solo (un biglietto, una scheda per il cameriere).
- **Pasto offerto:** terzo modo di pagare, «Offerto», con «Offerto da» obbligatorio (cassa e master). Non entra nei contanti né nel POS; nel riepilogo e nell'Excel c'è «Pasti offerti». Anche solo una parte del conto può essere offerta. Nel file delle prenotazioni la colonna OFFERTO (chi offre, o «sì») arriva in cassa già impostata.
- Ogni ordine nuovo tiene l'elenco dei suoi pagamenti (anche modifiche e rettifiche): la chiusura cassa somma contanti e POS da lì. Nella rettifica di un conto pagato in contanti e POS si sceglie come restituire.
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
