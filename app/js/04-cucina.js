/* Cucina con reparti e uscita piatti */
/* ---------- CUCINA ---------- */
function breakdown(items){
  const by={};items.forEach(c=>{const sc=toArr(((c.o.portate||{})[c.k]||{}).sc).filter(x=>x&&x.q>0);
    if(sc.length)sc.forEach(x=>{by[x.n]=(by[x.n]||0)+x.q});else by[""]=(by[""]||0)+cop(righeFor(c.o,c.k))});
  const tot=Object.values(by).reduce((a,b)=>a+b,0);delete by[""];
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
/* pronti in parte (cucina, bar, uscita): −/+ sul numero; il resto resta da preparare come «2ª volta» */
function kNowOf(o,k){const q=cop(righeFor(o,k)),st=S.kNow[o.numero+"|"+k];return st&&st.q===q?Math.max(1,Math.min(q,st.x)):q}
function kQtyHtml(o,k){const q=cop(righeFor(o,k));if(q<2)return `<b>${q}</b>`;const x=kNowOf(o,k),key=`${o.numero}|${esc(k)}`;
  return qtyField("kqi",key,x,q,`Quanti ${piattoNome(k)} sono pronti`)}
const prontoLbl=(o,k)=>{const q=cop(righeFor(o,k)),x=kNowOf(o,k);return x<q?`Pronti ${x}`:"Pronto"};

/* divide un piatto chiamato: x restano in questa riga, gli altri vanno in una riga nuova ancora «chiamata» */
async function splitCalled(n,k,x){const o=orderByNum(n),p=o&&o.portate&&o.portate[k];if(!p||p.stato!=="chiamata")return false;
  const q=cop(righeFor(o,k)),later=q-x;if(!(x>=1&&later>=1))return true;
  const b=kBase(k),D=o.dopo||{},used=[...Object.keys(o.portate),...Object.keys(D)].filter(y=>kBase(y)===b).map(kRound),nk=b+"~"+(Math.max(1,...used)+1);
  const sc=toArr(p.sc).filter(Boolean);let a=x;const sc1=[],sc2=[];sc.forEach(s=>{const t=Math.min(s.q,a);a-=t;sc1.push({n:s.n,q:t});sc2.push({n:s.n,q:s.q-t})});
  const rep=p.rep?Object.fromEntries(Object.entries(p.rep).map(([r,v])=>{const y={...v,s:"chiamata"};delete y.t;return [r,y]})):null;
  const nx={...p,stato:"chiamata"};if(rep)nx.rep=rep;if(sc.length)nx.sc=sc2;
  const upd={["dopo/"+nk]:later,["portate/"+nk]:nx};if(k!==b)upd["dopo/"+k]=(D[k]||0)-later;if(sc.length)upd["portate/"+k+"/sc"]=sc1;
  try{await R("ordini/"+n).update(upd);delete S.kNow[n+"|"+k];return true}catch(e){showBanner(errText(e));return false}}
/* prima di segnare pronto: se il numero è stato abbassato, divide; ritorna [quanti pronti, quanti restano] */
async function prepPart(n,k){const o=orderByNum(n);if(!o)return null;const q=cop(righeFor(o,k)),x=kNowOf(o,k);if(x>=q)return [q,0];return (await splitCalled(n,k,x))?[x,q-x]:null}
const partToast=(n,k,r)=>{const o=orderByNum(n);toast(`${o?kWho(o,o.portate&&o.portate[k])+" · ":""}${r[0]} ${piattoNome(k)} pronti · ${r[1]} ancora da preparare`,{ms:5000})};
/* chiamate di un gruppo di reparti, raggruppate per cliente (usato da cucina e bar) */
function renderRepView(sc,ids){
  const calls=repItems("chiamata",sc),ready=repItems("pronta",sc);
  const ports=S.portate.filter(p=>portReps(p).some(x=>sc.includes(x.r)));
  $(ids.sum).innerHTML=ports.length?ports.map(p=>{const b=breakdown(calls.filter(c=>kBase(c.k)===p.id)),l=stockLeft(p.id);
    return `<div class="${b.tot?"":"zero"}"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${b.tot}</b><span class="brk">${b.tot?b.txt:"—"}</span>${l!=null?`<span class="left ${stockCls(l)}">${l<=0?"Esaurito":l===1?"Resta 1 porzione":"Restano "+l+" porzioni"}</span>`:""}</div>`}).join("")
    :'<div class="zero"><span class="label">Nessun piatto</span><span class="brk">A questo reparto non è assegnato nessun piatto: chiedi al master (Listino → Piatti).</span></div>';
  const groups=[];calls.forEach(c=>{let g=groups.find(x=>x.o.numero===c.o.numero);if(!g){g={o:c.o,t:c.t,items:[]};groups.push(g)}g.items.push(c);if(c.t<g.t)g.t=c.t});
  const key=c=>c.o.numero+"|"+c.k+"|"+c.r,dis=c=>S.pending.has(key(c))?"disabled":"";
  $(ids.queue).innerHTML=groups.length?groups.map(g=>{const o=g.o,late=g.items.some(c=>isLate(c.k,c.t)),wn=kWho(o,g.items[0].p),many=g.items.length>1;
    const tn=tintCls(g.items.map(c=>c.k));
    return `<article class="kcard ${late?"late":""}${tn.c}"${tn.s}><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${ago(g.t)}</span></div>
      <div class="what kcourse"><span class="label">n. ${o.numero}${o.nome?" · "+esc(o.nome):""}</span>${o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      <ul class="kitems">${g.items.map(c=>{const q=cop(righeFor(o,c.k));return `<li class="${isLate(c.k,c.t)?"klate":""}" style="--pc:${portColor(c.k)}">${kQtyHtml(o,c.k)}<span class="kin" style="color:${portColor(c.k)}">${esc(c.l)}${scTxt(c.p)?` <small class="ksc">${esc(scTxt(c.p))}</small>`:""}</span>${many?`<button class="btn small kbtn" ${dis(c)} data-rset="${o.numero}|${c.k}|${esc(c.r)}">${prontoLbl(o,c.k)}</button>`:""}</li>`}).join("")}</ul>
      ${o.note?`<div class="note">${esc(o.note)}</div>`:""}
      ${many?`<button class="btn primary big" data-rsetall="${o.numero}|${g.items.map(c=>c.k+"~"+c.r).join(",")}">${g.items.some(c=>kNowOf(o,c.k)<cop(righeFor(o,c.k)))?"Segna pronti questi":"Tutto pronto"}</button>`
        :`<button class="btn primary big" ${dis(g.items[0])} data-rset="${o.numero}|${g.items[0].k}|${esc(g.items[0].r)}">${prontoLbl(o,g.items[0].k)}</button>`}</article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da preparare.</div></div>';
  $(ids.ready).innerHTML=ready.length?ready.map(c=>{const wn=kWho(c.o,c.p),q=cop(righeFor(c.o,c.k)),stale=c.p.t&&(Date.now()-c.p.t)>5*60000;
    return `<div class="li plain two ${stale?"stale":""}"><span><b class="kwho">${esc(wn)}</b> · <b style="color:${portColor(c.k)}">${q} ${esc(c.l)}</b>${scTxt(c.p)?` <small>(${esc(scTxt(c.p))})</small>`:""}<div class="sub">n. ${c.o.numero}${c.o.nome?" · "+esc(c.o.nome):""} · pronto ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
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
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rset]");if(!b||b.disabled)return;const [n,k,r]=b.dataset.rset.split("|");
  const pr=await prepPart(Number(n),k);if(!pr)return;await setPart(Number(n),k,r,"pronta",pr[1]?{silent:true}:undefined);if(pr[1])partToast(Number(n),k,pr)});
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rsetall]");if(!b||b.disabled)return;b.disabled=true;
  const [n,list]=b.dataset.rsetall.split("|"),its=list.split(",").map(x=>{const i=x.lastIndexOf("~");return [x.slice(0,i),x.slice(i+1)]});
  for(const [k,r] of its){if(!(await prepPart(Number(n),k)))continue;await setPart(Number(n),k,r,"pronta",{silent:true})}
  const o=orderByNum(Number(n));toast(`${o?kWho(o,null)+" · ":""}n. ${n}: tutto pronto`,{ms:4000})});
document.addEventListener("click",e=>{const b=e.target.closest("button[data-runready]");if(!b||b.disabled)return;if(!armed(b,"Non pronto?"))return;
  const [n,k,r]=b.dataset.runready.split("|");setPart(Number(n),k,r,"chiamata")});
function renderKitchen(){
  renderKReps();const sc=kScope();if(sc){renderKitchenRep(sc);return}
  const f=kFilt(),inF=c=>!f||kBase(c.k)===f;
  const calls=flatCourses("chiamata"),ready=flatCourses("pronta");
  $("k-sum").innerHTML=S.portate.map(p=>{const b=breakdown(calls.filter(c=>kBase(c.k)===p.id)),l=stockLeft(p.id);
    const cls=[b.tot?"":"zero",f===p.id?"kon":f?"dim":""].join(" ");
    return `<div class="${cls}" data-kf="${esc(p.id)}" role="button" tabindex="0"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${b.tot}</b><span class="brk">${b.tot?b.txt:"—"}</span>${l!=null?`<span class="left ${stockCls(l)}">${l<=0?"Esaurito":l===1?"Resta 1 porzione":"Restano "+l+" porzioni"}</span>`:""}</div>`}).join("");
  const fp=S.portate.find(p=>p.id===f);
  $("k-filt").hidden=!fp;if(fp)$("k-filt").innerHTML=`<span>Solo ${esc(fp.nome)}</span><button class="btn" id="k-all">Mostra tutto</button>`;
  S.portate.forEach(p=>{const el=$("sl-"+p.id);if(el){const l=stockLeft(p.id);el.textContent=l==null?"nessun limite":leftTxt(l);el.className="sub "+stockCls(l)}});
  const q=calls.filter(inF),r=ready.filter(inF),dis=c=>S.pending.has(c.o.numero+"|"+c.k)?"disabled":"";
  $("k-queue").innerHTML=q.length?q.map(c=>{const late=isLate(c.k,c.t);const rf=righeFor(c.o,c.k);
    const wn=kWho(c.o,c.o.portate[c.k]),pt=partsTxt(c.o.portate[c.k]);
    return `<article class="kcard ${late?"late":""} tint" style="--pc:${portColor(c.k)}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${ago(c.t)}</span></div>
      <div class="what kcourse"><span class="kqn">${cop(rf)}</span> <span style="color:${portColor(c.k)}">${esc(c.l)}</span> <span class="label">· n. ${c.o.numero}</span>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      ${scTxt(c.o.portate[c.k])?`<div class="kparts ksc">${esc(scTxt(c.o.portate[c.k]))}</div>`:""}
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
  /* asporto mandato subito: si prepara e si consegna tutto insieme, una scheda per ordine */
  const aspO=ordersArr().filter(o=>o.asportoSubito&&orderCourses(o).some(c=>c.p.stato!=="servita")&&orderCourses(o).some(c=>inOScope({o,k:c.k},sc))).sort((a,b)=>a.numero-b.numero);
  const allReady=o=>orderCourses(o).every(c=>c.p.stato==="pronta"||c.p.stato==="servita");
  const aspR=aspO.filter(allReady),aspW=aspO.filter(o=>!allReady(o));
  const ready=flatCourses("pronta").filter(c=>!c.o.asportoSubito&&inOScope(c,sc));
  const aspCard=o=>{const cs=orderCourses(o).filter(c=>c.p.stato!=="servita"),t=Math.max(...cs.map(c=>c.p.t||0)),stale=t&&(Date.now()-t)>5*60000,n=cs.reduce((a,c)=>a+cop(righeFor(o,c.k)),0);
    const tn=tintCls(cs.map(c=>c.k));
    return `<article class="kcard ${stale?"late":""}${tn.c}"${tn.s}><div class="top"><span class="n nm">Asporto</span><span class="age">pronto ${ago(t)==="adesso"?"adesso":"da "+ago(t)}</span></div>
      <div class="what kcourse"><span class="label">n. ${o.numero}${o.nome?" · "+esc(o.nome):""} · tutto insieme, ${n} ${n===1?"piatto":"piatti"}</span></div>
      <ul>${cs.map(c=>`<li style="--pc:${portColor(c.k)}"><b>${cop(righeFor(o,c.k))}</b><span style="color:${portColor(c.k)};font-weight:700">${esc(c.l)}</span>${scTxt(c.p)?` <small class="ksc">${esc(scTxt(c.p))}</small>`:""}</li>`).join("")}</ul>
      ${o.note?`<div class="note">${esc(o.note)}</div>`:""}
      <button class="btn go big" ${cs.some(c=>S.pending.has(o.numero+"|"+c.k))?"disabled":""} data-ocons="${o.numero}">Consegnato tutto</button></article>`};
  /* totali per piatto: pronti da consegnare e in preparazione */
  const inSc=c=>inOScope(c,sc),rdy=flatCourses("pronta").filter(inSc),cal=flatCourses("chiamata").filter(inSc);
  const ports=S.portate.filter(p=>!sc||portReps(p).some(x=>sc.includes(x.r)));
  const tot=(L,id)=>L.filter(c=>kBase(c.k)===id).reduce((a,c)=>a+cop(righeFor(c.o,c.k)),0);
  $("o-sum").innerHTML=ports.map(p=>{const r=tot(rdy,p.id),w=tot(cal,p.id);
    return `<div class="${r||w?"":"zero"}"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${r}</b><span class="brk">${r===1?"pronto":"pronti"}${w?` · ${w} in preparazione`:""}</span></div>`}).join("");
  $("o-ready").innerHTML=(ready.length||aspR.length)?aspR.map(aspCard).join("")+ready.map(c=>{const stale=c.t&&(Date.now()-c.t)>5*60000,rf=righeFor(c.o,c.k),n=cop(rf),wn=kWho(c.o,c.o.portate[c.k]);
    const dis=S.pending.has(c.o.numero+"|"+c.k)?"disabled":"";
    const pp=partsOf(c.o.portate[c.k]),parts=pp.length>1?pp.map(x=>x.piatto||x.nome).join(" + "):"";
    return `<article class="kcard ${stale?"late":""} tint" style="--pc:${portColor(c.k)}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">pronto ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</span></div>
      <div class="what kcourse"><span class="label">${c.o.fila?esc(filaNome(c.o.fila))+" · ":""}n. ${c.o.numero}${c.o.nome?" · "+esc(c.o.nome):""}</span>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      <div class="what kcourse"><span class="kqn">${n}</span> <span style="color:${portColor(c.k)}">${esc(c.l)}</span></div>
      ${parts?`<div class="kparts">${esc(parts)}</div>`:""}
      ${scTxt(c.o.portate[c.k])?`<div class="kparts ksc">${esc(scTxt(c.o.portate[c.k]))}</div>`:""}
      ${c.o.note?`<div class="note">${esc(c.o.note)}</div>`:""}
      <button class="btn go big" ${dis} data-set="${c.o.numero}|${c.k}|servita">Consegnato</button></article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da consegnare.</div></div>';
  const wip=flatCourses("chiamata").filter(c=>!c.o.asportoSubito&&inOScope(c,sc));
  const aspLine=o=>{const cs=orderCourses(o).filter(c=>c.p.stato!=="servita"),busy=cs.some(c=>S.pending.has(o.numero+"|"+c.k)),mine=cs.some(c=>c.p.stato==="chiamata"&&inOScope({o,k:c.k},sc));
    return `<div class="li plain two"><span><b class="kwho">Asporto</b> · n. ${o.numero}${o.nome?" · "+esc(o.nome):""}<div class="sub">tutto insieme: ${cs.map(c=>`<span style="color:${portColor(c.k)}">${esc(c.l)}</span> ${c.p.stato==="pronta"?"✓":"…"}`).join(" · ")}</div></span>
      ${mine?`<button class="btn small primary" ${busy?"disabled":""} data-oreadyall="${o.numero}">Pronto</button>`:""}</div>`};
  $("o-wip").innerHTML=(wip.length||aspW.length)?aspW.map(aspLine).join("")+wip.map(c=>{const pt=partsTxt(c.o.portate[c.k]),wn=kWho(c.o,c.o.portate[c.k]);
    const busy=S.pending.has(c.o.numero+"|"+c.k)||oReadyReps(c,sc).some(r=>S.pending.has(c.o.numero+"|"+c.k+"|"+r));
    return `<div class="li plain two"><span><b class="kwho">${esc(wn)}</b>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""} · <b style="color:${portColor(c.k)}">${esc(c.l)}</b><div class="sub">${c.o.fila?esc(filaNome(c.o.fila))+" · ":""}n. ${c.o.numero} · chiamata ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}${pt?" · "+pt:""}</div></span>
      <span class="row nowrap">${kQtyHtml(c.o,c.k)}<button class="btn small primary kbtn" ${busy?"disabled":""} data-oready="${c.o.numero}|${c.k}">${prontoLbl(c.o,c.k)}</button></span></div>`}).join("")
    :'<div class="empty">Niente in preparazione.</div>';
  const done=flatCourses("servita").filter(c=>inOScope(c,sc)&&c.t&&Date.now()-c.t<3*60000).sort((a,b)=>b.t-a.t).slice(0,12);
  $("o-done").innerHTML=done.length?done.map(c=>`<div class="li plain two"><span><b class="kwho">${esc(kWho(c.o,c.o.portate[c.k]))}</b> · <b style="color:${portColor(c.k)}">${esc(c.l)}</b> · ${cop(righeFor(c.o,c.k))} piatti<div class="sub">n. ${c.o.numero} · consegnato ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
      <button class="btn small" ${S.pending.has(c.o.numero+"|"+c.k)?"disabled":""} data-unserve="${c.o.numero}|${c.k}">Non consegnato</button></div>`).join("")
    :'<div class="empty">Niente.</div>';
}
/* l'uscita può segnare pronto un piatto chiamato (come la cucina): solo i reparti che vede */
function oReadyReps(c,sc){const rp=(c.o.portate[c.k]||{}).rep||{};return Object.keys(rp).filter(r=>rp[r].s!=="pronta"&&(!sc||sc.includes(r)))}
$("o-wip").addEventListener("click",async e=>{const b=e.target.closest("button[data-oready]");if(!b||b.disabled)return;b.disabled=true;
  const [n,k]=b.dataset.oready.split("|");if(!((orderByNum(Number(n))||{}).portate||{})[k]||orderByNum(Number(n)).portate[k].stato!=="chiamata")return;
  const pr=await prepPart(Number(n),k);if(!pr)return;if(pr[1]){const o=orderByNum(Number(n)),pp=o.portate[k];
    if(Object.keys(pp.rep||{}).length){for(const r of oReadyReps({o,k},oScope()))await setPart(Number(n),k,r,"pronta",{silent:true})}else await setStato(Number(n),k,"pronta",{notoast:true});partToast(Number(n),k,pr);return}
  const o=orderByNum(Number(n)),pp=o.portate[k],rs=oReadyReps({o,k},oScope());
  if(Object.keys(pp.rep||{}).length){for(const r of rs)await setPart(Number(n),k,r,"pronta",{silent:rs.length>1});
    if(rs.length>1){const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;toast(`${kWho(o,pp)} · ${c} pronto`,{ms:4000})}}
  else await setStato(Number(n),k,"pronta")});
/* asporto: tutto pronto (i reparti dell'uscita) e tutto consegnato in un colpo */
$("o-wip").addEventListener("click",async e=>{const b=e.target.closest("button[data-oreadyall]");if(!b||b.disabled)return;b.disabled=true;
  const n=Number(b.dataset.oreadyall),o=orderByNum(n);if(!o)return;const sc=oScope();
  for(const c of orderCourses(o).filter(c=>c.p.stato==="chiamata"&&inOScope({o,k:c.k},sc))){const pp=o.portate[c.k];
    if(Object.keys(pp.rep||{}).length){for(const r of oReadyReps({o,k:c.k},sc))await setPart(n,c.k,r,"pronta",{silent:true})}else await setStato(n,c.k,"pronta",{notoast:true})}
  toast(`Asporto n. ${n}: pronto`,{ms:4000})});
$("o-ready").addEventListener("click",async e=>{const b=e.target.closest("button[data-ocons]");if(!b||b.disabled)return;b.disabled=true;
  const n=Number(b.dataset.ocons),o=orderByNum(n);if(!o)return;const now=Date.now(),upd={},ks=[];
  orderCourses(o).forEach(c=>{if(c.p.stato==="pronta"){upd["portate/"+c.k+"/stato"]="servita";upd["portate/"+c.k+"/t"]=now;upd["portate/"+c.k+"/tp"]=c.p.t||null;ks.push(c.k)}});
  try{await R("ordini/"+n).update(upd);toast(`Asporto n. ${n}: consegnato tutto`,{ms:6000,action:{label:"Annulla",fn:()=>ks.forEach(k=>unserve(n,k))}})}
  catch(err){showBanner(errText(err));b.disabled=false}});
$("o-done").addEventListener("click",async e=>{const b=e.target.closest("button[data-unserve]");if(!b||b.disabled)return;b.disabled=true;const [n,k]=b.dataset.unserve.split("|");await unserve(Number(n),k)});
$("o-reps").addEventListener("click",e=>{const b=e.target.closest("button[data-orep]");if(!b)return;S.oRep=b.dataset.orep;lsSet("orep",S.oRep);S.seenOut=null;renderUscita()});
$("o-sound").addEventListener("click",()=>toggleSound());

