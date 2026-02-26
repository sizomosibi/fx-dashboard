/**
 * Netlify Function — Central Bank Rates Proxy
 * GET /api/cb-rates
 *
 * ARCHITECTURE: Netlify Environment Variables only. Zero external HTTP calls.
 *
 * WHY: ECB, BoC, and SNB APIs all block AWS Lambda IP ranges — 502 at ~500ms
 * (active IP rejection, not a timeout). No proxy code can fix an upstream
 * IP block. CB rates change 4–8 times per year on published schedules.
 * Environment variables are the correct architecture for near-static data.
 *
 * SETUP (one-time, then update only when a CB changes rates):
 *   Netlify Dashboard → Site → Environment Variables → Add:
 *     RATE_EUR = 2.40%    (ECB deposit facility rate)
 *     RATE_CAD = 3.00%    (Bank of Canada overnight rate)
 *     RATE_CHF = 0.25%    (SNB sight deposit rate)
 *
 * UPDATE: When a CB changes its rate, update the env var in the dashboard.
 * Changes are live instantly — no redeploy required.
 */

// Fallback values used before env vars are configured.
// Update both this AND the env var when a CB changes rates.
const FALLBACK = {
  EUR: '2.40%',
  CAD: '3.00%',
  CHF: '0.25%',
};

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const rates = {
    EUR: process.env.RATE_EUR || FALLBACK.EUR,
    CAD: process.env.RATE_CAD || FALLBACK.CAD,
    CHF: process.env.RATE_CHF || FALLBACK.CHF,
  };

  for (const key of ['EUR', 'CAD', 'CHF']) {
    const src = process.env['RATE_' + key] ? 'env-var' : 'hardcoded-fallback';
    console.log('[CB Rates] ' + key + ': ' + rates[key] + ' (' + src + ')');
  }

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ rates, source: 'env-vars', fetchedAt: new Date().toISOString() }),
  };
};