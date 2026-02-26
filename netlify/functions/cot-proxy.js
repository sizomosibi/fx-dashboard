/**
 * Netlify Function — CFTC COT Positioning Proxy
 * GET /api/cot
 *
 * Strategy: ONE bulk request for all recent rows, filter by name in JS.
 * This avoids the special-character encoding issues that broke per-contract
 * queries, and cuts 9 HTTP requests down to 1 (well within 26s timeout).
 *
 * Data source: CFTC Socrata — Traders in Financial Futures (gpe5-46if)
 * Updated weekly, Friday 3:30pm ET.
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

// Exact CFTC market_and_exchange_names values → our CCY keys
const CONTRACTS = {
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

function calcNet(row) {
  const oi  = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

// Rolling 10-week cutoff date — guarantees at least 2 reports per contract
function cutoffDate() {
  const d = new Date();
  d.setDate(d.getDate() - 70); // 10 weeks back
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function fetchAllCOT() {
  // Single request: all rows since cutoff, ordered newest-first.
  // $where uses only a date comparison — no special chars that break Socrata.
  const since  = cutoffDate();
  const select = [
    'market_and_exchange_names',
    'as_of_date_in_form_yyyy_mm_dd',
    'open_interest_all',
    'noncomm_positions_long_all',
    'noncomm_positions_short_all',
  ].join(',');

  const where  = encodeURIComponent(`as_of_date_in_form_yyyy_mm_dd >= '${since}'`);
  const order  = 'as_of_date_in_form_yyyy_mm_dd%20DESC';
  const limit  = 300; // ~9 contracts × ~10 reports = 90 rows max, 300 is plenty

  const endpoints = [
    `https://publicreporting.cftc.gov/resource/gpe5-46if.json`,
    `https://data.cftc.gov/resource/gpe5-46if.json`,  // fallback domain
  ];

  let lastErr;
  for (const base of endpoints) {
    const url = `${base}?$where=${where}&$order=${order}&$limit=${limit}&$select=${select}`;
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal:  AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${base}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Response not an array');
      if (data.length === 0) throw new Error('Empty dataset');
      return data;
    } catch (e) {
      lastErr = e;
      console.warn(`[COT] ${base} failed: ${e.message}`);
    }
  }
  throw new Error(`Both CFTC endpoints failed: ${lastErr?.message}`);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  let allRows;
  try {
    allRows = await fetchAllCOT();
  } catch (e) {
    console.error('[COT Proxy fatal]', e.message);
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: e.message }),
    };
  }

  // Group rows by contract name, keeping only the 2 most recent per contract
  // (rows are already ordered newest-first from the API)
  const byContract = {};
  for (const row of allRows) {
    const name = row.market_and_exchange_names;
    if (!byContract[name]) byContract[name] = [];
    if (byContract[name].length < 2) byContract[name].push(row);
  }

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  for (const [contractName, ccyKey] of Object.entries(CONTRACTS)) {
    const rows = byContract[contractName];
    if (!rows?.length) {
      errors[ccyKey] = 'no rows found';
      continue;
    }

    const net  = calcNet(rows[0]);
    const prev = rows[1] ? calcNet(rows[1]) : net;

    if (net === null) {
      errors[ccyKey] = 'zero open interest';
      continue;
    }

    cot[ccyKey] = { net, prev: prev ?? net };

    if (!asOf && rows[0].as_of_date_in_form_yyyy_mm_dd) {
      asOf = rows[0].as_of_date_in_form_yyyy_mm_dd;
    }
  }

  if (Object.keys(cot).length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'No COT data parsed', errors, totalRows: allRows.length }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      cot,
      asOf,
      errors:    Object.keys(errors).length ? errors : undefined,
      totalRows: allRows.length,
      fetchedAt: new Date().toISOString(),
    }),
  };
};
