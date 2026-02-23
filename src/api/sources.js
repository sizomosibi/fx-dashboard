// ── API Sources ────────────────────────────────────────────────────
// Each source is a self-contained async function.
// Returns a partial LiveData patch object — never reads or writes
// global state directly. Caller (useLiveData hook) applies the patch.

// ── Frankfurter.app — G10 FX spot (no key, ECB reference rates) ───
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

// ── US Treasury — yield curve (no key, fiscaldata.treasury.gov) ────
export async function fetchTreasury() {
  const since = new Date();
  since.setMonth(since.getMonth() - 2);
  const sinceStr = since.toISOString().split('T')[0];
  const url = `https://api.fiscaldata.treasury.gov/v1/accounting/od/avg_interest_rates` +
    `?fields=record_date,avg_interest_rate_amt,security_desc` +
    `&filter=security_desc:in:(Treasury Bonds,Treasury Notes),record_date:gte:${sinceStr}` +
    `&sort=-record_date&page[size]=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Treasury HTTP ${res.status}`);
  const { data } = await res.json();
  if (!data?.length) throw new Error('No Treasury data');
  const byDesc = {};
  for (const row of data) {
    if (!byDesc[row.security_desc])
      byDesc[row.security_desc] = parseFloat(row.avg_interest_rate_amt);
  }
  const yields = {};
  if (byDesc['Treasury Notes']) yields.US10Y = byDesc['Treasury Notes'];
  if (byDesc['Treasury Bonds']) yields.US30Y = byDesc['Treasury Bonds'];
  return { yields };
}

// ── ECB — deposit facility rate (no key) ──────────────────────────
export async function fetchECB() {
  const url = 'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=csvdata&lastNObservations=1';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n').filter(l => !l.startsWith('KEY'));
  const last = lines[lines.length - 1];
  if (!last) throw new Error('No ECB data');
  const rate = parseFloat(last.split(',').pop());
  if (isNaN(rate)) throw new Error('ECB rate parse failed');
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
  if (isNaN(rate)) throw new Error('BoC rate parse failed');
  return { cbRates: { CAD: `${rate.toFixed(2)}%` } };
}

// ── SNB — sight deposit rate (no key, data.snb.ch) ────────────────
export async function fetchSNB() {
  const res = await fetch('https://data.snb.ch/api/data/ZIMOM/json');
  if (!res.ok) throw new Error(`SNB HTTP ${res.status}`);
  const d = await res.json();
  const rows = d?.rows || [];
  if (!rows.length) throw new Error('No SNB data');
  const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
  if (isNaN(rate)) throw new Error('SNB rate parse failed');
  return { cbRates: { CHF: `${rate.toFixed(2)}%` } };
}

// ── FRED — Fed rate + US yields + macro (free key, 25k calls/day) ─
const FRED_SERIES = {
  DFEDTARU: 'fedUpper',
  DFEDTARL: 'fedLower',
  DGS2:     'US2Y',
  DGS5:     'US5Y',
  DGS10:    'US10Y',
  DGS30:    'US30Y',
  CPIAUCSL: 'cpi',
  PCEPILFE: 'corePCE',
  UNRATE:   'unemployment',
  PAYEMS:   'nfp',
};

export async function fetchFRED(apiKey) {
  const base = 'https://api.stlouisfed.org/fred/series/observations';
  const fetches = Object.keys(FRED_SERIES).map(id =>
    fetch(`${base}?series_id=${id}&api_key=${apiKey}&limit=1&sort_order=desc&file_type=json`)
      .then(r => r.json())
      .then(d => {
        const obs = d.observations || [];
        const hit = obs.find(o => o.value !== '.') || obs[0];
        return hit ? parseFloat(hit.value) : null;
      })
      .catch(() => null)
  );
  const results = await Promise.all(fetches);
  const vals = {};
  Object.keys(FRED_SERIES).forEach((id, i) => {
    if (results[i] !== null) vals[FRED_SERIES[id]] = results[i];
  });

  const patch = { yields: {}, cbRates: {}, usMacro: {} };
  if (vals.fedUpper && vals.fedLower)
    patch.cbRates.USD = `${vals.fedLower.toFixed(2)}–${vals.fedUpper.toFixed(2)}%`;
  ['US2Y', 'US5Y', 'US10Y', 'US30Y'].forEach(k => {
    if (vals[k]) patch.yields[k] = vals[k];
  });
  ['cpi', 'corePCE', 'unemployment', 'nfp'].forEach(k => {
    if (vals[k]) patch.usMacro[k] = vals[k];
  });
  return patch;
}

// ── Twelve Data — Gold, Oil, S&P, VIX, DXY, Copper (800/day free) ─
// Single batch call — efficient, low credit usage
const TD_SYMBOLS = {
  'XAU/USD':  'xau',
  'WTI/USD':  'wti',
  'SPX':      'spx',
  'VIX':      'vix',
  'DX-Y.NYB': 'dxy',
  'HG/USD':   'copper',
};

export async function fetchTwelveData(apiKey) {
  const symbols = Object.keys(TD_SYMBOLS).join(',');
  const res = await fetch(
    `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`
  );
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const d = await res.json();
  if (d.code === 429) throw new Error('Twelve Data rate limit');
  if (d.message) throw new Error(d.message);

  const markets = {};
  for (const [sym, key] of Object.entries(TD_SYMBOLS)) {
    const price = parseFloat(d[sym]?.price);
    if (!isNaN(price) && price > 0) markets[key] = price;
  }
  return { markets };
}

// ── CFTC COT — net speculative positioning (no key, weekly Friday) ─
// Uses CFTC's Socrata public API. Legacy Futures Only report.
// Net = (non-commercial long − short) / open interest × 100
// Fetches latest 2 weeks per contract to compute WoW change.

const CFTC_CONTRACTS = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE':         'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE':    'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE':     'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.':          'USD',
};

async function fetchCFTCContract(marketName) {
  const encoded = encodeURIComponent(marketName);
  const url =
    `https://publicreporting.cftc.gov/resource/gpe5-46if.json` +
    `?market_and_exchange_names=${encoded}` +
    `&$order=as_of_date_in_form_yyyy_mm_dd%20DESC` +
    `&$limit=2` +
    `&$select=as_of_date_in_form_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CFTC HTTP ${res.status}`);
  return res.json();
}

function calcNet(row) {
  const oi   = parseFloat(row.open_interest_all);
  const lng  = parseFloat(row.noncomm_positions_long_all);
  const sht  = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0 || isNaN(lng) || isNaN(sht)) return null;
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
    if (res.status !== 'fulfilled') {
      console.warn(`[CFTC] ${ccy} failed:`, res.reason?.message);
      return;
    }
    const rows = res.value;
    if (!rows?.length) return;
    const net  = calcNet(rows[0]);
    const prev = rows[1] ? calcNet(rows[1]) : net;
    if (net === null) return;
    cot[ccy] = { net, prev: prev ?? net };
  });

  if (Object.keys(cot).length === 0) throw new Error('No CFTC data parsed');
  return { cot };
}

// ── FRED — International triad: CPI + unemployment per G10 country ─
// Requires FRED API key. These are OECD harmonised series on FRED.
// Data is monthly (some quarterly) — updates with ~1–2 month lag.

const TRIAD_SERIES = {
  // CPI YoY % change (OECD harmonised where possible)
  AUD_cpi:          'AUSCPIALLQNMEI',   // quarterly % change
  EUR_cpi:          'CPALTT01EZM657N',  // monthly YoY
  GBP_cpi:          'CPALTT01GBM657N',  // monthly YoY
  JPY_cpi:          'CPALTT01JPM657N',  // monthly YoY
  CAD_cpi:          'CPALTT01CAM657N',  // monthly YoY
  NZD_cpi:          'CPALTT01NZQ657N',  // quarterly YoY
  // Unemployment rate (OECD harmonised, monthly seasonally adjusted)
  AUD_unemployment: 'LRHUTTTTAUM156N',
  EUR_unemployment: 'LRHUTTTTEZM156N',
  GBP_unemployment: 'LRHUTTTTGBM156N',
  JPY_unemployment: 'LRHUTTTTJPM156N',
  CAD_unemployment: 'LRHUTTTTCAM156N',
  NZD_unemployment: 'LRHUTTTTNZM156N',
};

export async function fetchTriad(apiKey) {
  const base = 'https://api.stlouisfed.org/fred/series/observations';
  const fetches = Object.keys(TRIAD_SERIES).map(key =>
    fetch(`${base}?series_id=${TRIAD_SERIES[key]}&api_key=${apiKey}&limit=1&sort_order=desc&file_type=json`)
      .then(r => r.json())
      .then(d => {
        const obs = d.observations || [];
        const hit = obs.find(o => o.value !== '.') || obs[0];
        return hit ? parseFloat(hit.value) : null;
      })
      .catch(() => null)
  );

  const vals  = await Promise.all(fetches);
  const intlMacro = {};
  Object.keys(TRIAD_SERIES).forEach((key, i) => {
    if (vals[i] === null || isNaN(vals[i])) return;
    const [ccy, field] = key.split('_');
    if (!intlMacro[ccy]) intlMacro[ccy] = {};
    intlMacro[ccy][field] = vals[i];
  });

  if (Object.keys(intlMacro).length === 0) throw new Error('No FRED intl data');
  return { intlMacro };
}
