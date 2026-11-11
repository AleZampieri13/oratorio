/* Disegno delle schermate e avvio (collegamento a Firebase) */
/* ---------- render ---------- */
let rq=false;
function schedule(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;checkEvents();renderAll()})}
/* chi entra per primo con la v36 salva il listino convertito (una volta sola) */
function tryConvert(){if(!S.listinoConv||!S.me||S.convTried)return;S.convTried=true;const L=S.listinoConv;
  R("config/listino").transaction(cur=>cur?undefined:L).then(r=>{if(r&&r.committed)logChange("Listino della versione 36 preparato da quello di prima: controlla nomi e reparti dei piatti")},()=>{S.convTried=false})}
function oldOrdersBanner(){const old=S.ordLoaded&&isBoss()&&ordersArr().some(o=>o.v!==2),t="Ci sono ordini fatti con la versione precedente: chiudi la serata con «Nuovo evento» (scheda Evento) prima di cominciare.";
  if(old&&$("banner").hidden)showBanner(t);else if(!old&&$("banner").textContent===t)showBanner("")}
function renderAll(){
  paintSoundBar();
  if(!S.me)return;
  tryConvert();oldOrdersBanner();
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
  /* il telefono si registra con il codice del link/QR; le regole del database lasciano entrare solo chi ce l'ha */
  {const k=hashParams.get("k");if(k)lsSet("acc",k);
   const key=accKey(),me=firebase.auth().currentUser;
   if(key&&me){try{await Promise.race([firebase.database().ref("accessi/"+me.uid).set(key),sleep(5000)])}
     catch(e){if(isDenied(e)){lsSet("acc",null);S.noAccess=true;setConn("err","Non autorizzato");renderGate();return}}}}
  const j=hashParams.get("j");if(j)S.joinCode=j.toUpperCase();
  if(j||hashParams.get("cfg")||hashParams.get("c")||hashParams.get("k"))history.replaceState(null,"",baseUrl());
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
  },e=>{if(isDenied(e)){S.noAccess=true;setConn("err","Non autorizzato");renderGate();return}showBanner(errText(e))});
  R("config/file").on("value",s=>{const v=s.val();S.file=(Array.isArray(v)?v:Object.values(v||{})).filter(Boolean);if(S.role==="persone")renderUsers();if(!S.me&&S.joinCode)renderJoin();schedule()});
  R("config/iscrizione").on("value",s=>{S.invite=s.val()||null;S.inviteLoaded=true;if(!S.me&&!S.joinCode&&lsGet("joinmode")==="1"&&S.invite)S.joinCode=S.invite;if(S.usersLoaded&&!S.me)renderGate()});
  R("config/ingressiChiusi").on("value",s=>{S.ingressiChiusi=!!s.val();if(!S.me&&S.joinCode)renderJoin();if(S.role==="persone")renderJoinState()});
  /* listino v36 in config/listino; la prima volta nasce da quello della v35 (config/menu, che non si tocca) */
  let v35=undefined,lst=undefined;
  const onListino=()=>{if(v35===undefined||lst===undefined)return;
    if(lst==null){S.listinoConv=convertV35(v35);applyListino(S.listinoConv);tryConvert()}else{S.listinoConv=null;applyListino(lst)}
    $("who-t").textContent=whoLbl();
    renderSteppers();if(S.imp)renderImport();if(S.role==="listino")renderListino();if(S.role==="cucina"||S.role==="bar")renderStockEditor();schedule()};
  R("config/menu").on("value",s=>{v35=s.val()||{};onListino()});
  R("config/listino").on("value",s=>{lst=s.val();onListino()});
  R("config/scorte").on("value",s=>{S.scorte=s.val()||{};renderSteppers();schedule()});
  R("config/cassa/postazioni").on("value",s=>{S.post=s.val()||{};schedule()});
  listenMap("offerte",S.offMap);
  listenMap("log",S.logMap);
  listenMap("ordini",S.ordMap,()=>{S.ordLoaded=true;S.seenCalls=null;S.seenReady=null;checkEvents()});
  R("ordini").on("child_removed",s=>{if(!S.resetting&&S.ordLoaded)S.removedQ.push({...s.val(),id:s.key});schedule()});
  listenMap("annullati",S.annMap);
  listenMap("prenotazioni",S.prenMap);
}
/* sblocco a mano: link incollato o codice scritto */
$("na-go").addEventListener("click",()=>{const v=$("na-code").value.trim(),m=/[#&?]k=([A-Za-z0-9]+)/.exec(v),k=(m?m[1]:v).toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(k.length<20){$("na-msg").textContent="Codice non valido: incolla il link intero che ti hanno dato.";return}
  lsSet("acc",k);location.reload()});
$("na-code").addEventListener("keydown",e=>{if(e.key==="Enter")$("na-go").click()});
start();
if("serviceWorker" in navigator&&location.protocol==="https:"){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
