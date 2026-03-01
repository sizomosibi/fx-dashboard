import { useMemo } from 'react';
import { SCORES, PAIR_THESIS } from '../data/scores.js';
import { CURRENCIES } from '../data/currencies.js';
import { useCurrentCcy } from '../context/AppContext.jsx';

// ── Pure functions (no hooks, can be used outside React) ───────────

export function score(ccy) {
  const s = SCORES[ccy];
  if (!s) return 0;
  return (s.monetary * 2) + s.growth + s.inflation + s.risk + s.commodity;
}

export function getPairThesis(a, b) {
  return PAIR_THESIS[`${a}/${b}`] || PAIR_THESIS[`${b}/${a}`] || null;
}

export function allScores() {
  return Object.keys(CURRENCIES)
    .map(c => ({ ccy: c, score: score(c) }))
    .sort((a, b) => b.score - a.score);
}

// ── Hook: returns top pairs for the selected currency ──────────────
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

// ── Hook: all scores ranked for the sidebar G10 bar ───────────────
export function useAllScores() {
  return useMemo(() => allScores(), []);
}
