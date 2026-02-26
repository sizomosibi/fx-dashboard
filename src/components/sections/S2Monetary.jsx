import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';

export function S2Monetary({ d }) {
  const rateIsHike = d.rateChange?.startsWith('+');
  const rateIsHold = d.rateChange === '0.00%';
  const changeClass = rateIsHold ? 'hold' : rateIsHike ? 'hike' : 'cut';
  const changeLabel = rateIsHold ? 'ON HOLD' : rateIsHike ? `HIKED ${d.rateChange}` : `CUT ${d.rateChange}`;

  const rateAnnotation = d.rateSrc === 'live'
    ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#4fc3a1', marginLeft: '0.5rem' }}>● LIVE · AUTO-FETCHED</span>
    : d.rateSrc === 'manual'
    ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--gold2)', marginLeft: '0.5rem' }}>● MANUAL OVERRIDE</span>
    : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#e05c5c', marginLeft: '0.5rem' }} title="Update in ⚙ settings">⚠ HARDCODED · UPDATE IN ⚙</span>;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={2} title="Monetary Policy & Central Bank Guidance" />

      <div className="cb-block">
        <div className="cb-top">
          <div className="cb-left">
            <div className="cb-flag-big">{d.flag}</div>
            <div className="cb-name-small">{d.centralBank?.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.3rem' }}>
              <div className="cb-rate-big">{d.interestRate}</div>
              {rateAnnotation}
            </div>
            <div className="cb-rate-lbl">BENCHMARK RATE <Dot src={d.rateSrc} /></div>
            <div className={`cb-change ${changeClass}`}>{changeLabel}</div>
          </div>
          <div className="cb-right">
            <div className="cb-path-lbl">RATE PATH PROJECTION</div>
            <div className="rate-path-row">
              {d.ratePath?.map((v, i) => (
                <span key={i}>
                  <div className="rp-item">
                    <div className={`rp-dot${i === 1 ? ' current' : ' projected'}`} />
                    <div className="rp-val">{v}</div>
                    <div className="rp-lbl">{d.ratePathLabels?.[i]}</div>
                  </div>
                  {i < d.ratePath.length - 1 && <div className="rp-line" />}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="cb-bias-block">
          <div className="cb-bias-lbl">POLICY BIAS</div>
          <div className={`cb-bias-tag ${d.bias}`}>{d.bias?.toUpperCase()}</div>
        </div>
      </div>

      <Card label="RECENT GUIDANCE — CB SPEECHES">
        {d.cbSpeeches?.map((s, i) => (
          <div key={i} className="speech-card">
            <div className="sp-head">
              <div>
                <span className="sp-name">{s.speaker}</span>
                <span className="sp-date">{s.date}</span>
              </div>
              <span className="sp-ven">{s.venue || ''}</span>
            </div>
            <div className="sp-quote">"{s.text}"</div>
            <div className="sp-impl">{s.implication}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
