/**
 * Netlify Function — G10 News Proxy
 *
 * Aggregates forex news from multiple free RSS feeds.
 * Runs server-side to avoid CORS. Parses XML with no dependencies.
 * Tags each article with relevant G10 currencies based on keywords.
 *
 * GET /api/news               → all articles, all currencies
 * GET /api/news?ccy=AUD       → articles relevant to AUD
 * GET /api/news?ccy=AUD,EUR   → articles relevant to AUD or EUR
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=300', // 5-min cache
};

// Safe fetch timeout — AbortSignal.timeout() not available on all Node runtimes.
function timedFetch(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}


// RSS feed sources — all free, no key required
const RSS_FEEDS = [
  {
    url:    'https://www.fxstreet.com/rss/news',
    source: 'FXStreet',
  },
  {
    url:    'https://forexlive.com/feed/news',
    source: 'ForexLive',
  },
  {
    url:    'https://www.dailyfx.com/feeds/all',
    source: 'DailyFX',
  },
];

// Currency keyword mapping for tagging articles
const CCY_KEYWORDS = {
  AUD: ['australia', 'rba', 'reserve bank of australia', 'australian dollar', 'aud/'],
  USD: ['federal reserve', 'fed ', 'fomc', 'us dollar', 'united states economy', 'usd/', 'us cpi', 'us gdp', 'nonfarm', 'payrolls'],
  EUR: ['ecb', 'european central bank', 'eurozone', 'euro area', 'eur/', 'german', 'france economy'],
  GBP: ['bank of england', 'boe', 'uk economy', 'britain', 'sterling', 'gbp/', 'uk cpi', 'uk gdp'],
  JPY: ['bank of japan', 'boj', 'japan economy', 'japanese yen', 'jpy/', 'tokyo cpi', 'tankan'],
  CHF: ['swiss national bank', 'snb', 'swiss franc', 'switzerland economy', 'chf/'],
  CAD: ['bank of canada', 'boc ', 'canadian dollar', 'canada economy', 'cad/', 'canadian cpi'],
  NZD: ['reserve bank of new zealand', 'rbnz', 'new zealand economy', 'kiwi dollar', 'nzd/'],
  XAU: ['gold price', 'gold rally', 'gold drops', 'xau/', 'bullion', 'precious metal'],
};

// Tag an article with relevant currencies
function tagCurrencies(text) {
  const lower = text.toLowerCase();
  const tagged = [];
  for (const [ccy, keywords] of Object.entries(CCY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tagged.push(ccy);
    }
  }
  return tagged;
}

// Simple RSS XML parser — no dependencies
function parseRSS(xml, sourceName) {
  const items    = [];
  const rawItems = xml.match(/<item[\s>]([\s\S]*?)<\/item>/g) || [];

  for (const raw of rawItems) {
    // Title — handles both plain and CDATA
    const titleMatch = raw.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const title      = (titleMatch?.[1] || '').trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Link
    const linkMatch = raw.match(/<link>(.*?)<\/link>/) || raw.match(/<link\s+href="(.*?)"/);
    const link      = (linkMatch?.[1] || '').trim();

    // Description / summary
    const descMatch  = raw.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    const rawDesc    = (descMatch?.[1] || '').trim();
    // Strip HTML tags from description
    const description = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);

    // Publication date
    const pubMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/) || raw.match(/<dc:date>(.*?)<\/dc:date>/);
    const pubDate  = (pubMatch?.[1] || '').trim();

    if (!title || !link) continue;

    const combined    = `${title} ${description}`.toLowerCase();
    const currencies  = tagCurrencies(combined);

    // Include if relevant to at least one G10 currency, or if forex-specific source
    if (currencies.length === 0 && sourceName !== 'ForexLive') continue;

    items.push({
      title,
      description,
      link,
      pubDate,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      source:      sourceName,
      currencies:  currencies.length ? currencies : ['USD'], // fallback for ForexLive
    });
  }

  return items;
}

async function fetchFeed(feed) {
  const res = await timedFetch(feed.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/1.0)',
      'Accept':     'application/rss+xml, application/xml, text/xml, */*',
    },
  }, 8000);
  if (!res.ok) throw new Error(`${feed.source} HTTP ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml, feed.source);
}

// Format pubDate for display — "2h ago", "Mon 14:30", etc.
function timeAgo(isoStr) {
  if (!isoStr) return '';
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (mins < 2)    return 'just now';
    if (mins < 60)   return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days < 7)    return `${days}d ago`;
    return new Date(isoStr).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  // Parse ?ccy= filter
  const ccyParam = event.queryStringParameters?.ccy || '';
  const ccyFilter = ccyParam
    ? new Set(ccyParam.split(',').map(c => c.trim().toUpperCase()))
    : null;

  try {
    // Fetch all feeds in parallel, ignore individual failures
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    const allArticles = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    }

    if (allArticles.length === 0) {
      return {
        statusCode: 502,
        headers:    HEADERS,
        body:       JSON.stringify({ error: 'All RSS feeds failed' }),
      };
    }

    // Deduplicate by title similarity
    const seen  = new Set();
    const deduped = allArticles.filter(a => {
      const key = a.title.slice(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    deduped.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    // Apply currency filter
    const filtered = ccyFilter
      ? deduped.filter(a => a.currencies.some(c => ccyFilter.has(c)))
      : deduped;

    // Add timeAgo display string
    const articles = filtered.slice(0, 80).map(a => ({
      ...a,
      timeAgo: timeAgo(a.publishedAt),
    }));

    // Also group by currency for convenience
    const byCurrency = {};
    for (const article of articles) {
      for (const ccy of article.currencies) {
        if (!byCurrency[ccy]) byCurrency[ccy] = [];
        if (byCurrency[ccy].length < 8) byCurrency[ccy].push(article);
      }
    }

    return {
      statusCode: 200,
      headers:    HEADERS,
      body:       JSON.stringify({
        articles,
        byCurrency,
        total:     articles.length,
        fetchedAt: new Date().toISOString(),
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers:    HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
