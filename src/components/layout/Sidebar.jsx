import { CURRENCIES } from '../../data/currencies.js';
import { useCurrentCcy, useDispatch } from '../../context/AppContext.jsx';
import { useCurrencyData } from '../../hooks/useCurrencyData.js';
import { useAllScores, score } from '../../hooks/useScores.js';
import { Dot } from '../ui/Dot.jsx';

const NAV_ITEMS = [
  { num: 1,  label: 'MACRO CONTEXT' },
  { num: 2,  label: 'MONETARY POLICY' },
  { num: 3,  label: 'ECONOMIC TRIAD' },
  { num: 4,  label: 'EXTERNAL SECTOR' },
  { num: 5,  label: 'CALENDAR & CONSENSUS' },
  { num: 6,  label: 'GEOPOLITICAL' },
  { num: 7,  label: 'MARKET POSITIONING' },
  { num: 8,  label: 'TRADE IDEAS' },
  { num: 9,  label: 'AI ANALYST' },
  { num: 10, label: 'EXECUTION' },
  { num: 11, label: 'UPDATE ASSISTANT', badge: 'NEW' },
];

export function Sidebar() {
  const cur      = useCurrentCcy();
  const dispatch = useDispatch();
  const d        = useCurrencyData();
  const allScrs  = useAllScores();
  const isGold   = cur === 'XAU';

  const maxAbs   = Math.max(...allScrs.map(x => Math.abs(x.score)));
  const curScore = score(cur);
  const pct      = Math.min((Math.abs(curScore) / (maxAbs || 1)) * 100, 100);
  const barCol   = curScore > 2 ? '#1a6b5a' : curScore < -2 ? '#8b2020' : '#8c6d2f';

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside className="sidebar">
      {/* Score card */}
      <div className="sb-score">
        <div className="sb-flag">{d.flag}</div>
        <div className="sb-ccy-name">{d.name}</div>
        <div className="sb-cb">{isGold ? 'Safe-Haven · No Central Bank' : d.centralBank}</div>

        {isGold ? (
          <>
            <div className="sb-rate-lbl">SPOT PRICE</div>
            <div className="sb-rate live-val">{d.spotPrice}</div>
            <div className="sb-bias hawkish">BULLISH</div>
          </>
        ) : (
          <>
            <div className="sb-rate-lbl">
              BENCHMARK RATE <Dot src={d.rateSrc} />
            </div>
            <div className={`sb-rate ${d.rateSrc === 'live' ? 'live-val' : d.rateSrc === 'manual' ? 'manual-val' : 'stale-val'}`}>
              {d.interestRate}
            </div>
            <div className={`sb-bias ${d.bias}`}>{d.bias.toUpperCase()}</div>
          </>
        )}

        <div className="sb-div-lbl">
          {isGold ? 'STRENGTH SCORE' : 'DIVERGENCE SCORE'}
        </div>
        <div className="sb-div-bar">
          <div className="sb-div-fill" style={{ width: `${pct}%`, background: isGold ? '#4fc3a1' : barCol }} />
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555', marginTop: '0.2rem' }}>
          {curScore > 0 ? '+' : ''}{curScore.toFixed(1)} / {maxAbs.toFixed(1)}
        </div>
      </div>

      {/* Navigation */}
      <div className="sb-label">BRIEFING</div>
      {!isGold && NAV_ITEMS.map(item => (
        <a
          key={item.num}
          className="nav-link"
          href={`#s${item.num}`}
          onClick={e => { e.preventDefault(); scrollTo(`s${item.num}`); }}
        >
          <span className="nav-num">{String(item.num).padStart(2, '0')}</span>
          <span className="nav-lbl">{item.label}</span>
          {item.badge && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.6rem',
              background: 'rgba(196,151,58,0.15)',
              color: 'var(--gold)',
              border: '1px solid rgba(196,151,58,0.3)',
              padding: '0.05rem 0.3rem',
              marginLeft: 'auto',
              letterSpacing: '0.08em',
            }}>
              {item.badge}
            </span>
          )}
        </a>
      ))}

      {/* G10 + Gold strength ranking */}
      <div className="sb-label" style={{ marginTop: '0.75rem' }}>G10 + GOLD STRENGTH</div>
      <div className="g10-list">
        {allScrs.map(({ ccy, score: s }) => {
          const bw  = Math.min((Math.abs(s) / (maxAbs || 1)) * 100, 100) / 2;
          const col = ccy === 'XAU' ? '#b8933e' : s > 2 ? '#1a6b5a' : s < -2 ? '#8b2020' : '#8c6d2f';
          return (
            <div
              key={ccy}
              className={`g10-row${ccy === cur ? ' sel' : ''}`}
              onClick={() => dispatch({ type: 'SET_CURRENCY', payload: ccy })}
            >
              <span className={`g10-c${ccy === cur ? ' sel' : ''}`}>
                {CURRENCIES[ccy]?.flag} {ccy}
              </span>
              <div className="g10-bar">
                <div className="g10-fill" style={{
                  width:      `${bw}%`,
                  marginLeft: `${s > 0 ? 50 : 50 - bw}%`,
                  background: col,
                }} />
              </div>
              <span className="g10-s" style={{ color: col }}>
                {s > 0 ? '+' : ''}{s.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
