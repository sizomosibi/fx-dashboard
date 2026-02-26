/**
 * Netlify Function — CFTC COT Positioning Proxy
 *
 * Fetches COT data server-side from the CFTC Socrata public API.
 * GET /api/cot
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

const CONTRACTS = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE':               'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE':          'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE':'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE':           'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':       'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':     'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE':    'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.':                'USD',
  'GOLD - COMMODITY EXCHANGE INC.':                      'XAU',
};

function calcNet(row) {
  const oi  = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

async function fetchContract(marketName) {
  const encoded = encodeURIComponent(marketName);
  // FIX: $order value must have space URL-encoded as %20 — Socrata rejects bare space
  const url =
    `https://publicreporting.cftc.gov/resource/gpe5-46if.json` +
    `?market_and_exchange_names=${encoded}` +
    `&$order=as_of_date_in_form_yyyy_mm_dd%20DESC` +  // ← was: unencoded space
    `&$limit=2` +
    `&$select=as_of_date_in_form_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all`;

  // FIX: 7s timeout — well under Netlify's 26s function limit
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal:  AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`CFTC HTTP ${res.status}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const entries = Object.entries(CONTRACTS);
  const results = await Promise.allSettled(
    entries.map(([market]) => fetchContract(market))
  );

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  results.forEach((result, i) => {
    const [, ccy] = entries[i];
    if (result.status !== 'fulfilled') {
      errors[ccy] = result.reason?.message || 'fetch failed';
      console.error(`[COT ${ccy}]`, errors[ccy]);
      return;
    }
    const rows = result.value;
    if (!rows?.length) { errors[ccy] = 'empty'; return; }

    const net  = calcNet(rows[0]);
    const prev = rows[1] ? calcNet(rows[1]) : net;
    if (net === null) { errors[ccy] = 'zero OI'; return; }

    cot[ccy] = { net, prev: prev ?? net };
    if (!asOf && rows[0].as_of_date_in_form_yyyy_mm_dd) {
      asOf = rows[0].as_of_date_in_form_yyyy_mm_dd;
    }
  });

  if (Object.keys(cot).length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'All CFTC contracts failed', errors }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ cot, asOf, errors: Object.keys(errors).length ? errors : undefined, fetchedAt: new Date().toISOString() }),
  };
};
