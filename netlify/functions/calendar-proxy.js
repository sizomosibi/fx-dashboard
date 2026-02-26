/**
 * Netlify Function — Economic Calendar Proxy
 *
 * Primary source: ForexFactory's undocumented but stable JSON endpoint
 * (nfs.faireconomy.media) used by FF's own website for this/next week.
 *
 * Returns this week + next week of G10 economic events grouped by currency.
 *
 * GET /api/calendar
 * Returns: { events: [...], byCurrency: { AUD:[...], ... }, fetchedAt }
 */

const G10 = new Set(['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'NZD']);

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=1800',
};

// Safe fetch timeout — AbortSignal.timeout() not available on all Node runtimes.
function timedFetch(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}


function normaliseImpact(str) {
  const s = (str || '').toLowerCase();
  if (s.includes('high'))   return 'high';
  if (s.includes('medium') || s.includes('moderate')) return 'medium';
  return 'low';
}

function fmtDate(isoStr) {
  try {
    return new Date(isoStr).toLocaleDateString('en-AU', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
  } catch { return isoStr || ''; }
}

function fmtTime(isoStr) {
  try {
    const d  = new Date(isoStr);
    const h  = d.getUTCHours();
    const m  = d.getUTCMinutes();
    if (h === 0 && m === 0) return 'All Day';
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}${h < 12 ? 'am' : 'pm'} UTC`;
  } catch { return ''; }
}

function transformEvents(rawEvents) {
  return (rawEvents || [])
    .filter(e => G10.has((e.country || '').toUpperCase()))
    .map(e => ({
      currency: (e.country || '').toUpperCase(),
      date:     fmtDate(e.date),
      time:     fmtTime(e.date),
      isoDate:  e.date || null,
      event:    (e.title || '').trim(),
      impact:   normaliseImpact(e.impact),
      forecast: e.forecast || '—',
      previous: e.previous || '—',
      actual:   e.actual   || null,
    }));
}

function groupByCurrency(events) {
  const byCurrency = {};
  for (const e of events) {
    if (!byCurrency[e.currency]) byCurrency[e.currency] = [];
    byCurrency[e.currency].push(e);
  }
  return byCurrency;
}

async function fetchFFWeek(which) {
  const urls = [
    `https://nfs.faireconomy.media/ff_calendar_${which}week.json?timezone=UTC`,
    `https://nfs.faireconomy.media/ff_calendar_${which}week.json`,
  ];
  let lastErr;
  for (const url of urls) {
    try {
      const res = await timedFetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/2.0)',
          'Accept':     'application/json, */*',
          'Referer':    'https://www.forexfactory.com/',
        },
      }, 10000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Not an array');
      return data;
    } catch (e) { lastErr = e; }
  }
  throw new Error(`FF ${which}week: ${lastErr?.message}`);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const weeks   = ['this', 'next'];
  const results = await Promise.allSettled(weeks.map(fetchFFWeek));

  let allRaw = [];
  const errors = [];

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      allRaw = allRaw.concat(results[i].value);
    } else {
      errors.push(`${weeks[i]}week: ${results[i].reason?.message}`);
      console.error('[Calendar Proxy]', errors[errors.length - 1]);
    }
  }

  if (allRaw.length === 0) {
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'ForexFactory calendar unavailable', errors }),
    };
  }

  const events     = transformEvents(allRaw);
  const byCurrency = groupByCurrency(events);

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      events,
      byCurrency,
      total:     events.length,
      errors:    errors.length ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    }),
  };
};
