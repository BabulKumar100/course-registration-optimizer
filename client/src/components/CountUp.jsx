import { useEffect, useRef, useState } from 'react';

/* Animates a number from its previous value to the new one, easing out. */
export default function CountUp({ value, duration = 500, format = (n) => Math.round(n).toLocaleString() }) {
  const [shown, setShown] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    const from = ref.current, to = value;
    if (from === to) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { ref.current = to; setShown(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * (1 - Math.pow(1 - t, 3));
      ref.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { ref.current = to; setShown(to); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
