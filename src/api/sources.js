// ── API Sources ────────────────────────────────────────────────────
// RULE: Nothing here calls an external domain directly.
// Every fetch goes to /api/* (Netlify Functions) which run server-side
// and are never subject to browser CORS restrictions.
//
// Exceptions that are genuinely CORS-safe from browsers:
//   - api.frankfurter.app  (has open CORS headers)
//
// Everything else — ECB, BoC, SNB, CFTC, Yahoo, Treasury — must go
// through a proxy function.

// ── FX Spot — Frankfurter.app (open CORS, no key) ──────────────────
export async function fetchFX() {
  const res = await fetch(
    'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,CAD,AUD,NZD'
  );
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const { rates } = await res.json();
  return {
    fx: {
      'EUR/USD': +(1 / rates.EUR).toFixed(4),
      'GBP/USD': +(1 / rates.GBP).toFixed(4),
      'USD/JPY': +rates.JPY.toFixed(2),
      'USD/CHF': +rates.CHF.toFixed(4),
      'USD/CAD': +rates.CAD.toFixed(4),
      'AUD/USD': +(1 / rates.AUD).toFixed(4),
      'NZD/USD': +(1 / rates.NZD).toFixed(4),
    },
  };
}

// ── US Treasury Yield Curve — /api/yields proxy ────────────────────
export async function fetchYields() {
  const res = await fetch('/api/yields');
  if (!res.ok) throw new Error(`Yields proxy HTTP ${res.status}`);
  const { yields } = await res.json();
  if (!yields || Object.keys(yields).length === 0) throw new Error('No yield data');
  return { yields };
}

// ── Market Prices — /api/markets proxy (Yahoo Finance server-side) ──
export async function fetchMarkets() {
  const res = await fetch('/api/markets');
  if (!res.ok) throw new Error(`Markets proxy HTTP ${res.status}`);
  const { markets } = await res.json();
  if (!markets || Object.keys(markets).length === 0) throw new Error('No market data');
  return { markets };
}

// ── CB Rates — /api/cb-rates proxy (Netlify env vars) ─────────────
// ECB, BoC, and SNB APIs block AWS Lambda IPs. Rates are stored as
// Netlify environment variables (RATE_EUR, RATE_CAD, RATE_CHF) and
// returned directly — zero external HTTP calls, zero failure modes.
export async function fetchCBRates() {
  const res = await fetch('/api/cb-rates');
  if (!res.ok) throw new Error(`CB rates proxy HTTP ${res.status}`);
  const { rates } = await res.json();
  if (!rates || Object.keys(rates).length === 0) throw new Error('No CB rate data');
  return { cbRates: rates };
}

// ── COT Positioning — /cot-data.json (static file, no proxy needed) ─
// public/cot-data.json is committed by GitHub Actions every Friday via
// scripts/fetch_cot.py. Vite copies public/ to dist/ at build time, so
// Netlify's CDN serves it at /cot-data.json — same origin, no CORS,
// no Lambda. Netlify rebuilds automatically when the file is committed.
export async function fetchCOT() {
  const res = await fetch('/cot-data.json');
  if (!res.ok) throw new Error(`cot-data.json HTTP ${res.status}`);
  const { cot, asOf } = await res.json();
  if (!cot || Object.keys(cot).length === 0) throw new Error('No COT data');
  return { cot, cotAsOf: asOf || null };
}

// ── Economic Calendar — /api/calendar proxy (ForexFactory) ─────────
export async function fetchCalendar() {
  const res = await fetch('/api/calendar');
  if (!res.ok) throw new Error(`Calendar proxy HTTP ${res.status}`);
  const { byCurrency, fetchedAt } = await res.json();
  if (!byCurrency) throw new Error('No calendar data');
  return { calendar: byCurrency, _calendarFetchedAt: fetchedAt };
}

// ── News Headlines — /api/news proxy (RSS aggregation) ─────────────
export async function fetchNews() {
  const res = await fetch('/api/news');
  if (!res.ok) throw new Error(`News proxy HTTP ${res.status}`);
  const { byCurrency, fetchedAt } = await res.json();
  if (!byCurrency) throw new Error('No news data');
  return { news: byCurrency, _newsFetchedAt: fetchedAt };
}
