/* ---------- analysis benchmark ---------- */
function runBench(trials){
  const ns=[4,6,8,10,12,14,16,18,20,22]; const out={ns,nodes:[],pow:[],gops:[],mean:[],worst:[],tG:[],tB:[],trials};
  for(const n of ns){
    let nodes=0,rs=0,rc=0,worst=1; const insts=[];
    for(let t=0;t<trials;t++){ const inst=randomInstance(n,mulberry32(1000*n+t+17)); insts.push(inst);
      const g=runGreedy(inst), b=runBacktracking(inst); nodes+=b.nodes; if(b.score>0){ const q=g.score/b.score; rs+=q; rc++; if(q<worst) worst=q; } }
    out.ns; out.nodes.push(nodes/trials); out.pow.push(Math.pow(2,n)); out.gops.push(n*Math.log2(n)+n*6);
    out.mean.push(rc?rs/rc:1); out.worst.push(worst);
    const reps=Math.max(5,Math.floor(400/ (n/4)));
    let t0=performance.now(); for(let q=0;q<reps;q++) for(let t=0;t<Math.min(trials,10);t++) runGreedy(insts[t]); const tg=(performance.now()-t0)/(reps*Math.min(trials,10));
    const reps2=Math.max(2,Math.floor(30/(n/4))); t0=performance.now(); for(let q=0;q<reps2;q++) for(let t=0;t<Math.min(trials,10);t++) runBacktracking(insts[t]); const tb=(performance.now()-t0)/(reps2*Math.min(trials,10));
    out.tG.push(Math.max(tg,0.0005)); out.tB.push(Math.max(tb,0.0005));
  }
  return out;
}
function renderAnalysis(){
  $('#bT').value=S.benchT; $('#bTo').textContent=S.benchT;
  if(!S.bench||S.bench.trials!==S.benchT) S.bench=runBench(S.benchT);
  const B=S.bench; const xs=B.ns; const fmtN=v=>v>=1e6?(v/1e6)+'M':v>=1e3?(v/1e3)+'k':String(v);
  const s1=[{name:'Worst case 2ⁿ',short:'2ⁿ',color:'var(--s2)',vals:B.pow,dash:'7 5'},{name:'Backtracking nodes (measured)',short:'Backtracking',color:'var(--s1)',vals:B.nodes},{name:'Greedy steps, R log R + Rk',short:'Greedy',color:'var(--s3)',vals:B.gops}];
  $('#lg1').innerHTML=legendHtml(s1);
  $('#ch1').innerHTML=lineChart({xs,series:s1,logY:true,yMin:10,yMax:1e7,yTicks:[10,100,1e3,1e4,1e5,1e6,1e7],yFmt:fmtN,xTitle:'Courses requested (n)',yTitle:'Operations',tipFmt:v=>Math.round(v).toLocaleString(),label:'Search effort growth'});
  $('#ch1t').innerHTML=dataTable(['n','2^n','Backtracking nodes','Greedy steps'],xs.map((n,i)=>[n,B.pow[i].toLocaleString(),Math.round(B.nodes[i]).toLocaleString(),Math.round(B.gops[i])]));
  const s2=[{name:'Average',short:'Average',color:'var(--s1)',vals:B.mean},{name:'Worst instance',short:'Worst',color:'var(--s2)',vals:B.worst,dash:'7 5'}];
  $('#lg2').innerHTML=legendHtml(s2);
  $('#ch2').innerHTML=lineChart({xs,series:s2,yMin:0.5,yMax:1,yTicks:[0.5,0.6,0.7,0.8,0.9,1],yFmt:v=>Math.round(v*100)+'%',xTitle:'Courses requested (n)',yTitle:'Greedy score ÷ optimal score',tipFmt:v=>(v*100).toFixed(1)+'%',label:'Greedy quality against optimum'});
  $('#ch2t').innerHTML=dataTable(['n','Average','Worst instance'],xs.map((n,i)=>[n,(B.mean[i]*100).toFixed(1)+'%',(B.worst[i]*100).toFixed(1)+'%']));
  const s3=[{name:'Backtracking',short:'Backtracking',color:'var(--s1)',vals:B.tB},{name:'Greedy',short:'Greedy',color:'var(--s3)',vals:B.tG}];
  $('#lg3').innerHTML=legendHtml(s3);
  $('#ch3').innerHTML=lineChart({xs,series:s3,logY:true,yMin:0.001,yMax:100,yTicks:[0.001,0.01,0.1,1,10,100],yFmt:v=>v>=1?v+' ms':v+'',xTitle:'Courses requested (n)',yTitle:'Milliseconds per run',W:1100,H:300,tipFmt:v=>v.toFixed(3)+' ms',label:'Running time'});
  $('#ch3t').innerHTML=dataTable(['n','Greedy (ms)','Backtracking (ms)'],xs.map((n,i)=>[n,B.tG[i].toFixed(4),B.tB[i].toFixed(4)]));
}

