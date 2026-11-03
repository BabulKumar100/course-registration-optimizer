/* ---------- React ports of the original chart helpers (css/charts.js) ---------- */

function RBar({ x, y, len, h, r = 4 }) {
  if (len <= 0) return null;
  if (len <= r * 2) return <rect x={x} y={y} width={len} height={h} rx={2} />;
  return <path d={`M${x},${y} h${len - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(len - r)} z`} />;
}

export function HBars({ items, w = 520, rowH = 34, labelW = 112, max, track = false, valW = 70, label = 'Bar chart' }) {
  const m = max || Math.max(1, ...items.map(i => i.value));
  const bw = w - labelW - valW; const h = items.length * rowH + 4;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {items.map((it, i) => {
        const cy = i * rowH + rowH / 2 + 2; const len = Math.max(0, it.value / m * bw);
        return (
          <g key={i} data-tip={it.tip || ''}>
            <rect x="0" y={cy - rowH / 2} width={w} height={rowH} fill="transparent" />
            <text x="0" y={cy + 4} className="axl">{it.label}</text>
            {track && <rect className="trkr" x={labelW} y={cy - 7} width={bw} height="14" rx="7" />}
            <g style={{ fill: it.color }}><RBar x={labelW} y={cy - 7} len={len} h={14} /></g>
            <text x={labelW + (track ? bw : len) + 8} y={cy + 4} className="val">{it.text}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function VBars({ items, W = 360, H = 190, max, yTicks, label = 'Bar chart' }) {
  const m = { l: 34, r: 8, t: 12, b: 30 }; const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const mx = max || Math.max(1, ...items.map(i => i.value));
  const ticks = yTicks || [0, Math.round(mx / 2), mx];
  const bw = Math.min(40, iw / items.length * 0.62);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t, i) => { const y = m.t + ih - t / mx * ih; return (
        <g key={i}><line className="grid" x1={m.l} x2={W - m.r} y1={y} y2={y} /><text className="ax" x={m.l - 6} y={y + 4} textAnchor="end">{t}</text></g>
      ); })}
      {items.map((it, i) => {
        const cx = m.l + (i + .5) * iw / items.length; const bh = it.value / mx * ih;
        const x = cx - bw / 2, y = m.t + ih - bh;
        return (
          <g key={i} data-tip={it.tip || ''}>
            <rect x={cx - iw / items.length / 2} y={m.t} width={iw / items.length} height={ih} fill="transparent" />
            {bh > 0 && <path style={{ fill: it.color }} d={`M${x},${m.t + ih} v${-(Math.max(bh - 4, 0))} a4,4 0 0 1 4,-4 h${bw - 8} a4,4 0 0 1 4,4 v${Math.max(bh - 4, 0)} z`} />}
            {it.text !== undefined && <text className="val" x={cx} y={y - 5} textAnchor="middle">{it.text}</text>}
            <text className="ax" x={cx} y={H - 10} textAnchor="middle">{it.label}</text>
          </g>
        );
      })}
      <line className="base" x1={m.l} x2={W - m.r} y1={m.t + ih} y2={m.t + ih} />
    </svg>
  );
}

export function LineChart({ xs, series, logY = false, yMin, yMax, yTicks, yFmt = v => v, xTitle = '', yTitle = '', W = 640, H = 310, tipFmt = v => v, label = 'Line chart' }) {
  const m = { l: 62, r: 104, t: 14, b: 50 }; const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const X = i => m.l + (xs.length > 1 ? i / (xs.length - 1) * iw : iw / 2);
  const Y = v => {
    if (logY) { const a = Math.log10(Math.max(v, yMin)), lo = Math.log10(yMin), hi = Math.log10(yMax); return m.t + ih - (a - lo) / (hi - lo) * ih; }
    return m.t + ih - (v - yMin) / (yMax - yMin) * ih;
  };
  const ends = series.map((se, i) => ({ i, y: Y(se.vals[se.vals.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
  const bw = iw / Math.max(1, xs.length - 1);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {yTicks.map((t, i) => { const y = Y(t); return <g key={i}><line className="grid" x1={m.l} x2={W - m.r} y1={y} y2={y} /><text className="ax" x={m.l - 8} y={y + 4} textAnchor="end">{yFmt(t)}</text></g>; })}
      {xs.map((x, i) => <text className="ax" key={i} x={X(i)} y={m.t + ih + 18} textAnchor="middle">{x}</text>)}
      <line className="base" x1={m.l} x2={W - m.r} y1={m.t + ih} y2={m.t + ih} />
      <text className="axl" x={m.l + iw / 2} y={H - 6} textAnchor="middle">{xTitle}</text>
      <text className="axl" transform={`translate(13 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle">{yTitle}</text>
      {series.map((se, i) => {
        const d = se.vals.map((v, j) => `${j ? 'L' : 'M'}${X(j).toFixed(1)},${Y(v).toFixed(1)}`).join('');
        return <path key={i} d={d} fill="none" style={{ stroke: se.color }} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={se.dash || undefined} />;
      })}
      {ends.map(e => {
        const se = series[e.i]; const lx = X(xs.length - 1); const ly = Y(se.vals[se.vals.length - 1]);
        return (
          <g key={e.i}>
            <circle cx={lx} cy={ly} r="4.5" style={{ stroke: se.color, fill: 'var(--surface)' }} strokeWidth="2.5" />
            <text className="val" x={lx + 11} y={e.y + 4}>{se.short || se.name}</text>
          </g>
        );
      })}
      {xs.map((x, i) => {
        const rows = series.map(se => `<div class="r"><span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${se.color};margin-right:6px"></span>${se.name}</span><span>${tipFmt(se.vals[i], se)}</span></div>`).join('');
        return (
          <g className="col" key={i} data-tip={`<b>${(xTitle.split(' ')[0] || '')} ${x}</b>${rows}`}>
            <rect className="hit" x={X(i) - bw / 2} y={m.t} width={bw} height={ih} />
            <line className="cross" x1={X(i)} x2={X(i)} y1={m.t} y2={m.t + ih} />
            {series.map((se, j) => <circle className="dot" key={j} cx={X(i)} cy={Y(se.vals[i])} r="4.5" style={{ fill: se.color, stroke: 'var(--surface)' }} strokeWidth="2" />)}
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({ series }) {
  return (
    <div className="legend">
      {series.map((se, i) => <span key={i}><i style={{ background: se.color }} />{se.name}</span>)}
    </div>
  );
}

export function DataTable({ heads, rows }) {
  return (
    <details className="tbl">
      <summary>View data table</summary>
      <div className="tscroll">
        <table>
          <thead><tr>{heads.map((h, i) => <th key={i} className={i ? 'num' : ''}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'num' : ''}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </details>
  );
}
