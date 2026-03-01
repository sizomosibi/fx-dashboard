import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { CURRENCIES } from '../../data/currencies.js';
import { score, useTopPairs } from '../../hooks/useScores.js';
import { useCurrentCcy } from '../../context/AppContext.jsx';

// ── Skeleton card for loading state ─────────────────────────────────
function TradeCardSkeleton() {
  return (
    <div className="trade-card" style={{ opacity: 0.35 }}>
      <div style={{ height: '1rem',  background: '#1a1a1a', borderRadius: 2, width: '35%', marginBottom: '0.6rem' }} />
      <div style={{ height: '0.75rem', background: '#161616', borderRadius: 2, width: '70%', marginBottom: '0.35rem' }} />
      <div style={{ height: '0.75rem', background: '#161616', borderRadius: 2, width: '90%', marginBottom: '0.35rem' }} />
      <div style={{ height: '0.75rem', background: '#161616', borderRadius: 2, width: '60%', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        {[40, 40, 40].map((w, i) => (
          <div key={i} style={{ height: '2rem', background: '#111', borderRadius: 2, width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function TradeCard({ cur, otherCcy, thesis }) {
  const {
    conviction = 65, summary, dir, entry, target, stop,
    risks = [], catalyst, timeframe, chain = [], tags = [],
  } = thesis;

  const convColor = conviction >= 75 ? 'var(--teal)' : conviction >= 50 ? 'var(--gold)' : 'var(--red)';
  const convLabel = conviction >= 75 ? 'HIGH' : conviction >= 50 ? 'MODERATE' : 'LOW';

  return (
    <div className="trade-card">
      <div className="tc-head">
        <div>
          <div className="tc-pair">{thesis.pair || `${cur}/${otherCcy}`}</div>
          <div className="tc-summary">{summary}</div>
        </div>
        <span className={`tc-dir${dir === 'long' ? ' lng' : ' sht'}`}>{dir === 'long' ? 'LONG BASE' : 'SHORT BASE'}</span>
      </div>
      <div className="tc-body">
        <div className="tc-conv">
          <span className="conv-l">CONVICTION</span>
          <div className="conv-t"><div className="conv-f" style={{ width: `${conviction}%`, background: convColor }} /></div>
          <span className="conv-p" style={{ color: convColor }}>{convLabel} ({conviction}%)</span>
        </div>
        <div className="div-tags">
          {tags.map((t, i) => <span key={i} className="div-tag">{t}</span>)}
        </div>
        <div className="tc-thesis">{thesis.thesis}</div>
        <div className="tc-chain">
          {chain.map((c, i) => (
            <span key={i}><span className="tcs">{c}</span>{i < chain.length - 1 && <span className="tca">→</span>}</span>
          ))}
        </div>
        <div className="tc-levels">
          <div className="lvl"><div className="lvl-lbl">ENTRY</div><div className="lvl-v entry">{entry}</div></div>
          <div className="lvl"><div className="lvl-lbl">TARGET</div><div className="lvl-v tgt">{target}</div></div>
          <div className="lvl"><div className="lvl-lbl">STOP</div><div className="lvl-v stop">{stop}</div></div>
        </div>
        <div>
          {risks.map((r, i) => <div key={i} className="tc-risk">{r}</div>)}
        </div>
      </div>
      <div className="tc-foot">
        <span className="tc-cat">📌 {catalyst}</span>
        <span className="tc-tf">⏱ {timeframe}</span>
      </div>
    </div>
  );
}

export function S8Trades({ d, brief }) {
  const cur     = useCurrentCcy();
  const pairs   = useTopPairs();          // static fallback pairs from scores.js
  const allCcys = Object.keys(CURRENCIES).filter(c => c !== 'XAU');
  const sorted  = [...allCcys].sort((a, b) => score(b) - score(a));

  // Use AI pair thesis if available, fall back to static PAIR_THESIS via useTopPairs
  const aiThesis  = brief?.brief?.pairThesis;
  const isAI      = Array.isArray(aiThesis) && aiThesis.length > 0;
  const isLoading = brief?.loading;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={8} title="Trade Ideas — Divergence-Based Pair Analysis" />

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Pairs ranked by fundamental divergence. Larger spread = stronger thesis. Combine with §05 consensus and §07 COT.
      </div>

      {/* Rank chips */}
      <div className="rank-row">
        {sorted.map(ccy => {
          const s = score(ccy);
          const col = s > 2 ? 'var(--teal)' : s < -2 ? 'var(--red)' : 'var(--gold)';
          return (
            <span key={ccy} className={`rank-chip${ccy === cur ? ' sel' : ''}`} style={{ borderColor: col, color: ccy === cur ? 'var(--ink)' : col, background: ccy === cur ? col : 'transparent' }}>
              {CURRENCIES[ccy].flag} {ccy} {s > 0 ? '+' : ''}{s.toFixed(0)}
            </span>
          );
        })}
      </div>

      {/* Divergence matrix */}
      <div className="mtx-wrap">
        <table className="mtx">
          <thead>
            <tr><th>CCY</th><th>CB BIAS</th><th>GROWTH</th><th>INFLATION</th><th>RISK TYPE</th><th>COMMODITY</th><th>SCORE</th></tr>
          </thead>
          <tbody>
            {allCcys.map(ccy => {
              const c = CURRENCIES[ccy];
              const s = score(ccy);
              return (
                <tr key={ccy} style={ccy === cur ? { background: 'rgba(184,147,62,0.06)' } : {}}>
                  <td><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem' }}>{c.flag} {ccy}</span></td>
                  <td><span className={`badge ${c.bias}`}>{c.bias?.toUpperCase()}</span></td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem' }}>{(c.triad?.gro?.[0] || {}).v || '—'}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem' }}>{(c.triad?.inf?.[0] || {}).v || '—'}</td>
                  <td><span className={`badge ${c.riskType === 'safe-haven' ? 'neut' : c.riskType === 'risk-on' ? 'bull' : 'bear'}`}>{c.riskType || '—'}</span></td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem' }}>{c.commodityExposure || '—'}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.88rem', color: s > 2 ? 'var(--teal)' : s < -2 ? 'var(--red)' : 'var(--gold)' }}>
                    {s > 0 ? '+' : ''}{s.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trade ideas header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0 0.5rem' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          TOP TRADE IDEAS FOR {cur}
        </span>
        {isAI && (
          <>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--teal)' }}>
              ⚡ AI · {brief.source === 'cache' ? 'CACHED' : 'LIVE'}
            </span>
            <button
              onClick={brief.refresh}
              title="Regenerate with current data"
              style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', padding: '0.1rem 0.4rem', cursor: 'pointer', borderRadius: 2 }}
            >↺ REFRESH</button>
          </>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <>
          <TradeCardSkeleton />
          <TradeCardSkeleton />
        </>
      )}

      {/* AI-generated trade ideas */}
      {!isLoading && isAI && aiThesis.map((thesis, i) => (
        <TradeCard key={i} cur={cur} otherCcy={''} thesis={thesis} />
      ))}

      {/* Static fallback from scores.js when AI unavailable */}
      {!isLoading && !isAI && (
        pairs.length > 0
          ? pairs.map(({ ccy: otherCcy, thesis }) => (
              <TradeCard key={otherCcy} cur={cur} otherCcy={otherCcy} thesis={thesis} />
            ))
          : <Card><div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>No trade thesis data available for this currency.</div></Card>
      )}
    </>
  );
}
