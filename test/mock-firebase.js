/* Finto Firebase (compat) per provare l'app senza toccare il database vero.
   Dati in localStorage ("mockdb"), condivisi tra le schede dello stesso indirizzo. */
(function () {
  const KEY = "mockdb";
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const split = p => String(p || "").split("/").filter(Boolean);

  function normalize(v) {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) { const o = {}; v.forEach((x, i) => { o[i] = x; }); v = o; }
    if (typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v)) { const n = normalize(v[k]); if (n !== null) o[k] = n; }
      return Object.keys(o).length ? o : null;
    }
    return v;
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  let db = load();
  function getAt(root, parts) { let c = root; for (const p of parts) { if (c == null || typeof c !== "object") return null; c = c[p]; } return c === undefined ? null : c; }
  function setAt(root, parts, val) {
    if (!parts.length) return normalize(val);
    const r = (root && typeof root === "object") ? { ...root } : {};
    const [h, ...t] = parts;
    r[h] = setAt(r[h], t, val);
    if (r[h] === null) delete r[h];
    return Object.keys(r).length ? r : null;
  }
  /* esegue subito dopo, senza timer (i timer rallentano quando la pagina non è in primo piano) */
  const later = fn => { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); fn(); }; c.port2.postMessage(0); };
  const listeners = new Set();
  let connected = true;

  function snap(key, val) { const v = clone(val); return { key, val: () => clone(v), exists: () => v != null }; }

  /* solo per le prove: se la pagina che ospita i telefoni ha __wlog, registra chi scrive sugli ordini */
  function wlog(path, v) { try { if (top.__wlog && /ordini/.test(path)) top.__wlog.push([new URLSearchParams(location.search).get("dev"), path, JSON.stringify(v).slice(0, 300), (new Error().stack || "").split(String.fromCharCode(10)).slice(2, 7).join(" | ")]); } catch (e) {} }
  function commit(newDb) {
    db = normalize(newDb);
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    fire();
  }
  function fire() {
    for (const l of [...listeners]) l.check();
  }
  window.addEventListener("storage", e => { if (e.key === KEY) { db = load(); fire(); } });

  function Ref(parts) {
    this._p = parts;
    this.key = parts.length ? parts[parts.length - 1] : null;
  }
  Ref.prototype.child = function (p) { return new Ref([...this._p, ...split(p)]); };
  Ref.prototype._val = function () { return getAt(db, this._p); };
  /* prima di ogni scrittura rilegge i dati condivisi: così due "telefoni" non si sovrascrivono */
  const fresh = () => { db = load(); };
  Ref.prototype.set = function (v) { wlog(this._p.join("/"), v); fresh(); commit(setAt(db, this._p, clone(v))); return Promise.resolve(); };
  Ref.prototype.remove = function () { return this.set(null); };
  Ref.prototype.update = function (obj) {
    wlog(this._p.join("/"), obj); fresh(); let d = db;
    for (const k of Object.keys(obj)) d = setAt(d, [...this._p, ...split(k)], clone(obj[k]));
    commit(d); return Promise.resolve();
  };
  Ref.prototype.transaction = function (fn) {
    fresh(); const cur = clone(this._val());
    const nx = fn(cur);
    if (nx === undefined) return Promise.resolve({ committed: false, snapshot: snap(this.key, this._val()) });
    wlog(this._p.join("/"), nx); commit(setAt(db, this._p, clone(nx)));
    return Promise.resolve({ committed: true, snapshot: snap(this.key, this._val()) });
  };
  Ref.prototype.once = function (ev, cb) { const v = this._val(); return new Promise(res => later(() => { const s = snap(this.key, v); if (cb) cb(s); res(s); })); };
  Ref.prototype.on = function (ev, cb) {
    const ref = this;
    if (ref._p.join("/") === ".info/connected") { later(() => cb(snap("connected", connected))); return cb; }
    /* i dati non vengono mai modificati sul posto (ogni scrittura crea oggetti nuovi),
       quindi si può tenere il riferimento precedente e confrontare solo i figli cambiati */
    let last = undefined, lastObj = null;
    const l = {
      cb, ev,
      check() {
        const v = ref._val();
        if (ev === "value") { const js = JSON.stringify(v); if (js !== last) { last = js; cb(snap(ref.key, v)); } return; }
        const prev = lastObj || {}, now = (v && typeof v === "object") ? v : {};
        lastObj = now; if (prev === now) return;
        if (ev === "child_added") { for (const k of Object.keys(now)) if (!(k in prev)) cb(snap(k, now[k])); return; }
        if (ev === "child_changed") { for (const k of Object.keys(now)) if (k in prev && prev[k] !== now[k] && JSON.stringify(prev[k]) !== JSON.stringify(now[k])) cb(snap(k, now[k])); return; }
        if (ev === "child_removed") for (const k of Object.keys(prev)) if (!(k in now)) cb(snap(k, prev[k]));
      }
    };
    if (ev === "child_changed" || ev === "child_removed") { const v = ref._val(); lastObj = (v && typeof v === "object") ? v : {}; }
    listeners.add(l);
    later(() => l.check());
    return cb;
  };
  Ref.prototype.off = function () {};

  const user = { uid: "mock-user" };
  let signed = false;
  const authObj = {
    get currentUser() { return signed ? user : null; },
    onAuthStateChanged(cb) { later(() => cb(signed ? user : null)); return () => {}; },
    signInAnonymously() { signed = true; return Promise.resolve({ user }); }
  };
  window.firebase = {
    initializeApp() { return {}; },
    auth() { return authObj; },
    database() { return { ref: p => new Ref(split(p)) }; }
  };
  /* Memoria del singolo "telefono": con ?dev=nome ogni riquadro della serata simulata ha la sua,
     senza ?dev ogni scheda del browser ha la sua (sessionStorage) */
  const DEV = new URLSearchParams(location.search).get("dev");
  window.__devStore = DEV ? {
    getItem: k => localStorage.getItem("dev:" + DEV + ":" + k),
    setItem: (k, v) => localStorage.setItem("dev:" + DEV + ":" + k, v),
    removeItem: k => localStorage.removeItem("dev:" + DEV + ":" + k)
  } : sessionStorage;
  /* Solo per la prova: il pannello del browser nascosto blocca requestAnimationFrame */
  window.requestAnimationFrame = cb => { later(() => cb(performance.now())); return 0; };
  /* Registro degli avvisi (toast) e delle vibrazioni/suoni */
  window.__toasts = [];
  document.addEventListener("DOMContentLoaded", () => {
    const t = document.getElementById("toast");
    if (t) new MutationObserver(() => { if (!t.hidden && t.innerText) { const s = t.innerText.replace(/\s+/g, " "); if (window.__toasts[window.__toasts.length - 1] !== s) window.__toasts.push(s); } })
      .observe(t, { attributes: true, childList: true, subtree: true, characterData: true });
  });
  window.__mockdb = { get: () => clone(db), reset: () => { localStorage.removeItem(KEY); db = null; fire(); } };
})();
