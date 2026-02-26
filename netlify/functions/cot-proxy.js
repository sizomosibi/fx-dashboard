/**
 * Netlify Function — COT Data Proxy
 * GET /api/cot
 *
 * Reads public/cot-data.json which is committed to the repo and
 * updated automatically every Friday by GitHub Actions (scripts/fetch_cot.py).
 *
 * This function makes ZERO external API calls — no IP blocking possible.
 * The Python fetcher in GitHub Actions handles all CFTC data retrieval
 * from infrastructure that is not blocked by CFTC's Socrata API.
 */

const path = require('path');
const fs   = require('fs');

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

  try {
    // Netlify Functions run from the repo root — public/ is at the same level
    const filePath = path.join(__dirname, '..', '..', 'public', 'cot-data.json');
    const raw      = fs.readFileSync(filePath, 'utf8');
    const data     = JSON.parse(raw);

    if (!data.cot || Object.keys(data.cot).length === 0) {
      throw new Error('cot-data.json exists but contains no contracts');
    }

    return { statusCode: 200, headers: HEADERS, body: raw };

  } catch (e) {
    console.error('[COT Proxy]', e.message);
    return {
      statusCode: 503,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
      body: JSON.stringify({
        error: 'cot-data.json not found or invalid',
        detail: e.message,
        fix: 'Run: python scripts/fetch_cot.py  OR trigger the GitHub Actions workflow manually',
      }),
    };
  }
};