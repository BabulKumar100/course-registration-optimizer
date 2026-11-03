import { useState } from 'react';
import { fmtM } from '../../lib/engine.js';
import { planCsv, downloadFile, openPlanReport } from '../../lib/exporters.js';
import CountUp from '../../components/CountUp.jsx';

function planText(cur, sc, view) {
  const L = [
    `Course Registration Optimizer: ${view === 'greedy' ? 'Greedy' : 'Backtracking'} plan`,
    `Credits: ${cur.credits} / ${sc.maxCr}${sc.minCr ? ` (minimum ${sc.minCr})` : ''}   Priority score: ${cur.score}`,
    '', 'Accepted:',
  ];
  cur.taken.forEach(c => L.push(`  ${c.code} ${c.name} (${c.cr} cr) ${c.meetings.map(fmtM).join(', ')}`));
  if (!cur.taken.length) L.push('  none');
  L.push('', 'Not accepted:');
  const rest = sc.courses.filter(c => c.want && cur.status[c.code].kind !== 'accepted');
  rest.forEach(c => L.push(`  ${c.code}: ${cur.status[c.code].reason}`));
  if (!rest.length) L.push('  none');
  return L.join('\n');
}

export default function SummaryCard({ sc, cur, G, B, view, altRank, combos, setView, toast }) {
  const [copied, setCopied] = useState(false);
  const [box, setBox] = useState(null);

  const maxC = Math.max(1, sc.maxCr);
  const pct = Math.min(100, cur.credits / maxC * 100);
  const minP = Math.min(100, sc.minCr / maxC * 100);
  const wanted = sc.courses.filter(c => c.want).length;

  const nodesTxt = view === 'greedy'
    ? <><CountUp value={cur.ops} /><small> steps</small></>
    : view === 'bt' ? <><CountUp value={cur.nodes} /><small> / {Math.pow(2, cur.n).toLocaleString()}</small></> : <><CountUp value={combos.total} /><small> valid</small></>;
  const nodesLbl = view === 'greedy' ? 'Requests examined' : view === 'bt' ? 'Search nodes visited (worst case 2ⁿ)' : 'Combinations that satisfy every rule';

  const notes = [];
  if (view === 'alt') notes.push(
    <div className="note" key="alt" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
      <div>Previewing <b>alternative #{altRank}</b> from the ranked list.</div>
      <button className="btn ghost small" type="button" onClick={() => setView('bt')}>Back to backtracking</button>
    </div>
  );
  if (sc.minCr > 0 && cur.credits < sc.minCr) notes.push(
    <div className="note warn" key="min"><span aria-hidden="true">!</span><div><b>Below the minimum.</b> {cur.credits} credits is under the required {sc.minCr}.
      {view === 'greedy' && B.credits >= sc.minCr && B.minMet ? ` Backtracking finds a valid plan with ${B.credits} credits.` : ''}</div></div>
  );
  if (view === 'bt' && !B.minMet) notes.push(
    <div className="note warn" key="nocombo"><span aria-hidden="true">!</span><div><b>No combination reaches {sc.minCr} credits</b> with these prerequisites, seats and clashes. Showing the best available plan.</div></div>
  );
  if (view === 'greedy' && B.score > G.score) notes.push(
    <div className="note good" key="btbetter"><span aria-hidden="true">✓</span><div>Backtracking scores <b>{B.score}</b> against greedy's <b>{G.score}</b>. A high priority course took a slot that two others needed.</div></div>
  );

  const title = view === 'greedy' ? 'Greedy schedule' : view === 'bt' ? 'Backtracking schedule' : 'Alternative schedule #' + altRank;

  const doCopy = () => {
    const txt = planText(cur, sc, view);
    const done = () => { setCopied(true); setBox(null); toast('Plan copied to clipboard'); setTimeout(() => setCopied(false), 1600); };
    const fallback = () => setBox(txt);
    try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (e) { fallback(); }
  };

  const algo = view === 'greedy' ? 'greedy' : view === 'bt' ? 'backtracking' : 'alternative';
  const doCsv = () => {
    downloadFile(`schedule-${algo}-${cur.credits}cr-${cur.score}pts.csv`, planCsv(cur, sc, view));
    toast('CSV downloaded');
  };
  const doPdf = () => {
    if (!openPlanReport(cur, sc, view)) toast('Allow pop-ups to save the PDF');
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Result</div>
          <h2>{title}</h2>
        </div>
        <div className="tools">
          <button className="btn ghost small" type="button" onClick={doCsv}>Export CSV</button>
          <button className="btn ghost small" type="button" onClick={doPdf}>Export PDF</button>
          <button className="btn ghost small" type="button" onClick={doCopy}>{copied ? 'Copied' : 'Copy plan'}</button>
          <div className="seg" role="group" aria-label="Algorithm shown">
            <button type="button" aria-pressed={view === 'greedy'} onClick={() => setView('greedy')}>Greedy</button>
            <button type="button" aria-pressed={view === 'bt'} onClick={() => setView('bt')}>Backtracking</button>
          </div>
        </div>
      </div>

      {box !== null && (
        <textarea readOnly aria-label="Plan text" value={box} style={{ width: '100%', minHeight: 120, marginBottom: 12, borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--field)', color: 'var(--ink)', padding: 10, fontFamily: 'var(--font-mono)', fontSize: '.78rem' }} onFocus={e => e.target.select()} />
      )}

      <div className="meter" role="img" aria-label={`${cur.credits} of ${sc.maxCr} credits`}>
        <div className="fill" style={{ width: pct + '%' }} />
        {sc.minCr > 0 && <div className="tick" style={{ left: minP + '%' }}><span>min {sc.minCr}</span></div>}
        <div className="ends"><span>0</span><span>max {sc.maxCr}</span></div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="v"><CountUp value={cur.credits} /><small> / {sc.maxCr}</small></div><div className="l">Credits registered</div></div>
        <div className="kpi"><div className="v"><CountUp value={cur.taken.length} /><small> / {wanted}</small></div><div className="l">Requests accepted</div></div>
        <div className="kpi"><div className="v"><CountUp value={cur.score} /></div><div className="l">Total priority score</div></div>
        <div className="kpi"><div className="v">{nodesTxt}</div><div className="l">{nodesLbl}</div></div>
      </div>

      {notes}
    </div>
  );
}
