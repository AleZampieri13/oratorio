/* Camerieri: clienti, chiamate, consegne */
/* ---------- CAMERIERI ---------- */
const DEFAULT_FILE=[{id:"f1",nome:"Fila 1"},{id:"f2",nome:"Fila 2"},{id:"f3",nome:"Fila 3"},{id:"f4",nome:"Fila 4"}];
function fileList(){return S.file&&S.file.length?S.file:DEFAULT_FILE}
function filaNome(id){const f=fileList().find(x=>x.id===id);return f?f.nome:""}
function myFila(){if(!S.me)return "";const u=S.users.find(x=>x.id===S.me.id);const f=(u&&u.fila)||"";return fileList().some(x=>x.id===f)?f:""}
function filaWaiters(id){return S.users.filter(u=>(u.ruolo==="cameriere"||hasRole(u,"capo"))&&u.fila===id)}
function placeTxt(o){return [o.dove||"",o.tavolo?"tavolo "+o.tavolo:""].filter(Boolean).join(" · ")}
function server(o){const c=orderCourses(o).find(c=>c.p.daId);return c?c.p.daId:""}
function ownerId(o){return (o&&(o.cameriereId||server(o)))||""}
function sharedIds(o){const c=(o&&o.condivisi)||{};return Object.keys(c).filter(k=>c[k])}
function mineOrder(o){if(!S.me||!o)return false;const id=ownerId(o);
  if(id)return id===S.me.id||sharedIds(o).includes(S.me.id);
  if(o.fila){const mf=myFila();return !!mf&&o.fila===mf}return false}
const isMine=x=>mineOrder(x.o);
const capoLike=()=>!!S.me&&(hasRole(S.me,"master")||hasRole(S.me,"capo"));
const seesAll=()=>capoLike()&&S.wFilter==="tutte";
function canAct(o){if(!S.me)return false;if(capoLike())return true;const id=ownerId(o);
  if(!id)return !o.fila||o.fila===myFila();return mineOrder(o)}
function whereTxt(o){return o.asporto&&!o.fila?"asporto n. "+o.numero:`n. ${o.numero}${o.nome?" "+o.nome:""}`}
function since(t){const a=ago(t);return a==="adesso"?"adesso":"da "+a}
function nextCourse(o){return orderCourses(o).find(c=>(c.p.stato||"attesa")==="attesa")}
function orderDone(o){const cs=orderCourses(o);/* v36: anche i piatti del bar sono «portate» */return (cs.length>0||!!o.bar)&&cs.every(c=>c.p.stato==="servita")&&(!o.bar||o.bar.stato==="servita")}
function flatCourses(stato){
  const out=[];ordersArr().forEach(o=>orderCourses(o).forEach(c=>{if(c.p.stato===stato)out.push({o,k:c.k,l:c.l,t:c.p.t||0,daId:c.p.daId||"",da:nameOf(c.p.daId,c.p.da)})}));
  return out.sort((a,b)=>a.t-b.t);
}
function barItems(stato,incAsp){return ordersArr().filter(o=>o.bar&&(o.bar.stato||"attesa")===stato&&(incAsp||!o.asportoSubito)).map(o=>({o,k:"bar",l:"Bevande",t:o.bar.t||0,daId:ownerId(o),da:nameOf(ownerId(o),o.cameriere),bar:true})).sort((a,b)=>a.t-b.t)}
function claimUpd(o){const upd={};if(!ownerId(o)&&S.me){upd.cameriereId=S.me.id;upd.cameriere=S.me.nome;upd.fila=myFila()||null}return upd}

/* aggiungi un cliente: anteprima e conferma */
function previewOrder(){
  const n=parseInt($("w-num").value,10),o=orderByNum(n),box=$("w-prev"),m=$("w-msg");
  box.hidden=true;S.prevNum=null;m.textContent="";
  if(!(n>0))return;
  if(!o){m.textContent=`Il ${n} non esiste.`;return}
  if(o.asportoSubito){m.textContent=`Il ${n} è un asporto.`;return}
  if(mineOrder(o)){m.className="msg ok";m.textContent=`Il ${n} è già tra i tuoi clienti.`;$("w-num").value="";flashCard(n);return}
  m.className="msg err";
  if(!canAct(o)){const ws=ownerId(o)?nameOf(ownerId(o),o.cameriere):filaWaiters(o.fila).map(u=>u.nome).join(", ");m.textContent=`Il ${n} è di ${ws||"un altro cameriere"}.`;return}
  S.prevNum=n;box.hidden=false;
  box.innerHTML=`<div class="prevcard"><span class="tav"><small>n.</small>${o.numero}</span><span class="tmid"><b>${esc(o.nome||"Senza nome")}</b>
    <span class="sub">${cop(righe(o))} coperti</span>${o.note?`<span class="note">${esc(o.note)}</span>`:""}</span></div>
    <div class="row"><button class="btn primary big" id="w-add" style="flex:1">Aggiungi</button><button class="btn" id="w-prev-x">No</button></div>`;
}
$("w-open").addEventListener("click",previewOrder);
$("w-num").addEventListener("keydown",e=>{if(e.key==="Enter")previewOrder()});
$("w-num").addEventListener("input",()=>{$("w-msg").textContent="";$("w-prev").hidden=true;S.prevNum=null});
$("w-prev").addEventListener("click",async e=>{
  if(e.target.closest("#w-prev-x")){$("w-prev").hidden=true;S.prevNum=null;$("w-num").value="";$("w-num").focus();return}
  if(!e.target.closest("#w-add"))return;
  const n=S.prevNum,o=orderByNum(n);if(!o)return;
  const upd=claimUpd(o);
  try{if(Object.keys(upd).length)await R("ordini/"+n).update(upd);
    $("w-prev").hidden=true;S.prevNum=null;$("w-num").value="";
    toast(`${whereTxt(o)} aggiunto`,{ms:5000,action:{label:"Annulla",fn:()=>{R("ordini/"+n).update({fila:null,cameriereId:null,cameriere:null,condivisi:null}).catch(()=>{})}}});
    setTimeout(()=>flashCard(n),100)}
  catch(err){$("w-msg").textContent=errText(err)}
});
function flashCard(n){const el=document.querySelector(`#w-tables [data-card="${n}"]`);if(!el)return;el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash")}

/* cambio di stato */
async function transStato(path,expect,fields){
  const r=await R(path).transaction(cur=>{if(cur==null)return cur;if((cur.stato||"attesa")!==expect)return;
    const nx={...cur};Object.entries(fields).forEach(([a,v])=>{if(v==null)delete nx[a];else nx[a]=v});return nx});
  return !!(r&&r.committed&&r.snapshot&&r.snapshot.val()!=null)}
async function setStato(n,k,to,opts){
  const key=n+"|"+k;if(S.pending.has(key))return;
  const o=orderByNum(n);
  if(o&&S.role==="camerieri"&&!canAct(o))return;
  S.pending.add(key);schedule();
  const now=Date.now(),upd={},prev=k==="bar"?(o&&o.bar&&o.bar.stato)||"attesa":(o&&o.portate&&o.portate[k]&&o.portate[k].stato)||"attesa";
  const tt=(opts&&opts.t)||now,sil=!!(opts&&opts.silent),f={stato:to,t:tt};
  const node=k==="bar"?(o&&o.bar):(o&&o.portate&&o.portate[k]);
  if(to==="pronta"&&!sil){f.tc=(node&&node.t)||null;f.annull=null}
  if(to==="servita"&&!sil&&prev==="pronta")f.tp=(node&&node.t)||null;
  if(to==="chiamata"&&!sil&&k!=="bar"){f.da=myName();f.daId=S.me?S.me.id:"";f.annull=null;f.rep=repSnap(k)}
  if(to==="attesa"&&k!=="bar")f.rep=null;
  const path=k==="bar"?`ordini/${n}/bar`:`ordini/${n}/portate/${k}`,expect=(opts&&opts.expect)||prev;
  try{
    const ok=await transStato(path,expect,f);
    if(!ok){const msg="Qualcun altro l'ha appena aggiornato: guarda lo stato attuale.";if(S.role==="camerieri")$("w-msg").textContent=msg;else toast(msg,{ms:4000});return}
    if(o&&S.role==="camerieri"&&to!=="attesa"){const cu=claimUpd(o);if(Object.keys(cu).length)await R("ordini/"+n).update(cu)}
    if((S.role==="camerieri"||S.role==="bar"||S.role==="cucina"||S.role==="uscita")&&o&&!sil&&!(opts&&opts.notoast))afterAction(o,k,to,prev);
    return true}
  catch(e){if(S.role==="camerieri")$("w-msg").textContent=errText(e);else showBanner(errText(e))}
  finally{S.pending.delete(key);schedule()}
}
function afterAction(o,k,to,prev){
  const c=k==="bar"?"Bevande":((orderCourses(o).find(x=>x.k===k)||{}).l||k);
  const prevT=k==="bar"?(o.bar&&o.bar.t):(o.portate&&o.portate[k]&&o.portate[k].t);
  const undo={label:"Annulla",fn:()=>{const x=orderByNum(o.numero);const cur=k==="bar"?(x&&x.bar&&x.bar.stato):(x&&x.portate&&x.portate[k]&&x.portate[k].stato);if(cur===to)setStato(o.numero,k,prev,{silent:true,t:prevT,expect:to})}};
  if(S.role==="bar"&&k==="bar"){toast(`${barWho(o)} · bevande ${to==="servita"?"consegnate":"pronte"}`,{ms:5000,action:undo});return}
  if(S.role==="uscita"){toast(`n. ${o.numero} · ${c} consegnato a ${kWho(o,o.portate&&o.portate[k])}`,{ms:5000,action:undo});return}
  if(S.role==="cucina"||S.role==="bar"){const pp=o.portate&&o.portate[k];const wn=kWho(o,pp);
    toast(`${wn} · ${c} ${to==="servita"?"portato":"pronta"}`,{ms:5000,action:undo});return}
  const pl=k==="bar";
  if(to==="chiamata")toast(`${c} ${pl?"chiamate":"chiamato"} · ${whereTxt(o)}`,{ms:5000,action:undo});
  else if(to==="servita")toast(`${c} ${pl?"portate":"portato"} · ${whereTxt(o)}`,{ms:5000,action:undo});
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-set]");if(b&&!b.disabled){const [n,k,to]=b.dataset.set.split("|");setStato(Number(n),k,to)}
});
$("w-filter").addEventListener("click",e=>{const b=e.target.closest("button[data-f]");if(!b)return;S.wFilter=b.dataset.f;renderWaiterLists()});

/* scheda cliente: in cima i piatti pronti da portare, sotto i reparti come linguette.
   Nel reparto aperto ogni piatto si chiama da solo, oppure «Chiama tutto». */
function repOfC(o,c){return courseReps(o,c.k)[0]||""}
/* linguette nell'ordine dei piatti del listino (↑↓): il reparto del primo piatto viene per primo */
function wReps(o){const rs=[];orderCourses(o).forEach(c=>{const r=repOfC(o,c);if(!rs.includes(r))rs.push(r)});return rs}
const isTodo=c=>(c.p.stato||"attesa")==="attesa";
function cardAction(o){
  const cs=orderCourses(o),n=o.numero,act=canAct(o),dis=k=>S.pending.has(n+"|"+k)||!act?"disabled":"";
  const out=[];
  if(o.bar&&o.bar.stato==="pronta")out.push(`<button class="btn go big" ${dis("bar")} data-set="${n}|bar|servita">Porta le bevande</button>`);
  const ready=cs.filter(c=>c.p.stato==="pronta");
  ready.forEach(c=>{const q=cop(righeFor(o,c.k));out.push(`<button class="btn go big" ${dis(c.k)} data-set="${n}|${c.k}|servita">Porta ${q} ${esc(c.l)}</button>`)});
  if(ready.length>1&&act)out.push(`<button class="btn go" data-carryall="${n}">Portati tutti i pronti (${ready.length})</button>`);
  const left=cs.filter(isTodo).length;
  if(!cs.length)return out.join("")||`<div class="wait big ok">Finito</div>`;
  if(cs.every(c=>c.p.stato==="servita")&&!out.length)out.push(`<div class="wait big ok">Finito</div>`);
  if(left)out.push(`<div class="sub">Da chiamare: <b>${left}</b> ${left===1?"piatto":"piatti"}</div>`);
  const reps=wReps(o);
  let cur=S.wTab[n];if(!reps.includes(cur))cur=reps.find(r=>cs.some(c=>repOfC(o,c)===r&&isTodo(c)))||reps[0];
  const tabs=reps.length>1?`<div class="rtabs" role="tablist">${reps.map(r=>{const rc=cs.filter(c=>repOfC(o,c)===r),todo=rc.some(isTodo),ok=rc.every(c=>c.p.stato==="servita");
      return `<button role="tab" data-wtab="${n}|${esc(r)}" aria-pressed="${r===cur}">${esc(repNome(r)||"Altro")}${todo?'<span class="rdot" aria-label="da chiamare"></span>':ok?" ✓":""}</button>`}).join("")}</div>`:"";
  const mine=cs.filter(c=>repOfC(o,c)===cur),todo=mine.filter(isTodo);
  const rows=mine.map(c=>{const st=c.p.stato||"attesa",q=cop(righeFor(o,c.k));let right="";
    if(st==="attesa")right=act?`<button class="btn primary" ${dis(c.k)} data-set="${n}|${c.k}|chiamata">Chiama</button>`:'<span class="pill wait">da chiamare</span>';
    else if(st==="chiamata"){const late=c.p.t&&Date.now()-c.p.t>15*60000;right=`<span class="pill ${late?"out":"call"}">in preparazione · ${ago(c.p.t)}</span>${act?`<button class="btn small" ${dis(c.k)} data-uncall="${n}|${c.k}">Annulla</button>`:""}`}
    else if(st==="pronta")right='<span class="pill ready">pronto</span>';
    else right='<span class="pill wait">portato ✓</span>';
    return `<div class="wpiatto ${st}"><span class="wpn"><b>${q}</b> ${esc(c.l)}</span><span class="row">${right}</span></div>`}).join("");
  const all=todo.length>1&&act?`<button class="btn primary big" data-callall="${n}|${esc(cur)}">Chiama tutto ${esc(repNome(cur))} (${todo.length})</button>`:"";
  out.push(`<div class="wrep">${tabs}<div class="wrows">${rows}</div>${all}</div>`);
  if(o.bar&&o.bar.stato==="chiamata")out.push(`<div class="wait big">Bevande al bar · ${ago(o.bar.t)}</div>`);
  if(o.bar&&(o.bar.stato||"attesa")==="attesa")out.push(`<button class="btn" ${dis("bar")} data-set="${n}|bar|chiamata">Chiama bevande</button>`);
  return out.join("");
}
/* più piatti insieme: uno dopo l'altro, con un solo avviso alla fine */
async function setMany(n,ks,to){const done=[];for(const k of ks){if(await setStato(n,k,to,{notoast:true}))done.push(k)}return done}
function waitersList(){return S.users.filter(u=>u.ruolo==="cameriere"||hasRole(u,"capo"))}
function custCard(o){
  const cs=orderCourses(o),own=ownerId(o),sh=sharedIds(o);
  const names=[own?nameOf(own,o.cameriere):"",...sh.filter(id=>id!==own).map(id=>nameOf(id))].filter(Boolean);
  const who=seesAll()?[names.join(" + "),o.fila?filaNome(o.fila):""].filter(Boolean).join(" · "):sh.length?names.filter(n=>n!==myName()).map(n=>"con "+n).join(", "):"";
  const canShare=own&&(mineOrder(o)||capoLike()),canMove=own&&seesAll();
  const pk=S.pick&&S.pick.n===o.numero?S.pick.mode:null;
  let pick="";
  if(pk){const mf=o.fila||myFila();
    const ws=waitersList().filter(u=>u.id!==own&&(pk==="move"||!S.me||u.id!==S.me.id||capoLike()))
      .sort((a,b)=>((b.fila===mf)-(a.fila===mf))||a.nome.localeCompare(b.nome));
    pick=`<div class="wpick"><span class="label">${pk==="share"?"Condividi con":"Sposta a"}</span><div class="grp">${ws.map(u=>`<button data-pk="${esc(u.id)}" aria-pressed="${pk==="share"&&sh.includes(u.id)}">${esc(u.nome)}${u.fila&&u.fila!==mf?` <small>${esc(filaNome(u.fila))}</small>`:""}</button>`).join("")||'<span class="sub">Nessun altro cameriere.</span>'}</div>
      <button class="btn small" data-pkclose="1">Chiudi</button></div>`}
  return `<div class="ccard" data-card="${o.numero}"><div class="chead"><span class="tav"><small>n.</small>${o.numero}</span>
    <span class="tmid"><b class="cname">${esc(o.nome||"Senza nome")}</b><span class="sub">${cop(righe(o))} coperti${extras(o).length?" · "+extras(o).map(x=>x.qta+" "+esc(x.nome)).join(", "):""}${who?" · "+esc(who):""}</span></span>
    ${canShare||canMove?`<span class="cmore">${canShare?`<button class="btn small" data-share="${o.numero}">Condividi</button>`:""}${canMove?`<button class="btn small" data-move="${o.numero}">Sposta</button>`:""}</span>`:""}</div>
    ${pick}
    ${o.note?`<div class="note">${esc(o.note)}</div>`:""}
    <div class="cact">${cardAction(o)}</div></div>`;
}
$("w-tables").addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.wtab){const [n,r]=t.dataset.wtab.split("|");S.wTab[n]=r;renderWaiterLists();return}
  if(t.dataset.callall){const [n,r]=t.dataset.callall.split("|"),o=orderByNum(Number(n));if(!o||!canAct(o))return;
    const ks=orderCourses(o).filter(c=>repOfC(o,c)===r&&isTodo(c)).map(c=>c.k);t.disabled=true;
    const done=await setMany(Number(n),ks,"chiamata");
    if(done.length){const x=orderByNum(Number(n))||o;toast(`${repNome(r)}: chiamati ${done.length} piatti · ${whereTxt(x)}`,{ms:5000,action:{label:"Annulla",fn:()=>{done.forEach(k=>{const y=orderByNum(Number(n));if(y&&y.portate&&y.portate[k]&&y.portate[k].stato==="chiamata")setStato(Number(n),k,"attesa",{silent:true})})}}})}
    return}
  if(t.dataset.carryall){const n=Number(t.dataset.carryall),o=orderByNum(n);if(!o||!canAct(o))return;t.disabled=true;
    const done=await setMany(n,orderCourses(o).filter(c=>c.p.stato==="pronta").map(c=>c.k),"servita");
    if(done.length)toast(`${done.length} piatti portati · ${whereTxt(o)}`,{ms:4000});return}
  if(t.dataset.uncall){if(!armed(t,"Annullo?"))return;const [n,k]=t.dataset.uncall.split("|");const o=orderByNum(Number(n));
    if(!o||!o.portate||!o.portate[k]||o.portate[k].stato!=="chiamata"){renderWaiterLists();return}
    await setStato(Number(n),k,"attesa",{silent:true});const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;toast(`${c} non più chiamato · ${whereTxt(o)}`,{ms:4000});return}
  if(t.dataset.share||t.dataset.move){const n=Number(t.dataset.share||t.dataset.move),mode=t.dataset.share?"share":"move";
    S.pick=S.pick&&S.pick.n===n&&S.pick.mode===mode?null:{n,mode};renderWaiterLists();return}
  if(t.dataset.pkclose){S.pick=null;renderWaiterLists();return}
  if(t.dataset.pk&&S.pick){const {n,mode}=S.pick,o=orderByNum(n),u=S.users.find(x=>x.id===t.dataset.pk);if(!o||!u)return;
    try{
      if(mode==="share"){const on=!sharedIds(o).includes(u.id);await R(`ordini/${n}/condivisi/${u.id}`).set(on?true:null);
        toast(on?`n. ${n} condiviso con ${u.nome}`:`${u.nome} tolto dal n. ${n}`,{ms:4000})}
      else{await R("ordini/"+n).update({cameriereId:u.id,cameriere:u.nome,fila:u.fila||null,["condivisi/"+u.id]:null});
        S.pick=null;toast(`n. ${n} spostato a ${u.nome}`,{ms:4000})}
    }catch(err){$("w-msg").textContent=errText(err)}
    renderWaiterLists()}
});
function renderWaiterLists(){
  const mf=myFila(),cam=S.me&&S.me.ruolo==="cameriere";
  $("w-filter").hidden=!capoLike();
  $("w-filter").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.f===S.wFilter)));
  $("w-sound").hidden=!!cam;
  $("w-tt").textContent=seesAll()?"Tutti i clienti":"I miei clienti";
  $("w-tt-sub").textContent="";
  $("w-nofila").hidden=true;
  const hasReady=o=>orderCourses(o).some(c=>c.p.stato==="pronta")||(o.bar&&o.bar.stato==="pronta");
  const recent=o=>{const ts=[...orderCourses(o).map(c=>c.p.t||0),o.bar?o.bar.t||0:0];return Math.max(...ts)};
  const list=ordersArr().filter(o=>!o.asportoSubito&&(seesAll()?(ownerId(o)||o.fila):mineOrder(o)))
    .filter(o=>!orderDone(o)||Date.now()-recent(o)<20000)
    .sort((a,b)=>(orderDone(a)-orderDone(b))||(hasReady(b)-hasReady(a))||a.numero-b.numero);
  $("w-tables").innerHTML=list.length?list.map(custCard).join("")
    :`<div class="empty">${seesAll()?"Nessun cliente servito per ora.":"Nessun cliente."}</div>`;
}
/* compatibilità con il resto dell'app */
function renderDetail(){}
function readyItems(){return [...flatCourses("pronta"),...barItems("pronta")].filter(x=>!x.o.asportoSubito&&(seesAll()||mineOrder(x.o)))}

