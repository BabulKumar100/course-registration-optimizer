/* ---------- copy plan ---------- */
function planText(){
  const r=cur(), sc=S.sc; const L=[`Course Registration Optimizer: ${S.view==='greedy'?'Greedy':'Backtracking'} plan`,`Credits: ${r.credits} / ${sc.maxCr}${sc.minCr?` (minimum ${sc.minCr})`:''}   Priority score: ${r.score}`,'','Accepted:'];
  r.taken.forEach(c=>L.push(`  ${c.code} ${c.name} (${c.cr} cr) ${c.meetings.map(fmtM).join(', ')}`)); if(!r.taken.length) L.push('  none');
  L.push('','Not accepted:'); const rest=sc.courses.filter(c=>c.want&&r.status[c.code].kind!=='accepted'); rest.forEach(c=>L.push(`  ${c.code}: ${r.status[c.code].reason}`)); if(!rest.length) L.push('  none');
  return L.join('\n');
}
$('#copyBtn').addEventListener('click',()=>{
  const txt=planText(), btn=$('#copyBtn'), box=$('#copyBox');
  const done=()=>{ btn.textContent='Copied'; box.hidden=true; toast('Plan copied to clipboard'); setTimeout(()=>btn.textContent='Copy plan',1600); };
  const fallback=()=>{ box.hidden=false; box.innerHTML='<textarea id="copyTa" readonly aria-label="Plan text"></textarea>'; const ta=$('#copyTa'); ta.value=txt; ta.focus(); ta.select(); };
  try{ navigator.clipboard.writeText(txt).then(done,fallback); }catch(err){ fallback(); }
});

