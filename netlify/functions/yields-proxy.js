/**
 * Netlify Function — US Treasury Yield Curve Proxy
 *
 * Fetches the official daily Treasury yield curve from
 * home.treasury.gov XML feed. No API key required.
 * Returns the most recent available business day's yields.
 *
 * GET /api/yields
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=1800', // 30-min cache
};

// Treasury XML field → our key mapping
const FIELD_MAP = {
  BC_1MONTH:  'm1',
  BC_3MONTH:  'm3',
  BC_6MONTH:  'm6',
  BC_1YEAR:   'y1',
  BC_2YEAR:   'US2Y',
  BC_3YEAR:   'y3',
  BC_5YEAR:   'US5Y',
  BC_7YEAR:   'y7',
  BC_10YEAR:  'US10Y',
  BC_20YEAR:  'US20Y',
  BC_30YEAR:  'US30Y',
};

function buildUrl(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml` +
         `?data=daily_treasury_yield_curve&field_tdr_date_value_month=${y}${m}`;
}

// Simple XML value extractor — no dependencies
function extractField(xml, fieldName) {
  // Match <d:FIELD_NAME m:type="Edm.Double">VALUE</d:FIELD_NAME>
  const re  = new RegExp(`<d:${fieldName}[^>]*>([^<]+)<\\/d:${fieldName}>`, 'g');
  const all = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const v = parseFloat(m[1]);
    if (!isNaN(v)) all.push(v);
  }
  // Return last value (most recent date in the month)
  return all.length ? all[all.length - 1] : null;
}

function extractDate(xml) {
  const re  = /<d:NEW_DATE[^>]*>([\d\-T]+)<\/d:NEW_DATE>/g;
  const all = [];
  let m;
  while ((m = re.exec(xml)) !== null) all.push(m[1]);
  return all.length ? all[all.length - 1].split('T')[0] : null;
}

async function fetchMonth(date) {
  const url = buildUrl(date);
  const res  = await fetch(url, {
    headers: { 'Accept': 'application/xml, text/xml, */*' },
    signal:  AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Treasury HTTP ${res.status}`);
  return res.text();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const now  = new Date();
  let xml    = null;
  let asOf   = null;

  // Try this month first; if empty (early in new month), try previous
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    try {
      const text = await fetchMonth(d);
      if (text.includes('<d:BC_10YEAR')) {
        xml  = text;
        asOf = extractDate(text);
        break;
      }
    } catch { /* try next month */ }
  }

  if (!xml) {
    return {
      statusCode: 502,
      headers:    HEADERS,
      body:       JSON.stringify({ error: 'Treasury yield curve unavailable' }),
    };
  }

  // Extract all yield tenors
  const yields = {};
  for (const [field, key] of Object.entries(FIELD_MAP)) {
    const v = extractField(xml, field);
    if (v !== null) yields[key] = v;
  }

  // Compute 2s10s spread
  if (yields.US2Y !== undefined && yields.US10Y !== undefined) {
    yields.spread2s10s = Math.round((yields.US10Y - yields.US2Y) * 100);
  }

  return {
    statusCode: 200,
    headers:    HEADERS,
    body:       JSON.stringify({ yields, asOf, fetchedAt: new Date().toISOString() }),
  };
};
