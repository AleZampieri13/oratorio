"""Piccolo server per la copia di prova: serve la cartella test/ su http://localhost:5520
e dice al browser di non tenere in memoria i file, così vede sempre l'ultima versione."""
import functools, http.server, pathlib, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5520
DIR = pathlib.Path(__file__).resolve().parent


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # niente righe per ogni file


handler = functools.partial(NoCache, directory=str(DIR))
try:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
except OSError:
    print(f"La porta {PORT} è già occupata: probabilmente il server di prova è già acceso.")
    input("Premi Invio per chiudere...")
    sys.exit(1)
print(f"Server di prova acceso su http://localhost:{PORT}")
print("Serata simulata: http://localhost:%d/serata.html" % PORT)
print("Per spegnerlo chiudi questa finestra.")
server.serve_forever()
