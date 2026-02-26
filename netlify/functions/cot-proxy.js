/**
 * Netlify Function — CFTC COT Positioning Proxy
 *
 * Fetches Commitments of Traders data for G10 currency futures
 * from the CFTC Socrata public API, server-side.
 *
 * Browser calls to publicreporting.cftc.gov are blocked by CORS
 * on non-localhost domains. This proxy eliminates that.
 *
 * Data is the Legacy Futures Only report (non-commercial positions).
 * Updated every Friday at 3:30pm ET.
 *
 * GET /api/cot
 * Returns: { cot: { EUR:{net,prev}, JPY:{net,prev}, ... }, asOf, fetchedAt }
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600', // 1-hour cache (weekly data)
};

// CFTC contract names → our currency keys
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
  const url = `https://publicreporting.cftc.gov/resource/gpe5-46if.json` +
    `?market_and_exchange_names=${encoded}` +
    `&$order=as_of_date_in_form_yyyy_mm_dd DESC` +
    `&$limit=2` +
    `&$select=as_of_date_in_form_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-App-Token': '', // public endpoint — no token needed
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`CFTC HTTP ${res.status} for ${marketName}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const entries = Object.entries(CONTRACTS);

  // Fetch all contracts in parallel
  const results = await Promise.allSettled(
    entries.map(([market]) => fetchContract(market))
  );

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  results.forEach((result, i) => {
    const [market, ccy] = entries[i];
    if (result.status !== 'fulfilled') {
      errors[ccy] = result.reason?.message || 'fetch failed';
      console.error(`[COT Proxy ${ccy}]`, errors[ccy]);
      return;
    }

    const rows = result.value;
    if (!rows?.length) {
      errors[ccy] = 'empty response';
      return;
    }

    const net  = calcNet(rows[0]);
    const prev = rows[1] ? calcNet(rows[1]) : net;

    if (net === null) {
      errors[ccy] = 'calculation failed (zero open interest)';
      return;
    }

    cot[ccy] = { net, prev: prev ?? net };

    // Track report date from the most recent row
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
    body: JSON.stringify({ cot, asOf, errors, fetchedAt: new Date().toISOString() }),
  };
};
