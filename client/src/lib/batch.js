/* ---------- batch simulation (pure, ported from js/batch.js) ---------- */
import { mulberry32, firstClash } from './engine.js';
import { SCEN } from './scenarios.js';

export function simulate({ n, k, cap, seed }) {
  const rnd = mulberry32(seed); const base = SCEN.default().courses; const C = base.length;
  const capacity = base.map(c => Math.max(1, Math.round(cap * c.cap / 50)));
  const conf = base.map(a => base.map(b => a !== b && !!firstClash(a.meetings, b.meetings)));
  const defs = [], reqs0 = []; let ord = 0;
  for (let s = 0; s < n; s++) {
    const done = new Set();
    if (rnd() < .9) done.add('CS101'); if (rnd() < .9) done.add('MA101'); if (rnd() < .6) done.add('MA201'); if (done.has('CS101') && rnd() < .4) done.add('CS201');
    defs.push({ done, limit: 12 + 2 * Math.floor(rnd() * 4) });
    const pick = new Set(); while (pick.size < Math.min(k, C)) pick.add(Math.floor(rnd() * C));
    pick.forEach(ci => reqs0.push({ s, ci, prio: 20 + Math.floor(rnd() * 81), o: ord++ }));
  }
  function allocate(policy) {
    const t0 = performance.now(); const seats = capacity.slice(); const students = defs.map(d => ({ done: d.done, limit: d.limit, credits: 0, taken: [] }));
    const reqs = reqs0.map(r => ({ ...r }));
    if (policy === 'round') {
      const by = {}; reqs.forEach(r => (by[r.s] = by[r.s] || []).push(r));
      Object.values(by).forEach(a => { a.sort((x, y) => y.prio - x.prio || x.o - y.o); a.forEach((r, i) => { r.round = i; }); });
      reqs.sort((a, b) => a.round - b.round || b.prio - a.prio || a.o - b.o);
    }
    else reqs.sort((a, b) => b.prio - a.prio || a.o - b.o);
    const out = { accepted: 0, waitlist: 0, prereq: 0, credit: 0, conflict: 0 }; const enrolled = new Array(C).fill(0), wl = new Array(C).fill(0); let prioSum = 0;
    for (const r of reqs) {
      const st = students[r.s], c = base[r.ci];
      if (!c.pre.every(p => st.done.has(p))) { out.prereq++; continue; }
      if (st.credits + c.cr > st.limit) { out.credit++; continue; }
      if (st.taken.some(t => conf[r.ci][t])) { out.conflict++; continue; }
      if (seats[r.ci] <= 0) { out.waitlist++; wl[r.ci]++; continue; }
      out.accepted++; prioSum += r.prio; st.credits += c.cr; st.taken.push(r.ci); seats[r.ci]--; enrolled[r.ci]++;
    }
    const cr = students.map(s => s.credits).sort((a, b) => a - b); const q = Math.max(1, Math.ceil(n / 4));
    return {
      out, enrolled, wl, students, ms: performance.now() - t0,
      m: { zero: cr.filter(x => x === 0).length, low: cr.slice(0, q).reduce((s, x) => s + x, 0) / q, prio: prioSum }
    };
  }
  const A = allocate('priority'), R = allocate('round');
  const bins = [[0, 0], [1, 3], [4, 6], [7, 9], [10, 12], [13, 15], [16, 18]].map(([a, b]) => ({ a, b, n: 0 }));
  let sumCr = 0;
  A.students.forEach(st => { sumCr += st.credits; const b = bins.find(x => st.credits >= x.a && st.credits <= x.b); if (b) b.n++; });
  return { n, total: reqs0.length, out: A.out, enrolled: A.enrolled, capacity, wl: A.wl, bins, avg: sumCr / n, ms: A.ms, base, fair: { pri: A.m, rr: R.m } };
}
