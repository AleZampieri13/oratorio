/* ---------- avvisi ai camerieri con l'app chiusa (Web Push) ----------
   Il telefono del cameriere si iscrive e salva l'iscrizione in push/<persona>/<telefono>.
   Il telefono che segna Pronto / Annulla / annulla l'ordine legge le iscrizioni dei camerieri
   e le manda al Worker su Cloudflare (PUSH_WORKER), che spedisce le notifiche.
   Il Worker non tocca il database. Un errore qui non blocca mai l'azione. */
const pushConf=()=>typeof PUSH_WORKER==="string"&&!!PUSH_WORKER&&typeof PUSH_VAPID==="string"&&!!PUSH_VAPID;
/* configurato e supportato da questo telefono (su iPhone solo con l'app aperta dalla schermata Home) */
function pushPronto(){
  return pushConf()&&location.protocol==="https:"&&"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window}
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isStandalone=()=>navigator.standalone===true||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
function vapidKey(b64){const s=(b64+"=".repeat((4-b64.length%4)%4)).replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
/* impronta della chiave pubblica: un'iscrizione fatta con una chiave vecchia non vale più (va riattivata) */
const pushKv=()=>String(PUSH_VAPID).slice(-16);
const pushRef=(id,uid)=>fdb("push/"+id+(uid?"/"+uid:""));
async function pushReg(){return Promise.race([navigator.serviceWorker.ready,sleep(8000).then(()=>{throw new Error("service worker non pronto")})])}

/* S.push = {key, st}: st "on" = attivi su questo telefono, "off" = no; key = persona|telefono controllati */
const pushKeyNow=()=>S.me?S.me.id+"|"+authUid():"";
async function pushStato(){
  if(!S.me||!pushPronto())return;
  const key=pushKeyNow();if(S.pushCheck===key)return;S.pushCheck=key;
  let st="off";
  try{const reg=await pushReg(),sub=await reg.pushManager.getSubscription();
    if(sub&&Notification.permission==="granted"){const v=(await pushRef(S.me.id,authUid()).once("value")).val();
      if(v&&v.endpoint===sub.endpoint&&v.kv===pushKv())st="on"}}
  catch(e){console.warn("avvisi:",e)}
  if(S.pushCheck===key)S.pushCheck=null;
  if(pushKeyNow()===key){S.push={key,st};renderPushBar()}
}
const pushSet=st=>{S.push={key:pushKeyNow(),st};renderPushBar()};
async function pushAttiva(){
  const perm=await Notification.requestPermission();   /* dentro il tocco: su iPhone è obbligatorio */
  if(perm!=="granted"){pushSet("off");return}
  const reg=await pushReg();
  const old=await reg.pushManager.getSubscription();if(old){try{await old.unsubscribe()}catch(e){}}
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidKey(PUSH_VAPID)});
  const j=sub.toJSON();
  await pushRef(S.me.id,authUid()).set({endpoint:j.endpoint,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth},t:Date.now(),ua:navigator.userAgent.slice(0,120),kv:pushKv()});
  pushSet("on");
  /* prova subito che il telefono sa mostrare le notifiche (senza passare da internet) */
  try{await reg.showNotification("Avvisi attivi",{body:"Così ti arriva l'avviso quando un piatto è pronto. Tocca «Prova» per provarli con l'app chiusa.",tag:"avvisi-attivi",icon:"icon-192.png",badge:"icon-192.png"})}
  catch(e){showBanner("Avvisi attivati, ma il telefono non riesce a mostrare le notifiche: "+(e&&e.message||e))}
}
/* «Prova»: manda un avviso vero (dal Worker) a questo telefono; con l'app chiusa deve arrivare entro pochi secondi */
async function pushProva(){
  S.pushMsg="Mando la prova…";renderPushBar();
  const s=(await pushRef(S.me.id,authUid()).once("value")).val();
  if(!s||s.kv!==pushKv()){S.pushMsg="";pushSet("off");return}
  const j=await pushInvia([s],"Prova","Gli avvisi funzionano: questo telefono li riceve anche con l'app chiusa.","prova");
  S.pushMsg=j.inviati?"✓ Prova mandata: chiudi l'app (o spegni lo schermo), deve arrivare entro pochi secondi."
    :"✗ La prova non è partita"+((j.errori||[]).length?": "+j.errori.join(" | "):j.stato?": risposta "+j.stato:"")+".";
  renderPushBar();
}
/* manda al Worker; ritorna {inviati, scaduti, errori, stato} */
async function pushInvia(subs,titolo,testo,tag){
  const user=firebase.auth().currentUser;if(!user||typeof user.getIdToken!=="function")return {inviati:0,errori:["non collegato"]};
  const token=await user.getIdToken();
  const r=await fetch(PUSH_WORKER.replace(/\/+$/,"")+"/invia",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token,a:subs.map(s=>({endpoint:s.endpoint,keys:s.keys})),titolo,testo:String(testo).slice(0,200),tag})});
  if(!r.ok)return {inviati:0,stato:r.status};
  return await r.json().catch(()=>({inviati:0,stato:"risposta illeggibile"}));
}
/* il service worker dice se un avviso è arrivato e se è riuscito a mostrarlo */
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const d=e.data;if(!d||!d.avvisi)return;
  console.info("avvisi: arrivato al telefono",d);
  if(d.errore)showBanner("È arrivato un avviso ma il telefono non è riuscito a mostrarlo: "+d.errore);
  else if(d.tag==="prova"){S.pushMsg="✓ La prova è arrivata a questo telefono.";renderPushBar()}});
async function pushDisattiva(){
  await pushTogli(S.me.id,authUid());
  pushSet("off");
}
/* toglie le iscrizioni di una persona (tutte, o solo quella del telefono uid); se è questo telefono la toglie anche qui */
async function pushTogli(id,uid){
  if(!id)return;
  try{await pushRef(id,uid).remove()}catch(e){console.warn("avvisi:",e)}
  if(uid&&uid===authUid()&&pushPronto()){
    try{const reg=await pushReg(),sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe()}catch(e){console.warn("avvisi:",e)}}
}

/* striscia nella pagina Camerieri */
function renderPushBar(){
  const el=$("pushbar");if(!el)return;
  if(!S.me||S.role!=="camerieri"||!pushConf()){el.hidden=true;return}
  let h="",ok=false,warn=false;
  if(!pushPronto()){
    if(isIOS()&&!isStandalone())
      {warn=true;h=`🔔 <b>Avvisi con l'app chiusa</b>: su iPhone tocca <b>Condividi</b> (il quadrato con la freccia) → <b>Aggiungi alla schermata Home</b>, poi apri l'app dall'icona sulla Home e qui tocca «Attiva avvisi».`}
    else if(isIOS())
      {warn=true;h=`🔔 Per gli avvisi con l'app chiusa serve iOS 16.4 o più recente: aggiorna l'iPhone da Impostazioni → Generali → Aggiornamento software.`}
    else{el.hidden=true;return}
  }
  else if(Notification.permission==="denied"){warn=true;
    h=isIOS()?`🔕 Avvisi bloccati su questo telefono. Per riattivarli: Impostazioni dell'iPhone → Notifiche → Ordini Oratorio → Consenti notifiche. Poi riapri l'app.`
      :/SamsungBrowser/.test(navigator.userAgent)?`🔕 Avvisi bloccati per questo sito in Samsung Internet. Apri <b>Samsung Internet</b> (il browser) → menu ☰ → <b>Impostazioni</b> → <b>Siti e download</b> → <b>Notifiche</b>: tocca giovanichef.web.app e scegli <b>Consenti</b>. Poi chiudi e riapri l'app e tocca «Attiva avvisi».`
      :`🔕 Avvisi bloccati per questo sito. Apri <b>Chrome</b> (il browser) → menu ⋮ → <b>Impostazioni</b> → <b>Impostazioni sito</b> → <b>Notifiche</b>: tocca giovanichef.web.app e scegli <b>Consenti</b>. Poi chiudi e riapri l'app e tocca «Attiva avvisi».`}
  else{
    if(!S.push||S.push.key!==pushKeyNow()){pushStato();el.hidden=true;return}
    if(S.push.st==="on"){ok=true;h=`🔔 Avvisi attivi: ti arrivano anche con l'app chiusa. <button class="btn small" data-push="prova">Prova</button><button class="btn small" data-push="off">Disattiva avvisi</button>${S.pushMsg?`<div>${esc(S.pushMsg)}</div>`:""}`}
    else h=`<button class="btn primary" data-push="on">🔔 Attiva avvisi</button> <span>Ti avvisa quando un piatto è pronto, anche con l'app chiusa.</span>`;
  }
  if(el._h!==h){el.innerHTML=h;el._h=h}
  el.classList.toggle("ok",ok);el.classList.toggle("warn",warn);el.hidden=false;
}
$("pushbar").addEventListener("click",async e=>{
  const b=e.target.closest("button[data-push]");if(!b||b.disabled)return;
  b.disabled=true;
  S.pushMsg="";
  try{if(b.dataset.push==="on")await pushAttiva();else if(b.dataset.push==="prova")await pushProva();else await pushDisattiva()}
  catch(err){console.warn("avvisi:",err);if(b.dataset.push==="prova"){S.pushMsg="✗ La prova non è partita: "+(err&&err.message||err);renderPushBar()}
    else showBanner("Non sono riuscito ad attivare gli avvisi: riprova. ("+(err&&err.message||err)+")")}
  finally{b.disabled=false}
});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.role==="camerieri"&&S.me&&pushPronto())pushStato()});

/* ---------- mandare gli avvisi ----------
   Le azioni dell'uscita e del bar fanno più scritture una dopo l'altra (ordini uniti, «Tutto pronto», pronto in parte).
   Ogni passaggio di stato di un piatto si annota qui (pushNota); dopo un attimo senza nuovi passaggi parte
   un solo avviso per cameriere con tutti i piatti. Se un piatto torna allo stato di prima (Annulla subito) non parte niente. */
const PUSH_ROLES=["uscita","bar","cucina"],PUSH_ATTESA=1500;
function pushNota(n,k,from,to,q,part){
  if(!pushConf()||!PUSH_ROLES.includes(S.role)||from===to)return;
  console.info("avvisi: annotato",n,k,from,"→",to);
  S.pushQ=S.pushQ||new Map();const key=n+"|"+k,x=S.pushQ.get(key);
  if(x){x.to=to;x.q=q;x.part=x.part||!!part}else S.pushQ.set(key,{n,k,from,to,q,part:!!part});
  clearTimeout(S.pushT);S.pushT=setTimeout(pushFlush,PUSH_ATTESA);
}
function pushFlush(){
  const L=[...(S.pushQ||new Map()).values()];S.pushQ=new Map();
  const pr=L.filter(x=>x.to==="pronta"&&x.from!=="pronta"),np=L.filter(x=>x.from==="pronta"&&(x.to==="chiamata"||x.to==="attesa"));
  if(pr.length)avvisaCamerieri("pronto",pr);
  if(np.length)avvisaCamerieri("nonpronto",np);
}
const PUSH_TIT={pronto:"Pronto",nonpronto:"Non ancora pronto",annullato:"Ordine annullato"};
/* tipo: "pronto" | "nonpronto" | "annullato"; voci: [{n, k?, q?, part?, o?}] (o = l'ordine, se è già stato tolto dal database).
   Non c'è niente da aspettare: gli errori finiscono solo in console. */
function avvisaCamerieri(tipo,voci){
  if(!pushConf()||!voci||!voci.length)return;
  pushManda(tipo,voci).catch(e=>console.warn("avvisi:",e));
}
async function pushManda(tipo,voci){
  /* per cameriere: gruppi (ordine o ordini uniti) → piatti */
  const per=new Map();
  for(const v of voci){
    const o=v.o||orderByNum(v.n);if(!o||o.asportoSubito)continue;
    const G=tipo==="annullato"?[o]:unitiOf(o),gk=tipo==="annullato"?"n"+o.numero:gKey(o);
    const ids=new Set();G.forEach(x=>{const w=ownerId(x);if(w)ids.add(w);sharedIds(x).forEach(s=>ids.add(s))});
    for(const id of ids){
      if(!per.has(id))per.set(id,new Map());const gm=per.get(id);
      if(!gm.has(gk))gm.set(gk,{o,nums:G.length>1?gNums(G):String(o.numero),piatti:new Map()});
      if(v.k){const g=gm.get(gk),b=kBase(v.k),p=g.piatti.get(b)||{q:0,part:false};p.q+=v.q||0;p.part=p.part||!!v.part;g.piatti.set(b,p)}
    }
  }
  if(!per.size){console.info("avvisi:",tipo,"nessun cameriere da avvisare",voci.map(v=>v.n));return}
  await Promise.all([...per].map(async([id,gm])=>{
    const groups=[...gm.entries()];
    const testo=groups.map(([,g])=>{
      if(tipo==="annullato")return "Ordine "+whereTxt(g.o)+" annullato";
      const ps=[...g.piatti].map(([b,p])=>tipo==="pronto"&&p.part?(p.q>1?`Pronti ${p.q} ${piattoNome(b)}`:`1 ${piattoNome(b)}`):piattoNome(b));
      return ps.join(", ")+" · n. "+g.nums}).join(" — ").slice(0,200);
    const subs=(await pushRef(id).once("value")).val()||{};
    const all=Object.entries(subs).filter(([,s])=>s&&s.endpoint&&s.keys&&s.kv===pushKv());
    if(!all.length)console.info("avvisi:",tipo,"il cameriere",nameOf(id,id),"non ha attivato gli avvisi");
    for(let i=0;i<all.length;i+=20){const part=all.slice(i,i+20);
      const j=await pushInvia(part.map(([,s])=>s),PUSH_TIT[tipo],testo,"o"+groups[0][0]);
      if(j.stato){console.warn("avvisi: il Worker ha risposto",j.stato);continue}
      console.info("avvisi:",tipo,"a",nameOf(id,id),"·",testo,"· telefoni",part.length,"· inviati",j.inviati,"· scaduti",(j.scaduti||[]).length,...((j.errori||[]).length?["· ERRORI:",j.errori.join(" | ")]:[]));
      for(const ep of (j.scaduti||[])){const hit=part.find(([,s])=>s.endpoint===ep);if(hit)pushRef(id,hit[0]).remove().catch(e=>console.warn("avvisi:",e))}
    }
  }));
}
