# Progetto: piatti al posto delle portate (versione 36)

**Data:** 11 novembre 2026 · **Serve per:** la serata del **21 novembre 2026** · **Ramo:** `piatti`

## Perché

Oggi per sapere com'è fatto un menù bisogna guardare tre pannelli (menù → portate → reparti con il nome del piatto scritto a mano), e acqua e caffè non possono stare dentro un menù. Con questo cambio:

- i **menù** sono un elenco fisso di **piatti**;
- ogni **piatto** sta in **un solo reparto** (un reparto può avere più piatti);
- le **portate spariscono**: il cameriere decide lui cosa chiamare e quando;
- acqua e caffè diventano piatti del reparto Bar, quindi possono stare nei menù.

**Fuori da questa versione** (decisi, rimandati a dopo la serata): far uscire insieme piatti di reparti diversi (abbinamenti), scelta tra piatti dentro un menù (i menù sono fissi).

## 1. Listino

**Reparti** — nome, e un segno «è un bar» (il reparto Bar). Il segno serve solo a decidere chi lo vede (§4). Si possono avere più reparti, anche più bar.

**Piatti** — ognuno ha:
- nome (es. «Pizzoccheri»), reparto (uno solo), colore;
- prezzo singolo (vuoto = non si vende da solo), prezzo singolo bambini (facoltativo);
- un **gruppo** facoltativo per dividerli in cassa (es. Bevande, Dolci) — sostituisce i gruppi degli extra della v35.

I piatti si mettono in ordine con ↑↓ (dentro il listino e quindi in cassa e sulla scheda del cameriere).

**Menù** — nome, prezzo, elenco dei piatti compresi (si toccano per metterli o toglierli), un piatto per coperto. Es. Standard 15 € = Sciatt, Pizzoccheri, Bresaola, Torta, Acqua, Caffè.

**Spariscono:** portate e «Bevande ed extra» (un extra è un piatto con prezzo singolo).

**Porzioni:** si impostano per piatto (cucina e bar, come oggi).

## 2. Cassa

- In alto i menù (Standard × 3, Bambini × 2); sotto i **piatti venduti da soli**, divisi per gruppo (o per reparto se non ci sono gruppi).
- Prenotazioni, resto, POS, offerte, asporto, modifica (finché il cameriere non prende l'ordine), rettifica, annullo, numeri bruciati: come oggi.
- **Porzioni:** se un piatto è finito la cassa è bloccata (il master può forzare); il master può creare un menù senza quel piatto.
- **Asporto diretto:** tutti i piatti vanno subito in chiamata.

## 3. Cameriere

- Scheda di ogni cliente con i **reparti come linguette** (Bar · Primo · …); un pallino indica che lì c'è qualcosa da chiamare.
- Nel reparto aperto: ogni piatto con quantità e stato (da chiamare / in preparazione / pronto / portato), **«Chiama»** su ogni piatto e **«Chiama tutto»** per il reparto.
- In cima alla scheda: i piatti **pronti** con **«Porta»**, e quanti piatti mancano ancora da chiamare.
- Un piatto chiamato si può ancora **annullare** finché il reparto non l'ha segnato pronto (come oggi).

## 4. Reparti, bar, uscita

- **Cucina:** ogni cuoco con un reparto vede le chiamate dei suoi piatti, raggruppate per cliente (es. «n. 12 · Luca · 3 Pizzoccheri»), con «Pronto» e «Annulla pronto». Chi non ha reparto (capo cucina, master) sceglie Tutti o un reparto.
- **Bar:** la pagina Bar mostra i reparti con il segno «è un bar», con la stessa logica; resta la parte **«Al banco»** per dare le cose a chi non ha cameriere (asporto, clienti senza cameriere).
- **Uscita piatti:** piatti pronti da consegnare, filtro per reparto, «Consegnato» (come oggi).
- Nella cucina «Tutti» e nell'uscita «Tutti» compaiono solo i reparti **non** bar: le cose del bar le gestiscono il bar e i camerieri.
- **Avvisi e suono:** come oggi (nuova chiamata per il reparto, piatto pronto per il cameriere, «non ancora pronto», ordine annullato).

## 5. Riepilogo, tempi, Excel, archivio

- Riepilogo: ordini, coperti, **piatti venduti** (nei menù e da soli), incassi, chiusura cassa.
- Tempi per **piatto** e per **reparto**: preparazione (chiamata → pronto) e attesa al bancone (pronto → consegnato).
- Excel: colonne per menù e per piatto (quantità e stato); fogli Riepilogo, Ordini, Tempi, Annullati, Prenotazioni, Offerte, Registro.
- **Serate già archiviate** (fatte con le portate): dall'archivio si riscarica un Excel **semplificato** (Riepilogo incassi e Ordini con menù, extra, importi e pagamenti), perché la nuova versione non conosce più le portate.

## 6. Passaggio al nuovo modello

- Fatto **una sola volta, in automatico**, al primo avvio della nuova versione, **solo se non ci sono ordini aperti**. Se ci sono, il master vede: «Chiudi la serata con Nuovo evento, poi l'app aggiorna il listino».
- Conversione del listino di oggi:
  - per ogni portata e ogni suo reparto → un piatto (nome = il piatto scritto nel reparto, se no il nome della portata); una portata senza reparto → piatto nel reparto «Cucina» (creato se manca);
  - ogni menù → i piatti delle portate che comprendeva;
  - ogni extra → piatto del suo reparto, o del reparto **Bar** (creato se manca), con il suo prezzo e gruppo;
  - prezzi singoli e colori delle portate → al primo piatto di quella portata;
  - porzioni: per portata → al primo piatto della portata; per extra → al piatto.
- Il listino vecchio resta salvato in `config/menuV35` (si può tornare indietro).
- Le persone non cambiano (i reparti assegnati restano).
- Dopo il passaggio il master controlla e sistema i nomi (es. Sciatt, Pizzoccheri, Bresaola, Torta).

## 7. Prove e pubblicazione

- **Serve un Firebase di prova** (guida, punto 3.6): il link di prova del ramo **non deve** usare il database vero, perché il passaggio del §6 cambierebbe il listino vero. Finché il Firebase di prova non c'è, la nuova versione si prova solo con la copia di prova e la serata simulata.
- Serata simulata aggiornata al nuovo modello, con il menù valtellinese (Sciatt, Pizzoccheri, Bresaola, Torta, Acqua, Caffè), anche da 200 ordini, 4 casse, 21 camerieri.
- Il sito vero resta alla v35 finché non approvate la prova con i telefoni sul link di prova (obiettivo: entro il 17-18 novembre). Se qualcosa non convince, la serata del 21 si fa con la v35.

## 8. Prenotazioni e importazione

- La **prenotazione** contiene: nominativo, quanti di ogni **menù**, quanti di ogni **piatto singolo**, **asporto sì/no**, note.
- **Importazione:** per **ogni colonna del file** si sceglie cosa è: Nominativo, un menù, un piatto singolo, Tipo, Note, oppure «non usare». Riconoscimento automatico:
  - Nominativo/Nome/Cognome…, Note/Allergie… come oggi;
  - menù: nome uguale al menù, oppure Adulti/Standard → il primo menù, Bambini/Ridotto → il menù bambini;
  - piatto: nome uguale al piatto, con o senza «SOLO» davanti (maiuscole, accenti e spazi non contano); un'abbreviazione (es. «PIZZ») vale solo se corrisponde a un piatto solo, altrimenti si sceglie a mano;
  - **TIPO**: «ASPORTO» → prenotazione d'asporto, altro → al tavolo.
  - Righe e colonne di totali a destra della tabella vengono ignorate (come oggi).
- **Anteprima:** «19 al tavolo, 2 d'asporto · 59 Standard, 11 Bambini · 15 Sciatt singoli», e quali colonne non sono state riconosciute.
- **In cassa**, richiamando una prenotazione si compilano menù, piatti singoli e «Da asporto».
- **«Scarica il modello Excel»** in Evento: file vuoto con le colonne della serata (Nominativo, una per ogni menù, «SOLO <piatto>» per ogni piatto con prezzo singolo, Tipo con scelta PRESENTE/ASPORTO, Note).
- File di riferimento: «Prenotazioni Giovani chef 21 novembre 2026 (2).xlsx» (colonne NOMINATIVO, ADULTI, BAMBINI, SOLO SCIATT, SOLO PIZZOCCHERI, SOLO BRESAOLA, SOLO TORTA, TIPO, NOTE).

## Come sono fatti i dati (per chi programma)

```
config/menu/reparti   [{id, nome, bar?:true}]
config/menu/piatti    [{id, nome, rep, prezzo, prezzoBimbi?, colore?, gruppo?}]   (ordine = ordine della lista)
config/menu/varianti  [{id, nome, prezzo, piatti:[idPiatto,…]}]                     (i menù)
config/menu/versione  2
config/scorte/<idPiatto>   porzioni totali del piatto
config/menuV35        copia del listino com'era prima del passaggio

ordini/<n>
  righe    [{id, nome, qta, prezzo}]               menù venduti (come oggi)
  singoli  [{pid, k:"a"|"b", nome, qta, prezzo}]   piatti venduti da soli
  piatti   {<idPiatto>: {nome, rep, qta, stato:"attesa"|"chiamata"|"pronta"|"servita",
                         t, tc?, tp?, da?, daId?, annull?}}
  (spariscono: portate, bar, extra)

prenotazioni/<id>  {nome, righe:[{id,nome,qta}], singoli:{<idPiatto>:qta}, asporto?:true, note, stato, ordine}
```

`qta` di un piatto nell'ordine = somma (coperti dei menù che lo comprendono) + piatti singoli. Gli stati e i tempi (`t` = ultimo cambio, `tc` = chiamata, `tp` = pronto) funzionano come oggi per le portate, ma per ogni piatto.
