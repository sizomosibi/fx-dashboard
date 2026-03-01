import { useState } from 'react';
import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { ATR as STATIC_ATR, CORR_WARNS } from '../../data/scores.js';
import { useAppState, useDispatch, useLiveData } from '../../context/AppContext.jsx';

// ── Merge live ATR (from /atr-data.json via GitHub Actions) over static baseline
function useMergedATR() {
  const live = useLiveData();
  // live.atr is { 'EUR/USD': {atr:68, vol:'medium'}, ... } from atr-data.json
  // STATIC_ATR is the hardcoded baseline in scores.js
  const liveAtr = live.atr || {};
  return {
    data: Object.fromEntries(
      Object.entries(STATIC_ATR).map(([pair, staticEntry]) => [
        pair,
        liveAtr[pair] ?? staticEntry,
      ])
    ),
    src: live.status?.atr || 'stale',
    fetchedAt: live.atrFetchedAt,
    fallbackUsed: live.atrFallbackUsed || [],
  };
}

const CHECKLIST = [
  { id: 'c1',  main: 'Fundamental thesis confirmed',      sub: 'CB bias, growth trend, risk sentiment all align' },
  { id: 'c2',  main: 'COT positioning checked',           sub: 'Not entering a crowded trade (>60% net = caution)' },
  { id: 'c3',  main: 'Consensus expectation noted',       sub: 'Know what markets expect. Surprise matters more than the number.' },
  { id: 'c4',  main: 'ATR stop loss set correctly',       sub: 'Stop is at least 1× ATR from entry — outside normal daily noise' },
  { id: 'c5',  main: 'Position size calculated',          sub: 'Risk per trade ≤2% of account. 5-loss drawdown scenario reviewed.' },
  { id: 'c6',  main: 'Correlation check done',            sub: 'Not running two correlated positions that double effective exposure' },
  { id: 'c7',  main: 'Catalyst identified',               sub: 'Know the specific event that will confirm or invalidate thesis' },
  { id: 'c8',  main: 'Invalidation level defined',        sub: 'If price hits X or data prints Y — exit planned' },
  { id: 'c9',  main: 'Geopolitical risk reviewed',        sub: 'No binary event overnight that could gap the market' },
  { id: 'c10', main: 'Weekly drawdown limit checked',     sub: 'Still within max weekly loss limit. Not trading on tilt.' },
];

function PositionSizer({ atrData }) {
  const [account,  setAccount]  = useState(10000);
  const [riskPct,  setRiskPct]  = useState(1);
  const [stopPips, setStopPips] = useState(80);
  const [pair,     setPair]     = useState('EUR/USD');

  const riskAmt = account * (riskPct / 100);
  const lots    = riskAmt / (stopPips * 10);
  const atrD    = atrData[pair];
  const atrStop = atrD ? Math.round(atrD.atr * 1.25) : stopPips;
  const stopOk  = atrD ? stopPips >= atrD.atr : true;
  const rating  = riskPct <= 1 ? 'CONSERVATIVE ✓' : riskPct <= 2 ? 'MODERATE ✓' : 'AGGRESSIVE ⚠';
  const ratCls  = riskPct <= 1 ? 'good' : riskPct <= 2 ? 'caution' : 'warn';

  const corr = CORR_WARNS[pair];

  return (
    <Card label="POSITION SIZE CALCULATOR">
      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>
        Formula: <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--ink)' }}>Lots = (Account × Risk%) ÷ (Stop Pips × Pip Value)</code>
      </div>
      <div className="sizer-grid">
        {[
          { label: 'ACCOUNT SIZE ($)', type: 'number', value: account, setter: v => setAccount(+v) },
          { label: 'RISK PER TRADE (%)', type: 'number', value: riskPct, step: 0.1, setter: v => setRiskPct(+v) },
          { label: 'STOP LOSS (PIPS)', type: 'number', value: stopPips, setter: v => setStopPips(+v) },
        ].map(({ label, ...props }, i) => (
          <div key={i} className="sz-inp" style={{ marginBottom: '0.4rem' }}>
            <label className="fld-lbl">{label}</label>
            <input className="fld-in" {...props} onChange={e => props.setter(e.target.value)} />
          </div>
        ))}
        <div className="sz-inp" style={{ marginBottom: '0.4rem' }}>
          <label className="fld-lbl">PAIR</label>
          <select className="fld-sel" value={pair} onChange={e => setPair(e.target.value)}>
            {Object.keys(STATIC_ATR).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="sz-results">
        {[
          { label: 'Risk Amount',              val: `$${riskAmt.toFixed(2)}`,                    cls: '' },
          { label: 'Position Size',            val: `${lots.toFixed(2)} lots`,                   cls: 'good' },
          { label: 'In Mini Lots',             val: `${Math.round(lots * 10) / 10} mini lots`,   cls: '' },
          { label: 'Suggested Stop (1.25× ATR)', val: `${atrStop} pips`,                        cls: 'caution' },
          { label: 'Stop vs ATR',              val: stopOk ? '✓ ADEQUATE' : '⚠ TOO TIGHT',      cls: stopOk ? 'good' : 'warn' },
          { label: 'Max 5-Trade Drawdown',     val: `$${(riskAmt * 5).toFixed(0)} (${(riskPct * 5).toFixed(1)}%)`, cls: 'warn' },
          { label: 'Risk Rating',              val: rating,                                       cls: ratCls },
        ].map(({ label, val, cls }, i) => (
          <div key={i} className="res-row">
            <span className="res-l">{label}</span>
            <span className={`res-v ${cls}`}>{val}</span>
          </div>
        ))}
      </div>

      {corr && (
        <div style={{ marginTop: '0.4rem', padding: '0.4rem', background: 'rgba(139,32,32,0.08)', border: '1px solid var(--red)', fontSize: '0.84rem', color: 'var(--red)', lineHeight: 1.5 }}>
          ⚠ CORRELATION WARNING: {corr}
        </div>
      )}
    </Card>
  );
}

function PreTradeChecklist() {
  const { checkState }  = useAppState();
  const dispatch        = useDispatch();
  const checkedCount    = Object.values(checkState).filter(Boolean).length;

  return (
    <Card label={<>PRE-TRADE CHECKLIST <span style={{ color: checkedCount >= 8 ? 'var(--teal)' : 'var(--red)' }}>{checkedCount}/10</span></>}>
      <div style={{ fontSize: '0.88rem', color: checkedCount >= 8 ? 'var(--teal)' : 'var(--red)', marginBottom: '0.5rem' }}>
        {checkedCount >= 8 ? '✓ READY TO TRADE' : '⚠ NOT READY — complete at least 8 items'}
      </div>
      <div className="checklist">
        {CHECKLIST.map(item => (
          <div key={item.id} className="cl-item">
            <div
              className={`cl-box${checkState[item.id] ? ' chk' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_CHECK', payload: item.id })}
            >
              {checkState[item.id] ? '✓' : ''}
            </div>
            <div>
              <div className="cl-main">{item.main}</div>
              <div className="cl-sub">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'RESET_CHECKLIST' })}
        style={{ marginTop: '0.5rem', background: 'none', border: '1px solid var(--rule)', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', padding: '0.3rem 0.7rem', cursor: 'pointer' }}
      >
        RESET
      </button>
    </Card>
  );
}

function TradeJournal() {
  const { journalEntries, cur } = useAppState();
  const dispatch = useDispatch();
  const [text, setText] = useState('');

  function save() {
    if (!text.trim()) return;
    dispatch({ type: 'ADD_JOURNAL', payload: text.trim() });
    setText('');
  }

  const recent = [...journalEntries].reverse().slice(0, 5);

  return (
    <Card label="TRADE JOURNAL">
      <textarea
        className="journal-ta"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`Log your thesis before entering. Recording for: ${cur}`}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <button className="journal-save" onClick={save}>SAVE ENTRY</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)' }}>
          Recording for: {cur}
        </span>
      </div>
      <div style={{ marginTop: '0.75rem' }}>
        {recent.length === 0
          ? <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No entries yet.</div>
          : recent.map((e, i) => (
              <div key={i} className="journal-entry">
                <div className="j-meta">{e.time} · {e.ccy}</div>
                <div className="j-body">{e.text}</div>
              </div>
            ))
        }
      </div>
    </Card>
  );
}

export function S10Exec() {
  const { data: atrData, src: atrSrc, fetchedAt: atrTs, fallbackUsed } = useMergedATR();
  const atrIsLive = atrSrc === 'live';

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={10} title="Execution — Position Sizing, Risk Rules & Journal" />

      {/* ATR Grid */}
      <Card label={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          VOLATILITY REFERENCE — 14-DAY ATR BY PAIR
          <Dot src={atrSrc} />
          {atrIsLive && atrTs && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--teal)', letterSpacing: '0.06em' }}>
              LIVE · {new Date(atrTs).toLocaleDateString('en-AU', { dateStyle: 'short' })}
            </span>
          )}
          {!atrIsLive && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#555' }}>
              BASELINE — updates weekly via GitHub Actions (fetch-atr.yml)
            </span>
          )}
        </span>
      }>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
          Set stop loss at <strong style={{ color: 'var(--ink)' }}>minimum 1× ATR</strong> from entry. A stop inside the ATR is not a risk level — it is a guaranteed loss.
        </div>
        <div className="atr-grid">
          {Object.entries(atrData).map(([p, a]) => {
            const isFallback = fallbackUsed.includes(p);
            return (
              <div key={p} className="atr-cell">
                <div className="atr-p">{p}</div>
                <div className="atr-v">{a.atr}</div>
                <div className="atr-u">pips (14d ATR)</div>
                <div className={`atr-vl ${a.vol}`}>{a.vol.toUpperCase()} VOL</div>
                {isFallback && (
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', color: '#555' }}>FALLBACK</div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <PositionSizer atrData={atrData} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <PreTradeChecklist />
        <TradeJournal />
      </div>
    </>
  );
}
