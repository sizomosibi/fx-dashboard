import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { useLiveData, useCurrentCcy } from '../../context/AppContext.jsx';

// Impact colour helper
const IMP_COLOR = { high: 'var(--red)', medium: 'var(--gold)', low: 'var(--muted)' };

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
      fontSize: '0.7rem',
      color,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      padding: '0.08rem 0.3rem',
      marginLeft: '0.35rem',
    }}>
      ACT {actual}
    </span>
  );
}

// Live calendar row — from ForexFactory
function LiveRow({ e }) {
  const hasActual = e.actual && e.actual !== '—' && e.actual !== '';
  return (
    <tr style={hasActual ? { opacity: 0.7 } : {}}>
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
      <td className="cal-trigger" style={{ color: '#444', fontStyle: 'italic' }}>
        {hasActual ? `Released: ${e.actual}` : 'Watch for surprise vs consensus'}
      </td>
    </tr>
  );
}

// Static/hardcoded row — from currencies.js weekAhead
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

  const si       = d.surpriseIndex || 0;
  const siPct    = Math.min(Math.max((si + 50) / 100, 0), 1) * 100;
  const siColor  = si > 10 ? 'var(--teal)' : si < -10 ? 'var(--red)' : 'var(--gold)';
  const siDesc   = si > 15 ? 'Data beating expectations' : si < -15 ? 'Data consistently missing' : 'Near neutral';

  const calSrc    = live.status.calendar;
  const isLive    = calSrc === 'live';
  const liveEvents = isLive ? (live.calendar[cur] || []) : null;

  // Sort: unreleased first (no actual), then by date
  const sortedLive = liveEvents
    ? [...liveEvents].sort((a, b) => {
        const aReleased = !!(a.actual && a.actual !== '—');
        const bReleased = !!(b.actual && b.actual !== '—');
        if (aReleased !== bReleased) return aReleased ? 1 : -1;
        return new Date(a.isoDate || 0) - new Date(b.isoDate || 0);
      })
    : null;

  // Count upcoming high-impact events
  const highCount = sortedLive?.filter(e => e.impact === 'high' && !e.actual).length || 0;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={5} title="Economic Calendar & Consensus Expectations" />

      {/* Data source indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <Dot src={calSrc} />
        {isLive ? (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--teal)' }}>
            LIVE — ForexFactory · This week + next week
          </span>
        ) : (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
            Hardcoded baseline — live calendar loads on Netlify deployment
          </span>
        )}
        {isLive && highCount > 0 && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.68rem',
            color: 'var(--red)',
            background: 'rgba(208,90,74,0.1)',
            border: '1px solid rgba(208,90,74,0.25)',
            padding: '0.08rem 0.4rem',
          }}>
            {highCount} HIGH IMPACT UPCOMING
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Markets move on <strong style={{ color: 'var(--ink)' }}>surprises relative to consensus</strong>, not absolute data. Know the forecast before a release.
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
            No scheduled events for {cur} this week or next
          </div>
        ) : (
          <table className="cal-table">
            <thead>
              <tr>
                <th>DATE / TIME</th>
                <th>EVENT</th>
                <th>PRIOR / FORECAST</th>
                <th>{isLive ? 'ACTUAL / STATUS' : 'TRADE TRIGGER'}</th>
              </tr>
            </thead>
            <tbody>
              {isLive
                ? sortedLive?.map((e, i) => <LiveRow key={i} e={e} />)
                : d.weekAhead?.map((e, i) => <StaticRow key={i} e={e} />)
              }
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
