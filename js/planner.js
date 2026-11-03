/* ---------- scenario load & rows ---------- */
function circleLayout(codes){ const pos={}; const n=codes.length; codes.forEach((c,i)=>{ const a=-Math.PI/2+i*2*Math.PI/n; pos[c]={x:360+Math.cos(a)*(n<=4?150:195),y:250+Math.sin(a)*(n<=4?130:178)}; }); return pos; }
function loadScenario(key){
  S.key=key; S.sc=SCEN[key](); S.pos=circleLayout(S.sc.courses.map(c=>c.code));
  S.pref={tod:'none',free:-1}; $('#todPref').value='none'; $('#freeDay').value='-1'; S.view = S.view==='alt'?'bt':S.view;
  $('#scenario').value=key; $('#minCr').value=S.sc.minCr; $('#maxCr').value=S.sc.maxCr; $('#waitlist').checked=S.sc.waitlist;
  buildChips(); buildRows(); recompute();
}
function buildChips(){
  const box=$('#doneChips'); if(!S.sc.pool.length){ box.innerHTML='<span class="sub">This scenario has no prerequisites.</span>'; return; }
  box.innerHTML=S.sc.pool.map(c=>`<button type="button" class="chip" data-done="${c}" aria-pressed="${S.sc.done.includes(c)}">${c}</button>`).join('');
}
function buildRows(){
  $('#rows').innerHTML = S.sc.courses.map((c,i)=>`
  <div class="crow" data-code="${c.code}" style="--hue:${hueVar(i)}">
    <input type="checkbox" id="want-${c.code}" ${c.want?'checked':''} aria-label="Request ${esc(c.code)} ${esc(c.name)}">
    <div class="cinfo">
      <div class="ct"><span class="cdot"></span><b>${esc(c.code)}</b><span class="cname">${esc(c.name)}</span></div>
      <div class="cmeta"><span>${c.cr} credits</span><span class="mono">${c.meetings.map(fmtM).join(' · ')}</span></div>
      <div class="pre" data-pre></div>
    </div>
    <div class="side"><span class="pill" data-st></span><button type="button" class="rm" data-rm="${esc(c.code)}" aria-label="Remove ${esc(c.code)}">Remove</button></div>
    <div class="cctl">
      <div class="field"><label for="seats-${c.code}">Seats left</label><input type="number" id="seats-${c.code}" min="0" max="999" value="${c.seats}"></div>
      <div class="field"><label for="prio-${c.code}">Priority</label><div class="prio"><input type="range" id="prio-${c.code}" min="0" max="100" value="${c.prio}"><output id="po-${c.code}">${c.prio}</output><span class="padj" data-adj></span></div></div>
    </div>
  </div>`).join('');
}
const PILL = {accepted:['ok','✓ Accepted'],waitlist:['wl','… Waitlisted'],rejected:['no','✕ Rejected'],idle:['','– Not requested']};
function updateRows(){
  const res=cur();
  S.sc.courses.forEach(c=>{
    const row=$(`.crow[data-code="${c.code}"]`); if(!row) return;
    row.classList.toggle('off',!c.want);
    const ef=S.E.courses[S.sc.courses.indexOf(c)]; const dd=ef.prio-c.prio; $('[data-adj]',row).textContent=dd?(dd>0?'+':'')+dd+' pref':'';
    const st=res.status[c.code]; const p=PILL[st.kind]; const el=$('[data-st]',row); el.className='pill '+p[0]; el.textContent=p[1]; el.title=st.reason;
    $('[data-pre]',row).innerHTML = c.pre.length ? c.pre.map(p=>{ const ok=S.sc.done.includes(p); return `<span class="ptag ${ok?'met':'unmet'}">${ok?'✓':'!'} needs ${esc(p)}</span>`; }).join('') : '<span class="ptag">no prerequisites</span>';
  });
}

/* ---------- recompute & render ---------- */
function recompute(){
  if(S.view==='alt'){ S.view='bt'; S.altRes=null; }
  S.E=effSc(); S.G=runGreedy(S.E); S.B=runBacktracking(S.E,S.objective,true); S.combos=topCombos(S.E,S.objective,5); rpStop(); S.rp.step=0;
  $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===S.view)));
  updateRows(); renderActive();
}
function renderActive(){
  if(S.tab==='planner') renderPlanner(); else if(S.tab==='graph') renderGraph(); else if(S.tab==='batch') renderBatch(); else renderAnalysis();
}
function renderPlanner(){ renderSummary(); renderTimetable(); renderCompare(); renderHours(); renderCombos(); renderPipe(); renderDecisions(); renderReplay(); }

function renderSummary(){
  const sc=S.sc, r=cur(), g=S.G, b=S.B;
  const maxC=Math.max(1,sc.maxCr), pct=Math.min(100,r.credits/maxC*100), minP=Math.min(100,sc.minCr/maxC*100);
  const wanted=sc.courses.filter(c=>c.want).length;
  const nodesTxt = S.view==='greedy' ? `${r.ops}<small> steps</small>` : S.view==='bt' ? `${r.nodes}<small> / ${Math.pow(2,r.n).toLocaleString()}</small>` : `${S.combos.total.toLocaleString()}<small> valid</small>`;
  const nodesLbl = S.view==='greedy' ? 'Requests examined' : S.view==='bt' ? 'Search nodes visited (worst case 2ⁿ)' : 'Combinations that satisfy every rule';
  let notes='';
  if(S.view==='alt') notes+=`<div class="note" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><div>Previewing <b>alternative #${S.altRank}</b> from the ranked list.</div><button class="btn ghost" type="button" data-view="bt">Back to backtracking</button></div>`;
  if(sc.minCr>0 && r.credits<sc.minCr){
    notes+=`<div class="note warn"><span aria-hidden="true">!</span><div><b>Below the minimum.</b> ${r.credits} credits is under the required ${sc.minCr}.${S.view==='greedy'&&b.credits>=sc.minCr&&b.minMet?` Backtracking finds a valid plan with ${b.credits} credits.`:''}</div></div>`;
  }
  if(S.view==='bt' && !b.minMet) notes+=`<div class="note warn"><span aria-hidden="true">!</span><div><b>No combination reaches ${sc.minCr} credits</b> with these prerequisites, seats and clashes. Showing the best available plan.</div></div>`;
  if(S.view==='greedy' && b.score>g.score) notes+=`<div class="note good"><span aria-hidden="true">✓</span><div>Backtracking scores <b>${b.score}</b> against greedy's <b>${g.score}</b>. A high priority course took a slot that two others needed.</div></div>`;
  $('#sumTitle').textContent = S.view==='greedy' ? 'Greedy schedule' : S.view==='bt' ? 'Backtracking schedule' : 'Alternative schedule #'+S.altRank;
  $('#summary').innerHTML=`
    <div class="meter" role="img" aria-label="${r.credits} of ${sc.maxCr} credits">
      <div class="fill" style="width:${pct}%"></div>
      ${sc.minCr>0?`<div class="tick" style="left:${minP}%"><span>min ${sc.minCr}</span></div>`:''}
      <div class="ends"><span>0</span><span>max ${sc.maxCr}</span></div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v">${r.credits}<small> / ${sc.maxCr}</small></div><div class="l">Credits registered</div></div>
      <div class="kpi"><div class="v">${r.taken.length}<small> / ${wanted}</small></div><div class="l">Requests accepted</div></div>
      <div class="kpi"><div class="v">${r.score}</div><div class="l">Total priority score</div></div>
      <div class="kpi"><div class="v">${nodesTxt}</div><div class="l">${nodesLbl}</div></div>
    </div>${notes}`;
}

function renderTimetable(){
  const sc=S.sc, r=cur(); const mt=[];
  r.taken.forEach(c=>c.meetings.forEach(m=>mt.push({m,c,i:idx(c.code),ex:false})));
  (sc.existing||[]).forEach(e=>mt.push({m:e,c:{code:e.label||'Existing',name:'Already registered'},i:0,ex:true}));
  if(!mt.length){ $('#tt').innerHTML='<div class="empty">No courses accepted yet. Tick some requests or lower the rules.</div>'; return; }
  const all=sc.courses.flatMap(c=>c.meetings).concat(sc.existing||[]);
  const t0=Math.max(7,Math.floor(Math.min(...all.map(m=>m.s)))-1), t1=Math.min(20,Math.ceil(Math.max(...all.map(m=>m.e)))+1), HH=48, H=(t1-t0)*HH;
  let times=''; for(let h=t0;h<=t1;h++) times+=`<span style="top:${(h-t0)*HH}px">${String(h).padStart(2,'0')}:00</span>`;
  let html=`<div class="tt"><div></div>${DAYS.map(d=>`<div class="dh">${d}</div>`).join('')}<div class="times" style="height:${H}px">${times}</div>`;
  for(let d=0;d<5;d++){
    const hourLines=`background-image:repeating-linear-gradient(to bottom,transparent 0,transparent ${HH-1}px,var(--grid) ${HH-1}px,var(--grid) ${HH}px)`;
    html+=`<div class="dc" style="height:${H}px;${hourLines}">`;
    mt.filter(x=>x.m.d===d).forEach(x=>{ const top=(x.m.s-t0)*HH+1, h=(x.m.e-x.m.s)*HH-2;
      const style = x.ex ? `top:${top}px;height:${h}px` : `top:${top}px;height:${h}px;--hue:${hueVar(x.i)};--on:${onVar(x.i)}`;
      html+=`<div class="blk ${x.ex?'ex':''}" style="${style}" data-tip="${esc(`<b>${esc(x.c.code)}</b> ${esc(x.c.name)}${trow('Time',fmtT(x.m.s)+'–'+fmtT(x.m.e))}`)}"><b>${esc(x.c.code)}</b>${h>44?`<span>${esc(x.c.name)}</span>`:''}${h>58?`<small>${fmtT(x.m.s)}–${fmtT(x.m.e)}</small>`:''}</div>`; });
    html+='</div>';
  }
  $('#tt').innerHTML=html+'</div>';
}

function renderCompare(){
  const g=S.G,b=S.B, mx=Math.max(1,g.score,b.score);
  const items=[{label:'Greedy',value:g.score,color:'var(--s2)',text:g.score+' pts',tip:`<b>Greedy</b>${trow('Score',g.score)}${trow('Credits',g.credits)}${trow('Courses',g.taken.length)}`},
               {label:'Backtracking',value:b.score,color:'var(--s1)',text:b.score+' pts',tip:`<b>Backtracking</b>${trow('Score',b.score)}${trow('Credits',b.credits)}${trow('Courses',b.taken.length)}`}];
  const diff=b.score-g.score; const pct=g.score>0?Math.round(diff/g.score*100):0;
  const msg = diff>0 ? `Backtracking is <b>+${diff} points</b> (${pct>0?'+'+pct+'%':'higher'}) ahead.` : diff===0 ? 'Both algorithms reach the same total.' : 'Greedy scores higher here because backtracking was set to maximise credits.';
  $('#cmp').innerHTML=hbars(items,{w:360,rowH:36,labelW:96,valW:62,max:mx,label:'Total priority score by algorithm'})+
    `<p class="sub" style="margin-top:8px">${msg}</p><p class="sub">Greedy checked ${g.ops} requests. Backtracking visited ${b.nodes} nodes and pruned ${b.pruned} branches in ${b.ms.toFixed(2)} ms.</p>`;
}
function renderHours(){
  const r=cur(); const hrs=[0,0,0,0,0];
  r.taken.forEach(c=>c.meetings.forEach(m=>hrs[m.d]+=m.e-m.s)); (S.sc.existing||[]).forEach(m=>hrs[m.d]+=m.e-m.s);
  const mx=Math.max(2,Math.ceil(Math.max(...hrs)));
  $('#hours').innerHTML=vbars(hrs.map((v,d)=>({label:DAYS[d],value:v,color:'var(--s1)',text:v?String(+v.toFixed(1)):'',tip:`<b>${DAYS[d]}</b>${trow('Class hours',(+v.toFixed(1))+' h')}`})),{max:mx,yTicks:[0,Math.round(mx/2),mx],label:'Class hours per day'});
}
function renderDecisions(){
  const sc=S.sc, r=cur(); let list;
  if(S.view==='greedy'){ $('#decEy').textContent='Greedy, in processing order (highest priority first)'; list=r.log.map((l,i)=>({n:i+1,...l})); }
  else { $('#decEy').textContent= S.view==='bt' ? 'Backtracking, best feasible combination' : 'Alternative combination #'+S.altRank; const order={accepted:0,rejected:1,waitlist:2};
    list=S.E.courses.filter(c=>c.want).map(c=>({code:c.code,prio:c.prio,kind:r.status[c.code].kind,reason:r.status[c.code].reason})).sort((a,b)=>order[a.kind]-order[b.kind]||b.prio-a.prio).map((x,i)=>({n:i+1,...x})); }
  if(!list.length){ $('#dec').innerHTML='<li style="display:block"><div class="empty">No courses requested.</div></li>'; return; }
  $('#dec').innerHTML=list.map(l=>{ const p=PILL[l.kind]; return `<li><span class="n">${l.n}</span><div class="what"><b>${esc(l.code)}</b> <span class="mono" style="color:var(--muted);font-size:12px">priority ${l.prio}</span><span class="why">${esc(l.reason)}</span></div><span class="pill ${p[0]}">${p[1]}</span></li>`; }).join('');
}

