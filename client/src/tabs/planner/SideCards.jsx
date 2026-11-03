import { HBars, VBars } from '../../components/charts.jsx';
import { DAYS } from '../../lib/engine.js';
import { trow } from '../../lib/utils.js';

export function CompareCard({ G, B }) {
  const mx = Math.max(1, G.score, B.score);
  const items = [
    { label: 'Greedy', value: G.score, color: 'var(--s2)', text: G.score + ' pts', tip: `<b>Greedy</b>${trow('Score', G.score)}${trow('Credits', G.credits)}${trow('Courses', G.taken.length)}` },
    { label: 'Backtracking', value: B.score, color: 'var(--s1)', text: B.score + ' pts', tip: `<b>Backtracking</b>${trow('Score', B.score)}${trow('Credits', B.credits)}${trow('Courses', B.taken.length)}` },
  ];
  const diff = B.score - G.score; const pct = G.score > 0 ? Math.round(diff / G.score * 100) : 0;
  const msg = diff > 0
    ? <>Backtracking is <b>+{diff} points</b> ({pct > 0 ? '+' + pct + '%' : 'higher'}) ahead.</>
    : diff === 0 ? 'Both algorithms reach the same total.'
      : 'Greedy scores higher here because backtracking was set to maximise credits.';
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 6 }}>
        <div><div className="eyebrow">Compare</div><h3>Greedy vs backtracking</h3></div>
      </div>
      <HBars items={items} w={360} rowH={36} labelW={96} valW={62} max={mx} label="Total priority score by algorithm" />
      <p className="sub" style={{ marginTop: 8 }}>{msg}</p>
      <p className="sub">Greedy checked {G.ops} requests. Backtracking visited {B.nodes} nodes and pruned {B.pruned} branches in {B.ms.toFixed(2)} ms.</p>
    </div>
  );
}

export function HoursCard({ sc, cur }) {
  const hrs = [0, 0, 0, 0, 0];
  cur.taken.forEach(c => c.meetings.forEach(m => { hrs[m.d] += m.e - m.s; }));
  (sc.existing || []).forEach(m => { hrs[m.d] += m.e - m.s; });
  const mx = Math.max(2, Math.ceil(Math.max(...hrs)));
  const items = hrs.map((v, d) => ({ label: DAYS[d], value: v, color: 'var(--s1)', text: v ? String(+v.toFixed(1)) : '', tip: `<b>${DAYS[d]}</b>${trow('Class hours', (+v.toFixed(1)) + ' h')}` }));
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: 6 }}>
        <div><div className="eyebrow">Load</div><h3>Class hours per day</h3></div>
      </div>
      <VBars items={items} max={mx} yTicks={[0, Math.round(mx / 2), mx]} label="Class hours per day" />
    </div>
  );
}
