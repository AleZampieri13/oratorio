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
/* ordini uniti dal cameriere (es. due famiglie allo stesso tavolo): o.unito = numero del gruppo.
   In cassa restano ordini separati; cameriere, cucina, bar e uscita vedono una scheda sola con i piatti sommati. */
function unitiOf(o){if(!o||!o.unito)return [o];const g=ordersArr().filter(x=>x.unito===o.unito&&!x.asportoSubito).sort((a,b)=>a.numero-b.numero);
  return g.length>1&&g.some(x=>x.numero===o.numero)?g:[o]}
function gKey(o){return unitiOf(o).length>1?"g"+o.unito:"n"+o.numero}
const gNums=G=>G.map(o=>o.numero).join(" + ");
const gNome=G=>G.map(o=>o.nome).filter(Boolean).join(" + ");
/* più pezzi dello stesso piatto (uno per ordine): «12>pizz,13>pizz» nei tasti */
const itsAttr=its=>its.map(x=>x.o.numero+">"+x.k).join(",");
const parseIts=s=>String(s).split(",").filter(Boolean).map(x=>{const i=x.indexOf(">");return [Number(x.slice(0,i)),x.slice(i+1)]});
const itsQ=its=>its.reduce((a,x)=>a+cop(righeFor(x.o,x.k)),0);
/* scelte sommate (es. 2 Naturale del 12 + 1 Naturale del 13 = 3 Naturale) */
/* piatti sommati: si può chiamare / segnare pronta solo una parte («3 / 6»); S.gNow[chiave]={q,x} */
function gNowOf(key,q){const st=(S.gNow||{})[key];return st&&st.q===q?Math.max(1,Math.min(q,st.x)):q}
function scMerge(ps){const m=new Map();ps.forEach(p=>toArr(p&&p.sc).forEach(x=>{if(x&&x.q>0)m.set(x.n,(m.get(x.n)||0)+x.q)}));return {sc:[...m].map(([n,q])=>({n,q}))}}
function since(t){const a=ago(t);return a==="adesso"?"adesso":"da "+a}
function nextCourse(o){return orderCourses(o).find(c=>(c.p.stato||"attesa")==="attesa")}
function orderDone(o){const cs=orderCourses(o);return cs.length>0&&cs.every(c=>c.p.stato==="servita")}
function flatCourses(stato){
  const out=[];ordersArr().forEach(o=>orderCourses(o).forEach(c=>{if(c.p.stato===stato)out.push({o,k:c.k,l:c.l,t:c.p.t||0,daId:c.p.daId||"",da:nameOf(c.p.daId,c.p.da)})}));
  return out.sort((a,b)=>a.t-b.t);
}
function claimUpd(o){const upd={};if(!ownerId(o)&&S.me){upd.cameriereId=S.me.id;upd.cameriere=S.me.nome;upd.fila=myFila()||null;upd.presoT=Date.now()}return upd}
/* quando il cameriere ha preso il cliente (per gli ordini vecchi senza quest'ora: quando è stato creato) */
const presoT=o=>o.presoT||o.creato||0;

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
    <span class="sub">${copOf(o)} coperti</span>${o.note?`<span class="note">${esc(o.note)}</span>`:""}</span></div>
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
    toast(`${whereTxt(o)} aggiunto`,{ms:5000,action:{label:"Annulla",fn:()=>{R("ordini/"+n).update({fila:null,cameriereId:null,cameriere:null,condivisi:null,presoT:null}).catch(()=>{})}}});
    setTimeout(()=>flashCard(n),100)}
  catch(err){$("w-msg").textContent=errText(err)}
});
function flashCard(n){const el=document.querySelector(`#w-tables [data-cards~="${n}"]`);if(!el)return;el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash")}

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
  const now=Date.now(),upd={},prev=(o&&o.portate&&o.portate[k]&&o.portate[k].stato)||"attesa";
  const tt=(opts&&opts.t)||now,sil=!!(opts&&opts.silent),f={stato:to,t:tt};
  const node=o&&o.portate&&o.portate[k];
  if(to==="pronta"&&!sil){f.tc=(node&&node.t)||null;f.annull=null}
  if(to==="servita"&&!sil&&prev==="pronta")f.tp=(node&&node.t)||null;
  if(to==="chiamata"&&!sil){f.da=myName();f.daId=S.me?S.me.id:"";f.annull=null;f.rep=repSnap(k);f.sc=o?wScFor(o,k):null}
  if(to==="attesa"){f.rep=null;f.sc=null}
  const path=`ordini/${n}/portate/${k}`,expect=(opts&&opts.expect)||prev;
  try{
    const ok=await transStato(path,expect,f);
    if(!ok){const msg="Qualcun altro l'ha appena aggiornato: guarda lo stato attuale.";if(S.role==="camerieri")$("w-msg").textContent=msg;else toast(msg,{ms:4000});return}
    if(o&&S.role==="camerieri"&&to!=="attesa"){const cu=claimUpd(o);if(Object.keys(cu).length)await R("ordini/"+n).update(cu)}
    if(to==="chiamata"&&!sil&&await mergeCalled(n,k))return true;
    if((S.role==="camerieri"||S.role==="bar"||S.role==="cucina"||S.role==="uscita")&&o&&!sil&&!(opts&&opts.notoast))afterAction(o,k,to,prev);
    return true}
  catch(e){if(S.role==="camerieri")$("w-msg").textContent=errText(e);else showBanner(errText(e))}
  finally{S.pending.delete(key);schedule()}
}
/* lo stesso piatto chiamato di nuovo mentre la chiamata di prima è ancora da preparare: diventano una riga sola */
async function mergeCalled(n,k,quiet){const o=orderByNum(n),p=o&&o.portate&&o.portate[k];if(!p||p.stato!=="chiamata"||kRound(k)<2)return false;const b=kBase(k);
  const fresh=x=>{const q=o.portate[x];return q&&q.stato==="chiamata"&&Object.values(q.rep||{}).every(v=>!v||v.s==="chiamata")};
  const t=[b,...Object.keys(o.portate).filter(x=>kBase(x)===b&&x!==b).sort((x,y)=>kRound(x)-kRound(y))].find(x=>x!==k&&fresh(x));if(!t||!fresh(k))return false;
  const D=o.dopo||{},upd={["portate/"+k]:null,["dopo/"+k]:null};if(kRound(t)>1)upd["dopo/"+t]=(D[t]||0)+(D[k]||0);
  const s1=toArr(o.portate[t].sc).filter(Boolean),s2=toArr(p.sc).filter(Boolean);
  if(s1.length||s2.length){const m=new Map();[...s1,...s2].forEach(s=>m.set(s.n,(m.get(s.n)||0)+(s.q||0)));upd["portate/"+t+"/sc"]=[...m].map(([nn,q])=>({n:nn,q}))}
  try{await R("ordini/"+n).update(upd);const c=(orderCourses(o).find(x=>x.k===t)||{}).l||"";if(!quiet)toast(`${c} chiamato · aggiunto a quello già in preparazione · ${whereTxt(o)}`,{ms:5000});return true}
  catch(e){return false}}
/* un piatto torna «da preparare» (Annulla dopo Pronto): se c'è un'altra riga uguale ancora da preparare si uniscono.
   Lo fa solo il telefono che ha toccato «Annulla», così due telefoni non uniscono le stesse righe insieme. */
async function mergeSame(n,k){await sleep(150);const o=orderByNum(n);if(!o||!o.portate)return;const b=kBase(k);
  const fresh=x=>{const q=o.portate[x];return q&&q.stato==="chiamata"&&Object.values(q.rep||{}).every(v=>!v||v.s==="chiamata")};
  const fr=Object.keys(o.portate).filter(x=>kBase(x)===b&&fresh(x)).sort((x,y)=>kRound(x)-kRound(y));
  for(const x of fr.slice(1))if(kRound(x)>=2)await mergeCalled(n,x,true)}
function afterAction(o,k,to,prev){
  const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;
  const prevT=o.portate&&o.portate[k]&&o.portate[k].t;
  const undo={label:"Annulla",fn:()=>{const x=orderByNum(o.numero);const cur=x&&x.portate&&x.portate[k]&&x.portate[k].stato;if(cur===to)setStato(o.numero,k,prev,{silent:true,t:prevT,expect:to}).then(()=>{if(prev==="chiamata")mergeSame(o.numero,k)})}};
  if(S.role==="uscita"){toast(to==="pronta"?`${kWho(o,o.portate&&o.portate[k])} · ${c} pronto`:`n. ${o.numero} · ${c} consegnato a ${kWho(o,o.portate&&o.portate[k])}`,{ms:5000,action:undo});return}
  if(S.role==="cucina"||S.role==="bar"){const pp=o.portate&&o.portate[k];const wn=kWho(o,pp);
    toast(`${wn} · ${c} ${to==="servita"?"portato":"pronta"}`,{ms:5000,action:undo});return}
  if(to==="chiamata")toast(`${c} chiamato · ${whereTxt(o)}`,{ms:5000,action:undo});
  else if(to==="servita")toast(`${c} portato · ${whereTxt(o)}`,{ms:10000,action:{label:"Annulla",fn:()=>unserve(o.numero,k)}});
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-set]");if(b&&!b.disabled){const [n,k,to]=b.dataset.set.split("|");setStato(Number(n),k,to)}
});
/* lo stesso piatto di più ordini uniti: chiamato / portato / consegnato tutto insieme, un solo avviso */
async function setStatoM(its,to){if(its.length===1)return setStato(its[0][0],its[0][1],to);
  const prev=its.map(([n,k])=>stOf(orderByNum(n)||{},k)),done=[];
  for(const [n,k] of its){const o=orderByNum(n);if(o&&stOf(o,k)!==to&&await setStato(n,k,to,{notoast:true}))done.push([n,k])}
  if(!done.length)return;const o=orderByNum(done[0][0]),l=piattoNome(done[0][1]),q=done.reduce((a,[n,k])=>a+cop(righeFor(orderByNum(n)||{},k)),0),nn=done.map(x=>x[0]).join(" + ");
  const undo={label:"Annulla",fn:()=>done.forEach(([n,k])=>{const i=its.findIndex(x=>x[0]===n&&x[1]===k),y=orderByNum(n);if(y&&stOf(y,k)===to){if(to==="servita")unserve(n,k);else setStato(n,k,prev[i],{silent:true,expect:to})}})};
  toast(`n. ${nn} · ${q} ${l} ${to==="chiamata"?"chiamati":to==="pronta"?"pronti":to==="servita"&&S.role==="uscita"?"consegnati":"portati"}`,{ms:to==="servita"?10000:5000,action:undo});return true}
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-setm]");if(!b||b.disabled)return;const i=b.dataset.setm.lastIndexOf("|");b.disabled=true;
  setStatoM(parseIts(b.dataset.setm.slice(0,i)),b.dataset.setm.slice(i+1))
});
$("w-filter").addEventListener("click",e=>{const b=e.target.closest("button[data-f]");if(!b)return;S.wFilter=b.dataset.f;renderWaiterLists()});

/* scheda cliente: in cima i piatti pronti da portare, sotto i reparti come linguette.
   Nel reparto aperto ogni piatto si chiama da solo, oppure «Chiama tutto». */
function repOfC(o,c){return courseReps(o,c.k)[0]||""}
/* linguette nell'ordine dei piatti del listino (↑↓): il reparto del primo piatto viene per primo */
function wReps(o){const rs=[];orderCourses(o).forEach(c=>{const r=repOfC(o,c);if(!rs.includes(r))rs.push(r)});return rs}
const isTodo=c=>(c.p.stato||"attesa")==="attesa";
/* scelte (es. naturale / frizzante) decise dal cameriere prima di chiamare: restano sul telefono finché chiama */
function wScFor(o,k){const s=scelteOf(k);if(!s.length)return null;const n=wNowOf(o,k),st=S.wSc[o.numero+"|"+k];
  const q=st&&st.n===n&&st.q.length===s.length?st.q:s.map((x,i)=>i?0:n);return s.map((x,i)=>({n:x,q:q[i]}))}
function wScHtml(o,c){const sc=wScFor(o,c.k);if(!sc)return "";const n=o.numero,tot=sc.reduce((a,y)=>a+y.q,0);
  return `<div class="wsc">${sc.map((x,i)=>`<span class="stepper sm"><span class="name">${esc(x.n)}</span><span class="ctl"><button type="button" data-wsc="${n}|${esc(c.k)}|${i}" data-d="-1" ${x.q?"":"disabled"} aria-label="Meno ${esc(x.n)}">−</button><output>${x.q}</output><button type="button" data-wsc="${n}|${esc(c.k)}|${i}" data-d="1" ${x.q<tot?"":"disabled"} aria-label="Più ${esc(x.n)}">+</button></span></span>`).join("")}</div>`}
function wScMove(n,k,i,d){const o=orderByNum(n);if(!o)return;const sc=wScFor(o,k);if(!sc)return;const q=sc.map(x=>x.q),tot=q.reduce((a,b)=>a+b,0);
  if(d>0){let j=-1;q.forEach((v,x)=>{if(x!==i&&v>0&&(j<0||v>q[j]))j=x});if(j<0)return;q[j]--;q[i]++}
  else{if(!q[i])return;const j=i===0?1:0;q[i]--;q[j]++}
  S.wSc[n+"|"+k]={n:tot,q}}
/* «una parte dopo»: il piatto si divide in due chiamate (es. 1 acqua adesso, 1 dopo) */
function canMerge(o,k){if(kRound(k)<2||stOf(o,k)!=="attesa")return null;const b=kBase(k);
  return [b,...Object.keys(o.portate||{}).filter(x=>x!==k&&x!==b&&kBase(x)===b).sort((x,y)=>kRound(x)-kRound(y))].find(x=>o.portate[x]&&stOf(o,x)==="attesa")||null}
function wSplitHtml(o,c,q){const W_=S.wSplit;if(!W_||W_.n!==o.numero||W_.k!==c.k)return "";const x=Math.max(1,Math.min(q-1,W_.x||1));W_.x=x;
  return `<div class="wsplit"><span class="stepper sm"><span class="name">Adesso</span><span class="ctl"><button type="button" data-wsx="-1" ${x>1?"":"disabled"} aria-label="Uno in meno adesso">−</button><output>${x}</output><button type="button" data-wsx="1" ${x<q-1?"":"disabled"} aria-label="Uno in più adesso">+</button></span></span>
    <span class="sub">dopo: <b>${q-x}</b></span><button type="button" class="btn small primary" data-wsplitok="${o.numero}|${esc(c.k)}">Dividi</button><button type="button" class="btn small" data-wsplitno="1">Chiudi</button></div>`}
/* quante porzioni chiamare adesso: parte dal totale; se si abbassa, il resto diventa «2ª volta» */
function wNowOf(o,k){const q=cop(righeFor(o,k)),st=S.wNow[o.numero+"|"+k];return st&&st.q===q?Math.max(1,Math.min(q,st.x)):q}
function wQtyHtml(o,c,q){const x=wNowOf(o,c.k),key=`${o.numero}|${esc(c.k)}`;
  return qtyField("wqi",key,x,q,`Quante ${c.l} chiamare adesso`)}
async function splitCourse(n,k,now,opts){const o=orderByNum(n);if(!o||!o.portate||!o.portate[k]||stOf(o,k)!=="attesa"){S.wSplit=null;renderWaiterLists();return}
  const q=cop(righeFor(o,k)),later=q-now;if(!(now>=1&&later>=1))return;
  const b=kBase(k),D=o.dopo||{},used=[...Object.keys(o.portate),...Object.keys(D)].filter(x=>kBase(x)===b).map(kRound),nk=b+"~"+(Math.max(1,...used)+1),upd={};
  upd["dopo/"+nk]=later;if(k!==b)upd["dopo/"+k]=(D[k]||0)-later;
  upd["portate/"+nk]={stato:"attesa",t:0,nome:(portataCfg(b)||{}).nome||o.portate[k].nome||"",ord:o.portate[k].ord||0};
  try{await R("ordini/"+n).update(upd);S.wSplit=null;delete S.wNow[n+"|"+k];if(!(opts&&opts.silent)){const pn=(portataCfg(b)||{}).nome||"";toast(`${pn}: ${now} adesso, ${later} dopo · ${whereTxt(o)}`,{ms:5000})}return true}
  catch(e){$("w-msg").textContent=errText(e);return false}}
async function mergeCourse(n,k){const o=orderByNum(n),t=o&&canMerge(o,k);if(!t)return;const D=o.dopo||{},upd={["dopo/"+k]:null,["portate/"+k]:null};
  if(kRound(t)>1)upd["dopo/"+t]=(D[t]||0)+(D[k]||0);
  try{await R("ordini/"+n).update(upd);toast(`${(portataCfg(k)||{}).nome||""}: di nuovo insieme · ${whereTxt(o)}`,{ms:4000})}catch(e){$("w-msg").textContent=errText(e)}}
/* righe della scheda: lo stesso piatto nello stesso stato di più ordini uniti è una riga sola.
   Da chiamare conta anche la volta («2ª volta» resta a parte); chiamato, pronto e portato si sommano anche se chiamati
   in volte diverse. In cucina (sameDish) due righe dello stesso ordine restano separate, come negli ordini non uniti. */
const sameDish=(x,o,k,ord)=>x.k===k||(kBase(x.k)===kBase(k)&&!x.its.some(y=>y.o.numero===o.numero)&&ord);
function gRows(G){const rs=[];G.forEach(o=>orderCourses(o).forEach(c=>{const st=c.p.stato||"attesa";let r=rs.find(x=>x.st===st&&(x.k===c.k||(st!=="attesa"&&kBase(x.k)===kBase(c.k))));
  if(!r){r={k:c.k,l:c.l,st,ord:c.ord,its:[]};rs.push(r)}r.its.push({o,k:c.k,c})}));
  return rs.sort((a,b)=>a.ord-b.ord)}
/* scelte di una riga di più ordini: si dividono sul totale, poi alla chiamata si spartiscono tra gli ordini */
function wScForG(gk,its,k){const s=scelteOf(k);if(!s.length)return null;const n=gNowOf(gk+"|"+k,itsQ(its)),st=S.wSc[gk+"|"+k];
  const q=st&&st.n===n&&st.q.length===s.length?st.q:s.map((x,i)=>i?0:n);return s.map((x,i)=>({n:x,q:q[i]}))}
function wScHtmlG(gk,its,k){const sc=wScForG(gk,its,k);if(!sc)return "";const tot=sc.reduce((a,y)=>a+y.q,0);
  return `<div class="wsc">${sc.map((x,i)=>`<span class="stepper sm"><span class="name">${esc(x.n)}</span><span class="ctl"><button type="button" data-wscg="${gk}|${esc(k)}|${i}" data-d="-1" ${x.q?"":"disabled"} aria-label="Meno ${esc(x.n)}">−</button><output>${x.q}</output><button type="button" data-wscg="${gk}|${esc(k)}|${i}" data-d="1" ${x.q<tot?"":"disabled"} aria-label="Più ${esc(x.n)}">+</button></span></span>`).join("")}</div>`}
function scStep(q,i,d){if(d>0){let j=-1;q.forEach((v,x)=>{if(x!==i&&v>0&&(j<0||v>q[j]))j=x});if(j<0)return;q[j]--;q[i]++}else{if(!q[i])return;const j=i===0?1:0;q[i]--;q[j]++}}
function wScDist(gk,its,k,scIn){const sc=scIn||wScForG(gk,its,k);if(!sc)return;const left=sc.map(x=>x.q);
  its.forEach(x=>{delete S.wNow[x.o.numero+"|"+k];const n=cop(righeFor(x.o,k));let need=n;const q=left.map(v=>{const t=Math.min(v,need);need-=t;return t});
    q.forEach((v,i)=>{left[i]-=v});if(need>0)q[0]+=need;S.wSc[x.o.numero+"|"+k]={n,q}})}
/* chiamare una parte di un piatto sommato: gli ordini in fila (dal numero più basso), l'ultimo si divide */
async function callRowM(gk,its,k){const key=gk+"|"+k;let x=gNowOf(key,itsQ(its));const sc=wScForG(gk,its,k),go=[];
  for(const it of its.slice().sort((a,b)=>a.o.numero-b.o.numero)){if(x<=0)break;const n=it.o.numero,m=cop(righeFor(it.o,k));
    if(x<m&&!(await splitCourse(n,k,x,{silent:true})))break;go.push(n);x-=Math.min(x,m)}
  if(S.gNow)delete S.gNow[key];const cur=go.map(n=>({o:orderByNum(n),k})).filter(y=>y.o);wScDist(gk,cur,k,sc);return cur.map(y=>[y.o.numero,k])}
function cardAction(G){
  const o=G[0],gk=gKey(o),multi=G.length>1,act=G.every(canAct),rws=gRows(G),cs=rws.flatMap(r=>r.its.map(x=>x.c));
  const dis=its=>its.some(x=>S.pending.has(x.o.numero+"|"+x.k))||!act?"disabled":"";
  const out=[];
  const ready=rws.filter(r=>r.st==="pronta");
  ready.forEach(r=>{const sx=scTxt(scMerge(r.its.map(x=>x.c.p)));out.push(`<button class="btn go big" ${dis(r.its)} ${r.its.length>1?`data-setm="${esc(itsAttr(r.its))}|servita"`:`data-set="${r.its[0].o.numero}|${r.k}|servita"`}>Porta ${itsQ(r.its)} ${esc(r.l)}${sx?` <small>(${esc(sx)})</small>`:""}</button>`)});
  if(ready.length>1&&act)out.push(`<button class="btn go" data-carryall="${G.map(x=>x.numero).join(",")}">Portati tutti i pronti (${ready.length})</button>`);
  const left=cs.filter(isTodo).length;
  if(!cs.length)return out.join("")||`<div class="wait big ok">Finito</div>`;
  if(cs.every(c=>c.p.stato==="servita")&&!out.length)out.push(`<div class="wait big ok">Finito</div>`);
  if(left)out.push(`<div class="sub wleft">Da chiamare: ${[...new Map(cs.filter(isTodo).map(c=>[kBase(c.k),c])).values()].map(c=>`<b style="color:${portColor(c.k)}">${esc(c.l)}</b>`).join(", ")}</div>`);
  const rOf=r=>repOfC(r.its[0].o,r.its[0].c),reps=[];rws.forEach(r=>{const x=rOf(r);if(!reps.includes(x))reps.push(x)});
  let cur=S.wTab[gk];if(!reps.includes(cur))cur=reps.find(x=>rws.some(r=>rOf(r)===x&&r.st==="attesa"))||reps[0];
  const tabs=reps.length>1?`<div class="rtabs" role="tablist">${reps.map(r=>{const rc=rws.filter(x=>rOf(x)===r),todo=rc.some(x=>x.st==="attesa"),ok=rc.every(x=>x.st==="servita");
      const col=repColor(r),sel=r===cur,sty=ok?"":sel?`background:${col};border-color:${col};color:#fff`:`border-left-color:${col}`;
      return `<button role="tab" class="${ok?"rdone":""}" data-wtab="${gk}|${esc(r)}" aria-pressed="${sel}" style="${sty}">${esc(repNome(r)||"Altro")}${todo?'<span class="rdot" aria-label="da chiamare"></span>':ok?" ✓":""}</button>`}).join("")}</div>`:"";
  const mineR=rws.filter(r=>rOf(r)===cur),todoR=mineR.filter(r=>r.st==="attesa");
  const rows=mineR.map(r=>r.its.length>1?wRowM(gk,r,act,dis(r.its)):wRow1(r.its[0].o,r.its[0].c,act)).join("");
  const todo1=todoR.filter(r=>kRound(r.k)===1);
  const all=todo1.length>1&&act?`<button class="btn primary big" data-callall="${G.map(x=>x.numero).join(",")}|${esc(cur)}">Chiama tutto ${esc(repNome(cur))} (${todo1.length})</button>`:"";
  out.push(`<div class="wrep">${tabs}<div class="wrows">${rows}</div>${all}</div>`);
  return out.join("");
}
/* riga con lo stesso piatto di più ordini uniti: numero sommato, un tasto per tutti */
function wRowM(gk,r,act,dis){const st=r.st,q=itsQ(r.its),a=esc(itsAttr(r.its));let right="";
  const part=st==="attesa"&&act&&q>=2,x=part?gNowOf(gk+"|"+r.k,q):q;
  if(st==="attesa")right=act?`<button class="btn primary wcall" ${dis} data-callm="${a}" data-gk="${gk}" data-gqk="${gk}|${esc(r.k)}" data-part="Chiama" data-full="Chiama">${x<q?"Chiama "+x:"Chiama"}</button>`:'<span class="pill wait">da chiamare</span>';
  else if(st==="chiamata"){const t=Math.min(...r.its.map(x=>x.c.p.t||Date.now())),late=isLate(r.k,t);right=`<span class="pill ${late?"out":"call"}">in preparazione · ${ago(t)}</span>${act?`<button class="btn small" ${dis} data-uncallm="${a}">Annulla</button>`:""}`}
  else if(st==="pronta")right='<span class="pill ready">pronto</span>';
  else{const t=Math.max(...r.its.map(x=>x.c.p.t||0));right=`<span class="pill wait">portato ✓</span>${act&&t&&Date.now()-t<3*60000?`<button class="btn small" ${dis} data-unservem="${a}">Non portato</button>`:""}`}
  const sx=scTxt(scMerge(r.its.map(x=>x.c.p))),scx=st==="attesa"?(act?wScHtmlG(gk,r.its,r.k):""):sx?`<div class="sub wscd">${esc(sx)}</div>`:"";
  if(part)return `<div class="wpiatto ${st} wpart"><span class="wpn">${esc(r.l)}</span><span class="wbar">${qtyField("wqg",`${gk}|${esc(r.k)}`,x,q,`Quante ${r.l} chiamare adesso`)}<span class="row">${right}</span></span>${scx}</div>`;
  return `<div class="wpiatto ${st}"><span class="wpn"><b>${q}</b> ${esc(r.l)}</span><span class="row">${right}</span>${scx}</div>`}
function wRow1(o,c,act){const n=o.numero,dis=k=>S.pending.has(n+"|"+k)||!act?"disabled":"";
  {const st=c.p.stato||"attesa",q=cop(righeFor(o,c.k));let right="";
    const part=st==="attesa"&&act&&q>=2,x=part?wNowOf(o,c.k):q;
    if(st==="attesa")right=act?(x<q?`<button class="btn primary wcall" ${dis(c.k)} data-callpart="${n}|${esc(c.k)}">Chiama ${x}</button>`:`<button class="btn primary wcall" ${dis(c.k)} data-set="${n}|${c.k}|chiamata">Chiama</button>`):'<span class="pill wait">da chiamare</span>';
    else if(st==="chiamata"){const late=isLate(c.k,c.p.t);right=`<span class="pill ${late?"out":"call"}">in preparazione · ${ago(c.p.t)}</span>${act?`<button class="btn small" ${dis(c.k)} data-uncall="${n}|${c.k}">Annulla</button>`:""}`}
    else if(st==="pronta")right='<span class="pill ready">pronto</span>';
    else right=`<span class="pill wait">portato ✓</span>${act&&c.p.t&&Date.now()-c.p.t<3*60000?`<button class="btn small" ${dis(c.k)} data-unserve="${n}|${c.k}">Non portato</button>`:""}`;
    const mg=st==="attesa"&&act?canMerge(o,c.k):null;
    if(mg)right=`<button class="btn small" data-wmerge="${n}|${esc(c.k)}">Unisci</button>`+right;
    const scx=(st==="attesa"?(act?wScHtml(o,c):""):scTxt(c.p)?`<div class="sub wscd">${esc(scTxt(c.p))}</div>`:"");
    if(part)return `<div class="wpiatto ${st} wpart"><span class="wpn">${esc(c.l)}</span><span class="wbar">${wQtyHtml(o,c,q)}<span class="row">${right}</span></span>${scx}</div>`;
    return `<div class="wpiatto ${st}"><span class="wpn"><b>${q}</b> ${esc(c.l)}</span><span class="row">${right}</span>${scx}</div>`}}
/* «portato» per sbaglio: il piatto torna pronto da portare */
async function unserve(n,k){const o=orderByNum(n),p=o&&o.portate&&o.portate[k];if(!p||p.stato!=="servita"){schedule();return}
  try{const ok=await transStato(`ordini/${n}/portate/${k}`,"servita",{stato:"pronta",t:p.tp||Date.now(),tp:null});
    toast(ok?`${p.nome||"Piatto"} di nuovo da portare · ${whereTxt(o)}`:"Qualcun altro l'ha appena aggiornato: guarda lo stato attuale.",{ms:4000})}
  catch(e){showBanner(errText(e))}}
/* più piatti insieme: uno dopo l'altro, con un solo avviso alla fine */
async function setMany(n,ks,to){const done=[];for(const k of ks){if(await setStato(n,k,to,{notoast:true}))done.push(k)}return done}
function waitersList(){return S.users.filter(u=>u.ruolo==="cameriere"||hasRole(u,"capo"))}
/* clienti che si possono unire a questa scheda: i propri, non finiti, non già nello stesso gruppo */
const wVisible=o=>!o.asportoSubito&&(seesAll()?!!(ownerId(o)||o.fila):mineOrder(o));
function unibili(o){const ns=unitiOf(o).map(x=>x.numero);
  return ordersArr().filter(x=>wVisible(x)&&canAct(x)&&!orderDone(x)&&!ns.includes(x.numero)).sort((a,b)=>a.numero-b.numero)}
async function joinOrders(n,m){const a=orderByNum(n),b=orderByNum(m);if(!a||!b)return;
  const A=unitiOf(a),B=unitiOf(b),gid=A.length>1?a.unito:B.length>1?b.unito:Math.min(n,m),all=[...A,...B].sort((x,y)=>x.numero-y.numero);
  const prev=new Map(all.map(o=>[o.numero,o.unito||null]));
  try{await Promise.all(all.map(o=>R("ordini/"+o.numero).update({unito:gid,...claimUpd(o)})));S.pick=null;
    toast(`Uniti: n. ${gNums(all)} · una scheda sola`,{ms:6000,action:{label:"Annulla",fn:()=>prev.forEach((u,x)=>{if(orderByNum(x))R("ordini/"+x).update({unito:u}).catch(()=>{})})}});
    setTimeout(()=>flashCard(n),100)}
  catch(e){$("w-msg").textContent=errText(e)}renderWaiterLists()}
async function splitOrders(n){const o=orderByNum(n),G=unitiOf(o);if(G.length<2)return;const gid=o.unito;
  try{await Promise.all(G.map(x=>R("ordini/"+x.numero).update({unito:null})));
    toast(`Separati: n. ${gNums(G)}`,{ms:6000,action:{label:"Annulla",fn:()=>G.forEach(x=>{if(orderByNum(x.numero))R("ordini/"+x.numero).update({unito:gid}).catch(()=>{})})}})}
  catch(e){$("w-msg").textContent=errText(e)}}
function custCard(G){
  const o=G[0],multi=G.length>1,own=ownerId(o),sh=sharedIds(o);
  const names=[own?nameOf(own,o.cameriere):"",...sh.filter(id=>id!==own).map(id=>nameOf(id))].filter(Boolean);
  const who=seesAll()?[names.join(" + "),o.fila?filaNome(o.fila):""].filter(Boolean).join(" · "):sh.length?names.filter(n=>n!==myName()).map(n=>"con "+n).join(", "):"";
  const canShare=own&&(mineOrder(o)||capoLike()),canMove=own&&seesAll(),canJoin=G.every(canAct)&&!G.every(orderDone)&&unibili(o).length>0;
  const pk=S.pick&&S.pick.n===o.numero?S.pick.mode:null;
  let pick="";
  if(pk==="join"){pick=`<div class="wpick"><span class="label">Unisci con</span><div class="grp">${unibili(o).map(x=>`<button data-pkj="${x.numero}"><b>n. ${x.numero}</b>${x.nome?" "+esc(x.nome):""} <small>${copOf(x)} coperti</small></button>`).join("")}</div>
      <span class="sub">Una scheda sola qui, in cucina, al bar e all'uscita. In cassa restano ordini separati.</span><button class="btn small" data-pkclose="1">Chiudi</button></div>`}
  else if(pk){const mf=o.fila||myFila();
    const ws=waitersList().filter(u=>u.id!==own&&(pk==="move"||!S.me||u.id!==S.me.id||capoLike()))
      .sort((a,b)=>((b.fila===mf)-(a.fila===mf))||a.nome.localeCompare(b.nome));
    pick=`<div class="wpick"><span class="label">${pk==="share"?"Condividi con":"Sposta a"}</span><div class="grp">${ws.map(u=>`<button data-pk="${esc(u.id)}" aria-pressed="${pk==="share"&&sh.includes(u.id)}">${esc(u.nome)}${u.fila&&u.fila!==mf?` <small>${esc(filaNome(u.fila))}</small>`:""}</button>`).join("")||'<span class="sub">Nessun altro cameriere.</span>'}</div>
      <button class="btn small" data-pkclose="1">Chiudi</button></div>`}
  const more=[canJoin?`<button class="btn small" data-wjoin="${o.numero}">Unisci</button>`:"",multi&&G.every(canAct)?`<button class="btn small" data-wsep="${o.numero}">Separa</button>`:"",
    canShare?`<button class="btn small" data-share="${o.numero}">Condividi</button>`:"",canMove?`<button class="btn small" data-move="${o.numero}">Sposta</button>`:""].join("");
  const notes=G.filter(x=>x.note).map(x=>`<div class="note">${multi?`<b>n. ${x.numero}:</b> `:""}${esc(x.note)}</div>`).join("");
  return `<div class="ccard${G.every(orderDone)?" cdone":""}${multi?" cunito":""}" data-card="${o.numero}" data-cards=" ${G.map(x=>x.numero).join(" ")} "><div class="chead"><span class="tav${multi?" tg":""}"><small>n.</small>${G.map(x=>x.numero).join("<i>+</i>")}</span>
    <span class="tmid"><b class="cname">${esc((multi?gNome(G):o.nome)||"Senza nome")}</b><span class="sub">${multi?"uniti · ":""}${G.reduce((a,x)=>a+copOf(x),0)} coperti${who?" · "+esc(who):""}</span></span>
    ${more?`<span class="cmore">${more}</span>`:""}</div>
    ${pick}
    ${notes}
    <div class="cact">${cardAction(G)}</div></div>`;
}
$("w-tables").addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.wtab){const [n,r]=t.dataset.wtab.split("|");S.wTab[n]=r;renderWaiterLists();return}
  if(t.dataset.callall){const [ns,r]=t.dataset.callall.split("|"),G=ns.split(",").map(Number).map(orderByNum).filter(Boolean);if(!G.length||!G.every(canAct))return;t.disabled=true;
    const done=[],gk=gKey(G[0]),rows=gRows(G).filter(x=>x.st==="attesa"&&kRound(x.k)===1&&repOfC(x.its[0].o,x.its[0].c)===r);
    for(const row of rows){let pairs;
      if(row.its.length>1)pairs=await callRowM(gk,row.its,row.k);
      else{const n=row.its[0].o.numero,k=row.k,y=orderByNum(n),x=y?wNowOf(y,k):0;if(y&&x<cop(righeFor(y,k)))await splitCourse(n,k,x,{silent:true});pairs=[[n,k]]}
      for(const [n,k] of pairs)if(await setStato(n,k,"chiamata",{notoast:true}))done.push([n,k])}
    if(done.length){const np=new Set(done.map(x=>x[1])).size;toast(`${repNome(r)}: chiamati ${np} piatti · ${G.length>1?"n. "+gNums(G):whereTxt(orderByNum(G[0].numero)||G[0])}`,{ms:5000,action:{label:"Annulla",fn:()=>{done.forEach(([n,k])=>{const y=orderByNum(n);if(y&&y.portate&&y.portate[k]&&y.portate[k].stato==="chiamata")setStato(n,k,"attesa",{silent:true})})}}})}
    return}
  if(t.dataset.carryall){const G=t.dataset.carryall.split(",").map(Number).map(orderByNum).filter(Boolean);if(!G.length||!G.every(canAct))return;t.disabled=true;const done=[];
    for(const o of G)(await setMany(o.numero,orderCourses(o).filter(c=>c.p.stato==="pronta").map(c=>c.k),"servita")).forEach(k=>done.push([o.numero,k]));
    if(done.length)toast(`${new Set(done.map(x=>x[1])).size} piatti portati · ${G.length>1?"n. "+gNums(G):whereTxt(G[0])}`,{ms:10000,action:{label:"Annulla",fn:()=>done.forEach(([n,k])=>unserve(n,k))}});return}
  if(t.dataset.callm){const its=parseIts(t.dataset.callm),G=[...new Set(its.map(x=>x[0]))].map(orderByNum).filter(Boolean);if(!G.length||!G.every(canAct))return;t.disabled=true;
    const k=its[0][1],pairs=await callRowM(t.dataset.gk,its.map(([n])=>({o:orderByNum(n),k})).filter(x=>x.o),k);if(pairs.length)await setStatoM(pairs,"chiamata");return}
  if(t.dataset.uncallm){if(!armed(t,"Annullo?"))return;const its=parseIts(t.dataset.uncallm).filter(([n,k])=>stOf(orderByNum(n)||{},k)==="chiamata");
    for(const [n,k] of its)await setStato(n,k,"attesa",{silent:true});
    if(its.length)toast(`${piattoNome(its[0][1])} non più chiamato · n. ${its.map(x=>x[0]).join(" + ")}`,{ms:4000});return}
  if(t.dataset.unservem){t.disabled=true;for(const [n,k] of parseIts(t.dataset.unservem))await unserve(n,k);return}
  if(t.dataset.wscg){const [gk,k,i]=t.dataset.wscg.split("|"),n=Number(gk.slice(1)),o=ordersArr().find(x=>gKey(x)===gk);if(!o)return;
    const r=gRows(unitiOf(o)).find(x=>x.k===k&&x.st==="attesa");if(!r)return;const sc=wScForG(gk,r.its,k);if(!sc)return;const q=sc.map(x=>x.q);
    scStep(q,Number(i),Number(t.dataset.d));S.wSc[gk+"|"+k]={n:itsQ(r.its),q};renderWaiterLists();return}
  if(t.dataset.wjoin){const n=Number(t.dataset.wjoin);S.pick=S.pick&&S.pick.n===n&&S.pick.mode==="join"?null:{n,mode:"join"};renderWaiterLists();return}
  if(t.dataset.pkj&&S.pick){t.disabled=true;await joinOrders(S.pick.n,Number(t.dataset.pkj));return}
  if(t.dataset.wsep){if(!armed(t,"Separo?"))return;await splitOrders(Number(t.dataset.wsep));return}
  if(t.dataset.unserve){const [n,k]=t.dataset.unserve.split("|");await unserve(Number(n),k);return}
  if(t.dataset.callpart){const [n,k]=t.dataset.callpart.split("|"),o=orderByNum(Number(n));if(!o||!canAct(o))return;t.disabled=true;const x=wNowOf(o,k);
    if(x<cop(righeFor(o,k))&&!(await splitCourse(Number(n),k,x,{silent:true})))return;await setStato(Number(n),k,"chiamata");return}
  if(t.dataset.wsplit){const [n,k]=t.dataset.wsplit.split("|");S.wSplit={n:Number(n),k,x:1};renderWaiterLists();return}
  if(t.dataset.wsx){if(S.wSplit){S.wSplit.x=(S.wSplit.x||1)+Number(t.dataset.wsx)}renderWaiterLists();return}
  if(t.dataset.wsplitno){S.wSplit=null;renderWaiterLists();return}
  if(t.dataset.wsplitok){const [n,k]=t.dataset.wsplitok.split("|");t.disabled=true;await splitCourse(Number(n),k,S.wSplit?S.wSplit.x||1:1);return}
  if(t.dataset.wmerge){const [n,k]=t.dataset.wmerge.split("|");t.disabled=true;await mergeCourse(Number(n),k);return}
  if(t.dataset.wsc){const [n,k,i]=t.dataset.wsc.split("|");wScMove(Number(n),k,Number(i),Number(t.dataset.d));renderWaiterLists();return}
  if(t.dataset.uncall){if(!armed(t,"Annullo?"))return;const [n,k]=t.dataset.uncall.split("|");const o=orderByNum(Number(n));
    if(!o||!o.portate||!o.portate[k]||o.portate[k].stato!=="chiamata"){renderWaiterLists();return}
    await setStato(Number(n),k,"attesa",{silent:true});const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;toast(`${c} non più chiamato · ${whereTxt(o)}`,{ms:4000});return}
  if(t.dataset.share||t.dataset.move){const n=Number(t.dataset.share||t.dataset.move),mode=t.dataset.share?"share":"move";
    S.pick=S.pick&&S.pick.n===n&&S.pick.mode===mode?null:{n,mode};renderWaiterLists();return}
  if(t.dataset.pkclose){S.pick=null;renderWaiterLists();return}
  if(t.dataset.pk&&S.pick){const {n,mode}=S.pick,o=orderByNum(n),u=S.users.find(x=>x.id===t.dataset.pk);if(!o||!u)return;
    const G=unitiOf(o),nn=G.map(x=>x.numero).join(" + ");
    try{
      if(mode==="share"){const on=!sharedIds(o).includes(u.id);await Promise.all(G.map(x=>R(`ordini/${x.numero}/condivisi/${u.id}`).set(on?true:null)));
        toast(on?`n. ${nn} condiviso con ${u.nome}`:`${u.nome} tolto dal n. ${nn}`,{ms:4000})}
      else{await Promise.all(G.map(x=>R("ordini/"+x.numero).update({cameriereId:u.id,cameriere:u.nome,fila:u.fila||null,presoT:Date.now(),["condivisi/"+u.id]:null})));
        S.pick=null;toast(`n. ${nn} spostato a ${u.nome}`,{ms:4000})}
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
  const recent=o=>Math.max(0,...orderCourses(o).map(c=>c.p.t||0));
  /* una scheda per cliente; gli ordini uniti sono una scheda sola */
  const seen=new Set(),groups=[];ordersArr().filter(wVisible).forEach(o=>{const k=gKey(o);if(seen.has(k))return;seen.add(k);groups.push(unitiOf(o))});
  const gDone=G=>G.every(orderDone),gRecent=G=>Math.max(...G.map(recent));
  /* ordine fisso: prima chi è stato preso prima; le schede non saltano quando un piatto diventa pronto o viene servito */
  const gPreso=G=>Math.min(...G.map(presoT));
  const list=groups.filter(G=>!gDone(G)||Date.now()-gRecent(G)<3*60000)
    .sort((a,b)=>(gPreso(a)-gPreso(b))||a[0].numero-b[0].numero);
  $("w-tables").innerHTML=list.length?list.map(custCard).join("")
    :`<div class="empty">${seesAll()?"Nessun cliente servito per ora.":"Nessun cliente."}</div>`;
  renderWHist(recent);
}
/* storico: i clienti già finiti, il più recente in alto; tocca per vedere i piatti */
function renderWHist(recent){
  const H=ordersArr().filter(o=>!o.asportoSubito&&(seesAll()?(ownerId(o)||o.fila):mineOrder(o))&&orderDone(o)).sort((a,b)=>recent(b)-recent(a));
  $("w-histbox").hidden=!H.length;if(!H.length){$("w-hist").innerHTML="";return}
  const show=!!S.wHistShow;$("w-histbtn").setAttribute("aria-expanded",String(show));$("w-hist").hidden=!show;
  $("w-histbtn").innerHTML=`<span>Storico</span><small>${H.length} ${H.length===1?"cliente finito":"clienti finiti"} · ${H.reduce((a,o)=>a+copOf(o),0)} coperti</small><span class="chev" aria-hidden="true">${show?"▴":"▾"}</span>`;
  const open=S.wHistOpen||(S.wHistOpen=new Set());
  const html=H.map(o=>{const who=seesAll()?nameOf(ownerId(o),o.cameriere):"";
    return `<details class="whist" data-h="${o.numero}" ${open.has(o.numero)?"open":""}><summary><span class="n">${o.numero}</span><span class="wh-main"><b>${esc(o.nome||"Senza nome")}</b><span class="sub">${copOf(o)} coperti${who?" · "+esc(who):""} · finito alle ${fmtTime(recent(o))}</span></span></summary>
      <ul>${orderCourses(o).map(c=>`<li><b>${cop(righeFor(o,c.k))}</b> <span style="color:${portColor(c.k)}">${esc(c.l)}</span>${scTxt(c.p)?` <small>(${esc(scTxt(c.p))})</small>`:""}<span class="sub"> · portato alle ${fmtTime(c.p.t)}</span></li>`).join("")}</ul>
      ${o.note?`<div class="note">${esc(o.note)}</div>`:""}</details>`}).join("");
  if($("w-hist").dataset.h!==html){$("w-hist").innerHTML=html;$("w-hist").dataset.h=html}
}
$("w-histbtn").addEventListener("click",()=>{S.wHistShow=!S.wHistShow;renderWaiterLists()});
$("w-hist").addEventListener("toggle",e=>{const d=e.target.closest&&e.target.closest("details[data-h]");if(!d)return;const n=Number(d.dataset.h),s=S.wHistOpen||(S.wHistOpen=new Set());if(d.open)s.add(n);else s.delete(n);
  $("w-hist").dataset.h="";},true);
/* compatibilità con il resto dell'app */
function renderDetail(){}
function readyItems(){return flatCourses("pronta").filter(x=>!x.o.asportoSubito&&(seesAll()||mineOrder(x.o)))}

