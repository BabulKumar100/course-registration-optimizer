import { useMemo, useState } from 'react';
import { simulate } from '../lib/batch.js';
import { HBars, VBars, DataTable } from '../components/charts.jsx';
import CountUp from '../components/CountUp.jsx';
import { hueVar, trow } from '../lib/utils.js';

export default function BatchTab() {
  const [sim, setSim] = useState({ n: 300, k: 5, cap: 80, seed: 7 });
  const r = useMemo(() => simulate(sim), [sim]);
  const pc = (v) => (v / r.total * 100).toFixed(1) + '%';
  const setSimField = (k) => (e) => setSim(s => ({ ...s, [k]: +e.target.value }));

  const kpi = [
    [<CountUp key="t" value={r.total} />, 'Requests processed'],
    [<CountUp key="a" value={r.out.accepted / r.total * 100} format={v => v.toFixed(1) + '%'} />, 'Accepted'],
    [<CountUp key="avg" value={r.avg} format={v => v.toFixed(1)} />, 'Average credits per student'],
    [<CountUp key="ms" value={r.ms} format={v => v.toFixed(1) + ' ms'} />, 'Time to allocate everyone'],
  ];

  const O = [
    ['✓ Accepted', r.out.accepted, 'var(--good)'],
    ['… Waitlisted, section full', r.out.waitlist, 'var(--warn)'],
    ['✕ Prerequisite not met', r.out.prereq, 'var(--bad)'],
    ['✕ Credit limit', r.out.credit, 'var(--bad)'],
    ['✕ Timetable conflict', r.out.conflict, 'var(--bad)'],
  ];
  const omax = Math.max(1, ...O.map(o => o[1]));
  const outItems = O.map(o => ({ label: o[0], value: o[1], color: o[2], text: o[1].toLocaleString(), tip: `<b>${o[0]}</b>${trow('Requests', o[1].toLocaleString())}${trow('Share', pc(o[1]))}` }));

  const seatItems = r.base.map((c, i) => ({ label: c.code, value: r.enrolled[i], color: hueVar(i), text: `${r.enrolled[i]} / ${r.capacity[i]}`, tip: `<b>${c.code}</b> ${c.name}${trow('Enrolled', r.enrolled[i])}${trow('Capacity', r.capacity[i])}${trow('Waitlisted', r.wl[i])}` }));

  const histItems = r.bins.map(b => ({ label: b.a === b.b ? String(b.a) : `${b.a}–${b.b}`, value: b.n, color: 'var(--s1)', text: b.n ? String(b.n) : '', tip: `<b>${b.a === b.b ? b.a : b.a + '–' + b.b} credits</b>${trow('Students', b.n)}${trow('Share', (b.n / r.n * 100).toFixed(1) + '%')}` }));
  const histMax = Math.max(1, ...r.bins.map(b => b.n));

  const f = r.fair;
  const FL = [{ name: 'Priority order', color: 'var(--s2)' }, { name: 'Round robin', color: 'var(--s1)' }];
  const MET = [
    ['zero', 'Students with no course', v => String(v)],
    ['low', 'Credits, lowest quarter (average)', v => v.toFixed(1)],
    ['prio', 'Total priority satisfied', v => v.toLocaleString()],
  ];
  const dz = f.pri.zero - f.rr.zero, dp = f.pri.prio - f.rr.prio;

  return (
    <div className="col">
      <div className="card">
        <div className="card-head">
          <div>
            <div className="eyebrow">GREEDY-REGISTER at scale</div>
            <h2>Many students, shared seats</h2>
            <p className="sub">All requests from all students go into one list sorted by priority. Each is checked in order against prerequisites, credit limit, timetable and seats.</p>
          </div>
          <button className="btn ghost small" type="button" onClick={() => setSim(s => ({ ...s, seed: Math.floor(Math.random() * 1e6) }))}>New random cohort</button>
        </div>
        <div className="sliders">
          <div className="field"><div className="rowlbl"><label htmlFor="simN">Students</label><output>{sim.n}</output></div><input id="simN" type="range" min="50" max="1500" step="50" value={sim.n} onChange={setSimField('n')} /></div>
          <div className="field"><div className="rowlbl"><label htmlFor="simK">Requests per student</label><output>{sim.k}</output></div><input id="simK" type="range" min="2" max="8" step="1" value={sim.k} onChange={setSimField('k')} /></div>
          <div className="field"><div className="rowlbl"><label htmlFor="simC">Seats per section (base)</label><output>{sim.cap}</output></div><input id="simC" type="range" min="10" max="400" step="10" value={sim.cap} onChange={setSimField('cap')} /></div>
        </div>
      </div>

      <div className="card"><div className="kpis">{kpi.map((x, i) => <div className="kpi" key={i}><div className="v">{x[0]}</div><div className="l">{x[1]}</div></div>)}</div></div>

      <div className="two">
        <div className="card">
          <div className="card-head" style={{ marginBottom: 6 }}><div><div className="eyebrow">Outcome of every request</div><h3>What happened to the requests</h3></div></div>
          <HBars items={outItems} w={520} rowH={36} labelW={178} valW={58} max={omax} label="Request outcomes" />
          <DataTable heads={['Outcome', 'Requests', 'Share']} rows={O.map(o => [o[0], o[1], pc(o[1])])} />
        </div>
        <div className="card">
          <div className="card-head" style={{ marginBottom: 6 }}><div><div className="eyebrow">Seat contention</div><h3>Enrolled vs capacity</h3></div></div>
          <HBars items={seatItems} w={520} rowH={32} labelW={62} valW={78} max={Math.max(1, ...r.capacity)} label="Seats filled per section" />
          <DataTable heads={['Section', 'Enrolled', 'Capacity', 'Waitlisted']} rows={r.base.map((c, i) => [c.code, r.enrolled[i], r.capacity[i], r.wl[i]])} />
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 6 }}>
          <div>
            <div className="eyebrow">Fairness, from the report's future scope</div>
            <h3>Priority order vs round robin</h3>
            <p className="sub">Round robin serves every student's best remaining request before anyone's second choice, so nobody is shut out by higher priorities elsewhere.</p>
          </div>
        </div>
        <div className="legend" style={{ marginBottom: 8 }}>{FL.map(x => <span key={x.name}><i className="sq" style={{ background: x.color }} />{x.name}</span>)}</div>
        <div className="three">
          {MET.map(([key, title, fmt]) => {
            const mx = Math.max(1, f.pri[key], f.rr[key]);
            return (
              <div key={key}>
                <div className="lbl" style={{ marginBottom: 6 }}>{title}</div>
                <HBars
                  w={330} rowH={34} labelW={92} valW={60} max={mx} label={title}
                  items={[
                    { label: 'Priority', value: f.pri[key], color: FL[0].color, text: fmt(f.pri[key]), tip: `<b>${title}</b>${trow('Priority order', fmt(f.pri[key]))}${trow('Round robin', fmt(f.rr[key]))}` },
                    { label: 'Round robin', value: f.rr[key], color: FL[1].color, text: fmt(f.rr[key]), tip: `<b>${title}</b>${trow('Priority order', fmt(f.pri[key]))}${trow('Round robin', fmt(f.rr[key]))}` },
                  ]}
                />
              </div>
            );
          })}
        </div>
        <p className="sub" style={{ marginTop: 12 }}>
          Round robin leaves <b>{Math.abs(dz)}</b> {dz >= 0 ? 'fewer' : 'more'} students with no course and {dp >= 0 ? 'gives up' : 'gains'} <b>{Math.abs(dp).toLocaleString()}</b> points of total priority. Fairness costs a little of what priority order maximises.
        </p>
        <DataTable heads={['Metric', 'Priority order', 'Round robin']} rows={MET.map(([key, title, fmt]) => [title, fmt(f.pri[key]), fmt(f.rr[key])])} />
      </div>

      <div className="card">
        <div className="card-head" style={{ marginBottom: 6 }}><div><div className="eyebrow">Per student</div><h3>Credits each student ended up with</h3></div></div>
        <VBars items={histItems} W={1100} H={230} max={histMax} yTicks={[0, Math.round(histMax / 2), histMax]} label="Students by credits registered" />
        <DataTable heads={['Credits', 'Students']} rows={r.bins.map(b => [b.a === b.b ? b.a : b.a + '–' + b.b, b.n])} />
      </div>
    </div>
  );
}
