/**
 * Netlify Function — Central Bank Rates Proxy
 * GET /api/cb-rates
 * Returns: { rates: { EUR: '2.40%', CAD: '3.00%', CHF: '0.25%' } }
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

// ── ECB deposit facility rate ──────────────────────────────────────
// CSV format returned: rows like "FM.B.U2.EUR.1_1.DFR.LEV.A,2025-09-11,2.50"
async function fetchECB() {
  const url = 'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=csvdata&lastNObservations=1';
  const res = await fetch(url, {
    headers: { 'Accept': 'text/csv, application/json, */*' },
    signal:  AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const text = await res.text();

  // ECB CSV has a header line starting with KEY, then data lines.
  // Each data line: "SERIES_KEY,DATE,VALUE" (comma separated)
  // Value is the rate in percent, e.g. "2.50"
  const lines = text
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('KEY') && !l.startsWith('"KEY'));

  if (!lines.length) throw new Error('ECB: no data rows');

  // Take the last data line (most recent observation)
  const last  = lines[lines.length - 1];
  const parts = last.split(',');
  const raw   = parts[parts.length - 1].replace(/"/g, '').trim();
  const rate  = parseFloat(raw);
  if (isNaN(rate)) throw new Error(`ECB parse failed on: "${last}"`);
  return { EUR: `${rate.toFixed(2)}%` };
}

// ── Bank of Canada overnight rate ──────────────────────────────────
// Valet API returns observations in chronological order (oldest first).
// We want the LAST entry.
async function fetchBoC() {
  const res = await fetch(
    'https://www.bankofcanada.ca/valet/observations/AUCRT/json?recent=5',
    { signal: AbortSignal.timeout(7000) }
  );
  if (!res.ok) throw new Error(`BoC HTTP ${res.status}`);
  const data = await res.json();
  const obs  = data?.observations;
  if (!obs?.length) throw new Error('BoC: empty observations');

  // FIX: Valet API is chronological order — last entry is most recent
  const latest = obs[obs.length - 1];
  const rate   = parseFloat(latest?.AUCRT?.v);
  if (isNaN(rate)) throw new Error(`BoC parse failed: ${JSON.stringify(latest)}`);
  return { CAD: `${rate.toFixed(2)}%` };
}

// ── SNB sight deposit rate ─────────────────────────────────────────
async function fetchSNB() {
  const res = await fetch('https://data.snb.ch/api/data/ZIMOM/json', {
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`SNB HTTP ${res.status}`);
  const data = await res.json();
  const rows = data?.rows;
  if (!rows?.length) throw new Error('SNB: empty rows');
  // Last row = most recent quarter
  const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
  if (isNaN(rate)) throw new Error('SNB parse failed');
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

  for (const [result, key] of [[ecbR, 'EUR'], [bocR, 'CAD'], [snbR, 'CHF']]) {
    if (result.status === 'fulfilled') {
      Object.assign(rates, result.value);
    } else {
      errors[key] = result.reason?.message || 'failed';
      console.error(`[CB Proxy ${key}]`, errors[key]);
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
    body: JSON.stringify({ rates, errors: Object.keys(errors).length ? errors : undefined, fetchedAt: new Date().toISOString() }),
  };
};
