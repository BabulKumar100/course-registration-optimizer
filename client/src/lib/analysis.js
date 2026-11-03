/* ---------- analysis benchmark (pure, ported from js/analysis.js) ---------- */
import { runGreedy, runBacktracking, randomInstance, mulberry32 } from './engine.js';

export function runBench(trials) {
  const ns = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const out = { ns, nodes: [], pow: [], gops: [], mean: [], worst: [], tG: [], tB: [], trials };
  for (const n of ns) {
    let nodes = 0, rs = 0, rc = 0, worst = 1; const insts = [];
    for (let t = 0; t < trials; t++) {
      const inst = randomInstance(n, mulberry32(1000 * n + t + 17)); insts.push(inst);
      const g = runGreedy(inst), b = runBacktracking(inst);
      nodes += b.nodes;
      if (b.score > 0) { const q = g.score / b.score; rs += q; rc++; if (q < worst) worst = q; }
    }
    out.nodes.push(nodes / trials); out.pow.push(Math.pow(2, n)); out.gops.push(n * Math.log2(n) + n * 6);
    out.mean.push(rc ? rs / rc : 1); out.worst.push(worst);
    const reps = Math.max(5, Math.floor(400 / (n / 4)));
    let t0 = performance.now();
    for (let q = 0; q < reps; q++) for (let t = 0; t < Math.min(trials, 10); t++) runGreedy(insts[t]);
    const tg = (performance.now() - t0) / (reps * Math.min(trials, 10));
    const reps2 = Math.max(2, Math.floor(30 / (n / 4)));
    t0 = performance.now();
    for (let q = 0; q < reps2; q++) for (let t = 0; t < Math.min(trials, 10); t++) runBacktracking(insts[t]);
    const tb = (performance.now() - t0) / (reps2 * Math.min(trials, 10));
    out.tG.push(Math.max(tg, 0.0005)); out.tB.push(Math.max(tb, 0.0005));
  }
  return out;
}
