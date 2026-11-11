/* Bar: i reparti segnati «è un bar» (acqua, vino, caffè…) e la consegna al banco */
/* ---------- BAR ---------- */
function barWho(o){return o.asportoSubito?"Asporto":ownerId(o)?nameOf(ownerId(o),o.cameriere):o.asporto?"Asporto":"Al banco"}
function isBarCourse(o,k){const br=barReps();return courseReps(o,k).some(r=>br.includes(r))}
function renderBar(){
  const sc=barReps();
  if(!sc.length){$("b-sum").innerHTML="";$("b-queue").innerHTML='<div class="panel"><div class="empty">Nessun reparto bar: il master ne segna uno in Listino → Reparti («È un bar»).</div></div>';$("b-ready").innerHTML="";renderGive();return}
  $("b-sum").className="ksum";
  renderRepView(sc,{sum:"b-sum",queue:"b-queue",ready:"b-ready"});
  renderGive();
}
/* al banco: chi non ha un cameriere (o l'asporto) prende qui le cose del bar */
function barLeft(o){return orderCourses(o).filter(c=>isBarCourse(o,c.k)&&c.p.stato!=="servita")}
function renderGive(){
  const box=$("b-give"),v=$("b-num").value.trim();if(!v){box.hidden=true;box.innerHTML="";return}
  const o=orderByNum(Number(v));box.hidden=false;
  if(!o){box.innerHTML='<div class="note">Nessun ordine con questo numero.</div>';return}
  const all=orderCourses(o).filter(c=>isBarCourse(o,c.k));
  if(!all.length){box.innerHTML='<div class="note">Questo ordine non ha niente del bar.</div>';return}
  const left=barLeft(o);
  if(!left.length){box.innerHTML=`<div class="wait ok">N. ${o.numero} · già dato</div>`;return}
  const busy=left.some(c=>c.p.stato==="chiamata"||c.p.stato==="pronta");
  const note=o.asporto?"Asporto: di solito lo consegna la cassa.":(o.fila||ownerId(o))?(busy?`Lo segue ${barWho(o)}: controlla che non l'abbia già preso.`:`Lo segue ${barWho(o)}.`):"";
  box.innerHTML=`${o.nome?`<div class="who"><b>${esc(o.nome)}</b></div>`:""}
    <ul>${left.map(c=>`<li><b>${cop(righeFor(o,c.k))}</b> ${esc(c.l)}</li>`).join("")}</ul>
    ${note?`<div class="note">${note}</div>`:""}
    <button class="btn go big" id="b-dato" data-n="${o.numero}">Dato</button>`;
}
$("b-num").addEventListener("input",renderGive);
$("b-num").addEventListener("keydown",e=>{if(e.key==="Enter"){const b=$("b-dato");if(b&&!b.disabled)b.click()}});
$("b-give").addEventListener("click",async e=>{
  const b=e.target.closest("#b-dato");if(!b||b.disabled)return;b.disabled=true;
  const n=Number(b.dataset.n),o=orderByNum(n);if(!o)return;
  const prev={};barLeft(o).forEach(c=>{prev[c.k]=c.p.stato||"attesa"});
  const done=await setMany(n,barLeft(o).map(c=>c.k),"servita");
  if(done.length)toast(`n. ${n}: dato al banco`,{ms:4000,action:{label:"Annulla",fn:()=>{const x=orderByNum(n);if(!x)return;
    done.forEach(k=>{const p=x.portate&&x.portate[k];if(p&&p.stato==="servita")setStato(n,k,prev[k],{silent:true,expect:"servita"})})}}});
  $("b-num").value="";renderGive();
});
