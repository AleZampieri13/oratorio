/* Copia di prova collegata all'EMULATORE di Firebase (database e accesso sul computer, con le regole vere).
   Si carica dopo gli script di Firebase e prima di config.js.
   - ogni "telefono" (?dev=nome) ha la sua memoria (__devStore) e il suo accesso anonimo
   - il database è quello dell'emulatore su 127.0.0.1:9100, l'accesso su 127.0.0.1:9199 (porte diverse dal progetto magazzino) */
(function () {
  const DEV = new URLSearchParams(location.search).get("dev");
  window.__devStore = DEV ? {
    getItem: k => localStorage.getItem("dev:" + DEV + ":" + k),
    setItem: (k, v) => localStorage.setItem("dev:" + DEV + ":" + k, v),
    removeItem: k => localStorage.removeItem("dev:" + DEV + ":" + k)
  } : sessionStorage;
  /* l'app pulisce l'indirizzo dopo l'accesso: qui si tiene ?dev=, se no un telefono finto ricaricato perde la sua memoria */
  if (DEV) { const rs = history.replaceState.bind(history); history.replaceState = (st, t, url) => { const u = new URL(url || location.href, location.href); if (!u.searchParams.get("dev")) u.searchParams.set("dev", DEV); return rs(st, t, u.pathname + u.search + u.hash); }; }
  const init = firebase.initializeApp.bind(firebase);
  firebase.initializeApp = function (cfg) {
    const app = init(cfg);
    firebase.auth().useEmulator("http://127.0.0.1:9199", { disableWarnings: true });
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    firebase.database().useEmulator("127.0.0.1", 9100);
    return app;
  };
  /* il pannello nascosto del browser rallenta requestAnimationFrame */
  window.requestAnimationFrame = cb => { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); cb(performance.now()); }; c.port2.postMessage(0); return 0; };
  /* registro degli avvisi, come nel finto database */
  window.__toasts = [];
  document.addEventListener("DOMContentLoaded", () => {
    const t = document.getElementById("toast");
    if (t) new MutationObserver(() => { if (!t.hidden && t.innerText) { const s = t.innerText.replace(/\s+/g, " "); if (window.__toasts[window.__toasts.length - 1] !== s) window.__toasts.push(s); } })
      .observe(t, { attributes: true, childList: true, subtree: true, characterData: true });
  });
  /* errori di permesso: li registro per la serata simulata */
  window.__denied = [];
  const oe = console.error.bind(console), ow = console.warn.bind(console);
  const grab = (...a) => { const s = a.map(x => String(x && x.message || x)).join(" "); if (/permission/i.test(s)) window.__denied.push(s.slice(0, 300)); };
  console.error = (...a) => { grab(...a); oe(...a); };
  console.warn = (...a) => { grab(...a); ow(...a); };
})();
