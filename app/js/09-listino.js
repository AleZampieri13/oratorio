/* Listino (versione 36): reparti, piatti, menù fissi. Niente più portate né extra.
   Nel resto dell'app ogni piatto fa da «portata» con un solo reparto (S.portate). */
const euro=v=>v>0?v.toFixed(2).replace(".",","):"";
function emsg(id,t,ok){const m=$(id);m.className="msg "+(ok?"ok":"err");m.textContent=t}
function logChange(cosa){if(!cosa)return;const id=rid("l");R("log/"+id).set({id,t:Date.now(),chi:myName(),cosa}).catch(()=>{})}

/* ---------- dati ---------- */
function normL(L){
  const reparti=toArr(L&&L.reparti).filter(r=>r&&r.id&&r.nome).map(r=>r.bar?{id:r.id,nome:r.nome,bar:true}:{id:r.id,nome:r.nome});
  const piatti=toArr(L&&L.piatti).filter(p=>p&&p.id&&p.nome).map(p=>{const o={id:p.id,nome:p.nome,rep:reparti.some(r=>r.id===p.rep)?p.rep:"",prezzo:p.prezzo||0,prezzoBimbi:p.prezzoBimbi||0};
    if(p.colore)o.colore=p.colore;if(p.gruppo)o.gruppo=p.gruppo;return o});
  const menu=toArr(L&&L.menu).filter(m=>m&&m.id&&m.nome).map(m=>({id:m.id,nome:m.nome,prezzo:m.prezzo||0,piatti:toArr(m.piatti).filter(id=>piatti.some(p=>p.id===id))}));
  return {reparti,piatti,menu};
}
function applyListino(L){
  L=normL(L);S.L=L;S.reparti=L.reparti;S.extra=[];
  S.varianti=L.menu.map(m=>({id:m.id,nome:m.nome,prezzo:m.prezzo}));
  S.portate=L.piatti.map(p=>{const inM=L.menu.filter(m=>m.piatti.includes(p.id)).map(m=>m.id);return {...p,reparti:p.rep?[{r:p.rep}]:[],menu:inM.length?inM:["-"]}});
}
/* primo avvio della v36: il listino nasce da quello della v35 (che resta com'era in config/menu).
   Gli id sono fissi, così due telefoni che lo preparano insieme scrivono la stessa cosa. */
function convertV35(d){
  d=d||{};
  const vars=toArr(d.varianti).length?toArr(d.varianti):DEFAULT_VAR,ports=toArr(d.portate).length?toArr(d.portate):DEFAULT_PORT;
  const reps=toArr(d.reparti).filter(r=>r&&r.id&&r.nome).map(r=>({id:r.id,nome:r.nome})),ok=id=>reps.some(r=>r.id===id);
  const need=(nome,bar)=>{let r=reps.find(x=>norm(x.nome)===norm(nome));if(!r){r={id:"r"+norm(nome).replace(/[^a-z0-9]/g,""),nome};reps.push(r)}if(bar)r.bar=true;return r.id};
  const piatti=[],byPort={};
  ports.forEach(p=>{if(!p||!p.id)return;const rs=toArr(p.reparti).filter(x=>x&&x.r&&ok(x.r)),list=rs.length?rs:[{r:need("Cucina")}];byPort[p.id]=[];
    list.forEach((x,i)=>{const it={id:"p-"+p.id+(list.length>1?"-"+x.r:""),nome:x.piatto||p.nome,rep:x.r,prezzo:i?0:(p.prezzo||0),prezzoBimbi:i?0:(p.prezzoBimbi||0)};
      if(!i&&p.colore)it.colore=p.colore;piatti.push(it);byPort[p.id].push(it.id)})});
  const barId=need("Bar",true);
  toArr(d.extra).forEach(x=>{if(!x||!x.id)return;const it={id:"e-"+x.id,nome:x.nome,rep:x.rep&&ok(x.rep)?x.rep:barId,prezzo:x.prezzo||0,prezzoBimbi:0};if(x.gruppo)it.gruppo=x.gruppo;piatti.push(it)});
  const menu=vars.filter(v=>v&&v.id).map(v=>({id:v.id,nome:v.nome,prezzo:v.prezzo||0,
    piatti:ports.filter(p=>p&&p.id&&(!p.menu||toArr(p.menu).includes(v.id))).flatMap(p=>byPort[p.id]||[])}));
  return normL({reparti:reps,piatti,menu});
}
function saveL(key,list,msgId,okT,log){
  return R("config/listino/"+key).set(list).then(()=>{if(okT)emsg(msgId,okT,true);logChange(log)},e=>emsg(msgId,errText(e)));
}
function priceDiffs(oldL,newL,label,key){
  return newL.map(n=>{const o=oldL.find(x=>x.id===n.id);if(!o)return null;const a=o[key||"prezzo"]||0,b=n[key||"prezzo"]||0;
    return a!==b?`${label} ${n.nome}: ${money(a)} → ${money(b)}`:null}).filter(Boolean).join("; ");
}
const pNome=id=>(S.L.piatti.find(p=>p.id===id)||{}).nome||"";

/* ---------- disegno ---------- */
function renderListino(){
  if(!S.L)return;
  const ae=document.activeElement,aid=ae&&ae.id&&/^(lp|lm|lr|l-new)/.test(ae.id)?ae.id:null,aval=aid?ae.value:null;
  const keep={};document.querySelectorAll("#p-listino input").forEach(i=>{if(i.id&&i.dataset.dirty==="1")keep[i.id]=i.value});
  renderListinoInner();
  Object.entries(keep).forEach(([id,v])=>{const el=$(id);if(!el)return;el.value=v;el.dataset.dirty="1"});
  if(aid&&$(aid)){const el=$(aid);el.value=aval;el.focus();try{el.setSelectionRange(aval.length,aval.length)}catch(e){}}
}
document.addEventListener("input",e=>{if(e.target.closest&&e.target.closest("#p-listino"))e.target.dataset.dirty="1"});
function repOpts(sel){return S.L.reparti.map(r=>`<option value="${esc(r.id)}" ${r.id===sel?"selected":""}>${esc(r.nome)}${r.bar?" (bar)":""}</option>`).join("")}
function renderListinoInner(){
  const L=S.L;
  if(!S.newMenu)S.newMenu=new Set();
  /* menù */
  $("l-var").innerHTML=L.menu.length?L.menu.map(m=>`<div class="vrow"><div class="top"><input type="text" class="lname" id="lmn-${esc(m.id)}" value="${esc(m.nome)}" aria-label="Nome del menù">
      <input type="text" inputmode="decimal" class="pricein" id="lmv-${esc(m.id)}" value="${euro(m.prezzo)}" placeholder="0,00" aria-label="Prezzo ${esc(m.nome)}">
      <button class="btn danger small" data-delmenu="${esc(m.id)}">Rimuovi</button></div>
    <div class="chips">${L.piatti.map(p=>`<button class="tog" data-mp="${esc(m.id)}|${esc(p.id)}" aria-pressed="${m.piatti.includes(p.id)}">${esc(p.nome)}</button>`).join("")}</div>
    <div class="sub">${m.piatti.length} piatti per coperto</div></div>`).join("")
    :'<div class="empty">Nessun menù: in cassa si vendono solo i piatti da soli.</div>';
  $("l-newports").innerHTML=L.piatti.map(p=>`<button class="tog" data-np="${esc(p.id)}" aria-pressed="${S.newMenu.has(p.id)}">${esc(p.nome)}</button>`).join("");
  /* piatti */
  const grp=[...new Set(["Bevande","Dolci","Altro",...L.piatti.map(p=>(p.gruppo||"").trim()).filter(Boolean)])];
  $("l-port").innerHTML=L.piatti.length?`<datalist id="xgruppi">${grp.map(g=>`<option value="${esc(g)}">`).join("")}</datalist>`+L.piatti.map((p,i)=>`<div class="xedit">
      <div class="top"><input type="color" class="pcol" data-pcol="${esc(p.id)}" value="${portColor(p.id)}" aria-label="Colore di ${esc(p.nome)}">
        <input type="text" class="lname" id="lpn-${esc(p.id)}" value="${esc(p.nome)}" aria-label="Nome del piatto">
        <button class="btn small" data-up="${i}" ${i?"":"disabled"} aria-label="Sposta su">↑</button><button class="btn small" data-down="${i}" ${i<L.piatti.length-1?"":"disabled"} aria-label="Sposta giù">↓</button>
        <button class="btn small danger" data-delp="${esc(p.id)}">Rimuovi</button></div>
      <div class="xf"><label><span class="label">Reparto</span><select id="lpr-${esc(p.id)}">${repOpts(p.rep)}</select></label>
        <label><span class="label">Gruppo in cassa</span><input type="text" id="lpg-${esc(p.id)}" list="xgruppi" value="${esc(p.gruppo||"")}" placeholder="Es. Bevande"></label>
        <label><span class="label">Prezzo da solo</span><input type="text" inputmode="decimal" id="lps-${esc(p.id)}" value="${euro(p.prezzo)}" placeholder="non si vende"></label>
        <label><span class="label">Da solo bambini</span><input type="text" inputmode="decimal" id="lpb-${esc(p.id)}" value="${euro(p.prezzoBimbi)}" placeholder="—"></label></div></div>`).join("")
    :'<div class="empty">Nessun piatto. Aggiungine uno qui sotto.</div>';
  $("l-newprep").innerHTML=repOpts($("l-newprep").value||(L.reparti.find(r=>!r.bar)||L.reparti[0]||{}).id);
  /* reparti */
  $("l-rep").innerHTML=L.reparti.length?L.reparti.map(r=>{const n=L.piatti.filter(p=>p.rep===r.id);
    return `<div class="vrow"><div class="top"><input type="text" class="lname" id="lrn-${esc(r.id)}" value="${esc(r.nome)}" aria-label="Nome del reparto">
      <button class="tog" data-repbar="${esc(r.id)}" aria-pressed="${!!r.bar}">È un bar</button>
      <button class="btn danger small" data-delrep="${esc(r.id)}">Rimuovi</button></div>
      <div class="sub">${n.length?n.map(p=>esc(p.nome)).join(", "):"Nessun piatto"}</div></div>`}).join("")
    :'<div class="empty">Nessun reparto: aggiungine almeno uno (es. Cucina, Bar).</div>';
  renderLog();
}
function renderLog(){
  const L=Object.values(S.logMap).sort((a,b)=>b.t-a.t).slice(0,25);
  $("l-log").innerHTML=L.length?L.map(l=>`<div class="li plain two"><span>${esc(l.cosa)}<div class="sub">${fmtTime(l.t)} · ${esc(l.chi||"")}</div></span></div>`).join("")
    :'<div class="empty">Nessuna modifica finora. Qui comparirà chi cambia prezzi, menù o ordini, e quando.</div>';
}

/* ---------- menù ---------- */
$("l-var").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const L=S.L;
  if(b.dataset.delmenu){if(!armed(b))return;const m=L.menu.find(x=>x.id===b.dataset.delmenu);if(!m)return;
    saveL("menu",L.menu.filter(x=>x.id!==m.id),"l-vmsg","Menù rimosso.","Tolto il menù "+m.nome);return}
  if(b.dataset.mp){const [mid,pid]=b.dataset.mp.split("|"),m=L.menu.find(x=>x.id===mid);if(!m)return;const on=m.piatti.includes(pid);
    if(on&&m.piatti.length<2){emsg("l-vmsg","Un menù deve avere almeno un piatto.");return}
    const list=L.menu.map(x=>x.id!==mid?x:{...x,piatti:on?x.piatti.filter(y=>y!==pid):L.piatti.map(p=>p.id).filter(id=>id===pid||x.piatti.includes(id))});
    saveL("menu",list,"l-vmsg",`${m.nome}: ${on?"tolto":"aggiunto"} ${pNome(pid)}.`,`Menù ${m.nome}: ${on?"tolto":"aggiunto"} ${pNome(pid)}`)}
});
$("l-var").addEventListener("change",e=>{const id=e.target.id||"",L=S.L;
  if(id.startsWith("lmv-")){const m=L.menu.find(x=>"lmv-"+x.id===id);if(!m)return;const v=parsePrice(e.target.value);e.target.dataset.dirty="";if(v===m.prezzo)return;
    saveL("menu",L.menu.map(x=>x.id===m.id?{...x,prezzo:v}:x),"l-vmsg","Prezzo salvato.",`Prezzo menù ${m.nome}: ${money(m.prezzo)} → ${money(v)}`)}
  if(id.startsWith("lmn-")){const m=L.menu.find(x=>"lmn-"+x.id===id);if(!m)return;const v=e.target.value.trim();e.target.dataset.dirty="";if(!v||v===m.nome){e.target.value=m.nome;return}
    saveL("menu",L.menu.map(x=>x.id===m.id?{...x,nome:v}:x),"l-vmsg","Nome salvato.",`Menù ${m.nome} → ${v}`)}
});
$("l-saveprices").addEventListener("click",()=>{const L=S.L,n=L.menu.map(m=>({...m,prezzo:parsePrice(($("lmv-"+m.id)||{}).value)}));
  saveL("menu",n,"l-vmsg","Prezzi menù salvati.",priceDiffs(L.menu,n,"Prezzo menù"))});
$("l-newports").addEventListener("click",e=>{const b=e.target.closest("button[data-np]");if(!b)return;const id=b.dataset.np;
  S.newMenu.has(id)?S.newMenu.delete(id):S.newMenu.add(id);b.setAttribute("aria-pressed",String(S.newMenu.has(id)))});
$("l-addvar").addEventListener("click",async()=>{const L=S.L;
  const nome=$("l-newvar").value.trim();if(!nome){emsg("l-vmsg","Scrivi il nome del menù.");return}
  if(!S.newMenu.size){emsg("l-vmsg","Tocca i piatti compresi nel nuovo menù.");return}
  if(L.menu.some(v=>norm(v.nome)===norm(nome))){emsg("l-vmsg","Esiste già un menù con questo nome.");return}
  const m={id:rid("v"),nome,prezzo:parsePrice($("l-newprice").value),piatti:L.piatti.map(p=>p.id).filter(id=>S.newMenu.has(id))};
  await saveL("menu",[...L.menu,m],"l-vmsg",`Menù ${nome} aggiunto.`,`Nuovo menù ${nome} (${money(m.prezzo)}) con ${m.piatti.map(pNome).join(", ")}`);
  $("l-newvar").value="";$("l-newprice").value="";["l-newvar","l-newprice"].forEach(id=>{$(id).dataset.dirty=""});S.newMenu=new Set();renderListino();
});

/* ---------- piatti ---------- */
$("l-port").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const L=S.L,list=[...L.piatti];
  if(b.dataset.up){const i=+b.dataset.up;[list[i-1],list[i]]=[list[i],list[i-1]];saveL("piatti",list,"l-pmsg","Ordine salvato.");return}
  if(b.dataset.down){const i=+b.dataset.down;[list[i+1],list[i]]=[list[i],list[i+1]];saveL("piatti",list,"l-pmsg","Ordine salvato.");return}
  if(b.dataset.delp){const p=L.piatti.find(x=>x.id===b.dataset.delp);if(!p)return;
    const only=L.menu.filter(m=>m.piatti.length===1&&m.piatti[0]===p.id);
    if(only.length){emsg("l-pmsg",`${p.nome} è l'unico piatto di ${only.map(m=>m.nome).join(", ")}: togli prima il menù.`);return}
    if(!armed(b))return;
    R("config/listino").update({piatti:list.filter(x=>x.id!==p.id),menu:L.menu.map(m=>({...m,piatti:m.piatti.filter(id=>id!==p.id)}))})
      .then(()=>{emsg("l-pmsg",`${p.nome} rimosso (anche dai menù).`,true);logChange("Tolto il piatto "+p.nome)},err=>emsg("l-pmsg",errText(err)))}
});
$("l-port").addEventListener("change",e=>{const t=e.target,L=S.L;
  if(t.dataset.pcol){const p=L.piatti.find(x=>x.id===t.dataset.pcol);if(p)saveL("piatti",L.piatti.map(x=>x.id===p.id?{...x,colore:t.value}:x),"l-pmsg",`Colore di ${p.nome} salvato.`);return}
  const m=/^lp([nrgsb])-(.+)$/.exec(t.id||"");if(!m)return;const p=L.piatti.find(x=>x.id===m[2]);if(!p)return;t.dataset.dirty="";
  const v=t.value.trim();let nx={...p},log="";
  if(m[1]==="n"){if(!v||v===p.nome){t.value=p.nome;return}nx.nome=v;log=`Piatto ${p.nome} → ${v}`}
  if(m[1]==="r"){if(v===p.rep)return;nx.rep=v;log=`${p.nome}: lo prepara ${repNome(v)}`}
  if(m[1]==="g"){if(v===(p.gruppo||""))return;if(v)nx.gruppo=v;else delete nx.gruppo;log=`${p.nome}: gruppo «${v||"—"}»`}
  if(m[1]==="s"){const x=parsePrice(v);if(x===p.prezzo)return;nx.prezzo=x;log=`Prezzo da solo ${p.nome}: ${money(p.prezzo)} → ${money(x)}`}
  if(m[1]==="b"){const x=parsePrice(v);if(x===p.prezzoBimbi)return;nx.prezzoBimbi=x;log=`Prezzo da solo bambini ${p.nome}: ${money(p.prezzoBimbi)} → ${money(x)}`}
  saveL("piatti",L.piatti.map(x=>x.id===p.id?nx:x),"l-pmsg","Salvato.",log);
});
$("l-addport").addEventListener("click",()=>{const L=S.L,nome=$("l-newport").value.trim(),rep=$("l-newprep").value;if(!nome){$("l-newport").focus();return}
  if(!rep){emsg("l-pmsg","Prima aggiungi un reparto.");return}
  if(L.piatti.some(p=>norm(p.nome)===norm(nome))){emsg("l-pmsg","Esiste già un piatto con questo nome.");return}
  const p={id:rid("p"),nome,rep,prezzo:parsePrice($("l-newpprice").value),prezzoBimbi:0};
  $("l-newport").value="";$("l-newpprice").value="";["l-newport","l-newpprice"].forEach(id=>{$(id).dataset.dirty=""});
  saveL("piatti",[...L.piatti,p],"l-pmsg",`${nome} aggiunto: ora mettilo nei menù che lo comprendono.`,`Nuovo piatto ${nome} (${repNome(rep)})`)});
$("l-newport").addEventListener("keydown",e=>{if(e.key==="Enter")$("l-addport").click()});

/* ---------- reparti ---------- */
$("l-addrep").addEventListener("click",()=>{const L=S.L,nome=$("l-newrep").value.trim();if(!nome){$("l-newrep").focus();return}
  if(L.reparti.some(r=>norm(r.nome)===norm(nome))){emsg("l-rmsg","Esiste già un reparto con questo nome.");return}
  const r={id:rid("r"),nome};if($("l-newrepbar").checked)r.bar=true;
  $("l-newrep").value="";$("l-newrepbar").checked=false;
  saveL("reparti",[...L.reparti,r],"l-rmsg",`Reparto ${nome} aggiunto.`,"Nuovo reparto "+nome)});
$("l-newrep").addEventListener("keydown",e=>{if(e.key==="Enter")$("l-addrep").click()});
$("l-rep").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const L=S.L;
  if(b.dataset.repbar){const r=L.reparti.find(x=>x.id===b.dataset.repbar);if(!r)return;
    saveL("reparti",L.reparti.map(x=>{if(x.id!==r.id)return x;const y={id:x.id,nome:x.nome};if(!r.bar)y.bar=true;return y}),"l-rmsg",
      r.bar?`${r.nome}: ora lo vede la cucina.`:`${r.nome}: ora lo vede la pagina Bar.`,`Reparto ${r.nome}: ${r.bar?"cucina":"bar"}`);return}
  if(b.dataset.delrep){const r=L.reparti.find(x=>x.id===b.dataset.delrep);if(!r)return;const n=L.piatti.filter(p=>p.rep===r.id);
    if(n.length){emsg("l-rmsg",`${r.nome} prepara ${n.map(p=>p.nome).join(", ")}: sposta prima quei piatti in un altro reparto.`);return}
    if(!armed(b))return;saveL("reparti",L.reparti.filter(x=>x.id!==r.id),"l-rmsg",`Reparto ${r.nome} rimosso.`,"Tolto il reparto "+r.nome)}
});
$("l-rep").addEventListener("change",e=>{const t=e.target,L=S.L;if(!(t.id||"").startsWith("lrn-"))return;const r=L.reparti.find(x=>"lrn-"+x.id===t.id);if(!r)return;
  const v=t.value.trim();t.dataset.dirty="";if(!v||v===r.nome){t.value=r.nome;return}
  saveL("reparti",L.reparti.map(x=>x.id===r.id?{...x,nome:v}:x),"l-rmsg","Nome salvato.",`Reparto ${r.nome} → ${v}`)});
