/* Disegno delle schermate e avvio (collegamento a Firebase) */
/* ---------- render ---------- */
let rq=false;
function schedule(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;checkEvents();renderAll()})}
function renderAll(){
  paintSoundBar();
  if(!S.me)return;
  prefillNum();
  if(S.role==="cassa"){refreshStepLabels();renderRecent();renderTicket();renderSearch();renderSel();renderMine();renderStock();renderAsporto();if(S.editOrder!=null&&!orderByNum(S.editOrder)){closeEdit();$("c-msg").className="msg";$("c-msg").textContent="L'ordine che stavi modificando è stato annullato."}
    else if(S.editOrder!=null&&!S.editLocked&&isLocked(orderByNum(S.editOrder))){$("x-msg").className="msg err";$("x-msg").textContent=LOCK_MSG(S.editOrder)}
    else if(S.editOrder!=null&&S.editLocked&&document.activeElement!==$("x-fixamt"))renderFix()}
  if(S.role==="camerieri")renderWaiterLists();
  if(S.role==="cucina")renderKitchen();
  if(S.role==="bar")renderBar();
  if(S.role==="uscita")renderUscita();
  if(S.role==="evento")renderEvent();
  if(S.role==="listino")renderLog();
}
setInterval(()=>{if(S.role==="cucina"||S.role==="camerieri"||S.role==="bar"||S.role==="uscita")renderAll()},30000);

/* ---------- avvio ---------- */
function listenMap(path,map,onReady){
  const ref=R(path);
  ref.on("child_added",s=>{map[s.key]={...s.val(),id:s.key};schedule()});
  ref.on("child_changed",s=>{map[s.key]={...s.val(),id:s.key};schedule()});
  ref.on("child_removed",s=>{delete map[s.key];schedule()});
  ref.once("value",()=>{onReady&&onReady();schedule()});
}
async function start(){
  const sv=lsGet("suono");S.sound=sv==null?true:sv==="1";setSoundBtns();
  /* l'audio si sblocca solo con un tocco «vero»: fine del tocco, clic o tasto (non l'inizio del tocco) */
  ["pointerup","touchend","click","keydown"].forEach(ev=>document.addEventListener(ev,()=>{if(!audioOk())ensureAudio()},{passive:true}));
  renderSteppers();
  S.cfg=loadCfg();
  if(!S.cfg){setConn("err","Da configurare");renderGate();return}
  if(!window.firebase){setConn("err","Offline");showBanner("Non riesco a caricare i componenti dell'app. Controlla la connessione e ricarica.");return}
  try{
    firebase.initializeApp(S.cfg);
    const auth=firebase.auth();
    const existing=await new Promise(res=>{let done=false;const un=auth.onAuthStateChanged(u=>{if(done)return;done=true;try{un()}catch(e){}res(u)});setTimeout(()=>{if(!done){done=true;res(auth.currentUser)}},4000)});
    if(!existing){
      if(navigator.onLine===false){setConn("err","Senza rete");showBanner("Serve la connessione per il primo avvio su questo dispositivo. Riprova appena c'è campo.");
        window.addEventListener("online",()=>location.reload(),{once:true});return}
      await auth.signInAnonymously();
    }
  }
  catch(e){setConn("err","Errore");showBanner("Collegamento a Firebase non riuscito. Controlla che l'accesso Anonimo sia attivo e che la configurazione sia giusta.");
    $("v-config").hidden=false;$("cfg-text").value=JSON.stringify(S.cfg,null,2);return}
  S.root=firebase.database().ref("ev");
  const j=hashParams.get("j");if(j)S.joinCode=j.toUpperCase();
  if(j||hashParams.get("cfg")||hashParams.get("c"))history.replaceState(null,"",baseUrl());
  firebase.database().ref(".info/connected").on("value",s=>{S.online=!!s.val();setConn(S.online?"ok":"err",S.online?"Collegato":"Senza rete: salvo appena torna");
    if(!S.usersLoaded)showBanner(S.online?"":"In attesa di rete: l'app si carica appena torna il segnale.");else if(S.online&&$("banner").textContent.startsWith("In attesa di rete"))showBanner("")});
  R("config/utenti").on("value",s=>{
    S.users=Object.values(s.val()||{}).filter(u=>u&&u.id);if(!S.usersLoaded&&$("banner").textContent.startsWith("In attesa di rete"))showBanner("");S.usersLoaded=true;
    const prev=S.me&&S.me.id;restoreSession();
    if(prev&&!S.me)showBanner("La tua sessione è scaduta: accedi di nuovo.");
    if(S.me&&!prev)renderGate();
    else if(!S.me||!prev)renderGate();
    if(!S.me&&S.joinCode&&!$("v-join").hidden)renderJoin();
    else{$("who-t").textContent=whoLbl();if(S.role==="persone"&&!S.editUser)renderUsers();schedule()}
  },e=>{showBanner(errText(e))});
  R("config/file").on("value",s=>{const v=s.val();S.file=(Array.isArray(v)?v:Object.values(v||{})).filter(Boolean);if(S.role==="persone")renderUsers();if(!S.me&&S.joinCode)renderJoin();schedule()});
  R("config/iscrizione").on("value",s=>{S.invite=s.val()||null;S.inviteLoaded=true;if(!S.me&&!S.joinCode&&lsGet("joinmode")==="1"&&S.invite)S.joinCode=S.invite;if(S.usersLoaded&&!S.me)renderGate()});
  R("config/ingressiChiusi").on("value",s=>{S.ingressiChiusi=!!s.val();if(!S.me&&S.joinCode)renderJoin();if(S.role==="persone")renderJoinState()});
  R("config/menu").on("value",s=>{const d=s.val()||{};
    S.varianti=(Array.isArray(d.varianti)?d.varianti:Object.values(d.varianti||{})).filter(Boolean).map(v=>({...v,prezzo:v.prezzo||0}));if(!S.varianti.length)S.varianti=DEFAULT_VAR;
    S.portate=(Array.isArray(d.portate)?d.portate:Object.values(d.portate||{})).filter(Boolean).map(p=>({...p,prezzo:p.prezzo||0,prezzoBimbi:p.prezzoBimbi||0,menu:p.menu?(Array.isArray(p.menu)?p.menu:Object.values(p.menu)).filter(Boolean):null}));if(!S.portate.length)S.portate=DEFAULT_PORT;S.newPorts=null;
    S.extra=(Array.isArray(d.extra)?d.extra:Object.values(d.extra||{})).filter(Boolean).map(x=>({...x,prezzo:x.prezzo||0}));
    S.reparti=toArr(d.reparti).filter(r=>r.id&&r.nome);S.portate=S.portate.map(p=>({...p,reparti:toArr(p.reparti).filter(x=>x.r)}));
    $("who-t").textContent=whoLbl();
    renderSteppers();if(S.imp)renderImport();if(S.role==="listino")renderListino();if(S.role==="cucina")renderStockEditor();if(S.role==="bar")renderBarStock();schedule()});
  R("config/scorte").on("value",s=>{S.scorte=s.val()||{};renderSteppers();schedule()});
  R("config/scorteBar").on("value",s=>{S.scorteX=s.val()||{};renderSteppers();schedule()});
  R("config/cassa/postazioni").on("value",s=>{S.post=s.val()||{};schedule()});
  listenMap("offerte",S.offMap);
  listenMap("log",S.logMap);
  listenMap("ordini",S.ordMap,()=>{S.ordLoaded=true;S.seenCalls=null;S.seenReady=null;checkEvents()});
  R("ordini").on("child_removed",s=>{if(!S.resetting&&S.ordLoaded)S.removedQ.push({...s.val(),id:s.key});schedule()});
  listenMap("annullati",S.annMap);
  listenMap("prenotazioni",S.prenMap);
}
start();
if("serviceWorker" in navigator&&location.protocol==="https:"){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
