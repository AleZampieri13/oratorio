/* Suoni, vibrazioni e avvisi tra telefoni */
/* ---------- avvisi ---------- */
function setSoundBtns(){
  $("k-sound").textContent="Suono: "+(S.sound?"acceso":"spento");$("k-sound").setAttribute("aria-pressed",String(S.sound));
  $("w-sound").textContent="Avviso sonoro: "+(S.sound?"acceso":"spento");
  $("b-sound").textContent="Suono: "+(S.sound?"acceso":"spento");$("o-sound").textContent="Suono: "+(S.sound?"acceso":"spento");$("o-sound").setAttribute("aria-pressed",String(S.sound));$("b-sound").setAttribute("aria-pressed",String(S.sound));$("w-sound").setAttribute("aria-pressed",String(S.sound));
}
function toggleSound(){
  S.sound=!S.sound;setSoundBtns();lsSet("suono",S.sound?"1":"0");
  if(S.sound){try{S.audio=S.audio||new (window.AudioContext||window.webkitAudioContext)();S.audio.resume();beep()}catch(e){}}
}
$("k-sound").addEventListener("click",toggleSound);
$("w-sound").addEventListener("click",toggleSound);
$("b-sound").addEventListener("click",toggleSound);
function beep(){
  if(!S.sound||!S.audio)return;
  try{S.audio.resume();const t=S.audio.currentTime;[0,0.18].forEach((d,i)=>{const o=S.audio.createOscillator(),g=S.audio.createGain();o.frequency.value=i?1046:784;
    g.gain.setValueAtTime(0.0001,t+d);g.gain.exponentialRampToValueAtTime(0.3,t+d+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.16);
    o.connect(g).connect(S.audio.destination);o.start(t+d);o.stop(t+d+0.18)})}catch(e){}
}
function buzz(){beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
function checkEvents(){
  if(!S.ordLoaded||!S.me)return;
  const sc=kScope(),callKeys=new Set(sc?repItems("chiamata",sc).map(c=>c.o.numero+":"+c.k+":"+c.r+":"+c.t):flatCourses("chiamata").map(c=>c.o.numero+":"+c.k+":"+c.t));
  if(S.seenCalls&&S.role==="cucina"){for(const k of callKeys)if(!S.seenCalls.has(k)){buzz();break}}
  S.seenCalls=callKeys;
  if(S.removedQ.length){const gone=S.removedQ.splice(0);
    const active=o=>{const cs=orderCourses(o).filter(c=>c.p.stato==="chiamata"||c.p.stato==="pronta");return sc?cs.some(c=>Object.keys(c.p.rep||{}).some(r=>sc.includes(r))):cs.length>0};
    const hit=gone.filter(o=>S.role==="cucina"?active(o):S.role==="bar"?(o.bar&&(o.bar.stato==="chiamata"||o.bar.stato==="pronta")):S.role==="camerieri"?mineOrder(o):false);
    if(hit.length){buzz();toast(hit.length>3?`${hit.length} ordini annullati: le loro schede sono sparite.`:hit.map(o=>`Ordine n. ${o.numero}${o.nome?" "+o.nome:""} annullato dalla cassa`).join("  ·  "),{ms:10000})}}
  const barNew=new Set(ordersArr().filter(o=>o.bar&&o.bar.stato==="chiamata").map(o=>o.numero+":"+o.bar.t));
  if(S.seenBar&&S.role==="bar"){for(const k of barNew)if(!S.seenBar.has(k)){buzz();break}}
  S.seenBar=barNew;
  if(S.role==="uscita"){const osc=oScope(),outKeys=new Set(flatCourses("pronta").filter(c=>!c.o.asportoSubito&&inOScope(c,osc)).map(c=>c.o.numero+":"+c.k+":"+c.t));
    if(S.seenOut){for(const k of outKeys)if(!S.seenOut.has(k)){buzz();break}}S.seenOut=outKeys}
  const allReady=[...flatCourses("pronta"),...barItems("pronta",true)];
  const mine=(S.role==="cassa"?allReady.filter(x=>x.o.asportoSubito&&x.o.creatoDaId===S.me.id):allReady.filter(x=>!x.o.asportoSubito&&isMine(x))),readyKeys=new Map(mine.map(x=>[x.o.numero+":"+x.k+":"+x.t,x]));
  if(S.seenReady&&(S.me.ruolo==="cameriere"||hasRole(S.me,"capo")||S.role==="camerieri"||S.role==="cassa")){
    const fresh=[...readyKeys.entries()].filter(([k])=>!S.seenReady.has(k)).map(([,x])=>x);
    if(fresh.length){buzz();toast(fresh.map(x=>`${x.bar?"Bevande pronte al bar":(x.o.asporto?"Asporto pronto":"Pronto")+": "+x.l} · ${whereTxt(x.o)}`).join("  ·  "),{ms:8000})}
  }
  S.seenReady=new Set(readyKeys.keys());
  const myReady=new Set();ordersArr().filter(mineOrder).forEach(o=>{orderCourses(o).forEach(c=>{if(c.p.stato==="pronta")myReady.add(o.numero+"|"+c.k)});if(o.bar&&o.bar.stato==="pronta")myReady.add(o.numero+"|bar")});
  if(S.seenMyCalls&&(S.me.ruolo==="cameriere"||S.role==="camerieri")){
    const back=[...S.seenMyCalls].filter(x=>!myReady.has(x)).map(x=>{const [n,k]=x.split("|"),o=orderByNum(Number(n));
      if(k==="bar")return o&&o.bar&&o.bar.stato==="chiamata"&&o.bar.annull==="pronta"?{o,l:"Bevande"}:null;
      const p=o&&o.portate&&o.portate[k];return p&&p.stato==="chiamata"&&p.annull==="pronta"?{o,l:(orderCourses(o).find(c=>c.k===k)||{}).l||k}:null}).filter(Boolean);
    if(back.length){buzz();toast(back.map(x=>`Non ancora pronto: ${x.l} · ${whereTxt(x.o)}`).join("  ·  "),{ms:9000})}
  }
  S.seenMyCalls=myReady;
}

