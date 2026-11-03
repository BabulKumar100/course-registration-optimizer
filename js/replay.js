/* ---------- backtracking replay ---------- */
function rpStop(){ if(S.rp.timer){ clearInterval(S.rp.timer); S.rp.timer=null; } const b=$('#rpPlay'); if(b) b.textContent='Play'; }
function rpText(e){
  const c=S.sc.courses.find(x=>x.code===e.code); const nm=c?c.code:'';
  switch(e.kind){
    case 'include': return `Take <b>${nm}</b>. Partial plan now has ${e.credits} credits and ${e.v} ${S.objective==='score'?'points':'credits counted'}.`;
    case 'blocked': return `Cannot take <b>${nm}</b>: ${esc(e.why)}.`;
    case 'exclude': return `Skip <b>${nm}</b> and move on to the next course.`;
    case 'backtrack': return `Undo <b>${nm}</b> and explore the branch without it.`;
    case 'prune-bound': return `Prune. Even adding every remaining course reaches only ${e.reach}, which cannot beat the best plan (${e.best}).`;
    case 'prune-min': return `Prune. The remaining courses cannot lift this plan to the minimum ${S.sc.minCr} credits.`;
    case 'leaf': return e.improved ? `Complete plan found: ${e.v} points, ${e.credits} credits. <b>New best.</b>` : `Complete plan: ${e.v} points. Not better than the best (${e.best}).`;
  } return '';
}
function renderReplay(){
  const B=S.B, T=B.trace||[], chips=$('#rpChips'); const total=T.length;
  if(!B.candCodes.length){ chips.innerHTML=''; $('#rpMsg').innerHTML='No eligible courses to search. Check prerequisites, seats and the request ticks.'; $('#rpStats').innerHTML=''; $('#rpStep').max=0; return; }
  const step=Math.min(S.rp.step,total); S.rp.step=step; const e=step>0?T[step-1]:null;
  const cur=new Set(e?e.cur:[]); let upto=0, now=-1;
  if(e){ if(e.kind==='include'){upto=e.i;now=e.i;} else if(e.kind==='blocked'||e.kind==='backtrack'){upto=e.i;now=e.i;} else if(e.kind==='exclude'){upto=e.i+1;} else {upto=e.i;} }
  chips.innerHTML=B.candCodes.map((code,i)=>{ let cls='pr', ic='';
    if(cur.has(code)){cls='in';ic='✓';} else if(i<upto){cls='out';} else if(i===now){cls='now';ic='?';}
    return `<span class="rpc ${cls}">${ic?ic+' ':''}${esc(code)}</span>`; }).join('');
  const sl=$('#rpStep'); sl.max=total; sl.value=step;
  let msg = e ? `<span class="n mono" style="color:var(--muted)">${step}/${total}</span><div>${rpText(e)}</div>` : `<div>Courses are tried in order of value. Press <b>Step</b> or <b>Play</b> to start.</div>`;
  $('#rpMsg').innerHTML=msg; $('#rpMsg').className='note'+(e&&e.kind==='leaf'&&e.improved?' good':'')+(e&&e.kind.startsWith('prune')?' warn':'');
  const pr=T.slice(0,step).filter(x=>x.kind.startsWith('prune')).length, best=e?e.best:-1;
  const fin=step===total;
  $('#rpStats').innerHTML=[[step+' / '+total,'Moves replayed'],[best>0?best:'none yet','Best score so far'],[pr,'Branches pruned so far'],[fin?B.score:'…','Final plan score']].map(x=>`<div class="kpi"><div class="v">${x[0]}</div><div class="l">${x[1]}</div></div>`).join('')+(total>=800?'<p class="sub" style="grid-column:1/-1">Replay shows the first 800 moves only.</p>':'');
}
function rpGo(n){ const t=(S.B.trace||[]).length; S.rp.step=Math.max(0,Math.min(t,n)); renderReplay(); if(S.rp.step>=t) rpStop(); }
$('#rpNext').addEventListener('click',()=>{ rpStop(); rpGo(S.rp.step+1); });
$('#rpPrev').addEventListener('click',()=>{ rpStop(); rpGo(S.rp.step-1); });
$('#rpStep').addEventListener('input',e=>{ rpStop(); rpGo(+e.target.value); });
$('#rpPlay').addEventListener('click',()=>{ if(S.rp.timer){ rpStop(); return; } const t=(S.B.trace||[]).length; if(S.rp.step>=t) S.rp.step=0; $('#rpPlay').textContent='Pause'; S.rp.timer=setInterval(()=>rpGo(S.rp.step+1),650); });

