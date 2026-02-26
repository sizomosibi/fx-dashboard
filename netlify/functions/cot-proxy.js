/**
 * Netlify Function — CFTC COT Positioning Proxy (Optimized)
 * Runtime: Node 18+
 */

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const CONTRACT_MAP = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE': 'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE': 'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE': 'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.': 'USD',
  'GOLD - COMMODITY EXCHANGE INC.': 'XAU',
};

/**
 * Modern Timeout Fetch (Node 18 compatible)
 * Reduced to 4 seconds to ensure we don't hit Netlify's 10s hard limit
 */
async function timedFetch(url, opts = {}, ms = 4000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function calcNet(row) {
  const oi = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

const SELECT = [
  'market_and_exchange_names',
  'as_of_date_in_form_yyyy_mm_dd',
  'open_interest_all',
  'noncomm_positions_long_all',
  'noncomm_positions_short_all',
].join(',');

// Use URLSearchParams for reliable Socrata encoding
const queryParams = new URLSearchParams({
  '$order': 'as_of_date_in_form_yyyy_mm_dd DESC',
  '$limit': '500',
  '$select': SELECT
});

const ENDPOINTS = [
  `https://publicreporting.cftc.gov/resource/gpe5-46if.json?${queryParams.toString()}`,
  `https://data.cftc.gov/resource/gpe5-46if.json?${queryParams.toString()}`,
];

async function fetchFromSocrata() {
  let lastErr;

  for (const url of ENDPOINTS) {
    try {
      console.log(`[COT] Attempting: ${url.split('?')[0]}`);
      const res = await timedFetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid or empty data array');
      }

      return data;
    } catch (e) {
      lastErr = e;
      console.error(`[COT Error] ${e.name === 'AbortError' ? 'Timeout' : e.message}`);
    }
  }

  throw new Error(`Connection failed: ${lastErr?.message}`);
}

function parseRows(rows) {
  const byContract = {};
  
  // Group rows by market name
  for (const row of rows) {
    const name = row.market_and_exchange_names?.trim();
    if (!name) continue;
    if (!byContract[name]) byContract[name] = [];
    if (byContract[name].length < 2) byContract[name].push(row);
  }

  const cot = {};
  const errors = {};
  let asOf = null;

  for (const [fullName, shortName] of Object.entries(CONTRACT_MAP)) {
    const dataRows = byContract[fullName];
    
    if (!dataRows || dataRows.length === 0) {
      errors[shortName] = "Missing in API response";
      continue;
    }

    const currentNet = calcNet(dataRows[0]);
    const previousNet = dataRows[1] ? calcNet(dataRows[1]) : currentNet;

    if (currentNet === null) {
      errors[shortName] = "Zero or invalid Open Interest";
      continue;
    }

    cot[shortName] = { 
      net: currentNet, 
      prev: previousNet ?? currentNet 
    };

    if (!asOf) asOf = dataRows[0].as_of_date_in_form_yyyy_mm_dd;
  }

  return { cot, asOf, errors };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  try {
    const rows = await fetchFromSocrata();
    const result = parseRows(rows);

    if (Object.keys(result.cot).length === 0) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ 
            error: "No matching contracts found", 
            details: result.errors,
            sample: rows[0]?.market_and_exchange_names 
        }),
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ...result,
        fetchedAt: new Date().toISOString(),
        totalRowsFetched: rows.length
      }),
    };

  } catch (error) {
    console.error('[Fatal]', error.message);
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};