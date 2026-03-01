import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';

// ── Skeleton for loading state ──────────────────────────────────────
function SpeechSkeleton() {
  return (
    <div className="speech-card" style={{ opacity: 0.4 }}>
      <div style={{ height: '0.75rem', background: '#222', borderRadius: 2, width: '40%', marginBottom: '0.5rem' }} />
      <div style={{ height: '0.7rem',  background: '#1a1a1a', borderRadius: 2, width: '90%', marginBottom: '0.3rem' }} />
      <div style={{ height: '0.7rem',  background: '#1a1a1a', borderRadius: 2, width: '75%', marginBottom: '0.3rem' }} />
      <div style={{ height: '0.7rem',  background: '#1a1a1a', borderRadius: 2, width: '55%' }} />
    </div>
  );
}

// ── AI badge ────────────────────────────────────────────────────────
function AIBadge({ source, generatedAt, onRefresh }) {
  const ts = generatedAt
    ? new Date(generatedAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })
    : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)', letterSpacing: '0.08em' }}>
        ⚡ AI · {source === 'cache' ? `CACHED ${ts}` : `LIVE ${ts || ''}`}
      </span>
      <button
        onClick={onRefresh}
        title="Regenerate with current data"
        style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', padding: '0.1rem 0.4rem', cursor: 'pointer', borderRadius: 2 }}
      >↺ REFRESH</button>
    </div>
  );
}

export function S2Monetary({ d, brief }) {
  const rateIsHike  = d.rateChange?.startsWith('+');
  const rateIsHold  = d.rateChange === '0.00%';
  const changeClass = rateIsHold ? 'hold' : rateIsHike ? 'hike' : 'cut';
  const changeLabel = rateIsHold ? 'ON HOLD' : rateIsHike ? `HIKED ${d.rateChange}` : `CUT ${d.rateChange}`;

  const rateAnnotation = d.rateSrc === 'live'
    ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#4fc3a1', marginLeft: '0.5rem' }}>● LIVE · AUTO-FETCHED</span>
    : d.rateSrc === 'manual'
    ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--gold2)', marginLeft: '0.5rem' }}>● MANUAL OVERRIDE</span>
    : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#e05c5c', marginLeft: '0.5rem' }} title="Update in ⚙ settings">⚠ HARDCODED · UPDATE IN ⚙</span>;

  // Use AI speeches if available, fall back to static data
  const speeches      = brief?.brief?.cbSpeeches ?? d.cbSpeeches;
  const isAI          = !!brief?.brief?.cbSpeeches;
  const isLoading     = brief?.loading;

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
        {isAI && (
          <AIBadge source={brief.source} generatedAt={brief.generatedAt} onRefresh={brief.refresh} />
        )}
        {isLoading && <SpeechSkeleton />}
        {!isLoading && speeches?.map((s, i) => (
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
