/* Cassa: nuovo ordine, modifica, rettifica, annullo */
/* ---------- CASSA ---------- */
function stepperHtml(list,qty,attr){
  const anyP=S.varianti.some(x=>x.prezzo>0)||S.portate.some(x=>x.prezzo>0||x.prezzoBimbi>0);
  const out=v=>{let miss=[];
    if(attr==="data-sstep"||attr==="data-esstep"){const l=stockLeft(v.pid);if(l!=null&&l<=0)miss=["esaurito"]}
    else{miss=S.portate.filter(p=>applies(p,v.id)&&stockLeft(p.id)!=null&&stockLeft(p.id)<=0).map(p=>"manca "+p.nome)}
    return miss.length?` <span class="label" style="color:var(--danger)">${esc(miss.join(", "))}</span>`:""};
  return list.map(v=>`<div class="stepper"><span class="name">${esc(v.nome)}${v.prezzo>0?` <span class="label">${money(v.prezzo)}</span>`:anyP?` <span class="label" style="color:var(--danger)">prezzo non impostato</span>`:""}${out(v)}</span><span class="ctl">
    <button ${attr}="${esc(v.id)}" data-d="-1" aria-label="Togli ${esc(v.nome)}">−</button><output>${qty[v.id]||0}</output>
    <button ${attr}="${esc(v.id)}" data-d="1" aria-label="Aggiungi ${esc(v.nome)}">+</button></span></div>`).join("");
}
/* piatti venduti da soli: divisi per reparto */
function singlesHtml(qty,attr){
  const sl=singlesList(),pOf=i=>S.portate.find(x=>x.id===i.pid)||{};
  const key=i=>pOf(i).rep||"",groups=[...new Set(sl.map(key))];
  if(groups.length<2)return stepperHtml(sl,qty,attr);
  groups.sort((a,b)=>(a==="")-(b===""));
  return groups.map(g=>`<div class="xgroup"><span class="label cgrp" style="--c:${g?repColor(g):"var(--line)"}">${esc(repNome(g)||"Altro")}</span>${stepperHtml(sl.filter(i=>key(i)===g),qty,attr)}</div>`).join("");
}
/* ---------- pagamenti: uno solo, diviso in parti, offerto ---------- */
const PAY_LBL={contanti:"contanti",pos:"POS",offerto:"offerto",misto:"contanti e POS"};
const eurIn=v=>v>0?v.toFixed(2).replace(".",","):"";
function newPart(i){return {i:i||0,m:"contanti",r:0,chi:"",sel:{}}}
/* «Per piatti»: le righe dell'ordine (menù e piatti da soli) con il prezzo di uno */
function splitLines(){const b=bill(S.qty,{},$("c-paid").checked,S.sqty);
  return [...b.rr.map(r=>({k:"v:"+r.id,nome:r.nome,qta:r.qta,p:$("c-paid").checked?0:(r.prezzo||0)})),...b.ss.map(s=>({k:"s:"+s.pid+"|"+s.k,nome:s.nome,qta:s.qta,p:s.prezzo||0}))]}
function assigned(k,except){return S.parts.reduce((a,p,j)=>a+(j===except?0:((p.sel||{})[k]||0)),0)}
/* importi delle parti dai piatti scelti; l'offerta libera si aggiunge alla parte 1 */
function recalcByItems(){const L=splitLines(),off=parsePrice($("c-off").value);
  S.parts.forEach((p,j)=>{p.sel=p.sel||{};L.forEach(l=>{const max=l.qta-assigned(l.k,j);if((p.sel[l.k]||0)>max)p.sel[l.k]=Math.max(0,max)});
    Object.keys(p.sel).forEach(k=>{if(!L.some(l=>l.k===k))delete p.sel[k]});
    p.i=r2(L.reduce((a,l)=>a+(p.sel[l.k]||0)*l.p,0)+(j===0?off:0))})}
function partCosa(p){const L=splitLines();return L.filter(l=>(p.sel||{})[l.k]>0).map(l=>`${p.sel[l.k]} ${l.nome}`).join(", ")}
/* parti uguali al centesimo: il resto dei centesimi va alle prime parti */
function equalParts(tot,n){const c=Math.round(tot*100),q=Math.floor(c/n),x=c-q*n;return Array.from({length:n},(_,k)=>(q+(k<x?1:0))/100)}
/* piano dei pagamenti dell'ordine nuovo; err = cosa manca */
function payPlan(b,off){
  const due=b.due,toPay=r2(due+off);
  if(!S.split){
    if(S.pay==="offerto"){const chi=$("c-offby").value.trim();if(due>0&&!chi)return {err:"Scrivi chi offre il pasto (es. Parrocchia).",focus:"c-offby"};
      return {pagamenti:due>0?[{i:due,m:"offerto",chi}]:[],incassato:0,offerta:0,offerto:due,offertoDa:chi,ricevuto:0,metodo:due>0?"offerto":"",money:0}}
    const ric=S.pay==="contanti"?parsePrice($("c-ric").value):0;
    if(toPay>0&&S.pay==="contanti"&&!(ric>0))return {err:"Scrivi quanto ti ha dato il cliente.",focus:"c-ric",bad:true};
    if(toPay>0&&ric>0&&ric<toPay)return {err:`Mancano ${money(r2(toPay-ric))}: controlla quanto hai ricevuto.`};
    return {pagamenti:toPay>0?[{i:toPay,m:S.pay,...(ric>0?{r:ric}:{})}]:[],incassato:due,offerta:off,offerto:0,offertoDa:"",ricevuto:ric>0?ric:0,metodo:toPay>0?S.pay:"",money:toPay}}
  if(S.smode==="piatti"){recalcByItems();const left=splitLines().map(l=>({...l,q:l.qta-assigned(l.k,-1)})).filter(l=>l.q>0);
    if(left.length)return {err:`Da assegnare a una parte: ${left.map(l=>l.q+" "+l.nome).join(", ")}.`}}
  const P=S.parts;if(!P.length)return {err:"Aggiungi le parti del conto."};
  for(const [k,p] of P.entries()){if(!(p.i>0))return {err:`Parte ${k+1}: scrivi l'importo.`};
    if(p.m==="offerto"&&!p.chi.trim())return {err:`Parte ${k+1}: scrivi chi la offre.`};
    if(p.m==="contanti"&&!(p.r>0))return {err:`Parte ${k+1}: scrivi quanto ha dato in contanti.`,partR:k};
    if(p.m==="contanti"&&p.r<p.i)return {err:`Parte ${k+1}: mancano ${money(r2(p.i-p.r))}.`,partR:k}}
  const sum=r2(P.reduce((a,p)=>a+p.i,0));
  if(Math.round(sum*100)!==Math.round(toPay*100))return {err:sum<toPay?`Le parti fanno ${money(sum)}: mancano ${money(r2(toPay-sum))}.`:`Le parti fanno ${money(sum)}: ${money(r2(sum-toPay))} di troppo.`};
  const offerto=r2(P.filter(p=>p.m==="offerto").reduce((a,p)=>a+p.i,0));
  if(offerto>due)return {err:"La parte offerta è più grande del conto dei pasti (l'offerta libera non si offre)."};
  const ms=[...new Set(P.filter(p=>p.m!=="offerto").map(p=>p.m))];
  return {pagamenti:P.map(p=>({i:p.i,m:p.m,...(p.m==="contanti"&&p.r>0?{r:p.r}:{}),...(p.m==="offerto"?{chi:p.chi.trim()}:{}),...(S.smode==="piatti"&&partCosa(p)?{cosa:partCosa(p)}:{})})),
    incassato:r2(due-offerto),offerta:off,offerto,offertoDa:[...new Set(P.filter(p=>p.m==="offerto").map(p=>p.chi.trim()))].join(", "),ricevuto:0,
    metodo:ms.length>1?"misto":ms[0]||"offerto",money:r2(sum-offerto)};
}
function partRow(p,k){const byI=S.smode==="piatti",L=byI?splitLines():[];
  const items=byI?`<div class="plines">${L.map(l=>{const q=(p.sel||{})[l.k]||0,free=l.qta-assigned(l.k,k);
      return `<div class="stepper pl"><span class="name">${esc(l.nome)} <span class="label">${l.p>0?money(l.p):""}${free-q>0?` · liberi ${free-q}`:""}</span></span><span class="ctl">
        <button type="button" data-pq="${esc(l.k)}" data-d="-1" ${q?"":"disabled"} aria-label="Togli ${esc(l.nome)} dalla parte ${k+1}">−</button><output>${q}</output>
        <button type="button" data-pq="${esc(l.k)}" data-d="1" ${free-q>0?"":"disabled"} aria-label="Aggiungi ${esc(l.nome)} alla parte ${k+1}">+</button></span></div>`}).join("")}
      ${L.some(l=>l.qta-assigned(l.k,-1)>0)?`<button type="button" class="btn small" data-prest="${k}">Tutto il resto a questa parte</button>`:""}
      ${k===0&&parsePrice($("c-off").value)>0?`<div class="sub">+ offerta ${money(parsePrice($("c-off").value))}</div>`:""}</div>`:"";
  return `<div class="part" data-pi="${k}"><div class="row"><span class="label">Parte ${k+1}</span>
    ${byI?`<b class="pamt">${money(p.i)}</b>`:`<input type="text" inputmode="decimal" class="pricein" data-pf="i" value="${eurIn(p.i)}" placeholder="0,00 €" aria-label="Importo della parte ${k+1}">`}
    <span class="seg">${["contanti","pos","offerto"].map(m=>`<button type="button" data-pm="${m}" aria-pressed="${p.m===m}">${m==="pos"?"POS":m[0].toUpperCase()+m.slice(1)}</button>`).join("")}</span>
    ${S.parts.length>1?`<button class="btn small" type="button" data-prm="${k}" aria-label="Togli la parte ${k+1}">✕</button>`:""}</div>
    ${p.m==="contanti"?`<div class="row"><span class="label">Ricevuto</span><input type="text" inputmode="decimal" class="pricein" data-pf="r" value="${eurIn(p.r)}" placeholder="0,00 €" aria-label="Ricevuto parte ${k+1}"><span class="resto" data-presto="${k}"></span></div>`:""}
    ${items}
    ${p.m==="offerto"?`<div class="row"><span class="label">Offerto da</span><input type="text" data-pf="chi" value="${esc(p.chi)}" placeholder="Es. Parrocchia" aria-label="Chi offre la parte ${k+1}"></div>`:""}</div>`}
function renderParts(){if(S.smode==="piatti")recalcByItems();
  $("c-smode").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.smode===S.smode)));$("c-eqrow").hidden=S.smode==="piatti";
  $("c-smode-hint").textContent=S.smode==="piatti"?"Per ogni parte tocca + sui menù e sui piatti che paga: l'importo si calcola da solo.":"Scrivi l'importo di ogni parte, oppure dividi in parti uguali.";
  $("c-partlist").innerHTML=S.parts.map(partRow).join("");paintParts()}
$("c-smode").addEventListener("click",e=>{const b=e.target.closest("button[data-smode]");if(!b)return;S.smode=b.dataset.smode;
  if(S.smode==="piatti")S.parts.forEach(p=>{p.sel={}});renderParts();repaintC()});
function paintParts(){
  const b=bill(S.qty,{},$("c-paid").checked,S.sqty),toPay=r2(b.due+parsePrice($("c-off").value)),sum=r2(S.parts.reduce((a,p)=>a+(p.i||0),0)),d=r2(toPay-sum);
  $("c-partsum").innerHTML=`Parti: <b>${money(sum)}</b> su ${money(toPay)}${d>0?` · <span style="color:var(--danger)">mancano ${money(d)}</span>`:d<0?` · <span style="color:var(--danger)">${money(-d)} di troppo</span>`:" · ✓"}`;
  S.parts.forEach((p,k)=>{const el=document.querySelector(`[data-presto="${k}"]`);if(!el)return;if(!(p.r>0)){el.className="resto";el.innerHTML="";return}
    const r=r2(p.r-p.i);el.className="resto "+(r<0?"err":"ok");el.innerHTML=r<0?`<small>Mancano</small>${money(-r)}`:`<small>Resto</small>${money(r)}`});
}
$("c-split").addEventListener("click",e=>{const b=e.target.closest("button[data-split]");if(!b)return;S.split=b.dataset.split==="1";
  if(S.split&&!S.parts.length){const bb=bill(S.qty,{},$("c-paid").checked,S.sqty),t=r2(bb.due+parsePrice($("c-off").value));S.parts=S.smode==="piatti"?[newPart(),newPart()]:equalParts(t,2).map(newPart)}
  renderSteppers()});
$("c-equal").addEventListener("click",()=>{const n=Math.max(2,Math.min(20,parseInt($("c-nparts").value,10)||2)),b=bill(S.qty,{},$("c-paid").checked,S.sqty);
  const old=S.parts;S.parts=equalParts(r2(b.due+parsePrice($("c-off").value)),n).map((i,k)=>({...(old[k]||newPart()),i}));renderParts();repaintC()});
$("c-addpart").addEventListener("click",()=>{const b=bill(S.qty,{},$("c-paid").checked,S.sqty),left=r2(b.due+parsePrice($("c-off").value)-S.parts.reduce((a,p)=>a+(p.i||0),0));
  S.parts.push(newPart(S.smode==="piatti"?0:(left>0?left:0)));renderParts();repaintC()});
$("c-partlist").addEventListener("click",e=>{const row=e.target.closest(".part");if(!row)return;const k=+row.dataset.pi;
  const m=e.target.closest("button[data-pm]");if(m){S.parts[k].m=m.dataset.pm;renderParts();repaintC();return}
  const q=e.target.closest("button[data-pq]");if(q){const p=S.parts[k];p.sel=p.sel||{};p.sel[q.dataset.pq]=Math.max(0,(p.sel[q.dataset.pq]||0)+Number(q.dataset.d));recalcByItems();renderParts();repaintC();return}
  if(e.target.closest("button[data-prest]")){const p=S.parts[k];p.sel=p.sel||{};splitLines().forEach(l=>{p.sel[l.k]=(p.sel[l.k]||0)+Math.max(0,l.qta-assigned(l.k,-1))});recalcByItems();renderParts();repaintC();return}
  if(e.target.closest("button[data-prm]")){S.parts.splice(k,1);renderParts();repaintC()}});
$("c-partlist").addEventListener("input",e=>{const row=e.target.closest(".part"),f=e.target.dataset.pf;if(!row||!f)return;const p=S.parts[+row.dataset.pi];
  p[f]=f==="chi"?e.target.value:parsePrice(e.target.value);e.target.classList.remove("bad");if(/^Parte \d+: (scrivi quanto|mancano)/.test($("c-msg").textContent))$("c-msg").textContent="";paintParts();repaintC()});
$("c-offby").addEventListener("input",()=>{if(/chi offre/.test($("c-msg").textContent))$("c-msg").textContent=""});
/* descrizione dei pagamenti di un ordine (lista recenti, biglietto, Excel) */
function pagamenti(o){return toArr(o&&o.pagamenti)}
function payDesc(o){const P=pagamenti(o);
  if(!P.length){const tp=r2((o.incassato||0)+(o.offerta||0));return tp>0?`${money(tp)} ${PAY_LBL[o.metodo]||""}`:""}
  const by={};P.forEach(p=>{by[p.m]=r2((by[p.m]||0)+(p.i||0))});
  return ["contanti","pos","offerto"].filter(m=>by[m]).map(m=>`${money(by[m])} ${PAY_LBL[m]}`).join(" + ")+(o.offertoDa?` (offerto da ${o.offertoDa})`:"");
}
function paintTotal(prefix,b,paid,pay){
  const off=parsePrice($(prefix+"-off").value),toPay=r2(b.due+off);
  const el=$(prefix+"-total");
  if(prefix==="x"){el.hidden=!(toPay>0);el.className="totline";el.innerHTML=`<span class="label">Da incassare</span><b>${money(toPay)}</b>`;$("x-pay-row").hidden=!(toPay>0);
    $("x-pay").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pay===pay)));return}
  $("c-paybox").hidden=!(toPay>0);
  const offAll=!S.split&&pay==="offerto";
  el.className="totline";el.innerHTML=offAll?`<span class="label">Offerto</span><b>${money(b.due)}</b>`:`<span class="label">Da incassare</span><b>${money(toPay)}</b>`;
  $("c-split").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String((x.dataset.split==="1")===!!S.split)));
  $("c-one").hidden=!!S.split;$("c-parts").hidden=!S.split;$("c-offby-row").hidden=!offAll;$("c-off-row").hidden=offAll;
  $("c-pay").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pay===pay)));
  if(S.split){const sig=JSON.stringify([S.smode,S.smode==="piatti"?splitLines():0,S.parts.map(p=>[p.m,p.sel]),S.smode==="piatti"?$("c-off").value:0]);
    if(sig!==S.partSig||$("c-partlist").childElementCount!==S.parts.length){S.partSig=sig;renderParts()}else paintParts();$("c-cash").hidden=true}else paintCash(toPay,pay);
  if(!S.aspConfirm)$("c-create").textContent=toPay<=0?"Crea ordine":offAll?"Crea ordine (offerto)":S.split?"Crea ordine (conto diviso)":`Incassa ${money(toPay)} e crea`;
}
function paintCash(toPay,pay){
  const box=$("c-cash"),el=$("c-resto"),btn=$("c-off-resto");
  box.hidden=!(toPay>0&&pay==="contanti");btn.hidden=true;$("c-ric").disabled=box.hidden;
  const ric=parsePrice($("c-ric").value);
  if(box.hidden||!ric){el.className="resto";el.innerHTML="";return}
  const resto=r2(ric-toPay);
  if(resto<0){el.className="resto err";el.innerHTML=`<small>Mancano</small>${money(-resto)}`}
  else{el.className="resto ok";el.innerHTML=`<small>Resto</small>${money(resto)}`;btn.hidden=resto<=0}
}
function repaintC(){paintTotal("c",bill(S.qty,{},$("c-paid").checked,S.sqty),$("c-paid").checked,S.pay)}
$("c-off").addEventListener("input",repaintC);
$("c-ric").addEventListener("input",repaintC);
$("c-ric").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();createOrder()}});
function hideDone(){$("c-last-wrap").hidden=true}
["c-search","c-nome","c-note"].forEach(id=>$(id).addEventListener("input",hideDone));
$("c-ric").addEventListener("input",()=>{$("c-ric").classList.remove("bad");if($("c-msg").textContent==="Scrivi quanto ti ha dato il cliente.")$("c-msg").textContent=""});
$("c-nome").addEventListener("input",()=>{$("c-nome").classList.remove("bad");if($("c-msg").textContent==="Scrivi il nominativo.")$("c-msg").textContent=""});
["c-steppers","c-sing"].forEach(id=>$(id).addEventListener("click",e=>{if(e.target.closest("button"))hideDone()}));
$("c-off-resto").addEventListener("click",()=>{
  const b=bill(S.qty,{},$("c-paid").checked,S.sqty),off=parsePrice($("c-off").value),ric=parsePrice($("c-ric").value);
  const resto=r2(ric-(b.due+off));if(resto>0){$("c-off").value=r2(off+resto).toFixed(2).replace(".",",");repaintC()}
});
function renderStock(){
  const box=$("c-stock"),lim=S.portate.filter(p=>stockLeft(p.id)!=null);
  box.hidden=!lim.length;
  box.innerHTML=lim.map(p=>{const l=stockLeft(p.id);return `<span class="pill ${stockCls(l)||"wait"}">${esc(p.nome)}: ${leftTxt(l)}</span>`}).join("");
}
function stockProblems(rr,ss,xx){
  return [...S.portate.map(p=>{const l=stockLeft(p.id);if(l==null)return null;const need=cop(rr.filter(r=>applies(p,r.id)))+cop((ss||[]).filter(s=>s.pid===p.id));return need>l?{p,l,need,what:"porzioni"}:null})].filter(Boolean);
}
const isBoss=()=>!!S.me&&hasRole(S.me,"master");
/* aggiorna le scritte «esaurito» quando altri ordini consumano le porzioni, senza toccare il resto del modulo */
function refreshStepLabels(){
  [["c-steppers",S.varianti,S.qty,"data-step"],["c-sing","s",S.sqty,"data-sstep"]].forEach(([id,l,q,a])=>{
    const h=l==="s"?singlesHtml(q,a):stepperHtml(l,q,a);if($(id).dataset.h!==h){$(id).innerHTML=h;$(id).dataset.h=h}});
}
function stockTxt(probs){return probs.map(x=>x.l<=0?`${x.p.nome}: esaurito`:`${x.p.nome}: ne restano solo ${x.l} (ne servono ${x.need})`).join(". ")}
function stockBlockMsg(probs){
  const menuHit=probs.some(x=>!String(x.p.id).startsWith("x-")&&S.varianti.some(v=>applies(x.p,v.id)));
  return stockTxt(probs)+". Togli dall'ordine quello che manca"+(menuHit?" (per i menù serve un menù senza quel piatto: il master lo crea in Listino)":"")+". Se ne hanno ancora, cucina o bar aggiungono le porzioni; altrimenti chiedi al master.";
}
/* problemi di porzioni per una modifica: conta solo quello che si aggiunge rispetto all'ordine com'era */
function stockProblemsDelta(o,rr,ss,xx){
  return [...S.portate.map(p=>{const l=stockLeft(p.id);if(l==null)return null;
      const had=o.portate&&o.portate[p.id]?cop(righeFor(o,p.id)):0,need=cop(rr.filter(r=>applies(p,r.id)))+cop((ss||[]).filter(s=>s.pid===p.id));
      return need-had>l?{p,l,need:need-had,what:"porzioni"}:null})].filter(Boolean);
}
function renderSteppers(){
  S.aspConfirm=null;$("c-create").textContent="Crea ordine";
  $("c-steppers").innerHTML=stepperHtml(S.varianti,S.qty,"data-step");
  const sl=singlesList();$("c-sing-box").hidden=!sl.length;$("c-sing").innerHTML=singlesHtml(S.sqty,"data-sstep");
  paintTotal("c",bill(S.qty,{},$("c-paid").checked,S.sqty),$("c-paid").checked,S.pay);
  $("c-asp-row").hidden=!$("c-asp").checked;$("c-aspmode").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.m===S.aspMode)));
  renderStock();
  if(S.editOrder!=null)renderEditSteppers();
}
$("c-sing").addEventListener("click",e=>{const b=e.target.closest("button[data-sstep]");if(!b)return;
  const id=b.dataset.sstep;S.sqty[id]=Math.max(0,(S.sqty[id]||0)+Number(b.dataset.d));S.stockWarn=null;renderSteppers();$("c-msg").textContent=""});
$("c-asp").addEventListener("change",renderSteppers);
$("c-aspmode").addEventListener("click",e=>{const b=e.target.closest("button[data-m]");if(!b)return;S.aspMode=b.dataset.m;renderSteppers()});
$("c-steppers").addEventListener("click",e=>{const b=e.target.closest("button[data-step]");if(!b)return;
  const id=b.dataset.step;S.qty[id]=Math.max(0,(S.qty[id]||0)+Number(b.dataset.d));S.stockWarn=null;renderSteppers();$("c-msg").textContent=""});
$("c-pay").addEventListener("click",e=>{const b=e.target.closest("button[data-pay]");if(!b)return;S.pay=b.dataset.pay;renderSteppers();if(S.pay==="offerto")$("c-offby").focus()});
$("c-paid").addEventListener("change",renderSteppers);
$("c-num").addEventListener("input",()=>{S.numDirty=true;S.aspConfirm=null;$("c-create").textContent="Crea ordine"});
function prefillNum(){if(!S.numDirty&&document.activeElement!==$("c-num"))$("c-num").value=S.ordLoaded?nextNum():""}
function renderSearch(){
  const q=norm($("c-search").value),box=$("c-results"),P=prensArr();
  $("c-searchbox").hidden=!P.length;
  const arr=P.filter(p=>p.stato==="arrivata").length;
  $("c-prencount").textContent=P.length?`${arr} arrivati su ${P.length} prenotati`:"";
  if(!q){box.hidden=true;return}
  const hits=P.filter(p=>norm(p.nome).includes(q)).slice(0,8);
  box.hidden=false;
  box.innerHTML=hits.length?hits.map(p=>`<button data-pren="${esc(p.id)}" ${p.stato==="arrivata"?"disabled":""}>
    <span><b>${esc(p.nome)}</b><div class="chips" style="margin-top:4px">${prenChips(p)}</div></span>
    ${p.stato==="arrivata"?`<span class="pill ready">Arrivati · n. ${esc(p.ordine)}</span>`:`<span class="pill wait">${cop(righe(p))} coperti</span>`}</button>`).join("")
    :'<div class="empty" style="padding:10px 12px">Nessuna prenotazione trovata. Puoi creare l\'ordine lo stesso.</div>';
}
$("c-search").addEventListener("input",renderSearch);
$("c-results").addEventListener("click",e=>{const b=e.target.closest("button[data-pren]");if(b)selectPren(b.dataset.pren)});
function selectPren(id){
  const p=S.prenMap[id];if(!p)return;
  S.selPren=id;S.qty={};righe(p).forEach(r=>{if(S.varianti.some(v=>v.id===r.id))S.qty[r.id]=r.qta});
  S.sqty={};prenSing(p).forEach(x=>{if(singlesList().some(i=>i.id===x.id+"|a"))S.sqty[x.id+"|a"]=x.q});$("c-asp").checked=!!p.asporto;
  S.split=false;S.parts=[];if(p.offerto){S.pay="offerto";$("c-offby").value=p.offerto}
  $("c-nome").value=p.nome||"";$("c-note").value=p.note||"";$("c-search").value="";$("c-paid").checked=false;S.stockWarn=null;
  renderSearch();renderSteppers();renderSel();$("c-msg").textContent="";
}
function renderSel(){const p=S.selPren&&S.prenMap[S.selPren];$("c-sel").hidden=!p;if(p)$("c-sel-t").textContent="Prenotazione: "+p.nome}
function resetForm(){S.smode="piatti";S.selPren=null;S.qty={};S.sqty={};S.split=false;S.parts=[];$("c-offby").value="";$("c-partlist").innerHTML="";$("c-asp").checked=false;S.aspMode="subito";S.pay="contanti";S.stockWarn=null;$("c-off").value="";$("c-ric").value="";$("c-nome").value="";$("c-note").value="";$("c-paid").checked=false;renderSel();renderSteppers()}
$("c-sel-x").addEventListener("click",resetForm);
function canUndo(o){return !!o&&!o.asportoSubito&&Date.now()-(o.creato||0)<60000&&!isLocked(o)}
function renderTicket(){
  const wrap=$("c-last-wrap");
  if(S.lastNum==null||wrap.hidden){return}
  const o=orderByNum(S.lastNum);
  if(!o){$("c-last").innerHTML=S.undoMsg?`<b>${esc(S.undoMsg)}</b>`:"";return}
  const P=pagamenti(o),tp=r2((o.incassato||0)+(o.offerta||0)),resto=o.ricevuto?r2(o.ricevuto-tp):0;
  const parts=P.length>1?`<div class="stack" style="gap:2px">${P.map((p,k)=>`<span class="sub">Parte ${k+1}: <b>${money(p.i)}</b> ${PAY_LBL[p.m]||""}${p.m==="contanti"&&p.r>p.i?` · resto <b>${money(r2(p.r-p.i))}</b>`:""}${p.chi?" · "+esc(p.chi):""}${p.cosa?` <span class="label">(${esc(p.cosa)})</span>`:""}</span>`).join("")}</div>`:"";
  $("c-last").innerHTML=`<div class="done-top"><span class="done-n"><small>Biglietto</small>${o.numero}</span>
    ${resto>0?`<span class="done-resto"><small>Resto</small>${money(resto)}</span>`:""}</div>
    <span class="sub">${o.nome?esc(o.nome)+" · ":""}${esc(payDesc(o))}${o.offerta>0?` (offerta ${money(o.offerta)})`:""}${o.asportoSubito?" · asporto mandato in cucina":""}</span>${parts}
    ${canUndo(o)?`<button class="btn danger small" id="c-undo" style="align-self:flex-start">Annulla ordine</button>`:""}`;
}
$("c-last").addEventListener("click",async e=>{
  const b=e.target.closest("#c-undo");if(!b)return;const n=S.lastNum,o=orderByNum(n);
  if(!canUndo(o)){$("c-msg").className="msg err";$("c-msg").textContent=`L'ordine ${n} è già partito: non si può più annullare.`;renderTicket();return}
  if(!armed(b,"Sicuro? Tocca di nuovo"))return;
  if(!canUndo(orderByNum(n))){renderTicket();return}
  const back=r2((o.incassato||0)+(o.offerta||0));
  try{await burnOrder(n,o,back,"subito dopo la creazione");
    S.undoMsg=`Ordine ${n} annullato.`+(back>0?` Restituisci ${money(back)}.`:"");S.numDirty=false;prefillNum();renderTicket()}
  catch(err){$("c-msg").className="msg err";$("c-msg").textContent=errText(err)}
});
function dots(o){return `<span class="dots">${orderCourses(o).map(c=>`<span class="dot ${esc(c.p.stato||"attesa")}" title="${esc(c.l)}"></span>`).join("")}</span>`}
function payTxt(o){const d=payDesc(o);return d?esc(d)+(o.offerta>0?` (offerta ${money(o.offerta)})`:""):""}
function recentBtn(o){return isLocked(o)?`<button class="btn small" data-open="${o.numero}">Rettifica</button>`:`<button class="btn small" data-open="${o.numero}">Modifica</button>`}
function renderRecent(){
  const list=ordersArr().sort((a,b)=>b.numero-a.numero).slice(0,15);
  $("c-recent").innerHTML=list.length?list.map(o=>`<div class="li plain"><span class="n">${o.numero}</span>
    <span>${o.nome?`<b>${esc(o.nome)}</b>`:""}<div class="chips">${o.asporto?'<span class="pill asp">Asporto</span>':""}${righeChips(righe(o))}${singChips(singoli(o))}</div>${payTxt(o)?`<div class="sub">${payTxt(o)}</div>`:""}</span><span class="recact">${dots(o)}${recentBtn(o)}</span></div>`).join("")
    :'<div class="empty">Nessun ordine.</div>';
}
$("c-recent").addEventListener("click",e=>{const b=e.target.closest("button[data-open]");if(b)openEdit(Number(b.dataset.open))});
function openTyped(){const n=parseInt($("c-opennum").value,10);if(!(n>0)){$("c-opennum").focus();return}$("c-opennum").value="";openEdit(n)}
$("c-open").addEventListener("click",openTyped);
$("c-opennum").addEventListener("keydown",e=>{if(e.key==="Enter")openTyped()});
function payTotals(fo,fd){
  const O=ordersArr().filter(fo||(()=>true)),D=Object.values(S.offMap).filter(fd||(()=>true));
  const t={n:O.length,contanti:0,pos:0,offerte:0,offerti:0,libere:D.length};
  O.forEach(o=>{const P=pagamenti(o);
    if(P.length||o.pagamenti){P.forEach(p=>{if(p.m==="offerto")t.offerti+=p.i||0;else t[p.m==="pos"?"pos":"contanti"]+=p.i||0})}
    else{const v=(o.incassato||0)+(o.offerta||0);if(v>0)t[o.metodo==="pos"?"pos":"contanti"]+=v}
    t.offerte+=o.offerta||0});
  D.forEach(d=>{t[d.metodo==="pos"?"pos":"contanti"]+=d.importo||0;t.offerte+=d.importo||0});
  t.contanti=r2(t.contanti);t.pos=r2(t.pos);t.offerte=r2(t.offerte);t.offerti=r2(t.offerti);return t;
}
function renderAsporto(){
  const allC=o=>orderCourses(o);
  const list=ordersArr().filter(o=>o.asportoSubito&&allC(o).some(c=>c.p.stato!=="servita")).sort((a,b)=>a.numero-b.numero);
  $("c-asp-panel").hidden=!list.length;if(!list.length)return;
  $("c-asplist").innerHTML=list.map(o=>{const cs=allC(o),ready=cs.every(c=>c.p.stato==="pronta"||c.p.stato==="servita");
    const st=cs.map(c=>`${esc(c.l)}: ${c.p.stato==="pronta"?"pronta":c.p.stato==="servita"?"consegnata":c.bar?((c.p.stato||"attesa")==="attesa"?"da chiamare":"al bar"):"in cucina"}`).join(" · ");
    return `<div class="li plain"><span class="n">${o.numero}</span><span>${o.nome?`<b>${esc(o.nome)}</b>`:""}<div class="sub">${st}</div></span>
      ${ready?`<button class="btn primary small" data-consegna="${o.numero}">Consegnato</button>`:'<span class="pill call">In cucina</span>'}</div>`}).join("");
}
$("c-asplist").addEventListener("click",async e=>{const b=e.target.closest("button[data-consegna]");if(!b)return;
  const n=Number(b.dataset.consegna),o=orderByNum(n);if(!o)return;b.disabled=true;
  const upd={};orderCourses(o).forEach(c=>{if(c.p.stato==="pronta"){upd["portate/"+c.k+"/stato"]="servita";upd["portate/"+c.k+"/t"]=Date.now();upd["portate/"+c.k+"/tp"]=c.p.t||null}});
  try{await R("ordini/"+n).update(upd)}catch(err){showBanner(errText(err));b.disabled=false}
});
function renderMine(){
  paintDPay();
  const show=S.me&&(hasRole(S.me,"cassa")||hasRole(S.me,"master"));$("c-mine-panel").hidden=!show;if(!show)return;
  const t=payTotals(o=>o.creatoDaId===S.me.id,d=>d.daId===S.me.id),c=postCalc(S.me.id);
  $("c-mine").innerHTML=`Contanti <b>${money(t.contanti)}</b> · POS <b>${money(t.pos)}</b> · Offerte <b>${money(t.offerte)}</b>${t.offerti>0?` · Pasti offerti <b>${money(t.offerti)}</b>`:""} · Nel cassetto <b>${money(c.attesi)}</b>`;
}
$("c-fondo-save").addEventListener("click",()=>{if(!S.me||!hasRole(S.me,"master"))return;savePost(S.me.id,$("c-fondo").value).then(()=>{$("c-fondo-save").textContent="Salvato";setTimeout(()=>{$("c-fondo-save").textContent="Salva"},1500);schedule()})});

async function createOrder(){
  const msg=$("c-msg");msg.className="msg err";
  const paid=$("c-paid").checked,b=bill(S.qty,{},paid,S.sqty);
  if(!b.rr.length&&!b.ss.length&&!b.xx.length){msg.textContent="Aggiungi almeno un menù o un piatto.";return}
  if(!$("c-nome").value.trim()){msg.textContent="Scrivi il nominativo.";$("c-nome").classList.add("bad");$("c-nome").focus();return}
  let n=parseInt($("c-num").value,10);
  if(!(n>0)){msg.textContent="Scrivi un numero di biglietto valido.";return}
  const off=!S.split&&S.pay==="offerto"?0:parsePrice($("c-off").value),toPay=r2(b.due+off),plan=payPlan(b,off),ric=plan.ricevuto||0;
  if(plan.err){msg.textContent=plan.err;if(plan.focus){if(plan.bad)$(plan.focus).classList.add("bad");$(plan.focus).focus()}
    if(plan.partR!=null){const r=document.querySelector(`#c-partlist .part[data-pi="${plan.partR}"] input[data-pf="r"]`);if(r){r.classList.add("bad");r.focus()}}return}
  const probs=stockProblems(b.rr,b.ss,b.xx),key=JSON.stringify([S.qty,S.sqty,probs.map(x=>x.p.id)]);
  if(probs.length){
    if(!isBoss()){msg.textContent=stockBlockMsg(probs);return}
    if(S.stockWarn!==key){S.stockWarn=key;msg.textContent=stockTxt(probs)+". Sei master: premi di nuovo «Crea ordine» per venderle lo stesso.";return}}
  const direct=$("c-asp").checked&&S.aspMode==="subito",ckey=JSON.stringify([S.qty,S.sqty,n]);
  if(direct&&S.aspConfirm!==ckey){S.aspConfirm=ckey;msg.className="msg err";
    const what=[...b.rr.map(r=>`${r.qta} ${r.nome}`),...b.ss.map(s=>`${s.qta} ${s.nome}`)].join(", ");
    msg.textContent=`Asporto diretto: ${what} vanno subito in cucina e al bar e l'ordine non si potrà più cambiare. Controlla e premi «Conferma e manda in cucina».`;
    $("c-create").textContent="Conferma e manda in cucina";return}
  const auto=!S.numDirty,pren=S.selPren;
  const btn=$("c-create");btn.disabled=true;msg.className="msg";msg.textContent=S.online?"Creo l'ordine…":"Senza rete: l'ordine parte appena torna la connessione. Non chiudere la pagina.";
  const slow=setTimeout(()=>{msg.className="msg err";msg.textContent="Rete lenta: aspetto la connessione per confermare il numero. Non chiudere la pagina."},5000);
  const base={creato:Date.now(),creatoDa:myName(),creatoDaId:S.me?S.me.id:"",nome:$("c-nome").value.trim(),righe:b.rr,extra:b.xx,note:$("c-note").value.trim(),
    tavolo:"",prenotazione:pren||"",importoMenu:b.menu,importoExtra:b.ext,importo:b.tot,pagatoPrima:paid,incassato:plan.incassato,offerta:plan.offerta,ricevuto:ric>0?ric:0,metodo:plan.metodo,pagamenti:plan.pagamenti,
    ...(plan.offerto>0?{offerto:plan.offerto,offertoDa:plan.offertoDa}:{}),singoli:b.ss,importoSingoli:b.sing,
    asporto:$("c-asp").checked,asportoSubito:$("c-asp").checked&&S.aspMode==="subito",portate:coursesFor(b.rr,b.ss,b.xx),v:2};
  if(base.asportoSubito){const now=Date.now();Object.entries(base.portate).forEach(([k,c])=>{c.stato="chiamata";c.t=now;c.da="Asporto";c.daId=S.me?S.me.id:"";const rs=repSnap(k);if(rs)c.rep=rs});if(base.bar)base.bar.stato="chiamata"}
  if(S.annMap[n]&&!auto){btn.disabled=false;clearTimeout(slow);msg.className="msg err";msg.textContent=`Il numero ${n} era di un ordine annullato. Usa ${nextNum()}.`;S.numDirty=false;prefillNum();return}
  try{
    let done=false;
    for(let i=0;i<8&&!done;i++){
      if(S.annMap[n]){n=Math.max(n+1,nextNum());continue}
      const order={...base,numero:n};
      const r=await R("ordini/"+n).transaction(cur=>cur===null?order:undefined);
      if(r.committed){done=true;break}
      if(!auto){clearTimeout(slow);msg.className="msg err";msg.textContent=`Il numero ${n} esiste già. Usa ${nextNum()}.`;S.numDirty=false;prefillNum();return}
      n=Math.max(n+1,nextNum());
    }
    clearTimeout(slow);
    if(!done){msg.className="msg err";msg.textContent="Non riesco a trovare un numero libero: riprova.";return}
    if(pren)R("prenotazioni/"+pren).update({stato:"arrivata",ordine:n}).catch(()=>{});
    const pay=S.pay,split=S.split;S.lastNum=n;S.undoMsg="";S.numDirty=false;resetForm();$("c-last-wrap").hidden=false;
    setTimeout(()=>{if(S.lastNum===n)renderTicket()},61000);
    const resto=ric>0?r2(ric-toPay):0;
    if(plan.offerto>0)logChange(`Ordine ${n}${base.nome?" ("+base.nome+")":""}: pasto offerto ${money(plan.offerto)} da ${plan.offertoDa}`);
    msg.className="msg ok";msg.textContent=`Ordine ${n} creato${base.asportoSubito?" e mandato in cucina":""}.`+(split?" Conto diviso: vedi le parti sul biglietto.":plan.money>0?` Incassa ${money(toPay)} (${PAY_LBL[pay]}).`:plan.offerto>0?" Pasto offerto.":"")+(resto>0?` Resto ${money(resto)}.`:"");
    renderTicket();prefillNum();$("c-msg").textContent="";
    const w=$("c-last-wrap");w.classList.remove("flash");void w.offsetWidth;w.classList.add("flash");
  }catch(e){clearTimeout(slow);msg.className="msg err";msg.textContent=errText(e)}
  finally{btn.disabled=false}
}
$("c-create").addEventListener("click",createOrder);
$("d-toggle").addEventListener("click",()=>{const p=$("d-panel");p.hidden=!p.hidden;$("d-toggle").textContent=p.hidden?"+ Offerta":"Chiudi";if(!p.hidden)$("d-amt").focus()});
function paintDPay(){$("d-pay").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pay===S.dpay)))}
$("d-pay").addEventListener("click",e=>{const b=e.target.closest("button[data-pay]");if(!b)return;S.dpay=b.dataset.pay;paintDPay()});
$("d-go").addEventListener("click",async()=>{
  const v=parsePrice($("d-amt").value),m=$("d-msg");
  if(!(v>0)){m.className="msg err";m.textContent="Scrivi l'importo dell'offerta.";return}
  const id=rid("d");
  try{await R("offerte/"+id).set({id,importo:v,metodo:S.dpay,t:Date.now(),da:myName(),daId:S.me?S.me.id:""});
    m.className="msg ok";m.textContent=`Offerta di ${money(v)} registrata (${PAY_LBL[S.dpay]}).`;$("d-amt").value="";S.dpay="contanti";paintDPay();setTimeout(()=>{$("d-panel").hidden=true;$("d-toggle").textContent="+ Offerta";m.textContent=""},2500)}
  catch(e){m.className="msg err";m.textContent=errText(e)}
});

/* modifica / annulla ordine */
function openEdit(n){
  const o=orderByNum(n);const m=$("c-msg");
  if(!o){m.className="msg err";m.textContent=S.annMap[n]?`L'ordine ${n} è già stato annullato.`:`L'ordine ${n||""} non esiste.`;return}
  const locked=isLocked(o),boss=isBoss();
  m.textContent="";S.editLocked=locked;$("x-body").hidden=locked;$("x-lockmsg").hidden=!locked;$("x-fix").hidden=!locked;
  if(locked){const w=o.cameriereId?nameOf(o.cameriereId,o.cameriere):"";
    $("x-lockmsg").textContent=`Ordine già partito${w?` (l'ha preso ${w})`:""}: non si modifica più, ma puoi togliere quello che non è ancora stato chiamato e restituire i soldi.${boss?" Sei master: puoi anche annullarlo del tutto (cucina e cameriere vedranno sparire le schede).":""}`;
    S.fix={rm:{},q:{},sq:{},xq:{},amt:null,sig:""}}
  S.editOrder=n;S.eqty={};righe(o).forEach(r=>{S.eqty[r.id]=r.qta});S.esqty={};singoli(o).forEach(s=>{S.esqty[s.pid+"|"+s.k]=s.qta});S.xpay=o.metodo||"contanti";
  $("x-off").value=o.offerta?o.offerta.toFixed(2).replace(".",","):"";$("x-title").textContent=(locked?"Rettifica ordine ":"Modifica ordine ")+n+(o.nome?" · "+o.nome:"")+(o.asporto?" · asporto":"");$("x-nome").value=o.nome||"";$("x-note").value=o.note||"";$("x-paid").checked=!!o.pagatoPrima;
  $("x-msg").textContent="";$("x-del-row").hidden=locked&&!boss;$("x-confirm-row").hidden=true;$("x-panel").hidden=false;$("c-last-wrap").hidden=true;
  renderEditSteppers();if(locked)renderFix(true);$("x-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
function closeEdit(){S.editOrder=null;S.fix=null;$("x-panel").hidden=true}

/* ---------- rettifica di un ordine già partito ---------- */
function fixCalc(o){
  const F=S.fix,noneCalled=orderCourses(o).every(c=>(c.p.stato||"attesa")==="attesa");
  const rr=righe(o).map(r=>({...r,qta:Math.min(r.qta,F.q[r.id]!=null?F.q[r.id]:r.qta)}));
  let ss=singoli(o).map(s=>({...s,qta:Math.min(s.qta,F.sq[s.pid+"|"+s.k]!=null?F.sq[s.pid+"|"+s.k]:s.qta)}));
  const xx=extras(o).map(x=>({...x,qta:Math.min(x.qta,F.xq[x.id]!=null?F.xq[x.id]:x.qta)}));
  let refund=0;const desc=[];
  righe(o).forEach((r,i)=>{const d=r.qta-rr[i].qta;if(d>0){if(!o.pagatoPrima)refund+=d*(r.prezzo||0);desc.push(`−${d} ${r.nome}`)}});
  singoli(o).forEach((s,i)=>{const d=s.qta-ss[i].qta;if(d>0){refund+=d*(s.prezzo||0);desc.push(`−${d} ${s.nome} singolo`)}});
  extras(o).forEach((x,i)=>{const d=x.qta-xx[i].qta;if(d>0){refund+=d*(x.prezzo||0);desc.push(`−${d} ${x.nome}`)}});
  let noPrice=[];
  orderCourses(o).filter(c=>F.rm[c.k]).forEach(c=>{const p=portataCfg(c.k)||{};let v=0,nP=0;
    if(!o.pagatoPrima&&!(p.prezzo>0)&&rr.some(r=>r.qta>0&&applies(portataCfg(c.k),r.id)))noPrice.push(c.l);
    if(!o.pagatoPrima)rr.filter(r=>r.qta>0&&applies(portataCfg(c.k),r.id)).forEach(r=>{v+=r.qta*((r.id==="bimbi"&&p.prezzoBimbi>0)?p.prezzoBimbi:(p.prezzo||0))});
    rr.filter(r=>r.qta>0&&applies(portataCfg(c.k),r.id)).forEach(r=>{nP+=r.qta});
    ss.filter(s=>s.pid===c.k&&s.qta>0).forEach(s=>{v+=s.qta*(s.prezzo||0);nP+=s.qta});
    refund+=v;desc.push(`tolto ${c.l} (${nP} ${nP===1?"piatto":"piatti"})`)});
  ss=ss.filter(s=>!F.rm[s.pid]);
  return {rr:rr.filter(r=>r.qta>0),ss:ss.filter(s=>s.qta>0),xx:xx.filter(x=>x.qta>0),refund:r2(Math.max(0,Math.min(refund,o.incassato||0))),desc,noneCalled,noPrice};
}
function fixStep(list,qmap,attr,key){return list.map(r=>{const k=key(r),cur=qmap[k]!=null?qmap[k]:r.qta;
  return `<div class="stepper"><span class="name">${esc(r.nome)} <span class="label">${cur<r.qta?"erano "+r.qta:""}</span></span><span class="ctl"><button ${attr}="${esc(k)}" data-max="${r.qta}" data-d="-1" aria-label="Togli ${esc(r.nome)}">−</button><output>${cur}</output><button ${attr}="${esc(k)}" data-max="${r.qta}" data-d="1" ${cur>=r.qta?"disabled":""} aria-label="Rimetti ${esc(r.nome)}">+</button></span></div>`}).join("")}
function refundM(o){return o.metodo==="misto"?((S.fix&&S.fix.m)||"contanti"):o.metodo==="pos"?"pos":"contanti"}
function renderFix(force){
  const o=orderByNum(S.editOrder),F=S.fix,box=$("x-fix");if(!o||!F)return;
  const sig=JSON.stringify([o,{...F,sig:""}]);if(!force&&sig===F.sig)return;F.sig=sig;
  const c=fixCalc(o),pend=orderCourses(o).filter(x=>(x.p.stato||"attesa")==="attesa");
  if(F.amt==null)$("x-fix").dataset.sugg=c.refund;
  const amt=F.amt!=null?F.amt:c.refund;
  box.innerHTML=`<span class="label">Piatti non ancora chiamati</span>
    ${pend.length?`<div class="chips">${pend.map(x=>`<button class="tog" data-fixrm="${esc(x.k)}" aria-pressed="${!F.rm[x.k]}">${esc(x.l)}</button>`).join("")}</div><p class="hint">Tocca un piatto per toglierlo dall'ordine (es. dolce finito, non lo vogliono).</p>`:'<div class="sub">Tutti i piatti sono già stati chiamati.</div>'}
    ${c.noneCalled&&(righe(o).length||singoli(o).length)?`<span class="label">Coperti (nessun piatto ancora chiamato)</span>${fixStep(righe(o),F.q,"data-fq",r=>r.id)}${fixStep(singoli(o).map(s=>({...s,nome:s.nome+" singolo"})),F.sq,"data-fsq",s=>s.pid+"|"+s.k)}`:""}
    ${extras(o).length?`<span class="label">Bevande ed extra</span>${fixStep(extras(o),F.xq,"data-fxq",x=>x.id)}`:""}
    <div class="sub">${c.desc.length?esc(c.desc.join(" · ")):"Scegli cosa togliere."}</div>
    ${c.noPrice.length?`<div class="note">${esc(c.noPrice.join(", "))}: nel Listino non c'è il prezzo da solo, quindi l'app non sa quanto vale dentro il menù. Scrivi tu quanto restituire.</div>`:""}
    ${o.metodo==="misto"?`<div class="payrow"><span class="label">Restituisci in</span><span class="seg" id="x-fixm">${["contanti","pos"].map(m=>`<button type="button" data-fixm="${m}" aria-pressed="${(F.m||"contanti")===m}">${m==="pos"?"POS":"Contanti"}</button>`).join("")}</span></div>`:""}
    <div class="payrow"><label class="label" for="x-fixamt">Da restituire (${PAY_LBL[refundM(o)]||"contanti"})</label><input type="text" id="x-fixamt" inputmode="decimal" class="pricein" value="${amt?amt.toFixed(2).replace(".",","):""}" placeholder="0,00 €"></div>
    ${c.refund>0&&F.amt!=null&&F.amt!==c.refund?`<div class="sub">Calcolato: ${money(c.refund)}</div>`:""}
    <button class="btn primary big" id="x-fixsave" ${c.desc.length?"":"disabled"}>Togli${amt>0?" e restituisci "+money(amt):""}</button>`;
}
$("x-fix").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||!S.fix)return;const F=S.fix;
  if(b.dataset.fixrm){F.rm[b.dataset.fixrm]=!F.rm[b.dataset.fixrm];F.amt=null;renderFix(true);return}
  if(b.dataset.fixm){F.m=b.dataset.fixm;renderFix(true);return}
  for(const [a,map] of [["fq","q"],["fsq","sq"],["fxq","xq"]])if(b.dataset[a]!=null){const k=b.dataset[a],max=+b.dataset.max,cur=F[map][k]!=null?F[map][k]:max;
    F[map][k]=Math.max(0,Math.min(max,cur+Number(b.dataset.d)));F.amt=null;renderFix(true);return}
  if(b.id==="x-fixsave")saveFix()});
$("x-fix").addEventListener("input",e=>{if(e.target.id==="x-fixamt"&&S.fix){S.fix.amt=parsePrice(e.target.value);S.fix.sig=JSON.stringify([orderByNum(S.editOrder),{...S.fix,sig:""}])}});
$("x-fix").addEventListener("change",e=>{if(e.target.id==="x-fixamt"&&S.fix)renderFix(true)});
async function saveFix(){
  const n=S.editOrder,o=orderByNum(n),m=$("x-msg"),F=S.fix;if(!o||!F)return;m.className="msg err";
  const c=fixCalc(o),late=orderCourses(o).filter(x=>F.rm[x.k]&&(x.p.stato||"attesa")!=="attesa");
  if(late.length){m.textContent=`${late.map(x=>x.l).join(", ")}: è appena stato chiamato, non si può più togliere.`;F.rm={};renderFix(true);return}
  const reduced=Object.keys(F.q).some(k=>F.q[k]<(righe(o).find(r=>r.id===k)||{}).qta)||Object.keys(F.sq).length&&singoli(o).some(s=>F.sq[s.pid+"|"+s.k]!=null&&F.sq[s.pid+"|"+s.k]<s.qta);
  if(reduced&&!c.noneCalled){m.textContent="Nel frattempo è stato chiamato un piatto: i coperti non si possono più togliere.";F.q={};F.sq={};renderFix(true);return}
  if(!c.rr.length&&!c.ss.length&&!c.xx.length){m.textContent="Così non resta niente: per togliere tutto serve «Annulla ordine» (solo il master).";return}
  const amt=r2(Math.max(0,Math.min(F.amt!=null?F.amt:c.refund,o.incassato||0)));
  const upd={righe:c.rr,singoli:c.ss,extra:c.xx,importoMenu:importo(c.rr),importoSingoli:importo(c.ss),importoExtra:importo(c.xx)};
  upd.importo=r2(upd.importoMenu+upd.importoSingoli+upd.importoExtra);
  const need=coursesFor(c.rr,c.ss,c.xx);
  Object.keys(o.portate||{}).forEach(k=>{if((F.rm[k]||!need[k])&&(o.portate[k].stato||"attesa")==="attesa")upd["portate/"+k]=null});
  upd.incassato=r2((o.incassato||0)-amt);upd.stornato=r2((o.stornato||0)+amt);
  const sid=rid("s"),rm=refundM(o);upd["storni/"+sid]={t:Date.now(),da:myName(),daId:S.me?S.me.id:"",cosa:c.desc.join(", "),importo:amt,metodo:rm};
  if(o.pagamenti&&amt>0)upd["pagamenti/"+sid]={i:-amt,m:rm,t:Date.now()};
  /* se si tolgono piatti a un pasto offerto, cala anche la parte offerta */
  if(o.offerto>0){const nOff=r2(Math.min(o.offerto,Math.max(0,upd.importo-((o.incassato||0)-amt))));if(nOff<o.offerto){upd.offerto=nOff;upd["pagamenti/"+sid+"o"]={i:r2(nOff-o.offerto),m:"offerto",t:Date.now()}}}
  try{await R("ordini/"+n).update(upd);m.className="msg ok";m.textContent="Rettifica salvata."+(amt>0?` Restituisci ${money(amt)} (${PAY_LBL[rm]}).`:"");
    logChange(`Ordine ${n}${o.nome?" ("+o.nome+")":""} rettificato: ${c.desc.join(", ")}${amt>0?` · restituiti ${money(amt)}`:""}`);
    S.fix={rm:{},q:{},sq:{},xq:{},amt:null,sig:"",m:F.m};renderFix(true)}
  catch(e){m.textContent=errText(e)}
}
function renderEditSteppers(){
  $("x-steppers").innerHTML=stepperHtml(S.varianti,S.eqty,"data-estep");
  const sl=singlesList();$("x-sing-box").hidden=!sl.length;$("x-sing").innerHTML=singlesHtml(S.esqty,"data-esstep");
  paintTotal("x",bill(S.eqty,{},$("x-paid").checked,S.esqty),$("x-paid").checked,S.xpay);
}
$("x-steppers").addEventListener("click",e=>{const b=e.target.closest("button[data-estep]");if(!b)return;
  const id=b.dataset.estep;S.eqty[id]=Math.max(0,(S.eqty[id]||0)+Number(b.dataset.d));renderEditSteppers()});
$("x-sing").addEventListener("click",e=>{const b=e.target.closest("button[data-esstep]");if(!b)return;
  const id=b.dataset.esstep;S.esqty[id]=Math.max(0,(S.esqty[id]||0)+Number(b.dataset.d));renderEditSteppers()});
$("x-pay").addEventListener("click",e=>{const b=e.target.closest("button[data-pay]");if(!b)return;S.xpay=b.dataset.pay;renderEditSteppers()});
$("x-paid").addEventListener("change",renderEditSteppers);
$("x-off").addEventListener("input",renderEditSteppers);
$("x-close").addEventListener("click",closeEdit);
$("x-save").addEventListener("click",async()=>{
  const n=S.editOrder,o=orderByNum(n),m=$("x-msg");if(!o){closeEdit();return}
  if(isLocked(o)){m.className="msg err";m.textContent=LOCK_MSG(n);return}
  const paid=$("x-paid").checked,b=bill(S.eqty,{},paid,S.esqty);
  if(!b.rr.length&&!b.ss.length&&!b.xx.length){m.className="msg err";m.textContent="L'ordine è vuoto. Per toglierlo usa «Annulla ordine».";return}
  /* un pasto offerto resta offerto fino al suo importo; il resto si paga */
  const oOff=o.offerto||0,nOff=r2(Math.min(oOff,b.due)),xoff=parsePrice($("x-off").value);
  const upd={nome:$("x-nome").value.trim(),note:$("x-note").value.trim(),righe:b.rr,extra:b.xx,importoMenu:b.menu,importoExtra:b.ext,importo:b.tot,
    singoli:b.ss,importoSingoli:b.sing,pagatoPrima:paid,incassato:r2(b.due-nOff),offerta:xoff};
  if(oOff>0)upd.offerto=nOff;
  const moved=r2(upd.incassato+xoff-(o.incassato||0)-(o.offerta||0));
  upd.metodo=moved===0?(o.metodo||(nOff>0?"offerto":"")):(o.metodo&&o.metodo!=="offerto"&&o.metodo!==S.xpay&&(o.incassato||0)>0?"misto":S.xpay);
  if(o.pagamenti){const pid=rid("p");if(moved)upd["pagamenti/"+pid]={i:moved,m:S.xpay,t:Date.now()};if(nOff!==oOff)upd["pagamenti/"+pid+"o"]={i:r2(nOff-oOff),m:"offerto",t:Date.now()}}
  const need=coursesFor(b.rr,b.ss,b.xx);Object.keys(need).forEach(k=>{if(!(o.portate&&o.portate[k]))upd["portate/"+k]=need[k]});
  Object.keys(o.portate||{}).forEach(k=>{if(!need[k])upd["portate/"+k]=null});
  const diff=moved;
  const before=orderDesc(righe(o),singoli(o),extras(o)),after=orderDesc(b.rr,b.ss,b.xx);
  try{
    const fresh=orderByNum(n);if(!fresh||isLocked(fresh)){m.className="msg err";m.textContent=fresh?LOCK_MSG(n):"L'ordine non esiste più.";return}
    const sp=stockProblemsDelta(fresh,b.rr,b.ss,b.xx),skey=JSON.stringify([S.eqty,S.esqty]);
    if(sp.length){m.className="msg err";if(!isBoss()){m.textContent=stockBlockMsg(sp);return}
      if(S.editStockWarn!==skey){S.editStockWarn=skey;m.textContent=stockTxt(sp)+". Sei master: premi di nuovo «Salva» per farlo lo stesso.";return}}
    await R("ordini/"+n).update(upd);m.className="msg ok";
    const money2=diff>0?` Incassa altri ${money(diff)} (${PAY_LBL[S.xpay]}).`:diff<0?` Restituisci ${money(-diff)}.`:"";
    m.textContent="Modifiche salvate."+money2;
    const ch=[before!==after?`${before} → ${after}`:"",(o.nome||"")!==upd.nome?`nome «${o.nome||""}» → «${upd.nome}»`:"",(o.note||"")!==upd.note?"note cambiate":"",diff?(diff>0?`incassati altri ${money(diff)}`:`restituiti ${money(-diff)}`):""].filter(Boolean).join(" · ");
    if(ch)logChange(`Ordine ${n} modificato: ${ch}`)}
  catch(e){m.className="msg err";m.textContent=errText(e)}
});
$("x-del").addEventListener("click",()=>{$("x-del-row").hidden=true;$("x-confirm-row").hidden=false});
$("x-del-no").addEventListener("click",()=>{$("x-del-row").hidden=false;$("x-confirm-row").hidden=true});
$("x-del-yes").addEventListener("click",async()=>{
  const n=S.editOrder,o=orderByNum(n);if(!o){closeEdit();return}
  const boss=!!S.me&&hasRole(S.me,"master");
  if(isLocked(o)&&!boss){$("x-confirm-row").hidden=true;$("x-del-row").hidden=false;$("x-msg").className="msg err";$("x-msg").textContent=LOCK_MSG(n);return}
  try{await burnOrder(n,o,r2((o.incassato||0)+(o.offerta||0)),isLocked(o)?"dal master dopo la partenza":"");
    closeEdit();const m=$("c-msg");const back=r2((o.incassato||0)+(o.offerta||0));m.className="msg ok";m.textContent=`Ordine ${n} annullato.`+(back>0?` Restituisci ${money(back)}${o.offerta>0?` (di cui ${money(o.offerta)} di offerta, se la vogliono indietro)`:""}.`:"")}
  catch(e){$("x-msg").className="msg err";$("x-msg").textContent=errText(e)}
});

