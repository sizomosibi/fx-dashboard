/**
 * Netlify Function — ForexFactory Calendar Proxy
 *
 * Fetches the undocumented but stable ForexFactory JSON endpoint
 * (used by FF's own site). Runs server-side to avoid CORS.
 * Returns this week + next week, filtered to G10 only.
 *
 * GET /api/calendar?week=this   (default)
 * GET /api/calendar?week=next
 * GET /api/calendar?week=both   (returns combined array)
 */

const G10 = new Set(['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'NZD']);

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'public, max-age=900', // 15-min cache
};

// Map FF impact strings → our lowercase tokens
function normaliseImpact(str) {
  const s = (str || '').toLowerCase();
  if (s === 'high')   return 'high';
  if (s === 'medium') return 'medium';
  if (s === 'low')    return 'low';
  return 'low';
}

// Format ISO date string → "Mon Feb 24"
function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-AU', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
  } catch { return isoStr; }
}

// Format ISO date string → "11:30am" (UTC)
function formatTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    if (h === 0 && m === 0) return 'All Day';
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}${h < 12 ? 'am' : 'pm'} UTC`;
  } catch { return ''; }
}

async function fetchWeek(which) {
  const url = `https://nfs.faireconomy.media/ff_calendar_${which}week.json?timezone=UTC`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FXDashboard/1.0)' },
  });
  if (!res.ok) throw new Error(`FF ${which}week HTTP ${res.status}`);
  return res.json();
}

function transformEvents(rawEvents) {
  return rawEvents
    .filter(e => G10.has((e.country || '').toUpperCase()))
    .map(e => ({
      currency:  (e.country || '').toUpperCase(),
      date:      formatDate(e.date),
      time:      formatTime(e.date),
      isoDate:   e.date,
      event:     e.title   || '',
      impact:    normaliseImpact(e.impact),
      forecast:  e.forecast || '—',
      previous:  e.previous || '—',
      actual:    e.actual   || null,   // null = not yet released
    }));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  const week = event.queryStringParameters?.week || 'both';

  try {
    let raw = [];

    if (week === 'this' || week === 'both') {
      const data = await fetchWeek('this');
      raw = raw.concat(Array.isArray(data) ? data : []);
    }
    if (week === 'next' || week === 'both') {
      const data = await fetchWeek('next');
      raw = raw.concat(Array.isArray(data) ? data : []);
    }

    const events = transformEvents(raw);

    // Group by currency for easy lookup on the frontend
    const byCurrency = {};
    for (const e of events) {
      if (!byCurrency[e.currency]) byCurrency[e.currency] = [];
      byCurrency[e.currency].push(e);
    }

    return {
      statusCode: 200,
      headers:    HEADERS,
      body:       JSON.stringify({ events, byCurrency, fetchedAt: new Date().toISOString() }),
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers:    HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
