/* Ordini Oratorio: fa aprire l'app anche senza rete. I dati restano su Firebase. */
const CACHE = "ordini-oratorio-v35";
const CORE = ["./", "index.html", "css/app.css", "js/01-base.js", "js/02-cassa.js", "js/03-camerieri.js", "js/04-cucina.js", "js/05-bar.js", "js/06-avvisi.js", "js/07-persone.js", "js/08-riepilogo.js", "js/09-listino.js", "js/10-evento.js", "js/11-avvio.js", "js/config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const CDN = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];
const CACHEABLE_HOSTS = ["www.gstatic.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await Promise.all(CDN.map(async u => {
      try { const r = await fetch(u, { mode: "no-cors" }); await c.put(u, r); } catch (err) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)); }

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pagina: prima la rete (per avere sempre l'ultima versione), poi la copia salvata
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const r = await Promise.race([fetch(req), timeout(4000)]);
        const c = await caches.open(CACHE); c.put("index.html", r.clone());
        return r;
      } catch (err) {
        return (await caches.match("index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  // File del sito (css, js, icone): prima la rete, così pagina e codice sono sempre della stessa versione;
  // senza rete, la copia salvata
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await Promise.race([fetch(req), timeout(4000)]);
        if (r.ok) c.put(req, r.clone());
        return r;
      } catch (err) {
        return (await c.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  // Librerie e caratteri: dalla copia salvata, se non c'è dalla rete
  if (CACHEABLE_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req, { ignoreVary: true });
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }
      catch (err) { return Response.error(); }
    })());
  }
  // Tutto il resto (database e accesso Firebase) passa direttamente dalla rete
});
