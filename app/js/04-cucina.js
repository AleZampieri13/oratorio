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
/* scelte del piatto (Naturale / Frizzante): se ce ne sono 2 o più, ognuna ha il suo numero da segnare pronto */
const kScList=(o,k)=>toArr(((o.portate||{})[k]||{}).sc).filter(Boolean);
const kScMode=(o,k)=>kScList(o,k).some(s=>s.q>0);
function kScNow(o,k){const L=kScList(o,k),sig=L.map(s=>s.q).join(","),st=S.kNow[o.numero+"|"+k];
  return L.map((s,i)=>st&&st.sig===sig&&st.v?Math.max(0,Math.min(s.q,st.v[i]??s.q)):s.q)}
function kNowOf(o,k){const q=cop(righeFor(o,k));if(kScMode(o,k)){const t=kScNow(o,k).reduce((a,b)=>a+b,0);return t>=1?Math.min(q,t):q}
  const st=S.kNow[o.numero+"|"+k];return st&&st.q===q?Math.max(1,Math.min(q,st.x)):q}
function kQtyHtml(o,k){const q=cop(righeFor(o,k)),key=`${o.numero}|${esc(k)}`;
  if(kScMode(o,k)){const v=kScNow(o,k);return `<span class="kscq">${kScList(o,k).map((s,i)=>s.q>0?`<span class="kscr">${q<2?`<b class="kscn">${s.q}</b>`:qtyField("kqs",`${key}|${i}`,v[i],s.q,`Quante ${s.n} sono pronte`)}<span class="scn">${esc(s.n)}</span></span>`:"").join("")}</span>`}
  if(q<2)return `<b>${q}</b>`;const x=kNowOf(o,k);return qtyField("kqi",key,x,q,`Quanti ${piattoNome(k)} sono pronti`)}
const prontoLbl=(o,k)=>{const q=cop(righeFor(o,k)),x=kNowOf(o,k);return x<q?`Pronti ${x}`:"Pronto"};

/* divide un piatto chiamato: x restano in questa riga, gli altri vanno in una riga nuova ancora «chiamata» */
async function splitCalled(n,k,x,scx,rs){const o=orderByNum(n),p=o&&o.portate&&o.portate[k];if(!p||p.stato!=="chiamata")return false;
  const q=cop(righeFor(o,k)),later=q-x;if(!(x>=1&&later>=1))return true;
  const b=kBase(k),D=o.dopo||{},used=[...Object.keys(o.portate),...Object.keys(D)].filter(y=>kBase(y)===b).map(kRound),nk=b+"~"+(Math.max(1,...used)+1);
  const sc=toArr(p.sc).filter(Boolean);let a=x;const sc1=[],sc2=[];sc.forEach((s,i)=>{const t=scx?Math.min(s.q,scx[i]||0):Math.min(s.q,a);a-=t;sc1.push({n:s.n,q:t});sc2.push({n:s.n,q:s.q-t})});
  const rep=p.rep?Object.fromEntries(Object.entries(p.rep).map(([r,v])=>{const y={...v,s:"chiamata"};delete y.t;return [r,y]})):null;
  const nx={...p,stato:"chiamata"};if(rep)nx.rep=rep;if(sc.length)nx.sc=sc2;
  const upd={["dopo/"+nk]:later,["portate/"+nk]:nx};if(k!==b)upd["dopo/"+k]=(D[k]||0)-later;
  if(rs){/* la parte pronta si segna insieme alla divisione: niente passaggi intermedi sullo schermo */
    const now=Date.now(),p1={...p};if(sc.length)p1.sc=sc1;let all=true;
    if(p.rep&&Object.keys(p.rep).length){p1.rep={...p.rep};rs.forEach(r=>{if(p1.rep[r])p1.rep[r]={...p1.rep[r],s:"pronta",t:now}});all=Object.values(p1.rep).every(v=>v&&v.s==="pronta")}
    if(all){p1.tc=p.t||null;p1.stato="pronta";p1.t=now;delete p1.annull}
    upd["portate/"+k]=p1}
  else if(sc.length)upd["portate/"+k+"/sc"]=sc1;
  try{await R("ordini/"+n).update(upd);delete S.kNow[n+"|"+k];return true}catch(e){showBanner(errText(e));return false}}
/* prima di segnare pronto: se il numero è stato abbassato, divide; ritorna [quanti pronti, quanti restano] */
async function prepPart(n,k,rs){const o=orderByNum(n);if(!o)return null;const q=cop(righeFor(o,k)),x=kNowOf(o,k);if(x>=q)return [q,0,false];S.holdMerge=Date.now()+4000;return (await splitCalled(n,k,x,kScMode(o,k)?kScNow(o,k):null,rs))?[x,q-x,!!rs]:null}
const partToast=(n,k,r)=>{const o=orderByNum(n);toast(`${o?kWho(o,o.portate&&o.portate[k])+" · ":""}${r[0]} ${piattoNome(k)} pronti · ${r[1]} ancora da preparare`,{ms:5000})};
/* schede allineate: nome e orario | numero dell'ordine | piatti | tasto, alla stessa altezza delle schede accanto */
function kWrapCard(c){if(c.dataset.w)return;c.dataset.w="1";const ks=[...c.children];if(ks.length<3)return;
  const body=document.createElement("div");body.className="kbody";ks.slice(2,-1).forEach(x=>body.appendChild(x));c.insertBefore(body,ks[ks.length-1])}
new MutationObserver(()=>document.querySelectorAll(".kq>.kcard:not([data-w])").forEach(kWrapCard)).observe(document.documentElement,{childList:true,subtree:true});
/* storico di cucina, bar e uscita: i piatti finiti, i più recenti in alto, con le ore */
function histPiatti(p,fin,fromT){const L=[];ordersArr().forEach(o=>orderCourses(o).forEach(c=>{if(fin(o,c))L.push({o,c})}));
  const tReady=c=>c.p.stato==="pronta"?c.p.t:c.p.tp,tOf=x=>fromT(x.c)||0;L.sort((a,b)=>tOf(b)-tOf(a));
  const n=L.reduce((a,x)=>a+cop(righeFor(x.o,x.c.k)),0);
  histBox(p,L.length,`${n} ${n===1?"piatto":"piatti"}`,()=>L.map(({o,c})=>{const q=cop(righeFor(o,c.k)),r=tReady(c);
    return `<div class="li plain hrow"><span class="n">${o.numero}</span><span><b>${q} <span style="color:${portColor(c.k)}">${esc(c.l)}</span></b>${scTxt(c.p)?` <small>(${esc(scTxt(c.p))})</small>`:""}
      <div class="sub">${esc(kWho(o,c.p))}${o.nome?" · "+esc(o.nome):""}${c.p.tc?` · chiamato ${fmtTime(c.p.tc)}`:""}${r?` · pronto ${fmtTime(r)}`:""}${c.p.stato==="servita"?` · portato ${fmtTime(c.p.t)}`:""}</div></span></div>`}).join(""))}
function renderHistK(sc){histPiatti("k",(o,c)=>(c.p.stato==="pronta"||c.p.stato==="servita")&&(!sc||courseReps(o,c.k).some(r=>sc.includes(r)))&&!barReps().some(r=>courseReps(o,c.k).includes(r)),c=>c.p.stato==="pronta"?c.p.t:c.p.tp||c.p.t)}
function renderHistB(sc){histPiatti("b",(o,c)=>(c.p.stato==="pronta"||c.p.stato==="servita")&&courseReps(o,c.k).some(r=>sc.includes(r)),c=>c.p.stato==="pronta"?c.p.t:c.p.tp||c.p.t)}
function renderHistO(sc){histPiatti("o",(o,c)=>c.p.stato==="servita"&&inOScope({o,k:c.k},sc),c=>c.p.t)}
/* chiamate di un gruppo di reparti, raggruppate per cliente (usato da cucina e bar) */
function renderRepView(sc,ids){
  const calls=repItems("chiamata",sc),ready=repItems("pronta",sc);
  const ports=S.portate.filter(p=>portReps(p).some(x=>sc.includes(x.r)));
  $(ids.sum).innerHTML=ports.length?ports.map(p=>{const b=breakdown(calls.filter(c=>kBase(c.k)===p.id)),l=stockLeft(p.id);
    return `<div class="${b.tot?"":"zero"}"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${b.tot}</b><span class="brk">${b.tot?b.txt:"—"}</span>${l!=null?`<span class="left ${stockCls(l)}">${l<=0?"Esaurito":l===1?"Resta 1 porzione":"Restano "+l+" porzioni"}</span>`:""}</div>`}).join("")
    :'<div class="zero"><span class="label">Nessun piatto</span><span class="brk">A questo reparto non è assegnato nessun piatto: chiedi al master (Listino → Piatti).</span></div>';
  /* una scheda per cliente; ordini uniti dal cameriere = una scheda sola, stesso piatto sommato */
  const groups=[];calls.forEach(c=>{const gk=gKey(c.o);let g=groups.find(x=>x.gk===gk);if(!g){g={gk,G:unitiOf(c.o),t:c.t,items:[]};groups.push(g)}
    let it=g.items.find(x=>x.k===c.k&&x.r===c.r);if(!it){it={k:c.k,r:c.r,l:c.l,t:c.t,its:[]};g.items.push(it)}it.its.push(c);if(c.t<it.t)it.t=c.t;if(c.t<g.t)g.t=c.t});
  const key=c=>c.o.numero+"|"+c.k+"|"+c.r,dis=c=>S.pending.has(key(c))?"disabled":"",disM=it=>it.its.some(c=>S.pending.has(key(c)))?"disabled":"";
  const ent=it=>it.its.map(c=>`${c.o.numero}>${c.k}>${c.r}`).join(",");
  $(ids.queue).innerHTML=groups.length?groups.map(g=>{const o=g.G[0],multi=g.G.length>1,late=g.items.some(c=>isLate(c.k,c.t)),wn=kWho(g.items[0].its[0].o,g.items[0].its[0].p),many=g.items.length>1;
    const tn=tintCls(g.items.map(c=>c.k)),nome=multi?gNome(g.G):o.nome;
    const btn1=it=>it.its.length>1?`<button class="btn ${many?"small kbtn":"primary big"}" ${disM(it)} data-rsetm="${esc(ent(it))}">Pronto</button>`
      :`<button class="btn ${many?"small kbtn":"primary big"}" ${dis(it.its[0])} data-rset="${it.its[0].o.numero}|${it.k}|${esc(it.r)}">${prontoLbl(it.its[0].o,it.k)}</button>`;
    return `<article class="kcard ${late?"late":""}${tn.c}"${tn.s}><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${clockAgo(g.t)}</span></div>
      <div class="what kcourse oline"><b class="onum">n. ${gNums(g.G)}</b>${nome?`<span class="ocli">${esc(nome)}</span>`:""}${g.G.some(x=>x.asporto)&&wn!=="Asporto"?'<span class="pill asp">Asporto</span>':""}</div>
      <ul class="kitems">${g.items.map(it=>{const c=it.its[0],m=it.its.length>1,sp=m?scMerge(it.its.map(x=>x.p)):c.p;
        return `<li class="${isLate(it.k,it.t)?"klate":""}" style="--pc:${portColor(it.k)}">${m?`<b>${itsQ(it.its)}</b>`:kQtyHtml(c.o,it.k)}<span class="kin" style="color:${portColor(it.k)}">${esc(it.l)}${scTxt(sp)&&(m||!kScMode(c.o,it.k))?` <small class="ksc">${scLines(sp)}</small>`:""}</span>${many?btn1(it):""}</li>`}).join("")}</ul>
      ${g.G.filter(x=>x.note).map(x=>`<div class="note">${multi?`<b>n. ${x.numero}:</b> `:""}${esc(x.note)}</div>`).join("")}
      ${many?`<button class="btn primary big" data-rsetall="${multi?esc(g.items.map(ent).join(",")):o.numero+"|"+esc(g.items.map(it=>it.k+"~"+it.r).join(","))}">${g.items.some(it=>it.its.length===1&&kNowOf(it.its[0].o,it.k)<cop(righeFor(it.its[0].o,it.k)))?"Segna pronti questi":"Tutto pronto"}</button>`
        :btn1(g.items[0])}</article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da preparare.</div></div>';
  $(ids.ready).innerHTML=ready.length?ready.map(c=>{const wn=kWho(c.o,c.p),q=cop(righeFor(c.o,c.k)),stale=c.p.t&&(Date.now()-c.p.t)>5*60000;
    return `<div class="li plain two ${stale?"stale":""}"><span><b class="kwho">${esc(wn)}</b> · <b style="color:${portColor(c.k)}">${q} ${esc(c.l)}</b>${scTxt(c.p)?` <small>(${esc(scTxt(c.p))})</small>`:""}<div class="sub">n. ${gNums(unitiOf(c.o))}${c.o.nome?" · "+esc(c.o.nome):""} · pronto ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}</div></span>
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
    if(to==="pronta")toast(`${o?kWho(o,v):"n. "+n} · ${pn} pronto${v.stato==="pronta"?` · ${c} completo`:""}`,{ms:5000,action:{label:"Annulla",fn:()=>setPart(n,k,r,"chiamata",{silent:true}).then(()=>mergeSame(n,k))}});
    else toast(`${pn} · n. ${n}: di nuovo da preparare`,{ms:4000});
  }catch(e){showBanner(errText(e))}
  finally{S.pending.delete(key);schedule()}
}
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rset]");if(!b||b.disabled)return;const [n,k,r]=b.dataset.rset.split("|");
  const pr=await prepPart(Number(n),k,[r]);if(!pr)return;if(!pr[2])await setPart(Number(n),k,r,"pronta");if(pr[1])partToast(Number(n),k,pr)});
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rsetall]");if(!b||b.disabled)return;b.disabled=true;
  /* «12|k~r,k~r» (un ordine) oppure «12>k>r,13>k>r» (ordini uniti) */
  const v=b.dataset.rsetall,its=v.includes(">")?v.split(",").map(x=>x.split(">")):(([n,l])=>l.split(",").map(x=>{const i=x.lastIndexOf("~");return [n,x.slice(0,i),x.slice(i+1)]}))([v.slice(0,v.indexOf("|")),v.slice(v.indexOf("|")+1)]),ns=[...new Set(its.map(x=>Number(x[0])))];
  for(const [n,k,r] of its){const pr=await prepPart(Number(n),k,[r]);if(!pr)continue;if(!pr[2])await setPart(Number(n),k,r,"pronta",{silent:true})}
  const o=orderByNum(ns[0]);toast(`${o?kWho(o,null)+" · ":""}n. ${ns.join(" + ")}: tutto pronto`,{ms:4000})});
/* lo stesso piatto di più ordini uniti: pronto tutto insieme */
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-rsetm]");if(!b||b.disabled)return;b.disabled=true;
  const its=b.dataset.rsetm.split(",").map(x=>x.split(">")).map(([n,k,r])=>[Number(n),k,r]);
  for(const [n,k,r] of its)await setPart(n,k,r,"pronta",{silent:true});
  const o=orderByNum(its[0][0]);toast(`${o?kWho(o,o.portate&&o.portate[its[0][1]])+" · ":""}n. ${its.map(x=>x[0]).join(" + ")} · ${piattoNome(its[0][1])} pronto`,{ms:5000,
    action:{label:"Annulla",fn:()=>its.forEach(([n,k,r])=>setPart(n,k,r,"chiamata",{silent:true}).then(()=>mergeSame(n,k)))}})});
document.addEventListener("click",e=>{const b=e.target.closest("button[data-runready]");if(!b||b.disabled)return;if(!armed(b,"Non pronto?"))return;
  const [n,k,r]=b.dataset.runready.split("|");setPart(Number(n),k,r,"chiamata").then(()=>mergeSame(Number(n),k))});
function renderKitchen(){
  renderKReps();const sc=kScope();renderHistK(sc);if(sc){renderKitchenRep(sc);return}
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
    return `<article class="kcard ${late?"late":""} tint" style="--pc:${portColor(c.k)}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${clockAgo(c.t)}</span></div>
      <div class="what kcourse"><span class="kqn">${cop(rf)}</span> <span style="color:${portColor(c.k)}">${esc(c.l)}</span> <span class="label">· <b class="onum">n. ${c.o.numero}</b></span>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""}</div>
      ${scTxt(c.o.portate[c.k])?`<div class="kparts ksc">${scLines(c.o.portate[c.k])}</div>`:""}
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
  const sc=oScope(),fixed=oFixed(),box=$("o-reps");renderHistO(sc);
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
    return `<article class="kcard ${stale?"late":""}${tn.c}"${tn.s}><div class="top"><span class="n nm">Asporto</span><span class="age">pronto ${clockAgo(t)}</span></div>
      <div class="what kcourse oline"><b class="onum">n. ${o.numero}</b>${o.nome?`<span class="ocli">${esc(o.nome)}</span>`:""}<span class="label">tutto insieme, ${n} ${n===1?"piatto":"piatti"}</span></div>
      <ul>${cs.map(c=>`<li style="--pc:${portColor(c.k)}"><b>${cop(righeFor(o,c.k))}</b><span class="aspn" style="color:${portColor(c.k)}">${esc(c.l)}</span>${scTxt(c.p)?` <small class="ksc">${scLines(c.p)}</small>`:""}</li>`).join("")}</ul>
      ${o.note?`<div class="note">${esc(o.note)}</div>`:""}
      <button class="btn go big" ${cs.some(c=>S.pending.has(o.numero+"|"+c.k))?"disabled":""} data-ocons="${o.numero}">Consegnato tutto</button></article>`};
  /* totali per piatto: pronti da consegnare e in preparazione */
  const inSc=c=>inOScope(c,sc),rdy=flatCourses("pronta").filter(inSc),cal=flatCourses("chiamata").filter(inSc);
  const ports=S.portate.filter(p=>!sc||portReps(p).some(x=>sc.includes(x.r)));
  const tot=(L,id)=>L.filter(c=>kBase(c.k)===id).reduce((a,c)=>a+cop(righeFor(c.o,c.k)),0);
  $("o-sum").innerHTML=ports.map(p=>{const r=tot(rdy,p.id),w=tot(cal,p.id);
    return `<div class="${r||w?"":"zero"}"><span class="label" style="color:${portColor(p.id)}">${esc(p.nome)}</span><b>${r}</b><span class="brk">${r===1?"pronto":"pronti"}${w?` · ${w} in preparazione`:""}</span></div>`}).join("");
  /* ordini uniti dal cameriere: lo stesso piatto pronto è una scheda sola */
  const rG=[];ready.forEach(c=>{const id=gKey(c.o)+"|"+c.k;let g=rG.find(x=>x.id===id);if(!g){g={id,G:unitiOf(c.o),its:[]};rG.push(g)}g.its.push(c)});
  $("o-ready").innerHTML=(ready.length||aspR.length)?aspR.map(aspCard).join("")+rG.map(({G,its})=>{const c=its[0],t=Math.min(...its.map(x=>x.t||Date.now())),stale=t&&(Date.now()-t)>5*60000,n=itsQ(its),wn=kWho(c.o,c.o.portate[c.k]),multi=its.length>1;
    const dis=its.some(x=>S.pending.has(x.o.numero+"|"+x.k))?"disabled":"",os=its.map(x=>x.o),nome=multi?gNome(os):c.o.nome,a=esc(itsAttr(its)),sp=multi?scMerge(its.map(x=>x.o.portate[x.k])):c.o.portate[c.k];
    const pp=partsOf(c.o.portate[c.k]),parts=pp.length>1?pp.map(x=>x.piatto||x.nome).join(" + "):"";
    return `<article class="kcard ${stale?"late":""} tint" style="--pc:${portColor(c.k)}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">pronto ${clockAgo(t)}</span></div>
      <div class="what kcourse oline"><b class="onum">n. ${gNums(os)}</b>${c.o.fila?`<span class="label ofila">${esc(filaNome(c.o.fila))}</span>`:""}${nome?`<span class="ocli">${esc(nome)}</span>`:""}${c.o.asporto&&wn!=="Asporto"?'<span class="pill asp">Asporto</span>':""}</div>
      <div class="what kcourse"><span class="kqn">${n}</span> <span style="color:${portColor(c.k)}">${esc(c.l)}</span></div>
      ${parts?`<div class="kparts">${esc(parts)}</div>`:""}
      ${scTxt(sp)?`<div class="kparts ksc">${scLines(sp)}</div>`:""}
      ${os.filter(x=>x.note).map(x=>`<div class="note">${multi?`<b>n. ${x.numero}:</b> `:""}${esc(x.note)}</div>`).join("")}
      <div class="oacts"><button class="btn small" ${dis} data-ounready="${multi?a:c.o.numero+"|"+esc(c.k)}">Annulla</button><button class="btn go big" ${dis} ${multi?`data-setm="${a}|servita"`:`data-set="${c.o.numero}|${c.k}|servita"`}>Consegnato</button></div></article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da consegnare.</div></div>';
  const wip=flatCourses("chiamata").filter(c=>!c.o.asportoSubito&&inOScope(c,sc));
  const aspLine=o=>{const cs=orderCourses(o).filter(c=>c.p.stato!=="servita"),busy=cs.some(c=>S.pending.has(o.numero+"|"+c.k)),mine=cs.some(c=>c.p.stato==="chiamata"&&inOScope({o,k:c.k},sc));
    return `<div class="li plain two"><span><b class="kwho">Asporto</b> · n. ${o.numero}${o.nome?" · "+esc(o.nome):""}<div class="sub">tutto insieme: ${cs.map(c=>`<span style="color:${portColor(c.k)}">${esc(c.l)}</span> ${c.p.stato==="pronta"?"✓":"…"}`).join(" · ")}</div></span>
      ${mine?`<button class="btn small primary" ${busy?"disabled":""} data-oreadyall="${o.numero}">Pronto</button>`:""}</div>`};
  $("o-wip").innerHTML=(wip.length||aspW.length)?aspW.map(aspLine).join("")+wip.map(c=>{const pt=partsTxt(c.o.portate[c.k]),wn=kWho(c.o,c.o.portate[c.k]);
    const busy=S.pending.has(c.o.numero+"|"+c.k)||oReadyReps(c,sc).some(r=>S.pending.has(c.o.numero+"|"+c.k+"|"+r));
    return `<div class="li plain two"><span><b class="kwho">${esc(wn)}</b>${c.o.asporto&&wn!=="Asporto"?' <span class="pill asp">Asporto</span>':""} · <b style="color:${portColor(c.k)}">${esc(c.l)}</b><div class="sub">${c.o.fila?esc(filaNome(c.o.fila))+" · ":""}n. ${gNums(unitiOf(c.o))} · chiamata ${ago(c.t)==="adesso"?"adesso":"da "+ago(c.t)}${pt?" · "+pt:""}</div></span>
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
  const o0=orderByNum(Number(n)),pp0=o0.portate[k],rs0=Object.keys(pp0.rep||{}).length?oReadyReps({o:o0,k},oScope()):[];
  const pr=await prepPart(Number(n),k,rs0);if(!pr)return;if(pr[1]){partToast(Number(n),k,pr);return}
  const o=orderByNum(Number(n)),pp=o.portate[k],rs=oReadyReps({o,k},oScope());
  if(Object.keys(pp.rep||{}).length){for(const r of rs)await setPart(Number(n),k,r,"pronta",{silent:rs.length>1});
    if(rs.length>1){const c=(orderCourses(o).find(x=>x.k===k)||{}).l||k;toast(`${kWho(o,pp)} · ${c} pronto`,{ms:4000})}}
  else await setStato(Number(n),k,"pronta")});
/* uscita: un piatto segnato pronto per sbaglio torna da preparare (tocca due volte) */
$("o-ready").addEventListener("click",async e=>{const b=e.target.closest("button[data-ounready]");if(!b||b.disabled)return;if(!armed(b,"Non pronto?"))return;
  const v=b.dataset.ounready,its=(v.includes(">")?parseIts(v):[[Number(v.split("|")[0]),v.slice(v.indexOf("|")+1)]]).filter(([n,k])=>stOf(orderByNum(n)||{},k)==="pronta");if(!its.length)return;b.disabled=true;
  const o0=orderByNum(its[0][0]),p0=o0.portate[its[0][1]],sc=oScope();
  for(const [n,k] of its){const p=orderByNum(n).portate[k],rs=Object.keys(p.rep||{}).filter(r=>!sc||sc.includes(r));
    if(rs.length){for(const r of rs)await setPart(n,k,r,"chiamata",{silent:true})}else await setStato(n,k,"chiamata",{silent:true,t:p.tc||Date.now(),expect:"pronta"});
    await mergeSame(n,k)}
  const c=(orderCourses(o0).find(x=>x.k===its[0][1])||{}).l||its[0][1];toast(`${kWho(o0,p0)} · ${c}${its.length>1?" · n. "+its.map(x=>x[0]).join(" + "):""}: di nuovo da preparare`,{ms:4000})});
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

