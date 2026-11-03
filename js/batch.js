/* ---------- batch simulation ---------- */
function simulate(){
  const {n,k,cap,seed}=S.sim; const rnd=mulberry32(seed); const base=SCEN.default().courses; const C=base.length;
  const capacity=base.map(c=>Math.max(1,Math.round(cap*c.cap/50)));
  const conf=base.map(a=>base.map(b=>a!==b&&!!firstClash(a.meetings,b.meetings)));
  const defs=[], reqs0=[]; let ord=0;
  for(let s=0;s<n;s++){
    const done=new Set(); if(rnd()<.9)done.add('CS101'); if(rnd()<.9)done.add('MA101'); if(rnd()<.6)done.add('MA201'); if(done.has('CS101')&&rnd()<.4)done.add('CS201');
    defs.push({done,limit:12+2*Math.floor(rnd()*4)});
    const pick=new Set(); while(pick.size<Math.min(k,C)) pick.add(Math.floor(rnd()*C));
    pick.forEach(ci=>reqs0.push({s,ci,prio:20+Math.floor(rnd()*81),o:ord++}));
  }
  function allocate(policy){
    const t0=performance.now(); const seats=capacity.slice(); const students=defs.map(d=>({done:d.done,limit:d.limit,credits:0,taken:[]}));
    const reqs=reqs0.map(r=>({...r}));
    if(policy==='round'){ const by={}; reqs.forEach(r=>(by[r.s]=by[r.s]||[]).push(r)); Object.values(by).forEach(a=>{ a.sort((x,y)=>y.prio-x.prio||x.o-y.o); a.forEach((r,i)=>r.round=i); }); reqs.sort((a,b)=>a.round-b.round||b.prio-a.prio||a.o-b.o); }
    else reqs.sort((a,b)=>b.prio-a.prio||a.o-b.o);
    const out={accepted:0,waitlist:0,prereq:0,credit:0,conflict:0}; const enrolled=new Array(C).fill(0), wl=new Array(C).fill(0); let prioSum=0;
    for(const r of reqs){ const st=students[r.s], c=base[r.ci];
      if(!c.pre.every(p=>st.done.has(p))){out.prereq++;continue;}
      if(st.credits+c.cr>st.limit){out.credit++;continue;}
      if(st.taken.some(t=>conf[r.ci][t])){out.conflict++;continue;}
      if(seats[r.ci]<=0){out.waitlist++;wl[r.ci]++;continue;}
      out.accepted++; prioSum+=r.prio; st.credits+=c.cr; st.taken.push(r.ci); seats[r.ci]--; enrolled[r.ci]++; }
    const cr=students.map(s=>s.credits).sort((a,b)=>a-b); const q=Math.max(1,Math.ceil(n/4));
    return {out,enrolled,wl,students,ms:performance.now()-t0,
      m:{zero:cr.filter(x=>x===0).length,low:cr.slice(0,q).reduce((s,x)=>s+x,0)/q,prio:prioSum}};
  }
  const A=allocate('priority'), R=allocate('round');
  const bins=[[0,0],[1,3],[4,6],[7,9],[10,12],[13,15],[16,18]].map(([a,b])=>({a,b,n:0}));
  let sumCr=0; A.students.forEach(st=>{ sumCr+=st.credits; const b=bins.find(x=>st.credits>=x.a&&st.credits<=x.b); if(b) b.n++; });
  return {n,total:reqs0.length,out:A.out,enrolled:A.enrolled,capacity,wl:A.wl,bins,avg:sumCr/n,ms:A.ms,base,fair:{pri:A.m,rr:R.m}};
}
function renderBatch(){
  $('#simN').value=S.sim.n; $('#simK').value=S.sim.k; $('#simC').value=S.sim.cap;
  $('#simNo').textContent=S.sim.n; $('#simKo').textContent=S.sim.k; $('#simCo').textContent=S.sim.cap;
  const r=simulate(); const pc=v=>(v/r.total*100).toFixed(1)+'%';
  $('#simKpi').innerHTML=[[r.total.toLocaleString(),'Requests processed'],[pc(r.out.accepted),'Accepted'],[r.avg.toFixed(1),'Average credits per student'],[r.ms.toFixed(1)+' ms','Time to allocate everyone']].map(x=>`<div class="kpi"><div class="v">${x[0]}</div><div class="l">${x[1]}</div></div>`).join('');
  const O=[['✓ Accepted',r.out.accepted,'var(--good)'],['… Waitlisted, section full',r.out.waitlist,'var(--warn)'],['✕ Prerequisite not met',r.out.prereq,'var(--bad)'],['✕ Credit limit',r.out.credit,'var(--bad)'],['✕ Timetable conflict',r.out.conflict,'var(--bad)']];
  const omax=Math.max(1,...O.map(o=>o[1]));
  $('#simOut').innerHTML=hbars(O.map(o=>({label:o[0],value:o[1],color:o[2],text:o[1].toLocaleString(),tip:`<b>${esc(o[0])}</b>${trow('Requests',o[1].toLocaleString())}${trow('Share',pc(o[1]))}`})),{w:520,rowH:36,labelW:178,valW:58,max:omax,label:'Request outcomes'});
  $('#simOutT').innerHTML=dataTable(['Outcome','Requests','Share'],O.map(o=>[o[0],o[1],pc(o[1])]));
  const seatItems=r.base.map((c,i)=>({label:c.code,value:r.enrolled[i],color:hueVar(i),text:`${r.enrolled[i]} / ${r.capacity[i]}`,tip:`<b>${c.code}</b> ${esc(c.name)}${trow('Enrolled',r.enrolled[i])}${trow('Capacity',r.capacity[i])}${trow('Waitlisted',r.wl[i])}`}));
  $('#simSeat').innerHTML=hbars(seatItems.map(x=>({...x})),{w:520,rowH:32,labelW:62,valW:78,max:Math.max(1,...r.capacity),track:false,label:'Seats filled per section'}).replace(/<\/svg>$/,'</svg>');
  $('#simSeatT').innerHTML=dataTable(['Section','Enrolled','Capacity','Waitlisted'],r.base.map((c,i)=>[c.code,r.enrolled[i],r.capacity[i],r.wl[i]]));
  $('#simHist').innerHTML=vbars(r.bins.map(b=>({label:b.a===b.b?String(b.a):`${b.a}–${b.b}`,value:b.n,color:'var(--s1)',text:b.n?String(b.n):'',tip:`<b>${b.a===b.b?b.a:b.a+'–'+b.b} credits</b>${trow('Students',b.n)}${trow('Share',(b.n/r.n*100).toFixed(1)+'%')}`})),{W:1100,H:230,max:Math.max(1,...r.bins.map(b=>b.n)),yTicks:(m=>[0,Math.round(m/2),m])(Math.max(1,...r.bins.map(b=>b.n))),label:'Students by credits registered'});
  $('#simHistT').innerHTML=dataTable(['Credits','Students'],r.bins.map(b=>[b.a===b.b?b.a:b.a+'–'+b.b,b.n]));
  const f=r.fair; const FL=[{name:'Priority order',color:'var(--s2)'},{name:'Round robin',color:'var(--s1)'}];
  $('#fairLg').innerHTML=FL.map(x=>`<span><i class="sq" style="background:${x.color}"></i>${x.name}</span>`).join('');
  const MET=[['zero','Students with no course',v=>String(v)],['low','Credits, lowest quarter (average)',v=>v.toFixed(1)],['prio','Total priority satisfied',v=>v.toLocaleString()]];
  $('#simFair').innerHTML=MET.map(([key,title,fmt])=>{ const mx=Math.max(1,f.pri[key],f.rr[key]);
    return `<div><div class="lbl">${title}</div>${hbars([{label:'Priority',value:f.pri[key],color:FL[0].color,text:fmt(f.pri[key]),tip:`<b>${title}</b>${trow('Priority order',fmt(f.pri[key]))}${trow('Round robin',fmt(f.rr[key]))}`},{label:'Round robin',value:f.rr[key],color:FL[1].color,text:fmt(f.rr[key]),tip:`<b>${title}</b>${trow('Priority order',fmt(f.pri[key]))}${trow('Round robin',fmt(f.rr[key]))}`}],{w:330,rowH:34,labelW:92,valW:60,max:mx,label:title})}</div>`; }).join('');
  const dz=f.pri.zero-f.rr.zero, dp=f.pri.prio-f.rr.prio;
  $('#fairMsg').innerHTML=`Round robin leaves <b>${Math.abs(dz)}</b> ${dz>=0?'fewer':'more'} students with no course and ${dp>=0?'gives up':'gains'} <b>${Math.abs(dp).toLocaleString()}</b> points of total priority. Fairness costs a little of what priority order maximises.`;
  $('#simFairT').innerHTML=dataTable(['Metric','Priority order','Round robin'],MET.map(([key,title,fmt])=>[title,fmt(f.pri[key]),fmt(f.rr[key])]));
}

