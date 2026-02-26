import { useState, useEffect } from 'react';
import { useAppState, useDispatch } from '../../context/AppContext.jsx';
import { Keys } from '../../api/keys.js';
import { useFetch } from '../../hooks/useFetch.js';
import { CURRENCIES } from '../../data/currencies.js';

// CBs that auto-fetch via free APIs (no key)
const CB_LIST = [
  { c: 'USD', flag: '🇺🇸', name: 'Federal Reserve',   hint: 'Manual — enter after each FOMC meeting', auto: false },
  { c: 'EUR', flag: '🇪🇺', name: 'ECB',               hint: 'Auto-fetched (ECB Data API, no key)',    auto: true  },
  { c: 'GBP', flag: '🇬🇧', name: 'Bank of England',   hint: 'Manual — enter after each MPC meeting', auto: false },
  { c: 'JPY', flag: '🇯🇵', name: 'Bank of Japan',     hint: 'Manual — enter after each MPM meeting', auto: false },
  { c: 'CHF', flag: '🇨🇭', name: 'SNB',               hint: 'Auto-fetched (SNB Data API, no key)',   auto: true  },
  { c: 'CAD', flag: '🇨🇦', name: 'Bank of Canada',    hint: 'Auto-fetched (BoC Valet API, no key)',  auto: true  },
  { c: 'AUD', flag: '🇦🇺', name: 'RBA',               hint: 'Manual — enter after each RBA meeting', auto: false },
  { c: 'NZD', flag: '🇳🇿', name: 'RBNZ',              hint: 'Manual — enter after each MPC meeting', auto: false },
];

const AUTO_SOURCES = [
  { src: 'Frankfurter.app',    covers: 'All G10 FX spot rates',         update: 'Daily 16:00 CET' },
  { src: 'US Treasury XML',    covers: 'Full yield curve (2Y→30Y)',      update: 'Daily EOD' },
  { src: 'Yahoo Finance',      covers: 'Gold, Oil, S&P, VIX, DXY, Copper', update: 'Real-time (1-min delay)' },
  { src: 'ECB Data API',       covers: 'ECB deposit facility rate',      update: 'Per meeting' },
  { src: 'Bank of Canada API', covers: 'BoC overnight rate',             update: 'Per meeting' },
  { src: 'SNB Data API',       covers: 'SNB sight deposit rate',         update: 'Quarterly' },
  { src: 'CFTC Socrata API',   covers: 'COT speculative positioning',    update: 'Weekly Fri 3:30pm ET' },
  { src: 'ForexFactory JSON',  covers: 'Economic calendar (this & next week)', update: 'Daily' },
  { src: 'FXStreet RSS',       covers: 'Forex headlines',                update: 'Live' },
  { src: 'ForexLive RSS',      covers: 'Forex headlines',                update: 'Live' },
  { src: 'DailyFX RSS',        covers: 'Forex headlines',                update: 'Live' },
];

export function SettingsModal() {
  const { settingsOpen, liveData } = useAppState();
  const dispatch  = useDispatch();
  const { fetchAll } = useFetch();

  const [cbRates,  setCbRates]  = useState({});
  const [status,   setStatus]   = useState({ msg: '', type: 'idle' });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      const overrides = Keys.getCBOverrides();
      const merged = {};
      CB_LIST.forEach(({ c }) => {
        merged[c] = overrides[c] || liveData.cbRates[c] || CURRENCIES[c]?.interestRate || '';
      });
      setCbRates(merged);
      setStatus({ msg: '', type: 'idle' });
    }
  }, [settingsOpen, liveData.cbRates]);

  function close() { dispatch({ type: 'CLOSE_SETTINGS' }); }

  async function refreshAll() {
    // Save CB overrides first
    Keys.setCBOverrides(cbRates);
    dispatch({ type: 'PATCH_LIVE', payload: { cbRates, status: { cbRates: 'manual' } } });

    setStatus({ msg: 'Fetching all live data…', type: 'loading' });
    setFetching(true);
    try {
      await fetchAll();
      setStatus({ msg: '✓ All sources refreshed successfully', type: 'ok' });
    } catch {
      setStatus({ msg: 'Some sources failed — check browser console', type: 'err' });
    }
    setFetching(false);
  }

  function saveCBOnly() {
    Keys.setCBOverrides(cbRates);
    dispatch({ type: 'PATCH_LIVE', payload: { cbRates, status: { cbRates: 'manual' } } });
    setStatus({ msg: '✓ CB rates saved', type: 'ok' });
  }

  if (!settingsOpen) return null;

  const statusColor = status.type === 'ok' ? '#4fc3a1' : status.type === 'err' ? '#e05c5c' : '#888';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-title">⚙ Live Data Configuration</span>
          <button className="modal-close" onClick={close}>✕</button>
        </div>

        <div className="modal-body">
          {/* Zero-key badge */}
          <div style={{
            background: 'rgba(79,195,161,0.07)',
            border: '1px solid rgba(79,195,161,0.25)',
            borderLeft: '3px solid #4fc3a1',
            padding: '0.6rem 0.875rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#4fc3a1', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
              ZERO API KEYS REQUIRED
            </div>
            <div style={{ fontSize: '0.88rem', color: '#999', lineHeight: 1.55 }}>
              All market data, yields, FX rates, COT positioning, economic calendar, and news
              fetch automatically via free public APIs — no registration needed. Prices update
              every time you load or refresh the page.
            </div>
          </div>

          {/* Refresh button */}
          <button
            className="modal-btn"
            onClick={refreshAll}
            disabled={fetching}
            style={{ marginBottom: '0.5rem' }}
          >
            {fetching ? 'REFRESHING ALL SOURCES…' : '↺ REFRESH ALL LIVE DATA NOW'}
          </button>

          {status.msg && (
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.72rem',
              color: statusColor,
              marginBottom: '0.875rem',
              padding: '0.3rem 0.5rem',
              border: `1px solid ${statusColor}33`,
            }}>
              {status.msg}
            </div>
          )}

          {/* CB Rate Overrides */}
          <div className="modal-sec-title">CENTRAL BANK RATES — MANUAL OVERRIDE</div>
          <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '0.6rem', lineHeight: 1.5 }}>
            ECB, BoC, and SNB rates auto-fetch via free APIs. Update the others manually after each
            central bank meeting (~4–8× per year).
          </div>

          {CB_LIST.map(({ c, flag, name, hint, auto }) => (
            <div key={c} className="modal-cb-row">
              <span className="modal-cb-flag">{flag} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.74rem', color: '#555' }}>{c}</span></span>
              <span className="modal-cb-name">
                {name}
                <br />
                <span style={{ color: auto ? '#4fc3a1' : '#444', fontSize: '0.6rem' }}>
                  {auto ? '✓ AUTO' : '✎ MANUAL'} — {hint}
                </span>
              </span>
              <input
                className={`modal-cb-input${cbRates[c] !== CURRENCIES[c]?.interestRate ? ' overridden' : ''}`}
                value={cbRates[c] || ''}
                placeholder={CURRENCIES[c]?.interestRate || ''}
                onChange={e => setCbRates(prev => ({ ...prev, [c]: e.target.value }))}
                disabled={auto}
                style={auto ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              />
            </div>
          ))}

          <button className="modal-btn secondary" onClick={saveCBOnly} style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            SAVE CB RATES ONLY (NO FETCH)
          </button>

          {/* Zero-key sources table */}
          <div className="modal-sec-title">ALL LIVE DATA SOURCES — ZERO KEYS NEEDED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {AUTO_SOURCES.map((s, i) => (
              <div key={i} style={{ padding: '0.4rem 0.55rem', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#4fc3a1' }}>{s.src}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.63rem', color: '#555', marginTop: '0.1rem' }}>{s.covers}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#333', marginTop: '0.05rem' }}>Updates: {s.update}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
