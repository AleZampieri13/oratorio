/* Bar e scorte bevande */
/* ---------- BAR ---------- */
function barWho(o){return o.asportoSubito?"Asporto":ownerId(o)?nameOf(ownerId(o),o.cameriere):o.asporto?"Asporto":"Al banco"}
function renderBar(){
  const q=ordersArr().filter(o=>o.bar&&o.bar.stato==="chiamata").sort((a,b)=>(a.bar.t||0)-(b.bar.t||0));
  const ready=ordersArr().filter(o=>o.bar&&o.bar.stato==="pronta").sort((a,b)=>(a.bar.t||0)-(b.bar.t||0));
  const need={};q.forEach(o=>barExtras(o).forEach(x=>{need[x.id]=(need[x.id]||0)+x.qta}));
  $("b-sum").innerHTML=S.extra.map(x=>{const l=leftX(x.id),n=need[x.id]||0;if(!n&&l==null)return "";
    const parts=[esc(x.nome)];if(n)parts.push(`<b>${n}</b> da fare`);if(l!=null)parts.push(leftTxt(l));
    return `<span class="${stockCls(l)}">${parts.join(" · ")}</span>`}).join("");
  S.extra.forEach(x=>{const el=$("bl-"+x.id);if(el){const l=leftX(x.id);el.textContent=l==null?"nessun limite":leftTxt(l);el.className="sub "+stockCls(l)}});
  const dis=o=>S.pending.has(o.numero+"|bar")?"disabled":"";
  $("b-queue").innerHTML=q.length?q.map(o=>{const late=o.bar.t&&(Date.now()-o.bar.t)>10*60000;
    const wn=barWho(o);
    return `<article class="kcard ${late?"late":""}"><div class="top"><span class="n nm">${esc(wn)}</span><span class="age">${ago(o.bar.t)}</span></div>
      <div class="what">${o.nome?esc(o.nome)+" ":""}<span class="label">· n. ${o.numero}</span></div>${o.asporto&&wn!=="Asporto"?'<span class="pill asp">Asporto</span>':""}
      <ul>${barExtras(o).map(x=>`<li><b>${x.qta}</b>${esc(x.nome)}</li>`).join("")}</ul>
      <button class="btn primary big" ${dis(o)} data-set="${o.numero}|bar|pronta">Pronto</button></article>`}).join("")
    :'<div class="panel"><div class="empty">Niente da preparare.</div></div>';
  $("b-ready").innerHTML=ready.length?ready.map(o=>{const wn=barWho(o);
    return `<div class="li plain two"><span><b class="kwho">${esc(wn)}</b> · ${barExtras(o).map(x=>x.qta+" "+esc(x.nome)).join(", ")}<div class="sub">n. ${o.numero}${o.nome?" · "+esc(o.nome):""} · ${ago(o.bar.t)==="adesso"?"adesso":"da "+ago(o.bar.t)}</div></span>
      <span class="row"><button class="btn small go" ${dis(o)} data-set="${o.numero}|bar|servita">Portato</button><button class="btn small" ${dis(o)} data-bunready="${o.numero}">Annulla</button></span></div>`}).join("")
    :'<div class="empty">Nessuna.</div>';
  renderGive();
}
function renderGive(){
  const box=$("b-give"),v=$("b-num").value.trim();if(!v){box.hidden=true;box.innerHTML="";return}
  const o=orderByNum(Number(v));box.hidden=false;
  if(!o){box.innerHTML='<div class="note">Nessun ordine con questo numero.</div>';return}
  if(!o.bar){box.innerHTML='<div class="note">Questo ordine non ha bevande.</div>';return}
  const st=o.bar.stato||"attesa";
  if(st==="servita"){box.innerHTML=`<div class="wait ok">N. ${o.numero} · già dato</div>`;return}
  const note=o.asporto?"Asporto: di solito lo consegna la cassa.":(o.fila||ownerId(o))?(st==="pronta"?`Pronte per ${barWho(o)}: controlla che non le abbia già prese.`:`Lo segue ${barWho(o)}.`):"";
  box.innerHTML=`${o.nome?`<div class="who"><b>${esc(o.nome)}</b></div>`:""}
    <ul>${barExtras(o).map(x=>`<li><b>${x.qta}</b> ${esc(x.nome)}</li>`).join("")}</ul>
    ${note?`<div class="note">${note}</div>`:""}
    <button class="btn go big" id="b-dato" ${S.pending.has(o.numero+"|bar")?"disabled":""} data-n="${o.numero}">Dato</button>`;
}
$("b-num").addEventListener("input",renderGive);
$("b-num").addEventListener("keydown",e=>{if(e.key==="Enter"){const b=$("b-dato");if(b&&!b.disabled)b.click()}});
$("b-give").addEventListener("click",async e=>{
  const b=e.target.closest("#b-dato");if(!b||b.disabled)return;
  await setStato(Number(b.dataset.n),"bar","servita");
  $("b-num").value="";renderGive();
});

function renderBarStock(){
  $("b-stock").innerHTML=S.extra.length?S.extra.map(x=>`<div class="xrow"><b>${esc(x.nome)}</b><span class="sub" id="bl-${esc(x.id)}"></span>
    <input type="number" inputmode="numeric" id="bx-${esc(x.id)}" placeholder="quante" aria-label="Quante ${esc(x.nome)} aggiungi">
    <button class="btn" data-addx="${esc(x.id)}">+ Aggiungi</button></div>`).join(""):'<div class="empty">Nessuna bevanda nel listino.</div>';
  if(S.role==="bar")renderBar();
}
$("b-stock").addEventListener("click",e=>{
  const b=e.target.closest("button[data-addx]");if(!b)return;const id=b.dataset.addx,inp=$("bx-"+id),n=parseInt(inp.value,10),m=$("b-stock-msg");
  if(!n){inp.focus();return}
  const used=usedX(id);b.disabled=true;
  R("config/scorteBar/"+id).transaction(cur=>{const base=(cur==null||cur==="")?used:Number(cur);return Math.max(used,base+n)})
    .then(()=>{const x=S.extra.find(e=>e.id===id);m.className="msg ok";m.textContent=`${x?x.nome:""}: ${n>0?"+":""}${n}`;inp.value="";setTimeout(()=>{if(m.textContent.endsWith(String(n)))m.textContent=""},3000)},err=>{m.className="msg err";m.textContent=errText(err)})
    .finally(()=>{b.disabled=false});
});
$("b-stock").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id&&e.target.id.startsWith("bx-")){const b=e.target.parentNode.querySelector("button[data-addx]");b&&b.click()}});

