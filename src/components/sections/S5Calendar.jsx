import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';

export function S5Calendar({ d }) {
  const si = d.surpriseIndex || 0;
  const siPct   = Math.min(Math.max((si + 50) / 100, 0), 1) * 100;
  const siColor = si > 10 ? 'var(--teal)' : si < -10 ? 'var(--red)' : 'var(--gold)';
  const siDesc  = si > 15 ? 'Data beating expectations' : si < -15 ? 'Data consistently missing' : 'Near neutral';

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={5} title="Economic Calendar & Consensus Expectations" />

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Markets move on <strong style={{ color: 'var(--ink)' }}>surprises relative to consensus</strong>, not on the absolute data. Know the consensus before a release.
      </div>

      <div className="si-bar">
        <span className="si-lbl">ECONOMIC SURPRISE INDEX</span>
        <div className="si-track">
          <div className="si-mkr" style={{ left: `${siPct}%`, background: siColor }} />
        </div>
        <span className="si-val" style={{ color: siColor }}>{si > 0 ? '+' : ''}{si}</span>
        <span className="si-desc">{siDesc}</span>
      </div>

      <Card style={{ overflowX: 'auto' }}>
        <table className="cal-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>EVENT</th>
              <th>PRIOR / FORECAST</th>
              <th>TRADE TRIGGER</th>
            </tr>
          </thead>
          <tbody>
            {d.weekAhead?.map((e, i) => (
              <tr key={i}>
                <td className="cal-date">{e.date}</td>
                <td>
                  <div className="cal-event">{e.event}</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`cal-imp-pill ${e.impact}`}>{e.impact.toUpperCase()}</span>
                  </div>
                </td>
                <td>
                  <div className="consensus-cell">
                    <span className="cons-prior">PRIOR: {e.prior}</span>
                    <span className="cons-fcst">FCST: {e.consensus}</span>
                  </div>
                </td>
                <td className="cal-trigger">{e.trigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
