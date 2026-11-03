/* ---------- chart helpers ---------- */
const trow = (k,v,c)=>`<div class="r"><span>${c?`<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${c};margin-right:6px"></span>`:''}${esc(k)}</span><span>${esc(v)}</span></div>`;
function rbar(x,y,len,h,r=4){ if(len<=0) return ''; if(len<=r*2) return `<rect x="${x}" y="${y}" width="${len}" height="${h}" rx="2"/>`;
  return `<path d="M${x},${y} h${len-r} a${r},${r} 0 0 1 ${r},${r} v${h-2*r} a${r},${r} 0 0 1 ${-r},${r} h${-(len-r)} z"/>`; }
function hbars(items,{w=520,rowH=34,labelW=112,max,track=false,valW=70,label='Bar chart'}={}){
  const m = max || Math.max(1,...items.map(i=>i.value)); const bw=w-labelW-valW; const h=items.length*rowH+4;
  let s=`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">`;
  items.forEach((it,i)=>{ const cy=i*rowH+rowH/2+2; const len=Math.max(0,it.value/m*bw);
    s+=`<g data-tip="${esc(it.tip||'')}"><rect x="0" y="${cy-rowH/2}" width="${w}" height="${rowH}" fill="transparent"/>`;
    s+=`<text x="0" y="${cy+4}" class="axl">${esc(it.label)}</text>`;
    if(track) s+=`<rect class="trkr" x="${labelW}" y="${cy-7}" width="${bw}" height="14" rx="7"/>`;
    s+=`<g style="fill:${it.color}">${rbar(labelW,cy-7,len,14)}</g>`;
    s+=`<text x="${labelW+(track?bw:len)+8}" y="${cy+4}" class="val">${esc(it.text)}</text></g>`;
  });
  return s+'</svg>';
}
function vbars(items,{W=360,H=190,max,yTicks,label='Bar chart'}={}){
  const m={l:34,r:8,t:12,b:30}, iw=W-m.l-m.r, ih=H-m.t-m.b; const mx=max||Math.max(1,...items.map(i=>i.value));
  const ticks = yTicks || [0,Math.round(mx/2),mx]; const bw=Math.min(40,iw/items.length*0.62);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
  ticks.forEach(t=>{ const y=m.t+ih-t/mx*ih; s+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/><text class="ax" x="${m.l-6}" y="${y+4}" text-anchor="end">${t}</text>`; });
  items.forEach((it,i)=>{ const cx=m.l+(i+.5)*iw/items.length; const bh=it.value/mx*ih; const x=cx-bw/2, y=m.t+ih-bh;
    s+=`<g data-tip="${esc(it.tip||'')}"><rect x="${cx-iw/items.length/2}" y="${m.t}" width="${iw/items.length}" height="${ih}" fill="transparent"/>`;
    if(bh>0) s+=`<path style="fill:${it.color}" d="M${x},${m.t+ih} v${-(Math.max(bh-4,0))} a4,4 0 0 1 4,-4 h${bw-8} a4,4 0 0 1 4,4 v${Math.max(bh-4,0)} z"/>`;
    if(it.text!==undefined) s+=`<text class="val" x="${cx}" y="${y-5}" text-anchor="middle">${esc(it.text)}</text>`;
    s+=`<text class="ax" x="${cx}" y="${H-10}" text-anchor="middle">${esc(it.label)}</text></g>`; });
  s+=`<line class="base" x1="${m.l}" x2="${W-m.r}" y1="${m.t+ih}" y2="${m.t+ih}"/>`;
  return s+'</svg>';
}
function lineChart({xs,series,logY=false,yMin,yMax,yTicks,yFmt=v=>v,xTitle='',yTitle='',W=640,H=310,tipFmt=v=>v,label='Line chart'}){
  const m={l:62,r:104,t:14,b:50}, iw=W-m.l-m.r, ih=H-m.t-m.b;
  const X=i=>m.l+(xs.length>1?i/(xs.length-1)*iw:iw/2);
  const Y=v=>{ if(logY){ const a=Math.log10(Math.max(v,yMin)),lo=Math.log10(yMin),hi=Math.log10(yMax); return m.t+ih-(a-lo)/(hi-lo)*ih; } return m.t+ih-(v-yMin)/(yMax-yMin)*ih; };
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
  yTicks.forEach(t=>{ const y=Y(t); s+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/><text class="ax" x="${m.l-8}" y="${y+4}" text-anchor="end">${esc(yFmt(t))}</text>`; });
  xs.forEach((x,i)=>{ s+=`<text class="ax" x="${X(i)}" y="${m.t+ih+18}" text-anchor="middle">${x}</text>`; });
  s+=`<line class="base" x1="${m.l}" x2="${W-m.r}" y1="${m.t+ih}" y2="${m.t+ih}"/>`;
  s+=`<text class="axl" x="${m.l+iw/2}" y="${H-6}" text-anchor="middle">${esc(xTitle)}</text>`;
  s+=`<text class="axl" transform="translate(13 ${m.t+ih/2}) rotate(-90)" text-anchor="middle">${esc(yTitle)}</text>`;
  series.forEach(se=>{ const d=se.vals.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
    s+=`<path d="${d}" fill="none" style="stroke:${se.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${se.dash?`stroke-dasharray="${se.dash}"`:''}/>`; });
  /* end labels, nudged apart */
  const ends=series.map((se,i)=>({i,y:Y(se.vals[se.vals.length-1])})).sort((a,b)=>a.y-b.y);
  for(let k=1;k<ends.length;k++) if(ends[k].y-ends[k-1].y<15) ends[k].y=ends[k-1].y+15;
  ends.forEach(e=>{ const se=series[e.i]; const lx=X(xs.length-1); const ly=Y(se.vals[se.vals.length-1]);
    s+=`<circle cx="${lx}" cy="${ly}" r="4.5" style="stroke:${se.color};fill:var(--bg)" stroke-width="2.5"/><text class="val" x="${lx+11}" y="${e.y+4}" style="fill:${se.color==='var(--s2)'?'var(--ink)':'var(--ink)'}">${esc(se.short||se.name)}</text>`; });
  const bw=iw/Math.max(1,xs.length-1);
  xs.forEach((x,i)=>{ const rows=series.map(se=>trow(se.name,tipFmt(se.vals[i],se),se.color)).join('');
    s+=`<g class="col" data-tip="${esc(`<b>${esc(xTitle.split(' ')[0]||'')} ${x}</b>${rows}`)}"><rect class="hit" x="${X(i)-bw/2}" y="${m.t}" width="${bw}" height="${ih}"/><line class="cross" x1="${X(i)}" x2="${X(i)}" y1="${m.t}" y2="${m.t+ih}"/>`;
    series.forEach(se=>{ s+=`<circle class="dot" cx="${X(i)}" cy="${Y(se.vals[i])}" r="4.5" style="fill:${se.color};stroke:var(--bg)" stroke-width="2"/>`; });
    s+='</g>'; });
  return s+'</svg>';
}
const legendHtml = series => series.map(se=>`<span><i style="background:${se.color}"></i>${esc(se.name)}</span>`).join('');
function dataTable(heads,rows){ return `<details class="tbl"><summary>View data table</summary><div class="tscroll"><table><thead><tr>${heads.map((h,i)=>`<th class="${i?'num':''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i?'num':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`; }

