import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { COT } from '../../data/scores.js';
import { S9AI } from './S9AI.jsx';
import { useLiveData } from '../../context/AppContext.jsx';

const DATA_TRANSLATIONS = [
  { data: 'CPI INFLATION', bullish: 'PCE beats + Fed holds → real rates fall → gold up', bearish: 'PCE misses → disinflation → rate cuts → gold mixed' },
  { data: 'GDP GROWTH',    bullish: 'GDP weak → recession risk → safe-haven demand → gold up', bearish: 'GDP strong → risk-on → equities preferred' },
  { data: 'NFP',           bullish: 'NFP weak → dovish Fed → 10Y falls → real rates down → gold up', bearish: 'NFP strong → Fed holds → USD bid → gold dip (buy the dip)' },
  { data: 'DXY',           bullish: 'USD weakens → non-USD gold cheaper → global demand up', bearish: 'USD strengthens → gold expensive globally → selling pressure' },
  { data: 'GEOPOLITICAL',  bullish: 'Crisis/war/tariffs escalate → safe-haven bid → gold spikes', bearish: 'Peace/deal/resolution → de-risk → gold gives back premium' },
  { data: 'REAL RATE',     bullish: 'Real rates fall (inflation > yields) → opportunity cost drops → gold up', bearish: 'Real rates rise → bonds more attractive → gold headwind' },
];

export function GoldBrief({ d, mkt }) {
  const { yields, vix, dxy } = mkt;
  const liveData = useLiveData();

  const rr      = parseFloat(yields.realRate10Y.v);
  const rrPct   = Math.min(Math.max((rr + 2) / 4 * 100, 0), 1) * 100;
  const rrColor = rr < 0 ? '#4fc3a1' : rr < 0.5 ? 'var(--gold2)' : '#e05c5c';
  const rrLabel = rr < 0 ? 'NEGATIVE → VERY BULLISH GOLD' : rr < 0.5 ? 'LOW → BULLISH GOLD' : rr < 1.5 ? 'RISING → HEADWIND' : 'HIGH → BEARISH GOLD';

  const cotG = COT['XAU'] || { net: 35, prev: 17, label: 'COMEX Gold Futures', detail: 'Building positioning. Not extreme — room for further longs.' };
  const cotBW = Math.min(Math.abs(cotG.net), 100) / 2;

  return (
    <>
      {/* Gold Hero */}
      <div className="gold-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555', letterSpacing: '0.15em', marginBottom: '0.2rem' }}>
              GLOBAL SAFE-HAVEN ASSET · XAU/USD <Dot src={liveData.markets?.xau?.price ? 'live' : 'stale'} />
            </div>
            <div className="gold-price-big">{d.spotPrice}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.95rem', color: '#4fc3a1' }}>{d.priceChange}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.88rem', color: '#4fc3a1' }}>{d.pctChange}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#555' }}>YTD: <span style={{ color: '#4fc3a1' }}>{d.ytdChange}</span></span>
            </div>
            <div className="gold-price-lbl">SPOT GOLD — LONDON PM FIX</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="cb-bias-tag bullish" style={{ borderColor: '#4fc3a1', color: '#4fc3a1' }}>BULLISH BIAS</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#444', marginTop: '0.5rem' }}>PRICE PATH ESTIMATE</div>
            <div className="rate-path-row">
              {d.ratePath?.map((v, i) => (
                <span key={i}>
                  <div className="rp-item">
                    <div className={`rp-dot${i === 1 ? ' current' : ' projected'}`} />
                    <div className="rp-val" style={{ color: i === 1 ? 'var(--gold2)' : '#555' }}>{v}</div>
                    <div className="rp-lbl">{d.ratePathLabels?.[i]}</div>
                  </div>
                  {i < d.ratePath.length - 1 && <div className="rp-line" />}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="gold-drivers">
          {[
            { label:'REAL RATE (10Y − CPI)', value:yields.realRate10Y.v,  delta:yields.realRate10Y.chg, dir:yields.realRate10Y.dir, src:yields.realRate10Y.src, note:d.drivers?.[0]?.note||'Falling real rates = gold bullish.' },
            { label:'DXY (USD INDEX)',        value:dxy.v,                 delta:dxy.chg,                dir:dxy.dir,               src:dxy.src,               note:d.drivers?.[1]?.note||'Inverse relationship with gold.' },
            { label:'FED FUNDS RATE',         value:liveData.cbRates?.USD||d.drivers?.[2]?.value||'4.25–4.50%', delta:d.drivers?.[2]?.delta||'0.00%', dir:d.drivers?.[2]?.dir||'flat', src:liveData.cbRates?.USD?'manual':'stale', note:d.drivers?.[2]?.note||'Fed on hold.' },
            { label:'VIX (VOLATILITY)',       value:vix.v,                 delta:vix.chg,                dir:vix.dir,               src:vix.src,               note:d.drivers?.[3]?.note||'Elevated VIX = safe-haven demand.' },
          ].map((dr, i) => (
            <div key={i} className="gold-driver-box">
              <div className="gd-label">{dr.label} <Dot src={dr.src||'stale'} /></div>
              <div className="gd-value">{dr.value}</div>
              <div className={`gd-delta ${dr.dir==='up'?'bull':dr.dir==='down'?'bear':'flat'}`}>{dr.delta}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.65rem',color:'#555',marginTop:'0.3rem',lineHeight:1.5}}>{dr.note}</div>
            </div>
          ))}
        </div>

        <div className="gold-thesis-block">
          <div className="gold-thesis-lbl">CURRENT THESIS</div>
          <div className="gold-thesis-text">
            Three converging forces: (1) Real rates falling as inflation re-accelerates while Fed holds.
            (2) Structural CB demand (1,045t in 2025) from de-dollarisation — China, India, Poland buying regardless of price.
            (3) Geopolitical risk premium (US-China trade war, Ukraine) sustaining safe-haven bid.
            The stagflation scenario — inflation sticky + growth weak = Fed trapped = real rates fall — is the most bullish environment for gold.
          </div>
        </div>
      </div>

      <SectionHead num={1} title="Primary Drivers — What Moves Gold" id="s1" />

      <Card label={<>DRIVER 1 — US REAL INTEREST RATE (MOST IMPORTANT) <span className={`badge ${rr < 0.5 ? 'bull' : 'bear'}`}>{rrLabel}</span></>}>
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: '0.6rem' }}>
          Real rate = 10Y yield <strong>minus</strong> inflation. Gold pays no yield — when real rates fall, holding gold becomes relatively more attractive vs bonds.
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.05rem', color: 'var(--ink)' }}>{yields.US10Y.v}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: 'var(--muted)' }}>− CPI 2.9% =</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem', color: rrColor, fontWeight: 500 }}>REAL RATE {yields.realRate10Y.v}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: yields.realRate10Y.dir === 'down' ? 'var(--teal)' : 'var(--red)' }}>{yields.realRate10Y.chg}</span>
        </div>
        <div className="real-rate-bar">
          <div className="real-rate-zero" />
          <div className="real-rate-fill" style={{ width: `${rrPct}%`, background: rrColor }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
          <span>−2% (VERY BULLISH)</span><span>0%</span><span>+2% (BEARISH)</span>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: '0.5rem' }}>{yields.realRate10Y.note}</div>
      </Card>

      <SectionHead num={2} title="Gold Fundamentals — Supply, Demand & Positioning" id="s2" />

      <div className="two-col">
        <Card label="PHYSICAL DEMAND BY REGION">
          {d.partners?.map((p, i) => (
            <div key={i} className="partner-row">
              <div className="partner-l">
                <span className="p-flag">{p.flag}</span>
                <div>
                  <div><span className="p-name">{p.name}</span><span className="p-share">{p.share} of demand</span></div>
                  <div className="p-comm">{p.commodity}</div>
                  <div className="p-note">{p.note}</div>
                </div>
              </div>
              <span className={`imp-pill ${p.impact}`}>{p.impact.toUpperCase()}</span>
            </div>
          ))}
        </Card>

        <Card label="COMEX POSITIONING (COT)">
          <div className="cot-row">
            <span className="cot-c sel">🥇 GOLD</span>
            <div className="cot-bar">
              <div className="cot-center" />
              <div className="cot-fill" style={{ width: `${cotBW}%`, marginLeft: '50%', background: 'var(--teal)' }} />
            </div>
            <span className={`cot-sig ${cotBW > 30 ? 'cl' : 'ok'}`}>+{cotG.net}%</span>
          </div>
          <div className="cot-detail" style={{ marginTop: '0.5rem' }}>
            <div className="cot-d-lbl">{cotG.label}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.84rem', color: 'var(--teal)', marginBottom: '0.25rem' }}>+{cotG.net - cotG.prev}% WoW (building)</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>{cotG.detail}</div>
          </div>
        </Card>
      </div>

      <SectionHead num={3} title="Economic Data Through a Gold Lens" id="s3" />
      <Card label="HOW ECONOMIC DATA AFFECTS GOLD — TRANSLATION TABLE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.1rem' }}>
          {DATA_TRANSLATIONS.map((item, i) => (
            <div key={i} style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', padding: '0.55rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>{item.data}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--teal)', marginBottom: '0.25rem', lineHeight: 1.4 }}>▲ {item.bullish}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--red)', lineHeight: 1.4 }}>▼ {item.bearish}</div>
            </div>
          ))}
        </div>
      </Card>

      {d.chains && (
        <Card label="CAUSE & EFFECT CHAINS">
          {d.chains.map((chain, i) => (
            <div key={i} className="chain-wrap">
              <div className="chain-lbl">SCENARIO {i + 1}</div>
              <div className="chain-steps">
                {chain.map((step, j) => (
                  <span key={j}><span className="cs">{step}</span>{j < chain.length - 1 && <span className="ca">→</span>}</span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      <SectionHead num={4} title="Geopolitical Risk Premium Analysis" id="s4" />
      {d.geopolitical?.map((g, i) => (
        <div key={i} className={`geo-card ${g.effect}`}>
          <div className="geo-head">
            <div className="geo-title">{g.title}</div>
            <span className={`geo-pill ${g.effect}`}>{g.effect.toUpperCase()}</span>
          </div>
          <div className="geo-analysis">{g.analysis}</div>
        </div>
      ))}

      <SectionHead num={5} title="Economic Calendar — Gold-Relevant Events" id="s5" />
      <Card style={{ overflowX: 'auto' }}>
        <table className="cal-table">
          <thead>
            <tr><th>DATE</th><th>EVENT</th><th>PRIOR / FORECAST</th><th>GOLD TRADE TRIGGER</th></tr>
          </thead>
          <tbody>
            {d.weekAhead?.map((e, i) => (
              <tr key={i}>
                <td className="cal-date">{e.date}</td>
                <td>
                  <div className="cal-event">{e.event}</div>
                  <span className={`cal-imp-pill ${e.impact}`}>{e.impact.toUpperCase()}</span>
                </td>
                <td><div className="consensus-cell">
                  <span className="cons-prior">PRIOR: {e.prior}</span>
                  <span className="cons-fcst">FCST: {e.consensus}</span>
                </div></td>
                <td className="cal-trigger">{e.trigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <S9AI d={d} mkt={mkt} />
    </>
  );
}
