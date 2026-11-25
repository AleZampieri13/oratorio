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
      if(v&&v.endpoint===sub.endpoint)st="on"}}
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
  await pushRef(S.me.id,authUid()).set({endpoint:j.endpoint,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth},t:Date.now(),ua:navigator.userAgent.slice(0,120)});
  pushSet("on");
}
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
  let h="",ok=false;
  if(!pushPronto()){
    if(isIOS()&&!isStandalone())
      h=`🔔 <b>Avvisi con l'app chiusa</b>: su iPhone tocca <b>Condividi</b> (il quadrato con la freccia) → <b>Aggiungi alla schermata Home</b>, poi apri l'app dall'icona sulla Home e qui tocca «Attiva avvisi».`;
    else if(isIOS())
      h=`🔔 Per gli avvisi con l'app chiusa serve iOS 16.4 o più recente: aggiorna l'iPhone da Impostazioni → Generali → Aggiornamento software.`;
    else{el.hidden=true;return}
  }
  else if(Notification.permission==="denied")
    h=`🔕 Avvisi bloccati su questo telefono. Per riattivarli: impostazioni del telefono → Notifiche → ${isIOS()?"l'app Ordini Oratorio":"il browser (o questo sito)"} → Consenti. Poi riapri l'app.`;
  else{
    if(!S.push||S.push.key!==pushKeyNow()){pushStato();el.hidden=true;return}
    if(S.push.st==="on"){ok=true;h=`🔔 Avvisi attivi: ti arrivano anche con l'app chiusa. <button class="btn small" data-push="off">Disattiva avvisi</button>`}
    else h=`<button class="btn primary" data-push="on">🔔 Attiva avvisi</button> <span>Ti avvisa quando un piatto è pronto, anche con l'app chiusa.</span>`;
  }
  if(el._h!==h){el.innerHTML=h;el._h=h}
  el.classList.toggle("ok",ok);el.hidden=false;
}
$("pushbar").addEventListener("click",async e=>{
  const b=e.target.closest("button[data-push]");if(!b||b.disabled)return;
  b.disabled=true;
  try{if(b.dataset.push==="on")await pushAttiva();else await pushDisattiva()}
  catch(err){console.warn("avvisi:",err);showBanner("Non sono riuscito ad attivare gli avvisi: riprova. ("+(err&&err.message||err)+")")}
  finally{b.disabled=false}
});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.role==="camerieri"&&S.me&&pushPronto())pushStato()});
