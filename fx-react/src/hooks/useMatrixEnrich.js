import { useState, useEffect, useRef, useCallback } from 'react';
import { CURRENCIES } from '../data/currencies.js';

/**
 * useMatrixEnrich — AI-derived RISK TYPE and COMMODITY for the divergence matrix
 *
 * Runs ONCE at app load. Sends all G10 currencies' commodity, partner, and
 * policy data to Claude Haiku and asks it to classify:
 *   riskType        — 'safe-haven' | 'risk-on' | 'commodity'
 *   commodityExposure — short label e.g. 'Iron ore, coal' or 'Net oil importer'
 *
 * No web search — pure reasoning over the existing structured data already
 * in currencies.js. Haiku is fast (~2s) and cheap for this kind of task.
 *
 * Cache: localStorage 'fx_matrix_v1', 24-hour TTL.
 * Falls back silently to '—' when unavailable.
 *
 * Returns:
 *   matrixData   — { USD: { riskType, commodityExposure }, EUR: {...}, ... } | null
 *   loading      — boolean
 *   error        — string | null
 *   source       — 'cache' | 'live' | null
 *   refresh      — force regenerate
 */

const CACHE_KEY    = 'fx_matrix_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Build a compact summary of each currency for the prompt ──────────
function buildCurrencySummary() {
  const ccys = Object.keys(CURRENCIES).filter(c => c !== 'XAU');
  return ccys.map(ccy => {
    const c = CURRENCIES[ccy];
    const comms = (c.commodities || []).map(x => `${x.name}(${x.dir})`).join(', ');
    const topPartner = (c.partners || [])[0];
    const partnerStr = topPartner
      ? `top partner ${topPartner.name} ${topPartner.share} [${topPartner.commodity}]`
      : '';
    return `${ccy}: country=${c.country}, bias=${c.bias}, rateChange=${c.rateChange}, commodities=[${comms}]${partnerStr ? ', ' + partnerStr : ''}`;
  }).join('\n');
}

const SCHEMA = `{
  "USD": { "riskType": "safe-haven | risk-on | commodity", "commodityExposure": "3-6 word label" },
  "EUR": { "riskType": "...", "commodityExposure": "..." },
  "GBP": { "riskType": "...", "commodityExposure": "..." },
  "JPY": { "riskType": "...", "commodityExposure": "..." },
  "CHF": { "riskType": "...", "commodityExposure": "..." },
  "AUD": { "riskType": "...", "commodityExposure": "..." },
  "NZD": { "riskType": "...", "commodityExposure": "..." },
  "CAD": { "riskType": "...", "commodityExposure": "..." }
}`;

const SYSTEM = `You are an FX macro analyst classifying G10 currencies for a divergence matrix.

For each currency you will receive: country, policy bias, rate direction, commodity exposures (with bullish/bearish/neutral signals), and top trading partner.

Classify each currency on two dimensions:

RISK TYPE — choose exactly one:
  "safe-haven"  → flows IN during risk-off (USD, JPY, CHF: reserve/haven status, or oil importer that benefits from falling commodities)
  "risk-on"     → flows OUT during risk-off, bid during growth (AUD, NZD, EUR: commodity exporters or growth-sensitive)
  "commodity"   → driven primarily by commodity prices more than risk sentiment alone (CAD: oil; AUD can be this too)

COMMODITY EXPOSURE — 3-6 word label summarising the dominant commodity theme:
  Examples: "Iron ore, coal exporter", "Net oil importer", "Dairy, agriculture", "Oil sands, lumber", "Pharma, finance hub", "Net oil exporter", "Broad commodity importer"

Classification rules:
- JPY: safe-haven (major oil importer, BoJ credibility, carry funding currency)
- CHF: safe-haven (neutral nation, financial centre, SNB floor interventions)
- USD: safe-haven (global reserve currency, net oil exporter)
- AUD, NZD: risk-on (China-linked commodities, high beta to global growth)
- CAD: commodity (76% of exports = energy/resources to US, WTI-correlated)
- EUR, GBP: risk-on (growth-sensitive service economies, not safe-havens)

Return ONLY valid JSON matching this schema. No markdown, no explanation:
${SCHEMA}`;

// ── API call ─────────────────────────────────────────────────────────
async function callHaiku() {
  const res = await fetch('/api/claude', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:     SYSTEM,
      messages: [{
        role:    'user',
        content: `Classify these G10 currencies:\n\n${buildCurrencySummary()}\n\nReturn ONLY the JSON object.`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${err.error || res.statusText}`);
  }

  const data = await res.json();
  const raw  = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]+\}/);
    if (!match) throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
    parsed = JSON.parse(match[0]);
  }

  // Validate — must have at least USD and EUR
  if (!parsed.USD || !parsed.EUR) throw new Error(`Incomplete response. Keys: ${Object.keys(parsed).join(', ')}`);
  return parsed;
}

// ── Cache ─────────────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, generatedAt } = JSON.parse(raw);
    if (Date.now() - new Date(generatedAt).getTime() > CACHE_TTL_MS) return null;
    return { data, generatedAt };
  } catch { return null; }
}

function writeCache(data) {
  const generatedAt = new Date().toISOString();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, generatedAt })); } catch { /* quota */ }
  return generatedAt;
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* */ }
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useMatrixEnrich() {
  const [state, setState] = useState({
    matrixData: null, loading: false, error: null, generatedAt: null, source: null,
  });
  const [tick, setTick] = useState(0);
  const runRef = useRef(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setState({ matrixData: cached.data, loading: false, error: null, generatedAt: cached.generatedAt, source: 'cache' });
      return;
    }

    if (runRef.current) return;
    runRef.current = true;
    setState(s => ({ ...s, loading: true, error: null }));

    callHaiku()
      .then(parsed => {
        const ts = writeCache(parsed);
        setState({ matrixData: parsed, loading: false, error: null, generatedAt: ts, source: 'live' });
      })
      .catch(e => {
        console.warn('[useMatrixEnrich]', e.message);
        setState({ matrixData: null, loading: false, error: e.message, generatedAt: null, source: null });
      })
      .finally(() => { runRef.current = false; });

  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    clearCache();
    runRef.current = false;
    setTick(t => t + 1);
  }, []);

  return { ...state, refresh };
}
