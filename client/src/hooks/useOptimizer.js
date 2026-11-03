import { useEffect, useMemo, useState } from 'react';
import { SCEN } from '../lib/scenarios.js';
import { runGreedy, runBacktracking, topCombos } from '../lib/engine.js';
import { circleLayout, clamp } from '../lib/utils.js';

/* preference adjustment (ported from js/extras.js) */
function prefAdj(c, pref) {
  let a = 0; const { tod, free } = pref;
  const am = c.meetings.every(m => m.s < 12), pm = c.meetings.every(m => m.s >= 12);
  if (tod === 'am') { if (am) a += 8; else if (pm) a -= 8; }
  if (tod === 'pm') { if (pm) a += 8; else if (am) a -= 8; }
  if (free >= 0 && c.meetings.some(m => m.d === free)) a -= 15;
  return a;
}

export function useOptimizer() {
  const [key, setKey] = useState('default');
  const [sc, setSc] = useState(() => SCEN.default());
  const [view, setView] = useState('greedy');
  const [objective, setObjective] = useState('score');
  const [pref, setPref] = useState({ tod: 'none', free: -1 });
  const [pos, setPos] = useState(() => circleLayout(SCEN.default().courses.map(c => c.code)));
  const [altRes, setAltRes] = useState(null);
  const [altRank, setAltRank] = useState(0);

  const effSc = useMemo(() => ({
    ...sc,
    courses: sc.courses.map(c => ({ ...c, prio: clamp(c.prio + prefAdj(c, pref), 0, 100) })),
  }), [sc, pref]);

  const G = useMemo(() => runGreedy(effSc), [effSc]);
  const B = useMemo(() => runBacktracking(effSc, objective, true), [effSc, objective]);
  const combos = useMemo(() => topCombos(effSc, objective, 5), [effSc, objective]);

  const cur = view === 'greedy' ? G : view === 'bt' ? B : altRes;

  /* leaving an alternative preview when the scenario data changes */
  useEffect(() => {
    setView(v => (v === 'alt' ? 'bt' : v));
    setAltRes(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effSc, objective]);

  const loadScenario = (k) => {
    const next = SCEN[k]();
    setKey(k); setSc(next); setPos(circleLayout(next.courses.map(c => c.code)));
    setPref({ tod: 'none', free: -1 }); setView(v => (v === 'alt' ? 'bt' : v)); setAltRes(null); setAltRank(0);
  };
  const reset = () => loadScenario(key);

  const toggleWant = (code) => setSc(s => ({ ...s, courses: s.courses.map(c => (c.code === code ? { ...c, want: !c.want } : c)) }));
  const setSeats = (code, v) => setSc(s => ({ ...s, courses: s.courses.map(c => (c.code === code ? { ...c, seats: Math.max(0, parseInt(v || '0', 10) || 0) } : c)) }));
  const setPrio = (code, v) => setSc(s => ({ ...s, courses: s.courses.map(c => (c.code === code ? { ...c, prio: clamp(+v, 0, 100) } : c)) }));

  const setMinCr = (v) => setSc(s => ({ ...s, minCr: Math.max(0, +v || 0) }));
  const setMaxCr = (v) => setSc(s => ({ ...s, maxCr: Math.max(1, +v || 1) }));
  const setWaitlist = (v) => setSc(s => ({ ...s, waitlist: v }));
  const toggleDone = (code) => setSc(s => {
    const i = s.done.indexOf(code);
    return { ...s, done: i >= 0 ? s.done.filter(x => x !== code) : [...s.done, code] };
  });

  const addCourse = (course) => {
    const nextCourses = [...sc.courses, course];
    const extraPool = course.pre.filter(p => !sc.pool.includes(p) && !sc.courses.some(c => c.code === p));
    setSc({ ...sc, pool: [...sc.pool, ...extraPool], courses: nextCourses });
    setPos(circleLayout(nextCourses.map(c => c.code)));
  };
  const removeCourse = (code) => {
    if (sc.courses.length <= 1) return;
    const next = sc.courses.filter(c => c.code !== code);
    setSc({ ...sc, courses: next });
    setPos(circleLayout(next.map(c => c.code)));
  };

  /* preview an alternative combination from the ranked list */
  const previewCombo = (i) => {
    const combo = combos.list[i]; if (!combo) return;
    const taken = effSc.courses.filter(c => combo.codes.includes(c.code));
    const status = {};
    effSc.courses.forEach(c => {
      status[c.code] = combo.codes.includes(c.code)
        ? { kind: 'accepted', reason: `Part of alternative #${i + 1}` }
        : c.want ? { kind: 'rejected', reason: `Not part of alternative #${i + 1}` } : { kind: 'idle', reason: 'Not requested' };
    });
    setAltRes({ algo: 'alt', taken, status, log: [], credits: combo.credits, score: combo.score, ops: 0, nodes: 0, pruned: 0, n: 0, minMet: true });
    setAltRank(i + 1); setView('alt');
  };

  const moveNode = (code, x, y) => setPos(p => ({ ...p, [code]: { x, y } }));

  return {
    key, sc, effSc, pos, pref, objective, view, altRank, combos,
    G, B, cur,
    actions: {
      loadScenario, reset, toggleWant, setSeats, setPrio, setMinCr, setMaxCr, setWaitlist, toggleDone,
      addCourse, removeCourse, previewCombo, moveNode, setPref, setObjective, setView,
    },
  };
}
