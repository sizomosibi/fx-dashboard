import { SectionHead } from '../ui/SectionHead.jsx';
import { Card } from '../ui/Card.jsx';
import { Dot } from '../ui/Dot.jsx';
import { COT, COT_AS_OF } from '../../data/scores.js';
import { CURRENCIES } from '../../data/currencies.js';
import { useCurrentCcy, useLiveData } from '../../context/AppContext.jsx';

// Merge live CFTC numbers (from cot-data.json via GitHub Actions) over static baseline.
// Only net + prev are overridden — label and detail text stay static.
function useMergedCOT() {
  const live = useLiveData();
  return Object.fromEntries(
    Object.entries(COT).map(([ccy, staticEntry]) => {
      const liveEntry = live.cot?.[ccy];
      return [ccy, liveEntry
        ? { ...staticEntry, net: liveEntry.net, prev: liveEntry.prev }
        : staticEntry
      ];
    })
  );
}

export function S7Cot({ brief }) {
  const cur    = useCurrentCcy();
  const live   = useLiveData();
  const merged = useMergedCOT();
  const cotSrc = live.status.cot;
  const isLive = cotSrc === 'live';
  const asOf   = live.cotAsOf || COT_AS_OF;

  // Use AI commentary for the selected currency detail if available
  const aiDetail = brief?.brief?.cotCommentary;

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={7} title="Market Positioning — COT (CFTC Speculative)" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <Dot src={cotSrc} />
        {isLive ? (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--teal)' }}>
            LIVE · CFTC Socrata (GitHub Actions) · Week of {asOf}
          </span>
        ) : (
          <>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--gold)' }}>
              BASELINE · Week of {asOf}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>
              — Trigger the <strong style={{ color: 'var(--ink)' }}>GitHub Actions</strong> workflow or run <code style={{ color: 'var(--ink)' }}>python scripts/fetch_cot.py</code> to update
            </span>
          </>
        )}
      </div>

      <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
        Net speculative positioning as % of open interest. Extreme (&gt;±60%) = crowded trade — reversals are violent.
        Published every Friday at 3:30pm ET by the CFTC.
      </div>

      <Card label="NET SPECULATIVE POSITIONING — G10 CURRENCIES">
        {Object.entries(merged).filter(([k]) => k !== 'XAU').map(([ccy, c]) => {
          const bw      = Math.min(Math.abs(c.net), 100) / 2;
          const isLong  = c.net > 0;
          const isCur   = ccy === cur;
          const chg     = c.net - c.prev;
          const hasLive = !!live.cot?.[ccy];
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
                width: '44px', textAlign: 'right', flexShrink: 0,
              }}>
                {chg > 0 ? '+' : ''}{chg}
              </span>
              {!hasLive && isLive && (
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
              {aiDetail && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--teal)', marginLeft: '0.75rem' }}>
                  ⚡ AI
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: '0.2rem' }}>
              {brief?.loading
                ? <span style={{ opacity: 0.4 }}>Generating AI commentary…</span>
                : aiDetail || (() => {
                    const { net, prev, detail } = merged[cur];
                    const chg     = net - prev;
                    const dir     = chg > 0 ? 'growing' : chg < 0 ? 'declining' : 'stable';
                    const extreme = Math.abs(net) > 60;
                    return (
                      <>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--ink)', marginRight: '0.5rem' }}>
                          Net {net > 0 ? 'Long' : 'Short'} {Math.abs(net)}%
                          {' '}(prev {prev > 0 ? '+' : ''}{prev}%, {dir})
                          {extreme && <span style={{ color: 'var(--red)', marginLeft: '0.4rem' }}>● CROWDED</span>}
                        </span>
                        <span>{detail}</span>
                      </>
                    );
                  })()
              }
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
