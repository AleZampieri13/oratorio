/* Evento: riepilogo, tempi, chiusura cassa */
/* ---------- EVENTO: riepilogo ---------- */
function totals(){
  const O=ordersArr();
  return {n:O.length,cop:O.reduce((a,o)=>a+cop(righe(o)),0),cassa:O.reduce((a,o)=>a+(o.incassato||0),0),
    valore:O.reduce((a,o)=>a+(o.importo||0),0),offerti:r2(O.reduce((a,o)=>a+(o.offerto||0),0))};
}
function postIds(){
  const D=Object.values(S.offMap);
  return [...new Set([...S.users.filter(u=>hasRole(u,"cassa")).map(u=>u.id),...Object.keys(S.post).filter(id=>S.post[id]&&S.post[id].fondo),
    ...ordersArr().map(o=>o.creatoDaId||"?"),...D.map(d=>d.daId||"?")])];
}
function postNome(id){const D=Object.values(S.offMap);const any=ordersArr().find(o=>(o.creatoDaId||"?")===id)||D.find(d=>(d.daId||"?")===id);return nameOf(id,any&&(any.creatoDa||any.da))||"Senza nome"}
function postCalc(id){
  const t=payTotals(o=>(o.creatoDaId||"?")===id,d=>(d.daId||"?")===id),pv=S.post[id]||{};
  const fondo=Number(pv.fondo)||0,contato=pv.contato==null?null:Number(pv.contato),attesi=r2(fondo+t.contanti);
  return {...t,fondo,contato,attesi,diff:contato==null?null:r2(contato-attesi)};
}
function diffHtml(d){
  if(d==null)return "";
  return d===0?`<span class="resto ok"><small>Differenza</small>${money(0)} · tutto torna</span>`:d>0?`<span class="resto ok"><small>In più</small>${money(d)}</span>`:`<span class="resto err"><small>Mancano</small>${money(-d)}</span>`;
}
const eur2=v=>v==null||v===""?"":Number(v).toFixed(2).replace(".",",");
function closeTotals(){
  const ids=postIds();const T=payTotals();let fondo=0,contato=0,anyCont=false;
  ids.forEach(id=>{const c=postCalc(id);fondo+=c.fondo;if(c.contato!=null){contato+=c.contato;anyCont=true}});
  return {T,fondo:r2(fondo),attesi:r2(fondo+T.contanti),contato:anyCont?r2(contato):null,ids};
}
function renderClose(){
  const ids=postIds().sort((a,b)=>postNome(a).localeCompare(postNome(b))),key=ids.join(",");
  if(key!==S.closeKey){S.closeKey=key;
    $("e-close").innerHTML=ids.length?ids.map(id=>`<div class="post" data-post="${esc(id)}"><b>${esc(postNome(id))}</b>
      <div class="nums" id="pn-${esc(id)}"></div>
      <div class="ins"><label>Fondo<input type="text" inputmode="decimal" id="pf-${esc(id)}" placeholder="0,00"></label>
        <label>Contati<input type="text" inputmode="decimal" id="pc-${esc(id)}" placeholder="—"></label>
        <button class="btn small" data-savepost="${esc(id)}">Salva</button></div>
      <div id="pd-${esc(id)}"></div></div>`).join(""):'<div class="empty">Nessuna cassa ancora. Aggiungi le persone con ruolo Cassa nella scheda Persone.</div>';
  }
  ids.forEach(id=>{const c=postCalc(id);
    $("pn-"+id).innerHTML=`<span><small>Ordini</small>${c.n}</span><span><small>Contanti</small>${money(c.contanti)}</span><span><small>POS</small>${money(c.pos)}</span><span><small>di cui offerte</small>${money(c.offerte)}</span><span><small>Contanti attesi</small>${money(c.attesi)}</span>`;
    if(document.activeElement!==$("pf-"+id))$("pf-"+id).value=c.fondo?eur2(c.fondo):"";
    if(document.activeElement!==$("pc-"+id))$("pc-"+id).value=c.contato==null?"":eur2(c.contato);
    $("pd-"+id).innerHTML=diffHtml(c.diff);});
  const X=closeTotals();
  $("e-close-tot").innerHTML=`<div class="post" style="border-color:var(--accent)"><b>Totale di tutte le casse</b><div class="nums">
    <span><small>Contanti</small>${money(X.T.contanti)}</span><span><small>POS</small>${money(X.T.pos)}</span><span><small>di cui offerte</small>${money(X.T.offerte)}</span>
    <span><small>Fondi</small>${money(X.fondo)}</span><span><small>Contanti attesi</small>${money(X.attesi)}</span>${X.contato!=null?`<span><small>Contati</small>${money(X.contato)}</span>`:""}</div>
    ${X.contato!=null?diffHtml(r2(X.contato-X.attesi)):""}</div>`;
}
function savePost(id,fondoStr,contStr){
  const upd={fondo:parsePrice(fondoStr)};if(contStr!==undefined)upd.contato=String(contStr).trim()===""?null:parsePrice(contStr);
  return R("config/cassa/postazioni/"+id).update(upd).catch(e=>showBanner(errText(e)));
}
$("e-close").addEventListener("click",e=>{const b=e.target.closest("button[data-savepost]");if(!b||!S.me||!hasRole(S.me,"master"))return;const id=b.dataset.savepost;
  savePost(id,$("pf-"+id).value,$("pc-"+id).value).then(()=>{b.textContent="Salvato";setTimeout(()=>{b.textContent="Salva"},1500)})});
/* tempi: preparazione (chiamata → pronto) e attesa al bancone (pronto → consegnato) */
function timesData(){
  const O=ordersArr(),st=a=>a.length?{n:a.length,avg:a.reduce((x,y)=>x+y,0)/a.length,max:Math.max(...a)}:{n:0,avg:null,max:null};
  const rows=S.portate.map(p=>{const cook=[],wait=[];
    O.forEach(o=>{const c=o.portate&&o.portate[p.id];if(!c)return;const ready=c.stato==="pronta"?c.t:c.stato==="servita"?c.tp:null;
      if(c.tc&&ready&&ready>=c.tc)cook.push(ready-c.tc);if(c.stato==="servita"&&c.tp&&c.t>=c.tp)wait.push(c.t-c.tp)});
    return {tipo:"Piatto",nome:p.nome,cook:st(cook),wait:st(wait)}});
  repList().forEach(r=>{const cook=[];
    O.forEach(o=>Object.values(o.portate||{}).forEach(c=>{const v=c.rep&&c.rep[r.id];if(!v||!v.t)return;const call=c.tc||(c.stato==="chiamata"?c.t:null);if(call&&v.t>=call)cook.push(v.t-call)}));
    rows.push({tipo:"Reparto",nome:r.nome,cook:st(cook),wait:null})});
  return rows;
}
const mins=ms=>ms==null?"—":ms<60000?"meno di 1 min":Math.round(ms/60000)+" min";
function renderTimes(){
  const rows=timesData();
  $("e-times").innerHTML=`<table><thead><tr><th></th><th>Piatti</th><th>Preparazione media</th><th>Più lunga</th><th>Attesa al bancone</th><th>Più lunga</th></tr></thead><tbody>`+
    rows.map(r=>`<tr><td>${r.tipo==="Reparto"?"Reparto ":""}<b>${esc(r.nome)}</b></td><td>${r.cook.n}</td><td>${mins(r.cook.avg)}</td><td>${mins(r.cook.max)}</td><td>${r.wait?mins(r.wait.avg):""}</td><td>${r.wait?mins(r.wait.max):""}</td></tr>`).join("")+`</tbody></table>`;
}
function renderEvent(){
  const O=ordersArr(),P=prensArr(),T=totals();
  const perVar={};O.forEach(o=>righe(o).forEach(r=>{perVar[r.nome]=(perVar[r.nome]||0)+r.qta}));
  const pc=P.reduce((a,p)=>a+cop(righe(p)),0);
  const perX={};O.forEach(o=>extras(o).forEach(r=>{perX[r.nome]=(perX[r.nome]||0)+r.qta}));
  $("e-stats").innerHTML=`<div><span class="label">Ordini</span><b>${T.n}</b></div><div><span class="label">Coperti</span><b>${T.cop}</b></div>`+
    S.portate.map(p=>`<div><span class="label">${esc(p.nome)}</span><b>${usedFor(p.id)}</b></div>`).join("")+
    (P.length?`<div><span class="label">Coperti prenotati</span><b>${pc}</b></div>`:"")+
    Object.keys(perX).map(n=>`<div><span class="label">${esc(n)}</span><b>${perX[n]}</b></div>`).join("")+
    (payTotals().offerte>0?`<div><span class="label">Offerte</span><b>${money(payTotals().offerte)}</b></div>`:"")+
    (T.offerti>0?`<div><span class="label">Pasti offerti</span><b>${money(T.offerti)}</b></div>`:"")+
    (T.valore>0?`<div><span class="label">Incassato in cassa</span><b>${money(T.cassa)}</b></div><div><span class="label">Totale</span><b>${money(T.valore)}</b></div>`:"");
  renderClose();renderTimes();
  const cnt=(k,st)=>O.filter(o=>o.portate&&o.portate[k]&&(o.portate[k].stato||"attesa")===st).length;
  $("e-table").innerHTML=`<table><thead><tr><th>Piatto</th><th>Da chiamare</th><th>In preparazione</th><th>Pronti</th><th>Portati</th></tr></thead><tbody>`+
    S.portate.map(p=>`<tr><td>${esc(p.nome)}</td><td>${cnt(p.id,"attesa")}</td><td>${cnt(p.id,"chiamata")}</td><td>${cnt(p.id,"pronta")}</td><td>${cnt(p.id,"servita")}</td></tr>`).join("")+`</tbody></table>`;
  renderPrenList();
}

