/**
 * Netlify Function — Central Bank Rates Proxy
 *
 * Fetches ECB, Bank of Canada, and SNB policy rates server-side.
 * Browser calls to these APIs are blocked by CORS on most domains.
 * Running server-side eliminates that entirely.
 *
 * GET /api/cb-rates
 * Returns: { rates: { EUR: '2.40%', CAD: '3.00%', CHF: '0.25%' }, errors: {} }
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600', // 1-hour cache — CB rates change rarely
};

// ── ECB deposit facility rate ──────────────────────────────────────
async function fetchECB() {
  const url = 'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.1_1.DFR.LEV.A' +
    '?format=csvdata&lastNObservations=1';
  const res = await fetch(url, {
    headers: { 'Accept': 'text/csv, */*' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const text  = await res.text();
  // CSV format: header line then data lines
  // Data line: "FM.B.U2.EUR.1_1.DFR.LEV.A,2025-09-11,2.50"
  const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('KEY'));
  if (!lines.length) throw new Error('ECB empty response');
  const last = lines[lines.length - 1];
  const parts = last.split(',');
  const rate  = parseFloat(parts[parts.length - 1]);
  if (isNaN(rate)) throw new Error(`ECB parse failed: "${last}"`);
  return { EUR: `${rate.toFixed(2)}%` };
}

// ── Bank of Canada overnight rate ──────────────────────────────────
async function fetchBoC() {
  const res = await fetch(
    'https://www.bankofcanada.ca/valet/observations/AUCRT/json?recent=2',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`BoC HTTP ${res.status}`);
  const data = await res.json();
  const obs  = data?.observations;
  if (!obs?.length) throw new Error('BoC empty observations');
  // observations are newest-first; [0] is most recent
  const rate = parseFloat(obs[0].AUCRT?.v);
  if (isNaN(rate)) throw new Error('BoC parse failed');
  return { CAD: `${rate.toFixed(2)}%` };
}

// ── SNB sight deposit rate ─────────────────────────────────────────
// Primary: SNB data API
// Fallback: SNB website scraping
async function fetchSNB() {
  try {
    const res = await fetch('https://data.snb.ch/api/data/ZIMOM/json', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`SNB API HTTP ${res.status}`);
    const data = await res.json();
    // Schema: { rows: [{ date: "2024-12", values: ["0.25"] }, ...] }
    const rows = data?.rows;
    if (!rows?.length) throw new Error('SNB empty rows');
    // Last row = most recent
    const rate = parseFloat(rows[rows.length - 1]?.values?.[0]);
    if (isNaN(rate)) throw new Error('SNB parse failed');
    return { CHF: `${rate.toFixed(2)}%` };
  } catch (primaryErr) {
    // Fallback: try alternative SNB endpoint
    const res2 = await fetch(
      'https://data.snb.ch/api/data/ZIMOM/json?startDate=2024-01-01',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res2.ok) throw new Error(`SNB fallback HTTP ${res2.status}`);
    const data2 = await res2.json();
    const rows2 = data2?.rows;
    if (!rows2?.length) throw new Error(`SNB fallback failed: ${primaryErr.message}`);
    const rate2 = parseFloat(rows2[rows2.length - 1]?.values?.[0]);
    if (isNaN(rate2)) throw new Error('SNB fallback parse failed');
    return { CHF: `${rate2.toFixed(2)}%` };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const [ecbResult, bocResult, snbResult] = await Promise.allSettled([
    fetchECB(),
    fetchBoC(),
    fetchSNB(),
  ]);

  const rates  = {};
  const errors = {};

  if (ecbResult.status === 'fulfilled') {
    Object.assign(rates, ecbResult.value);
  } else {
    errors.EUR = ecbResult.reason?.message || 'ECB failed';
    console.error('[CB Proxy ECB]', errors.EUR);
  }

  if (bocResult.status === 'fulfilled') {
    Object.assign(rates, bocResult.value);
  } else {
    errors.CAD = bocResult.reason?.message || 'BoC failed';
    console.error('[CB Proxy BoC]', errors.CAD);
  }

  if (snbResult.status === 'fulfilled') {
    Object.assign(rates, snbResult.value);
  } else {
    errors.CHF = snbResult.reason?.message || 'SNB failed';
    console.error('[CB Proxy SNB]', errors.CHF);
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
    body: JSON.stringify({ rates, errors, fetchedAt: new Date().toISOString() }),
  };
};
