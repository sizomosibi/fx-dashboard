import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { useLiveData, useCurrentCcy } from '../../context/AppContext.jsx';
import { useCalendarEnrich } from '../../hooks/useCalendarEnrich.js';

function ImpactPill({ impact }) {
  return (
    <span className={`cal-imp-pill ${impact}`}>
      {(impact || 'low').toUpperCase()}
    </span>
  );
}

function ActualBadge({ actual, forecast }) {
  if (!actual || actual === '—') return null;
  const fNum = parseFloat(forecast);
  const aNum = parseFloat(actual);
  const beat = !isNaN(fNum) && !isNaN(aNum) ? aNum > fNum : null;
  const color = beat === true ? 'var(--teal)' : beat === false ? 'var(--red)' : 'var(--gold)';
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.7rem', color,
      background: `${color}18`, border: `1px solid ${color}44`,
      padding: '0.08rem 0.3rem', marginLeft: '0.35rem',
    }}>
      ACT {actual}
    </span>
  );
}

// Direction badge rendered alongside AI trigger
function DirectionBadge({ direction }) {
  if (!direction || direction === 'neutral') return null;
  const color = direction === 'bullish' ? 'var(--teal)' : 'var(--red)';
  const label = direction === 'bullish' ? '▲ BULLISH BIAS' : '▼ BEARISH BIAS';
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.62rem', color,
      background: `${color}18`, border: `1px solid ${color}44`,
      padding: '0.05rem 0.3rem', marginLeft: '0.4rem',
    }}>
      {label}
    </span>
  );
}

// Live row — shows AI trigger when available, skeleton while enriching
function LiveRow({ e, triggerData, enriching }) {
  const hasActual   = e.actual && e.actual !== '—' && e.actual !== '';
  const isReleased  = hasActual;
  const needsTrigger = !isReleased && (e.impact === 'high' || e.impact === 'medium');

  let triggerContent;
  if (isReleased) {
    triggerContent = (
      <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
        Released: {e.actual}
      </span>
    );
  } else if (triggerData) {
    triggerContent = (
      <>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.65rem',
          color: 'var(--teal)',
          display: 'block',
          marginBottom: '0.2rem',
          letterSpacing: '0.05em',
        }}>
          ⚡ AI TRIGGER <DirectionBadge direction={triggerData.direction} />
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5 }}>
          {triggerData.trigger}
        </span>
      </>
    );
  } else if (needsTrigger && enriching) {
    triggerContent = (
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.68rem', color: '#444',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          borderRadius: '50%', background: 'var(--gold)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
        GENERATING TRIGGER...
      </span>
    );
  } else {
    triggerContent = (
      <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.84rem' }}>
        Watch for surprise vs consensus
      </span>
    );
  }

  return (
    <tr style={isReleased ? { opacity: 0.65 } : {}}>
      <td>
        <div className="cal-date">{e.date}</div>
        {e.time && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#444', marginTop: '0.1rem' }}>
            {e.time}
          </div>
        )}
      </td>
      <td>
        <div className="cal-event">
          {e.event}
          <ActualBadge actual={e.actual} forecast={e.forecast} />
        </div>
        <div style={{ marginTop: '0.2rem' }}>
          <ImpactPill impact={e.impact} />
        </div>
      </td>
      <td>
        <div className="consensus-cell">
          <span className="cons-prior">PRIOR: {e.previous || '—'}</span>
          <span className="cons-fcst" style={{ color: e.actual ? 'var(--muted)' : 'var(--ink)' }}>
            FCST: {e.forecast || '—'}
          </span>
        </div>
      </td>
      <td className="cal-trigger">
        {triggerContent}
      </td>
    </tr>
  );
}

// Static/hardcoded row — from currencies.js weekAhead (fallback only)
function StaticRow({ e }) {
  return (
    <tr>
      <td className="cal-date">{e.date}</td>
      <td>
        <div className="cal-event">{e.event}</div>
        <div style={{ marginTop: '0.2rem' }}>
          <ImpactPill impact={e.impact} />
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
  );
}

export function S5Calendar({ d }) {
  const live = useLiveData();
  const cur  = useCurrentCcy();

  const calSrc     = live.status.calendar;
  const isLive     = calSrc === 'live';
  const liveEvents = isLive ? (live.calendar[cur] || []) : null;

  // AI enrichment — fires once when live events arrive, re-runs on currency change
  const { triggers, enriching, enriched, error: enrichError, refresh } =
    useCalendarEnrich(liveEvents, cur, isLive);

  // Sort: unreleased first, then by date
  const sortedLive = liveEvents
    ? [...liveEvents].sort((a, b) => {
        const aRel = !!(a.actual && a.actual !== '—');
        const bRel = !!(b.actual && b.actual !== '—');
        if (aRel !== bRel) return aRel ? 1 : -1;
        return new Date(a.isoDate || 0) - new Date(b.isoDate || 0);
      })
    : null;

  const highCount    = sortedLive?.filter(e => e.impact === 'high' && !e.actual).length || 0;
  const pendingCount = sortedLive?.filter(e => !e.actual && (e.impact === 'high' || e.impact === 'medium')).length || 0;

  const si      = d.surpriseIndex || 0;
  const siPct   = Math.min(Math.max((si + 50) / 100, 0), 1) * 100;
  const siColor = si > 10 ? 'var(--teal)' : si < -10 ? 'var(--red)' : 'var(--gold)';
  const siDesc  = si > 15 ? 'Data beating expectations' : si < -15 ? 'Data consistently missing' : 'Near neutral';

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={5} title="Economic Calendar & Consensus Expectations" />

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <Dot src={calSrc} />
        {isLive ? (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--teal)' }}>
            LIVE — ForexFactory · Medium &amp; high impact only
          </span>
        ) : (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
            Hardcoded baseline — live calendar loads on Netlify deployment
          </span>
        )}
        {isLive && highCount > 0 && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem',
            color: 'var(--red)', background: 'rgba(208,90,74,0.1)',
            border: '1px solid rgba(208,90,74,0.25)', padding: '0.08rem 0.4rem',
          }}>
            {highCount} HIGH IMPACT UPCOMING
          </span>
        )}

        {/* AI enrichment status */}
        {isLive && pendingCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
            {enriching && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--gold)' }}>
                ⚡ AI generating {pendingCount} triggers...
              </span>
            )}
            {enriched && !enriching && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)' }}>
                ⚡ AI triggers ready
              </span>
            )}
            {enrichError && !enriching && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--red)' }}
                    title={enrichError}>
                ⚡ AI unavailable
              </span>
            )}
            <button
              onClick={refresh}
              disabled={enriching}
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem',
                color: enriching ? '#444' : 'var(--gold)',
                background: 'transparent', border: '1px solid currentColor',
                padding: '0.1rem 0.45rem', cursor: enriching ? 'default' : 'pointer',
              }}
            >
              {enriching ? '...' : '↻ REFRESH'}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Markets move on <strong style={{ color: 'var(--ink)' }}>surprises relative to consensus</strong>, not absolute data.
        {enriched && (
          <span style={{ color: 'var(--teal)', marginLeft: '0.5rem' }}>
            AI-generated trade triggers shown for upcoming events.
          </span>
        )}
      </div>

      {/* Surprise index */}
      <div className="si-bar">
        <span className="si-lbl">ECONOMIC SURPRISE INDEX</span>
        <div className="si-track">
          <div className="si-mkr" style={{ left: `${siPct}%`, background: siColor }} />
        </div>
        <span className="si-val" style={{ color: siColor }}>{si > 0 ? '+' : ''}{si}</span>
        <span className="si-desc">{siDesc}</span>
      </div>

      {/* Calendar table */}
      <Card style={{ overflowX: 'auto' }}>
        {isLive && liveEvents?.length === 0 ? (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: '#444', padding: '0.5rem 0', textAlign: 'center' }}>
            No medium or high impact events for {cur} this week or next
          </div>
        ) : (
          <table className="cal-table">
            <thead>
              <tr>
                <th>DATE / TIME</th>
                <th>EVENT</th>
                <th>PRIOR / FORECAST</th>
                <th>
                  {isLive
                    ? <>TRADE TRIGGER <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--teal)', fontWeight: 400 }}>⚡ AI</span></>
                    : 'TRADE TRIGGER'
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {isLive
                ? sortedLive?.map((e, i) => (
                    <LiveRow
                      key={i}
                      e={e}
                      triggerData={triggers[e.event]}
                      enriching={enriching}
                    />
                  ))
                : d.weekAhead?.map((e, i) => <StaticRow key={i} e={e} />)
              }
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
