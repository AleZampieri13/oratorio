/* Cassa: nuovo ordine, modifica, rettifica, annullo */
/* ---------- CASSA ---------- */
function stepperHtml(list,qty,attr){
  const anyP=S.varianti.some(x=>x.prezzo>0)||S.extra.some(x=>x.prezzo>0)||S.portate.some(x=>x.prezzo>0||x.prezzoBimbi>0);
  const out=v=>{let miss=[];
    if(attr==="data-sstep"||attr==="data-esstep"){const l=stockLeft(v.pid);if(l!=null&&l<=0)miss=["esaurito"]}
    else if(attr==="data-xstep"||attr==="data-exstep"){const l=leftX(v.id);if(l!=null&&l<=0)miss=["esaurito"]}
    else{miss=S.portate.filter(p=>applies(p,v.id)&&stockLeft(p.id)!=null&&stockLeft(p.id)<=0).map(p=>"manca "+p.nome)}
    return miss.length?` <span class="label" style="color:var(--danger)">${esc(miss.join(", "))}</span>`:""};
  return list.map(v=>`<div class="stepper"><span class="name">${esc(v.nome)}${v.prezzo>0?` <span class="label">${money(v.prezzo)}</span>`:anyP?` <span class="label" style="color:var(--danger)">prezzo non impostato</span>`:""}${out(v)}</span><span class="ctl">
    <button ${attr}="${esc(v.id)}" data-d="-1" aria-label="Togli ${esc(v.nome)}">−</button><output>${qty[v.id]||0}</output>
    <button ${attr}="${esc(v.id)}" data-d="1" aria-label="Aggiungi ${esc(v.nome)}">+</button></span></div>`).join("");
}
function paintTotal(prefix,b,paid,pay){
  const off=parsePrice($(prefix+"-off").value),toPay=r2(b.due+off);
  const el=$(prefix+"-total");
  if(prefix==="x"){el.hidden=!(toPay>0);el.className="totline";el.innerHTML=`<span class="label">Da incassare</span><b>${money(toPay)}</b>`;$("x-pay-row").hidden=!(toPay>0);
    $("x-pay").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pay===pay)));return}
  $("c-paybox").hidden=!(toPay>0);
  el.className="totline";el.innerHTML=`<span class="label">Da incassare</span><b>${money(toPay)}</b>`;
  $("c-pay").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pay===pay)));
  paintCash(toPay,pay);
  if(!S.aspConfirm)$("c-create").textContent=toPay>0?`Incassa ${money(toPay)} e crea`:"Crea ordine";
}
function paintCash(toPay,pay){
  const box=$("c-cash"),el=$("c-resto"),btn=$("c-off-resto");
  box.hidden=!(toPay>0&&pay==="contanti");btn.hidden=true;
  const ric=parsePrice($("c-ric").value);
  if(box.hidden||!ric){el.className="resto";el.innerHTML="";return}
  const resto=r2(ric-toPay);
  if(resto<0){el.className="resto err";el.innerHTML=`<small>Mancano</small>${money(-resto)}`}
  else{el.className="resto ok";el.innerHTML=`<small>Resto</small>${money(resto)}`;btn.hidden=resto<=0}
}
function repaintC(){paintTotal("c",bill(S.qty,S.xqty,$("c-paid").checked,S.sqty),$("c-paid").checked,S.pay)}
$("c-off").addEventListener("input",repaintC);
$("c-ric").addEventListener("input",repaintC);
$("c-ric").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();createOrder()}});
function hideDone(){$("c-last-wrap").hidden=true}
["c-search","c-nome","c-note"].forEach(id=>$(id).addEventListener("input",hideDone));
$("c-ric").addEventListener("input",()=>{$("c-ric").classList.remove("bad");if($("c-msg").textContent==="Scrivi quanto ti ha dato il cliente.")$("c-msg").textContent=""});
$("c-nome").addEventListener("input",()=>{$("c-nome").classList.remove("bad");if($("c-msg").textContent==="Scrivi il nominativo.")$("c-msg").textContent=""});
["c-steppers","c-sing","c-extra"].forEach(id=>$(id).addEventListener("click",e=>{if(e.target.closest("button"))hideDone()}));
$("c-off-resto").addEventListener("click",()=>{
  const b=bill(S.qty,S.xqty,$("c-paid").checked,S.sqty),off=parsePrice($("c-off").value),ric=parsePrice($("c-ric").value);
  const resto=r2(ric-(b.due+off));if(resto>0){$("c-off").value=r2(off+resto).toFixed(2).replace(".",",");repaintC()}
});
function renderStock(){
  const box=$("c-stock"),lim=S.portate.filter(p=>stockLeft(p.id)!=null),limx=S.extra.filter(x=>leftX(x.id)!=null);
  box.hidden=!lim.length&&!limx.length;
  box.innerHTML=lim.map(p=>{const l=stockLeft(p.id);return `<span class="pill ${stockCls(l)||"wait"}">${esc(p.nome)}: ${leftTxt(l)}</span>`}).join("")+
    limx.map(x=>{const l=leftX(x.id);return `<span class="pill ${stockCls(l)||"wait"}">${esc(x.nome)}: ${leftTxt(l)}</span>`}).join("");
}
function stockProblems(rr,ss,xx){
  return [...S.portate.map(p=>{const l=stockLeft(p.id);if(l==null)return null;const need=cop(rr.filter(r=>applies(p,r.id)))+cop((ss||[]).filter(s=>s.pid===p.id));return need>l?{p,l,need,what:"porzioni"}:null}),
    ...(xx||[]).map(x=>{const l=leftX(x.id);return l!=null&&x.qta>l?{p:{id:"x-"+x.id,nome:x.nome},l,need:x.qta,what:"pezzi"}:null})].filter(Boolean);
}
const isBoss=()=>!!S.me&&hasRole(S.me,"master");
/* aggiorna le scritte «esaurito» quando altri ordini consumano le porzioni, senza toccare il resto del modulo */
function refreshStepLabels(){
  [["c-steppers",S.varianti,S.qty,"data-step"],["c-extra",S.extra,S.xqty,"data-xstep"],["c-sing",singlesList(),S.sqty,"data-sstep"]].forEach(([id,l,q,a])=>{
    const h=stepperHtml(l,q,a);if($(id).dataset.h!==h){$(id).innerHTML=h;$(id).dataset.h=h}});
}
function stockTxt(probs){return probs.map(x=>x.l<=0?`${x.p.nome}: esaurito`:`${x.p.nome}: ne restano solo ${x.l} (ne servono ${x.need})`).join(". ")}
function stockBlockMsg(probs){
  const menuHit=probs.some(x=>!String(x.p.id).startsWith("x-")&&S.varianti.some(v=>applies(x.p,v.id)));
  return stockTxt(probs)+". Togli dall'ordine quello che manca"+(menuHit?" (per i menù serve un menù che non comprende quella portata: il master lo crea in Listino)":"")+". Se ne hanno ancora, cucina o bar aggiungono le porzioni; altrimenti chiedi al master.";
}
/* problemi di porzioni per una modifica: conta solo quello che si aggiunge rispetto all'ordine com'era */
function stockProblemsDelta(o,rr,ss,xx){
  return [...S.portate.map(p=>{const l=stockLeft(p.id);if(l==null)return null;
      const had=o.portate&&o.portate[p.id]?cop(righeFor(o,p.id)):0,need=cop(rr.filter(r=>applies(p,r.id)))+cop((ss||[]).filter(s=>s.pid===p.id));
      return need-had>l?{p,l,need:need-had,what:"porzioni"}:null}),
    ...(xx||[]).map(x=>{const l=leftX(x.id);if(l==null)return null;const had=extras(o).filter(y=>y.id===x.id).reduce((a,y)=>a+y.qta,0);
      return x.qta-had>l?{p:{id:"x-"+x.id,nome:x.nome},l,need:x.qta-had,what:"pezzi"}:null})].filter(Boolean);
}
function renderSteppers(){
  S.aspConfirm=null;$("c-create").textContent="Crea ordine";
  $("c-steppers").innerHTML=stepperHtml(S.varianti,S.qty,"data-step");
  $("c-extra-box").hidden=!S.extra.length;$("c-extra").innerHTML=stepperHtml(S.extra,S.xqty,"data-xstep");
  const sl=singlesList();$("c-sing-box").hidden=!sl.length;$("c-sing").innerHTML=stepperHtml(sl,S.sqty,"data-sstep");
  paintTotal("c",bill(S.qty,S.xqty,$("c-paid").checked,S.sqty),$("c-paid").checked,S.pay);
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
$("c-extra").addEventListener("click",e=>{const b=e.target.closest("button[data-xstep]");if(!b)return;
  const id=b.dataset.xstep;S.xqty[id]=Math.max(0,(S.xqty[id]||0)+Number(b.dataset.d));renderSteppers();$("c-msg").textContent=""});
$("c-pay").addEventListener("click",e=>{const b=e.target.closest("button[data-pay]");if(!b)return;S.pay=b.dataset.pay;renderSteppers()});
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
    <span><b>${esc(p.nome)}</b><div class="chips" style="margin-top:4px">${righeChips(righe(p))}</div></span>
    ${p.stato==="arrivata"?`<span class="pill ready">Arrivati · n. ${esc(p.ordine)}</span>`:`<span class="pill wait">${cop(righe(p))} coperti</span>`}</button>`).join("")
    :'<div class="empty" style="padding:10px 12px">Nessuna prenotazione trovata. Puoi creare l\'ordine lo stesso.</div>';
}
$("c-search").addEventListener("input",renderSearch);
$("c-results").addEventListener("click",e=>{const b=e.target.closest("button[data-pren]");if(b)selectPren(b.dataset.pren)});
function selectPren(id){
  const p=S.prenMap[id];if(!p)return;
  S.selPren=id;S.qty={};righe(p).forEach(r=>{if(S.varianti.some(v=>v.id===r.id))S.qty[r.id]=r.qta});
  $("c-nome").value=p.nome||"";$("c-note").value=p.note||"";$("c-search").value="";$("c-paid").checked=false;S.stockWarn=null;
  renderSearch();renderSteppers();renderSel();$("c-msg").textContent="";
}
function renderSel(){const p=S.selPren&&S.prenMap[S.selPren];$("c-sel").hidden=!p;if(p)$("c-sel-t").textContent="Prenotazione: "+p.nome}
function resetForm(){S.selPren=null;S.qty={};S.xqty={};S.sqty={};$("c-asp").checked=false;S.aspMode="subito";S.pay="contanti";S.stockWarn=null;$("c-off").value="";$("c-ric").value="";$("c-nome").value="";$("c-note").value="";$("c-paid").checked=false;renderSel();renderSteppers()}
$("c-sel-x").addEventListener("click",resetForm);
const PAY_LBL={contanti:"contanti",pos:"POS"};
function canUndo(o){return !!o&&!o.asportoSubito&&Date.now()-(o.creato||0)<60000&&!isLocked(o)&&(!o.bar||(o.bar.stato||"attesa")==="attesa")}
function renderTicket(){
  const wrap=$("c-last-wrap");
  if(S.lastNum==null||wrap.hidden){return}
  const o=orderByNum(S.lastNum);
  if(!o){$("c-last").innerHTML=S.undoMsg?`<b>${esc(S.undoMsg)}</b>`:"";return}
  const tp=r2((o.incassato||0)+(o.offerta||0)),resto=o.ricevuto?r2(o.ricevuto-tp):0;
  $("c-last").innerHTML=`<div class="done-top"><span class="done-n"><small>Biglietto</small>${o.numero}</span>
    ${resto>0?`<span class="done-resto"><small>Resto</small>${money(resto)}</span>`:""}</div>
    <span class="sub">${o.nome?esc(o.nome)+" · ":""}${tp>0?`${money(tp)} ${PAY_LBL[o.metodo]||""}${o.offerta>0?` (offerta ${money(o.offerta)})`:""}`:""}${o.asportoSubito?" · asporto mandato in cucina":""}</span>
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
function payTxt(o){const tp=r2((o.incassato||0)+(o.offerta||0));return tp>0?money(tp)+(o.metodo?" · "+PAY_LBL[o.metodo]:"")+(o.offerta>0?` (offerta ${money(o.offerta)})`:""):""}
function recentBtn(o){return isLocked(o)?`<button class="btn small" data-open="${o.numero}">Rettifica</button>`:`<button class="btn small" data-open="${o.numero}">Modifica</button>`}
function renderRecent(){
  const list=ordersArr().sort((a,b)=>b.numero-a.numero).slice(0,15);
  $("c-recent").innerHTML=list.length?list.map(o=>`<div class="li plain"><span class="n">${o.numero}</span>
    <span>${o.nome?`<b>${esc(o.nome)}</b>`:""}<div class="chips">${o.asporto?'<span class="pill asp">Asporto</span>':""}${righeChips(righe(o))}${singChips(singoli(o))}${extraChips(extras(o))}</div>${payTxt(o)?`<div class="sub">${payTxt(o)}</div>`:""}${barTxt(o)}</span><span class="recact">${dots(o)}${recentBtn(o)}</span></div>`).join("")
    :'<div class="empty">Nessun ordine.</div>';
}
$("c-recent").addEventListener("click",e=>{const b=e.target.closest("button[data-open]");if(b)openEdit(Number(b.dataset.open))});
function openTyped(){const n=parseInt($("c-opennum").value,10);if(!(n>0)){$("c-opennum").focus();return}$("c-opennum").value="";openEdit(n)}
$("c-open").addEventListener("click",openTyped);
$("c-opennum").addEventListener("keydown",e=>{if(e.key==="Enter")openTyped()});
function payTotals(fo,fd){
  const O=ordersArr().filter(fo||(()=>true)),D=Object.values(S.offMap).filter(fd||(()=>true));
  const t={n:O.length,contanti:0,pos:0,offerte:0,libere:D.length};
  O.forEach(o=>{const v=(o.incassato||0)+(o.offerta||0);if(v>0)t[o.metodo==="pos"?"pos":"contanti"]+=v;t.offerte+=o.offerta||0});
  D.forEach(d=>{t[d.metodo==="pos"?"pos":"contanti"]+=d.importo||0;t.offerte+=d.importo||0});
  t.contanti=r2(t.contanti);t.pos=r2(t.pos);t.offerte=r2(t.offerte);return t;
}
function renderAsporto(){
  const allC=o=>[...orderCourses(o),...(o.bar?[{k:"bar",l:"Bevande",p:o.bar,bar:true}]:[])];
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
  if(o.bar&&o.bar.stato==="pronta"){upd["bar/stato"]="servita";upd["bar/t"]=Date.now()}
  try{await R("ordini/"+n).update(upd)}catch(err){showBanner(errText(err));b.disabled=false}
});
function renderMine(){
  paintDPay();
  const show=S.me&&(hasRole(S.me,"cassa")||hasRole(S.me,"master"));$("c-mine-panel").hidden=!show;if(!show)return;
  const t=payTotals(o=>o.creatoDaId===S.me.id,d=>d.daId===S.me.id),c=postCalc(S.me.id);
  $("c-mine").innerHTML=`Contanti <b>${money(t.contanti)}</b> · POS <b>${money(t.pos)}</b> · Offerte <b>${money(t.offerte)}</b> · Nel cassetto <b>${money(c.attesi)}</b>`;
}
$("c-fondo-save").addEventListener("click",()=>{if(!S.me||!hasRole(S.me,"master"))return;savePost(S.me.id,$("c-fondo").value).then(()=>{$("c-fondo-save").textContent="Salvato";setTimeout(()=>{$("c-fondo-save").textContent="Salva"},1500);schedule()})});

async function createOrder(){
  const msg=$("c-msg");msg.className="msg err";
  const paid=$("c-paid").checked,b=bill(S.qty,S.xqty,paid,S.sqty);
  if(!b.rr.length&&!b.ss.length&&!b.xx.length){msg.textContent="Aggiungi almeno un menù, una portata singola o un extra.";return}
  if(!$("c-nome").value.trim()){msg.textContent="Scrivi il nominativo.";$("c-nome").classList.add("bad");$("c-nome").focus();return}
  let n=parseInt($("c-num").value,10);
  if(!(n>0)){msg.textContent="Scrivi un numero di biglietto valido.";return}
  const off=parsePrice($("c-off").value),toPay=r2(b.due+off),ric=S.pay==="contanti"?parsePrice($("c-ric").value):0;
  if(toPay>0&&S.pay==="contanti"&&!(ric>0)){msg.textContent="Scrivi quanto ti ha dato il cliente.";$("c-ric").classList.add("bad");$("c-ric").focus();return}
  if(toPay>0&&ric>0&&ric<toPay){msg.textContent=`Mancano ${money(r2(toPay-ric))}: controlla quanto hai ricevuto.`;return}
  const probs=stockProblems(b.rr,b.ss,b.xx),key=JSON.stringify([S.qty,S.sqty,S.xqty,probs.map(x=>x.p.id)]);
  if(probs.length){
    if(!isBoss()){msg.textContent=stockBlockMsg(probs);return}
    if(S.stockWarn!==key){S.stockWarn=key;msg.textContent=stockTxt(probs)+". Sei master: premi di nuovo «Crea ordine» per venderle lo stesso.";return}}
  const direct=$("c-asp").checked&&S.aspMode==="subito",ckey=JSON.stringify([S.qty,S.sqty,S.xqty,n]);
  if(direct&&S.aspConfirm!==ckey){S.aspConfirm=ckey;msg.className="msg err";
    const what=[...b.rr.map(r=>`${r.qta} ${r.nome}`),...b.ss.map(s=>`${s.qta} ${s.nome} singolo`)].join(", ")||"solo bevande ed extra";
    msg.textContent=`Asporto diretto: ${what} vanno subito in cucina e l'ordine non si potrà più cambiare. Controlla e premi «Conferma e manda in cucina».`;
    $("c-create").textContent="Conferma e manda in cucina";return}
  const auto=!S.numDirty,pren=S.selPren;
  const btn=$("c-create");btn.disabled=true;msg.className="msg";msg.textContent=S.online?"Creo l'ordine…":"Senza rete: l'ordine parte appena torna la connessione. Non chiudere la pagina.";
  const slow=setTimeout(()=>{msg.className="msg err";msg.textContent="Rete lenta: aspetto la connessione per confermare il numero. Non chiudere la pagina."},5000);
  const base={creato:Date.now(),creatoDa:myName(),creatoDaId:S.me?S.me.id:"",nome:$("c-nome").value.trim(),righe:b.rr,extra:b.xx,note:$("c-note").value.trim(),
    tavolo:"",prenotazione:pren||"",importoMenu:b.menu,importoExtra:b.ext,importo:b.tot,pagatoPrima:paid,incassato:b.due,offerta:off,ricevuto:ric>0?ric:0,metodo:toPay>0?S.pay:"",singoli:b.ss,importoSingoli:b.sing,
    asporto:$("c-asp").checked,asportoSubito:$("c-asp").checked&&S.aspMode==="subito",portate:coursesFor(b.rr,b.ss)};
  if(b.xx.length)base.bar={stato:"attesa",t:Date.now()};
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
    const pay=S.pay;S.lastNum=n;S.undoMsg="";S.numDirty=false;resetForm();$("c-last-wrap").hidden=false;
    setTimeout(()=>{if(S.lastNum===n)renderTicket()},61000);
    const resto=ric>0?r2(ric-toPay):0;
    msg.className="msg ok";msg.textContent=`Ordine ${n} creato${base.asportoSubito?" e mandato in cucina":""}.`+(toPay>0?` Incassa ${money(toPay)} (${PAY_LBL[pay]}).`:"")+(resto>0?` Resto ${money(resto)}.`:"");
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
  S.editOrder=n;S.eqty={};righe(o).forEach(r=>{S.eqty[r.id]=r.qta});S.esqty={};singoli(o).forEach(s=>{S.esqty[s.pid+"|"+s.k]=s.qta});S.exqty={};extras(o).forEach(r=>{S.exqty[r.id]=r.qta});S.xpay=o.metodo||"contanti";
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
  orderCourses(o).filter(c=>F.rm[c.k]).forEach(c=>{const p=portataCfg(c.k)||{};let v=0,nP=0;
    if(!o.pagatoPrima)rr.filter(r=>r.qta>0&&applies(portataCfg(c.k),r.id)).forEach(r=>{v+=r.qta*((r.id==="bimbi"&&p.prezzoBimbi>0)?p.prezzoBimbi:(p.prezzo||0))});
    rr.filter(r=>r.qta>0&&applies(portataCfg(c.k),r.id)).forEach(r=>{nP+=r.qta});
    ss.filter(s=>s.pid===c.k&&s.qta>0).forEach(s=>{v+=s.qta*(s.prezzo||0);nP+=s.qta});
    refund+=v;desc.push(`tolto ${c.l} (${nP} ${nP===1?"piatto":"piatti"})`)});
  ss=ss.filter(s=>!F.rm[s.pid]);
  return {rr:rr.filter(r=>r.qta>0),ss:ss.filter(s=>s.qta>0),xx:xx.filter(x=>x.qta>0),refund:r2(Math.max(0,Math.min(refund,o.incassato||0))),desc,noneCalled};
}
function fixStep(list,qmap,attr,key){return list.map(r=>{const k=key(r),cur=qmap[k]!=null?qmap[k]:r.qta;
  return `<div class="stepper"><span class="name">${esc(r.nome)} <span class="label">${cur<r.qta?"erano "+r.qta:""}</span></span><span class="ctl"><button ${attr}="${esc(k)}" data-max="${r.qta}" data-d="-1" aria-label="Togli ${esc(r.nome)}">−</button><output>${cur}</output><button ${attr}="${esc(k)}" data-max="${r.qta}" data-d="1" ${cur>=r.qta?"disabled":""} aria-label="Rimetti ${esc(r.nome)}">+</button></span></div>`}).join("")}
function renderFix(force){
  const o=orderByNum(S.editOrder),F=S.fix,box=$("x-fix");if(!o||!F)return;
  const sig=JSON.stringify([o,{...F,sig:""}]);if(!force&&sig===F.sig)return;F.sig=sig;
  const c=fixCalc(o),pend=orderCourses(o).filter(x=>(x.p.stato||"attesa")==="attesa");
  if(F.amt==null)$("x-fix").dataset.sugg=c.refund;
  const amt=F.amt!=null?F.amt:c.refund;
  box.innerHTML=`<span class="label">Portate non ancora chiamate</span>
    ${pend.length?`<div class="chips">${pend.map(x=>`<button class="tog" data-fixrm="${esc(x.k)}" aria-pressed="${!F.rm[x.k]}">${esc(x.l)}</button>`).join("")}</div><p class="hint">Tocca una portata per toglierla dall'ordine (es. dolce finito, non la vogliono).</p>`:'<div class="sub">Tutte le portate sono già state chiamate.</div>'}
    ${c.noneCalled&&(righe(o).length||singoli(o).length)?`<span class="label">Coperti (nessuna portata ancora chiamata)</span>${fixStep(righe(o),F.q,"data-fq",r=>r.id)}${fixStep(singoli(o).map(s=>({...s,nome:s.nome+" singolo"})),F.sq,"data-fsq",s=>s.pid+"|"+s.k)}`:""}
    ${extras(o).length?`<span class="label">Bevande ed extra</span>${fixStep(extras(o),F.xq,"data-fxq",x=>x.id)}`:""}
    <div class="sub">${c.desc.length?esc(c.desc.join(" · ")):"Scegli cosa togliere."}</div>
    <div class="payrow"><label class="label" for="x-fixamt">Da restituire (${PAY_LBL[o.metodo]||"contanti"})</label><input type="text" id="x-fixamt" inputmode="decimal" class="pricein" value="${amt?amt.toFixed(2).replace(".",","):""}" placeholder="0,00 €"></div>
    ${c.refund>0&&F.amt!=null&&F.amt!==c.refund?`<div class="sub">Calcolato: ${money(c.refund)}</div>`:""}
    <button class="btn primary big" id="x-fixsave" ${c.desc.length?"":"disabled"}>Togli${amt>0?" e restituisci "+money(amt):""}</button>`;
}
$("x-fix").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||!S.fix)return;const F=S.fix;
  if(b.dataset.fixrm){F.rm[b.dataset.fixrm]=!F.rm[b.dataset.fixrm];F.amt=null;renderFix(true);return}
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
  if(reduced&&!c.noneCalled){m.textContent="Nel frattempo è stata chiamata una portata: i coperti non si possono più togliere.";F.q={};F.sq={};renderFix(true);return}
  if(!c.rr.length&&!c.ss.length&&!c.xx.length){m.textContent="Così non resta niente: per togliere tutto serve «Annulla ordine» (solo il master).";return}
  const amt=r2(Math.max(0,Math.min(F.amt!=null?F.amt:c.refund,o.incassato||0)));
  const upd={righe:c.rr,singoli:c.ss,extra:c.xx,importoMenu:importo(c.rr),importoSingoli:importo(c.ss),importoExtra:importo(c.xx)};
  upd.importo=r2(upd.importoMenu+upd.importoSingoli+upd.importoExtra);
  const need=coursesFor(c.rr,c.ss);
  Object.keys(o.portate||{}).forEach(k=>{if((F.rm[k]||!need[k])&&(o.portate[k].stato||"attesa")==="attesa")upd["portate/"+k]=null});
  if(!c.xx.length&&o.bar&&(o.bar.stato||"attesa")==="attesa")upd.bar=null;
  upd.incassato=r2((o.incassato||0)-amt);upd.stornato=r2((o.stornato||0)+amt);
  const sid=rid("s");upd["storni/"+sid]={t:Date.now(),da:myName(),daId:S.me?S.me.id:"",cosa:c.desc.join(", "),importo:amt};
  try{await R("ordini/"+n).update(upd);m.className="msg ok";m.textContent="Rettifica salvata."+(amt>0?` Restituisci ${money(amt)} (${PAY_LBL[o.metodo]||"contanti"}).`:"");
    logChange(`Ordine ${n}${o.nome?" ("+o.nome+")":""} rettificato: ${c.desc.join(", ")}${amt>0?` · restituiti ${money(amt)}`:""}`);
    S.fix={rm:{},q:{},sq:{},xq:{},amt:null,sig:""};renderFix(true)}
  catch(e){m.textContent=errText(e)}
}
function renderEditSteppers(){
  $("x-steppers").innerHTML=stepperHtml(S.varianti,S.eqty,"data-estep");
  $("x-extra-box").hidden=!S.extra.length;$("x-extra").innerHTML=stepperHtml(S.extra,S.exqty,"data-exstep");
  const sl=singlesList();$("x-sing-box").hidden=!sl.length;$("x-sing").innerHTML=stepperHtml(sl,S.esqty,"data-esstep");
  paintTotal("x",bill(S.eqty,S.exqty,$("x-paid").checked,S.esqty),$("x-paid").checked,S.xpay);
}
$("x-steppers").addEventListener("click",e=>{const b=e.target.closest("button[data-estep]");if(!b)return;
  const id=b.dataset.estep;S.eqty[id]=Math.max(0,(S.eqty[id]||0)+Number(b.dataset.d));renderEditSteppers()});
$("x-extra").addEventListener("click",e=>{const b=e.target.closest("button[data-exstep]");if(!b)return;
  const id=b.dataset.exstep;S.exqty[id]=Math.max(0,(S.exqty[id]||0)+Number(b.dataset.d));renderEditSteppers()});
$("x-sing").addEventListener("click",e=>{const b=e.target.closest("button[data-esstep]");if(!b)return;
  const id=b.dataset.esstep;S.esqty[id]=Math.max(0,(S.esqty[id]||0)+Number(b.dataset.d));renderEditSteppers()});
$("x-pay").addEventListener("click",e=>{const b=e.target.closest("button[data-pay]");if(!b)return;S.xpay=b.dataset.pay;renderEditSteppers()});
$("x-paid").addEventListener("change",renderEditSteppers);
$("x-off").addEventListener("input",renderEditSteppers);
$("x-close").addEventListener("click",closeEdit);
$("x-save").addEventListener("click",async()=>{
  const n=S.editOrder,o=orderByNum(n),m=$("x-msg");if(!o){closeEdit();return}
  if(isLocked(o)){m.className="msg err";m.textContent=LOCK_MSG(n);return}
  const paid=$("x-paid").checked,b=bill(S.eqty,S.exqty,paid,S.esqty);
  if(!b.rr.length&&!b.ss.length&&!b.xx.length){m.className="msg err";m.textContent="L'ordine è vuoto. Per toglierlo usa «Annulla ordine».";return}
  const upd={nome:$("x-nome").value.trim(),note:$("x-note").value.trim(),righe:b.rr,extra:b.xx,importoMenu:b.menu,importoExtra:b.ext,importo:b.tot,
    singoli:b.ss,importoSingoli:b.sing,pagatoPrima:paid,incassato:b.due,offerta:parsePrice($("x-off").value),metodo:(b.due+parsePrice($("x-off").value))>0?S.xpay:""};
  const need=coursesFor(b.rr,b.ss);Object.keys(need).forEach(k=>{if(!(o.portate&&o.portate[k]))upd["portate/"+k]=need[k]});
  Object.keys(o.portate||{}).forEach(k=>{if(!need[k])upd["portate/"+k]=null});
  if(b.xx.length&&!o.bar)upd.bar={stato:"attesa",t:Date.now()};if(!b.xx.length&&o.bar)upd.bar=null;
  const diff=r2(b.due+upd.offerta-(o.incassato||0)-(o.offerta||0));
  const before=orderDesc(righe(o),singoli(o),extras(o)),after=orderDesc(b.rr,b.ss,b.xx);
  try{
    const fresh=orderByNum(n);if(!fresh||isLocked(fresh)){m.className="msg err";m.textContent=fresh?LOCK_MSG(n):"L'ordine non esiste più.";return}
    const sp=stockProblemsDelta(fresh,b.rr,b.ss,b.xx),skey=JSON.stringify([S.eqty,S.esqty,S.exqty]);
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

