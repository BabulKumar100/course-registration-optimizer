import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import Hint from '../../components/Hint.jsx';

const DAY_OPTS = [['-1', 'No day'], ['0', 'Monday'], ['1', 'Tuesday'], ['2', 'Wednesday'], ['3', 'Thursday'], ['4', 'Friday']];

export default function RulesPanel({ sc, pref, objective, scenarioKey, actions, toast }) {
  const [confirming, setConfirming] = useState(false);

  const doReset = () => {
    setConfirming(false);
    actions.reset();
    toast('Scenario reset');
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Step 1</div>
          <h2>Student and rules</h2>
        </div>
        <button className="btn ghost small" type="button" onClick={() => setConfirming(true)}>Reset scenario</button>
      </div>

      <div className="grid-fields">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="scenario">Scenario<Hint tip="<b>Scenario</b>One of three prepared examples, each with its own offerings, prerequisites and rules. Switching discards every change you have made." /></label>
          <select id="scenario" value={scenarioKey} onChange={e => actions.loadScenario(e.target.value)}>
            <option value="default">Autumn semester, 8 offerings</option>
            <option value="ppt">Presentation example, conflict detection</option>
            <option value="dry">Report dry run, 3 requests</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="minCr">Minimum credits<Hint tip="<b>Minimum credits</b>The plan should reach this total. Only backtracking enforces it, which is why greedy can finish below the minimum and the result card warns you." /></label>
          <input id="minCr" type="number" min="0" max="30" step="1" value={sc.minCr} onChange={e => actions.setMinCr(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="maxCr">Maximum credits<Hint tip="<b>Maximum credits</b>A hard ceiling for both algorithms. A course is rejected when adding it would push the total past this limit." /></label>
          <input id="maxCr" type="number" min="1" max="30" step="1" value={sc.maxCr} onChange={e => actions.setMaxCr(e.target.value)} />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="objective">Backtracking maximises<Hint tip="<b>What backtracking maximises</b>Total priority score adds up the priority of the accepted courses. Total credits simply adds their credits. Greedy always follows priority order either way." /></label>
          <select id="objective" value={objective} onChange={e => actions.setObjective(e.target.value)}>
            <option value="score">Total priority score</option>
            <option value="credits">Total credits</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="todPref">Time of day preference<Hint tip="<b>Time of day</b>A course counts as morning when every meeting starts before 12:00, and afternoon when every meeting starts at 12:00 or later. Matching courses gain 8 priority points, the opposite lose 8." /></label>
          <select id="todPref" value={pref.tod} onChange={e => actions.setPref(p => ({ ...p, tod: e.target.value }))}>
            <option value="none">No preference</option>
            <option value="am">Prefer mornings</option>
            <option value="pm">Prefer afternoons</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="freeDay">Keep this day free<Hint tip="<b>Keep a day free</b>Any course that meets on the chosen day loses 15 priority points. It is a nudge, not a ban, so the course can still be accepted when nothing better is available." /></label>
          <select id="freeDay" value={pref.free} onChange={e => actions.setPref(p => ({ ...p, free: +e.target.value }))}>
            {DAY_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <p className="sub" style={{ gridColumn: '1 / -1' }}>
          Preferences nudge priorities by 8 points for time of day and 15 points for a day you want free.
          Prerequisites, credits, clashes and seats are never relaxed.
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="lbl" style={{ marginBottom: 7 }}>Completed courses (unlock prerequisites)<Hint tip="<b>Completed courses</b>A prerequisite is only satisfied by a code marked here. Turn a chip on once that course has been passed, and the courses that need it become eligible." /></div>
        {sc.pool.length ? (
          <div className="chips">
            {sc.pool.map(code => (
              <button key={code} type="button" className="chip" aria-pressed={sc.done.includes(code)} onClick={() => actions.toggleDone(code)}>{code}</button>
            ))}
          </div>
        ) : (
          <span className="sub">This scenario has no prerequisites.</span>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="switch">
          <input type="checkbox" checked={sc.waitlist} onChange={e => actions.setWaitlist(e.target.checked)} />
          <span className="tr" />Waitlist full sections<Hint tip="<b>Waitlist full sections</b>When a section has no seats left, the request is waitlisted instead of rejected. Turn this off to see it rejected outright." />
        </label>
      </div>

      {confirming && (
        <Modal title="Reset this scenario?" onClose={() => setConfirming(false)}>
          <p className="sub">
            Every change you made will be discarded: course selections, seats, priorities, credit limits and preferences
            go back to the scenario's original values.
          </p>
          <div className="tools" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn ghost small" type="button" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn small" type="button" onClick={doReset}>Reset scenario</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
