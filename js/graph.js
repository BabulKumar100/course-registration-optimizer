/* ---------- conflict graph ---------- */
function renderGraph(){
  const sc=S.sc, r=cur(); const {adj,edges}=buildConflictGraph(sc.courses); const svg=$('#gsvg');
  const stat=c=>r.status[c.code].kind;
  const conflictHot=(e)=>{ const A=r.status[e.a],B=r.status[e.b]; return (A.kind==='accepted'&&B.kind==='rejected'&&/conflict/i.test(B.reason))||(B.kind==='accepted'&&A.kind==='rejected'&&/conflict/i.test(A.reason)); };
  let s='<g id="gedges">';
  edges.forEach((e,i)=>{ const pa=S.pos[e.a],pb=S.pos[e.b]; s+=`<g data-ea="${e.a}" data-eb="${e.b}"><line class="gedge ${conflictHot(e)?'hot':''}" x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}"/><line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="transparent" stroke-width="16" data-tip="${esc(`<b>${e.a} and ${e.b}</b>${trow('Clash',fmtM(e.slot))}`)}"/></g>`; });
  s+='</g><g id="gnodes">';
  const GL={accepted:['✓','var(--good)'],waitlist:['…','var(--warn)'],rejected:['✕','var(--bad)'],idle:['–','var(--muted)']};
  sc.courses.forEach((c,i)=>{ const p=S.pos[c.code]; const k=stat(c); const gl=GL[k];
    const short=c.name.length>16?c.name.slice(0,15)+'…':c.name;
    s+=`<g class="gnode ${k==='idle'?'idle':''}" data-code="${c.code}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(c.code+' '+c.name+', '+PILL[k][1].replace(/^[^A-Za-z]+/,'')+'. Press to '+(c.want?'drop':'request'))}" data-tip="${esc(`<b>${c.code}</b> ${esc(c.name)}${trow('Status',PILL[k][1])}${trow('Credits',c.cr)}${trow('Priority',S.E.courses[i].prio)}${trow('Conflicts',adj[c.code].length?adj[c.code].join(', '):'none')}<div style='margin-top:4px;opacity:.85'>${esc(r.status[c.code].reason)}</div>`)}">
      <circle class="main" r="29" style="fill:${hueVar(i)}" stroke="var(--halo)" stroke-width="3"/>
      <text class="cd" text-anchor="middle" y="4" style="fill:${onVar(i)}">${esc(c.code.length>6?c.code.replace('-',''):c.code)}</text>
      <text class="nm" text-anchor="middle" y="48">${esc(short)}</text>
      <circle cx="21" cy="-21" r="10" style="fill:${gl[1]}" stroke="var(--halo)" stroke-width="2"/>
      <text x="21" y="-17" text-anchor="middle" style="font:700 12px var(--font-body);fill:${k==='waitlist'?'#0b0b0b':'#fff'};pointer-events:none">${gl[0]}</text></g>`; });
  svg.innerHTML=s+'</g>';
  $('#glegend').innerHTML=[['var(--good)','✓ Accepted'],['var(--warn)','… Waitlisted'],['var(--bad)','✕ Rejected'],['var(--muted)','– Not requested']].map(x=>`<span><i class="sq" style="background:${x[0]}"></i>${x[1]}</span>`).join('')+'<span><i style="background:var(--bad)"></i>Clash that cost a course its slot</span>';
  /* facts */
  const n=sc.courses.length, E=edges.length, dens=n>1?E/(n*(n-1)/2):0; const acc=new Set(r.taken.map(c=>c.code));
  const bad=edges.filter(e=>acc.has(e.a)&&acc.has(e.b)).length; const maxDeg=Math.max(0,...Object.values(adj).map(a=>a.length));
  $('#gstats').innerHTML=[['Courses (nodes)',n],['Time conflicts (edges)',E],['Density',(dens*100).toFixed(0)+'%'],['Highest degree',maxDeg],['Accepted courses',acc.size],
    ['Edges between accepted',bad+(bad===0?'  ✓ independent set':'  ✕')]].map(x=>`<div class="stat"><span>${x[0]}</span><span>${x[1]}</span></div>`).join('')+
    `<p class="sub" style="margin-top:10px">A valid schedule is an independent set of this graph: no edge joins two accepted courses.</p>`;
  $('#adj').innerHTML=sc.courses.map(c=>`<b>${esc(c.code)}</b> → [${adj[c.code].map(esc).join(', ')}]`).join('\n');
  wireGraph(adj);
}
function wireGraph(adj){
  const svg=$('#gsvg'); let drag=null;
  const hl=code=>{ $$('#gnodes .gnode').forEach(n=>n.classList.toggle('dim',!!code&&n.dataset.code!==code&&!adj[code].includes(n.dataset.code)));
    $$('#gedges > g').forEach(g=>g.firstElementChild.classList.toggle('dim',!!code&&g.dataset.ea!==code&&g.dataset.eb!==code)); };
  const toSvg=e=>{ const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const placeEdges=code=>{ $$('#gedges > g').forEach(g=>{ if(g.dataset.ea===code||g.dataset.eb===code){ const a=S.pos[g.dataset.ea],b=S.pos[g.dataset.eb]; $$('line',g).forEach(l=>{l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);}); } }); };
  $$('#gnodes .gnode').forEach(nd=>{
    const code=nd.dataset.code;
    nd.addEventListener('pointerenter',()=>hl(code)); nd.addEventListener('pointerleave',()=>{ if(!drag) hl(null); });
    nd.addEventListener('focus',()=>hl(code)); nd.addEventListener('blur',()=>hl(null));
    nd.addEventListener('pointerdown',e=>{ nd.setPointerCapture(e.pointerId); const p=toSvg(e); drag={code,ox:p.x-S.pos[code].x,oy:p.y-S.pos[code].y,sx:e.clientX,sy:e.clientY,moved:false}; });
    nd.addEventListener('pointermove',e=>{ if(!drag||drag.code!==code) return; if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>4) drag.moved=true; if(!drag.moved) return;
      const p=toSvg(e); S.pos[code]={x:Math.max(40,Math.min(680,p.x-drag.ox)),y:Math.max(40,Math.min(450,p.y-drag.oy))}; nd.setAttribute('transform',`translate(${S.pos[code].x} ${S.pos[code].y})`); placeEdges(code); tip.hidden=true; });
    nd.addEventListener('pointerup',e=>{ if(drag&&drag.code===code){ const moved=drag.moved; drag=null; hl(null); if(!moved) toggleWant(code); } });
    nd.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleWant(code); } });
  });
}
function toggleWant(code){ const c=S.sc.courses[idx(code)]; c.want=!c.want; const cb=$('#want-'+code); if(cb) cb.checked=c.want; recompute(); }

