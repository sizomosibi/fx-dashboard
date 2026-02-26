/**
 * Netlify Function — CFTC COT Positioning Proxy
 * GET /api/cot
 *
 * Runtime requirements:
 *   - Node 18 (pinned via netlify.toml [build.environment] NODE_VERSION=18)
 *   - No AbortSignal.timeout() — replaced with manual AbortController+setTimeout
 *
 * Strategy: ONE Socrata query with no $where clause.
 * - No $where = no SoQL parsing — Socrata just returns the most recent rows.
 * - $limit=500 ordered newest-first covers all 9 contracts × several weeks.
 * - Filter to our contracts in JS after fetch — no special chars in the URL.
 * - Fallback: second CFTC domain (data.cftc.gov).
 * - Fail fast: 8s total, not 18–30s.
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'no-store',
};

const CONTRACT_MAP = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE':                'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE':           'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE':            'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':        'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':      'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE':     'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.':                 'USD',
  'GOLD - COMMODITY EXCHANGE INC.':                       'XAU',
};

// Safe timeout wrapper — AbortSignal.timeout() doesn't exist on Node <17.3
// and silently breaks the request before it's even sent.
function timedFetch(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function calcNet(row) {
  const oi  = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

const SOCRATA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
  'Accept':     'application/json',
};

const SELECT = [
  'market_and_exchange_names',
  'as_of_date_in_form_yyyy_mm_dd',
  'open_interest_all',
  'noncomm_positions_long_all',
  'noncomm_positions_short_all',
].join(',');

// No $where — avoids SoQL parsing that CFTC's Socrata was rejecting.
// $limit=500 newest-first gives us multiple weeks across all contracts.
const QUERY = `$order=as_of_date_in_form_yyyy_mm_dd%20DESC&$limit=500&$select=${SELECT}`;

const ENDPOINTS = [
  `https://publicreporting.cftc.gov/resource/gpe5-46if.json?${QUERY}`,
  `https://data.cftc.gov/resource/gpe5-46if.json?${QUERY}`,
];

async function fetchFromSocrata() {
  let lastErr;

  for (const url of ENDPOINTS) {
    try {
      const res = await timedFetch(url, { headers: SOCRATA_HEADERS }, 8000);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();

      // Socrata returns an error object (not array) when it rejects a query
      if (!Array.isArray(data)) {
        throw new Error(`Non-array response: ${JSON.stringify(data).slice(0, 200)}`);
      }
      if (data.length === 0) {
        throw new Error('Empty result set');
      }

      return data;
    } catch (e) {
      lastErr = e;
      console.error(`[COT] ${url.slice(0, 55)}... — ${e.message}`);
    }
  }

  throw new Error(`Both endpoints failed. Last: ${lastErr?.message}`);
}

function parseRows(rows) {
  // Rows are newest-first. Group by contract, keep 2 most recent per contract.
  const byContract = {};
  for (const row of rows) {
    const name = row.market_and_exchange_names;
    if (!byContract[name]) byContract[name] = [];
    if (byContract[name].length < 2) byContract[name].push(row);
  }

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  for (const [contractName, ccyKey] of Object.entries(CONTRACT_MAP)) {
    const contractRows = byContract[contractName];
    if (!contractRows?.length) { errors[ccyKey] = 'not in results'; continue; }

    const net  = calcNet(contractRows[0]);
    const prev = contractRows[1] ? calcNet(contractRows[1]) : net;
    if (net === null) { errors[ccyKey] = 'zero OI'; continue; }

    cot[ccyKey] = { net, prev: prev ?? net };
    if (!asOf) asOf = contractRows[0].as_of_date_in_form_yyyy_mm_dd;
  }

  return { cot, asOf, errors };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  let rows;
  try {
    rows = await fetchFromSocrata();
  } catch (e) {
    console.error('[COT fatal]', e.message);
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: e.message }),
    };
  }

  const { cot, asOf, errors } = parseRows(rows);

  if (Object.keys(cot).length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Parsed 0 contracts', errors, totalRows: rows.length }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      cot,
      asOf,
      totalRows:  rows.length,
      errors:     Object.keys(errors).length ? errors : undefined,
      fetchedAt:  new Date().toISOString(),
    }),
  };
};