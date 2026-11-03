/* ---------- tooltip ---------- */
const tip = $('#tip');
function showTip(el,e){ tip.innerHTML = el.getAttribute('data-tip'); tip.hidden=false; moveTip(e); }
function moveTip(e){
  const r = tip.getBoundingClientRect(); let x=e.clientX+14, y=e.clientY+14;
  if(x+r.width>innerWidth-8) x=e.clientX-r.width-14; if(y+r.height>innerHeight-8) y=e.clientY-r.height-14;
  tip.style.left=Math.max(8,x)+'px'; tip.style.top=Math.max(8,y)+'px';
}
document.addEventListener('pointermove',e=>{ const t=e.target.closest&&e.target.closest('[data-tip]'); if(t){ if(tip.hidden||tip._el!==t){tip._el=t;showTip(t,e);} else moveTip(e);} else {tip.hidden=true;tip._el=null;} });
document.addEventListener('pointerdown',e=>{ const t=e.target.closest&&e.target.closest('[data-tip]'); if(t){tip._el=t;showTip(t,e);} });
document.addEventListener('scroll',()=>{tip.hidden=true;},true);

