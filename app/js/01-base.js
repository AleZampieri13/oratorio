/* Stato dell'app, ruoli, accesso, funzioni comuni */
const DEFAULT_VAR=[{id:"std",nome:"Standard",prezzo:0},{id:"bimbi",nome:"Bambini",prezzo:0}];
const DEFAULT_PORT=[{id:"antipasto",nome:"Antipasto"},{id:"primo",nome:"Primo"},{id:"secondo",nome:"Secondo"},{id:"dolce",nome:"Dolce"}];
const STATO_TXT={attesa:"Non ancora chiamata",chiamata:"Chiamata, in cucina",pronta:"Pronta da portare",servita:"Servita"};
const ROLE_LBL={master:"Master",capo:"Capo camerieri",cassa:"Cassa",cameriere:"Cameriere",cucina:"Cucina",bar:"Bar",uscita:"Uscita piatti"};
const ROLE_GRP={master:"Master",capo:"Capo camerieri",cassa:"Cassa",cameriere:"Camerieri",cucina:"Cucina",bar:"Bar",uscita:"Uscita piatti"};
const ROLE_ORDER=["master","capo","cassa","cameriere","cucina","uscita","bar"];
const PIN_ROLES=["master","capo","cassa","cucina","uscita","bar"];
const ALLOWED={master:["cassa","camerieri","cucina","uscita","bar","listino","persone","evento"],uscita:["uscita"],bar:["bar"],capo:["camerieri","persone"],cassa:["cassa","listino"],cameriere:["camerieri"],cucina:["cucina"]};
const PRIMARY_ORDER=["master","cassa","cucina","uscita","bar","capo","cameriere"];
const TAB_ORDER=["cassa","camerieri","cucina","uscita","bar","listino","persone","evento"];
function rolesOf(u){if(!u)return [];const x=u.ruoli;const extra=Array.isArray(x)?x:Object.values(x||{});return [...new Set([u.ruolo,...extra].filter(Boolean))]}
function hasRole(u,r){return rolesOf(u).includes(r)}
function allowedFor(u){const st=new Set();rolesOf(u).forEach(r=>(ALLOWED[r]||[]).forEach(t=>st.add(t)));return TAB_ORDER.filter(t=>st.has(t))}
function rolesLbl(u){return rolesOf(u).map(r=>ROLE_LBL[r]).join(" + ")}
function whoLbl(){if(!S.me)return "";const f=myFila(),mr=myReps()||(typeof oFixed==="function"?oFixed():null)||bFixed();return S.me.nome+" · "+(S.me.ruolo==="cameriere"&&f?filaNome(f):rolesLbl(S.me))+(mr?" ("+mr.map(repNome).join(", ")+")":"")}
/* reparti della cucina */
const toArr=x=>(Array.isArray(x)?x:Object.values(x||{})).filter(Boolean);
function repList(){return S.reparti||[]}
function repNome(id){const r=repList().find(x=>x.id===id);return r?r.nome:""}
function portReps(p){return toArr(p&&p.reparti).filter(x=>x.r&&repList().some(r=>r.id===x.r))}
function repSnap(k){  const rs=portReps(S.portate.find(p=>p.id===k));if(!rs.length)return null;const o={};
  rs.forEach(x=>{o[x.r]={s:"chiamata",nome:repNome(x.r)};if(x.piatto)o[x.r].piatto=x.piatto});return o}
function userReps(u){return toArr(u&&u.reparti).filter(id=>repList().some(r=>r.id===id))}
function myReps(){if(!S.me||hasRole(S.me,"master")||!hasRole(S.me,"cucina"))return null;const rs=userReps(S.me).filter(r=>!barReps().includes(r));return rs.length?rs:null}
/* bar: chi ha un reparto bar assegnato in Persone vede solo quello; gli altri scelgono (Tutti = tutti i bar) */
function bFixed(){if(!S.me||hasRole(S.me,"master")||!hasRole(S.me,"bar"))return null;const rs=userReps(S.me).filter(r=>barReps().includes(r));return rs.length?rs:null}
function bScope(){const f=bFixed();if(f)return f;const bs=barReps();return S.bRep&&bs.includes(S.bRep)?[S.bRep]:bs}
/* reparti segnati «è un bar»: li vede la pagina Bar; gli altri la cucina e l'uscita */
function barReps(){return repList().filter(r=>r.bar).map(r=>r.id)}
function kitchenReps(){return repList().filter(r=>!r.bar).map(r=>r.id)}
function kScope(){const f=myReps();if(f)return f;if(S.kRep&&kitchenReps().includes(S.kRep))return [S.kRep];const k=kitchenReps();return k.length?k:null}
function partsOf(p){const done=p&&(p.stato==="pronta"||p.stato==="servita");
  return Object.entries((p&&p.rep)||{}).map(([r,v])=>({r,nome:v.nome||repNome(r)||r,piatto:v.piatto||"",ok:done||v.s==="pronta"}))}
function partsTxt(p,skip){const ps=partsOf(p);if(ps.length<2)return "";return ps.filter(x=>x.r!==skip).map(x=>`${esc(x.piatto||x.nome)} ${x.ok?"✓":"…"}`).join(" · ")}
const TAB_LBL={cassa:"Cassa",camerieri:"Camerieri",cucina:"Cucina",uscita:"Uscita",bar:"Bar",listino:"Listino",persone:"Persone",evento:"Evento"};
const CODE_ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const S={root:null,online:true,ordMap:{},prenMap:{},ordLoaded:false,varianti:DEFAULT_VAR,portate:DEFAULT_PORT,users:[],usersLoaded:false,me:null,role:null,
  qty:{},eqty:{},editOrder:null,numDirty:false,openNum:null,lastNum:null,selPren:null,loginPick:null,pending:new Set(),
  kFilt:lsGet("kfiltro")||"",seenCalls:null,seenReady:null,sound:false,audio:null,wFilter:"mie",imp:null,editUser:null,cfg:null,invite:null,inviteLoaded:false,joinCode:null,
  extra:[],pay:"contanti",xpay:"contanti",dpay:"contanti",scorte:{},fondo:0,contato:null,offMap:{},stockWarn:null,sqty:{},esqty:{},aspMode:"subito",newPorts:null,logMap:{},aspConfirm:null,seenBar:null,post:{},closeKey:"",file:null,joinFila:"",
  reparti:[],L:null,wTab:{},split:false,parts:[],smode:"piatti",kRep:lsGet("krep")||"",bRep:lsGet("brep")||"",oRep:lsGet("orep")||"",seenOut:null,removedQ:[],annMap:{},editLocked:false};

function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
function norm(s){return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim()}
function rid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function newCode(){const a=new Uint32Array(6);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<6;i++)a[i]=Math.random()*1e9}return [...a].map(x=>CODE_ALPHA[x%CODE_ALPHA.length]).join("")}
async function hashPin(salt,pin){
  const txt=salt+":"+pin;
  try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(txt));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
  catch(e){let h=0;for(const ch of txt){h=(h*31+ch.charCodeAt(0))|0}return "x"+h}
}
const validPin=p=>/^\d{4,6}$/.test(p);
const R=p=>S.root.child(p);
function b64e(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function b64d(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return decodeURIComponent(escape(atob(s)))}
const fmtEur=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"});
const money=v=>fmtEur.format(v||0);
function parsePrice(s){const n=parseFloat(String(s==null?"":s).replace(/[€\s]/g,"").replace(",","."));return isFinite(n)&&n>=0?Math.round(n*100)/100:0}
const hasPrices=()=>S.varianti.some(v=>v.prezzo>0);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- configurazione ---------- */
const CFG_KEYS=["apiKey","authDomain","databaseURL","projectId","storageBucket","messagingSenderId","appId"];
function parseCfgText(t){const o={};let m;const re=/["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g;while((m=re.exec(t)))if(CFG_KEYS.includes(m[1]))o[m[1]]=m[2];return o}
function cfgOk(c){return c&&c.apiKey&&c.databaseURL&&c.projectId}
function shortCfg(c){const o={};["apiKey","authDomain","databaseURL","projectId","appId"].forEach(k=>{if(c[k])o[k]=c[k]});return o}
function baseUrl(){return location.origin+location.pathname}
/* codice di accesso: arriva con il link o il QR (#k=…) e resta sul telefono */
function accKey(){return lsGet("acc")||""}
const isDenied=e=>String((e&&(e.code||e.message))||"").toLowerCase().includes("permission");
function linkWith(params){
  const p=new URLSearchParams();
  if(!EMBEDDED_CONFIG&&S.cfg)p.set("cfg",b64e(JSON.stringify(shortCfg(S.cfg))));
  if(accKey())p.set("k",accKey());
  Object.entries(params||{}).forEach(([k,v])=>p.set(k,v));
  const s=p.toString();return baseUrl()+(s?"#"+s:"");
}
const hashParams=new URLSearchParams((location.hash||"").slice(1));
function loadCfg(){
  if(hashParams.get("cfg")){try{const c=JSON.parse(b64d(hashParams.get("cfg")));if(cfgOk(c)){lsSet("fbcfg",JSON.stringify(c));return c}}catch(e){}}
  if(cfgOk(EMBEDDED_CONFIG))return EMBEDDED_CONFIG;
  try{const c=JSON.parse(lsGet("fbcfg")||"null");if(cfgOk(c))return c}catch(e){}
  return null;
}
$("cfg-go").addEventListener("click",()=>{
  const c=parseCfgText($("cfg-text").value),m=$("cfg-msg");
  if(!c.apiKey||!c.projectId){m.textContent="Non trovo apiKey e projectId: copia l'intero blocco firebaseConfig.";return}
  if(!c.databaseURL){m.textContent="Manca databaseURL. Crea prima il Realtime Database, poi ricopia la configurazione dalle impostazioni del progetto.";return}
  lsSet("fbcfg",JSON.stringify(c));location.reload();
});

/* ---------- vista, ruoli, schermo acceso ---------- */
const VIEWS=["v-config","v-setup","v-login","v-join","v-noaccess","p-cassa","p-camerieri","p-cucina","p-uscita","p-bar","p-listino","p-persone","p-evento"];
function showOnly(id){VIEWS.forEach(x=>$(x).hidden=x!==id)}
/* Sessione nel database: il telefono scrive in sessioni/<suo id> chi è, con l'impronta del PIN
   (o il gettone del cameriere). Le regole del database la accettano solo se è giusta, e da lì
   sanno il ruolo. I PIN stanno in pin/<persona>, che nessuno può leggere. */
const fdb=p=>firebase.database().ref(p);
function authUid(){try{return firebase.auth().currentUser.uid}catch(e){return ""}}
const credOf=(u,k)=>u.ruolo==="cameriere"?{t:k}:{h:k};
/* true = accettata, false = PIN sbagliato / scaduta, null = rete lenta */
async function openSess(uid,cred){const a=authUid();if(!a)return null;
  try{await Promise.race([fdb("sessioni/"+a).set({u:uid,...cred}),sleep(8000).then(()=>{throw {code:"timeout"}})]);return true}
  catch(e){return isDenied(e)?false:null}}
function sessionValid(u,k){return !!u&&!!k&&(u.ruolo==="cameriere"?u.token===k:true)}
function restoreSession(){
  let s=null;try{s=JSON.parse(lsGet("sess")||"null")}catch(e){}
  const u=s&&S.users.find(x=>x.id===s.uid);
  S.me=sessionValid(u,s&&s.k)?u:null;
  if(S.me&&!S._wf){S.wFilter=hasRole(S.me,"master")?"tutte":"mie";S._wf=true}
  if(!S.me&&s)lsSet("sess",null);
  /* il database ricontrolla la sessione all'avvio e quando cambia il PIN (cambia il «sale») */
  if(S.me){const sig=S.me.id+"|"+(S.me.salt||"")+"|"+(S.me.token||"");
    if(S.sessSig!==sig){S.sessSig=sig;const me=S.me;
      openSess(me.id,credOf(me,s.k)).then(ok=>{if(ok===false&&S.me&&S.me.id===me.id){lsSet("sess",null);S.me=null;S.sessSig=null;S.role=null;
        showBanner("La tua sessione è scaduta: accedi di nuovo.");renderGate()}})}}
}
function startSession(u,k){
  S.me=u;S.sessSig=u.id+"|"+(u.salt||"")+"|"+(u.token||"");lsSet("sess",JSON.stringify({uid:u.id,k}));
  S.role=null;S.wFilter=hasRole(u,"master")?"tutte":"mie";S.seenReady=null;$("toast").hidden=true;
  if(/sessione è scaduta|QR d'iscrizione non è più valido/.test($("banner").textContent))showBanner("");
  closeEdit();resetForm();S.lastNum=null;S.openNum=null;$("w-prev").hidden=true;$("w-num").value="";
  ["c-msg","w-msg","u-msg","l-vmsg","l-rmsg","l-pmsg","i-msg","k-stock-msg","b-stock-msg","d-msg"].forEach(id=>{$(id).textContent=""});
  $("c-last").innerHTML="";$("c-last-wrap").hidden=true;
  renderGate();
  S.seenCalls=null;S.seenBar=null;S.seenMyCalls=null;checkEvents();
}
let wakeLock=null;
async function keepAwake(){
  if(S.role!=="cucina"){if(wakeLock){try{wakeLock.release()}catch(e){}wakeLock=null}return}
  if(wakeLock||document.visibilityState!=="visible"||!navigator.wakeLock)return;
  try{wakeLock=await navigator.wakeLock.request("screen");wakeLock.addEventListener("release",()=>{wakeLock=null})}catch(e){wakeLock=null}
}
document.addEventListener("visibilitychange",keepAwake);
document.addEventListener("click",keepAwake,{passive:true});
function renderGate(){
  if(S.noAccess){showOnly("v-noaccess");$("tabs").hidden=true;$("who").hidden=true;return}
  if(!S.root){showOnly(S.cfg?null:"v-config");$("tabs").hidden=true;$("who").hidden=true;return}
  if(!S.usersLoaded){showOnly(null);$("tabs").hidden=true;$("who").hidden=true;return}
  if(!S.users.length){showOnly("v-setup");$("tabs").hidden=true;$("who").hidden=true;return}
  if(!S.me&&S.joinCode&&S.inviteLoaded){
    if(S.joinCode!==S.invite){S.joinCode=null;showBanner("Questo QR d'iscrizione non è più valido. Chiedi al capo camerieri quello nuovo.")}
    else{showOnly("v-join");$("tabs").hidden=true;$("who").hidden=true;renderJoin();return}
  }
  if(!S.me){showOnly("v-login");$("tabs").hidden=true;$("who").hidden=true;renderLogin();return}
  const allowed=allowedFor(S.me);
  if(!allowed.includes(S.role)){const r=lsGet("ruolo");S.role=allowed.includes(r)?r:allowed[0]}
  $("who").hidden=false;$("who-t").textContent=whoLbl();
  const tabs=$("tabs");tabs.hidden=allowed.length<2;tabs.style.setProperty("--n",allowed.length<=5?allowed.length:allowed.length===6?3:4);
  tabs.innerHTML=allowed.map(r=>`<button role="tab" data-role="${r}" aria-selected="${r===S.role}">${TAB_LBL[r]}</button>`).join("");
  showOnly("p-"+S.role);
  keepAwake();
  if(S.role==="persone")renderUsers();
  if(S.role==="listino")renderListino();
  if(S.role==="cucina")renderStockEditor();
  if(S.role==="bar")renderBarStock();
  renderAll();
}
$("tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-role]");if(!b)return;S.role=b.dataset.role;lsSet("ruolo",S.role);renderGate()});
$("logout").addEventListener("click",()=>{if(!armed($("logout"),"Esci davvero?"))return;$("toast").hidden=true;
  if(S.me&&S.me.ruolo==="cameriere"){lsSet("joinmode","1");S.joinCode=S.invite||null}
  if(authUid())fdb("sessioni/"+authUid()).remove().catch(()=>{});
  S.me=null;lsSet("sess",null);S.loginPick=null;$("l-pin").value="";S.role=null;keepAwake();renderGate()});

/* ---------- primo avvio, accesso, iscrizione ---------- */
$("s-go").addEventListener("click",async()=>{
  const m=$("s-msg"),nome=$("s-nome").value.trim(),p=$("s-pin").value,p2=$("s-pin2").value;
  if(!nome){m.textContent="Scrivi il tuo nome.";return}
  if(!validPin(p)){m.textContent="Il PIN deve avere da 4 a 6 cifre.";return}
  if(p!==p2){m.textContent="I due PIN non coincidono.";return}
  const id=rid("u"),salt=newCode()+newCode(),h=await hashPin(salt,p);const u={id,nome,ruolo:"master",salt};
  try{await fdb("pin/"+id).set(h);
    const r=await R("config/utenti").transaction(cur=>cur?undefined:{[id]:u});
    if(!r.committed){m.textContent="Un master esiste già: accedi dalla schermata di accesso.";return}
    await openSess(id,{h});
    if(!S.users.some(x=>x.id===id))S.users=[...S.users,u];startSession(u,h);}
  catch(e){m.textContent=errText(e)}
});
function renderLogin(){
  $("l-names").innerHTML=PIN_ROLES.map(r=>{const us=S.users.filter(u=>u.ruolo===r);if(!us.length)return"";
    return `<div class="stack"><span class="label">${ROLE_GRP[r]}</span><div class="grp">${us.map(u=>`<button data-uid="${esc(u.id)}" aria-pressed="${S.loginPick===u.id}">${esc(u.nome)}</button>`).join("")}</div></div>`}).join("");
  const u=S.users.find(x=>x.id===S.loginPick);$("l-pinbox").hidden=!u;if(u)$("l-pinlabel").textContent="PIN di "+u.nome;
}
$("l-names").addEventListener("click",e=>{const b=e.target.closest("button[data-uid]");if(!b)return;S.loginPick=b.dataset.uid;$("l-msg").textContent="";$("l-pin").value="";renderLogin();$("l-pin").focus()});
async function doLogin(){
  const u=S.users.find(x=>x.id===S.loginPick);if(!u)return;
  const h=await hashPin(u.salt,$("l-pin").value),b=$("l-go");b.disabled=true;$("l-msg").textContent="";
  const ok=await openSess(u.id,{h});b.disabled=false;
  if(ok===false){$("l-msg").textContent="PIN sbagliato. Riprova.";$("l-pin").value="";return}
  if(ok===null){$("l-msg").textContent="Rete lenta: non riesco a controllare il PIN. Riprova.";return}
  $("l-pin").value="";S.loginPick=null;startSession(u,h);
}
$("l-go").addEventListener("click",doLogin);
$("l-pin").addEventListener("keydown",e=>{if(e.key==="Enter")doLogin()});
function loginCode(code){
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!code||code!==S.invite){$("l-code-msg").textContent="Codice non valido. Chiedi al capo camerieri il QR d'iscrizione.";return}
  $("l-code").value="";$("l-code-msg").textContent="";S.joinCode=code;renderGate();
}
$("l-code-go").addEventListener("click",()=>loginCode($("l-code").value));
$("l-code").addEventListener("keydown",e=>{if(e.key==="Enter")loginCode($("l-code").value)});
function myTok(u){return !!u&&!!u.token&&lsGet("wtok:"+u.id)===u.token}
function renderJoin(){
  const box=$("j-list");
  if(S.ingressiChiusi){box.innerHTML='<div class="empty">Ingressi chiusi. Chiedi al capo camerieri.</div>';return}
  const ws=S.users.filter(u=>u.ruolo==="cameriere");
  if(!ws.length){box.innerHTML='<div class="empty">Nessun cameriere in elenco. Chiedi al capo camerieri.</div>';return}
  const groups=[...fileList().map(f=>({nome:f.nome,us:ws.filter(u=>u.fila===f.id)})),{nome:"Senza fila",us:ws.filter(u=>!fileList().some(f=>f.id===u.fila))}].filter(g=>g.us.length);
  box.innerHTML=groups.map(g=>`<div class="stack"><span class="label">${esc(g.nome)}</span><div class="grp">${g.us.sort((a,b)=>a.nome.localeCompare(b.nome)).map(u=>{const busy=!!u.token&&!myTok(u);
    return `<button data-juid="${esc(u.id)}" ${busy?"disabled":""}>${esc(u.nome)}${busy?" · in uso":""}</button>`}).join("")}</div></div>`).join("");
}
$("j-pin").addEventListener("click",()=>{lsSet("joinmode",null);S.joinCode=null;renderGate()});
$("j-list").addEventListener("click",async e=>{
  const b=e.target.closest("button[data-juid]");if(!b||b.disabled)return;const m=$("j-msg");m.textContent="";
  if(S.ingressiChiusi||S.joinCode!==S.invite){renderGate();return}
  const u=S.users.find(x=>x.id===b.dataset.juid);if(!u)return;
  if(myTok(u)){await openSess(u.id,{t:u.token});S.joinCode=null;startSession(u,u.token);return}
  const tok=newCode();b.disabled=true;
  try{const r=await R("config/utenti/"+u.id+"/token").transaction(cur=>cur?undefined:tok);
    if(!r.committed){m.textContent=`${u.nome} è già in uso su un altro telefono. Chiedi al capo camerieri.`;renderJoin();return}
    lsSet("wtok:"+u.id,tok);await openSess(u.id,{t:tok});S.joinCode=null;const me={...u,token:tok};S.users=S.users.map(x=>x.id===u.id?me:x);startSession(me,tok)}
  catch(err){m.textContent=errText(err);b.disabled=false}
});

/* ---------- helpers ---------- */
function ordersArr(){return Object.values(S.ordMap)}
function prensArr(){return Object.values(S.prenMap)}
function orderByNum(n){return S.ordMap[n]}
function righe(o){const r=o&&o.righe;return (Array.isArray(r)?r:Object.values(r||{})).filter(Boolean)}
function righeChips(rr){return (rr||[]).map(r=>`<span class="chip">${r.qta} ${esc(r.nome)}</span>`).join("")}
function cop(rr){return (rr||[]).reduce((a,r)=>a+(r.qta||0),0)}
function ago(t){if(!t)return"";const m=Math.floor((Date.now()-t)/60000);return m<1?"adesso":m+" min"}
function errText(e){
  const c=String((e&&e.code)||"");
  if(c.includes("permission"))return "Il database ha rifiutato la scrittura: controlla le regole e che l'accesso Anonimo sia attivo in Firebase.";
  return "Operazione non riuscita: controlla la connessione e riprova.";
}
function setConn(cls,t){$("conn").className="conn "+cls;$("conn-t").textContent=t}
function nextNum(){let m=0;ordersArr().forEach(o=>{if(o.numero>m)m=o.numero});Object.keys(S.annMap).forEach(k=>{const v=Number(k);if(v>m)m=v});return m+1}
function showBanner(t){$("banner").textContent=t;$("banner").hidden=!t}
const myName=()=>S.me?S.me.nome:"";
function nameOf(id,fallback){const u=id&&S.users.find(x=>x.id===id);return u?u.nome:(fallback||"")}
let toastT=null;
let toastAct=null,toastOpen=null;
function toast(t,opts){const el=$("toast");opts=opts||{};toastAct=opts.action||null;toastOpen=opts.open!=null?opts.open:null;
  el.innerHTML=`<span>${esc(t)}</span>${toastAct?`<button class="tbtn" id="toast-act">${esc(toastAct.label)}</button>`:toastOpen!=null?'<span class="tbtn">Apri</span>':""}`;
  el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},opts.ms||6000)}
$("toast").addEventListener("click",e=>{const el=$("toast");el.hidden=true;
  if(e.target.id==="toast-act"&&toastAct){toastAct.fn();return}
  });

/* portate */
function portataCfg(k){return S.portate.find(p=>p.id===k)}
function applies(p,vid){return !p||!Array.isArray(p.menu)||p.menu.includes(vid)}
function coursesFor(rr,ss,xx){const out={};S.portate.forEach((p,i)=>{if(rr.some(r=>applies(p,r.id))||(ss||[]).some(s=>s.pid===p.id))out[p.id]={stato:"attesa",t:0,nome:p.nome,ord:i}});return out}
function orderCourses(o){
  const ps=o.portate||{};
  return Object.keys(ps).map(k=>{const c=portataCfg(k);const idx=S.portate.indexOf(c);return {k,l:(c&&c.nome)||ps[k].nome||k,ord:idx<0?100+(ps[k].ord||0):idx,p:ps[k]}}).sort((a,b)=>a.ord-b.ord);
}
function singoli(o){const r=o&&o.singoli;return (Array.isArray(r)?r:Object.values(r||{})).filter(Boolean)}
function righeFor(o,k){
  const p=portataCfg(k);return [...righe(o).filter(r=>applies(p,r.id)),...singoli(o).filter(s=>s.pid===k).map(s=>({id:"s-"+s.pid+s.k,nome:s.k==="b"?"singola bambini":"singola",qta:s.qta}))]}
function stOf(o,k){return (o.portate&&o.portate[k]&&o.portate[k].stato)||"attesa"}
function buildRighe(qty){return S.varianti.map(v=>({id:v.id,nome:v.nome,qta:qty[v.id]||0,prezzo:v.prezzo||0})).filter(r=>r.qta>0)}
function singlesList(){return S.portate.flatMap(p=>[p.prezzo>0?{id:p.id+"|a",pid:p.id,k:"a",nome:p.nome,prezzo:p.prezzo}:null,p.prezzoBimbi>0?{id:p.id+"|b",pid:p.id,k:"b",nome:p.nome+" bambini",prezzo:p.prezzoBimbi}:null]).filter(Boolean)}
function buildSingoli(sq){return singlesList().map(i=>({pid:i.pid,k:i.k,nome:i.nome,qta:sq[i.id]||0,prezzo:i.prezzo})).filter(r=>r.qta>0)}
/* chi prepara un extra: "" = bar, altrimenti l'id del reparto (se esiste ancora) */
function buildExtra(){return []}
/* nell'ordine: gli extra senza reparto sono del bar */
function extras(o){const r=o&&o.extra;return (Array.isArray(r)?r:Object.values(r||{})).filter(Boolean)}
const importo=rr=>Math.round(rr.reduce((a,r)=>a+r.qta*(r.prezzo||0),0)*100)/100;
const r2=v=>Math.round(v*100)/100;
function bill(qty,xq,paid,sq){const rr=buildRighe(qty),xx=buildExtra(xq),ss=buildSingoli(sq||{}),menu=importo(rr),ext=importo(xx),sing=importo(ss);
  return {rr,xx,ss,menu,ext,sing,tot:r2(menu+ext+sing),due:r2((paid?0:menu)+ext+sing),cop:cop(rr)}}
function singChips(ss){return (ss||[]).map(r=>`<span class="chip">${r.qta} ${esc(r.nome)}${r.k!=="b"?" (da solo)":""}</span>`).join("")}
/* porzioni */
const PORT_COLORS=["#0f766e","#b45309","#7c3aed","#be123c","#1d4ed8","#4d7c0f","#a21caf","#0e7490"];
/* colori per reparto: ogni piatto prende il colore del suo reparto (cucina, uscita, bar, cameriere) */
function repColor(rid){const i=repList().findIndex(r=>r.id===rid);const r=repList()[i];return (r&&r.colore)||PORT_COLORS[(i<0?0:i)%PORT_COLORS.length]}
function portColor(pid){const i=S.portate.findIndex(p=>p.id===pid);const p=S.portate[i];if(p&&p.rep)return repColor(p.rep);return (p&&p.colore)||PORT_COLORS[(i<0?0:i)%PORT_COLORS.length]}
function usedFor(pid){return ordersArr().reduce((a,o)=>a+(o.portate&&o.portate[pid]?cop(righeFor(o,pid)):0),0)}
function stockLeft(pid){const lim=S.scorte[pid];return (lim==null||lim==="")?null:lim-usedFor(pid)}
function leftTxt(l){return l<=0?"esaurito":l===1?"resta 1":"restano "+l}
function isLocked(o){return !!o&&(!!o.cameriereId||orderCourses(o).some(c=>(c.p.stato||"attesa")!=="attesa"))}
const LOCK_MSG=n=>{const o=orderByNum(n),w=o&&o.cameriereId?nameOf(o.cameriereId,o.cameriere):"";
  return `L'ordine ${n} è già partito${w?` (l'ha preso ${w})`:" (è già in cucina o al bar)"}: non si può più modificare. Per aggiungere qualcosa crea un nuovo ordine. Solo il master può annullarlo.`};
function orderDesc(rr,ss,xx){return [...(rr||[]).map(r=>`${r.qta} ${r.nome}`),...(ss||[]).map(s=>`${s.qta} ${s.nome}`),...(xx||[]).map(x=>`${x.qta} ${x.nome}`)].join(", ")||"vuoto"}
async function burnOrder(n,o,back,how){
  await R("annullati/"+n).set({n,t:Date.now(),da:myName(),daId:S.me?S.me.id:"",nome:o.nome||"",restituiti:back,partito:isLocked(o)});
  await R("ordini/"+n).remove();
  if(o.prenotazione)R("prenotazioni/"+o.prenotazione).update({stato:"attesa",ordine:0}).catch(()=>{});
  logChange(`Ordine ${n}${o.nome?" ("+o.nome+")":""} annullato${how?" "+how:""}: ${orderDesc(righe(o),singoli(o),extras(o))}${back>0?` · restituiti ${money(back)}`:""}`);
}
function armed(btn,label){
  const disarm=()=>{if(btn.dataset.armed!=="1")return;btn.dataset.armed="";btn.textContent=btn.dataset.label||btn.textContent;btn.classList.remove("solid");clearTimeout(btn._armT)};
  if(btn.dataset.armed==="1"){disarm();return true}
  btn.dataset.label=btn.textContent;btn.dataset.armed="1";btn.textContent=label||"Sicuro? Tocca di nuovo";btn.classList.add("solid");
  btn._armT=setTimeout(()=>{if(btn.isConnected)disarm()},4000);
  return false;
}
/* tempo massimo di preparazione del piatto (Listino, «Pronto entro»); vuoto = 15 minuti */
const MIN_DEF=15;
function maxMin(pid){const p=S.portate.find(x=>x.id===pid);return p&&p.min>0?p.min:MIN_DEF}
function isLate(pid,t){return !!t&&Date.now()-t>maxMin(pid)*60000}
function stockCls(left){return left==null?"":left<=0?"out":left<=10?"low":""}

