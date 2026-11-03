/* ---------- plan export: CSV download and printable PDF report ---------- */
import { fmtM, fmtT, DAYS } from './engine.js';

const STATUS = { accepted: 'Accepted', waitlist: 'Waitlisted', rejected: 'Rejected', idle: 'Not requested' };
const RANK = { accepted: 0, waitlist: 1, rejected: 2, idle: 3 };
const ALGO = { greedy: 'Greedy', bt: 'Backtracking' };

const algoName = (view) => ALGO[view] || 'Alternative';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const cell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

/* every requested course with its outcome, accepted first then by priority */
function planRows(cur, sc) {
  return sc.courses
    .filter((c) => c.want)
    .map((c) => {
      const s = (cur.status && cur.status[c.code]) || { kind: 'idle', reason: 'Not requested' };
      return { kind: s.kind, reason: s.reason, c };
    })
    .sort((a, b) => (RANK[a.kind] ?? 3) - (RANK[b.kind] ?? 3) || b.c.prio - a.c.prio);
}

/* every meeting on the timetable, existing classes included, in day then time order */
function weekBlocks(cur, sc) {
  const blocks = [];
  cur.taken.forEach((c) => c.meetings.forEach((m) => blocks.push({ d: m.d, s: m.s, e: m.e, code: c.code, name: c.name })));
  (sc.existing || []).forEach((m) => blocks.push({ d: m.d, s: m.s, e: m.e, code: m.label || 'Existing', name: 'Already registered' }));
  return blocks.sort((a, b) => a.d - b.d || a.s - b.s);
}

export function planCsv(cur, sc, view) {
  const head = ['Status', 'Code', 'Course', 'Credits', 'Meetings', 'Priority', 'Reason'];
  const body = planRows(cur, sc).map((r) => [
    STATUS[r.kind] || r.kind,
    r.c.code,
    r.c.name,
    r.c.cr,
    r.c.meetings.map(fmtM).join(' / '),
    r.c.prio,
    r.reason,
  ]);
  const lines = [head, ...body].map((row) => row.map(cell).join(','));
  /* BOM so spreadsheets read the file as UTF-8 */
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

export function downloadFile(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Opens a self contained report in a new tab and sends it to the print dialog,
   so the user can save it as a PDF. Returns false when the popup was blocked. */
export function openPlanReport(cur, sc, view) {
  const rows = planRows(cur, sc);
  const acc = rows.filter((r) => r.kind === 'accepted');
  const rest = rows.filter((r) => r.kind !== 'accepted');
  const wanted = rows.length;
  const algo = algoName(view);
  const stamp = new Date().toLocaleString();

  const accRows = acc.map((r) => `<tr>
    <td class="mono"><b>${esc(r.c.code)}</b></td><td>${esc(r.c.name)}</td>
    <td class="num">${r.c.cr}</td><td class="mono">${esc(r.c.meetings.map(fmtM).join(' / '))}</td>
    <td class="num">${r.c.prio}</td></tr>`).join('');

  const restRows = rest.map((r) => `<tr>
    <td class="mono"><b>${esc(r.c.code)}</b></td><td>${esc(r.c.name)}</td>
    <td>${esc(STATUS[r.kind] || r.kind)}</td><td>${esc(r.reason)}</td></tr>`).join('');

  const week = weekBlocks(cur, sc);
  const weekRows = week.map((b) => `<tr>
    <td>${DAYS[b.d]}</td><td class="mono">${fmtT(b.s)}–${fmtT(b.e)}</td>
    <td class="mono"><b>${esc(b.code)}</b></td><td>${esc(b.name)}</td></tr>`).join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Course Registration Optimizer, ${esc(algo)} plan</title>
<style>
  *{box-sizing:border-box}
  body{font:13px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif;color:#0F172A;margin:0;padding:26px 30px}
  h1{font-size:20px;margin:0 0 3px}
  .sub{color:#64748B;font-size:12px;margin:0 0 18px}
  .meta{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:6px}
  .meta div{border:1px solid #E2E8F0;border-radius:9px;padding:8px 13px;min-width:120px}
  .meta b{display:block;font-size:17px;line-height:1.2}
  .meta span{font-size:11px;color:#64748B}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:#2563EB;margin:24px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{text-align:left;padding:6px 9px;border-bottom:1px solid #E2E8F0;vertical-align:top}
  th{color:#64748B;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
  td.num,th.num{text-align:right}
  .mono{font-family:ui-monospace,Menlo,Consolas,monospace}
  .none{color:#64748B;font-size:12px}
  footer{margin-top:26px;padding-top:10px;border-top:1px solid #E2E8F0;color:#64748B;font-size:11px}
  @page{margin:14mm}
</style></head>
<body>
<h1>Course Registration Optimizer</h1>
<p class="sub">${esc(algo)} schedule · generated ${esc(stamp)}</p>
<div class="meta">
  <div><b>${cur.credits} / ${sc.maxCr}</b><span>Credits${sc.minCr ? ` (minimum ${sc.minCr})` : ''}</span></div>
  <div><b>${cur.score}</b><span>Priority score</span></div>
  <div><b>${acc.length} / ${wanted}</b><span>Requests accepted</span></div>
</div>

<h2>Accepted courses</h2>
${acc.length
  ? `<table><thead><tr><th>Code</th><th>Course</th><th class="num">Cr</th><th>Meetings</th><th class="num">Priority</th></tr></thead><tbody>${accRows}</tbody></table>`
  : '<p class="none">No course was accepted.</p>'}

<h2>Not accepted</h2>
${rest.length
  ? `<table><thead><tr><th>Code</th><th>Course</th><th>Status</th><th>Reason</th></tr></thead><tbody>${restRows}</tbody></table>`
  : '<p class="none">Every requested course was accepted.</p>'}

<h2>Weekly schedule</h2>
${week.length
  ? `<table><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Title</th></tr></thead><tbody>${weekRows}</tbody></table>`
  : '<p class="none">No classes on the timetable.</p>'}

<footer>Interval overlap rule: A and B clash when A.start &lt; B.end and B.start &lt; A.end. Back-to-back classes are allowed.</footer>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 300);
  return true;
}
