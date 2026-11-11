/* chi può avere un reparto: cuochi e uscita piatti (il master vede sempre tutto) */
const hasRepRole=u=>!!u&&(hasRole(u,"cucina")||hasRole(u,"uscita")||hasRole(u,"bar"))&&!hasRole(u,"master");
/* Persone, file, ingresso camerieri, QR */
/* ---------- PERSONE ---------- */
function pickedRoles(id){const on=[...document.querySelectorAll("#"+id+" button[data-r]")].filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.dataset.r);
  if(on.includes("master"))return ["master"];if(on.includes("cameriere"))return ["cameriere"];return PRIMARY_ORDER.filter(r=>on.includes(r))}
function syncAddForm(){const pr=pickedRoles("u-ruoli"),cam=pr[0]==="cameriere";$("u-pinrow").hidden=cam;$("u-filarow").hidden=!cam;
  $("u-reprow").hidden=!((pr.includes("cucina")||pr.includes("uscita")||pr.includes("bar"))&&repList().length)}
function repChips(sel){return repList().map(r=>`<button data-rep="${esc(r.id)}" aria-pressed="${sel.includes(r.id)}">${esc(r.nome)}</button>`).join("")}
function pickedReps(id){return [...document.querySelectorAll("#"+id+" button[data-rep]")].filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.dataset.rep)}
document.addEventListener("click",e=>{const b=e.target.closest("#u-reps button[data-rep], #u-repedit button[data-rep]");if(!b)return;b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true"))});
function setPicked(id,rs){document.querySelectorAll("#"+id+" button[data-r]").forEach(b=>b.setAttribute("aria-pressed",String(rs.includes(b.dataset.r))))}
document.addEventListener("click",e=>{const b=e.target.closest(".rpick button[data-r], #u-ruoli button[data-r]");if(!b)return;const on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",String(on));
  if(on&&b.parentNode.id==="u-ruoli")b.parentNode.querySelectorAll("button[data-r]").forEach(x=>{if(x!==b&&(b.dataset.r==="cameriere"||x.dataset.r==="cameriere"))x.setAttribute("aria-pressed","false")});
  if(b.parentNode.id==="u-ruoli")syncAddForm()});
const isCapo=()=>!!S.me&&hasRole(S.me,"capo")&&!hasRole(S.me,"master");
const canManage=u=>S.me&&u&&(hasRole(S.me,"master")||(isCapo()&&u.ruolo==="cameriere"));
function renderJoinState(){
  const c=!!S.ingressiChiusi,ws=S.users.filter(u=>u.ruolo==="cameriere"),inn=ws.filter(u=>u.token).length;
  $("u-joinstate").textContent=`${c?"Ingressi chiusi":"Ingressi aperti"} · entrati ${inn} su ${ws.length}`;
  $("u-close").textContent=c?"Riapri ingressi":"Chiudi ingressi";$("u-joinqr").disabled=c;
  ["u-wfila","u-pfila"].forEach(id=>{const sel=$(id),v=sel.value;sel.innerHTML=fileList().map(f=>`<option value="${esc(f.id)}">${esc(f.nome)}</option>`).join("")+'<option value="">Nessuna fila</option>';if(fileList().some(f=>f.id===v)||v==="")sel.value=v||(sel.options.length?sel.options[0].value:"")});
}
function renderUsers(){
  renderFileEditor();renderJoinState();
  $("u-reps").innerHTML=repChips(pickedReps("u-reps"));syncAddForm();
  const capo=isCapo();$("u-title").textContent=capo?"Camerieri":"Persone";$("u-addpanel").hidden=capo;
  const list=S.users.filter(u=>!capo||u.ruolo==="cameriere").sort((a,b)=>ROLE_ORDER.indexOf(a.ruolo)-ROLE_ORDER.indexOf(b.ruolo)||a.nome.localeCompare(b.nome));
  if(!list.length){$("u-list").innerHTML='<div class="empty">Nessun cameriere ancora.</div>';return}
  $("u-list").innerHTML=list.map(u=>{
    const self=S.me&&u.id===S.me.id,ed=S.editUser&&S.editUser.id===u.id?S.editUser.mode:null;
    if(ed==="reparti")return `<div class="li plain two"><span class="stack"><b>${esc(u.nome)}</b><span class="sub">Reparto: se non ne scegli nessuno vede tutta la cucina.</span><div class="grp" id="u-repedit">${repChips(userReps(u))}</div></span>
      <span class="row"><button class="btn small primary" data-save="${esc(u.id)}">Salva</button><button class="btn small" data-cancel="1">Annulla</button></span></div>`;
    if(ed==="ruoli")return `<div class="li plain two"><span class="stack"><b>${esc(u.nome)}</b><div class="grp rpick" id="u-redit">${["cassa","cucina","uscita","bar","capo","master"].map(r=>`<button data-r="${r}" aria-pressed="${hasRole(u,r)}">${ROLE_LBL[r]}</button>`).join("")}</div></span>
      <span class="row"><button class="btn small primary" data-save="${esc(u.id)}">Salva</button><button class="btn small" data-cancel="1">Annulla</button></span></div>`;
    if(ed)return `<div class="li plain two"><span class="row"><b>${esc(u.nome)}</b>
      <input type="${ed==="pin"?"password":"text"}" id="u-edit" ${ed==="pin"?'inputmode="numeric"':""} autocomplete="off" placeholder="${ed==="pin"?"Nuovo PIN":"Nuovo nome"}" value="${ed==="nome"?esc(u.nome):""}" style="max-width:170px"></span>
      <span class="row"><button class="btn small primary" data-save="${esc(u.id)}">Salva</button><button class="btn small" data-cancel="1">Annulla</button></span></div>`;
    const fsel=(u.ruolo==="cameriere"||hasRole(u,"capo"))?`<select data-ufila="${esc(u.id)}" aria-label="Fila di ${esc(u.nome)}" style="width:auto;padding:6px 8px"><option value="">${u.ruolo!=="cameriere"?"Tutte le file":"Nessuna fila"}</option>${fileList().map(f=>`<option value="${esc(f.id)}" ${u.fila===f.id?"selected":""}>${esc(f.nome)}</option>`).join("")}</select>`:"";
    const cam=u.ruolo==="cameriere";
    const acts=fsel+(cam?(u.token?`<button class="btn small" data-free="${esc(u.id)}">Libera</button>`:""):`<button class="btn small" data-editpin="${esc(u.id)}">Cambia PIN</button>${hasRole(S.me,"master")?`<button class="btn small" data-roles="${esc(u.id)}">Ruoli</button>`:""}${hasRole(S.me,"master")&&hasRepRole(u)&&repList().length?`<button class="btn small" data-reps="${esc(u.id)}">Reparto</button>`:""}`);
    const ur=hasRepRole(u)?userReps(u):[];
    const st=cam?(u.token?'<span class="pill ok">entrato</span>':'<span class="pill no">non entrato</span>'):`<span class="pill wait">${esc(rolesLbl(u))}${ur.length?" · "+esc(ur.map(repNome).join(", ")):hasRepRole(u)&&repList().length?" · tutti i reparti":""}</span>`;
    return `<div class="li plain two"><span><b>${esc(u.nome)}</b> ${st}${self?' <span class="label">(tu)</span>':""}</span>
      <span class="row">${acts}<button class="btn small" data-rename="${esc(u.id)}">Rinomina</button>
      <button class="btn small danger" data-deluser="${esc(u.id)}" ${self?"disabled":""}>Rimuovi</button></span></div>`}).join("");
}
function umsg(t,ok){const m=$("u-msg");m.className="msg "+(ok?"ok":"err");m.textContent=t}
$("u-list").addEventListener("change",async e=>{const s=e.target.closest("select[data-ufila]");if(!s)return;const u=S.users.find(x=>x.id===s.dataset.ufila);if(!canManage(u))return;
  try{await R("config/utenti/"+u.id+"/fila").set(s.value||null);umsg(`${u.nome}: ${s.value?filaNome(s.value):"nessuna fila"}.`,true)}catch(err){umsg(errText(err))}});
function renderFileEditor(){
  $("u-file").innerHTML=fileList().map(f=>{const ws=filaWaiters(f.id).map(u=>u.nome);
    return `<div class="frow"><input type="text" value="${esc(f.nome)}" data-fname="${esc(f.id)}" aria-label="Nome fila">
      <button class="btn small danger" data-delfila="${esc(f.id)}" ${fileList().length>1?"":"disabled"}>Rimuovi</button>
      <span class="sub">${ws.length?esc(ws.join(", ")):"nessun cameriere"}</span></div>`}).join("");
}
function fmsg(t,ok){const m=$("u-fmsg");m.className="msg "+(ok?"ok":"err");m.textContent=t}
function saveFile(list,okT){return R("config/file").set(list).then(()=>fmsg(okT,true),e=>fmsg(errText(e)))}
$("u-file").addEventListener("change",e=>{const i=e.target.closest("input[data-fname]");if(!i)return;const v=i.value.trim();if(!v){renderFileEditor();return}
  saveFile(fileList().map(f=>f.id===i.dataset.fname?{...f,nome:v}:f),"Nome fila salvato.")});
$("u-file").addEventListener("click",e=>{const b=e.target.closest("button[data-delfila]");if(!b||!armed(b))return;const f=fileList().find(x=>x.id===b.dataset.delfila);
  saveFile(fileList().filter(x=>x.id!==f.id),`${f.nome} rimossa: i suoi camerieri vanno riassegnati.`)});
$("u-addfila").addEventListener("click",()=>{const v=$("u-newfila").value.trim()||`Fila ${fileList().length+1}`;$("u-newfila").value="";
  saveFile([...fileList(),{id:rid("f"),nome:v}],`${v} aggiunta.`)});
$("u-add").addEventListener("click",async()=>{
  if(!S.me||!hasRole(S.me,"master"))return;
  const nome=$("u-nome").value.trim(),pin=$("u-pin").value,sel=pickedRoles("u-ruoli");
  if(!nome){umsg("Scrivi il nome.");return}
  if(!sel.length){umsg("Scegli almeno un ruolo.");return}
  const ruolo=sel[0],ruoli=sel.slice(1);
  if(ruolo==="cameriere"){if(S.users.some(u=>norm(u.nome)===norm(nome))){umsg("C'è già una persona con questo nome.");return}
    const f=$("u-pfila").value||"",u={id:rid("u"),nome,ruolo:"cameriere"};if(f)u.fila=f;
    try{await R("config/utenti/"+u.id).set(u);$("u-nome").value="";umsg(`${nome} aggiunto come cameriere${f?" in "+filaNome(f):""}.`,true)}catch(err){umsg(errText(err))}
    return}
  if(S.users.some(u=>norm(u.nome)===norm(nome))){umsg("C'è già una persona con questo nome.");return}
  if(!validPin(pin)){umsg("Il PIN deve avere da 4 a 6 cifre.");return}
  const u={id:rid("u"),nome,ruolo,salt:newCode()+newCode()};if(ruoli.length)u.ruoli=ruoli;const h=await hashPin(u.salt,pin);
  const reps=(sel.includes("cucina")||sel.includes("uscita")||sel.includes("bar"))&&!sel.includes("master")?pickedReps("u-reps"):[];if(reps.length)u.reparti=reps;
  try{await fdb("pin/"+u.id).set(h);await R("config/utenti/"+u.id).set(u);$("u-nome").value="";$("u-pin").value="";setPicked("u-ruoli",[]);$("u-reps").innerHTML=repChips([]);syncAddForm();umsg(`${nome} aggiunto: ${rolesLbl(u).toLowerCase()}.`,true)}
  catch(e){umsg(errText(e))}
});
function showJoinQR(code){$("qr-copy").textContent="Copia link";showQR("Ingresso camerieri","Ogni cameriere inquadra questo QR e tocca il suo nome.",linkWith({j:code}),code)}
function wmsg(t,ok){const m=$("u-wmsg");m.className="msg "+(ok?"ok":"err");m.textContent=t}
$("u-wadd").addEventListener("click",async()=>{
  if(!capoLike()){wmsg("Solo il master o il capo camerieri possono aggiungere camerieri.");return}
  const fila=$("u-wfila").value||"",seen=new Set(),dup=[],add=[];
  $("u-wnames").value.split(/\r?\n/).map(x=>x.trim().replace(/\s+/g," ")).filter(Boolean).forEach(n=>{
    if(seen.has(norm(n)))return;seen.add(norm(n));
    if(S.users.some(u=>norm(u.nome)===norm(n)))dup.push(n);else add.push(n)});
  if(!add.length&&!dup.length){wmsg("Scrivi almeno un nome, uno per riga.");$("u-wnames").focus();return}
  const b=$("u-wadd");b.disabled=true;
  try{for(const n of add){const u={id:rid("u"),nome:n,ruolo:"cameriere"};if(fila)u.fila=fila;await R("config/utenti/"+u.id).set(u)}
    $("u-wnames").value=dup.join("\n");
    wmsg([add.length?`${add.length} ${add.length===1?"cameriere aggiunto":"camerieri aggiunti"}${fila?" in "+filaNome(fila):""}.`:"",dup.length?`Già presenti: ${dup.join(", ")}.`:""].filter(Boolean).join(" "),!dup.length)}
  catch(err){wmsg(errText(err))}
  finally{b.disabled=false}
});
$("u-close").addEventListener("click",async()=>{if(!capoLike())return;try{await R("config/ingressiChiusi").set(S.ingressiChiusi?null:true)}catch(err){umsg(errText(err))}});
$("u-joinqr").addEventListener("click",async()=>{
  try{const r=await R("config/iscrizione").transaction(c=>c||newCode());showJoinQR(r.snapshot.val())}catch(e){umsg(errText(e))}
});
$("u-newjoin").addEventListener("click",async()=>{
  const code=newCode();try{await R("config/iscrizione").set(code);showJoinQR(code);umsg("Nuovo QR creato: quello vecchio non funziona più.",true)}catch(e){umsg(errText(e))}
});
$("u-list").addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.cancel){S.editUser=null;renderUsers();return}
  const id=t.dataset.editpin||t.dataset.rename||t.dataset.deluser||t.dataset.save||t.dataset.free||t.dataset.roles||t.dataset.reps;
  const u=S.users.find(x=>x.id===id);if(!canManage(u))return;
  try{
    if(t.dataset.free){if(!armed(t,"Libera?"))return;await R("config/utenti/"+id+"/token").set(null);umsg(`${u.nome} liberato: può rientrare dal QR.`,true);return}
    if(t.dataset.roles){if(!hasRole(S.me,"master"))return;S.editUser={id,mode:"ruoli"};renderUsers();return}
    if(t.dataset.reps){if(!hasRole(S.me,"master"))return;S.editUser={id,mode:"reparti"};renderUsers();return}
    if(t.dataset.editpin){S.editUser={id,mode:"pin"};renderUsers();$("u-edit").focus();return}
    if(t.dataset.rename){S.editUser={id,mode:"nome"};renderUsers();$("u-edit").focus();return}
    if(t.dataset.save){
      if(S.editUser.mode==="reparti"){const sel=pickedReps("u-repedit");await R("config/utenti/"+id+"/reparti").set(sel.length?sel:null);
        umsg(`${u.nome}: ${sel.length?sel.map(repNome).join(", "):"tutti i reparti"}.`,true);S.editUser=null;renderUsers();return}
      if(S.editUser.mode==="ruoli"){const sel=pickedRoles("u-redit");if(!sel.length){umsg("Scegli almeno un ruolo.");return}
        if(hasRole(u,"master")&&!sel.includes("master")&&S.users.filter(x=>hasRole(x,"master")).length<2){umsg("Serve almeno un master.");return}
        await R("config/utenti/"+id).update({ruolo:sel[0],ruoli:sel.length>1?sel.slice(1):null});umsg(`${u.nome}: ${sel.map(r=>ROLE_LBL[r]).join(" + ").toLowerCase()}.`,true);S.editUser=null;renderUsers();return}
      const v=$("u-edit").value.trim();
      if(S.editUser.mode==="pin"){if(!validPin(v)){umsg("Il PIN deve avere da 4 a 6 cifre.");return}
        const salt=newCode()+newCode(),h=await hashPin(salt,v),self=S.me&&S.me.id===id;
        await R("config/utenti/"+id).update({salt,hash:null});await fdb("pin/"+id).set(h);
        if(self){S.sessSig=id+"|"+salt+"|";lsSet("sess",JSON.stringify({uid:id,k:h}));await openSess(id,{h})}
        umsg("PIN cambiato.",true)}
      else{if(!v){umsg("Scrivi il nome.");return}if(S.users.some(x=>x.id!==id&&norm(x.nome)===norm(v))){umsg("C'è già una persona con questo nome.");return}
        await R("config/utenti/"+id+"/nome").set(v);umsg("Nome cambiato.",true)}
      S.editUser=null;renderUsers();return}
    if(t.dataset.deluser){if(!armed(t))return;
      if(hasRole(u,"master")&&S.users.filter(x=>hasRole(x,"master")).length<2){umsg("Serve almeno un master.");return}
      await R("config/utenti/"+id).remove();fdb("pin/"+id).remove().catch(()=>{});umsg(`${u.nome} rimosso.`,true)}
  }catch(err){umsg(errText(err))}
});

/* ---------- QR ---------- */
function showQR(title,hint,link,code){
  $("qr-title").textContent=title;$("qr-hint").textContent=hint;$("qr-link").textContent=link;
  $("qr-code").textContent=code||"";$("qr-code").hidden=!code;
  const box=$("qr-box");box.innerHTML="";
  try{new QRCode(box,{text:link,width:240,height:240,correctLevel:QRCode.CorrectLevel.M})}catch(e){box.textContent="QR non disponibile: usa il link o il codice."}
  $("qr-modal").hidden=false;
}
$("qr-close").addEventListener("click",()=>{$("qr-modal").hidden=true});
$("qr-modal").addEventListener("click",e=>{if(e.target.id==="qr-modal")$("qr-modal").hidden=true});
$("qr-copy").addEventListener("click",()=>{const t=$("qr-link").textContent;
  try{navigator.clipboard.writeText(t).then(()=>{$("qr-copy").textContent="Copiato"},()=>{})}catch(e){}
  const r=document.createRange();r.selectNodeContents($("qr-link"));const s=getSelection();s.removeAllRanges();s.addRange(r)});
$("e-showlink").addEventListener("click",()=>{$("qr-copy").textContent="Copia link";showQR("Collega un dispositivo","Apri il link o inquadra il QR. Poi accedi con nome e PIN.",linkWith({}),"")});

