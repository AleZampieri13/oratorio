/* Ordini Oratorio: fa aprire l'app anche senza rete. I dati restano su Firebase. */
const CACHE = "ordini-oratorio-v47";
const CORE = ["./", "index.html", "css/app.css", "js/01-base.js", "js/02-cassa.js", "js/03-camerieri.js", "js/04-cucina.js", "js/05-bar.js", "js/06-avvisi.js", "js/07-persone.js", "js/08-riepilogo.js", "js/09-listino.js", "js/10-evento.js", "js/11-avvio.js", "js/12-notifiche.js", "js/config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "badge-96.png"];
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

/* Avvisi ai camerieri con l'app chiusa: il Worker su Cloudflare manda {titolo, testo, tag}.
   Ogni push deve mostrare una notifica (su iPhone altrimenti l'iscrizione può essere tolta). */
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : "" }; }
  const titolo = d.titolo || "Ordini Oratorio", tag = d.tag || "avviso";
  /* dice alle finestre aperte dell'app che l'avviso è arrivato (e se non è riuscito a mostrarlo, perché) */
  const dillo = async info => {
    try { for (const c of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) c.postMessage({ avvisi: true, titolo, tag, ...info }); } catch (err) {}
  };
  e.waitUntil((async () => {
    /* quante notifiche di questo avviso ci sono davvero (alcuni telefoni le scartano senza dare errore) */
    const quante = async t => { try { return (await self.registration.getNotifications(t ? { tag: t } : {})).length; } catch (err) { return -1; } };
    let errore = "";
    try {
      await self.registration.showNotification(titolo, {
        body: d.testo || "", tag, renotify: true,
        icon: "icon-192.png", badge: "badge-96.png", data: { url: "./" }
      });
    } catch (err) { errore = String(err && err.message || err); }
    let n = await quante(tag), modo = "completa";
    if (n < 1) {
      /* seconda prova: senza opzioni particolari (icona piccola, gruppo, rinotifica) */
      try { await self.registration.showNotification(titolo, { body: d.testo || "", icon: "icon-192.png" }); modo = "semplice"; }
      catch (err) { errore += (errore ? " / " : "") + String(err && err.message || err); }
      n = await quante("");
    }
    await dillo({ mostrato: n > 0, presenti: n, modo, errore });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (new URL(c.url).origin === self.location.origin && "focus" in c) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow("./");
  })());
});
