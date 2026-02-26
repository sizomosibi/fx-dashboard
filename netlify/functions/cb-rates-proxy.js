/**
 * Netlify Function — Central Bank Rates Proxy
 * GET /api/cb-rates
 * Returns: { rates: { EUR: '2.40%', CAD: '3.00%', CHF: '0.25%' } }
 *
 * Runtime requirements:
 *   - Node 18 (pinned via netlify.toml [build.environment] NODE_VERSION=18)
 *   - No AbortSignal.timeout() — replaced with manual AbortController+setTimeout
 *     because AbortSignal.timeout silently throws on Node <17.3
 */

// Cache-Control: no-store while debugging — prevents Netlify edge from caching
// a 502 and serving it forever. Re-enable max-age once stable.
const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'no-store',
};

// Safe timeout wrapper — works on all Node versions
function timedFetch(url, opts = {}, ms = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// ── ECB deposit facility rate ──────────────────────────────────────
// Uses SDMX-JSON (format=jsondata) — avoids CSV semicolon delimiter bug
// where format=csvdata returns semicolon rows and split(',') gets the whole row.
async function fetchECB() {
  const url =
    'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=jsondata&lastNObservations=1';

  const res = await timedFetch(url, {
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
    },
  }, 6000);

  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const data = await res.json();

  // SDMX-JSON: dataSets[0].series[seriesKey].observations[obsIdx][0] = value
  const series  = data?.dataSets?.[0]?.series ?? {};
  const sk      = Object.keys(series)[0];
  if (!sk) throw new Error('ECB: no series in response');
  const obs     = series[sk]?.observations ?? {};
  const lastIdx = String(Math.max(...Object.keys(obs).map(Number)));
  const rate    = parseFloat(obs[lastIdx]?.[0]);
  if (isNaN(rate)) throw new Error(`ECB: rate is NaN`);
  return { EUR: `${rate.toFixed(2)}%` };
}

// ── Bank of Canada overnight rate ──────────────────────────────────
// Valet API returns observations chronologically (oldest first).
// We take the last entry and find any numeric field — avoids hardcoded
// series key fragility (BoC has changed field names historically).
async function fetchBoC() {
  const res = await timedFetch(
    'https://www.bankofcanada.ca/valet/observations/AUCRT/json?recent=3',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)' } },
    7000,
  );
  if (!res.ok) throw new Error(`BoC HTTP ${res.status}`);
  const data = await res.json();
  const obs  = data?.observations;
  if (!Array.isArray(obs) || !obs.length) throw new Error('BoC: no observations');

  const latest = obs[obs.length - 1]; // chronological → last = most recent
  let rate = NaN;
  for (const [key, val] of Object.entries(latest)) {
    if (key === 'd') continue;
    const v = parseFloat(val?.v ?? val);
    if (!isNaN(v) && v > 0) { rate = v; break; }
  }
  if (isNaN(rate)) throw new Error(`BoC: no numeric rate in ${JSON.stringify(latest)}`);
  return { CAD: `${rate.toFixed(2)}%` };
}

// ── SNB sight deposit rate ─────────────────────────────────────────
async function fetchSNB() {
  const res = await timedFetch(
    'https://data.snb.ch/api/data/ZIMOM/json',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)' } },
    7000,
  );
  if (!res.ok) throw new Error(`SNB HTTP ${res.status}`);
  const data = await res.json();
  const rows = data?.rows;
  if (!Array.isArray(rows) || !rows.length) throw new Error('SNB: no rows');
  const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
  if (isNaN(rate)) throw new Error('SNB: rate NaN');
  return { CHF: `${rate.toFixed(2)}%` };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const [ecbR, bocR, snbR] = await Promise.allSettled([
    fetchECB(),
    fetchBoC(),
    fetchSNB(),
  ]);

  const rates  = {};
  const errors = {};

  for (const [result, key, label] of [
    [ecbR, 'EUR', 'ECB'],
    [bocR, 'CAD', 'BoC'],
    [snbR, 'CHF', 'SNB'],
  ]) {
    if (result.status === 'fulfilled') {
      Object.assign(rates, result.value);
    } else {
      errors[key] = result.reason?.message ?? 'unknown';
      console.error(`[CB Proxy ${label}] ${errors[key]}`);
    }
  }

  if (Object.keys(rates).length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'All CB sources failed', errors }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ rates, errors: Object.keys(errors).length ? errors : undefined, fetchedAt: new Date().toISOString() }),
  };
};