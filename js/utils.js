/* ================= UI ================= */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const M = (d,s,e)=>({d,s,e});
const hueVar = i => `var(--s${i%8+1})`;
const onVar = i => `var(--on${i%8+1})`;

