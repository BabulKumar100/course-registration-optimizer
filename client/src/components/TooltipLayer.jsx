import { useEffect, useRef } from 'react';

/* Single global tooltip. Any element carrying a data-tip attribute shows its HTML on hover. */
export default function TooltipLayer() {
  const ref = useRef(null);

  useEffect(() => {
    const tip = ref.current;
    let el = null;
    const move = (e) => {
      const r = tip.getBoundingClientRect();
      let x = e.clientX + 14, y = e.clientY + 14;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top = Math.max(8, y) + 'px';
    };
    const show = (t, e) => { el = t; tip.innerHTML = t.getAttribute('data-tip'); tip.hidden = false; move(e); };
    const onMove = (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (t) { if (el !== t) show(t, e); else move(e); }
      else if (el) { el = null; tip.hidden = true; }
    };
    const onDown = (e) => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) show(t, e); };
    const onFocus = (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (t) { const r = t.getBoundingClientRect(); show(t, { clientX: r.left, clientY: r.bottom }); }
    };
    const onBlur = () => { el = null; tip.hidden = true; };
    const onScroll = () => { el = null; tip.hidden = true; };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  return <div className="tip" ref={ref} hidden />;
}
