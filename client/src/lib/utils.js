/* ================= small helpers ================= */

export const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

export const M = (d, s, e) => ({ d, s, e });

export const hueVar = (i) => `var(--s${i % 8 + 1})`;
export const onVar = (i) => `var(--on${i % 8 + 1})`;

/* tooltip row (html string, used inside data-tip content) */
export const trow = (k, v, c) => `<div class="r"><span>${c ? `<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${c};margin-right:6px"></span>` : ''}${esc(k)}</span><span>${esc(v)}</span></div>`;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* circle layout used by the conflict graph */
export function circleLayout(codes) {
  const pos = {}; const n = codes.length;
  codes.forEach((c, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pos[c] = { x: 360 + Math.cos(a) * (n <= 4 ? 150 : 195), y: 250 + Math.sin(a) * (n <= 4 ? 130 : 178) };
  });
  return pos;
}

export const PILL = { accepted: ['ok', '✓ Accepted'], waitlist: ['wl', '… Waitlisted'], rejected: ['no', '✕ Rejected'], idle: ['', '– Not requested'] };
