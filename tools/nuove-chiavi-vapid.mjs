/* Crea una coppia nuova di chiavi VAPID per gli avvisi ad app chiusa, senza copia-incolla:
   - la chiave PRIVATA va direttamente su Cloudflare (wrangler secret put VAPID_PRIVATA), non viene mai
     mostrata né scritta in un file;
   - la chiave PUBBLICA viene scritta in worker/wrangler.toml (VAPID_PUBBLICA) e app/js/config.js (PUSH_VAPID).
   Uso, dalla cartella del progetto:   node tools\nuove-chiavi-vapid.mjs
   Poi: pubblicare il Worker (cd worker; npx.cmd wrangler deploy) e il sito, e su ogni telefono
   toccare di nuovo «Attiva avvisi». */
import { generateKeyPairSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");
const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = privateKey.export({ format: "jwk" });
const privata = jwk.d;
const pubblica = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]).toString("base64url");
if (Buffer.from(privata, "base64url").length !== 32 || Buffer.from(pubblica, "base64url").length !== 65) {
  console.error("Chiavi di lunghezza sbagliata: riprova."); process.exit(1);
}

console.log("1/3  Salvo la chiave privata su Cloudflare (non viene mostrata)…");
const r = spawnSync("npx.cmd wrangler secret put VAPID_PRIVATA", {
  cwd: join(radice, "worker"), input: privata + "\n", shell: true, stdio: ["pipe", "inherit", "inherit"] });
if (r.status !== 0) { console.error("\nNon sono riuscito a salvarla su Cloudflare: non ho cambiato nessun file."); process.exit(1); }

console.log("2/3  Scrivo la chiave pubblica in worker/wrangler.toml e app/js/config.js…");
const sostituisci = (file, re, nuovo) => {
  const p = join(radice, file), s = readFileSync(p, "utf8");
  if (!re.test(s)) { console.error("Non trovo la chiave in " + file); process.exit(1); }
  writeFileSync(p, s.replace(re, nuovo));
};
sostituisci("worker/wrangler.toml", /VAPID_PUBBLICA = "[^"]*"/, `VAPID_PUBBLICA = "${pubblica}"`);
sostituisci("app/js/config.js", /var PUSH_VAPID = "[^"]*"/, `var PUSH_VAPID = "${pubblica}"`);

console.log("3/3  Fatto. Ora pubblica il Worker (cd worker; npx.cmd wrangler deploy) e il sito,");
console.log("     poi su ogni telefono tocca di nuovo «Attiva avvisi».");
