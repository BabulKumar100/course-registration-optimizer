/* ---------- preferences, combinations, pipeline, toast ---------- */
function prefAdj(c){ let a=0; const {tod,free}=S.pref; const am=c.meetings.every(m=>m.s<12), pm=c.meetings.every(m=>m.s>=12);
  if(tod==='am'){ if(am)a+=8; else if(pm)a-=8; } if(tod==='pm'){ if(pm)a+=8; else if(am)a-=8; }
  if(free>=0 && c.meetings.some(m=>m.d===free)) a-=15; return a; }
function effSc(){ return {...S.sc, courses:S.sc.courses.map(c=>({...c,prio:Math.max(0,Math.min(100,c.prio+prefAdj(c)))}))}; }
$('#todPref').addEventListener('change',e=>{ S.pref.tod=e.target.value; recompute(); });
$('#freeDay').addEventListener('change',e=>{ S.pref.free=+e.target.value; recompute(); });
let toastT; function toast(m){ const t=$('#toast'); t.textContent=m; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{t.hidden=true;},2200); }

function renderCombos(){
  const el=$('#combos'), L=S.combos.list;
  if(!L.length){ el.innerHTML='<div class="empty">No combination satisfies every rule. Lower the minimum credits, free up seats or tick more courses.</div>'; return; }
  el.innerHTML=`<ol class="combos">${L.map((c,i)=>{ const on=S.view==='alt'&&S.altRank===i+1; return `<li class="${on?'on':''}"><span class="rk">${i+1}</span><div class="cw">${c.codes.map(code=>`<span class="cc"><i style="background:${hueVar(idx(code))}"></i>${esc(code)}</span>`).join('')}</div><div class="cm"><b>${c.score}</b> pts · ${c.credits} cr</div><button class="btn ghost" type="button" data-preview="${i}" ${on?'aria-pressed="true"':''}>${on?'Showing':'Preview'}</button></li>`; }).join('')}</ol><p class="sub" style="margin-top:10px">${S.combos.total.toLocaleString()} valid combinations in total. Ranked by ${S.objective==='score'?'total priority score':'total credits'}.</p>`;
}
$('#combos').addEventListener('click',e=>{ const b=e.target.closest('[data-preview]'); if(!b) return; const i=+b.dataset.preview, combo=S.combos.list[i]; const E=S.E;
  const taken=E.courses.filter(c=>combo.codes.includes(c.code)); const status={};
  E.courses.forEach(c=>{ status[c.code]=combo.codes.includes(c.code)?{kind:'accepted',reason:`Part of alternative #${i+1}`}:c.want?{kind:'rejected',reason:`Not part of alternative #${i+1}`}:{kind:'idle',reason:'Not requested'}; });
  S.altRes={algo:'alt',taken,status,log:[],credits:combo.credits,score:combo.score,ops:0,nodes:0,pruned:0,n:0,minMet:true}; S.altRank=i+1; S.view='alt';
  $$('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view===S.view))); updateRows(); renderActive(); toast('Previewing alternative #'+(i+1)); });

function renderPipe(){
  const L=S.G.log, req=L.length, cnt=re=>L.filter(l=>re.test(l.reason)).length;
  const pre=cnt(/^Prerequisite/), cr=cnt(/^Credit/), cf=cnt(/^Timetable/), full=L.filter(l=>l.kind==='waitlist'||/^Section full/.test(l.reason)).length, acc=L.filter(l=>l.kind==='accepted').length;
  const steps=[['Student preferences and academic data',String(req),'requests',0],['Retrieve available courses',String(S.sc.courses.length),'offerings',0],['Validate prerequisites',String(req-pre),'pass',pre],['Check credit limits',String(req-pre-cr),'pass',cr],['Detect timetable conflicts',String(req-pre-cr-cf),'conflict free',cf],['Evaluate feasible combinations',String(req-pre-cr-cf-full),'with a seat',full],['Generate recommended schedule',String(acc),'accepted',0]];
  $('#pipe').innerHTML=steps.map((s,i)=>`<li class="${i===0||i===6?'end':''}"><span class="pn">${i+1}</span><span class="pt">${s[0]}</span><span class="pv">${s[1]} <small>${s[2]}</small></span>${s[3]?`<span class="pl">✕ ${s[3]} dropped here</span>`:''}</li>`).join('');
}
