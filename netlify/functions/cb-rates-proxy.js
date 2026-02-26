/**
 * Netlify Function — Central Bank Rates Proxy
 * GET /api/cb-rates
 * Returns: { rates: { EUR: '2.40%', CAD: '3.00%', CHF: '0.25%' } }
 *
 * Root causes fixed vs previous version:
 * - ECB: format=csvdata returns SEMICOLON-delimited rows, not commas.
 *   split(',') returned the full row → parseFloat(fullRow) = NaN → always threw.
 *   Fix: use format=jsondata (SDMX-JSON) — unambiguous, no delimiter issue.
 * - BoC: obs[n].AUCRT?.v is fragile if BoC renames the series field.
 *   Fix: find the first non-date numeric field dynamically.
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

const FETCH_OPTS = (timeout = 8000) => ({
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
    'Accept':     'application/json',
  },
  signal: AbortSignal.timeout(timeout),
});

// ── ECB deposit facility rate ──────────────────────────────────────
// Uses SDMX-JSON format — no CSV delimiter ambiguity.
// Series: FM/B.U2.EUR.1_1.DFR.LEV.A (ECB deposit facility rate)
async function fetchECB() {
  const url =
    'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=jsondata&lastNObservations=1';

  const res = await fetch(url, FETCH_OPTS(8000));
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);

  const data = await res.json();

  // SDMX-JSON structure:
  //   dataSets[0].series["0:0:0:0:0:0:0:0"].observations["0"] = [value, ...]
  const ds     = data?.dataSets?.[0];
  const series = ds?.series ?? {};
  const sk     = Object.keys(series)[0];
  if (!sk) throw new Error('ECB: no series key in response');

  const obs     = series[sk]?.observations ?? {};
  const obsKeys = Object.keys(obs).map(Number).sort((a, b) => b - a); // newest first
  if (!obsKeys.length) throw new Error('ECB: no observations');

  const rate = parseFloat(obs[obsKeys[0]]?.[0]);
  if (isNaN(rate)) throw new Error(`ECB: rate is NaN (got ${obs[obsKeys[0]]?.[0]})`);
  return { EUR: `${rate.toFixed(2)}%` };
}

// ── Bank of Canada overnight rate ──────────────────────────────────
// Valet API returns observations in chronological order (oldest first).
// Fix: dynamically find the rate field instead of hardcoding 'AUCRT',
// because BoC has changed field names historically.
async function fetchBoC() {
  const res = await fetch(
    'https://www.bankofcanada.ca/valet/observations/AUCRT/json?recent=3',
    FETCH_OPTS(9000),
  );
  if (!res.ok) throw new Error(`BoC HTTP ${res.status}`);
  const data = await res.json();
  const obs  = data?.observations;
  if (!Array.isArray(obs) || !obs.length) throw new Error('BoC: no observations array');

  // Pick most recent observation: Valet returns chronological (oldest first)
  const latest = obs[obs.length - 1] ?? obs[0];

  // Find any numeric field — avoids hardcoded series key fragility
  // Observation structure: { "d": "2026-01-22", "AUCRT": { "v": "3.25" }, ... }
  let rate = NaN;
  for (const [key, val] of Object.entries(latest)) {
    if (key === 'd') continue; // skip the date field
    const v = parseFloat(val?.v ?? val);
    if (!isNaN(v) && v > 0) { rate = v; break; }
  }
  if (isNaN(rate)) throw new Error(`BoC: no valid rate in ${JSON.stringify(latest)}`);
  return { CAD: `${rate.toFixed(2)}%` };
}

// ── SNB sight deposit rate ─────────────────────────────────────────
async function fetchSNB() {
  const res = await fetch('https://data.snb.ch/api/data/ZIMOM/json', FETCH_OPTS(9000));
  if (!res.ok) throw new Error(`SNB HTTP ${res.status}`);
  const data = await res.json();

  // SNB API structure: { rows: [{ date: "2024-09", values: ["0.25"] }] }
  const rows = data?.rows;
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(`SNB: unexpected structure: ${JSON.stringify(data).slice(0, 200)}`);
  }
  const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
  if (isNaN(rate)) throw new Error('SNB: rate is NaN');
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
      errors[key] = result.reason?.message ?? 'unknown error';
      console.error(`[CB Proxy ${label}] ${errors[key]}`);
    }
  }

  if (Object.keys(rates).length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'All CB rate sources failed', errors }),
    };
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      rates,
      errors: Object.keys(errors).length ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    }),
  };
};