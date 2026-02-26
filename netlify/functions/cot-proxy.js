/**
 * Netlify Function — COT Positioning via Nasdaq Data Link
 * GET /api/cot
 *
 * Source: Nasdaq Data Link CFTC dataset (same data as CFTC Socrata,
 * different CDN that does NOT block AWS Lambda IPs).
 *
 * SETUP (one-time):
 *   1. Free account at https://data.nasdaq.com/sign-up
 *   2. Copy your API key from https://data.nasdaq.com/account/profile
 *   3. Netlify Dashboard → Site → Environment Variables → Add:
 *        NASDAQ_DATA_LINK_KEY = your_key_here
 *
 * RATE LIMITS:
 *   Free tier: 300 calls/day authenticated (50 unauthenticated).
 *   This proxy fetches 9 contracts = 9 calls per Lambda invocation.
 *   Cache-Control: public, max-age=3600 means Netlify's CDN serves
 *   repeated requests without hitting Lambda — 9 API calls per hour max.
 *
 * DATASET:
 *   CFTC/{CODE}_F_ALL = Legacy Futures Only report, All traders.
 *   Column layout: [Date, OpenInterest, NoncommLong, NoncommShort, ...]
 *   We use indices 0–3 only. rows=2 gives current + previous week.
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

// Column indices in the Nasdaq Data Link response
const COL = { DATE: 0, OI: 1, LONG: 2, SHORT: 3 };

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  // Public cache: Netlify CDN serves repeat requests without hitting Lambda.
  // COT data is weekly — 1hr cache is safe and protects the rate limit.
  'Cache-Control':                'public, max-age=3600',
};

// Module-level in-memory cache — works across warm Lambda invocations.
// Secondary guard: CDN cache above is the primary protection.
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 55 * 60 * 1000; // 55 minutes

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
  const url =
    `https://data.nasdaq.com/api/v3/datasets/CFTC/${code}_F_ALL.json` +
    `?rows=2&api_key=${apiKey}`;

  const res = await timedFetch(url);

  if (res.status === 403) throw new Error(`API key rejected (403)`);
  if (res.status === 404) throw new Error(`Dataset ${code}_F_ALL not found (404)`);
  if (!res.ok)            throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const data = json?.dataset?.data;

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data rows in response`);
  }

  const net  = calcNet(data[0]);
  const prev = data[1] ? calcNet(data[1]) : net;

  if (net === null) throw new Error(`Zero open interest — calculation failed`);

  return {
    ccy,
    net,
    prev:  prev ?? net,
    asOf:  data[0][COL.DATE],
  };
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
      console.error(`[COT ${ccy}] ${errors[ccy]}`);
    }
  });

  return { cot, asOf, errors };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  // Return in-memory cached result if fresh
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    console.log('[COT] Serving from in-memory cache');
    return { statusCode: 200, headers: HEADERS, body: _cache };
  }

  const apiKey = process.env.NASDAQ_DATA_LINK_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        error: 'NASDAQ_DATA_LINK_KEY environment variable not set',
        setup: 'Add NASDAQ_DATA_LINK_KEY in Netlify Dashboard → Site → Environment Variables',
      }),
    };
  }

  const { cot, asOf, errors } = await fetchAllContracts(apiKey);

  if (Object.keys(cot).length === 0) {
    return {
      statusCode: 502,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'All contracts failed', errors }),
    };
  }

  const body = JSON.stringify({
    cot,
    asOf,
    errors:    Object.keys(errors).length ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  });

  // Store in module-level cache
  _cache   = body;
  _cacheTs = Date.now();

  return { statusCode: 200, headers: HEADERS, body };
};