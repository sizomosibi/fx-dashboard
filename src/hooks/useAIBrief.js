import { useState, useEffect, useRef, useCallback } from 'react';
import { CURRENCIES } from '../data/currencies.js';

/**
 * useAIBrief — Live AI-powered macro brief per currency
 *
 * Calls Claude (Sonnet + web search) to generate:
 *   cbSpeeches   — current CB governor language + rate path implications
 *   geopolitical — live geopolitical and macro risks
 *   pairThesis   — 2-3 trade ideas with current entries/targets/catalysts
 *   cotCommentary — positioning narrative using live COT numbers
 *
 * Cache: localStorage 'fx_aib_v1_[CCY]', 24-hour TTL.
 * Falls back silently — sections render static hardcoded data when brief is null.
 */

const CACHE_PREFIX = 'fx_aib_v1_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const BRIEF_SCHEMA = `{
  "cbSpeeches": [{
    "speaker": "Full name and title",
    "date": "Month DD, YYYY",
    "text": "Paraphrased quote from most recent CB communication (1-2 sentences)",
    "implication": "2-3 sentences: current rate path, what markets are pricing, the single most important upcoming trigger"
  }],
  "geopolitical": [{
    "title": "Concise event title (max 12 words)",
    "effect": "bullish OR bearish OR mixed",
    "analysis": "2-3 sentences of FX-specific impact analysis for this currency"
  }],
  "pairThesis": [{
    "pair": "CCY1/CCY2",
    "dir": "long OR short",
    "summary": "One-line trade summary",
    "thesis": "2-3 sentence core thesis explaining the divergence",
    "chain": ["Step 1", "Step 2", "Step 3", "Currency direction"],
    "catalyst": "Specific upcoming event or data release",
    "timeframe": "X–Y weeks",
    "entry": "Price level or Market",
    "target": "Price target",
    "stop": "Stop-loss level",
    "conviction": 65,
    "risks": ["Key risk 1", "Key risk 2"],
    "tags": ["RATE DIFFERENTIAL", "MACRO DIVERGENCE"]
  }],
  "cotCommentary": "1-2 sentences on current positioning and squeeze/crowding risk"
}`;

function buildSystemPrompt() {
  return `You are a senior FX macro analyst writing a live brief for professional traders.

Use web search aggressively — this brief must reflect what is happening RIGHT NOW.

REQUIRED SEARCHES (perform all of them):
1. Latest central bank decision and official statement for this currency
2. Current geopolitical and macroeconomic risks affecting this currency  
3. Current FX analyst trade ideas and setups for this currency

STYLE: Direct, specific, trader language. Name exact data points and levels. Present tense.
No generic statements — every sentence must reference a specific number, event, or threshold.

OUTPUT: Return ONLY valid JSON matching this exact schema. No markdown, no explanation:
${BRIEF_SCHEMA}

Requirements:
- cbSpeeches: 1 entry, most recent CB communication
- geopolitical: 2–4 most material current risks
- pairThesis: 2–3 pairs with strongest current divergence
- cotCommentary: interpret the provided COT numbers in context`;
}

function buildUserPrompt(currency, cotData) {
  const ccy       = CURRENCIES[currency];
  const now       = new Date();
  const dateStr   = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const cotNet    = cotData?.[currency]?.net  ?? 'unavailable';
  const cotPrev   = cotData?.[currency]?.prev ?? 'unavailable';
  const cotDir    = (typeof cotNet === 'number' && typeof cotPrev === 'number')
    ? (cotNet > cotPrev ? '— increasing net longs' : '— increasing net shorts')
    : '';

  return `Generate a live FX brief for ${currency} (${ccy?.full || currency}).

TODAY: ${dateStr}

CURRENT CONTEXT:
  Central bank: ${ccy?.centralBank}
  Rate: ${ccy?.interestRate} | Last move: ${ccy?.rateChange} | Bias: ${ccy?.bias}
  Rate path: ${(ccy?.ratePath || []).join(' → ')} (${(ccy?.ratePathLabels || []).join(', ')})
  COT positioning: net ${cotNet}%, prior ${cotPrev}% ${cotDir}

SEARCH NOW:
1. "${ccy?.centralBank} latest rate decision ${monthYear}"
2. "${currency} forex risks outlook ${monthYear}"
3. "${currency} USD FX trade setup ${monthYear}"

For pairThesis, generate 2-3 pairs with the strongest CURRENT fundamental divergence involving ${currency}.
Use today (${dateStr}) — only reference events that have already occurred.

Return ONLY the JSON.`;
}

// ── Fetch ───────────────────────────────────────────────────────────
async function callClaude(currency, cotData) {
  const res = await fetch('/api/claude', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
      system:     buildSystemPrompt(),
      messages:   [{ role: 'user', content: buildUserPrompt(currency, cotData) }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${err.error || res.statusText}`);
  }

  const data = await res.json();

  // Web search produces mixed content blocks — the JSON is always in the last text block
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  if (!textBlocks.length) throw new Error('No text in Claude response');

  const raw = textBlocks[textBlocks.length - 1];
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]+\}/);
    if (!match) throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  if (!parsed.cbSpeeches || !parsed.geopolitical || !parsed.pairThesis) {
    throw new Error(`Missing required fields. Got: ${Object.keys(parsed).join(', ')}`);
  }
  return parsed;
}

// ── Cache helpers ───────────────────────────────────────────────────
function readCache(ccy) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + ccy);
    if (!raw) return null;
    const { brief, generatedAt } = JSON.parse(raw);
    if (Date.now() - new Date(generatedAt).getTime() > CACHE_TTL_MS) return null;
    return { brief, generatedAt };
  } catch { return null; }
}

function writeCache(ccy, brief) {
  const generatedAt = new Date().toISOString();
  try { localStorage.setItem(CACHE_PREFIX + ccy, JSON.stringify({ brief, generatedAt })); } catch { /* */ }
  return generatedAt;
}

function clearCache(ccy) {
  try { localStorage.removeItem(CACHE_PREFIX + ccy); } catch { /* */ }
}

// ── Hook ────────────────────────────────────────────────────────────
export function useAIBrief(currency, cotData) {
  const [state, setState] = useState({
    brief: null, loading: false, error: null, generatedAt: null, source: null,
  });
  const [tick, setTick] = useState(0);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!currency || currency === 'XAU') {
      setState({ brief: null, loading: false, error: null, generatedAt: null, source: null });
      return;
    }

    // Check cache
    const cached = readCache(currency);
    if (cached) {
      setState({ brief: cached.brief, loading: false, error: null, generatedAt: cached.generatedAt, source: 'cache' });
      return;
    }

    // Fetch fresh
    if (runningRef.current) return; // don't double-fetch
    runningRef.current = true;
    setState({ brief: null, loading: true, error: null, generatedAt: null, source: null });

    callClaude(currency, cotData)
      .then(parsed => {
        const ts = writeCache(currency, parsed);
        setState({ brief: parsed, loading: false, error: null, generatedAt: ts, source: 'live' });
      })
      .catch(e => {
        console.warn('[useAIBrief]', currency, e.message);
        setState({ brief: null, loading: false, error: e.message, generatedAt: null, source: null });
      })
      .finally(() => { runningRef.current = false; });

  }, [currency, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    clearCache(currency);
    runningRef.current = false;
    setTick(t => t + 1);
  }, [currency]);

  return { ...state, refresh };
}
