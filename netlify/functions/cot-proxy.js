/**
 * Netlify Function — CFTC COT Positioning Proxy
 * GET /api/cot
 *
 * Root causes fixed vs previous version:
 * - $where date filter was sending SoQL that CFTC's Socrata rejects,
 *   returning an error JSON object (not array). Array.isArray(errObj) = false
 *   → threw "not an array" → both endpoints failed.
 * - Missing User-Agent header — Socrata enforces rate limits on headerless requests.
 *
 * Strategy A: Socrata API (no date filter, simple sorted limit query)
 * Strategy B: Parse CFTC's HTML report page at www.cftc.gov (different
 *             server/infrastructure — not rate-limited the same way)
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

// Contract name → our currency key mapping
const CONTRACT_MAP = {
  'EURO FX - CHICAGO MERCANTILE EXCHANGE':                'EUR',
  'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE':           'JPY',
  'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP',
  'SWISS FRANC - CHICAGO MERCANTILE EXCHANGE':            'CHF',
  'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':        'CAD',
  'AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE':      'AUD',
  'NEW ZEALAND DOLLAR - CHICAGO MERCANTILE EXCHANGE':     'NZD',
  'U.S. DOLLAR INDEX - ICE FUTURES U.S.':                 'USD',
  'GOLD - COMMODITY EXCHANGE INC.':                       'XAU',
};

function calcNet(row) {
  const oi  = parseFloat(row.open_interest_all);
  const lng = parseFloat(row.noncomm_positions_long_all);
  const sht = parseFloat(row.noncomm_positions_short_all);
  if (isNaN(oi) || oi === 0) return null;
  return Math.round(((lng - sht) / oi) * 100);
}

// ── Strategy A: CFTC Socrata API ────────────────────────────────────
// NO $where clause — avoids any SoQL parsing errors on CFTC's Socrata.
// $limit=500 ordered newest-first — covers 1–2 weeks across all contracts.
async function fetchViaSocrata() {
  const select = [
    'market_and_exchange_names',
    'as_of_date_in_form_yyyy_mm_dd',
    'open_interest_all',
    'noncomm_positions_long_all',
    'noncomm_positions_short_all',
  ].join(',');

  // No $where — let the server return the most recent rows for all contracts.
  // $limit=500 ensures we get enough rows to cover all 9 contracts × 2 weeks.
  const query = `$order=as_of_date_in_form_yyyy_mm_dd%20DESC&$limit=500&$select=${select}`;

  const HEADERS_SOCRATA = {
    'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
    'Accept':     'application/json',
  };

  const endpoints = [
    `https://publicreporting.cftc.gov/resource/gpe5-46if.json?${query}`,
    `https://data.cftc.gov/resource/gpe5-46if.json?${query}`,
  ];

  let lastErr;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: HEADERS_SOCRATA,
        signal:  AbortSignal.timeout(18000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} — ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        // Socrata returns an error object when the query is invalid
        const msg = data?.message ?? data?.error ?? JSON.stringify(data).slice(0, 200);
        throw new Error(`Socrata error: ${msg}`);
      }
      if (data.length === 0) throw new Error('Empty result set');
      return parseSocrataRows(data);
    } catch (e) {
      lastErr = e;
      console.error(`[COT Socrata] ${url.slice(0, 60)}... failed: ${e.message}`);
    }
  }
  throw new Error(`Socrata failed: ${lastErr?.message}`);
}

function parseSocrataRows(rows) {
  // Rows are already ordered newest-first.
  // Group by contract name, keep 2 most recent rows per contract.
  const byContract = {};
  for (const row of rows) {
    const name = row.market_and_exchange_names;
    if (!byContract[name]) byContract[name] = [];
    if (byContract[name].length < 2) byContract[name].push(row);
  }

  const cot    = {};
  const errors = {};
  let   asOf   = null;

  for (const [contractName, ccyKey] of Object.entries(CONTRACT_MAP)) {
    const contractRows = byContract[contractName];
    if (!contractRows?.length) {
      errors[ccyKey] = 'not in result set';
      continue;
    }
    const net  = calcNet(contractRows[0]);
    const prev = contractRows[1] ? calcNet(contractRows[1]) : net;
    if (net === null) { errors[ccyKey] = 'zero OI'; continue; }
    cot[ccyKey] = { net, prev: prev ?? net };
    if (!asOf) asOf = contractRows[0].as_of_date_in_form_yyyy_mm_dd;
  }

  if (Object.keys(cot).length === 0) {
    throw new Error(`Parsed 0 contracts from ${rows.length} rows. Errors: ${JSON.stringify(errors)}`);
  }
  return { cot, asOf };
}

// ── Strategy B: Parse CFTC's HTML report page ───────────────────────
// www.cftc.gov is different infrastructure from publicreporting.cftc.gov.
// The Financial Futures Legacy report is embedded as fixed-width text
// inside a <pre> block on this page.
async function fetchViaCFTCHtml() {
  const url = 'https://www.cftc.gov/dea/futures/financial_lf.htm';
  const res  = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
      'Accept':     'text/html,*/*',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`CFTC HTML HTTP ${res.status}`);

  const html = await res.text();

  // Extract text from <pre> block (CFTC uses <pre> for fixed-width report text)
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  const text     = preMatch
    ? preMatch[1].replace(/<[^>]+>/g, '') // strip any inner HTML tags
    : html;                                // fallback: scan full page

  return parseCFTCReportText(text);
}

function parseCFTCReportText(text) {
  const cot    = {};
  const errors = {};
  let   asOf   = null;

  // Try to extract report date from header line like "AS OF FEBRUARY 18, 2025"
  const dateMatch = text.match(/AS\s+OF\s+([A-Z]+\s+\d+,\s+\d{4})/i);
  if (dateMatch) asOf = dateMatch[1];

  for (const [contractName, ccyKey] of Object.entries(CONTRACT_MAP)) {
    // Find the section for this contract name (case-insensitive)
    const idx = text.toUpperCase().indexOf(contractName.toUpperCase());
    if (idx === -1) { errors[ccyKey] = 'contract not found in HTML'; continue; }

    // Extract the next 1500 chars — enough to cover the data block
    const section = text.slice(idx, idx + 1500);

    // Open Interest: "Open Interest is   731,245" or "OPEN INTEREST  731245"
    const oiMatch = section.match(/OPEN\s+INTEREST[^0-9]*([0-9][0-9,]+)/i);
    const oi = oiMatch ? parseInt(oiMatch[1].replace(/,/g, '')) : null;

    // Non-Commercial Positions: LONG then SHORT
    // Multiple possible formats:
    //   "NONCOMMERCIAL  :  LONG  312,456  SHORT  87,234"
    //   "Non-Commercial:  Long   326,543  Short    89,234"
    //   Fixed-width lines where positions appear as columns
    const ncMatch = section.match(
      /NON.?COMMERCIAL[^:]*:[^0-9]*([0-9][0-9,]+)[^0-9]+([0-9][0-9,]+)/i
    );
    const lng = ncMatch ? parseInt(ncMatch[1].replace(/,/g, '')) : null;
    const sht = ncMatch ? parseInt(ncMatch[2].replace(/,/g, '')) : null;

    if (!oi || lng === null || sht === null) {
      errors[ccyKey] = `parse failed — oi=${oi} lng=${lng} sht=${sht}`;
      continue;
    }

    const net = Math.round(((lng - sht) / oi) * 100);
    // HTML report only has current week — use same value for prev
    cot[ccyKey] = { net, prev: net };
  }

  if (Object.keys(cot).length === 0) {
    throw new Error(`HTML parse found 0 contracts. Sample: "${text.slice(0, 300)}"`);
  }
  return { cot, asOf };
}

// ── Handler ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const strategies = [
    { name: 'Socrata', fn: fetchViaSocrata },
    { name: 'CFTC HTML', fn: fetchViaCFTCHtml },
  ];

  let lastErr;
  for (const { name, fn } of strategies) {
    try {
      const { cot, asOf } = await fn();
      console.log(`[COT] ${name} succeeded — ${Object.keys(cot).length} contracts`);
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          cot,
          asOf,
          source:    name,
          fetchedAt: new Date().toISOString(),
        }),
      };
    } catch (e) {
      lastErr = e;
      console.error(`[COT] ${name} failed: ${e.message}`);
    }
  }

  return {
    statusCode: 502,
    headers: HEADERS,
    body: JSON.stringify({
      error:     'All COT strategies failed',
      lastError: lastErr?.message,
    }),
  };
};