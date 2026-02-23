import { useState, useEffect } from 'react';
import { useAppState, useDispatch } from '../../context/AppContext.jsx';
import { Keys } from '../../api/keys.js';
import { useFetch } from '../../hooks/useFetch.js';
import { CURRENCIES } from '../../data/currencies.js';

const CB_LIST = [
  { c: 'USD', flag: '🇺🇸', name: 'Federal Reserve', hint: 'Auto-fetched via FRED key' },
  { c: 'EUR', flag: '🇪🇺', name: 'ECB',             hint: 'Auto-fetched (no key needed)' },
  { c: 'GBP', flag: '🇬🇧', name: 'Bank of England',  hint: 'Manual update required' },
  { c: 'JPY', flag: '🇯🇵', name: 'Bank of Japan',    hint: 'Manual update required' },
  { c: 'CHF', flag: '🇨🇭', name: 'SNB',             hint: 'Auto-fetched (no key needed)' },
  { c: 'CAD', flag: '🇨🇦', name: 'Bank of Canada',   hint: 'Auto-fetched (no key needed)' },
  { c: 'AUD', flag: '🇦🇺', name: 'RBA',             hint: 'Manual update required' },
  { c: 'NZD', flag: '🇳🇿', name: 'RBNZ',            hint: 'Manual update required' },
];

export function SettingsModal() {
  const { settingsOpen, liveData } = useAppState();
  const dispatch = useDispatch();
  const { fetchAll } = useFetch();

  const [fredKey, setFredKey]     = useState('');
  const [tdKey,   setTdKey]       = useState('');
  const [cbRates, setCbRates]     = useState({});
  const [status,  setStatus]      = useState({ msg: '', type: 'idle' });
  const [fetching, setFetching]   = useState(false);

  // Populate fields when modal opens
  useEffect(() => {
    if (settingsOpen) {
      setFredKey(Keys.fred);
      setTdKey(Keys.td);
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

  async function saveAndFetch() {
    if (fredKey) Keys.fred = fredKey;
    if (tdKey)   Keys.td   = tdKey;

    // Save CB overrides
    Keys.setCBOverrides(cbRates);
    dispatch({
      type: 'PATCH_LIVE',
      payload: { cbRates, status: { cbRates: 'manual' } },
    });

    setStatus({ msg: 'Fetching live data...', type: 'loading' });
    setFetching(true);
    try {
      await fetchAll();
      setStatus({ msg: '✓ Data updated successfully', type: 'ok' });
    } catch {
      setStatus({ msg: 'Some sources failed — check console', type: 'err' });
    }
    setFetching(false);
  }

  function saveCBOnly() {
    Keys.setCBOverrides(cbRates);
    dispatch({
      type: 'PATCH_LIVE',
      payload: { cbRates, status: { cbRates: 'manual' } },
    });
    setStatus({ msg: '✓ CB rates saved', type: 'ok' });
  }

  if (!settingsOpen) return null;

  const statusColor = status.type === 'ok' ? '#4fc3a1' : status.type === 'err' ? '#e05c5c' : '#555';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-title">⚙ Configure Live Data</span>
          <button className="modal-close" onClick={close}>✕</button>
        </div>

        <div className="modal-body">
          {/* API Keys */}
          <div className="modal-sec-title">API KEYS — OPTIONAL, FREE TO REGISTER</div>
          <div className="modal-grid-2">
            <div className="modal-field">
              <label>FRED API KEY — US YIELDS, FED RATE, CPI, PCE</label>
              <input
                type="password"
                value={fredKey}
                onChange={e => setFredKey(e.target.value)}
                placeholder="paste your FRED key..."
              />
              <div className="modal-hint">
                Free at <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noreferrer" style={{ color: 'var(--gold2)' }}>fred.stlouisfed.org</a> — 25,000 calls/day
              </div>
            </div>
            <div className="modal-field">
              <label>TWELVE DATA KEY — Gold, Oil, S&P, VIX, DXY, Copper</label>
              <input
                type="password"
                value={tdKey}
                onChange={e => setTdKey(e.target.value)}
                placeholder="paste your Twelve Data key..."
              />
              <div className="modal-hint">
                Free at <a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer" style={{ color: 'var(--gold2)' }}>twelvedata.com</a> — 800 credits/day, single batch call
              </div>
            </div>
          </div>

          <button className="modal-btn" onClick={saveAndFetch} disabled={fetching} style={{ marginBottom: '0.75rem' }}>
            {fetching ? 'FETCHING...' : 'SAVE KEYS & FETCH LIVE DATA NOW'}
          </button>

          {status.msg && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: statusColor, marginBottom: '0.75rem', padding: '0.3rem 0.5rem', border: `1px solid ${statusColor}22` }}>
              {status.msg}
            </div>
          )}

          {/* CB Rate Overrides */}
          <div className="modal-sec-title" style={{ marginTop: '0.75rem' }}>CENTRAL BANK RATES — MANUAL OVERRIDE</div>
          <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.5rem', lineHeight: 1.5 }}>
            ECB, BoC, SNB auto-fetch without a key. USD fetches via FRED. Others (RBA, BoE, BoJ, RBNZ) update manually after each CB meeting (~6–8× per year each).
          </div>

          {CB_LIST.map(({ c, flag, name, hint }) => (
            <div key={c} className="modal-cb-row">
              <span className="modal-cb-flag">{flag} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.74rem', color: '#555' }}>{c}</span></span>
              <span className="modal-cb-name">{name}<br /><span style={{ color: '#333', fontSize: '0.6rem' }}>{hint}</span></span>
              <input
                className={`modal-cb-input${cbRates[c] !== CURRENCIES[c]?.interestRate ? ' overridden' : ''}`}
                value={cbRates[c] || ''}
                placeholder={CURRENCIES[c]?.interestRate || ''}
                onChange={e => setCbRates(prev => ({ ...prev, [c]: e.target.value }))}
              />
            </div>
          ))}

          <button className="modal-btn secondary" onClick={saveCBOnly} style={{ marginTop: '0.5rem' }}>
            SAVE CB RATES ONLY (NO FETCH)
          </button>

          {/* Zero-key sources info */}
          <div className="modal-sec-title" style={{ marginTop: '0.75rem' }}>ZERO-KEY SOURCES (ALWAYS ACTIVE)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {[
              { src: 'Frankfurter.app', covers: 'All G10 FX spot rates', update: 'Daily 16:00 CET' },
              { src: 'US Treasury API', covers: 'US yield curve (10Y, 30Y)', update: 'Daily EOD' },
              { src: 'ECB Data API',    covers: 'ECB deposit rate',          update: 'Per meeting' },
              { src: 'Bank of Canada',  covers: 'BoC overnight rate',        update: 'Per meeting' },
              { src: 'SNB Data',        covers: 'SNB sight deposit rate',    update: 'Quarterly' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '0.35rem', background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#4fc3a1' }}>{s.src}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#555', marginTop: '0.12rem' }}>{s.covers}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#333' }}>Updates: {s.update}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
