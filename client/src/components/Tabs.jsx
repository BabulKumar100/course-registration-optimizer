const TABS = [
  ['planner', 'Planner'],
  ['graph', 'Conflict graph'],
  ['batch', 'Batch simulation'],
  ['analysis', 'Analysis'],
];

export default function Tabs({ tab, onChange }) {
  const idx = Math.max(0, TABS.findIndex(t => t[0] === tab));
  return (
    <nav className="tabs" style={{ '--count': TABS.length, '--idx': idx }} role="tablist" aria-label="Sections">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === id}
          aria-controls={'v-' + id}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
