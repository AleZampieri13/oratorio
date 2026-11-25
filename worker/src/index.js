/* Avvisi ai camerieri con l'app chiusa (Web Push).
   Il telefono che fa l'azione (uscita, bar, cassa) manda qui le iscrizioni dei camerieri e il testo;
   questo Worker controlla che sia un telefono dell'app (ID token di Firebase) e spedisce le notifiche.
   Non legge e non scrive il database. Nessuna libreria esterna: solo WebCrypto. */

const MAX_ISCRIZIONI = 20;
const enc = new TextEncoder();

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const ammesse = String(env.ORIGINI || "").split(",").map(s => s.trim()).filter(Boolean);
    const cors = ammesse.includes(origin)
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" }
      : null;
    const risposta = (stato, corpo) => new Response(JSON.stringify(corpo), {
      status: stato, headers: { "Content-Type": "application/json", ...(cors || {}) } });

    if (!cors) return risposta(403, { errore: "origine non ammessa" });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/invia") return risposta(404, { errore: "non trovato" });

    let d;
    try { d = await req.json(); } catch (e) { return risposta(400, { errore: "richiesta non valida" }); }
    const a = Array.isArray(d && d.a) ? d.a : null;
    const titolo = typeof d.titolo === "string" ? d.titolo : "";
    const testo = typeof d.testo === "string" ? d.testo : "";
    const tag = typeof d.tag === "string" ? d.tag.slice(0, 64) : "";
    if (!a || !a.length || a.length > MAX_ISCRIZIONI || !titolo || titolo.length > 40 || testo.length > 200)
      return risposta(400, { errore: "richiesta non valida" });

    if (!(await tokenValido(d.token, env.PROGETTO))) return risposta(401, { errore: "telefono non autorizzato" });

    const payload = enc.encode(JSON.stringify({ titolo, testo, tag }));
    const scaduti = [];
    let inviati = 0;
    await Promise.all(a.map(async s => {
      try {
        if (!s || typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://") || !s.keys) return;
        const r = await spedisci(s, payload, env);
        if (r.status === 404 || r.status === 410) scaduti.push(s.endpoint);
        else if (r.ok) inviati++;
      } catch (e) { /* un telefono che non risponde non ferma gli altri */ }
    }));
    return risposta(200, { inviati, scaduti });
  }
};

/* ---------- base64url ---------- */
function b64u(buf) {
  const b = new Uint8Array(buf); let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deB64u(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function unisci(...parti) {
  const n = parti.reduce((t, p) => t + p.length, 0), out = new Uint8Array(n); let o = 0;
  for (const p of parti) { out.set(p, o); o += p.length; }
  return out;
}

/* ---------- ID token di Firebase (telefono dell'app) ---------- */
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwksCache = { t: 0, keys: [] };
async function chiaviGoogle() {
  if (Date.now() - jwksCache.t < 3600e3 && jwksCache.keys.length) return jwksCache.keys;
  const r = await fetch(JWKS_URL);
  const j = await r.json();
  jwksCache = { t: Date.now(), keys: j.keys || [] };
  return jwksCache.keys;
}
async function tokenValido(token, progetto) {
  try {
    if (typeof token !== "string" || !progetto) return false;
    const [h, p, f] = token.split(".");
    if (!h || !p || !f) return false;
    const head = JSON.parse(new TextDecoder().decode(deB64u(h)));
    const c = JSON.parse(new TextDecoder().decode(deB64u(p)));
    if (head.alg !== "RS256") return false;
    const now = Math.floor(Date.now() / 1000);
    if (c.aud !== progetto || c.iss !== "https://securetoken.google.com/" + progetto) return false;
    if (!(c.exp > now) || !(c.iat <= now + 300) || !c.sub) return false;
    const jwk = (await chiaviGoogle()).find(k => k.kid === head.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, deB64u(f), enc.encode(h + "." + p));
  } catch (e) { return false; }
}

/* ---------- Web Push: VAPID (RFC 8292) e cifratura aes128gcm (RFC 8291) ---------- */
async function hmac(chiave, dati) {
  const k = await crypto.subtle.importKey("raw", chiave, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, dati));
}
async function vapidJwt(endpoint, env) {
  const pub = deB64u(env.VAPID_PUBBLICA);
  const jwk = { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATA,
    x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body));
  return head + "." + body + "." + b64u(firma);
}
async function cifra(s, payload) {
  const uaPub = deB64u(s.keys.p256dh), authSec = deB64u(s.keys.auth);
  const coppia = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", coppia.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const condiviso = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, coppia.privateKey, 256));
  const prkKey = await hmac(authSec, condiviso);
  const ikm = (await hmac(prkKey, unisci(enc.encode("WebPush: info\0"), uaPub, asPub, new Uint8Array([1])))).slice(0, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, unisci(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, unisci(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrato = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, unisci(payload, new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); /* 4096 */
  return unisci(salt, rs, new Uint8Array([asPub.length]), asPub, cifrato);
}
async function spedisci(s, payload, env) {
  const corpo = await cifra(s, payload);
  return fetch(s.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream",
      "TTL": "300", "Urgency": "high",
      "Authorization": "vapid t=" + (await vapidJwt(s.endpoint, env)) + ", k=" + env.VAPID_PUBBLICA
    },
    body: corpo
  });
}
