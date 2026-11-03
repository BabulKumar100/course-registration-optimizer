/* ---------- events ---------- */
$$('.tab').forEach(t=>t.addEventListener('click',()=>{
  S.tab=t.dataset.tab; $$('.tab').forEach(x=>x.setAttribute('aria-selected',String(x===t)));
  $$('.view').forEach(v=>v.hidden = v.id!=='v-'+S.tab); tip.hidden=true; renderActive();
}));
document.addEventListener('click',e=>{ const b=e.target.closest('[data-view]'); if(!b) return; S.view=b.dataset.view; recompute(); });
$('#scenario').addEventListener('change',e=>loadScenario(e.target.value));
$('#resetBtn').addEventListener('click',()=>loadScenario(S.key));
$('#minCr').addEventListener('input',e=>{ S.sc.minCr=Math.max(0,+e.target.value||0); recompute(); });
$('#maxCr').addEventListener('input',e=>{ S.sc.maxCr=Math.max(1,+e.target.value||1); recompute(); });
$('#objective').addEventListener('change',e=>{ S.objective=e.target.value; recompute(); });
$('#waitlist').addEventListener('change',e=>{ S.sc.waitlist=e.target.checked; recompute(); });
$('#doneChips').addEventListener('click',e=>{ const b=e.target.closest('[data-done]'); if(!b) return; const c=b.dataset.done; const i=S.sc.done.indexOf(c); if(i>=0) S.sc.done.splice(i,1); else S.sc.done.push(c); b.setAttribute('aria-pressed',String(i<0)); recompute(); });
$('#rows').addEventListener('input',e=>{ const t=e.target; const row=t.closest('.crow'); if(!row) return; const c=S.sc.courses[idx(row.dataset.code)];
  if(t.id.startsWith('want-')) c.want=t.checked; else if(t.id.startsWith('seats-')) c.seats=Math.max(0,parseInt(t.value||'0',10)||0); else if(t.id.startsWith('prio-')){ c.prio=+t.value; $('#po-'+c.code).textContent=c.prio; }
  recompute(); });
$('#simN').addEventListener('input',e=>{S.sim.n=+e.target.value;renderBatch();});
$('#simK').addEventListener('input',e=>{S.sim.k=+e.target.value;renderBatch();});
$('#simC').addEventListener('input',e=>{S.sim.cap=+e.target.value;renderBatch();});
$('#reroll').addEventListener('click',()=>{S.sim.seed=Math.floor(Math.random()*1e6);renderBatch();});
$('#bT').addEventListener('input',e=>{S.benchT=+e.target.value;$('#bTo').textContent=S.benchT;});
$('#bT').addEventListener('change',()=>renderAnalysis());
$('#rebench').addEventListener('click',()=>{S.bench=null;renderAnalysis();});

