import { useMemo } from 'react';
import { useLiveData } from '../context/AppContext.jsx';
import { MARKET_SNAPSHOT } from '../data/marketSnapshot.js';
import { CURRENCIES } from '../data/currencies.js';

// ── buildYield ─────────────────────────────────────────────────────
// Merges a live yield value (raw %) over the static snapshot entry.
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

// ── buildMarket ────────────────────────────────────────────────────
// markets[key] is now { price, change, changePct } from the Yahoo proxy.
// Falls back to static snapshot when no live data.
function buildMarket(key, staticObj, liveMarkets, fmtPrice, fmtChg) {
  const live = liveMarkets[key]; // { price, change, changePct } or undefined
  if (!live || live.price === undefined) return { ...staticObj, src: 'stale' };

  const p    = live.price;
  const chg  = live.change  ?? 0;
  const pct  = live.changePct ?? 0;
  const dir  = chg >= 0 ? 'up' : 'down';

  return {
    ...staticObj,
    v:      fmtPrice(p),
    chg:    fmtChg ? fmtChg(chg, pct) : `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}`,
    dir,
    raw:    p,         // raw number for calculations
    change: chg,
    changePct: pct,
    src:    'live',
  };
}

// ── formatters ─────────────────────────────────────────────────────
const fmtGold   = p    => `$${Math.round(p).toLocaleString()}`;
const fmtGoldC  = (c)  => `${c >= 0 ? '+' : ''}$${Math.abs(c).toFixed(0)}`;
const fmtOil    = p    => `$${p.toFixed(2)}`;
const fmtOilC   = (c)  => `${c >= 0 ? '+' : ''}$${Math.abs(c).toFixed(2)}`;
const fmtSPX    = p    => Math.round(p).toLocaleString();
const fmtSPXC   = (c)  => `${c >= 0 ? '+' : ''}${Math.round(c)}`;
const fmtVIX    = p    => p.toFixed(1);
const fmtVIXC   = (c)  => `${c >= 0 ? '+' : ''}${Math.abs(c).toFixed(1)}`;
const fmtDXY    = p    => p.toFixed(1);
const fmtDXYC   = (c)  => `${c >= 0 ? '+' : ''}${c.toFixed(1)}`;
const fmtCopper = p    => `$${p.toFixed(2)}/lb`;
const fmtCopperC = (c) => `${c >= 0 ? '+' : ''}$${Math.abs(c).toFixed(2)}`;

export function useMarketData() {
  const live = useLiveData();

  return useMemo(() => {
    const B = MARKET_SNAPSHOT;
    const L = live;

    // ── Yields ─────────────────────────────────────────────────────
    const yUS2Y  = buildYield('US2Y',  B.yields.US2Y,  L.yields);
    const yUS5Y  = buildYield('US5Y',  B.yields.US5Y,  L.yields);
    const yUS10Y = buildYield('US10Y', B.yields.US10Y, L.yields);
    const yUS30Y = buildYield('US30Y', B.yields.US30Y, L.yields);

    const t10  = L.yields.US10Y ?? parseFloat(B.yields.US10Y.v);
    const t2   = L.yields.US2Y  ?? parseFloat(B.yields.US2Y.v);
    const t5   = L.yields.US5Y  ?? parseFloat(B.yields.US5Y.v);
    const bp   = Math.round((t10 - t2) * 100);

    // Real rate: 10Y nominal − CPI
    // Use live US10Y if available. CPI from USD triad data in currencies.js
    // (updated monthly via §11 Update Assistant) — eliminates the stale magic number.
    const usdCpiRaw = CURRENCIES.USD?.triad?.inf?.[0]?.v || '2.9%';
    const cpi       = parseFloat(usdCpiRaw) || 2.9;
    const realRate  = +(t10 - cpi).toFixed(2);
    const realRateStatic = parseFloat(B.yields.realRate10Y.v);
    const rrChg    = +(realRate - realRateStatic).toFixed(2);

    // ── Markets ────────────────────────────────────────────────────
    const gold   = buildMarket('xau',    B.gold,   L.markets, fmtGold,   fmtGoldC);
    const oil    = buildMarket('wti',    B.oil,    L.markets, fmtOil,    fmtOilC);
    const spx    = buildMarket('spx',    B.spx,    L.markets, fmtSPX,    fmtSPXC);
    const vix    = buildMarket('vix',    B.vix,    L.markets, fmtVIX,    fmtVIXC);
    const dxy    = buildMarket('dxy',    B.dxy,    L.markets, fmtDXY,    fmtDXYC);
    const copper = buildMarket('copper', B.copper, L.markets, fmtCopper, fmtCopperC);

    return {
      yields: {
        US2Y:  yUS2Y,
        US5Y:  yUS5Y,
        US10Y: yUS10Y,
        US30Y: yUS30Y,
        realRate10Y: {
          ...B.yields.realRate10Y,
          v:    `${realRate >= 0 ? '+' : ''}${realRate.toFixed(2)}%`,
          chg:  `${rrChg >= 0 ? '+' : ''}${rrChg.toFixed(2)}%`,
          dir:  rrChg >= 0 ? 'up' : 'down',
          src:  L.yields.US10Y !== undefined ? 'live' : 'stale',
        },
        spread2s10s: {
          ...B.yields.spread2s10s,
          v:         `${bp >= 0 ? '+' : ''}${bp}bp`,
          direction: t10 > t2 ? 'Normal (steepening)' : 'Inverted',
          signal:    t10 > t2 ? 'norm' : 'inv',
          src:       L.yields.US10Y !== undefined ? 'live' : 'stale',
        },
        // Full curve array for chart use
        curve: [
          { tenor: '1M',  val: L.yields.m1  ?? null },
          { tenor: '3M',  val: L.yields.m3  ?? null },
          { tenor: '6M',  val: L.yields.m6  ?? null },
          { tenor: '1Y',  val: L.yields.y1  ?? null },
          { tenor: '2Y',  val: t2 },
          { tenor: '3Y',  val: L.yields.y3  ?? null },
          { tenor: '5Y',  val: t5 },
          { tenor: '7Y',  val: L.yields.y7  ?? null },
          { tenor: '10Y', val: t10 },
          { tenor: '30Y', val: L.yields.US30Y ?? null },
        ].filter(x => x.val !== null),
      },
      gold,
      oil,
      spx,
      vix,
      dxy,
      copper,
      fedSpeeches: B.fedSpeeches,
    };
  }, [live]);
}
