import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { MARKET_SNAPSHOT } from '../../data/marketSnapshot.js';
import { COPPER_ANALYSIS } from '../../data/scores.js';
import { CURRENCIES } from '../../data/currencies.js';

// ── Static structural data ─────────────────────────────────────────
const CARRY_PAIRS = [
  { pair: 'AUD/JPY', spread: '3.60%', status: 'at risk',   note: 'BoJ hiking compresses spread' },
  { pair: 'NZD/JPY', spread: '3.25%', status: 'unwinding', note: 'RBNZ cuts + BoJ hikes = maximum compression' },
  { pair: 'GBP/JPY', spread: '4.00%', status: 'stable',    note: 'BoE constrained — spread holds for now' },
  { pair: 'EUR/CHF', spread: '2.40%', status: 'stable',    note: 'SNB near zero; ECB cutting narrows spread' },
];

const CB_GROUPS = [
  { grp: 'HIKING',               ccys: ['JPY'],               color: 'var(--teal)', desc: 'BoJ raising rates for first time in decades. Carry unwind risk.' },
  { grp: 'ON HOLD',              ccys: ['USD', 'GBP'],        color: 'var(--gold)', desc: 'Fed & BoE constrained. GBP by services inflation. USD by sticky CPI.' },
  { grp: 'CUTTING SLOWLY',       ccys: ['AUD', 'EUR'],        color: '#b8690a',     desc: 'RBA cautious first cut. ECB easing toward neutral ~2%.' },
  { grp: 'CUTTING AGGRESSIVELY', ccys: ['NZD', 'CAD', 'CHF'], color: 'var(--red)',  desc: 'RBNZ in recession cuts. BoC flagging tariff risk. SNB near zero.' },
];

const SPEECH_SCENARIOS = [
  { type: 'hawk', label: 'HAWKISH READ',  sub: '10Y rises in 1H',        chain: ['10Y Yield ↑', 'Fed holding longer', 'USD bid', 'Gold dips', 'AUD/NZD/CAD sell', 'USD/JPY rises'] },
  { type: 'dove', label: 'DOVISH READ',   sub: '10Y falls in 1H',        chain: ['10Y Yield ↓', 'Cut bets priced in', 'USD sold', 'Gold rallies', 'AUD/NZD rise', 'USD/JPY falls'] },
  { type: 'stag', label: 'STAGFLATION',   sub: 'Yield up + growth weak', chain: ['Inflation up', 'Growth weak', 'Fed trapped', 'Real rates fall', 'Gold surges', 'USD mixed'] },
];

const SENTIMENT_STYLES = {
  'risk-off': { border: 'rgba(208,90,74,0.2)',    borderLeft: 'var(--red)',   background: 'rgba(139,32,32,0.07)',   tagColor: 'var(--red)'   },
  'risk-on':  { border: 'rgba(79,195,161,0.2)',   borderLeft: 'var(--teal)',  background: 'rgba(79,195,161,0.04)',  tagColor: 'var(--teal)'  },
  neutral:    { border: 'rgba(184,147,62,0.2)',   borderLeft: 'var(--gold)',  background: 'rgba(184,147,62,0.04)', tagColor: 'var(--gold)'  },
};

function AIBadge({ gb }) {
  if (!gb?.globalBrief && !gb?.loading) return null;
  const ts = gb.generatedAt
    ? new Date(gb.generatedAt).toLocaleTimeString('en-AU', { timeStyle: 'short' })
    : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {gb.loading
        ? <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>⚡ AI GENERATING…</span>
        : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)', letterSpacing: '0.08em' }}>
            ⚡ AI · {gb.source === 'cache' ? `CACHED ${ts}` : `LIVE ${ts || ''}`}
          </span>
      }
      {!gb.loading && (
        <button onClick={gb.refresh} title="Regenerate with live news"
          style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', padding: '0.1rem 0.4rem', cursor: 'pointer', borderRadius: 2 }}>
          ↺ REFRESH
        </button>
      )}
    </div>
  );
}

function BannerSkeleton() {
  return (
    <div className="risk-banner" style={{ opacity: 0.35 }}>
      <div className="risk-icon">⚠️</div>
      <div style={{ flex: 1 }}>
        <div style={{ height: '0.65rem', background: '#2a1010', borderRadius: 2, width: '30%', marginBottom: '0.4rem' }} />
        <div style={{ height: '1.1rem',  background: '#221010', borderRadius: 2, width: '55%', marginBottom: '0.4rem' }} />
        <div style={{ height: '0.7rem',  background: '#1a1010', borderRadius: 2, width: '90%', marginBottom: '0.3rem' }} />
        <div style={{ height: '0.7rem',  background: '#1a1010', borderRadius: 2, width: '75%' }} />
      </div>
    </div>
  );
}

function RiskCell({ label, obj, signal, sigLabel, note }) {
  return (
    <div className="rsd-cell">
      <div className="rsd-label">{label} <Dot src={obj.src || 'stale'} /></div>
      <div className="rsd-value">{obj.v}</div>
      <div className={`rsd-delta ${obj.dir === 'up' ? 'up' : 'down'}`}>{obj.chg}</div>
      <div className={`rsd-signal ${signal}`} title={note}>{sigLabel}</div>
    </div>
  );
}

function YieldBar({ tenor, val, isKey, maxVal }) {
  const h = Math.round((val / maxVal) * 44);
  return (
    <div className="yc-bar-wrap">
      <div className="yc-bar-val">{val.toFixed(2)}%</div>
      <div className="yc-bar-fill" style={{ height: h, opacity: isKey ? 1 : 0.5, background: isKey ? 'var(--gold2)' : '#555' }} />
      <div className="yc-bar-tenor" style={{ color: isKey ? 'var(--gold2)' : '#444' }}>{tenor}</div>
    </div>
  );
}

function SpeechScenario({ scenario }) {
  const { type, label, sub, chain } = scenario;
  const isStag = type === 'stag';
  return (
    <div className="speech-scenario">
      <div className="ss-header">
        <span className={`ss-type ${isStag ? '' : type}`} style={isStag ? { color: 'var(--gold2)', borderColor: 'rgba(184,147,62,0.4)' } : {}}>{label}</span>
        <span style={{ fontSize: '0.72rem', color: '#555' }}>{sub}</span>
      </div>
      <div className="ss-chain">
        {chain.map((c, i) => (
          <span key={i}>
            <span className="ss-step">{c}</span>
            {i < chain.length - 1 && <span className="ss-arrow">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function S1Macro({ mkt, globalBrief: gb }) {
  const { yields, vix, dxy, spx, gold, oil, copper, fedSpeeches } = mkt;

  const rsdItems = [
    { label: 'US 10Y YIELD',      obj: yields.US10Y,        signal: yields.US10Y.dir === 'up'        ? 'risk-off' : 'risk-on', sigLabel: yields.US10Y.dir === 'up'  ? 'YIELDS RISING → HAWKISH' : 'YIELDS FALLING → DOVISH',  note: 'Rising 10Y = hawkish. Falling = dovish.' },
    { label: 'VIX — FEAR GAUGE',  obj: vix,                 signal: parseFloat(vix.v) > 20           ? 'risk-off' : 'risk-on', sigLabel: parseFloat(vix.v) > 20     ? 'ELEVATED FEAR' : 'CALM MARKETS',                        note: '<20 = risk-on. 20-30 = caution. >30 = crisis.' },
    { label: 'DXY — US DOLLAR',   obj: dxy,                 signal: dxy.dir === 'up'                 ? 'risk-off' : 'risk-on', sigLabel: dxy.dir === 'down'          ? 'USD WEAKENING' : 'USD STRENGTHENING',                    note: 'DXY ↑ = risk-off. DXY ↓ = risk-on.' },
    { label: 'S&P 500',           obj: spx,                 signal: spx.dir === 'down'               ? 'risk-off' : 'risk-on', sigLabel: spx.dir === 'down'          ? 'EQUITIES SELLING' : 'EQUITIES RISING',                   note: 'S&P falling = risk-off → JPY/CHF/Gold bid.' },
    { label: 'GOLD XAU/USD',      obj: gold,                signal: gold.dir === 'up'                ? 'risk-off' : 'risk-on', sigLabel: gold.dir === 'up'           ? 'SAFE-HAVEN BID' : 'RISK-ON SELLING',                     note: 'Gold ↑ = geopolitical fear or real rates falling.' },
    { label: 'WTI CRUDE OIL',     obj: oil,                 signal: oil.dir === 'down'               ? 'risk-off' : 'risk-on', sigLabel: oil.dir === 'down'          ? 'OIL FALLING → CAD↓' : 'OIL RISING → CAD↑',              note: 'Oil ↑ = CAD bullish, inflation risk.' },
    { label: 'COPPER CMX',        obj: copper,              signal: copper.dir === 'down'            ? 'risk-off' : 'risk-on', sigLabel: copper.dir === 'down'       ? 'DR. COPPER BEARISH' : 'DR. COPPER BULLISH',              note: '"Dr. Copper" leads AUD and global risk appetite.' },
    { label: '2s10s YIELD CURVE', obj: yields.spread2s10s, signal: yields.spread2s10s.signal === 'norm' ? 'risk-on' : 'risk-off', sigLabel: (yields.spread2s10s.direction || 'Normal').toUpperCase(), note: yields.spread2s10s.note },
  ];

  const ycTenors = yields.curve?.length
    ? yields.curve.map(c => ({ t: c.tenor, v: c.val }))
    : [
        { t: '2Y',  v: parseFloat(yields.US2Y.v) },
        { t: '5Y',  v: parseFloat(yields.US5Y.v) },
        { t: '10Y', v: parseFloat(yields.US10Y.v) },
        { t: '30Y', v: parseFloat(yields.US30Y.v) },
      ];
  const ycMax = Math.max(...ycTenors.map(x => x.v));
  const stColor = s => s === 'unwinding' ? 'var(--red)' : s === 'at risk' ? 'var(--gold)' : 'var(--teal)';

  const env     = gb?.globalBrief?.riskEnvironment;
  const sStyle  = SENTIMENT_STYLES[env?.sentiment] || SENTIMENT_STYLES['neutral'];
  const isAI    = !!env;
  const carryAI = gb?.globalBrief?.carryCommentary;

  return (
    <>
      <SectionHead num={1} title="Global Macro Context & Risk Sentiment Dashboard" />

      {gb?.loading && <BannerSkeleton />}

      {!gb?.loading && (
        <div className="risk-banner" style={isAI ? { background: sStyle.background, border: `1px solid ${sStyle.border}`, borderLeft: `3px solid ${sStyle.borderLeft}` } : {}}>
          <div className="risk-icon">
            {env?.sentiment === 'risk-on' ? '🟢' : env?.sentiment === 'neutral' ? '🟡' : '⚠️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <div className="risk-env-tag" style={isAI ? { color: sStyle.tagColor } : {}}>
                {env?.tag || 'GLOBAL RISK ENVIRONMENT'} — {env?.weekOf || 'THIS WEEK'}
              </div>
              <AIBadge gb={gb} />
            </div>
            <div className="risk-env-name">{env?.name || 'Risk-Off — Tariff Uncertainty & Geopolitical Tension'}</div>
            <div className="risk-env-desc">
              {env?.desc || 'US trade policy uncertainty suppressing risk appetite. VIX elevated. Gold near all-time highs. Carry trades unwinding. Safe-haven currencies (USD, JPY, CHF, Gold) bid.'}
            </div>
          </div>
        </div>
      )}

      <div className="card-lbl" style={{ marginBottom: '0.4rem' }}>
        RISK SENTIMENT INDICATORS — READ AS A COMPOSITE
      </div>
      <div className="risk-dashboard">
        {rsdItems.map((item, i) => <RiskCell key={i} {...item} />)}
      </div>

      <div className="bond-block">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--gold2)', letterSpacing: '0.15em', marginBottom: '0.65rem' }}>
              US TREASURY YIELD CURVE <Dot src={yields.US10Y.src || 'stale'} />
            </div>
            <div className="bond-grid">
              {[['2Y', yields.US2Y], ['5Y', yields.US5Y], ['10Y', yields.US10Y], ['30Y', yields.US30Y]].map(([t, obj]) => (
                <div key={t} className="bond-cell" style={t === '10Y' ? { borderColor: 'var(--gold2)' } : {}}>
                  <div className="bond-lbl" style={t === '10Y' ? { color: 'var(--gold2)' } : {}}>{t} TREASURY{t === '10Y' ? ' ★' : ''}</div>
                  <div className="bond-val">{obj.v}</div>
                  <div className={`bond-chg ${obj.dir === 'up' ? 'up' : 'down'}`}>{obj.chg}</div>
                  <span className={`bond-interp ${obj.interp}`}>{obj.interp === 'hawk' ? 'HAWKISH' : 'DOVISH'}</span>
                </div>
              ))}
            </div>
            <div className="yield-curve-block" style={{ marginTop: '0.5rem' }}>
              <div className="yc-label">YIELD CURVE SHAPE — {(yields.spread2s10s.direction || 'Normal').toUpperCase()}</div>
              <div className="yc-bars">
                {ycTenors.map(({ t, v }) => (
                  <YieldBar key={t} tenor={t} val={v} isKey={t === '10Y'} maxVal={ycMax} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.4rem' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>2s10s SPREAD:</span>
                <span className={`spread-pill ${yields.spread2s10s.signal}`}>{yields.spread2s10s.v}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(184,147,62,0.07)', border: '1px solid rgba(184,147,62,0.2)', padding: '0.5rem 0.65rem', marginTop: '0.5rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--gold2)', letterSpacing: '0.12em', marginBottom: '0.2rem' }}>REAL RATE (10Y − CPI)</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem', color: 'var(--gold2)' }}>
                {yields.realRate10Y.v}
                <span style={{ fontSize: '0.8rem', color: yields.realRate10Y.dir === 'down' ? '#4fc3a1' : '#e05c5c', marginLeft: '0.5rem' }}>{yields.realRate10Y.chg}</span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555', marginTop: '0.2rem', lineHeight: 1.5 }}>{yields.realRate10Y.note}</div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--gold2)', letterSpacing: '0.15em', marginBottom: '0.35rem' }}>
              HOW TO READ FED SPEECHES VIA 10Y YIELD (1H CHART)
            </div>
            <div style={{ fontSize: '0.9rem', color: '#bbb', lineHeight: 1.6, marginBottom: '0.55rem' }}>
              Watch the US 10Y yield on the <strong style={{ color: 'var(--gold2)' }}>1-hour chart</strong> for the first 60 minutes after any Fed official speaks. The yield move is the market's verdict — not the headline.
            </div>
            {SPEECH_SCENARIOS.map(s => <SpeechScenario key={s.type} scenario={s} />)}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--gold2)', letterSpacing: '0.15em', margin: '0.6rem 0 0.4rem' }}>
              RECENT FED SPEECH → YIELD REACTION LOG
            </div>
            {fedSpeeches.map((s, i) => {
              const chg = parseFloat(s.change);
              const cls = s.reaction === 'hawk' ? 'hawk' : 'dove';
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e1e', padding: '0.6rem 0.75rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#aaa' }}>{s.speaker} · {s.date}</span>
                    <span className={`bond-interp ${cls}`}>{cls === 'hawk' ? 'HAWKISH' : 'DOVISH'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>PRE: <span style={{ color: '#888' }}>{s.pre1H}</span></span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: chg > 0 ? '#e05c5c' : '#4fc3a1' }}>{s.post1H} ({s.change})</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--gold2)' }}>GOLD: {s.goldReaction}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#777', marginBottom: '0.25rem' }}>"{s.quote}"</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="two-col">
        <Card label={<>DR. COPPER — GLOBAL GROWTH PROXY <Dot src={copper.src || 'stale'} /></>}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.4rem', color: 'var(--ink)' }}>{copper.v}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.88rem', color: copper.dir === 'down' ? 'var(--red)' : 'var(--teal)' }}>{copper.chg}</div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.65rem' }}>{COPPER_ANALYSIS.note}</div>
          {COPPER_ANALYSIS.keyLevels.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.28rem 0', borderBottom: '1px solid var(--rule2)' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: l.label.includes('Current') ? 'var(--gold)' : 'var(--muted)' }}>{l.level}</span>
              <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>{l.label}</span>
            </div>
          ))}
        </Card>

        <Card label={<>CARRY TRADE MONITOR <span className="badge bear">UNWINDING</span></>}>
          {gb?.loading && (
            <div style={{ height: '2.5rem', background: '#111', borderRadius: 2, marginBottom: '0.6rem', opacity: 0.3 }} />
          )}
          {!gb?.loading && (
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: '0.6rem' }}>
              {carryAI || 'Carry trades borrow in low-rate currencies (JPY, CHF) to invest in high-yield ones. When BoJ hikes or risk spikes, rapid unwind occurs.'}
              {isAI && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--teal)', marginLeft: '0.5rem' }}>⚡ AI</span>}
            </div>
          )}
          {CARRY_PAIRS.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--rule2)' }}>
              <div>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: 'var(--ink)' }}>{p.pair}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: '0.4rem' }}>{p.note}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--muted)' }}>{p.spread}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', padding: '0.1rem 0.3rem', border: '1px solid', color: stColor(p.status), borderColor: stColor(p.status) }}>{p.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card label="G10 CENTRAL BANK DIVERGENCE — THE PRIMARY FX ENGINE">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem' }}>
          {CB_GROUPS.map((g, i) => (
            <div key={i} style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', borderTop: `3px solid ${g.color}`, padding: '0.5rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: g.color, letterSpacing: '0.12em', marginBottom: '0.3rem' }}>{g.grp}</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                {g.ccys.map(c => (
                  <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', padding: '0.1rem 0.3rem', background: 'rgba(0,0,0,0.06)', border: '1px solid var(--rule)' }}>
                    {CURRENCIES[c]?.flag} {c}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
