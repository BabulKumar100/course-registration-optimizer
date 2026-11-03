const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export default function Header({ theme, onToggleTheme, onHelp, onAbout }) {
  const dark = theme === 'dark';
  return (
    <header className="top">
      <div className="brand">
        <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2563EB" /><stop offset="1" stopColor="#7C3AED" /></linearGradient></defs>
          <rect width="48" height="48" rx="14" fill="url(#lg)" />
          <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".9"><path d="M14 17 L34 14 M14 17 L22 33 M34 14 L22 33 M34 14 L35 32" /></g>
          <g fill="#fff"><circle cx="14" cy="17" r="4.2" /><circle cx="34" cy="14" r="4.2" /><circle cx="22" cy="33" r="4.2" /><circle cx="35" cy="32" r="3.4" opacity=".7" /></g>
        </svg>
        <div className="brand-text">
          <h1>Course Registration Optimizer</h1>
          <p>Smart Academic Scheduling</p>
        </div>
      </div>
      <div className="top-actions">
        <button className="icon-btn" type="button" onClick={onHelp}>Getting started</button>
        <button className="icon-btn" type="button" onClick={onAbout}>About</button>
        <button className="icon-btn" type="button" onClick={onToggleTheme} aria-pressed={dark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? SUN : MOON}<span>{dark ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
}
