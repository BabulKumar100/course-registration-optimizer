import RulesPanel from './planner/RulesPanel.jsx';
import CourseRequests from './planner/CourseRequests.jsx';
import SummaryCard from './planner/SummaryCard.jsx';
import Timetable from './planner/Timetable.jsx';
import { CompareCard, HoursCard } from './planner/SideCards.jsx';
import CombosCard from './planner/CombosCard.jsx';
import PipelineCard from './planner/PipelineCard.jsx';
import DecisionsCard from './planner/DecisionsCard.jsx';
import ReplayCard from './planner/ReplayCard.jsx';

export default function PlannerTab({ opt, toast }) {
  const { sc, effSc, pref, objective, view, altRank, combos, G, B, cur, key, actions } = opt;
  return (
    <div className="planner">
      <div className="col">
        <RulesPanel sc={sc} pref={pref} objective={objective} scenarioKey={key} actions={actions} toast={toast} />
        <CourseRequests sc={sc} effSc={effSc} status={cur.status} actions={actions} toast={toast} />
      </div>
      <div className="col">
        <SummaryCard sc={sc} cur={cur} G={G} B={B} view={view} altRank={altRank} combos={combos} setView={actions.setView} toast={toast} />
        <Timetable sc={sc} cur={cur} />
        <div className="two">
          <CompareCard G={G} B={B} />
          <HoursCard sc={sc} cur={cur} />
        </div>
        <CombosCard sc={sc} combos={combos} view={view} altRank={altRank} objective={objective} onPreview={actions.previewCombo} />
        <PipelineCard sc={sc} G={G} />
        <DecisionsCard sc={sc} effSc={effSc} cur={cur} view={view} altRank={altRank} />
        <ReplayCard B={B} sc={sc} objective={objective} />
      </div>
    </div>
  );
}
