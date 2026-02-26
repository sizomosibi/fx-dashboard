/**
 * Netlify Function — COT Positioning via Nasdaq Data Link
 * GET /api/cot
 *
 * SETUP: Add NASDAQ_DATA_LINK_KEY in Netlify Dashboard → Environment Variables
 * Free account: https://data.nasdaq.com/sign-up
 * API key: https://data.nasdaq.com/account/profile
 *
 * Dataset: Nasdaq Data Link CFTC database — Legacy Futures Only report.
 * Tries _F_ALL suffix first, then _F_L (both are valid Nasdaq naming variants).
 * Exact errors per contract are logged to Netlify function logs.
 */

const CONTRACTS = {
  EUR: '099741',  // Euro FX, CME
  JPY: '097741',  // Japanese Yen, CME
  GBP: '096742',  // British Pound, CME
  CHF: '092741',  // Swiss Franc, CME
  CAD: '090741',  // Canadian Dollar, CME
  AUD: '232741',  // Australian Dollar, CME
  NZD: '112741',  // New Zealand Dollar, CME
  USD: '098662',  // US Dollar Index, ICE
  XAU: '088691',  // Gold, COMEX
};

// Column indices in Nasdaq Data Link CFTC response
// dataset.data rows: [Date, OpenInterest, NoncommLong, NoncommShort, ...]
const COL = { DATE: 0, OI: 1, LONG: 2, SHORT: 3 };

// Dataset suffixes to try in order
const SUFFIXES = ['_F_ALL', '_F_L'];

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 55 * 60 * 1000;

function timedFetch(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    headers: { 'User-Agent': 'FXDashboard/2.0', 'Accept': 'application/json' },
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));
}

function calcNet(row) {
  const oi  = Number(row[COL.OI]);
  const lng = Number(row[COL.LONG]);
  const sht = Number(row[COL.SHORT]);
  if (!oi) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

async function fetchContract(ccy, code, apiKey) {
  let lastErr;

  // Try each suffix variant — both are valid Nasdaq Data Link naming conventions
  for (const suffix of SUFFIXES) {
    const url =
      `https://data.nasdaq.com/api/v3/datasets/CFTC/${code}${suffix}.json` +
      `?rows=2&api_key=${apiKey}`;
    try {
      const res = await timedFetch(url);

      // Log full details for every response — visible in Netlify function logs
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const msg = `${code}${suffix}: HTTP ${res.status} — ${body.slice(0, 200)}`;
        console.error(`[COT ${ccy}] ${msg}`);
        lastErr = new Error(msg);
        continue; // try next suffix
      }

      const json = await res.json();
      const data = json?.dataset?.data;

      if (!Array.isArray(data) || data.length === 0) {
        const msg = `${code}${suffix}: no data rows — ${JSON.stringify(json).slice(0, 200)}`;
        console.error(`[COT ${ccy}] ${msg}`);
        lastErr = new Error(msg);
        continue;
      }

      const net  = calcNet(data[0]);
      const prev = data[1] ? calcNet(data[1]) : net;
      if (net === null) throw new Error(`${code}${suffix}: zero open interest`);

      console.log(`[COT ${ccy}] OK via ${suffix} — net=${net}% asOf=${data[0][COL.DATE]}`);
      return { net, prev: prev ?? net, asOf: data[0][COL.DATE] };

    } catch (e) {
      lastErr = e;
      console.error(`[COT ${ccy}] ${code}${suffix} threw: ${e.message}`);
    }
  }

  throw lastErr || new Error(`${code}: all suffixes failed`);
}

async function fetchAllContracts(apiKey) {
  const entries = Object.entries(CONTRACTS);
  const results = await Promise.allSettled(
    entries.map(([ccy, code]) => fetchContract(ccy, code, apiKey))
  );

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  results.forEach((result, i) => {
    const [ccy] = entries[i];
    if (result.status === 'fulfilled') {
      const { net, prev, asOf: date } = result.value;
      cot[ccy] = { net, prev };
      if (!asOf) asOf = date;
    } else {
      errors[ccy] = result.reason?.message ?? 'unknown';
    }
  });

  return { cot, asOf, errors };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return { statusCode: 200, headers: HEADERS, body: _cache };
  }

  const apiKey = process.env.NASDAQ_DATA_LINK_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        error: 'NASDAQ_DATA_LINK_KEY not set',
        setup: 'Netlify Dashboard → Site → Environment Variables → Add NASDAQ_DATA_LINK_KEY',
      }),
    };
  }

  const { cot, asOf, errors } = await fetchAllContracts(apiKey);

  if (Object.keys(cot).length === 0) {
    // Return 502 with full error details — visible in browser network tab
    return {
      statusCode: 502,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        error: 'All contracts failed — check Netlify function logs for per-contract details',
        errors,
      }),
    };
  }

  const body = JSON.stringify({
    cot,
    asOf,
    errors:    Object.keys(errors).length ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  });

  _cache   = body;
  _cacheTs = Date.now();

  return { statusCode: 200, headers: HEADERS, body };
};