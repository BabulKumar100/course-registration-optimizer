import { DAYS, fmtT } from '../../lib/engine.js';
import { hueVar, onVar, trow, esc } from '../../lib/utils.js';

export default function Timetable({ sc, cur }) {
  const mt = [];
  cur.taken.forEach(c => {
    const i = sc.courses.findIndex(x => x.code === c.code);
    c.meetings.forEach(m => mt.push({ m, c, i, ex: false }));
  });
  (sc.existing || []).forEach(e => mt.push({ m: e, c: { code: e.label || 'Existing', name: 'Already registered' }, i: 0, ex: true }));

  return (
    <div className="card">
      <div className="card-head">
        <div><div className="eyebrow">Weekly view</div><h2>Timetable</h2></div>
      </div>
      <div className="ttwrap">
        <div id="tt">
          {!mt.length ? (
            <div className="empty">No courses accepted yet. Tick some requests or lower the rules.</div>
          ) : (() => {
            const all = sc.courses.flatMap(c => c.meetings).concat(sc.existing || []);
            const t0 = Math.max(7, Math.floor(Math.min(...all.map(m => m.s))) - 1);
            const t1 = Math.min(20, Math.ceil(Math.max(...all.map(m => m.e))) + 1);
            const HH = 48, H = (t1 - t0) * HH;
            const times = [];
            for (let h = t0; h <= t1; h++) times.push(h);
            return (
              <div className="tt">
                <div />
                {DAYS.map(d => <div className="dh" key={d}>{d}</div>)}
                <div className="times" style={{ height: H }}>
                  {times.map(h => <span key={h} style={{ top: (h - t0) * HH }}>{String(h).padStart(2, '0')}:00</span>)}
                </div>
                {[0, 1, 2, 3, 4].map(d => {
                  const hourLines = { backgroundImage: `repeating-linear-gradient(to bottom,transparent 0,transparent ${HH - 1}px,var(--grid) ${HH - 1}px,var(--grid) ${HH}px)` };
                  return (
                    <div className="dc" key={d} style={{ height: H, ...hourLines }}>
                      {mt.filter(x => x.m.d === d).map((x, k) => {
                        const top = (x.m.s - t0) * HH + 1, h = (x.m.e - x.m.s) * HH - 2;
                        const style = x.ex ? { top, height: h } : { top, height: h, '--hue': hueVar(x.i), '--on': onVar(x.i) };
                        const tip = `<b>${esc(x.c.code)}</b> ${esc(x.c.name)}${trow('Time', fmtT(x.m.s) + '–' + fmtT(x.m.e))}`;
                        return (
                          <div className={'blk' + (x.ex ? ' ex' : '')} key={k} style={style} data-tip={tip}>
                            <b>{x.c.code}</b>
                            {h > 44 && <span>{x.c.name}</span>}
                            {h > 58 && <small>{fmtT(x.m.s)}–{fmtT(x.m.e)}</small>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
