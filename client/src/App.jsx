import { useRef, useState } from 'react';
import { useTheme } from './hooks/useTheme.js';
import { useOptimizer } from './hooks/useOptimizer.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import Modal from './components/Modal.jsx';
import TooltipLayer from './components/TooltipLayer.jsx';
import PlannerTab from './tabs/PlannerTab.jsx';
import GraphTab from './tabs/GraphTab.jsx';
import BatchTab from './tabs/BatchTab.jsx';
import AnalysisTab from './tabs/AnalysisTab.jsx';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const opt = useOptimizer();
  const [tab, setTab] = useState('planner');
  const [dlg, setDlg] = useState(null);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = (text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  };

  return (
    <>
      <div className="app">
        <Header theme={theme} onToggleTheme={toggleTheme} onHelp={() => setDlg('help')} onAbout={() => setDlg('about')} />

        <div className="tabs-wrap">
          <Tabs tab={tab} onChange={setTab} />
        </div>

        <main id={'v-' + tab} role="tabpanel">
          {tab === 'planner' && <PlannerTab opt={opt} toast={toast} />}
          {tab === 'graph' && <GraphTab opt={opt} toast={toast} />}
          {tab === 'batch' && <BatchTab />}
          {tab === 'analysis' && <AnalysisTab />}
        </main>

        <p className="foot">
          Interval overlap rule: A and B clash when A.start &lt; B.end and B.start &lt; A.end. Back-to-back classes are allowed.
        </p>
      </div>

      {dlg === 'help' && (
        <Modal title="Getting started" onClose={() => setDlg(null)}>
          <p className="sub">Four short steps take you from a scenario to a defensible schedule.</p>
          <ol>
            <li><b>Pick a scenario and the rules.</b> Choose Default, PPT or Dry run, then set the minimum and maximum credits, the objective and any timetable preferences.</li>
            <li><b>Choose your courses.</b> Tick the requests you want, set the priority of each, and adjust seats. Add a custom course if it is missing.</li>
            <li><b>Read the recommended schedule.</b> The right side shows the plan, a credits meter, the weekly timetable and the Greedy vs Backtracking comparison.</li>
            <li><b>Explore the other tabs.</b> Conflict graph shows the overlap structure, Batch simulation scales to many students, and Analysis benchmarks both algorithms.</li>
          </ol>
          <div className="note"><span>i</span><span>Tip: hover any chart, node or pill for a tooltip with the exact numbers behind it.</span></div>
        </Modal>
      )}

      {dlg === 'about' && (
        <Modal title="About" onClose={() => setDlg(null)}>
          <p className="sub">Course Registration Optimizer turns a Design and Analysis of Algorithms study into a working tool.</p>
          <ul>
            <li><b>Greedy register</b> sorts requests by priority and accepts each feasible one in a single pass.</li>
            <li><b>Backtracking with pruning</b> searches for the best valid set of courses under a credit budget.</li>
            <li><b>Conflict graph</b> models courses as nodes and timetable overlaps as edges; a valid schedule is an independent set.</li>
            <li><b>Batch simulation</b> stresses the allocator with many students sharing limited seats and compares fairness.</li>
          </ul>
          <div className="note good"><span>✓</span><span>All numbers are computed live in your browser from the models above, no server involved.</span></div>
        </Modal>
      )}

      {msg && <div className="toast" role="status">{msg}</div>}
      <TooltipLayer />
    </>
  );
}
