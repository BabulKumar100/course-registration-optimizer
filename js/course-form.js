/* ---------- add / remove course ---------- */
const dsel=['#ac-d1','#ac-d2']; dsel.forEach((id,k)=>{ $(id).innerHTML=(k?'<option value="-1">No second meeting</option>':'')+DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join(''); });
$('#ac-d2').value='-1'; $('#ac-d1').value='1';
function relayout(){ S.pos=circleLayout(S.sc.courses.map(c=>c.code)); buildRows(); recompute(); }
$('#addForm').addEventListener('submit',e=>{
  e.preventDefault(); const err=$('#ac-err'); const fail=m=>{ err.textContent=m; err.hidden=false; };
  const code=$('#ac-code').value.trim().toUpperCase().replace(/\s+/g,''), name=$('#ac-name').value.trim()||code;
  const cr=+$('#ac-cr').value, seats=Math.max(0,parseInt($('#ac-seats').value||'0',10)||0);
  const pre=$('#ac-pre').value.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
  if(S.sc.courses.length>=8) return fail('Eight courses is the limit, so every course keeps its own colour. Remove one first.');
  if(!/^[A-Z0-9-]{2,8}$/.test(code)) return fail('Use 2 to 8 letters, digits or dashes for the code, for example CS501.');
  if(S.sc.courses.some(c=>c.code===code)) return fail(code+' is already in the list.');
  if(!(cr>=1&&cr<=6)) return fail('Credits must be between 1 and 6.');
  const mt=[]; const d1=+$('#ac-d1').value, s1=+$('#ac-s1').value, e1=+$('#ac-e1').value;
  if(!(s1>=7&&e1<=20&&s1<e1)) return fail('First meeting: start must be before end, between 07:00 and 20:00.'); mt.push(M(d1,s1,e1));
  const d2=+$('#ac-d2').value; if(d2>=0){ const s2=+$('#ac-s2').value, e2=+$('#ac-e2').value; if(!(s2>=7&&e2<=20&&s2<e2)) return fail('Second meeting: start must be before end, between 07:00 and 20:00.'); if(meetingsOverlap(M(d1,s1,e1),M(d2,s2,e2))) return fail('The two meetings of one course overlap.'); mt.push(M(d2,s2,e2)); }
  err.hidden=true; pre.forEach(p=>{ if(!S.sc.pool.includes(p)&&!S.sc.courses.some(c=>c.code===p)) S.sc.pool.push(p); });
  S.sc.courses.push({code,name,cr,pre,seats,cap:Math.max(seats,20),prio:50,want:true,meetings:mt});
  S.pos=circleLayout(S.sc.courses.map(c=>c.code)); buildChips(); buildRows(); recompute(); toast(code+' added'); e.target.reset(); $('#ac-d2').value='-1'; $('#ac-d1').value='1';
});
$('#rows').addEventListener('click',e=>{ const b=e.target.closest('[data-rm]'); if(!b) return; if(S.sc.courses.length<=1) return; const gone=b.dataset.rm; S.sc.courses.splice(idx(gone),1); relayout(); toast(gone+' removed'); });

