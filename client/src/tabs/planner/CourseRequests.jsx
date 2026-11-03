import { useState } from 'react';
import { DAYS, fmtM, meetingsOverlap } from '../../lib/engine.js';
import { hueVar, PILL, M } from '../../lib/utils.js';

function CourseRow({ course, sc, effPrio, status, index, canRemove, actions }) {
  const p = PILL[status.kind];
  const dd = effPrio - course.prio;
  return (
    <div className={'crow' + (course.want ? '' : ' off')} style={{ '--hue': hueVar(index) }}>
      <input type="checkbox" checked={course.want} aria-label={`Request ${course.code} ${course.name}`} onChange={() => actions.toggleWant(course.code)} />
      <div className="cinfo">
        <div className="ct"><span className="cdot" /><b>{course.code}</b><span className="cname">{course.name}</span></div>
        <div className="cmeta"><span>{course.cr} credits</span><span className="mono">{course.meetings.map(fmtM).join(' · ')}</span></div>
        <div className="pre">
          {course.pre.length
            ? course.pre.map(pp => <span key={pp} className={'ptag ' + (sc.done.includes(pp) ? 'met' : 'unmet')}>{sc.done.includes(pp) ? '✓' : '!'} needs {pp}</span>)
            : <span className="ptag">no prerequisites</span>}
        </div>
      </div>
      <div className="side">
        <span className={'pill ' + p[0]} title={status.reason}>{p[1]}</span>
        {canRemove && <button className="rm" type="button" onClick={() => actions.removeCourse(course.code)}>Remove</button>}
      </div>
      <div className="cctl">
        <div className="field">
          <label htmlFor={'seats-' + course.code}>Seats left</label>
          <input id={'seats-' + course.code} type="number" min="0" max="999" value={course.seats} onChange={e => actions.setSeats(course.code, e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={'prio-' + course.code}>Priority</label>
          <div className="prio">
            <input id={'prio-' + course.code} type="range" min="0" max="100" value={course.prio} onChange={e => actions.setPrio(course.code, e.target.value)} />
            <output>{course.prio}</output>
            {dd ? <span className="padj">{(dd > 0 ? '+' : '') + dd} pref</span> : <span className="padj" />}
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY = { code: '', name: '', cr: '3', seats: '20', pre: '', d1: '1', s1: '9', e1: '10', d2: '-1', s2: '9', e2: '10' };

function AddCourseForm({ sc, actions, toast }) {
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase().replace(/\s+/g, '');
    const name = f.name.trim() || code;
    const cr = +f.cr;
    const seats = Math.max(0, parseInt(f.seats || '0', 10) || 0);
    const pre = f.pre.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);

    if (sc.courses.length >= 8) return setErr('Eight courses is the limit, so every course keeps its own colour. Remove one first.');
    if (!/^[A-Z0-9-]{2,8}$/.test(code)) return setErr('Use 2 to 8 letters, digits or dashes for the code, for example CS501.');
    if (sc.courses.some(c => c.code === code)) return setErr(code + ' is already in the list.');
    if (!(cr >= 1 && cr <= 6)) return setErr('Credits must be between 1 and 6.');

    const mt = [];
    const d1 = +f.d1, s1 = +f.s1, e1 = +f.e1;
    if (!(s1 >= 7 && e1 <= 20 && s1 < e1)) return setErr('First meeting: start must be before end, between 07:00 and 20:00.');
    mt.push(M(d1, s1, e1));
    const d2 = +f.d2;
    if (d2 >= 0) {
      const s2 = +f.s2, e2 = +f.e2;
      if (!(s2 >= 7 && e2 <= 20 && s2 < e2)) return setErr('Second meeting: start must be before end, between 07:00 and 20:00.');
      if (meetingsOverlap(M(d1, s1, e1), M(d2, s2, e2))) return setErr('The two meetings of one course overlap.');
      mt.push(M(d2, s2, e2));
    }

    setErr('');
    actions.addCourse({ code, name, cr, pre, seats, cap: Math.max(seats, 20), prio: 50, want: true, meetings: mt });
    setF(EMPTY);
    toast(code + ' added');
  };

  return (
    <details className="addc">
      <summary>Add your own course</summary>
      <form onSubmit={submit} autoComplete="off">
        <div className="grid-fields">
          <div className="field"><label htmlFor="ac-code">Code</label><input id="ac-code" type="text" placeholder="CS501" maxLength={8} value={f.code} onChange={set('code')} /></div>
          <div className="field"><label htmlFor="ac-name">Name</label><input id="ac-name" type="text" placeholder="Cloud Computing" maxLength={28} value={f.name} onChange={set('name')} /></div>
          <div className="field"><label htmlFor="ac-cr">Credits</label><input id="ac-cr" type="number" min="1" max="6" value={f.cr} onChange={set('cr')} /></div>
          <div className="field"><label htmlFor="ac-seats">Seats left</label><input id="ac-seats" type="number" min="0" max="999" value={f.seats} onChange={set('seats')} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="ac-pre">Prerequisites (codes separated by commas)</label><input id="ac-pre" type="text" placeholder="CS201, MA201" value={f.pre} onChange={set('pre')} /></div>
        </div>

        <div className="lbl" style={{ margin: '12px 0 6px' }}>Meetings, 24 hour clock (half hours allowed, e.g. 10.5)</div>
        <div className="mrow">
          <select aria-label="Day of first meeting" value={f.d1} onChange={set('d1')}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>
          <input type="number" min="7" max="20" step="0.5" aria-label="First meeting start" value={f.s1} onChange={set('s1')} />
          <span>to</span>
          <input type="number" min="7" max="20" step="0.5" aria-label="First meeting end" value={f.e1} onChange={set('e1')} />
        </div>
        <div className="mrow">
          <select aria-label="Day of second meeting" value={f.d2} onChange={set('d2')}>
            <option value="-1">No second meeting</option>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input type="number" min="7" max="20" step="0.5" aria-label="Second meeting start" value={f.s2} onChange={set('s2')} />
          <span>to</span>
          <input type="number" min="7" max="20" step="0.5" aria-label="Second meeting end" value={f.e2} onChange={set('e2')} />
        </div>

        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" type="submit" style={{ marginTop: 12 }}>Add course</button>
      </form>
    </details>
  );
}

export default function CourseRequests({ sc, effSc, status, actions, toast }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="eyebrow">Step 2</div>
          <h2>Course requests</h2>
          <p className="sub">Tick what you want, set seats left and a priority. Results update as you type.</p>
        </div>
      </div>
      <div className="rows">
        {sc.courses.map((c, i) => (
          <CourseRow
            key={c.code}
            course={c}
            sc={sc}
            effPrio={effSc.courses[i].prio}
            status={status[c.code] || { kind: 'idle', reason: 'Not requested' }}
            index={i}
            canRemove={sc.courses.length > 1}
            actions={actions}
          />
        ))}
      </div>
      <AddCourseForm sc={sc} actions={actions} toast={toast} />
    </div>
  );
}
