import { PILL } from '../../lib/utils.js';

export default function DecisionsCard({ sc, effSc, cur, view, altRank }) {
  let list, ey;
  if (view === 'greedy') {
    ey = 'Greedy, in processing order (highest priority first)';
    list = cur.log.map((l, i) => ({ n: i + 1, ...l }));
  } else {
    ey = view === 'bt' ? 'Backtracking, best feasible combination' : 'Alternative combination #' + altRank;
    const order = { accepted: 0, rejected: 1, waitlist: 2 };
    list = effSc.courses.filter(c => c.want)
      .map(c => ({ code: c.code, prio: c.prio, kind: cur.status[c.code].kind, reason: cur.status[c.code].reason }))
      .sort((a, b) => order[a.kind] - order[b.kind] || b.prio - a.prio)
      .map((x, i) => ({ n: i + 1, ...x }));
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">{ey}</div>
          <h2>Why each course was accepted or not</h2>
        </div>
      </div>
      {!list.length ? (
        <div className="empty">No courses requested.</div>
      ) : (
        <ol className="dec">
          {list.map(l => {
            const p = PILL[l.kind];
            return (
              <li key={l.n}>
                <span className="n">{l.n}</span>
                <div className="what">
                  <b>{l.code}</b> <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>priority {l.prio}</span>
                  <span className="why">{l.reason}</span>
                </div>
                <span className={'pill ' + p[0]}>{p[1]}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
