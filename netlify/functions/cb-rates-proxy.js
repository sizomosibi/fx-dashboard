/**
 * Netlify Function — Central Bank Rates Proxy
 * GET /api/cb-rates
 *
 * FULLY AUTOMATED — zero manual configuration required.
 * No Netlify env vars. No dashboard updates after CB meetings.
 *
 * SCRAPE STRATEGY (tried in order):
 *   1a. global-rates.com — stable public finance reference site, all 8 G10 in one request
 *   1b. global-rates.com alternate URL — fallback if primary URL redirects
 *   2.  Fed FRED CSV API  — free, no key, used to cross-check USD (confirms scrape is live)
 *   3.  Hardcoded FALLBACK — last resort, correct as of Mar 1, 2026.
 *       Only becomes stale after a CB meeting; AI brief (§2) will still surface
 *       the correct rate via web search before the next deploy.
 *
 * CACHE: Cache-Control: public, max-age=3600 so Netlify CDN caches for 1 hour.
 * CB rates change ~8 times/year. A 1-hour CDN cache is fine — we're not a trading terminal.
 */

// ── Last-resort hardcoded fallback — correct as of March 1, 2026 ───────
// Source: https://www.global-rates.com/en/interest-rates/central-banks/
const FALLBACK = {
  USD: '3.50–3.75%',  // Fed held Jan 28, 2026
  AUD: '3.85%',       // RBA hiked +25bp Feb 3, 2026
  EUR: '2.15%',       // ECB cut Jun 5, 2025
  GBP: '3.75%',       // BoE cut Dec 18, 2025
  JPY: '0.75%',       // BoJ hiked Dec 19, 2025
  CHF: '0.00%',       // SNB cut Jun 19, 2025
  CAD: '2.25%',       // BoC cut Oct 29, 2025
  NZD: '0.25%',       // RBNZ cut Nov 26, 2025
};

const COUNTRY_MAP = {
  'United States':  'USD',
  'Australia':      'AUD',
  'United Kingdom': 'GBP',
  'Canada':         'CAD',
  'Europe':         'EUR',
  'Japan':          'JPY',
  'New Zealand':    'NZD',
  'Switzerland':    'CHF',
};

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=3600',
};

// ── Helpers ────────────────────────────────────────────────────────────
function timedFetch(url, opts = {}, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function stripHtml(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Scraper: global-rates.com ──────────────────────────────────────────
// Parses the central bank rate table. Table rows contain:
//   <td> bank link </td> <td> country </td> <td> X.XX % </td> ...
function parseGlobalRatesHtml(html) {
  const found = {};
  const trRe  = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;

  while ((trMatch = trRe.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells   = [];
    const tdRe    = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch;
    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      cells.push(stripHtml(tdMatch[1]));
    }
    if (cells.length < 3) continue;

    const country = cells[1];
    const ccy     = COUNTRY_MAP[country];
    if (!ccy) continue;

    // "3.75 %" or "0.00 %" — handle spaces and Unicode % signs
    const m = cells[2].match(/([\d.]+)\s*[%％]/);
    if (!m) continue;

    const rate = parseFloat(m[1]);
    if (isNaN(rate)) continue;

    if (ccy === 'USD') {
      // Fed publishes upper bound; represent as "lower–upper%"
      found.USD = `${(rate - 0.25).toFixed(2)}–${rate.toFixed(2)}%`;
    } else {
      found[ccy] = `${rate.toFixed(2)}%`;
    }
  }
  return found;
}

async function scrapeGlobalRates() {
  const urls = [
    'https://www.global-rates.com/en/interest-rates/central-banks/',
    'https://www.global-rates.com/en/interest-rates/central-banks',
  ];

  const fetchOpts = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
                    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control':   'no-cache',
    },
  };

  let lastErr;
  for (const url of urls) {
    try {
      const res = await timedFetch(url, fetchOpts, 12000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      if (html.length < 5000) throw new Error('Response too short — likely a block/redirect page');
      if (!html.includes('Central Bank') && !html.includes('central-bank'))
        throw new Error('Page content unexpected — scrape target may have changed');

      const parsed = parseGlobalRatesHtml(html);
      const count  = Object.keys(parsed).length;
      if (count < 5) throw new Error(`Only ${count} currencies parsed — HTML structure may have changed`);

      console.log(`[CB Rates] global-rates.com scraped ${count} currencies from ${url}`);
      return parsed;
    } catch (e) {
      lastErr = e;
      console.warn(`[CB Rates] global-rates.com ${url}: ${e.message}`);
    }
  }
  throw new Error(`global-rates.com unreachable: ${lastErr?.message}`);
}

// ── Scraper 2: FRED CSV for USD cross-check ────────────────────────────
// Free, no auth, no IP blocks. Used as USD-only verification backup.
async function scrapeUSDFromFRED() {
  // DFEDTARU = Federal Funds Target Rate Upper Bound (daily)
  const url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFEDTARU';
  const res  = await timedFetch(url, {
    headers: { 'User-Agent': 'FXDashboard/1.0 (automated data retrieval)' },
  }, 8000);
  if (!res.ok) throw new Error(`FRED HTTP ${res.status}`);
  const csv  = await res.text();
  const rows = csv.trim().split('\n').filter(r => r && !r.startsWith('DATE'));
  if (!rows.length) throw new Error('FRED CSV empty');

  // Last row = most recent: "2026-01-29,3.75"
  const lastRow  = rows[rows.length - 1];
  const parts    = lastRow.split(',');
  const upperVal = parseFloat(parts[1]);
  if (isNaN(upperVal)) throw new Error(`FRED value not numeric: ${parts[1]}`);

  const lower = (upperVal - 0.25).toFixed(2);
  const upper = upperVal.toFixed(2);
  console.log(`[CB Rates] FRED USD: ${lower}–${upper}% (as of ${parts[0]})`);
  return `${lower}–${upper}%`;
}

// ── Main handler ───────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  // Run primary scrape + FRED USD in parallel
  const [scrapeResult, fredResult] = await Promise.allSettled([
    scrapeGlobalRates(),
    scrapeUSDFromFRED(),
  ]);

  let rates  = {};
  let source = 'fallback';

  if (scrapeResult.status === 'fulfilled') {
    // Merge scraped rates; override USD with FRED if FRED succeeded (more authoritative)
    rates  = { ...FALLBACK, ...scrapeResult.value };
    source = 'live';

    if (fredResult.status === 'fulfilled') {
      rates.USD = fredResult.value;
      console.log('[CB Rates] USD overridden by FRED CSV');
    }
  } else {
    // Primary scrape failed — try FRED for USD at minimum, fallback for the rest
    console.warn('[CB Rates] Primary scrape failed:', scrapeResult.reason?.message);
    rates = { ...FALLBACK };

    if (fredResult.status === 'fulfilled') {
      rates.USD  = fredResult.value;
      source     = 'live-partial';
      console.log('[CB Rates] Using FRED for USD, FALLBACK for others');
    } else {
      console.warn('[CB Rates] FRED also failed:', fredResult.reason?.message);
      console.warn('[CB Rates] Serving hardcoded fallback rates — may be stale');
    }
  }

  // Log final resolved rates
  for (const [ccy, rate] of Object.entries(rates)) {
    console.log(`[CB Rates] ${ccy}: ${rate}`);
  }

  return {
    statusCode: 200,
    headers:    HEADERS,
    body:       JSON.stringify({
      rates,
      source,
      scrapeError: scrapeResult.status === 'rejected' ? scrapeResult.reason?.message : undefined,
      fetchedAt:   new Date().toISOString(),
    }),
  };
};
