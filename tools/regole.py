"""Genera database.rules.json: chi può leggere e scrivere cosa, per ruolo.

Uso:  py tools\\regole.py   (scrive database.rules.json nella cartella del progetto)

Come funziona l'accesso:
- accessi/<telefono>  = codice di accesso del link/QR  -> il telefono può leggere i dati
- sessioni/<telefono> = {u: persona, h: impronta del PIN} oppure {u: cameriere, t: gettone}
  il database la accetta solo se h è uguale a pin/<persona> (che nessuno può leggere)
  o t è uguale al gettone del cameriere; da lì sa il ruolo della persona.
"""
import json, os

ACC = "auth != null && root.child('accessi').child(auth.uid).val() === root.child('segreto').val()"
SS = "root.child('sessioni').child(auth.uid)"
SU = f"{SS}.child('u').val()"
UT = "root.child('ev').child('config').child('utenti')"
U = f"{UT}.child({SU})"
SESS = (f"({ACC} && {SS}.child('u').isString() && ("
        f"({SS}.child('h').isString() && {SS}.child('h').val() === root.child('pin').child({SU}).val()) || "
        f"({SS}.child('t').isString() && {SS}.child('t').val() === {U}.child('token').val())))")


def has(*roles):
    parts = []
    for r in roles:
        parts.append(f"{U}.child('ruolo').val() === '{r}'")
        parts += [f"{U}.child('ruoli').child('{i}').val() === '{r}'" for i in range(5)]
    return f"({SESS} && ({' || '.join(parts)}))"


ANY = f"({SESS} && {U}.child('ruolo').isString())"
MASTER = has("master")

rules = {
    "rules": {
        "segreto": {".read": False,
                    ".write": f"{MASTER} && newData.isString() && newData.val().length >= 20"},
        "accessi": {"$uid": {
            ".read": "auth != null && auth.uid === $uid",
            ".write": "auth != null && auth.uid === $uid && newData.val() === root.child('segreto').val()"}},
        "pin": {
            ".read": False,
            "$id": {".write": f"{ACC} && ({MASTER} || (!root.child('pin').exists() && !{UT}.exists()))"}},
        "sessioni": {"$uid": {
            ".read": "auth != null && auth.uid === $uid",
            ".write": (f"{ACC} && auth.uid === $uid && (!newData.exists() || (newData.child('u').isString() && ("
                       "(newData.child('h').isString() && newData.child('h').val() === root.child('pin').child(newData.child('u').val()).val()) || "
                       f"(newData.child('t').isString() && {UT}.child(newData.child('u').val()).child('ruolo').val() === 'cameriere' && "
                       f"newData.child('t').val() === {UT}.child(newData.child('u').val()).child('token').val()))))")}},
        "ev": {
            ".read": ACC,
            "config": {
                "utenti": {
                    # primo avvio: il primo master si crea quando non c'è nessuno
                    ".write": f"{ACC} && !data.exists()",
                    "$id": {
                        ".write": (f"{MASTER} || ({has('capo')} && (!data.exists() || data.child('ruolo').val() === 'cameriere') && "
                                   "(!newData.exists() || newData.child('ruolo').val() === 'cameriere'))"),
                        "token": {".write": (f"({ACC} && !data.exists() && newData.isString() && "
                                             f"{UT}.child($id).child('ruolo').val() === 'cameriere') || {MASTER} || {has('capo')}")}}},
                "file": {".write": has("master", "capo")},
                "iscrizione": {".write": has("master", "capo")},
                "ingressiChiusi": {".write": has("master", "capo")},
                "listino": {".write": has("master", "cassa")},
                "menu": {".write": MASTER},
                "scorte": {".write": has("master", "cassa", "cucina", "bar")},
                "cassa": {".write": MASTER},
                "$altro": {".write": MASTER}},
            "ordini": {
                ".write": MASTER,
                # creare e cancellare un ordine: cassa e master; cambiarlo (chiamate, pronto, portato): tutti
                "$n": {".write": f"{ANY} && ((data.exists() && newData.exists()) || {has('cassa', 'master')})"}},
            "annullati": {".write": has("master", "cassa")},
            "prenotazioni": {".write": has("master", "cassa")},
            "offerte": {".write": has("master", "cassa")},
            "log": {".write": ANY},
            "archivio": {".write": MASTER},
            "archivioIndice": {".write": MASTER},
            "$altro": {".write": MASTER}},
    }
}

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database.rules.json")
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(rules, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("scritto", out, os.path.getsize(out), "byte")
