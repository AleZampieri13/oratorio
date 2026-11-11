"""Crea test/emu/: copia dell'app collegata all'emulatore di Firebase (regole vere).
Uso: py test\\genera-emu.py   (poi: firebase emulators:start --only database,auth)"""
import pathlib, re, shutil

T = pathlib.Path(__file__).resolve().parent
APP = T.parent / "app"
OUT = T / "emu"
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "js").mkdir(parents=True)
shutil.copytree(APP / "css", OUT / "css")
html = (APP / "index.html").read_text(encoding="utf-8")
html = html.replace('<script src="js/config.js"></script>', '<script src="emu-shim.js"></script>\n<script src="js/config.js"></script>')
html = html.replace("<title>Ordini Oratorio</title>", "<title>EMULATORE - Ordini Oratorio</title>")
(OUT / "index.html").write_text(html, encoding="utf-8")
for f in (APP / "js").glob("*.js"):
    (OUT / "js" / f.name).write_text(f.read_text(encoding="utf-8").replace("localStorage", "__devStore"), encoding="utf-8")
shutil.copy(T / "emu-shim.js", OUT / "emu-shim.js")
for f in list(APP.glob("*.png")) + [APP / "manifest.webmanifest"]:
    shutil.copy(f, OUT / f.name)
print("Copia per l'emulatore aggiornata:", OUT)
