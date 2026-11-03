import { hueVar } from '../../lib/utils.js';

export default function CombosCard({ sc, combos, view, altRank, objective, onPreview }) {
  const L = combos.list;
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Recommendations</div>
          <h2>Best feasible combinations</h2>
          <p className="sub">Every valid combination under your rules, ranked. Preview one to see it on the timetable and the conflict graph.</p>
        </div>
      </div>
      {!L.length ? (
        <div className="empty">No combination satisfies every rule. Lower the minimum credits, free up seats or tick more courses.</div>
      ) : (
        <>
          <ol className="combos">
            {L.map((c, i) => {
              const on = view === 'alt' && altRank === i + 1;
              return (
                <li key={i} className={on ? 'on' : ''}>
                  <span className="rk">{i + 1}</span>
                  <div className="cw">
                    {c.codes.map(code => (
                      <span className="cc" key={code}><i style={{ background: hueVar(sc.courses.findIndex(x => x.code === code)) }} />{code}</span>
                    ))}
                  </div>
                  <div className="cm"><b>{c.score}</b> pts · {c.credits} cr</div>
                  <button className={'btn small ' + (on ? '' : 'ghost')} type="button" aria-pressed={on} onClick={() => onPreview(i)}>{on ? 'Showing' : 'Preview'}</button>
                </li>
              );
            })}
          </ol>
          <p className="sub" style={{ marginTop: 10 }}>
            {combos.total.toLocaleString()} valid combinations in total. Ranked by {objective === 'score' ? 'total priority score' : 'total credits'}.
          </p>
        </>
      )}
    </div>
  );
}
