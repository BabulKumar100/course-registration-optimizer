import { useMemo, useState } from 'react';
import { runBench } from '../lib/analysis.js';
import { LineChart, Legend, DataTable } from '../components/charts.jsx';

const GREEDY_CODE = `<b>sort</b> requests by priority descending
<b>for each</b> request r:
    <b>if</b> prerequisites not met        → reject
    <b>if</b> credits + r.credits &gt; max   → reject
    <b>if</b> overlaps existing meetings   → reject
    <b>if</b> section has no seats         → waitlist
    accept r; update credits, schedule, seats`;

const BACKTRACK_CODE = `search(i, credits, value):
    <b>if</b> i = n: record best solution; <b>return</b>
    <b>if</b> credits + remaining &lt; min: <b>return</b>   // prune
    <b>if</b> value + remaining ≤ best:   <b>return</b>   // bound
    <b>if</b> course i fits (credits, no clash):
        include i; search(i+1, ...); undo i
    search(i+1, credits, value)    // exclude i`;

const SUMMARY = [
  ['Priority sorting', 'O(R log R)', 'Comparison sort of R requests'],
  ['Prerequisite and credit checks', 'O(1) each', 'Indexed student and course records'],
  ['Timetable check', 'O(k) each', 'Compare with k existing meetings'],
  ['Seat availability', 'O(1) each', 'Read and update a section counter'],
  ['Greedy overall', 'O(R log R + Rk)', 'Sorting plus all feasibility checks'],
  ['Backtracking worst case', 'O(2ⁿ)', 'Include or exclude each of n courses; pruning cuts the practical search'],
  ['Auxiliary storage', 'O(R + K)', 'Request order and stored schedules'],
];

export default function AnalysisTab() {
  const [trials, setTrials] = useState(40);
  const [nonce, setNonce] = useState(0);
  const B = useMemo(() => runBench(trials), [trials, nonce]);

  const xs = B.ns;
  const fmtN = (v) => (v >= 1e6 ? (v / 1e6) + 'M' : v >= 1e3 ? (v / 1e3) + 'k' : String(v));

  const s1 = [
    { name: 'Worst case 2ⁿ', short: '2ⁿ', color: 'var(--s2)', vals: B.pow, dash: '7 5' },
    { name: 'Backtracking nodes (measured)', short: 'Backtracking', color: 'var(--s1)', vals: B.nodes },
    { name: 'Greedy steps, R log R + Rk', short: 'Greedy', color: 'var(--s3)', vals: B.gops },
  ];
  const s2 = [
    { name: 'Average', short: 'Average', color: 'var(--s1)', vals: B.mean },
    { name: 'Worst instance', short: 'Worst', color: 'var(--s2)', vals: B.worst, dash: '7 5' },
  ];
  const s3 = [
    { name: 'Backtracking', short: 'Backtracking', color: 'var(--s1)', vals: B.tB },
    { name: 'Greedy', short: 'Greedy', color: 'var(--s3)', vals: B.tG },
  ];

  return (
    <div className="col">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="eyebrow">Measured in your browser</div>
            <h2>Complexity and quality analysis</h2>
            <p className="sub">
              Random instances for each size n. Greedy runs in near linear time, backtracking explores far fewer than
              2<sup>n</sup> nodes thanks to pruning, and greedy gives up a little quality for speed.
            </p>
          </div>
          <button className="btn" type="button" onClick={() => setNonce(nx => nx + 1)}>Run benchmark again</button>
        </div>
        <div className="sliders">
          <div className="field">
            <div className="rowlbl"><label htmlFor="bT">Instances per size</label><output>{trials}</output></div>
            <input id="bT" type="range" min="10" max="120" step="10" value={trials} onChange={e => setTrials(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 8 }}><div><div className="eyebrow">Search effort</div><h3>Nodes explored vs the 2<sup>n</sup> worst case</h3></div></div>
          <Legend series={s1} />
          <LineChart
            xs={xs} series={s1} logY yMin={10} yMax={1e7} yTicks={[10, 100, 1e3, 1e4, 1e5, 1e6, 1e7]} yFmt={fmtN}
            xTitle="Courses requested (n)" yTitle="Operations" tipFmt={v => Math.round(v).toLocaleString()} label="Search effort growth"
          />
          <DataTable heads={['n', '2^n', 'Backtracking nodes', 'Greedy steps']} rows={xs.map((n, i) => [n, B.pow[i].toLocaleString(), Math.round(B.nodes[i]).toLocaleString(), Math.round(B.gops[i])])} />
        </div>

        <div className="card">
          <div className="card-head" style={{ marginBottom: 8 }}><div><div className="eyebrow">Solution quality</div><h3>Greedy score as a share of the optimum</h3></div></div>
          <Legend series={s2} />
          <LineChart
            xs={xs} series={s2} yMin={0.5} yMax={1} yTicks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]} yFmt={v => Math.round(v * 100) + '%'}
            xTitle="Courses requested (n)" yTitle="Greedy score ÷ optimal score" tipFmt={v => (v * 100).toFixed(1) + '%'} label="Greedy quality against optimum"
          />
          <DataTable heads={['n', 'Average', 'Worst instance']} rows={xs.map((n, i) => [n, (B.mean[i] * 100).toFixed(1) + '%', (B.worst[i] * 100).toFixed(1) + '%'])} />
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 8 }}><div><div className="eyebrow">Running time</div><h3>Average time per run (ms, log scale)</h3></div></div>
        <Legend series={s3} />
        <LineChart
          xs={xs} series={s3} logY yMin={0.001} yMax={100} yTicks={[0.001, 0.01, 0.1, 1, 10, 100]} yFmt={v => (v >= 1 ? v + ' ms' : v + '')}
          xTitle="Courses requested (n)" yTitle="Milliseconds per run" W={1100} H={300} tipFmt={v => v.toFixed(3) + ' ms'} label="Running time"
        />
        <DataTable heads={['n', 'Greedy (ms)', 'Backtracking (ms)']} rows={xs.map((n, i) => [n, B.tG[i].toFixed(4), B.tB[i].toFixed(4)])} />
      </div>

      <div className="card">
        <div className="card-head"><div><div className="eyebrow">From the report</div><h2>Complexity summary</h2></div></div>
        <div className="tscroll">
          <table>
            <thead><tr><th>Operation</th><th className="num">Time</th><th>Explanation</th></tr></thead>
            <tbody>
              {SUMMARY.map((r, i) => (
                <tr key={i}><td>{r[0]}</td><td className="num">{r[1]}</td><td>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Pseudocode</div>
          <h3 style={{ marginBottom: 10 }}>GREEDY-REGISTER</h3>
          <pre className="code" dangerouslySetInnerHTML={{ __html: GREEDY_CODE }} />
        </div>
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Pseudocode</div>
          <h3 style={{ marginBottom: 10 }}>BACKTRACK with pruning</h3>
          <pre className="code" dangerouslySetInnerHTML={{ __html: BACKTRACK_CODE }} />
        </div>
      </div>
    </div>
  );
}
