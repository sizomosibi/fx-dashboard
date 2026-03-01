import { useMemo } from 'react';
import { SCORES, PAIR_THESIS } from '../data/scores.js';
import { CURRENCIES } from '../data/currencies.js';
import { useCurrentCcy } from '../context/AppContext.jsx';

// ── Pure functions (no hooks, can be used outside React) ────────────
//
// Score formula: monetary×2 + growth + inflation + risk + commodity
//
// Priority: currencies.js score{} field → SCORES fallback (XAU only)
//
// When a CB pivots, update bias + cbGroup + score in currencies.js via §11
// Update Assistant. The currencies.js score{} field is the source of truth.
// SCORES in scores.js is kept only for XAU (no currencies.js entry) and as
// a legacy reference for direct imports.

export function score(ccy) {
  // Prefer the score{} field embedded alongside each currency in currencies.js
  const cdata = CURRENCIES[ccy];
  if (cdata && cdata.score) {
    const s = cdata.score;
    return (s.monetary * 2) + s.growth + s.inflation + s.risk + s.commodity;
  }
  // Fallback: SCORES object in scores.js — used for XAU and missing entries
  const s = SCORES[ccy];
  if (!s) return 0;
  return (s.monetary * 2) + s.growth + s.inflation + s.risk + s.commodity;
}

export function getPairThesis(a, b) {
  return PAIR_THESIS[`${a}/${b}`] || PAIR_THESIS[`${b}/${a}`] || null;
}

export function allScores() {
  // Include XAU even though it's not in CURRENCIES
  const ccys = [...Object.keys(CURRENCIES), 'XAU'];
  return [...new Set(ccys)]
    .map(c => ({ ccy: c, score: score(c) }))
    .sort((a, b) => b.score - a.score);
}

// ── Hook: returns top pairs for the selected currency ────────────────
export function useTopPairs() {
  const cur = useCurrentCcy();

  return useMemo(() => {
    if (cur === 'XAU') return [];
    const others = Object.keys(CURRENCIES).filter(c => c !== cur && c !== 'XAU');
    return others
      .map(c => ({
        ccy:    c,
        spread: Math.abs(score(cur) - score(c)),
        thesis: getPairThesis(cur, c),
      }))
      .filter(x => x.thesis)
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 3);
  }, [cur]);
}

// ── Hook: all scores ranked for the sidebar G10 bar ─────────────────
export function useAllScores() {
  return useMemo(() => allScores(), []);
}
