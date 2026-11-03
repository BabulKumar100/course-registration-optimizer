import { useEffect, useState } from 'react';
import { esc } from '../../lib/utils.js';

function rpText(e, sc, objective) {
  const c = sc.courses.find(x => x.code === e.code); const nm = c ? c.code : '';
  switch (e.kind) {
    case 'include': return `Take ${nm}. Partial plan now has ${e.credits} credits and ${e.v} ${objective === 'score' ? 'points' : 'credits counted'}.`;
    case 'blocked': return `Cannot take ${nm}: ${esc(e.why)}.`;
    case 'exclude': return `Skip ${nm} and move on to the next course.`;
    case 'backtrack': return `Undo ${nm} and explore the branch without it.`;
    case 'prune-bound': return `Prune. Even adding every remaining course reaches only ${e.reach}, which cannot beat the best plan (${e.best}).`;
    case 'prune-min': return `Prune. The remaining courses cannot lift this plan to the minimum ${sc.minCr} credits.`;
    case 'leaf': return e.improved ? `Complete plan found: ${e.v} points, ${e.credits} credits. New best.` : `Complete plan: ${e.v} points. Not better than the best (${e.best}).`;
    default: return '';
  }
}

export default function ReplayCard({ B, sc, objective }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const T = B.trace || []; const total = T.length;

  useEffect(() => { setStep(0); setPlaying(false); }, [B]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), 650);
    return () => clearTimeout(id);
  }, [playing, step, total]);

  const head = (
    <div className="card-head">
      <div>
        <div className="eyebrow">Backtracking replay</div>
        <h2>Watch the search, move by move</h2>
        <p className="sub">Each step takes a course, skips it, undoes a choice, or prunes a branch that cannot beat the best plan found so far.</p>
      </div>
    </div>
  );

  if (!B.candCodes.length) {
    return (
      <div className="card">
        {head}
        <div className="note">No eligible courses to search. Check prerequisites, seats and the request ticks.</div>
      </div>
    );
  }

  const s = Math.min(step, total);
  const e = s > 0 ? T[s - 1] : null;
  const curSet = new Set(e ? e.cur : []);
  let upto = 0, now = -1;
  if (e) {
    if (e.kind === 'include') { upto = e.i; now = e.i; }
    else if (e.kind === 'blocked' || e.kind === 'backtrack') { upto = e.i; now = e.i; }
    else if (e.kind === 'exclude') { upto = e.i + 1; }
    else { upto = e.i; }
  }

  const best = e ? e.best : -1;
  const pr = T.slice(0, s).filter(x => x.kind.startsWith('prune')).length;
  const fin = s === total;
  const noteCls = 'note' + (e && e.kind === 'leaf' && e.improved ? ' good' : '') + (e && e.kind.startsWith('prune') ? ' warn' : '');

  return (
    <div className="card">
      {head}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn ghost small" type="button" onClick={() => { setPlaying(false); setStep(v => Math.max(0, v - 1)); }}>Back</button>
        <button className="btn small" type="button" onClick={() => { if (step >= total) setStep(0); setPlaying(p => !p); }}>{playing ? 'Pause' : 'Play'}</button>
        <button className="btn ghost small" type="button" onClick={() => { setPlaying(false); setStep(v => Math.min(total, v + 1)); }}>Step</button>
      </div>

      <div className="rpchips">
        {B.candCodes.map((code, i) => {
          let cls = 'pr', ic = '';
          if (curSet.has(code)) { cls = 'in'; ic = '✓'; }
          else if (i < upto) { cls = 'out'; }
          else if (i === now) { cls = 'now'; ic = '?'; }
          return <span key={code} className={'rpc ' + cls}>{ic ? ic + ' ' : ''}{code}</span>;
        })}
      </div>

      <input type="range" min="0" max={total} value={s} aria-label="Search step" style={{ margin: '14px 0 4px' }}
        onChange={ev => { setPlaying(false); setStep(+ev.target.value); }} />

      <div className={noteCls} style={{ marginTop: 8 }}>
        {e ? <><span className="mono" style={{ color: 'var(--muted)' }}>{s}/{total}</span><div>{rpText(e, sc, objective)}</div></> : <div>Courses are tried in order of value. Press <b>Step</b> or <b>Play</b> to start.</div>}
      </div>

      <div className="kpis" style={{ marginTop: 14 }}>
        <div className="kpi"><div className="v">{s} / {total}</div><div className="l">Moves replayed</div></div>
        <div className="kpi"><div className="v">{best > 0 ? best : 'none yet'}</div><div className="l">Best score so far</div></div>
        <div className="kpi"><div className="v">{pr}</div><div className="l">Branches pruned so far</div></div>
        <div className="kpi"><div className="v">{fin ? B.score : '…'}</div><div className="l">Final plan score</div></div>
      </div>
      {total >= 800 && <p className="sub" style={{ marginTop: 10 }}>Replay shows the first 800 moves only.</p>}
    </div>
  );
}
