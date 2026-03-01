import { useDispatch, useLiveData } from '../../context/AppContext.jsx';

export function Masthead() {
  const dispatch  = useDispatch();
  const liveData  = useLiveData();
  const dateStr   = new Date().toLocaleDateString('en-AU', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  }).toUpperCase();

  const lastFetchStr = liveData.lastFetch
    ? liveData.lastFetch.toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;

  return (
    <header className="masthead">
      <div className="masthead-title">
        FX <span>Macro Intelligence</span>
      </div>
      <div className="masthead-right">
        <span className="masthead-date">{dateStr}</span>
        {lastFetchStr && (
          <div className="live-pill">
            <div className="live-dot" />
            CLAUDE-POWERED · {lastFetchStr}
          </div>
        )}
        <button
          className="settings-btn"
          onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
          title="Configure live data"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
