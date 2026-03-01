import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';

export function S4External({ d }) {
  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={4} title="External Sector — Trade Partners & Commodity Flows" />

      <Card label="MAJOR TRADING PARTNERS & CURRENT IMPACT">
        {d.partners?.map((p, i) => (
          <div key={i} className="partner-row">
            <div className="partner-l">
              <span className="p-flag">{p.flag}</span>
              <div>
                <div>
                  <span className="p-name">{p.name}</span>
                  <span className="p-share">{p.share} of trade</span>
                </div>
                <div className="p-comm">{p.commodity}</div>
                <div className="p-note">{p.note}</div>
              </div>
            </div>
            <span className={`imp-pill ${p.impact}`}>{p.impact.toUpperCase()}</span>
          </div>
        ))}
      </Card>

      <Card label="KEY COMMODITY EXPOSURES">
        <div className="comm-row">
          {d.commodities?.map((c, i) => (
            <div key={i} className="comm-chip">
              <span className="comm-icon">{c.icon}</span>
              <div>
                <span className="comm-n">{c.name}</span>
                <div className={`comm-d ${c.dir}`}>{c.dir.toUpperCase()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
