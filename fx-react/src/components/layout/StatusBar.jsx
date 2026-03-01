import { useLiveData, useDispatch } from '../../context/AppContext.jsx';

const COLORS = {
  live:          '#4fc3a1',
  'live-partial': '#4fc3a1',
  manual:        '#b8932e',
  stale:         '#555',
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
  const ts = live.lastFetch
    ? live.lastFetch.toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;

  const lbl = (s, fallback = 'LOADING') =>
    s === 'live'           ? `LIVE${ts ? ' · ' + ts : ''}`
    : s === 'live-partial' ? `PARTIAL${ts ? ' · ' + ts : ''}`
    : s === 'manual'       ? 'MANUAL'
    : fallback;

  return (
    <div className="data-status-bar">
      <Item label="FX SPOT"  status={live.status.fx}       value={lbl(live.status.fx)} />
      <span className="ds-sep">|</span>
      <Item label="YIELDS"   status={live.status.yields}   value={lbl(live.status.yields)} />
      <span className="ds-sep">|</span>
      <Item label="MARKETS"  status={live.status.markets}  value={lbl(live.status.markets)} />
      <span className="ds-sep">|</span>
      <Item label="CB RATES" status={live.status.cbRates}  value={lbl(live.status.cbRates)} />
      <span className="ds-sep">|</span>
      <Item label="COT"      status={live.status.cot}      value={lbl(live.status.cot)} />
      <span className="ds-sep">|</span>
      <Item label="CALENDAR" status={live.status.calendar} value={lbl(live.status.calendar)} />
      <span className="ds-sep">|</span>
      <Item label="NEWS"     status={live.status.news}     value={lbl(live.status.news)} />
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
