import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { const t = localStorage.getItem('cro-theme'); if (t === 'dark' || t === 'light') return t; } catch (e) { /* ignore */ }
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cro-theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}
