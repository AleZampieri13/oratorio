/* Listino: menù, portate, prezzi, reparti */
/* ---------- LISTINO: menù, portate, prezzi singoli, extra ---------- */
const euro=v=>v>0?v.toFixed(2).replace(".",","):"";
function emsg(id,t,ok){const m=$(id);m.className="msg "+(ok?"ok":"err");m.textContent=t}
function logChange(cosa){if(!cosa)return;const id=rid("l");R("log/"+id).set({id,t:Date.now(),chi:myName(),cosa}).catch(()=>{})}
function menuOf(p,vars){return vars.filter(v=>applies(p,v.id)).map(v=>v.id)}
function normPortate(list,vars){
  return list.map(p=>{const m=Array.isArray(p.menu)?p.menu.filter(x=>x!=="-"&&vars.some(v=>v.id===x)):null;
    const menu=m==null||m.length===vars.length?null:(m.length?m:["-"]);
    const o={id:p.id,nome:p.nome,menu,prezzo:p.prezzo||0,prezzoBimbi:p.prezzoBimbi||0};if(p.colore)o.colore=p.colore;
    const rs=toArr(p.reparti).filter(x=>x.r).map(x=>x.piatto?{r:x.r,piatto:x.piatto}:{r:x.r});if(rs.length)o.reparti=rs;return o});
}
function savePortate(list,vars,okT,log){
  return R("config/menu/portate").set(normPortate(list,vars||S.varianti)).then(()=>{if(okT)emsg("l-pmsg",okT,true);logChange(log)},e=>emsg("l-pmsg",errText(e)));
}
function saveVarianti(list,okT,log){return R("config/menu/varianti").set(list).then(()=>{if(okT)emsg("l-vmsg",okT,true);logChange(log)},e=>emsg("l-vmsg",errText(e)))}
function saveExtra(list,okT,log){return R("config/menu/extra").set(list).then(()=>{if(okT)emsg("l-xmsg",okT,true);logChange(log)},e=>emsg("l-xmsg",errText(e)))}
function priceDiffs(oldL,newL,label,key){
  return newL.map(n=>{const o=oldL.find(x=>x.id===n.id);if(!o)return null;const a=o[key||"prezzo"]||0,b=n[key||"prezzo"]||0;
    return a!==b?`${label} ${n.nome}: ${money(a)} → ${money(b)}`:null}).filter(Boolean).join("; ");
}
function renderListino(){
  const ae=document.activeElement,aid=ae&&ae.id&&/^(lv|ls|lb|lx|lr|l-new)/.test(ae.id)?ae.id:null,aval=aid?ae.value:null;
  const keep={};document.querySelectorAll("#p-listino input").forEach(i=>{if(i.id&&i.dataset.dirty==="1")keep[i.id]=i.value});
  renderListinoInner();
  Object.entries(keep).forEach(([id,v])=>{const el=$(id);if(!el)return;
    if(/^(lv|ls|lb|lx)-/.test(id)&&parsePrice(el.value)===parsePrice(v))return;
    el.value=v;el.dataset.dirty="1"});
  if(aid&&$(aid)){const el=$(aid);el.value=aval;el.focus();try{el.setSelectionRange(aval.length,aval.length)}catch(e){}}
}
document.addEventListener("input",e=>{if(e.target.closest&&e.target.closest("#p-listino"))e.target.dataset.dirty="1"});
function renderListinoInner(){
  if(!S.newPorts)S.newPorts=new Set(S.portate.map(p=>p.id));
  $("l-var").innerHTML=S.varianti.map((v,i)=>`<div class="vrow"><div class="top"><b>${esc(v.nome)}${i===0?' <span class="pill wait">base</span>':""}</b>
      <input type="text" inputmode="decimal" class="pricein" id="lv-${esc(v.id)}" value="${euro(v.prezzo)}" placeholder="0,00" aria-label="Prezzo ${esc(v.nome)}">
      <button class="btn danger small" data-delvar="${esc(v.id)}" ${S.varianti.length>1?"":"disabled"}>Rimuovi</button></div>
    <div class="chips">${S.portate.map(p=>`<button class="tog" data-vp="${esc(v.id)}|${esc(p.id)}" aria-pressed="${applies(p,v.id)}">${esc(p.nome)}</button>`).join("")}</div></div>`).join("");
  $("l-newports").innerHTML=S.portate.map(p=>`<button class="tog" data-np="${esc(p.id)}" aria-pressed="${S.newPorts.has(p.id)}">${esc(p.nome)}</button>`).join("");
  $("l-port").innerHTML=`<div class="colh"><span class="label">Portata</span><span class="label">Singola</span><span class="label">Bambini</span></div>`+
    S.portate.map((p,i)=>`<div class="prow"><span class="pname"><input type="color" class="pcol" data-pcol="${esc(p.id)}" value="${portColor(p.id)}" aria-label="Colore di ${esc(p.nome)} in cucina"><b>${esc(p.nome)}</b></span>
      <input type="text" inputmode="decimal" id="ls-${esc(p.id)}" value="${euro(p.prezzo)}" placeholder="—" aria-label="Prezzo singolo ${esc(p.nome)}">
      <input type="text" inputmode="decimal" id="lb-${esc(p.id)}" value="${euro(p.prezzoBimbi)}" placeholder="—" aria-label="Prezzo singolo bambini ${esc(p.nome)}">
      <span class="acts"><button class="btn small" data-up="${i}" ${i?"":"disabled"} aria-label="Sposta su">↑</button><button class="btn small" data-down="${i}" ${i<S.portate.length-1?"":"disabled"} aria-label="Sposta giù">↓</button>
      <button class="btn small danger" data-delport="${esc(p.id)}" ${S.portate.length>1?"":"disabled"}>Rimuovi</button></span></div>`).join("");
  const grp=[...new Set(["Bevande","Dolci","Altro",...S.extra.map(x=>(x.gruppo||"").trim()).filter(Boolean)])];
  $("l-extra").innerHTML=S.extra.length?`<datalist id="xgruppi">${grp.map(g=>`<option value="${esc(g)}">`).join("")}</datalist>`+S.extra.map(x=>`<div class="xedit"><div class="top"><b>${esc(x.nome)}</b>
    <input type="text" inputmode="decimal" class="pricein" id="lx-${esc(x.id)}" value="${euro(x.prezzo)}" placeholder="0,00" aria-label="Prezzo ${esc(x.nome)}">
    <button class="btn danger small" data-delextra="${esc(x.id)}">Rimuovi</button></div>
    <div class="xf"><label><span class="label">Gruppo</span><input type="text" id="lxg-${esc(x.id)}" list="xgruppi" value="${esc(x.gruppo||"")}" placeholder="Es. Bevande"></label>
    <label><span class="label">Lo prepara</span><select id="lxr-${esc(x.id)}"><option value="">Bar</option>${repList().map(r=>`<option value="${esc(r.id)}" ${xRep(x)===r.id?"selected":""}>${esc(r.nome)}</option>`).join("")}</select></label></div></div>`).join(""):'<div class="empty">Nessun extra. Aggiungi acqua, vino, bibite, caffè…</div>';
  $("l-saveextra").hidden=!S.extra.length;
  const noRep=S.portate.filter(p=>!portReps(p).length);
  $("l-rep").innerHTML=repList().length?repList().map(r=>`<div class="vrow"><div class="top"><b>${esc(r.nome)}</b><button class="btn danger small" data-delrep="${esc(r.id)}">Rimuovi</button></div>
      <div class="chips">${S.portate.map(p=>`<button class="tog" data-rp="${esc(r.id)}|${esc(p.id)}" aria-pressed="${portReps(p).some(x=>x.r===r.id)}">${esc(p.nome)}</button>`).join("")}</div>
      ${S.portate.filter(p=>portReps(p).some(x=>x.r===r.id)).map(p=>`<div class="rprow"><span class="label">${esc(p.nome)}</span><input type="text" id="lr-${esc(r.id)}-${esc(p.id)}" data-rpiatto="${esc(r.id)}|${esc(p.id)}" value="${esc((portReps(p).find(x=>x.r===r.id)||{}).piatto||"")}" placeholder="Piatto (facoltativo)" aria-label="Piatto di ${esc(r.nome)} per ${esc(p.nome)}"></div>`).join("")}</div>`).join("")
    +(noRep.length?`<p class="hint">Senza reparto: ${noRep.map(p=>esc(p.nome)).join(", ")}. Le vede solo chi in cucina guarda «Tutti».</p>`:"")
    :'<div class="empty">Nessun reparto: tutta la cucina vede tutte le chiamate, come prima.</div>';
  renderLog();
}
function saveReparti(list,okT,log){return R("config/menu/reparti").set(list).then(()=>{if(okT)emsg("l-rmsg",okT,true);logChange(log)},e=>emsg("l-rmsg",errText(e)))}
$("l-addrep").addEventListener("click",()=>{const nome=$("l-newrep").value.trim();if(!nome){$("l-newrep").focus();return}
  if(repList().some(r=>norm(r.nome)===norm(nome))){emsg("l-rmsg","Esiste già un reparto con questo nome.");return}
  $("l-newrep").value="";saveReparti([...repList(),{id:rid("r"),nome}],`Reparto ${nome} aggiunto: ora tocca le portate che prepara.`,"Nuovo reparto "+nome)});
$("l-newrep").addEventListener("keydown",e=>{if(e.key==="Enter")$("l-addrep").click()});
$("l-rep").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.delrep){if(!armed(b))return;const r=repList().find(x=>x.id===b.dataset.delrep);if(!r)return;
    await savePortate(S.portate.map(p=>({...p,reparti:portReps(p).filter(x=>x.r!==r.id)})),S.varianti,null,null);
    if(S.extra.some(x=>x.rep===r.id))await saveExtra(S.extra.map(x=>{if(x.rep!==r.id)return x;const y={...x};delete y.rep;return y}),null,null);
    saveReparti(repList().filter(x=>x.id!==r.id),`Reparto ${r.nome} rimosso.`,"Tolto il reparto "+r.nome);return}
  if(b.dataset.rp){const [rid_,pid]=b.dataset.rp.split("|"),p=S.portate.find(x=>x.id===pid),on=portReps(p).some(x=>x.r===rid_);
    const list=S.portate.map(x=>x.id!==pid?x:{...x,reparti:on?portReps(x).filter(y=>y.r!==rid_):[...portReps(x),{r:rid_}]});
    savePortate(list,S.varianti,null,`Reparto ${repNome(rid_)}: ${on?"tolto":"aggiunto"} ${p.nome}`).then(()=>emsg("l-rmsg",`${repNome(rid_)}: ${on?"tolto":"aggiunto"} ${p.nome}.`,true))}
});
$("l-rep").addEventListener("change",e=>{const i=e.target.closest("input[data-rpiatto]");if(!i)return;const [rid_,pid]=i.dataset.rpiatto.split("|"),v=i.value.trim(),p=S.portate.find(x=>x.id===pid);if(!p)return;
  const list=S.portate.map(x=>x.id!==pid?x:{...x,reparti:portReps(x).map(y=>y.r===rid_?(v?{r:y.r,piatto:v}:{r:y.r}):y)});
  i.dataset.dirty="";savePortate(list,S.varianti,null,`Reparto ${repNome(rid_)}: ${p.nome} = «${v||"—"}»`).then(()=>emsg("l-rmsg","Piatto salvato.",true))});
function renderLog(){
  const L=Object.values(S.logMap).sort((a,b)=>b.t-a.t).slice(0,25);
  $("l-log").innerHTML=L.length?L.map(l=>`<div class="li plain two"><span>${esc(l.cosa)}<div class="sub">${fmtTime(l.t)} · ${esc(l.chi||"")}</div></span></div>`).join("")
    :'<div class="empty">Nessuna modifica finora. Qui comparirà chi cambia prezzi, menù o ordini, e quando.</div>';
}
/* menù */
const curVar=()=>S.varianti.map(v=>({...v,prezzo:parsePrice(($("lv-"+v.id)||{}).value)}));
$("l-saveprices").addEventListener("click",()=>{const n=curVar();saveVarianti(n,"Prezzi menù salvati.",priceDiffs(S.varianti,n,"Prezzo menù"))});
$("l-port").addEventListener("change",e=>{const i=e.target.closest("input[data-pcol]");if(!i)return;const pid=i.dataset.pcol,p=S.portate.find(x=>x.id===pid);if(!p)return;
  savePortate(S.portate.map(x=>x.id===pid?{...x,colore:i.value}:x),S.varianti,`Colore di ${p.nome} salvato.`,null)});
$("l-var").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.delvar){if(!armed(b))return;const v=S.varianti.find(x=>x.id===b.dataset.delvar);saveVarianti(S.varianti.filter(x=>x.id!==v.id),"Menù rimosso.","Tolto il menù "+v.nome);return}
  if(b.dataset.vp){const [vid,pid]=b.dataset.vp.split("|");const v=S.varianti.find(x=>x.id===vid),p=S.portate.find(x=>x.id===pid);
    const on=applies(p,vid);
    if(on&&S.portate.filter(x=>applies(x,vid)).length<2){emsg("l-vmsg","Un menù deve avere almeno una portata.");return}
    const list=S.portate.map(x=>{if(x.id!==pid)return x;const m=menuOf(x,S.varianti);return {...x,menu:on?m.filter(y=>y!==vid):[...m,vid]}});
    savePortate(list,S.varianti,null,`Menù ${v.nome}: ${on?"tolto":"aggiunto"} ${p.nome}`).then(()=>emsg("l-vmsg",`${v.nome}: ${on?"tolto":"aggiunto"} ${p.nome}.`,true))}
});
$("l-newports").addEventListener("click",e=>{const b=e.target.closest("button[data-np]");if(!b)return;if(!S.newPorts)S.newPorts=new Set(S.portate.map(p=>p.id));
  S.newPorts.has(b.dataset.np)?S.newPorts.delete(b.dataset.np):S.newPorts.add(b.dataset.np);b.setAttribute("aria-pressed",String(S.newPorts.has(b.dataset.np)))});
$("l-addvar").addEventListener("click",async()=>{
  const nome=$("l-newvar").value.trim();if(!nome){emsg("l-vmsg","Scrivi il nome del menù.");return}
  if(!S.newPorts)S.newPorts=new Set(S.portate.map(p=>p.id));
  if(!S.newPorts.size){emsg("l-vmsg","Scegli almeno una portata per il nuovo menù.");return}
  if(S.varianti.some(v=>norm(v.nome)===norm(nome))){emsg("l-vmsg","Esiste già un menù con questo nome.");return}
  const v={id:rid("v"),nome,prezzo:parsePrice($("l-newprice").value)},vars=[...curVar(),v];
  const list=S.portate.map(p=>{const m=menuOf(p,S.varianti);return {...p,menu:S.newPorts.has(p.id)?[...m,v.id]:m}});
  const incl=S.portate.filter(p=>S.newPorts.has(p.id)).map(p=>p.nome).join(", ");
  await savePortate(list,vars,null,null);
  await saveVarianti(vars,`Menù ${nome} aggiunto.`,`Nuovo menù ${nome} (${money(v.prezzo)}) con ${incl}`);
  $("l-newvar").value="";$("l-newprice").value="";["l-newvar","l-newprice"].forEach(id=>{$(id).dataset.dirty=""});S.newPorts=null;renderListino();
});
/* portate */
const curPort=()=>S.portate.map(p=>({...p,prezzo:parsePrice(($("ls-"+p.id)||{}).value),prezzoBimbi:parsePrice(($("lb-"+p.id)||{}).value)}));
$("l-saveport").addEventListener("click",()=>{const n=curPort();
  savePortate(n,S.varianti,"Prezzi portate salvati.",[priceDiffs(S.portate,n,"Prezzo singolo"),priceDiffs(S.portate,n,"Prezzo singolo bambini","prezzoBimbi")].filter(Boolean).join("; "))});
$("l-port").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const list=curPort();
  if(b.dataset.up){const i=+b.dataset.up;[list[i-1],list[i]]=[list[i],list[i-1]];savePortate(list,S.varianti,"Ordine portate salvato.")}
  else if(b.dataset.down){const i=+b.dataset.down;[list[i+1],list[i]]=[list[i],list[i+1]];savePortate(list,S.varianti,"Ordine portate salvato.")}
  else if(b.dataset.delport){if(!armed(b))return;const p=S.portate.find(x=>x.id===b.dataset.delport);savePortate(list.filter(x=>x.id!==p.id),S.varianti,"Portata rimossa.","Tolta la portata "+p.nome)}
});
$("l-addport").addEventListener("click",()=>{const nome=$("l-newport").value.trim();if(!nome)return;$("l-newport").value="";
  savePortate([...curPort(),{id:rid("c"),nome,menu:null}],S.varianti,"Portata aggiunta a tutti i menù: toglila da quelli che non la comprendono.","Nuova portata "+nome)});
/* extra */
const curExtra=()=>S.extra.map(x=>{const g=(($("lxg-"+x.id)||{}).value||"").trim(),r=($("lxr-"+x.id)||{}).value||"";
  const e={id:x.id,nome:x.nome,prezzo:parsePrice(($("lx-"+x.id)||{}).value)};if(g)e.gruppo=g;if(r)e.rep=r;return e});
/* cosa è cambiato in gruppo e reparto, per il registro */
function extraDiffs(oldL,newL){return newL.map(n=>{const o=oldL.find(x=>x.id===n.id);if(!o)return null;const c=[];
  if((o.gruppo||"")!==(n.gruppo||""))c.push(`gruppo «${n.gruppo||"—"}»`);if(xRep(o)!==(n.rep||""))c.push(`lo prepara ${n.rep?repNome(n.rep):"il bar"}`);
  return c.length?`${n.nome}: ${c.join(", ")}`:null}).filter(Boolean).join("; ")}
/* salvataggio automatico dei prezzi all'uscita dal campo */
$("l-var").addEventListener("change",e=>{if(!e.target.id||!e.target.id.startsWith("lv-"))return;const n=curVar(),d=priceDiffs(S.varianti,n,"Prezzo menù");if(d)saveVarianti(n,"Prezzo salvato.",d)});
$("l-port").addEventListener("change",e=>{const id=e.target.id||"";if(!id.startsWith("ls-")&&!id.startsWith("lb-"))return;const n=curPort(),d=[priceDiffs(S.portate,n,"Prezzo singolo"),priceDiffs(S.portate,n,"Prezzo singolo bambini","prezzoBimbi")].filter(Boolean).join("; ");if(d)savePortate(n,S.varianti,"Prezzo salvato.",d)});
$("l-extra").addEventListener("change",e=>{const id=e.target.id||"";if(!/^lx[gr]?-/.test(id))return;const n=curExtra(),d=[priceDiffs(S.extra,n,"Prezzo"),extraDiffs(S.extra,n)].filter(Boolean).join("; ");
  if(d){e.target.dataset.dirty="";saveExtra(n,"Salvato.",d)}});
$("l-saveextra").addEventListener("click",()=>{const n=curExtra();saveExtra(n,"Extra salvati.",[priceDiffs(S.extra,n,"Prezzo"),extraDiffs(S.extra,n)].filter(Boolean).join("; "))});
$("l-addextra").addEventListener("click",()=>{const nome=$("l-newextra").value.trim();if(!nome)return;
  const p=parsePrice($("l-newextraprice").value);$("l-newextra").value="";$("l-newextraprice").value="";
  saveExtra([...curExtra(),{id:rid("x"),nome,prezzo:p}],`${nome} aggiunto.`,`Nuovo extra ${nome} (${money(p)})`)});
$("l-extra").addEventListener("click",e=>{const b=e.target.closest("button[data-delextra]");if(!b||!armed(b))return;const x=S.extra.find(y=>y.id===b.dataset.delextra);
  saveExtra(curExtra().filter(y=>y.id!==x.id),"Extra rimosso.","Tolto l'extra "+x.nome)});

