import { useMemo } from 'react';
import { CURRENCIES } from '../data/currencies.js';
import { useLiveData, useCurrentCcy } from '../context/AppContext.jsx';

// ── mergeTriad ─────────────────────────────────────────────────────
// Merges live FRED numbers (cpi, unemployment) over the static triad
// display arrays. Only updates the headline value (index 0) per pillar.
function mergeTriad(staticTriad, liveMacro) {
  if (!liveMacro || !staticTriad) return staticTriad;

  const inf = staticTriad.inf ? [...staticTriad.inf] : [];
  const emp = staticTriad.emp ? [...staticTriad.emp] : [];

  if (liveMacro.cpi !== undefined && inf[0]) {
    const prev  = parseFloat(inf[0].v);
    const live  = +liveMacro.cpi.toFixed(1);
    const chg   = +(live - prev).toFixed(1);
    inf[0] = {
      ...inf[0],
      v:   `${live}%`,
      c:   `${chg >= 0 ? '+' : ''}${chg}%`,
      d:   chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat',
      src: 'live',
    };
  }

  if (liveMacro.unemployment !== undefined && emp[0]) {
    const prev = parseFloat(emp[0].v);
    const live = +liveMacro.unemployment.toFixed(1);
    const chg  = +(live - prev).toFixed(1);
    emp[0] = {
      ...emp[0],
      v:   `${live}%`,
      c:   `${chg >= 0 ? '+' : ''}${chg}%`,
      d:   chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat',
      src: 'live',
    };
  }

  return { ...staticTriad, inf, emp };
}

// ── useCurrencyData ────────────────────────────────────────────────
// Returns CURRENCIES[cur] merged with:
//   - live CB rate (cbRates)
//   - live triad numbers (intlMacro)
// Components never touch CURRENCIES or liveData directly.
export function useCurrencyData() {
  const cur  = useCurrentCcy();
  const live = useLiveData();

  return useMemo(() => {
    const base = CURRENCIES[cur];

    // CB rate
    const liveRate = live.cbRates[cur];
    const rateSrc  = !liveRate
      ? 'stale'
      : (live.status.cbRates === 'live' || live.status.cbRates === 'live-partial')
        ? 'live'
        : 'manual';

    // Triad merge
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
  }, [cur, live.cbRates, live.intlMacro, live.status.cbRates, live.status.triad]);
}
