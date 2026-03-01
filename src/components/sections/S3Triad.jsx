import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';

function IndicatorRow({ item }) {
  const arrow = item.d === 'up' ? '▲' : item.d === 'down' ? '▼' : '—';
  const isLive = item.src === 'live';
  return (
    <div className="ind-row">
      <span className="ind-n">
        {item.n}
        {isLive && <Dot src="live" style={{ marginLeft: '4px' }} />}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
        <span className={`ind-v${isLive ? ' live-val' : ''}`}>{item.v}</span>
        <span className={`ind-c ${item.d}`}>
          {item.c} <span style={{ fontSize: '0.7rem' }}>{arrow}</span>
        </span>
      </div>
    </div>
  );
}

function SurpriseIndexBar({ index }) {
  if (index === undefined || index === null) return null;

  const capped   = Math.max(-100, Math.min(100, index));
  const isPos    = capped >= 0;
  const barWidth = `${Math.abs(capped) / 2}%`;   // max 50% each side → centred

  const label  = capped >= 25  ? 'STRONGLY BEATING' :
                 capped >= 5   ? 'BEATING EXPECTATIONS' :
                 capped >= -5  ? 'IN LINE' :
                 capped >= -25 ? 'MISSING EXPECTATIONS' :
                                 'STRONGLY MISSING';

  const colour = capped >= 5   ? 'var(--teal)' :
                 capped >= -5  ? 'var(--gold2)' :
                                 'var(--red)';

  return (
    <Card label="ECONOMIC SURPRISE INDEX">
      <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Measures whether recent data releases have beaten (+) or missed (−) market consensus.
        Positive = CB may stay tighter longer. Negative = CB has more room to cut.
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#444', marginLeft: '0.5rem' }}>
          Update via §11 Data Release mode.
        </span>
      </div>

      {/* Bar */}
      <div style={{ position: 'relative', height: '18px', background: 'var(--paper2)', border: '1px solid var(--rule2)', marginBottom: '0.4rem' }}>
        {/* Centre line */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--rule)', zIndex: 1 }} />
        {/* Fill */}
        <div style={{
          position: 'absolute',
          top: '2px', bottom: '2px',
          width: barWidth,
          left:  isPos ? '50%' : `calc(50% - ${barWidth})`,
          background: colour,
          borderRadius: 1,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#444' }}>−100</span>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.88rem', color: colour, fontWeight: 600 }}>
            {capped > 0 ? '+' : ''}{capped}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: colour, marginLeft: '0.5rem' }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#444' }}>+100</span>
      </div>
    </Card>
  );
}

export function S3Triad({ d }) {
  const triadSrc = d.triadSrc || 'stale';

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={3} title={`Economic Triad — ${d.name} Fundamental Drivers`} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem' }}>
        <Dot src={triadSrc} />
        {triadSrc === 'live'
          ? <span style={{ color: 'var(--teal)' }}>CPI + Unemployment updated via live data</span>
          : <span style={{ color: '#555' }}>Hardcoded baseline — updates automatically via weekly §11 Update Assistant</span>
        }
      </div>

      <div className="triad-grid">
        <Card>
          <div className="card-lbl triad-inf">🔥 INFLATION</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>
            Above target = CB hawkish pressure. Below = room to cut.
          </div>
          {d.triad?.inf?.map((item, i) => <IndicatorRow key={i} item={item} />)}
        </Card>
        <Card>
          <div className="card-lbl triad-gro">📈 GROWTH</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>
            Weak growth = dovish pressure. Stagflation = hardest scenario.
          </div>
          {d.triad?.gro?.map((item, i) => <IndicatorRow key={i} item={item} />)}
        </Card>
        <Card>
          <div className="card-lbl triad-emp">👷 EMPLOYMENT</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>
            Tight labour = wage inflation risk. Rising unemployment = CB cuts sooner.
          </div>
          {d.triad?.emp?.map((item, i) => <IndicatorRow key={i} item={item} />)}
        </Card>
      </div>

      {d.chains && (
        <Card label="CAUSE & EFFECT CHAINS">
          {d.chains.map((chain, i) => (
            <div key={i} className="chain-wrap">
              <div className="chain-lbl">SCENARIO {i + 1}</div>
              <div className="chain-steps">
                {chain.map((step, j) => (
                  <span key={j}>
                    <span className="cs">{step}</span>
                    {j < chain.length - 1 && <span className="ca">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      <SurpriseIndexBar index={d.surpriseIndex} />
    </>
  );
}
