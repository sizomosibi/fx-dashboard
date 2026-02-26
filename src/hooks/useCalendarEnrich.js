import { useState, useEffect, useRef } from 'react';

/**
 * useCalendarEnrich
 *
 * Given the live calendar events for a currency (from ForexFactory),
 * calls the Claude proxy to generate FX trade triggers for each
 * unreleased high/medium-impact event.
 *
 * Returns:
 *   triggers   — Map<eventName, { trigger, direction }>
 *   enriching  — boolean: Claude call in-flight
 *   enriched   — boolean: at least one trigger available
 *   error      — string | null
 *   refresh    — function: force re-run
 *
 * Design:
 *   - Only runs when live calendar data is present (isLive = true)
 *   - Only enriches unreleased events with high/medium impact
 *   - Fires once per currency change; re-runs on manual refresh
 *   - Fails silently — calendar renders fine without triggers
 *   - Never blocks the initial calendar render
 */

const SYSTEM_PROMPT = `You are a professional FX macro trader and economist.
Your job is to write concise, specific trade trigger notes for economic data releases.

For each event you receive, write a trigger that tells an FX trader:
1. What the bullish threshold is (e.g. "Above X%")
2. What the bearish threshold is (e.g. "Below Y%")
3. The expected pip/direction impact on the currency pair
4. Any nuance or asymmetry in the reaction (e.g. "beats fade, misses stick")

Keep each trigger to 2-3 sentences maximum. Be specific with numbers.
Do NOT use generic phrases like "positive/negative for currency".

Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
Format: [{"event": "exact event name", "trigger": "your trigger text", "direction": "bullish|bearish|neutral"}]
The "direction" field reflects the CURRENT CONSENSUS expectation's directional bias for the currency.`;

function buildUserPrompt(events, currency) {
  const lines = events.map(e =>
    `- Event: "${e.event}" | Forecast: ${e.forecast || '?'} | Prior: ${e.previous || '?'} | Impact: ${e.impact}`
  ).join('\n');

  return `Generate FX trade triggers for these upcoming ${currency} economic events:

${lines}

Context: Focus on how each release affects ${currency}/USD direction and any relevant crosses.
Return ONLY the JSON array.`;
}

async function fetchTriggers(events, currency) {
  // Only enrich unreleased high/medium-impact events
  const toEnrich = events.filter(e =>
    (!e.actual || e.actual === '—') &&
    (e.impact === 'high' || e.impact === 'medium')
  );

  if (toEnrich.length === 0) return {};

  const res = await fetch('/api/claude', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001', // fast + cheap — this runs on every currency switch
      max_tokens: 800,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: buildUserPrompt(toEnrich, currency) }],
    }),
  });

  if (!res.ok) throw new Error(`Claude proxy HTTP ${res.status}`);
  const data = await res.json();

  // Extract text from content blocks
  const raw = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Strip markdown fences if Claude ignored the instruction
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`JSON parse failed: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) throw new Error('Response not an array');

  // Build map: eventName → { trigger, direction }
  const map = {};
  for (const item of parsed) {
    if (item.event && item.trigger) {
      map[item.event] = {
        trigger:   item.trigger,
        direction: item.direction || 'neutral',
      };
    }
  }
  return map;
}

export function useCalendarEnrich(liveEvents, currency, isLive) {
  const [triggers,  setTriggers]  = useState({});
  const [enriching, setEnriching] = useState(false);
  const [enriched,  setEnriched]  = useState(false);
  const [error,     setError]     = useState(null);

  // Track which (currency, eventSet) we last enriched — avoid duplicate calls
  const lastKeyRef = useRef(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!isLive || !liveEvents?.length) return;

    // Build a stable key: currency + sorted event names with forecasts
    // This means we re-enrich if forecasts change (e.g. Bloomberg revises consensus)
    const eventKey = liveEvents
      .filter(e => !e.actual || e.actual === '—')
      .filter(e => e.impact === 'high' || e.impact === 'medium')
      .map(e => `${e.event}:${e.forecast || '?'}`)
      .sort()
      .join('|');

    const runKey = `${currency}::${eventKey}::${refreshTick}`;
    if (runKey === lastKeyRef.current) return;
    lastKeyRef.current = runKey;

    // If no high/medium unreleased events, nothing to enrich
    if (!eventKey) return;

    setEnriching(true);
    setError(null);

    fetchTriggers(liveEvents, currency)
      .then(map => {
        setTriggers(map);
        setEnriched(Object.keys(map).length > 0);
      })
      .catch(e => {
        console.warn('[CalendarEnrich]', e.message);
        setError(e.message);
        setEnriched(false);
      })
      .finally(() => setEnriching(false));

  }, [liveEvents, currency, isLive, refreshTick]);

  const refresh = () => {
    lastKeyRef.current = null; // force re-run
    setRefreshTick(t => t + 1);
  };

  return { triggers, enriching, enriched, error, refresh };
}
