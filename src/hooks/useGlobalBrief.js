import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useGlobalBrief — Live AI-powered global macro & geopolitical brief
 *
 * Runs ONCE at app load (not per currency). Uses Claude Sonnet + web search
 * to pull current tariff, war, and geopolitical news and derive FX context.
 *
 * Returns:
 *   globalBrief  — { riskEnvironment, geoItems, carryCommentary, keyFacts } | null
 *   loading      — boolean
 *   error        — string | null
 *   generatedAt  — ISO string | null
 *   source       — 'cache' | 'live' | null
 *   refresh      — force regenerate
 *
 * Cache: localStorage 'fx_global_v1', 4-hour TTL (global news moves faster).
 * Falls back silently to hardcoded static data when unavailable.
 */

const CACHE_KEY    = 'fx_global_v1';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── JSON schema ──────────────────────────────────────────────────────
const SCHEMA = `{
  "riskEnvironment": {
    "sentiment": "risk-off OR risk-on OR neutral",
    "tag": "Short ALL-CAPS label e.g. RISK-OFF — TARIFF ESCALATION",
    "name": "Descriptive title e.g. 'Stagflation Fear — Trade War Escalating'",
    "desc": "2-3 sentences describing the dominant market theme this week. Be specific: name the events, the levels, the currencies most affected.",
    "weekOf": "Current week date range e.g. 'Mar 3–7, 2025'"
  },
  "geoItems": [
    {
      "category": "TARIFF OR WAR OR GEOPOLITICAL OR MACRO",
      "title": "Event title — specific and current (max 12 words)",
      "effect": "bullish OR bearish OR mixed",
      "affectedCurrencies": ["USD", "EUR"],
      "analysis": "2-3 sentences of FX market impact. Name specific pairs, direction, and magnitude.",
      "detail": "1-2 sentences of deeper context — what to watch next, key levels or dates.",
      "severity": "high OR medium OR low"
    }
  ],
  "carryCommentary": "2-3 sentences on the current carry trade environment. Which pairs are at risk, which rate differentials are compressing, and what triggers a violent unwind.",
  "keyFacts": [
    "Specific verifiable fact with number/date from search results",
    "Another fact — keep to one sentence each"
  ]
}`;

function buildSystemPrompt() {
  return `You are a senior FX macro strategist producing a live global risk brief for professional currency traders.

You have access to web search. Use it extensively — this brief must reflect news from the PAST 7 DAYS ONLY.

MANDATORY SEARCHES (run all four):
1. Current US tariff policy — latest announcements, affected countries and goods, retaliation
2. Active military conflicts and war tensions affecting financial markets right now
3. Geopolitical risks — NATO, Middle East, China-Taiwan, North Korea, sanctions, energy supply
4. Global macro — Fed speeches this week, global recession risk, commodity price moves

WRITING RULES:
- Every sentence must contain a specific fact: a number, country name, date, or price level
- Name the FX pairs affected and the direction (e.g. "USD/CAD bid as 25% tariff on Canadian oil...")
- Present tense — what IS happening now
- No generic statements ("this could affect markets") — only specific, actionable analysis
- Severity ratings: high = moves markets 0.5%+ intraday; medium = 0.2-0.5%; low = background noise

OUTPUT: Return ONLY valid JSON matching this schema. No markdown, no explanation, no code fences:
${SCHEMA}

Requirements:
- riskEnvironment: single object capturing the dominant theme RIGHT NOW
- geoItems: 4–7 items covering the most material current risks across all categories
- carryCommentary: current state of carry trade environment with specific pairs named
- keyFacts: 4–6 verifiable facts you found during search (these become the sidenote sources)`;
}

function buildUserPrompt() {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
  const weekRange = `${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})}–${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

  return `Generate a live global FX macro and geopolitical risk brief.

TODAY: ${dateStr}
WEEK: ${weekRange}

SEARCH NOW — in this order:
1. "US tariffs 2025 latest news today" — What tariffs were announced or implemented this week?
2. "war conflict financial markets ${dateStr}" — What active conflicts are moving currencies?
3. "geopolitical risk FX market ${dateStr}" — What geo events are traders watching?
4. "global recession risk Fed speech this week" — What macro signals matter right now?

For each geoItem, identify which G10 currencies are most affected (use 3-letter codes: USD EUR GBP JPY CHF CAD AUD NZD).
For carryCommentary, focus on JPY, CHF as funding currencies and which high-yielders are most at risk.
For keyFacts, pull out the 4-6 most surprising or market-moving specific facts you found.

Return ONLY the JSON brief.`;
}

// ── Fetch ─────────────────────────────────────────────────────────────
async function callClaude() {
  const res = await fetch('/api/claude', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
      system:     buildSystemPrompt(),
      messages:   [{ role: 'user', content: buildUserPrompt() }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${err.error || res.statusText}`);
  }

  const data = await res.json();

  // Web search produces mixed blocks — JSON is in the last text block
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  if (!textBlocks.length) throw new Error('No text in Claude response');

  const raw     = textBlocks[textBlocks.length - 1];
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]+\}/);
    if (!match) throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  if (!parsed.riskEnvironment || !parsed.geoItems) {
    throw new Error(`Missing required fields. Got: ${Object.keys(parsed).join(', ')}`);
  }
  return parsed;
}

// ── Cache ─────────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { brief, generatedAt } = JSON.parse(raw);
    if (Date.now() - new Date(generatedAt).getTime() > CACHE_TTL_MS) return null;
    return { brief, generatedAt };
  } catch { return null; }
}

function writeCache(brief) {
  const generatedAt = new Date().toISOString();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ brief, generatedAt })); } catch { /* */ }
  return generatedAt;
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* */ }
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useGlobalBrief() {
  const [state, setState] = useState({
    globalBrief: null, loading: false, error: null, generatedAt: null, source: null,
  });
  const [tick, setTick]   = useState(0);
  const runningRef        = useRef(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setState({ globalBrief: cached.brief, loading: false, error: null, generatedAt: cached.generatedAt, source: 'cache' });
      return;
    }

    if (runningRef.current) return;
    runningRef.current = true;
    setState(s => ({ ...s, loading: true, error: null }));

    callClaude()
      .then(parsed => {
        const ts = writeCache(parsed);
        setState({ globalBrief: parsed, loading: false, error: null, generatedAt: ts, source: 'live' });
      })
      .catch(e => {
        console.warn('[useGlobalBrief]', e.message);
        setState({ globalBrief: null, loading: false, error: e.message, generatedAt: null, source: null });
      })
      .finally(() => { runningRef.current = false; });

  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    clearCache();
    runningRef.current = false;
    setTick(t => t + 1);
  }, []);

  return { ...state, refresh };
}
