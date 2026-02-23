import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { COT } from '../../data/scores.js';
import { CURRENCIES } from '../../data/currencies.js';
import { useCurrentCcy, useLiveData } from '../../context/AppContext.jsx';

// Merge live CFTC numbers over static COT fallback.
// Only net + prev are overridden; label + detail text stay static.
function useMergedCOT() {
  const live = useLiveData();
  return Object.fromEntries(
    Object.entries(COT).map(([ccy, staticEntry]) => {
      const liveEntry = live.cot[ccy];
      return [ccy, liveEntry
        ? { ...staticEntry, net: liveEntry.net, prev: liveEntry.prev }
        : staticEntry
      ];
    })
  );
}

export function S7Cot({ d }) {
  const cur     = useCurrentCcy();
  const live    = useLiveData();
  const merged  = useMergedCOT();
  const cotSrc  = live.status.cot;
  const lastDate = live.lastFetch
    ? live.lastFetch.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
    : null;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={7} title="Market Positioning — COT (CFTC Speculative)" />

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Net speculative positioning as % of open interest. Extreme (&gt;±60%) = crowded trade — reversals are violent.
        Published every Friday at 3:30pm ET by the CFTC. <Dot src={cotSrc} />
        {cotSrc === 'live' && lastDate && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--teal)', marginLeft: '0.5rem' }}>
            Fetched {lastDate}
          </span>
        )}
        {cotSrc === 'stale' && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--red)', marginLeft: '0.5rem' }}>
            CFTC API unavailable — showing hardcoded baseline
          </span>
        )}
      </div>

      <Card label="NET SPECULATIVE POSITIONING — G10 CURRENCIES">
        {Object.entries(merged).filter(([k]) => k !== 'XAU').map(([ccy, c]) => {
          const bw       = Math.min(Math.abs(c.net), 100) / 2;
          const isLong   = c.net > 0;
          const isCur    = ccy === cur;
          const chg      = c.net - c.prev;
          const isLive   = !!live.cot[ccy];
          return (
            <div key={ccy} className={`cot-row${isCur ? ' sel' : ''}`}>
              <span className={`cot-c${isCur ? ' sel' : ''}`}>
                {CURRENCIES[ccy]?.flag} {ccy}
              </span>
              <div className="cot-bar">
                <div className="cot-center" />
                <div className="cot-fill" style={{
                  width:      `${bw}%`,
                  marginLeft: isLong ? '50%' : `${50 - bw}%`,
                  background: isLong ? 'var(--teal)' : 'var(--red)',
                }} />
              </div>
              <span className={`cot-sig ${Math.abs(c.net) > 55 ? 'cl' : 'ok'}`}>
                {c.net > 0 ? '+' : ''}{c.net}%
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                color: chg > 0 ? 'var(--teal)' : chg < 0 ? 'var(--red)' : 'var(--muted)',
                width: '44px',
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {chg > 0 ? '+' : ''}{chg}
              </span>
              {!isLive && (
                <Dot src="stale" style={{ marginLeft: '4px' }} />
              )}
            </div>
          );
        })}

        {merged[cur] && (
          <div className="cot-detail">
            <div className="cot-d-lbl">
              {merged[cur].label}
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.68rem',
                color: merged[cur].net - merged[cur].prev > 0 ? 'var(--teal)' : 'var(--red)',
                marginLeft: '0.75rem',
              }}>
                {merged[cur].net - merged[cur].prev > 0 ? '+' : ''}{merged[cur].net - merged[cur].prev}% WoW
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: '0.2rem' }}>
              {merged[cur].detail}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
