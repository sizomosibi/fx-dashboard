/**
 * Netlify Function — Market Data Proxy
 *
 * Fetches real-time prices from Yahoo Finance v8 API.
 * Runs server-side — no CORS, no API key required.
 *
 * Symbols fetched:
 *   GC=F   Gold futures (XAU)
 *   CL=F   WTI Crude Oil
 *   ^GSPC  S&P 500
 *   ^VIX   CBOE Volatility Index
 *   DX-Y.NYB  US Dollar Index
 *   HG=F   Copper (USD/lb — Yahoo Finance returns in USD/lb directly, e.g. 4.62)
 *   SI=F   Silver
 *
 * GET /api/markets
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=60', // 1-min cache
};

const SYMBOLS = [
  { sym: 'GC=F',      key: 'xau',    divisor: 1 },       // Gold $/oz
  { sym: 'CL=F',      key: 'wti',    divisor: 1 },       // WTI $/bbl
  { sym: '^GSPC',     key: 'spx',    divisor: 1 },       // S&P 500
  { sym: '^VIX',      key: 'vix',    divisor: 1 },       // VIX
  { sym: 'DX-Y.NYB',  key: 'dxy',    divisor: 1 },       // DXY
  { sym: 'HG=F',      key: 'copper', divisor: 1 },       // Copper: Yahoo returns USD/lb directly (e.g. 4.62)
  { sym: 'SI=F',      key: 'silver', divisor: 1 },       // Silver $/oz
];

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res  = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept':     'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Yahoo ${symbol} HTTP ${res.status}`);
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No result for ${symbol}`);

  const meta   = result.meta;
  const price  = meta.regularMarketPrice;
  const prev   = meta.chartPreviousClose || meta.previousClose;

  if (!price) throw new Error(`No price for ${symbol}`);

  return { price, prev };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const fetches = SYMBOLS.map(async ({ sym, key, divisor }) => {
    try {
      const { price, prev } = await fetchYahooQuote(sym);
      const p    = price / divisor;
      const pr   = (prev  || price) / divisor;
      const chg  = p - pr;
      const pct  = pr > 0 ? (chg / pr) * 100 : 0;
      return { key, price: p, prev: pr, change: chg, changePct: pct, ok: true };
    } catch (e) {
      return { key, ok: false, error: e.message };
    }
  });

  const results = await Promise.all(fetches);

  const markets = {};
  const errors  = {};
  for (const r of results) {
    if (r.ok) {
      markets[r.key] = {
        price:     r.price,
        prev:      r.prev,
        change:    r.change,
        changePct: r.changePct,
      };
    } else {
      errors[r.key] = r.error;
    }
  }

  if (Object.keys(markets).length === 0) {
    return {
      statusCode: 502,
      headers:    HEADERS,
      body:       JSON.stringify({ error: 'All Yahoo Finance quotes failed', errors }),
    };
  }

  return {
    statusCode: 200,
    headers:    HEADERS,
    body:       JSON.stringify({ markets, errors, fetchedAt: new Date().toISOString() }),
  };
};
