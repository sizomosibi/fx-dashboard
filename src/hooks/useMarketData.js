import { useMemo } from 'react';
import { useLiveData } from '../context/AppContext.jsx';
import { MARKET_SNAPSHOT } from '../data/marketSnapshot.js';

// ── useMarketData ──────────────────────────────────────────────────
// Returns a merged view of static MARKET_SNAPSHOT + LiveData overrides.
// Section components call this hook — they never read MARKET_SNAPSHOT
// or LiveData directly, so the data source is transparent to them.

function buildYield(key, staticObj, liveYields) {
  const live = liveYields[key];
  if (live === undefined) return { ...staticObj, src: 'stale' };
  const prev = parseFloat(staticObj.v);
  const chg  = +(live - prev).toFixed(2);
  return {
    v:      `${live.toFixed(2)}%`,
    chg:    `${chg >= 0 ? '+' : ''}${chg}%`,
    dir:    chg >= 0 ? 'up' : 'down',
    interp: chg >= 0 ? 'hawk' : 'dove',
    src:    'live',
  };
}

function buildMarket(key, staticObj, liveMarkets, fmt) {
  const live = liveMarkets[key];
  if (live === undefined) return { ...staticObj, src: 'stale' };
  return { ...staticObj, v: fmt(live), src: 'live' };
}

export function useMarketData() {
  const live = useLiveData();

  return useMemo(() => {
    const B = MARKET_SNAPSHOT;
    const L = live;

    const yUS2Y  = buildYield('US2Y',  B.yields.US2Y,  L.yields);
    const yUS5Y  = buildYield('US5Y',  B.yields.US5Y,  L.yields);
    const yUS10Y = buildYield('US10Y', B.yields.US10Y, L.yields);
    const yUS30Y = buildYield('US30Y', B.yields.US30Y, L.yields);

    const liveT10 = L.yields.US10Y || parseFloat(B.yields.US10Y.v);
    const liveT2  = L.yields.US2Y  || parseFloat(B.yields.US2Y.v);
    const bp      = Math.round((liveT10 - liveT2) * 100);

    return {
      yields: {
        US2Y:       yUS2Y,
        US5Y:       yUS5Y,
        US10Y:      yUS10Y,
        US30Y:      yUS30Y,
        realRate10Y: B.yields.realRate10Y,
        spread2s10s: {
          ...B.yields.spread2s10s,
          v:         `${bp >= 0 ? '+' : ''}${bp}bp`,
          direction: liveT10 > liveT2 ? 'Normal' : 'Inverted',
          signal:    liveT10 > liveT2 ? 'norm' : 'inv',
          src:       L.yields.US10Y !== undefined ? 'live' : 'stale',
        },
      },
      vix:    buildMarket('vix',    B.vix,    L.markets, v => v.toFixed(1)),
      dxy:    buildMarket('dxy',    B.dxy,    L.markets, v => v.toFixed(1)),
      spx:    buildMarket('spx',    B.spx,    L.markets, v => Math.round(v).toLocaleString()),
      gold:   buildMarket('xau',    B.gold,   L.markets, v => `$${Math.round(v).toLocaleString()}`),
      oil:    buildMarket('wti',    B.oil,    L.markets, v => `$${v.toFixed(2)}`),
      copper: buildMarket('copper', B.copper, L.markets, v => `$${v.toFixed(2)}/lb`),
      fedSpeeches: B.fedSpeeches,
    };
  }, [live]);
}
