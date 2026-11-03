/* ================= ENGINE (pure functions) ================= */
const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
const fmtT = h => { const hh = Math.floor(h), mm = Math.round((h-hh)*60); return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'); };
const fmtM = m => `${DAYS[m.d]} ${fmtT(m.s)}–${fmtT(m.e)}`;

/* half-open interval overlap: A.start < B.end AND B.start < A.end */
function meetingsOverlap(a,b){ return a.d===b.d && a.s<b.e && b.s<a.e; }
function firstClash(ma, mb){ for(const x of ma) for(const y of mb) if(meetingsOverlap(x,y)) return [x,y]; return null; }

/* adjacency list conflict graph: nodes = offerings, edges = time overlap */
function buildConflictGraph(courses){
  const adj = {}; const edges = [];
  courses.forEach(c => adj[c.code] = []);
  for(let i=0;i<courses.length;i++) for(let j=i+1;j<courses.length;j++){
    const hit = firstClash(courses[i].meetings, courses[j].meetings);
    if(hit){ adj[courses[i].code].push(courses[j].code); adj[courses[j].code].push(courses[i].code);
      edges.push({a:courses[i].code,b:courses[j].code,slot:hit[0]}); }
  }
  return {adj, edges};
}
const prereqsMet = (c, done) => c.pre.every(p => done.includes(p));

/* GREEDY-REGISTER: sort by priority desc (stable), accept first feasible */
function runGreedy(sc){
  const t0 = performance.now();
  const byCode = Object.fromEntries(sc.courses.map(c=>[c.code,c]));
  const reqs = sc.courses.filter(c=>c.want).map((c,i)=>({c,i}));
  reqs.sort((x,y)=> (y.c.prio - x.c.prio) || (x.i - y.i));
  let credits = sc.startCredits||0;
  const taken = []; // accepted courses
  const seats = {}; sc.courses.forEach(c=>seats[c.code]=c.seats);
  const log = []; const status = {};
  const existing = sc.existing||[];
  for(const {c} of reqs){
    let reason=null, kind=null;
    if(!prereqsMet(c, sc.done)){ kind='rejected'; reason='Prerequisite not met: needs '+c.pre.filter(p=>!sc.done.includes(p)).join(', '); }
    else if(credits + c.cr > sc.maxCr){ kind='rejected'; reason=`Credit limit exceeded (${credits} + ${c.cr} > ${sc.maxCr})`; }
    else {
      let clash=null, withWhom=null;
      for(const t of taken){ const h=firstClash(t.meetings,c.meetings); if(h){clash=h; withWhom=t.code; break;} }
      if(!clash) for(const e of existing){ const h=firstClash([e],c.meetings); if(h){clash=h; withWhom=e.label||'existing class'; break;} }
      if(clash){ kind='rejected'; reason=`Timetable conflict with ${withWhom} (${fmtM(clash[0])} overlaps ${fmtM(clash[1])})`; }
      else if(seats[c.code]<=0){ if(sc.waitlist){kind='waitlist'; reason='Section full, placed on waitlist';} else {kind='rejected'; reason='Section full';} }
    }
    if(!kind){ kind='accepted'; reason='All constraints satisfied'; credits+=c.cr; taken.push(c); seats[c.code]--; }
    status[c.code]={kind,reason}; log.push({code:c.code,name:c.name,prio:c.prio,kind,reason,credits});
  }
  sc.courses.forEach(c=>{ if(!status[c.code]) status[c.code]={kind:'idle',reason:'Not requested'}; });
  const score = taken.reduce((s,c)=>s+c.prio,0);
  return {algo:'greedy',taken,status,log,credits,score,ops:reqs.length,nodes:reqs.length,pruned:0,ms:performance.now()-t0};
}

/* Exact search: backtracking with branch-and-bound pruning.
   objective: 'score' (sum of priority) or 'credits'. */
function runBacktracking(sc, objective='score', wantTrace=false){
  const t0 = performance.now();
  const existing = sc.existing||[];
  const wanted = sc.courses.filter(c=>c.want);
  const status = {}; sc.courses.forEach(c=>status[c.code]={kind:'idle',reason:'Not requested'});
  const cand = [];
  for(const c of wanted){
    if(!prereqsMet(c,sc.done)){ status[c.code]={kind:'rejected',reason:'Prerequisite not met: needs '+c.pre.filter(p=>!sc.done.includes(p)).join(', ')}; continue; }
    if(existing.some(e=>firstClash([e],c.meetings))){ status[c.code]={kind:'rejected',reason:'Timetable conflict with an existing class'}; continue; }
    if(c.seats<=0){ status[c.code]= sc.waitlist?{kind:'waitlist',reason:'Section full, placed on waitlist'}:{kind:'rejected',reason:'Section full'}; continue; }
    cand.push(c);
  }
  const val = c => objective==='credits' ? c.cr : c.prio;
  cand.sort((a,b)=>val(b)-val(a));
  const n = cand.length;
  const conf = cand.map(a=>cand.map(b=>a!==b && !!firstClash(a.meetings,b.meetings)));
  const sufVal = new Array(n+1).fill(0), sufCr = new Array(n+1).fill(0);
  for(let i=n-1;i>=0;i--){ sufVal[i]=sufVal[i+1]+val(cand[i]); sufCr[i]=sufCr[i+1]+cand[i].cr; }
  const base = sc.startCredits||0;
  const trace=[];
  function search(minCr){
    let best=null, bestVal=-1, nodes=0, pruned=0; const cur=[]; trace.length=0;
    const ev=(kind,i,x)=>{ if(!wantTrace||trace.length>=800) return; trace.push(Object.assign({kind,i,code:cand[i]?cand[i].code:null,cur:cur.map(j=>cand[j].code),best:bestVal},x||{})); };
    (function rec(i,credits,v){
      nodes++;
      if(i===n){ const imp = credits>=minCr && v>bestVal; if(imp){bestVal=v; best=cur.slice();} ev('leaf',i,{improved:imp,v,credits,best:bestVal}); return; }
      if(credits+sufCr[i] < minCr){ pruned++; ev('prune-min',i,{v,credits}); return; }          // cannot reach min credits
      if(best && v+sufVal[i] <= bestVal){ pruned++; ev('prune-bound',i,{v,credits,reach:v+sufVal[i]}); return; }     // bound: cannot beat best
      const c=cand[i];
      let ok = credits + c.cr <= sc.maxCr, why=ok?null:'credit limit';
      if(ok) for(const j of cur) if(conf[i][j]){ok=false;why='clash with '+cand[j].code;break;}
      if(ok){ cur.push(i); ev('include',i,{v:v+val(c),credits:credits+c.cr}); rec(i+1,credits+c.cr,v+val(c)); cur.pop(); ev('backtrack',i,{v,credits}); }  // include
      else ev('blocked',i,{v,credits,why});
      ev('exclude',i,{v,credits});
      rec(i+1,credits,v);                                                 // exclude (backtrack)
    })(0,base,0);
    return {best,bestVal,nodes,pruned};
  }
  let r = search(sc.minCr||0), minMet = true;
  if(!r.best){ r = search(0); minMet = false; }
  const chosen = (r.best||[]).map(i=>cand[i]);
  const chosenSet = new Set(chosen.map(c=>c.code));
  const taken = sc.courses.filter(c=>chosenSet.has(c.code));
  for(const c of cand){
    if(chosenSet.has(c.code)) status[c.code]={kind:'accepted',reason:'Part of the best feasible combination'};
    else {
      const clashWith = taken.find(t=>firstClash(t.meetings,c.meetings));
      status[c.code]={kind:'rejected',reason: clashWith?`Left out: conflicts with ${clashWith.code}, a better combination uses that slot`:'Left out: lower total value than the chosen combination (credit limit)'};
    }
  }
  const credits = base + taken.reduce((s,c)=>s+c.cr,0);
  const score = taken.reduce((s,c)=>s+c.prio,0);
  return {algo:'backtracking',taken,status,log:[],credits,score,nodes:r.nodes,pruned:r.pruned,minMet,n,ms:performance.now()-t0,objective,trace,candCodes:cand.map(c=>c.code)};
}

/* seeded PRNG */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* random instance for benchmarks */
function randomInstance(n, rnd, density=1){
  const courses=[];
  for(let i=0;i<n;i++){
    const m=[]; const k=2;
    for(let q=0;q<k;q++){ const d=Math.floor(rnd()*5); const s=8+Math.floor(rnd()*9/density*1); m.push({d,s,e:s+1}); }
    courses.push({code:'C'+i,name:'C'+i,cr:2+Math.floor(rnd()*3),pre:[],seats:5,cap:5,prio:20+Math.floor(rnd()*80),want:true,meetings:m});
  }
  return {courses,done:[],minCr:0,maxCr:Math.round(n*3*0.5),startCredits:0,waitlist:true,existing:[]};
}

/* every valid combination, ranked (exhaustive; fine for the small n a student really chooses from) */
function topCombos(sc, objective='score', K=5){
  const existing=sc.existing||[];
  const cs=sc.courses.filter(c=>c.want && prereqsMet(c,sc.done) && c.seats>0 && !existing.some(e=>firstClash([e],c.meetings))).slice(0,14);
  const n=cs.length; const conf=cs.map(a=>cs.map(b=>a!==b&&!!firstClash(a.meetings,b.meetings)));
  const base=sc.startCredits||0, out=[]; let total=0;
  for(let m=1;m<(1<<n);m++){
    let cr=base,score=0,val=0,ok=true; const idxs=[];
    for(let i=0;i<n&&ok;i++) if((m>>i)&1){ for(const j of idxs) if(conf[i][j]){ok=false;break;} if(!ok)break; idxs.push(i); cr+=cs[i].cr; score+=cs[i].prio; val+= objective==='credits'?cs[i].cr:cs[i].prio; }
    if(!ok||cr>sc.maxCr||cr<(sc.minCr||0)) continue;
    total++; out.push({codes:idxs.map(i=>cs[i].code),credits:cr,score,val});
  }
  out.sort((a,b)=>b.val-a.val||b.score-a.score||b.credits-a.credits);
  return {list:out.slice(0,K),total};
}
