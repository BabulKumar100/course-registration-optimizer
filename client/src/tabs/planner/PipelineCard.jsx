export default function PipelineCard({ sc, G }) {
  const L = G.log, req = L.length;
  const cnt = (re) => L.filter(l => re.test(l.reason)).length;
  const pre = cnt(/^Prerequisite/), cr = cnt(/^Credit/), cf = cnt(/^Timetable/);
  const full = L.filter(l => l.kind === 'waitlist' || /^Section full/.test(l.reason)).length;
  const acc = L.filter(l => l.kind === 'accepted').length;
  const steps = [
    ['Student preferences and academic data', String(req), 'requests', 0],
    ['Retrieve available courses', String(sc.courses.length), 'offerings', 0],
    ['Validate prerequisites', String(req - pre), 'pass', pre],
    ['Check credit limits', String(req - pre - cr), 'pass', cr],
    ['Detect timetable conflicts', String(req - pre - cr - cf), 'conflict free', cf],
    ['Evaluate feasible combinations', String(req - pre - cr - cf - full), 'with a seat', full],
    ['Generate recommended schedule', String(acc), 'accepted', 0],
  ];
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Workflow</div>
          <h2>How the requests moved through the pipeline</h2>
          <p className="sub">The seven steps of the proposed system, with live counts from the greedy run.</p>
        </div>
      </div>
      <ol className="pipe">
        {steps.map((s, i) => (
          <li key={i} className={i === 0 || i === 6 ? 'end' : ''}>
            <span className="pn">{i + 1}</span>
            <span className="pt">{s[0]}</span>
            <span className="pv">{s[1]} <small>{s[2]}</small></span>
            {s[3] ? <span className="pl">✕ {s[3]} dropped here</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
