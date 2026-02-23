import { useLiveData, useDispatch } from '../../context/AppContext.jsx';

const COLORS = {
  live:         '#4fc3a1',
  'live-partial':'#4fc3a1',
  manual:       '#b8932e',
  stale:        '#555',
};

function Item({ label, status, value }) {
  const color = COLORS[status] || COLORS.stale;
  return (
    <div className="ds-item">
      <span className="ds-dot" style={{ background: color }} />
      <span className="ds-label">{label}</span>
      <span className="ds-val">{value}</span>
    </div>
  );
}

export function StatusBar() {
  const live     = useLiveData();
  const dispatch = useDispatch();
  const ts       = live.lastFetch
    ? live.lastFetch.toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;

  const lbl = (s, fallback = 'HARDCODED ⚠') =>
    s === 'live'          ? `LIVE${ts ? ' · ' + ts : ''}`
    : s === 'live-partial' ? `PARTIAL${ts ? ' · ' + ts : ''}`
    : s === 'manual'      ? 'MANUAL'
    : fallback;

  return (
    <div className="data-status-bar">
      <Item label="CB RATES" status={live.status.cbRates} value={lbl(live.status.cbRates)} />
      <span className="ds-sep">|</span>
      <Item label="US YIELDS" status={live.status.yields}  value={lbl(live.status.yields)} />
      <span className="ds-sep">|</span>
      <Item label="FX SPOT"   status={live.status.fx}      value={lbl(live.status.fx)} />
      <span className="ds-sep">|</span>
      <Item label="MARKETS"   status={live.status.markets}
        value={live.status.markets === 'live' ? lbl('live') : 'KEY NEEDED'} />
      <span className="ds-sep">|</span>
      <Item label="COT"       status={live.status.cot}
        value={live.status.cot === 'live' ? lbl('live') : 'FETCHING...'} />
      <span className="ds-sep">|</span>
      <Item label="TRIAD"     status={live.status.triad}
        value={live.status.triad === 'live' ? lbl('live') : 'FRED KEY NEEDED'} />
      <span className="ds-sep" style={{ flex: 1 }} />
      <button
        className="settings-btn"
        style={{ fontSize: '0.72rem', color: '#555' }}
        onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
      >
        ⚙ CONFIGURE
      </button>
    </div>
  );
}
