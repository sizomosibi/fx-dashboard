// ── API Sources ────────────────────────────────────────────────────
// All external calls go through Netlify Functions (/api/*) to avoid
// CORS and to eliminate API key requirements. Zero keys needed.
// Each function returns a partial LiveData patch object.

// ── FX Spot — Frankfurter.app (ECB reference, no key) ─────────────
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

// ── US Treasury Yield Curve — via Netlify proxy (no key) ───────────
// Returns { yields: { US2Y, US5Y, US10Y, US30Y, spread2s10s, ... } }
export async function fetchYields() {
  const res = await fetch('/api/yields');
  if (!res.ok) throw new Error(`Yields proxy HTTP ${res.status}`);
  const { yields } = await res.json();
  if (!yields || Object.keys(yields).length === 0) throw new Error('No yield data');
  return { yields };
}

// ── Market Prices — Yahoo Finance via Netlify proxy (no key) ───────
// Returns { markets: { xau:{price,change,changePct}, wti:{...}, ... } }
export async function fetchMarkets() {
  const res = await fetch('/api/markets');
  if (!res.ok) throw new Error(`Markets proxy HTTP ${res.status}`);
  const { markets } = await res.json();
  if (!markets || Object.keys(markets).length === 0) throw new Error('No market data');
  return { markets };
}

// ── ECB — deposit facility rate (no key) ──────────────────────────
export async function fetchECB() {
  const url = 'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=csvdata&lastNObservations=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const text  = await res.text();
  const lines = text.trim().split('\n').filter(l => !l.startsWith('KEY'));
  const last  = lines[lines.length - 1];
  if (!last) throw new Error('No ECB data');
  const rate = parseFloat(last.split(',').pop());
  if (isNaN(rate)) throw new Error('ECB parse failed');
  return { cbRates: { EUR: `${rate.toFixed(2)}%` } };
}

// ── Bank of Canada — overnight rate (no key) ──────────────────────
export async function fetchBoC() {
  const res = await fetch(
    'https://www.bankofcanada.ca/valet/observations/AUCRT/json?recent=2'
  );
  if (!res.ok) throw new Error(`BoC HTTP ${res.status}`);
  const { observations } = await res.json();
  if (!observations?.length) throw new Error('No BoC data');
  const rate = parseFloat(observations[0].AUCRT.v);
  if (isNaN(rate)) throw new Error('BoC parse failed');
  return { cbRates: { CAD: `${rate.toFixed(2)}%` } };
}

// ── SNB — sight deposit rate (no key) ─────────────────────────────
export async function fetchSNB() {
  const res = await fetch('https://data.snb.ch/api/data/ZIMOM/json');
  if (!res.ok) throw new Error(`SNB HTTP ${res.status}`);
  const d    = await res.json();
  const rows = d?.rows || [];
  if (!rows.length) throw new Error('No SNB data');
  const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
  if (isNaN(rate)) throw new Error('SNB parse failed');
  return { cbRates: { CHF: `${rate.toFixed(2)}%` } };
}

// ── CFTC COT — net speculative positioning (no key, weekly) ────────
const CFTC_CONTRACTS = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE':              'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE':         'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE':          'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':      'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':    'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE':   'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.':               'USD',
};

async function fetchCFTCContract(marketName) {
  const encoded = encodeURIComponent(marketName);
  const url = `https://publicreporting.cftc.gov/resource/gpe5-46if.json` +
    `?market_and_exchange_names=${encoded}` +
    `&$order=as_of_date_in_form_yyyy_mm_dd%20DESC&$limit=2` +
    `&$select=as_of_date_in_form_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CFTC HTTP ${res.status}`);
  return res.json();
}

function calcCOTNet(row) {
  const oi  = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

export async function fetchCOT() {
  const entries = Object.entries(CFTC_CONTRACTS);
  const results = await Promise.allSettled(
    entries.map(([market]) => fetchCFTCContract(market))
  );
  const cot = {};
  results.forEach((res, i) => {
    const ccy = entries[i][1];
    if (res.status !== 'fulfilled') return;
    const rows = res.value;
    if (!rows?.length) return;
    const net  = calcCOTNet(rows[0]);
    const prev = rows[1] ? calcCOTNet(rows[1]) : net;
    if (net === null) return;
    cot[ccy] = { net, prev: prev ?? net };
  });
  if (Object.keys(cot).length === 0) throw new Error('No CFTC data');
  return { cot };
}

// ── ForexFactory Calendar — via Netlify proxy (no key) ────────────
export async function fetchCalendar() {
  const res = await fetch('/api/calendar?week=both');
  if (!res.ok) throw new Error(`Calendar proxy HTTP ${res.status}`);
  const { byCurrency, fetchedAt } = await res.json();
  if (!byCurrency) throw new Error('No calendar data');
  return { calendar: byCurrency, _calendarFetchedAt: fetchedAt };
}

// ── News — RSS aggregation via Netlify proxy (no key) ─────────────
export async function fetchNews() {
  const res = await fetch('/api/news');
  if (!res.ok) throw new Error(`News proxy HTTP ${res.status}`);
  const { byCurrency, fetchedAt } = await res.json();
  if (!byCurrency) throw new Error('No news data');
  return { news: byCurrency, _newsFetchedAt: fetchedAt };
}
