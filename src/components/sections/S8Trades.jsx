import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { CURRENCIES } from '../../data/currencies.js';
import { score, useTopPairs } from '../../hooks/useScores.js';
import { useCurrentCcy } from '../../context/AppContext.jsx';

function TradeCard({ cur, otherCcy, thesis }) {
  const { conviction = 65, summary, dir, entry, target, stop, risks = [], catalyst, timeframe, chain = [], tags = [] } = thesis;
  const convColor = conviction >= 75 ? 'var(--teal)' : conviction >= 50 ? 'var(--gold)' : 'var(--red)';
  const convLabel = conviction >= 75 ? 'HIGH' : conviction >= 50 ? 'MODERATE' : 'LOW';

  return (
    <div className="trade-card">
      <div className="tc-head">
        <div>
          <div className="tc-pair">{cur}/{otherCcy}</div>
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

export function S8Trades({ d }) {
  const cur     = useCurrentCcy();
  const pairs   = useTopPairs();
  const allCcys = Object.keys(CURRENCIES).filter(c => c !== 'XAU');
  const sorted  = [...allCcys].sort((a, b) => score(b) - score(a));
  const maxScore = Math.max(...allCcys.map(score));

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

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.1em', margin: '0.75rem 0 0.5rem' }}>
        TOP TRADE IDEAS FOR {cur}
      </div>

      {pairs.length > 0
        ? pairs.map(({ ccy: otherCcy, thesis }) => (
            <TradeCard key={otherCcy} cur={cur} otherCcy={otherCcy} thesis={thesis} />
          ))
        : <Card><div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>No trade thesis data available for this currency.</div></Card>
      }
    </>
  );
}
