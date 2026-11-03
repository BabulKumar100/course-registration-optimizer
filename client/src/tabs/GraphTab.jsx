import { useMemo, useRef, useState } from 'react';
import { buildConflictGraph, fmtM } from '../lib/engine.js';
import { hueVar, onVar, clamp, PILL, trow, esc } from '../lib/utils.js';

const GL = { accepted: ['✓', 'var(--good)'], waitlist: ['…', 'var(--warn)'], rejected: ['✕', 'var(--bad)'], idle: ['–', 'var(--muted)'] };

export default function GraphTab({ opt, toast }) {
  const { sc, pos, cur, view, actions } = opt;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [hover, setHover] = useState(null);

  const { adj, edges } = useMemo(() => buildConflictGraph(sc.courses), [sc.courses]);

  const toSvg = (e) => {
    const svg = svgRef.current; const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const onDown = (code) => (e) => {
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    const p = toSvg(e);
    dragRef.current = { code, ox: p.x - pos[code].x, oy: p.y - pos[code].y, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onMove = (code) => (e) => {
    const d = dragRef.current; if (!d || d.code !== code) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    const p = toSvg(e);
    actions.moveNode(code, clamp(p.x - d.ox, 40, 680), clamp(p.y - d.oy, 40, 450));
  };
  const onUp = (code) => () => {
    const d = dragRef.current;
    if (d && d.code === code) { const moved = d.moved; dragRef.current = null; if (!moved) actions.toggleWant(code); }
  };

  const dimmed = (code) => !!hover && hover !== code && !adj[hover].includes(code);
  const edgeDim = (e) => !!hover && e.a !== hover && e.b !== hover;
  const conflictHot = (e) => {
    const A = cur.status[e.a], Bc = cur.status[e.b];
    return (A.kind === 'accepted' && Bc.kind === 'rejected' && /conflict/i.test(Bc.reason)) || (Bc.kind === 'accepted' && A.kind === 'rejected' && /conflict/i.test(A.reason));
  };

  const n = sc.courses.length, E = edges.length, dens = n > 1 ? E / (n * (n - 1) / 2) : 0;
  const acc = new Set(cur.taken.map(c => c.code));
  const bad = edges.filter(e => acc.has(e.a) && acc.has(e.b)).length;
  const maxDeg = Math.max(0, ...Object.values(adj).map(a => a.length));

  return (
    <div className="graphwrap">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="eyebrow">Conflict graph model</div>
            <h2>Nodes are courses, edges are time overlaps</h2>
            <p className="sub">Drag nodes to rearrange. Click a node to add or drop that request. Hover to see its neighbours.</p>
          </div>
          <div className="seg" role="group" aria-label="Algorithm shown">
            <button type="button" aria-pressed={view === 'greedy'} onClick={() => actions.setView('greedy')}>Greedy</button>
            <button type="button" aria-pressed={view === 'bt'} onClick={() => actions.setView('bt')}>Backtracking</button>
          </div>
        </div>

        <svg id="gsvg" className="graph-svg" viewBox="0 0 720 500" ref={svgRef} role="img" aria-label="Course conflict graph">
          <g>
            {edges.map((e, i) => {
              const pa = pos[e.a], pb = pos[e.b];
              return (
                <g key={i} data-tip={`<b>${esc(e.a)} and ${esc(e.b)}</b>${trow('Clash', fmtM(e.slot))}`}>
                  <line className={'gedge' + (conflictHot(e) ? ' hot' : '') + (edgeDim(e) ? ' dim' : '')} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />
                  <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="transparent" strokeWidth="16" />
                </g>
              );
            })}
          </g>
          <g>
            {sc.courses.map((c, i) => {
              const p = pos[c.code]; const k = cur.status[c.code].kind; const gl = GL[k];
              const short = c.name.length > 16 ? c.name.slice(0, 15) + '…' : c.name;
              const tip = `<b>${esc(c.code)}</b> ${esc(c.name)}${trow('Status', PILL[k][1])}${trow('Credits', c.cr)}${trow('Priority', cur.status && sc.courses[i] ? c.prio : c.prio)}${trow('Conflicts', adj[c.code].length ? adj[c.code].join(', ') : 'none')}<div style="margin-top:4px;opacity:.85">${esc(cur.status[c.code].reason)}</div>`;
              return (
                <g
                  key={c.code}
                  className={'gnode' + (k === 'idle' ? ' idle' : '') + (dimmed(c.code) ? ' dim' : '')}
                  transform={`translate(${p.x} ${p.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.code} ${c.name}. ${PILL[k][1]}. Press to ${c.want ? 'drop' : 'request'}`}
                  data-tip={tip}
                  onPointerDown={onDown(c.code)}
                  onPointerMove={onMove(c.code)}
                  onPointerUp={onUp(c.code)}
                  onPointerEnter={() => setHover(c.code)}
                  onPointerLeave={() => { if (!dragRef.current) setHover(null); }}
                  onFocus={() => setHover(c.code)}
                  onBlur={() => setHover(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actions.toggleWant(c.code); } }}
                >
                  <circle className="main" r="29" style={{ fill: hueVar(i), stroke: 'var(--halo)' }} />
                  <text className="cd" textAnchor="middle" y="4" style={{ fill: onVar(i) }}>{c.code.length > 6 ? c.code.replace('-', '') : c.code}</text>
                  <text className="nm" textAnchor="middle" y="48">{short}</text>
                  <circle cx="21" cy="-21" r="10" style={{ fill: gl[1], stroke: 'var(--halo)' }} strokeWidth="2" />
                  <text x="21" y="-17" textAnchor="middle" style={{ font: '700 12px var(--font-body)', fill: k === 'waitlist' ? '#0b0b0b' : '#fff', pointerEvents: 'none' }}>{gl[0]}</text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="legend" style={{ marginTop: 10 }}>
          {[['var(--good)', '✓ Accepted'], ['var(--warn)', '… Waitlisted'], ['var(--bad)', '✕ Rejected'], ['var(--muted)', '– Not requested']].map(([c, l]) => (
            <span key={l}><i className="sq" style={{ background: c }} />{l}</span>
          ))}
          <span><i className="sq" style={{ background: 'var(--bad)' }} />Clash that cost a course its slot</span>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="eyebrow">Graph facts</div>
          <div style={{ marginTop: 6 }}>
            {[['Courses (nodes)', n], ['Time conflicts (edges)', E], ['Density', (dens * 100).toFixed(0) + '%'], ['Highest degree', maxDeg], ['Accepted courses', acc.size], ['Edges between accepted', bad + (bad === 0 ? '  ✓ independent set' : '  ✕')]].map(([k, v]) => (
              <div className="stat" key={k}><span>{k}</span><span>{v}</span></div>
            ))}
          </div>
          <p className="sub" style={{ marginTop: 10 }}>A valid schedule is an independent set of this graph: no edge joins two accepted courses.</p>
        </div>
        <div className="card">
          <div className="eyebrow">Adjacency list</div>
          <pre className="adj">{sc.courses.map(c => `${c.code} → [${adj[c.code].join(', ')}]`).join('\n')}</pre>
        </div>
      </div>
    </div>
  );
}
