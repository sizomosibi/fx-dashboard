import { useMemo } from 'react';
import { CURRENCIES } from '../data/currencies.js';
import { useLiveData, useCurrentCcy } from '../context/AppContext.jsx';

// ── mergeTriad ─────────────────────────────────────────────────────
function mergeTriad(staticTriad, liveMacro) {
  if (!liveMacro || !staticTriad) return staticTriad;
  const inf = staticTriad.inf ? [...staticTriad.inf] : [];
  const emp = staticTriad.emp ? [...staticTriad.emp] : [];

  if (liveMacro.cpi !== undefined && inf[0]) {
    const prev = parseFloat(inf[0].v);
    const live = +liveMacro.cpi.toFixed(1);
    const chg  = +(live - prev).toFixed(1);
    inf[0] = { ...inf[0], v: `${live}%`, c: `${chg >= 0 ? '+' : ''}${chg}%`, d: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat', src: 'live' };
  }
  if (liveMacro.unemployment !== undefined && emp[0]) {
    const prev = parseFloat(emp[0].v);
    const live = +liveMacro.unemployment.toFixed(1);
    const chg  = +(live - prev).toFixed(1);
    emp[0] = { ...emp[0], v: `${live}%`, c: `${chg >= 0 ? '+' : ''}${chg}%`, d: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat', src: 'live' };
  }
  return { ...staticTriad, inf, emp };
}

// ── mergeGold ──────────────────────────────────────────────────────
// Merges live XAU/USD price from Yahoo Finance into XAU currency fields.
// GoldBrief uses d.spotPrice / d.priceChange — this fixes the $2,935 bug.
function mergeGold(base, liveXAU) {
  if (!liveXAU || !liveXAU.price) return base;

  const price    = Math.round(liveXAU.price);
  const change   = liveXAU.change   ?? 0;
  const changePct = liveXAU.changePct ?? 0;

  // Update drivers that reference live market data
  const drivers = (base.drivers || []).map(dr => {
    if (dr.label === 'VIX (VOLATILITY INDEX)') return dr;   // vix comes from mkt, not here
    if (dr.label === 'DXY (US DOLLAR INDEX)')  return dr;   // dxy comes from mkt
    return dr;
  });

  return {
    ...base,
    spotPrice:   `$${price.toLocaleString()}`,
    interestRate: `$${price.toLocaleString()}`,  // sidebar uses interestRate
    priceChange: `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(0)}`,
    pctChange:   `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
    drivers,
    rateSrc: 'live',
  };
}

// ── useCurrencyData ────────────────────────────────────────────────
export function useCurrencyData() {
  const cur  = useCurrentCcy();
  const live = useLiveData();

  return useMemo(() => {
    const base = CURRENCIES[cur];

    // ── XAU — merge live gold price ────────────────────────────────
    if (cur === 'XAU') {
      return mergeGold(base, live.markets.xau);
    }

    // ── G10 FX currencies ──────────────────────────────────────────
    const liveRate = live.cbRates[cur];
    const rateSrc  = !liveRate
      ? 'stale'
      : (live.status.cbRates === 'live' || live.status.cbRates === 'live-partial')
        ? 'live' : 'manual';

    const liveMacro = live.intlMacro[cur];
    const triad     = mergeTriad(base.triad, liveMacro);
    const triadSrc  = live.status.triad === 'live' && liveMacro ? 'live' : 'stale';

    return {
      ...base,
      ...(liveRate ? { interestRate: liveRate } : {}),
      triad,
      rateSrc,
      triadSrc,
    };
  }, [cur, live.cbRates, live.intlMacro, live.markets, live.status]);
}
