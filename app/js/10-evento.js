/* Evento: prenotazioni, Excel, nuovo evento, archivio */
/* ---------- EVENTO: prenotazioni e import ---------- */
function renderPrenList(){
  const P=prensArr(),arr=P.filter(p=>p.stato==="arrivata").length;
  $("e-prencount").textContent=P.length?`${arr} arrivati su ${P.length}`:"";
  const q=norm($("e-psearch").value);$("e-psearch").hidden=!P.length;
  const list=P.filter(p=>!q||norm(p.nome).includes(q)).sort((a,b)=>String(a.nome).localeCompare(String(b.nome))).slice(0,60);
  $("e-plist").innerHTML=P.length?(list.map(p=>`<div class="li plain two"><span><b>${esc(p.nome)}</b>
      <div class="chips" style="margin-top:4px">${prenChips(p)}</div>${p.note?`<div class="sub">${esc(p.note)}</div>`:""}</span>
      ${p.stato==="arrivata"?`<span class="pill ready">Arrivati · n. ${esc(p.ordine)}</span>`:`<span class="pill wait">In attesa</span>`}</div>`).join("")||'<div class="empty">Nessun risultato.</div>')
    :'<div class="empty">Nessuna prenotazione caricata. Importa il file Excel qui sopra.</div>';
}
$("e-psearch").addEventListener("input",renderPrenList);

const KW={nome:/^(nominativo|nome|cliente|famiglia|referente|intestat|prenotat|cognome)/,
  totale:/(copert|persone|posti|totale|partecipanti|n\.? ?pers|quanti)/,note:/(note|allerg|intoller|osservaz|richiest)/,tipo:/^(tipo|modalit|asporto|present|servizio)/};
const VKW={std:/(standard|adult|normal|intero|complet)/,bimbi:/(bambin|bimb|ragazz|ridott|kid|piccol)/};
const isKidMenu=v=>VKW.bimbi.test(norm(v.nome))||v.id==="bimbi";
/* per riconoscere un menù dall'intestazione: il nome, oppure Adulti/Standard per il primo menù e Bambini/Ridotto per quello dei bambini */
function variantTest(v,i){const nm=norm(v.nome);return h=>h===nm||(isKidMenu(v)?VKW.bimbi.test(h):i===0?VKW.std.test(h):false)||(nm.length>3&&h.includes(nm))}
/* piatti che si possono prenotare da soli (hanno un prezzo da solo) */
function soloPiatti(){return S.portate.filter(p=>p.prezzo>0)}
const stripSolo=h=>h.replace(/^solo\s+/,"").replace(/\s+/g," ").trim();
function piattoFor(h){const x=stripSolo(h);if(x.length<3)return null;const P=soloPiatti();
  const eq=P.find(p=>norm(p.nome)===x);if(eq)return eq;
  const hits=P.filter(p=>{const n=norm(p.nome);return n.startsWith(x)||x.startsWith(n)});return hits.length===1?hits[0]:null}
function fields(){return [["nome","Nominativo"],...S.varianti.map(v=>["v_"+v.id,"Menù "+v.nome]),...soloPiatti().map(p=>["s_"+p.id,p.nome+" da solo"]),
  ["tipo","Tipo (presente / asporto)"],["totale","Totale persone"],["note","Note / allergie"]]}
function autoMap(headers){
  const h=headers.map(norm),used=new Set(),map={};
  const pick=(key,test)=>{const i=h.findIndex((x,j)=>!used.has(j)&&x&&test(x));if(i>=0){used.add(i);map[key]=String(i)}else map[key]=""};
  pick("nome",x=>KW.nome.test(x));
  /* prima i piatti «SOLO …», così «SOLO TORTA» non finisce su un menù */
  soloPiatti().forEach(p=>pick("s_"+p.id,x=>/^solo\s/.test(x)&&piattoFor(x)===p));
  S.varianti.forEach((v,i)=>pick("v_"+v.id,variantTest(v,i)));
  soloPiatti().forEach(p=>{if(map["s_"+p.id]==="")pick("s_"+p.id,x=>piattoFor(x)===p)});
  pick("tipo",x=>KW.tipo.test(x));pick("totale",x=>KW.totale.test(x));pick("note",x=>KW.note.test(x));
  if(map.nome===""){const i=h.findIndex((x,j)=>!used.has(j)&&x);if(i>=0){used.add(i);map.nome=String(i)}}
  return map;
}
function num(v){const n=parseFloat(String(v==null?"":v).replace(",","."));return isFinite(n)&&n>0?Math.round(n):0}
function cell(row,idx){return idx===""||idx==null?"":String(row[Number(idx)]==null?"":row[Number(idx)]).trim()}
function buildPren(row,map){
  const nome=cell(row,map.nome).replace(/\s+/g," ");
  const qty={};S.varianti.forEach(v=>{if(map["v_"+v.id]!=="")qty[v.id]=num(cell(row,map["v_"+v.id]))});
  const base=S.varianti[0];
  if(base&&map.totale!==""&&map["v_"+base.id]===""){const tot=num(cell(row,map.totale));const others=Object.entries(qty).filter(([id])=>id!==base.id).reduce((a,[,q])=>a+q,0);qty[base.id]=Math.max(0,tot-others)}
  const rr=S.varianti.map(v=>({id:v.id,nome:v.nome,qta:qty[v.id]||0})).filter(r=>r.qta>0);
  const sg={};soloPiatti().forEach(p=>{const q=map["s_"+p.id]!==""?num(cell(row,map["s_"+p.id])):0;if(q)sg[p.id]=q});
  const b={nome,righe:rr,singoli:sg,note:cell(row,map.note)};if(/asport/.test(norm(cell(row,map.tipo))))b.asporto=true;return b;
}
/* chips di una prenotazione: menù, piatti da soli, asporto */
function prenSing(p){return Object.entries((p&&p.singoli)||{}).filter(([,q])=>q>0).map(([id,q])=>({id,q,nome:(S.portate.find(x=>x.id===id)||{}).nome||"piatto"}))}
function prenChips(p){return (p.asporto?'<span class="pill asp">Asporto</span>':"")+righeChips(righe(p))+prenSing(p).map(x=>`<span class="chip">${x.q} ${esc(x.nome)} (da solo)</span>`).join("")}
function planImport(built,prune){
  const byName={};prensArr().forEach(p=>{const k=norm(p.nome);(byName[k]=byName[k]||[]).push(p)});
  const upd={},stats={nuove:0,aggiornate:0,tolte:0},touched=new Set();
  built.forEach(b=>{
    const ex=(byName[norm(b.nome)]||[]).find(p=>!touched.has(p.id));
    if(ex){touched.add(ex.id);stats.aggiornate++;upd[ex.id+"/nome"]=b.nome;upd[ex.id+"/righe"]=b.righe;upd[ex.id+"/singoli"]=b.singoli;upd[ex.id+"/asporto"]=b.asporto||null;upd[ex.id+"/note"]=b.note}
    else{const id=rid("p");stats.nuove++;upd[id]={id,nome:b.nome,righe:b.righe,singoli:b.singoli,note:b.note,stato:"attesa",ordine:0,...(b.asporto?{asporto:true}:{})}}
  });
  if(prune)prensArr().forEach(p=>{if(!touched.has(p.id)&&p.stato!=="arrivata"){upd[p.id]=null;stats.tolte++}});
  return {upd,stats};
}
function readMap(){const m={};fields().forEach(([k])=>{const s=$("im-"+k);m[k]=s?s.value:""});return m}
function renderImport(){
  const imp=S.imp;if(!imp){$("i-map-wrap").hidden=true;return}
  $("i-map-wrap").hidden=false;
  const opts=`<option value="">— nessuna —</option>`+imp.headers.map((h,i)=>`<option value="${i}">${esc(h||("Colonna "+(i+1)))}</option>`).join("");
  $("i-map").innerHTML=fields().map(([k,l])=>`<label for="im-${k}">${esc(l)}</label><select id="im-${k}" data-map="1">${opts}</select>`).join("");
  fields().forEach(([k])=>{$("im-"+k).value=imp.map[k]||""});
  $("i-info").textContent=`Foglio «${imp.sheet}»: ${imp.rows.length} righe trovate. Controlla che ogni campo punti alla colonna giusta.`;
  const miss=imp.headers.map((h,i)=>({h,i})).filter(x=>x.h&&!Object.values(imp.map).includes(String(x.i))).map(x=>x.h);
  $("i-basehint").textContent=(S.varianti[0]?`Se il file ha solo il totale delle persone, i coperti che non rientrano negli altri menù vanno su «${S.varianti[0].nome}». `:"")+(miss.length?`Colonne non usate: ${miss.join(", ")}.`:"");
  renderPreview();
}
function renderPreview(){
  const map=readMap();S.imp.map=map;
  const built=S.imp.rows.map(r=>buildPren(r,map)).filter(p=>p.nome&&!/^esempio\b/i.test(p.nome));
  S.imp.built=built;
  const tot=built.reduce((a,p)=>a+cop(p.righe),0),zero=built.filter(p=>!cop(p.righe)&&!Object.keys(p.singoli).length).length;
  const nAsp=built.filter(p=>p.asporto).length,perV=S.varianti.map(v=>[v.nome,built.reduce((a,p)=>a+((p.righe.find(r=>r.id===v.id)||{}).qta||0),0)]).filter(x=>x[1]),
    perS=soloPiatti().map(x=>[x.nome,built.reduce((a,p)=>a+(p.singoli[x.id]||0),0)]).filter(x=>x[1]);
  const pl=planImport(built,$("i-prune").checked).stats;
  const cnt={};built.forEach(p=>{const k=norm(p.nome);cnt[k]=(cnt[k]||0)+1});
  const dups=built.filter((p,i)=>cnt[norm(p.nome)]>1&&built.findIndex(x=>norm(x.nome)===norm(p.nome))===i).map(p=>`${p.nome} (${cnt[norm(p.nome)]} volte)`);
  $("i-preview").innerHTML=`<table><thead><tr><th>Nominativo</th><th>Cosa</th><th>Note</th></tr></thead><tbody>`+
    built.slice(0,6).map(p=>`<tr><td>${esc(p.nome)}</td><td><div class="chips">${prenChips(p)||'<span class="pill call">niente</span>'}</div></td><td>${esc(p.note)}</td></tr>`).join("")+`</tbody></table>`+
    `<p class="hint" style="margin-top:8px"><b>${built.length-nAsp} al tavolo, ${nAsp} d'asporto · ${[...perV.map(([n,q])=>q+" "+n),...perS.map(([n,q])=>q+" "+n+" da soli")].join(" · ")||"nessun coperto"}</b><br>${tot} coperti${zero?` · ${zero} senza niente (si sistemano in cassa)`:""}.<br>
    ${pl.nuove} nuove, ${pl.aggiornate} aggiornate${pl.tolte?`, ${pl.tolte} da togliere`:""}. Chi è già arrivato resta arrivato.</p>`+
    (dups.length?`<p class="msg err">Nomi ripetuti nel file: ${esc(dups.join(", "))}. Diventano prenotazioni separate: controlla che non siano doppioni.</p>`:"");
  $("i-go").textContent=`Importa ${built.length} prenotazioni`;$("i-go").disabled=!built.length;
}
$("i-map").addEventListener("change",e=>{if(e.target.dataset.map)renderPreview()});
$("i-prune").addEventListener("change",()=>{if(S.imp)renderPreview()});
function parseFile(file){
  const m=$("i-msg");m.className="msg";m.textContent="Leggo il file…";
  if(!window.XLSX){m.className="msg err";m.textContent="Il lettore di Excel non si è caricato. Ricarica la pagina e riprova.";return}
  const fr=new FileReader();
  fr.onload=()=>{try{
    const wb=XLSX.read(new Uint8Array(fr.result),{type:"array"});
    const name=wb.SheetNames[0],rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:"",raw:false});
    const hi=rows.findIndex((r,i)=>i<15&&r.filter(c=>String(c).trim()).length>=2);
    if(hi<0){m.className="msg err";m.textContent="Non trovo una riga con i nomi delle colonne.";return}
    const headers=rows[hi].map(c=>String(c).trim());
    const data=rows.slice(hi+1).filter(r=>r.some(c=>String(c).trim()));
    S.imp={sheet:name,headers,rows:data,map:autoMap(headers)};m.textContent="";renderImport();
  }catch(err){m.className="msg err";m.textContent="Non riesco a leggere questo file. Prova a salvarlo come .xlsx o .csv."}};
  fr.onerror=()=>{m.className="msg err";m.textContent="Non riesco ad aprire il file."};
  fr.readAsArrayBuffer(file);
}
$("i-file").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)parseFile(f);e.target.value=""});
const drop=$("i-drop");
drop.addEventListener("dragover",e=>{e.preventDefault()});
drop.addEventListener("drop",e=>{e.preventDefault();const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)parseFile(f)});
/* modello vuoto con le colonne della serata: Nominativo, un menù per colonna, «SOLO <piatto>», Tipo, Note */
$("i-template").addEventListener("click",()=>{const m=$("i-msg");
  if(!window.XLSX){m.className="msg err";m.textContent="Il componente Excel non si è caricato. Ricarica la pagina.";return}
  /* nel modello solo i piatti della cucina (le bevande si prendono in cassa); l'import accetta comunque anche le altre colonne «SOLO …» */
  const br=barReps(),SP=soloPiatti().filter(p=>!portReps(p).some(x=>br.includes(x.r)));
  const head=["NOMINATIVO",...S.varianti.map(v=>v.nome.toUpperCase()),...SP.map(p=>"SOLO "+p.nome.toUpperCase()),"TIPO","NOTE"];
  const ex=["Esempio Rossi",...S.varianti.map((v,i)=>i===0?2:0),...SP.map(()=>0),"PRESENTE","Una riga che comincia con «Esempio» non viene importata"];
  const ws=XLSX.utils.aoa_to_sheet([head,ex]);ws["!cols"]=head.map((h,i)=>({wch:i===0?28:i===head.length-1?40:Math.max(10,h.length+2)}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Prenotazioni");
  const leg=XLSX.utils.aoa_to_sheet([["Colonna","Cosa scrivere"],["NOMINATIVO","Nome di chi prenota"],...S.varianti.map(v=>[v.nome.toUpperCase(),"Quanti menù "+v.nome]),
    ...SP.map(p=>["SOLO "+p.nome.toUpperCase(),"Quanti "+p.nome+" da soli (fuori menù)"]),["TIPO","PRESENTE (al tavolo) oppure ASPORTO"],["NOTE","Allergie, richieste…"]]);
  leg["!cols"]=[{wch:24},{wch:50}];XLSX.utils.book_append_sheet(wb,leg,"Come compilare");
  try{XLSX.writeFile(wb,"modello-prenotazioni.xlsx");m.className="msg ok";m.textContent="Modello scaricato: compilalo e poi importalo qui."}catch(e){m.className="msg err";m.textContent="Download non riuscito su questo dispositivo: prova da un computer."}});
$("i-cancel").addEventListener("click",()=>{S.imp=null;renderImport();$("i-msg").textContent=""});
$("i-go").addEventListener("click",async()=>{
  if(!S.imp)return;const m=$("i-msg");$("i-go").disabled=true;m.className="msg";m.textContent="Importo…";
  const {upd,stats}=planImport(S.imp.built||[],$("i-prune").checked);
  try{await R("prenotazioni").update(upd);
    m.className="msg ok";m.textContent=`Fatto: ${stats.nuove} nuove, ${stats.aggiornate} aggiornate${stats.tolte?`, ${stats.tolte} tolte`:""}.`;S.imp=null;renderImport();
  }catch(e){m.className="msg err";m.textContent=errText(e);$("i-go").disabled=false}
});

/* ---------- EVENTO: export e reset ---------- */
function fmtTime(t){if(!t)return"";const d=new Date(t);return d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})}
$("e-export").addEventListener("click",()=>{exportExcel()});
function exportExcel(title){
  const m=$("e-export-msg");
  if(!window.XLSX){m.className="msg err";m.textContent="Il componente Excel non si è caricato. Ricarica la pagina.";return false}
  const V=S.varianti,O=ordersArr().sort((a,b)=>a.numero-b.numero),P=prensArr().sort((a,b)=>String(a.nome).localeCompare(String(b.nome))),T=totals();
  const qtyOf=(o,v)=>{const r=righe(o).find(x=>x.id===v.id);return r?r.qta:0};
  const XN=[...new Set([...S.extra.map(x=>x.nome),...O.flatMap(o=>extras(o).map(x=>x.nome))])];
  const xOf=(o,n)=>{const r=extras(o).find(x=>x.nome===n);return r?r.qta:0};
  const ord=[["Numero","Nominativo",...V.map(v=>v.nome),"Coperti","Piatti da soli","Asporto",...XN,"Importo menù €","Importo piatti da soli €","Importo extra €","Importo totale €","Incassato in cassa €","Restituito con rettifiche €","Offerta €","Ricevuto €","Pagamento","Ora","Creato da","Fila","Dove","Note",...S.portate.map(p=>p.nome)]];
  O.forEach(o=>ord.push([o.numero,o.nome||"",...V.map(v=>qtyOf(o,v)),cop(righe(o)),singoli(o).map(s=>`${s.qta} ${s.nome}`).join(", "),o.asporto?(o.asportoSubito?"Sì, subito":"Sì"):"No",...XN.map(n=>xOf(o,n)),o.importoMenu!=null?o.importoMenu:(o.importo||0),o.importoSingoli||0,o.importoExtra||0,o.importo||0,
    o.incassato||0,o.stornato||0,o.offerta||0,o.ricevuto||"",((o.incassato||0)+(o.offerta||0))>0?(o.metodo==="pos"?"POS":"Contanti"):"",fmtTime(o.creato),nameOf(o.creatoDaId,o.creatoDa),o.fila?filaNome(o.fila):"",o.dove||o.tavolo||"",o.note||"",
    ...S.portate.map(p=>o.portate&&o.portate[p.id]?(o.portate[p.id].stato||"attesa"):"—")]));
  const SP=S.portate.filter(p=>P.some(x=>(x.singoli||{})[p.id]));
  const pre=[["Nominativo",...V.map(v=>v.nome),...SP.map(p=>p.nome+" da solo"),"Coperti","Asporto","Arrivati","Numero ordine","Note"]];
  P.forEach(p=>pre.push([p.nome,...V.map(v=>qtyOf(p,v)),...SP.map(x=>(p.singoli||{})[x.id]||0),cop(righe(p)),p.asporto?"Sì":"No",p.stato==="arrivata"?"Sì":"No",p.ordine||"",p.note||""]));
  const per={};O.forEach(o=>righe(o).forEach(r=>{per[r.nome]=(per[r.nome]||0)+r.qta}));
  const rie=[["Voce","Valore"],["Ordini",T.n],["Coperti",T.cop],...S.portate.map(p=>[p.nome+" (porzioni)",usedFor(p.id)]),
    ...XN.map(n=>["Venduti "+n,O.reduce((a,o)=>a+xOf(o,n),0)]),
    ["Incassato per menù ed extra €",T.cassa],["Offerte negli ordini €",r2(O.reduce((a,o)=>a+(o.offerta||0),0))],["Offerte senza ordine €",r2(Object.values(S.offMap).reduce((a,d)=>a+(d.importo||0),0))],["Restituito con rettifiche (già tolto dagli incassi) €",r2(O.reduce((a,o)=>a+(o.stornato||0),0))],
    ["Totale incassato in cassa (contanti + POS) €",r2(payTotals().contanti+payTotals().pos)],["di cui contanti €",payTotals().contanti],["di cui POS €",payTotals().pos],
    ...(()=>{const X=closeTotals();return [["Fondi cassa €",X.fondo],["Contanti attesi nei cassetti €",X.attesi],...(X.contato!=null?[["Contanti contati €",X.contato],["Differenza €",r2(X.contato-X.attesi)]]:[]),
      ...X.ids.flatMap(id=>{const c=postCalc(id),n=postNome(id);return [[`${n}: fondo €`,c.fondo],[`${n}: contanti €`,c.contanti],[`${n}: POS €`,c.pos],[`${n}: contanti attesi €`,c.attesi],...(c.contato!=null?[[`${n}: contati €`,c.contato],[`${n}: differenza €`,c.diff]]:[])]})]})(),
    ["Totale €",T.valore],["Prenotazioni",P.length],["Prenotazioni arrivate",P.filter(p=>p.stato==="arrivata").length]];
  const wb=XLSX.utils.book_new();
  const off=[["Ora","Importo €","Pagamento","Registrata da"]];
  Object.values(S.offMap).sort((a,b)=>a.t-b.t).forEach(d=>off.push([fmtTime(d.t),d.importo||0,d.metodo==="pos"?"POS":"Contanti",nameOf(d.daId,d.da)]));
  const lg=[["Ora","Chi","Modifica"]];Object.values(S.logMap).sort((a,b)=>a.t-b.t).forEach(l=>lg.push([fmtTime(l.t),l.chi||"",l.cosa]));
  const ann=[["Numero","Nominativo","Ora","Annullato da","Restituiti €","Era già partito"]];
  Object.values(S.annMap).sort((a,b)=>a.n-b.n).forEach(a=>ann.push([a.n,a.nome||"",fmtTime(a.t),nameOf(a.daId,a.da),a.restituiti||0,a.partito?"Sì":"No"]));
  const tm=[["","Nome","Piatti","Preparazione media (min)","Preparazione più lunga (min)","Attesa al bancone media (min)","Attesa più lunga (min)"]],m1=v=>v==null?"":Math.round(v/6000)/10;
  timesData().forEach(r=>tm.push([r.tipo,r.nome,r.cook.n,m1(r.cook.avg),m1(r.cook.max),r.wait?m1(r.wait.avg):"",r.wait?m1(r.wait.max):""]));
  [["Riepilogo",rie],["Ordini",ord],["Tempi",tm],["Annullati",ann],["Prenotazioni",pre],["Offerte senza ordine",off],["Registro modifiche",lg]].forEach(([n,a])=>{const ws=XLSX.utils.aoa_to_sheet(a);ws["!cols"]=a[0].map((h,i)=>({wch:i===0?(n==="Ordini"?8:26):Math.max(10,String(h).length+2)}));XLSX.utils.book_append_sheet(wb,ws,n)});
  const d=new Date(),stamp=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const fname=title?`riepilogo-${String(title).replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-")||stamp}.xlsx`:`riepilogo-oratorio-${stamp}.xlsx`;
  try{XLSX.writeFile(wb,fname);m.className="msg ok";m.textContent="Excel scaricato.";return true}catch(e){m.className="msg err";m.textContent="Download non riuscito su questo dispositivo: prova da un computer.";return false}
}
$("e-reset").addEventListener("click",()=>{$("e-reset-row").hidden=true;$("e-confirm-row").hidden=false});
$("e-reset-no").addEventListener("click",()=>{$("e-reset-row").hidden=false;$("e-confirm-row").hidden=true});
$("e-reset-save").addEventListener("click",async()=>{
  const m=$("e-reset-msg");
  if(!exportExcel()){m.className="msg err";m.textContent="Non sono riuscito a scaricare l'Excel, quindi non ho cancellato niente. Riprova da un computer oppure scegli «Cancella senza scaricare».";return}
  m.className="msg";m.textContent="Excel scaricato. Archivio…";await sleep(1500);await doReset();
});
$("e-reset-yes").addEventListener("click",()=>doReset());
function eventName(){const v=$("e-name").value.trim();if(v)return v;const d=new Date();return "Serata del "+d.toLocaleDateString("it-IT")}
/* tutto quello che serve per rifare l'Excel della serata più avanti (senza PIN) */
function archiveData(nome){
  const T=totals(),P=payTotals(),id=rid("e");
  const utenti={};S.users.forEach(u=>{utenti[u.id]={id:u.id,nome:u.nome,ruolo:u.ruolo,...(u.ruoli?{ruoli:u.ruoli}:{})}});
  const sum={id,nome,t:Date.now(),da:myName(),ordini:T.n,coperti:T.cop,contanti:P.contanti,pos:P.pos,offerte:P.offerte,totale:T.valore};
  return {sum,data:{...sum,ordini:S.ordMap,annullati:S.annMap,prenotazioni:S.prenMap,offerte:S.offMap,log:S.logMap,postazioni:S.post,
    menu:{varianti:S.varianti,portate:S.portate,extra:S.extra,reparti:repList()},listino:S.L,file:fileList(),utenti,scorte:S.scorte}};
}
async function doReset(){
  $("e-confirm-row").hidden=true;const m=$("e-reset-msg");m.className="msg";m.textContent="Archivio la serata…";
  try{const nome=eventName(),A=archiveData(nome);
    await R("archivio/"+A.sum.id).set(A.data);await R("archivioIndice/"+A.sum.id).set(A.sum);
    m.textContent="Archiviata. Cancello la serata in corso…";
    S.resetting=true;await R("config/scorte").remove();await R("config/scorteBar").remove();await R("ordini").remove();await R("annullati").remove();await R("prenotazioni").remove();await R("offerte").remove();await R("log").remove();await Promise.all(Object.keys(S.post).map(id=>R("config/cassa/postazioni/"+id+"/contato").remove()));
    m.className="msg ok";m.textContent=`Fatto: «${nome}» è tra le Serate passate. Si riparte dal numero 1. Le porzioni vanno reimpostate; i fondi cassa restano: aggiornali se cambiano.`;$("e-name").value="";if(S.archShown)loadArchive();S.lastNum=null;S.openNum=null;S.numDirty=false;closeEdit();resetForm();
    $("c-last").innerHTML="";$("c-last-wrap").hidden=true;}
  catch(e){m.className="msg err";m.textContent=errText(e)}
  finally{$("e-reset-row").hidden=false;setTimeout(()=>{S.resetting=false;S.removedQ=[]},1500)}
}
/* nuovo codice di accesso: i telefoni con il link vecchio non entrano più */
$("e-newkey").addEventListener("click",async()=>{const b=$("e-newkey"),m=$("e-newkey-msg");
  if(!isBoss())return;if(!armed(b,"Tutti dovranno riaprire il link: confermi?"))return;
  const k=newCode()+newCode()+newCode()+newCode(),me=firebase.auth().currentUser;b.disabled=true;m.className="msg";m.textContent="Cambio il codice…";
  try{await firebase.database().ref("segreto").set(k);await firebase.database().ref("accessi/"+me.uid).set(k);lsSet("acc",k);
    logChange("Cambiato il codice di accesso: servono link e QR nuovi");m.className="msg ok";m.textContent="Fatto. Ricarico la pagina: poi da qui mostra il link e il QR nuovi.";setTimeout(()=>location.reload(),1500)}
  catch(e){m.className="msg err";m.textContent=errText(e);b.disabled=false}});

/* serate passate */
async function loadArchive(){
  const box=$("e-arch"),m=$("e-arch-msg");S.archShown=true;$("e-arch-load").textContent="Aggiorna";
  try{const s=await R("archivioIndice").once("value"),L=Object.values(s.val()||{}).sort((a,b)=>b.t-a.t);
    box.innerHTML=L.length?L.map(a=>`<div class="li plain two"><span><b>${esc(a.nome)}</b><div class="sub">${new Date(a.t).toLocaleDateString("it-IT")} · ${a.ordini} ordini · ${a.coperti} coperti · contanti ${money(a.contanti)} · POS ${money(a.pos)}</div></span>
      <span class="row"><button class="btn small" data-archxl="${esc(a.id)}">Scarica Excel</button>${isBoss()?`<button class="btn small danger" data-archdel="${esc(a.id)}">Elimina</button>`:""}</span></div>`).join("")
      :'<div class="empty">Nessuna serata archiviata. Si archivia con «Nuovo evento».</div>'}
  catch(e){m.className="msg err";m.textContent=errText(e)}
}
$("e-arch-load").addEventListener("click",loadArchive);
/* rifà l'Excel di una serata archiviata usando i suoi dati al posto di quelli in corso */
function withArchive(A,fn){
  const keys=["ordMap","annMap","prenMap","offMap","logMap","post","varianti","portate","extra","reparti","file","users","scorte"],bak={};keys.forEach(k=>bak[k]=S[k]);
  const fix=o=>{const x={};Object.entries(o||{}).forEach(([k,v])=>{x[k]={...v,id:v.id||k}});return x};
  try{S.ordMap=fix(A.ordini);S.annMap=fix(A.annullati);S.prenMap=fix(A.prenotazioni);S.offMap=fix(A.offerte);S.logMap=fix(A.log);S.post=A.postazioni||{};
    const M=A.menu||{};S.varianti=toArr(M.varianti);S.portate=toArr(M.portate).map(p=>({...p,menu:p.menu?toArr(p.menu):null,reparti:toArr(p.reparti)}));S.extra=toArr(M.extra);S.reparti=toArr(M.reparti);
    S.file=toArr(A.file);S.users=Object.values(A.utenti||{});S.scorte=A.scorte||{};
    return fn()}
  finally{keys.forEach(k=>S[k]=bak[k])}
}
$("e-arch").addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;const m=$("e-arch-msg");
  if(b.dataset.archxl){b.disabled=true;try{const s=await R("archivio/"+b.dataset.archxl).once("value"),A=s.val();if(!A){m.className="msg err";m.textContent="Serata non trovata.";return}
      const ok=withArchive(A,()=>exportExcel(A.nome));m.className=ok?"msg ok":"msg err";m.textContent=ok?`Excel di «${A.nome}» scaricato.`:$("e-export-msg").textContent}
    catch(err){m.className="msg err";m.textContent=errText(err)}finally{b.disabled=false}return}
  if(b.dataset.archdel){if(!isBoss()||!armed(b,"Elimino?"))return;const id=b.dataset.archdel;
    try{await R("archivio/"+id).remove();await R("archivioIndice/"+id).remove();m.className="msg ok";m.textContent="Serata eliminata.";loadArchive()}catch(err){m.className="msg err";m.textContent=errText(err)}}
});

