/* Cucina con reparti e uscita piatti */
/* ---------- CUCINA ---------- */
function breakdown(items){
  const by={};items.forEach(c=>righeFor(c.o,c.k).forEach(r=>{by[r.nome]=(by[r.nome]||0)+r.qta}));
  const tot=Object.values(by).reduce((a,b)=>a+b,0);
  return {tot,txt:Object.entries(by).map(([n,q])=>`${q} ${esc(n)}`).join(" · ")};
}
function kFilt(){const f=S.kFilt;return f&&S.portate.some(p=>p.id===f)?f:""}
function kWho(o,p){return o.asportoSubito||(o.asporto&&!ownerId(o))?"Asporto":(nameOf(p&&p.daId,p&&p.da)||nameOf(ownerId(o),o.cameriere)||"—")}
function renderKReps(){
  const box=$("k-reps"),fixed=myReps();
  if(fixed){box.hidden=false;box.innerHTML=`<span class="pill wait">Reparto ${fixed.map(r=>esc(repNome(r))).join(" + ")}</span>`;return}
  const ks=kitchenReps();if(ks.length<2){box.hidden=true;box.innerHTML="";return}
  const cur=ks.includes(S.kRep)?S.kRep:"";box.hidden=false;
  box.innerHTML=`<span class="label">Reparto</span><span class="seg">${[["","Tutti"],...ks.map(r=>[r,repNome(r)])].map(([id,n])=>`<button data-krep="${esc(id)}" aria-pressed="${cur===id}">${esc(n)}</button>`).join("")}</span>`;
}
$("k-reps").addEventListener("click",e=>{const b=e.target.closest("button[data-krep]");if(!b)return;S.kRep=b.dataset.krep;lsSet("krep",S.kRep);S.seenCalls=null;renderKitchen();checkEvents()});
/* pezzi di portata del reparto: stato del singolo reparto dentro una portata chiamata o pronta */
function repItems(stato,sc){
  const out=[];
  ordersArr().forEach(o=>orderCourses(o).forEach(c=>{const st=c.p.stato;if(st!=="chiamata"&&st!=="pronta")return;
    Object.entries(c.p.rep||{}).forEach(([r,v])=>{if(!sc.includes(r))return;const s=st==="pronta"?"pronta":(v.s||"chiamata");if(s!==stato)return;
      out.push({o,k:c.k,l:c.l,r,piatto:v.piatto||"",p:c.p,t:(s==="pronta"?(v.t||c.p.t):c.p.t)||0})})}));
  return out.sort((a,b)=>a.t-b.t);
}
/* chiamate di un gruppo di reparti, raggruppate per cliente (usato da cucina e bar) */
function renderRepView(sc,ids){
  const calls=repItems("chiamata",sc),ready=repItems("pronta",sc);
  const ports=S.portate.filter(p=>portReps(p).some(x=>sc.includes(x.r)));
  $(ids.sum).innerHTML=ports.length?ports.map(p=>{const b=breakdown(calls.filter(c=>c.k===p.id)),l=stockLeft(p.id);
    return `<div class="${b.tot?"":"zero"}"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${b.tot}</b><span class="brk">${b.tot?b.txt:"—"}</span>${l!=null?`<span class="left ${stockCls(l)}">${l<=0?"Esaurito":l===1?"Resta 1 porzione":"Restano "+l+" porzioni"}</span>`:""}</div>`}).join("")
    :'<div class="zero"><span class="label">Nessun piatto</span><span class="brk">A questo reparto non è assegnato nessun piatto: chiedi al master (Listino → Piatti).</span></div>';
  const groups=[];calls.forEach(c=>{let g=groups.find(x=>x.o.numero===c.o.numero);if(!g){g={o:c.o,t:c.t,items:[]};groups.push(g)}g.items.push(c);if(c.t<g.t)g.t=c.t});
  const key=c=>c.o.numero+"|"+c.k+"|"+c.r,dis=c=>S.pending.has(key(c))?"disabled":"";
  $(ids.queue).innerHTML=groups.length?groups.map(g=>{const o=g.o,late=g.t&&(Date.now()-g.t)>15*60000,wn=kWho(o,g.items[0].p),many=g.items.length>1;
    return `<article class="kcard ${late?"late":""}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${ago(g.t)}</span></div>
      <div class="what kcourse"><span class="label">n. ${o.numero}${o.nome?" · "+esc(o.nome):""}</span>${o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      <ul class="kitems">${g.items.map(c=>{const q=cop(righeFor(o,c.k));return `<li><b>${q}</b><span class="kin" style="color:${portColor(c.k)}">${esc(c.l)}</span>${many?`<button class="btn small" ${dis(c)} data-rset="${o.numero}|${c.k}|${esc(c.r)}">Pronto</button>`:""}</li>`}).join("")}</ul>
      ${o.note?`<div class="note">${esc(o.note)}</div>`:""}
      ${many?`<button class="btn primary big" data-rsetall="${o.numero}|${g.items.map(c=>c.k+"~"+c.r).join(",")}">Tutto pronto</button>`
        :`<button class="btn primary big" ${dis(g.items[0])} data-rset="${o.numero}|${g.items[0].k}|${esc(g.items[0].r)}">Pronto</button>`}</article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da preparare.</div></div>';
  $(ids.ready).innerHTML=ready.length?ready.map(c=>{const wn=kWho(c.o,c.p),q=cop(righeFor(c.o,c.k)),stale=c.p.t&&(Date.now()-c.p.t)>5*60000;
    return `<div class="li plain two ${stale?"stale":""}"><span><b class="kwho">${esc(wn)}</b> · <b style="color:${portColor(c.k)}">${q} ${esc(c.l)}</b><div class="sub">n. ${c.o.numero}${c.o.nome?" · "+esc(c.o.nome):""} · pronto ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
      <span class="row"><button class="btn small go" ${S.pending.has(c.o.numero+"|"+c.k)?"disabled":""} data-set="${c.o.numero}|${c.k}|servita">Portato</button><button class="btn small" ${dis(c)} data-runready="${c.o.numero}|${c.k}|${esc(c.r)}">Annulla</button></span></div>`}).join("")
    :'<div class="empty">Nessuno.</div>';
  paintStockLeft();
}
function renderKitchenRep(sc){$("k-filt").hidden=true;renderRepView(sc,{sum:"k-sum",queue:"k-queue",ready:"k-ready"})}
async function setPart(n,k,r,to,opts){
  const key=n+"|"+k+"|"+r;if(S.pending.has(key))return;S.pending.add(key);schedule();
  const o=orderByNum(n);let done=false;
  try{
    const tr=await R(`ordini/${n}/portate/${k}`).transaction(cur=>{if(cur==null)return cur;const rep=cur.rep||{};if(!rep[r])return;
      if(to==="pronta"){if(cur.stato!=="chiamata"||rep[r].s==="pronta")return;
        const nx={...cur,rep:{...rep,[r]:{...rep[r],s:"pronta",t:Date.now()}}};
        if(Object.values(nx.rep).every(x=>x.s==="pronta")){nx.tc=cur.t||null;nx.stato="pronta";nx.t=Date.now();delete nx.annull}
        return nx}
      if(cur.stato==="servita")return;if(!(rep[r].s==="pronta"||cur.stato==="pronta"))return;
      const nx={...cur,rep:{...rep,[r]:{...rep[r],s:"chiamata"}}};delete nx.rep[r].t;
      if(cur.stato==="pronta"){nx.stato="chiamata";nx.t=cur.tc||Date.now();delete nx.tc;nx.annull="pronta"}
      return nx});
    done=!!(tr&&tr.committed&&tr.snapshot&&tr.snapshot.val()!=null);
    const v=done?tr.snapshot.val():null,pn=(v&&v.rep&&v.rep[r]&&(v.rep[r].piatto||v.rep[r].nome))||repNome(r),c=((o&&orderCourses(o).find(x=>x.k===k))||{}).l||k;
    if(!done){toast(to==="pronta"?"Qualcun altro l'ha appena aggiornato: guarda lo stato attuale.":`${c} · n. ${n}: già portato, non si può annullare`,{ms:4000});return}
    if(opts&&opts.silent)return;
    if(to==="pronta")toast(`${o?kWho(o,v):"n. "+n} · ${pn} pronto${v.stato==="pronta"?` · ${c} completo`:""}`,{ms:5000,action:{label:"Annulla",fn:()=>setPart(n,k,r,"chiamata",{silent:true})}});
    else toast(`${pn} · n. ${n}: di nuovo da preparare`,{ms:4000});
  }catch(e){showBanner(errText(e))}
  finally{S.pending.delete(key);schedule()}
}
document.addEventListener("click",e=>{const b=e.target.closest("button[data-rset]");if(b&&!b.disabled){const [n,k,r]=b.dataset.rset.split("|");setPart(Number(n),k,r,"pronta")}});
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rsetall]");if(!b||b.disabled)return;b.disabled=true;
  const [n,list]=b.dataset.rsetall.split("|"),its=list.split(",").map(x=>x.split("~"));
  for(const [k,r] of its)await setPart(Number(n),k,r,"pronta",{silent:true});
  const o=orderByNum(Number(n));toast(`${o?kWho(o,null)+" · ":""}n. ${n}: tutto pronto`,{ms:4000})});
document.addEventListener("click",e=>{const b=e.target.closest("button[data-runready]");if(!b||b.disabled)return;if(!armed(b,"Non pronto?"))return;
  const [n,k,r]=b.dataset.runready.split("|");setPart(Number(n),k,r,"chiamata")});
function renderKitchen(){
  renderKReps();const sc=kScope();if(sc){renderKitchenRep(sc);return}
  const f=kFilt(),inF=c=>!f||c.k===f;
  const calls=flatCourses("chiamata"),ready=flatCourses("pronta");
  $("k-sum").innerHTML=S.portate.map(p=>{const b=breakdown(calls.filter(c=>c.k===p.id)),l=stockLeft(p.id);
    const cls=[b.tot?"":"zero",f===p.id?"kon":f?"dim":""].join(" ");
    return `<div class="${cls}" data-kf="${esc(p.id)}" role="button" tabindex="0"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${b.tot}</b><span class="brk">${b.tot?b.txt:"—"}</span>${l!=null?`<span class="left ${stockCls(l)}">${l<=0?"Esaurito":l===1?"Resta 1 porzione":"Restano "+l+" porzioni"}</span>`:""}</div>`}).join("");
  const fp=S.portate.find(p=>p.id===f);
  $("k-filt").hidden=!fp;if(fp)$("k-filt").innerHTML=`<span>Solo ${esc(fp.nome)}</span><button class="btn" id="k-all">Mostra tutto</button>`;
  S.portate.forEach(p=>{const el=$("sl-"+p.id);if(el){const l=stockLeft(p.id);el.textContent=l==null?"nessun limite":leftTxt(l);el.className="sub "+stockCls(l)}});
  const q=calls.filter(inF),r=ready.filter(inF),dis=c=>S.pending.has(c.o.numero+"|"+c.k)?"disabled":"";
  $("k-queue").innerHTML=q.length?q.map(c=>{const late=c.t&&(Date.now()-c.t)>15*60000;const rf=righeFor(c.o,c.k);
    const wn=kWho(c.o,c.o.portate[c.k]),pt=partsTxt(c.o.portate[c.k]);
    return `<article class="kcard ${late?"late":""}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${ago(c.t)}</span></div>
      <div class="what kcourse"><span style="color:${portColor(c.k)}">${esc(c.l)}</span> <span class="label">· n. ${c.o.numero}</span>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      <ul>${rf.map(r=>`<li><b>${r.qta}</b>${esc(r.nome)}</li>`).join("")}</ul>
      ${c.o.note?`<div class="note">${esc(c.o.note)}</div>`:""}
      ${pt?`<div class="kparts">Reparti: ${pt}</div>`:""}
      <button class="btn primary big" ${dis(c)} data-set="${c.o.numero}|${c.k}|pronta">${pt?"Tutto pronto":"Pronta"}</button></article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da preparare.</div></div>';
  $("k-ready").innerHTML=r.length?r.map(c=>{const stale=c.t&&(Date.now()-c.t)>5*60000;
    const wn=kWho(c.o,c.o.portate[c.k]);
    return `<div class="li plain two ${stale?"stale":""}"><span><b class="kwho">${esc(wn)}</b> · <b style="color:${portColor(c.k)}">${esc(c.l)}</b><div class="sub">n. ${c.o.numero} · pronta ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
      <span class="row"><button class="btn small go" ${S.pending.has(c.o.numero+"|"+c.k)?"disabled":""} data-set="${c.o.numero}|${c.k}|servita">Portato</button><button class="btn small" ${S.pending.has(c.o.numero+"|"+c.k)?"disabled":""} data-kunready="${c.o.numero}|${c.k}">Annulla</button></span></div>`}).join("")
    :'<div class="empty">Nessuna.</div>';
}
$("k-ready").addEventListener("click",async e=>{const b=e.target.closest("button[data-kunready]");if(!b||b.disabled)return;
  if(!armed(b,"Non pronta?"))return;const [n,k]=b.dataset.kunready.split("|"),o=orderByNum(Number(n)),pp=o&&o.portate&&o.portate[k];
  if(!pp||pp.stato!=="pronta")return;
  const rp=pp.rep?Object.fromEntries(Object.entries(pp.rep).map(([r,v])=>{const x={...v,s:"chiamata"};delete x.t;return [r,x]})):null;
  try{const ok=await transStato(`ordini/${n}/portate/${k}`,"pronta",{stato:"chiamata",t:pp.tc||Date.now(),annull:"pronta",rep:rp});const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;
    toast(ok?`${c} · n. ${n}: di nuovo da preparare`:`${c} · n. ${n}: già portato, non si può annullare`,{ms:4000})}
  catch(err){showBanner(errText(err))}});
$("k-sum").addEventListener("click",e=>{const d=e.target.closest("[data-kf]");if(!d)return;S.kFilt=kFilt()===d.dataset.kf?"":d.dataset.kf;lsSet("kfiltro",S.kFilt);renderKitchen()});
$("k-sum").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const d=e.target.closest("[data-kf]");if(d){e.preventDefault();d.click()}}});
$("k-filt").addEventListener("click",e=>{if(e.target.id==="k-all"){S.kFilt="";lsSet("kfiltro","");renderKitchen()}});

function stockRows(list){return list.length?list.map(p=>`<div class="xrow"><b>${esc(p.nome)}</b><span class="sub" id="sl-${esc(p.id)}"></span>
    <input type="number" inputmode="numeric" id="sc-${esc(p.id)}" placeholder="quante" aria-label="Quante porzioni di ${esc(p.nome)} aggiungi">
    <button class="btn" data-addp="${esc(p.id)}">+ Aggiungi</button></div>`).join(""):'<div class="empty">Nessun piatto.</div>'}
function paintStockLeft(){S.portate.forEach(p=>{const el=$("sl-"+p.id);if(el){const l=stockLeft(p.id);el.textContent=l==null?"nessun limite":leftTxt(l);el.className="sub "+stockCls(l)}})}
function renderStockEditor(){
  const br=barReps(),isBar=p=>portReps(p).some(x=>br.includes(x.r));
  $("k-stock").innerHTML=stockRows(S.portate.filter(p=>!isBar(p)));$("b-stock").innerHTML=stockRows(S.portate.filter(isBar));
  if(S.role==="cucina")renderKitchen();if(S.role==="bar")renderBar();
}
const renderBarStock=renderStockEditor;
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-addp]");if(!b)return;const id=b.dataset.addp,inp=$("sc-"+id),n=parseInt(inp.value,10),m=$(b.closest("#b-stock")?"b-stock-msg":"k-stock-msg");
  if(!n){inp.focus();return}
  const used=usedFor(id);b.disabled=true;
  R("config/scorte/"+id).transaction(cur=>{const base=(cur==null||cur==="")?used:Number(cur);return Math.max(used,base+n)})
    .then(()=>{const x=S.portate.find(e=>e.id===id);m.className="msg ok";m.textContent=`${x?x.nome:""}: ${n>0?"+":""}${n}`;inp.value=""},err=>{m.className="msg err";m.textContent=errText(err)})
    .finally(()=>{b.disabled=false});
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id&&e.target.id.startsWith("sc-")){const b=e.target.parentNode.querySelector("button[data-addp]");b&&b.click()}});

/* ---------- USCITA PIATTI: chi sta al bancone e consegna ai camerieri ---------- */
/* reparti dell'uscita: chi ha un reparto assegnato in Persone vede solo quello; gli altri scelgono */
function oFixed(){if(!S.me||hasRole(S.me,"master")||!hasRole(S.me,"uscita"))return null;const rs=userReps(S.me);return rs.length?rs:null}
function oScope(){const f=oFixed();if(f)return f;const ks=kitchenReps();if(S.oRep&&ks.includes(S.oRep))return [S.oRep];return ks.length?ks:null}
/* i reparti di una portata dell'ordine: quelli fissati quando è stata chiamata, altrimenti quelli del listino */
function courseReps(o,k){const p=o.portate&&o.portate[k];const snap=Object.keys((p&&p.rep)||{});return snap.length?snap:portReps(portataCfg(k)).map(x=>x.r)}
function inOScope(c,sc){return !sc||courseReps(c.o,c.k).some(r=>sc.includes(r))}
function renderUscita(){
  const sc=oScope(),fixed=oFixed(),box=$("o-reps");
  if(fixed){box.hidden=false;box.innerHTML=`<span class="pill wait">Reparto ${fixed.map(r=>esc(repNome(r))).join(" + ")}</span>`}
  else if(kitchenReps().length<2){box.hidden=true;box.innerHTML=""}
  else{box.hidden=false;const cur=kitchenReps().includes(S.oRep)?S.oRep:"";
    box.innerHTML=`<span class="label">Reparto</span><span class="seg">${[["","Tutti"],...kitchenReps().map(r=>[r,repNome(r)])].map(([id,n])=>`<button data-orep="${esc(id)}" aria-pressed="${cur===id}">${esc(n)}</button>`).join("")}</span>`}
  const ready=flatCourses("pronta").filter(c=>!c.o.asportoSubito&&inOScope(c,sc));
  $("o-ready").innerHTML=ready.length?ready.map(c=>{const stale=c.t&&(Date.now()-c.t)>5*60000,rf=righeFor(c.o,c.k),n=cop(rf),wn=kWho(c.o,c.o.portate[c.k]);
    const dis=S.pending.has(c.o.numero+"|"+c.k)?"disabled":"";
    const parts=partsOf(c.o.portate[c.k]).map(x=>x.piatto||x.nome).join(" + ");
    return `<article class="kcard ${stale?"late":""}"><div class="top"><span class="n nm">${c.o.numero}</span><span class="age">pronto ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</span></div>
      <div class="what kcourse"><span style="color:${portColor(c.k)}">${esc(c.l)}</span> <span class="label">· ${n} ${n===1?"piatto":"piatti"}</span></div>
      ${parts?`<div class="kparts">${esc(parts)}</div>`:""}
      <div class="who">${esc(wn)}${c.o.fila?" · "+esc(filaNome(c.o.fila)):""}${c.o.nome?" · "+esc(c.o.nome):""}</div>
      <ul>${rf.map(r=>`<li><b>${r.qta}</b>${esc(r.nome)}</li>`).join("")}</ul>
      ${c.o.note?`<div class="note">${esc(c.o.note)}</div>`:""}
      <button class="btn go big" ${dis} data-set="${c.o.numero}|${c.k}|servita">Consegnato</button></article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da consegnare.</div></div>';
  const wip=flatCourses("chiamata").filter(c=>!c.o.asportoSubito&&inOScope(c,sc));
  $("o-wip").innerHTML=wip.length?wip.map(c=>{const pt=partsTxt(c.o.portate[c.k]);
    return `<div class="li plain two"><span><b>n. ${c.o.numero}</b> · <b style="color:${portColor(c.k)}">${esc(c.l)}</b> · ${cop(righeFor(c.o,c.k))} piatti<div class="sub">${esc(kWho(c.o,c.o.portate[c.k]))}${c.o.fila?" · "+esc(filaNome(c.o.fila)):""} · chiamata ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}${pt?" · "+pt:""}</div></span></div>`}).join("")
    :'<div class="empty">Niente in preparazione.</div>';
  const done=flatCourses("servita").filter(c=>!c.o.asportoSubito&&inOScope(c,sc)&&c.t&&Date.now()-c.t<3*60000).sort((a,b)=>b.t-a.t).slice(0,12);
  $("o-done").innerHTML=done.length?done.map(c=>`<div class="li plain two"><span><b>n. ${c.o.numero}</b> · <b style="color:${portColor(c.k)}">${esc(c.l)}</b> · ${cop(righeFor(c.o,c.k))} piatti<div class="sub">${esc(kWho(c.o,c.o.portate[c.k]))} · consegnato ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
      <button class="btn small" ${S.pending.has(c.o.numero+"|"+c.k)?"disabled":""} data-unserve="${c.o.numero}|${c.k}">Non consegnato</button></div>`).join("")
    :'<div class="empty">Niente.</div>';
}
$("o-done").addEventListener("click",async e=>{const b=e.target.closest("button[data-unserve]");if(!b||b.disabled)return;b.disabled=true;const [n,k]=b.dataset.unserve.split("|");await unserve(Number(n),k)});
$("o-reps").addEventListener("click",e=>{const b=e.target.closest("button[data-orep]");if(!b)return;S.oRep=b.dataset.orep;lsSet("orep",S.oRep);S.seenOut=null;renderUscita()});
$("o-sound").addEventListener("click",()=>toggleSound());

