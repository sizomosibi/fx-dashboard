import { useState, useCallback } from 'react';
import { SectionHead } from '../ui/SectionHead.jsx';
import { useCurrentCcy } from '../../context/AppContext.jsx';
import { useCurrencyData } from '../../hooks/useCurrencyData.js';
import { COT } from '../../data/scores.js';
import { score } from '../../hooks/useScores.js';

// ── Mode definitions ───────────────────────────────────────────────
const MODES = [
  { id: 'cb',    label: 'CB Statement',  icon: '🏦' },
  { id: 'data',  label: 'Data Release',  icon: '📊' },
  { id: 'cot',   label: 'COT Report',    icon: '📋' },
  { id: 'brief', label: 'Full Brief',    icon: '📰' },
];

// ── Prompt builders ────────────────────────────────────────────────
// Each returns { systemPrompt, userPrompt, pasteTarget, hint }
// systemPrompt: tells Claude its role and the current data state
// userPrompt:   wraps the raw pasted input with task instructions
// pasteTarget:  tells user which file/field to update
// hint:         what to paste into the textarea

function buildCBPrompt(cur, d) {
  const currentData = `
CURRENT DATA FOR ${cur} IN currencies.js:
  centralBank:   ${d.centralBank}
  interestRate:  ${d.interestRate}
  bias:          ${d.bias}
  cbGroup:       ${d.cbGroup || 'unknown'}
  score:         ${JSON.stringify(d.score || {})}
  rateChange:    ${d.rateChange}
  ratePath:      ${JSON.stringify(d.ratePath)}
  ratePathLabels:${JSON.stringify(d.ratePathLabels)}
  cbSpeeches[0]: ${JSON.stringify(d.cbSpeeches?.[0])}`;

  const systemPrompt =
`You are an FX macro analyst assistant maintaining a live trading dashboard. Your job is to parse central bank statements and rewrite JavaScript data fields precisely.

${currentData}

OUTPUT FORMAT: Return ONLY valid JavaScript object properties — no explanation, no markdown fences, no preamble. The user will paste your output directly into their currencies.js data file. Start immediately with the field names.`;

  const userPrompt =
`Parse the following ${d.centralBank} statement/speech and rewrite these fields for ${cur}:

--- PASTE START ---
{{INPUT}}
--- PASTE END ---

Update and return exactly these fields:
  bias:           (hawkish / dovish / neutral)
  cbGroup:        (HIKING / ON HOLD / CUTTING SLOWLY / CUTTING AGGRESSIVELY — determines policy stance grouping in §1 macro dashboard)
  score:          ({monetary:N, growth:N, inflation:N, risk:N, commodity:N} — divergence score components; monetary range -4 to +4, others -3 to +3)
  rateChange:     (e.g. '-0.25%' or '0.00%')
  ratePath:       (array of 4 rate strings, current → 18 months out, e.g. ['4.10%','3.85%','3.60%','3.35%'])
  ratePathLabels: (array of 4 date strings, e.g. ['Feb 26','May 26','Aug 26','Nov 26'])
  cbSpeeches: [{
    speaker:    (name and title),
    date:       (e.g. 'Mar 18, 2026'),
    text:       (direct quote of most important sentence, max 2 sentences),
    implication:(2-3 sentence FX implication: what does this mean for rate path, rate differentials, and ${cur}/USD direction?)
  }]`;

  return {
    systemPrompt,
    userPrompt,
    pasteTarget: `src/data/currencies.js → ${cur} object → bias, cbGroup, score, rateChange, ratePath, ratePathLabels, cbSpeeches fields`,
    hint: `Paste the full central bank press release, statement on monetary policy, or speech transcript. Include the date and speaker name if not in the text.`,
  };
}

function buildDataPrompt(cur, d) {
  const currentTriad = `
CURRENT TRIAD DATA FOR ${cur}:
  Inflation: ${JSON.stringify(d.triad?.inf?.slice(0,2))}
  Growth:    ${JSON.stringify(d.triad?.gro?.slice(0,2))}
  Employment:${JSON.stringify(d.triad?.emp?.slice(0,2))}
  surpriseIndex: ${d.surpriseIndex}`;

  const systemPrompt =
`You are an FX macro analyst assistant updating a live trading dashboard with new economic data releases.

${currentTriad}

OUTPUT FORMAT: Return ONLY valid JavaScript object properties. No explanation, no markdown fences. Start immediately with the field names.`;

  const userPrompt =
`Parse the following data release for ${cur} (${d.centralBank}) and update the relevant fields:

--- PASTE START ---
{{INPUT}}
--- PASTE END ---

Return only the fields that need updating. Choose from:
  triad.inf: (array of {n, v, c, d} — n=name, v=value string, c=change string, d='up'/'down'/'flat')
  triad.gro: (same format)
  triad.emp: (same format)
  surpriseIndex: (number -50 to +50, positive = data beating consensus)
  weekAhead: (array of upcoming events — only update if you see forward-looking data or calendar)

For the 'd' direction field: 'up' means the number rose, 'down' means it fell.
For inflation: rising CPI = 'up'. For unemployment: rising rate = 'up' (worsening). For GDP: rising growth = 'up'.`;

  return {
    systemPrompt,
    userPrompt,
    pasteTarget: `src/data/currencies.js → ${cur} object → triad.inf / triad.gro / triad.emp / surpriseIndex fields`,
    hint: `Paste the data release text — e.g. "Australia CPI: 2.4% vs 2.6% expected, prior 2.7%". Include the prior value and market consensus if available. You can paste multiple releases at once.`,
  };
}

function buildCOTPrompt(cur) {
  const currentCOT = COT[cur]
    ? `CURRENT COT DATA FOR ${cur}: net=${COT[cur].net}%, prev=${COT[cur].prev}%`
    : `No current COT data for ${cur}`;

  const systemPrompt =
`You are an FX macro analyst assistant updating CFTC Commitments of Traders (COT) positioning data for a trading dashboard.

${currentCOT}

Net speculative position = (Non-Commercial Long − Non-Commercial Short) / Open Interest × 100

OUTPUT FORMAT: Return ONLY valid JavaScript object properties. No explanation, no markdown fences.`;

  const userPrompt =
`Parse the following CFTC COT report data and update the ${cur} entry:

--- PASTE START ---
{{INPUT}}
--- PASTE END ---

Return exactly:
  COT.${cur}: {
    net:    (integer, net non-commercial position as % of OI, e.g. -45),
    prev:   (integer, previous week's net for WoW comparison),
    label:  (e.g. '${COT[cur]?.label || cur + ' Futures'}'),
    detail: (2-3 sentence analysis: positioning level, trend direction, squeeze risk, FX implication for ${cur})
  }`;

  return {
    systemPrompt,
    userPrompt,
    pasteTarget: `src/data/scores.js → COT object → ${cur} entry`,
    hint: `Paste the CFTC report row for ${cur} futures. You can paste the raw CSV row, the table from the CFTC website, or describe: "Non-commercial long: 45,230, short: 78,450, open interest: 165,200, prior week: long 42,100, short 79,800"`,
  };
}

function buildBriefPrompt(cur, d) {
  const systemPrompt =
`You are a senior FX macro analyst maintaining a professional trading dashboard. You write concise, precise, actionable analysis — no padding, no disclaimers.

CURRENT FULL DATA FOR ${cur}:
${JSON.stringify({ name: d.name, centralBank: d.centralBank, interestRate: d.interestRate, bias: d.bias, rateChange: d.rateChange, triad: d.triad, cbSpeeches: d.cbSpeeches, geopolitical: d.geopolitical, weekAhead: d.weekAhead }, null, 2)}

OUTPUT FORMAT: Return ONLY valid JavaScript object properties that need updating. No explanation, no markdown fences. Start immediately with field names.`;

  const userPrompt =
`Based on the following market news, data, and events for ${cur}, update any fields in the currencies.js ${cur} object that are now outdated:

--- PASTE START ---
{{INPUT}}
--- PASTE END ---

You may update any combination of: bias, cbGroup, score, rateChange, ratePath, ratePathLabels, cbSpeeches, triad (inf/gro/emp), weekAhead, geopolitical, surpriseIndex, chains.

Only include fields that materially changed. Preserve all other fields as-is.`;

  return {
    systemPrompt,
    userPrompt,
    pasteTarget: `src/data/currencies.js → ${cur} object — paste whichever fields Claude returns`,
    hint: `Paste anything relevant: CB press release, Bloomberg headlines, data releases, PMI prints, employment report. The more context, the better the output. Claude will determine which fields need updating.`,
  };
}

function buildPrompt(mode, cur, d) {
  switch (mode) {
    case 'cb':    return buildCBPrompt(cur, d);
    case 'data':  return buildDataPrompt(cur, d);
    case 'cot':   return buildCOTPrompt(cur, d);
    case 'brief': return buildBriefPrompt(cur, d);
    default:      return buildBriefPrompt(cur, d);
  }
}

// ── Copy to clipboard helper ───────────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Main component ─────────────────────────────────────────────────
export function S11Update() {
  const cur = useCurrentCcy();
  const d   = useCurrencyData();

  const [mode,       setMode]       = useState('cb');
  const [rawInput,   setRawInput]   = useState('');
  const [response,   setResponse]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [copyLabel,  setCopyLabel]  = useState('COPY PROMPT');
  const [copyRLabel, setCopyRLabel] = useState('COPY CODE');
  const [apiStatus,  setApiStatus]  = useState('idle'); // 'idle'|'ok'|'local'

  const promptDef = buildPrompt(mode, cur, d);

  // Build the full prompt with user input injected
  const buildFull = useCallback(() => {
    return { system: promptDef.systemPrompt, user: promptDef.userPrompt.replace('{{INPUT}}', rawInput.trim()) };
  }, [promptDef, rawInput]);

  async function handleSend() {
    if (!rawInput.trim()) return;
    setLoading(true);
    setResponse('');
    setApiStatus('idle');

    const { system, user } = buildFull();

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system,
          messages:   [{ role: 'user', content: user }],
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.content?.map(c => c.text || '').join('') || '';
      setResponse(text);
      setApiStatus('ok');
    } catch {
      // Local dev fallback — /api/claude doesn't exist locally
      setApiStatus('local');
      setResponse('');
    }

    setLoading(false);
  }

  async function handleCopyPrompt() {
    const { system, user } = buildFull();
    const full = `SYSTEM:\n${system}\n\n${'─'.repeat(60)}\n\nUSER:\n${user}`;
    const ok = await copyToClipboard(full);
    setCopyLabel(ok ? 'COPIED ✓' : 'COPY FAILED');
    setTimeout(() => setCopyLabel('COPY PROMPT'), 2000);
  }

  async function handleCopyResponse() {
    const ok = await copyToClipboard(response);
    setCopyRLabel(ok ? 'COPIED ✓' : 'COPY FAILED');
    setTimeout(() => setCopyRLabel('COPY CODE'), 2000);
  }

  const isGold = cur === 'XAU';

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={11} title="Update Assistant — AI-Powered Data Refresh" />

      <div className="ua-explainer">
        <strong style={{ color: 'var(--ink)' }}>How it works:</strong>{' '}
        Pick a mode, paste raw data (CB statement, data release, CFTC numbers), then either
        send to Claude directly (requires Netlify deployment) or copy the prompt to paste into
        Claude.ai. Claude returns ready-to-paste JavaScript for your data files.
      </div>

      {/* Mode tabs */}
      <div className="ua-modes">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`ua-mode-btn${mode === m.id ? ' active' : ''}`}
            onClick={() => { setMode(m.id); setResponse(''); setApiStatus('idle'); }}
          >
            <span className="ua-mode-icon">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Context chip */}
      <div className="ua-context">
        <span className="ua-ctx-lbl">CURRENCY</span>
        <span className="ua-ctx-val">{d.flag} {cur} — {d.centralBank}</span>
        <span className="ua-ctx-sep">|</span>
        <span className="ua-ctx-lbl">RATE</span>
        <span className="ua-ctx-val">{d.interestRate}</span>
        <span className="ua-ctx-sep">|</span>
        <span className="ua-ctx-lbl">BIAS</span>
        <span className={`ua-ctx-val bias-${d.bias}`}>{d.bias?.toUpperCase()}</span>
        <span className="ua-ctx-sep">|</span>
        <span className="ua-ctx-lbl">DIV SCORE</span>
        <span className="ua-ctx-val">{score(cur) > 0 ? '+' : ''}{score(cur).toFixed(1)}</span>
      </div>

      {/* Paste target */}
      <div className="ua-target">
        <span className="ua-target-lbl">WILL UPDATE →</span>
        <span className="ua-target-val">{promptDef.pasteTarget}</span>
      </div>

      {/* Input area */}
      <div className="ua-input-block">
        <div className="ua-hint">
          <span className="ua-hint-icon">ℹ</span>
          {promptDef.hint}
        </div>
        <textarea
          className="ua-textarea"
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          placeholder={`Paste ${MODES.find(m => m.id === mode)?.label.toLowerCase()} here...`}
          rows={8}
        />
        <div className="ua-actions">
          <button
            className="ua-btn primary"
            onClick={handleSend}
            disabled={loading || !rawInput.trim()}
          >
            {loading ? 'ANALYSING...' : '⚡ SEND TO CLAUDE'}
          </button>
          <button
            className="ua-btn secondary"
            onClick={handleCopyPrompt}
            disabled={!rawInput.trim()}
          >
            {copyLabel}
          </button>
          <span className="ua-local-note">
            ⚡ requires Netlify · COPY works locally
          </span>
        </div>
      </div>

      {/* Local mode fallback */}
      {apiStatus === 'local' && (
        <div className="ua-local-box">
          <div className="ua-local-head">RUNNING LOCALLY — USE COPY PROMPT MODE</div>
          <p>The Claude API proxy only works when deployed to Netlify. To use Update Assistant locally:</p>
          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: 1.8 }}>
            <li>Click <strong style={{ color: 'var(--gold)' }}>COPY PROMPT</strong> above</li>
            <li>Open <a href="https://claude.ai" target="_blank" rel="noreferrer">claude.ai</a> in a new tab</li>
            <li>Paste into a new conversation and send</li>
            <li>Copy Claude's response and paste it into the box below</li>
          </ol>
          <div className="ua-paste-lbl">PASTE CLAUDE'S RESPONSE HERE:</div>
          <textarea
            className="ua-textarea"
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Paste Claude's JavaScript response here..."
            rows={6}
          />
        </div>
      )}

      {/* Response */}
      {(response && apiStatus !== 'local') && (
        <div className="ua-response">
          <div className="ua-resp-head">
            <div>
              <span className="ua-resp-label">CLAUDE OUTPUT</span>
              <span className="ua-resp-target">→ paste into {promptDef.pasteTarget}</span>
            </div>
            <button className="ua-btn secondary small" onClick={handleCopyResponse}>
              {copyRLabel}
            </button>
          </div>
          <pre className="ua-resp-code">{response}</pre>
        </div>
      )}

      {/* Paste response if API worked but also show the paste box for completeness */}
      {(response || apiStatus === 'local') && (
        <div className="ua-instructions">
          <div className="ua-instr-head">HOW TO APPLY THE UPDATE</div>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.9, fontSize: '0.9rem', color: 'var(--muted)' }}>
            <li>Open <code style={{ color: 'var(--gold)' }}>src/data/currencies.js</code> in VSCode</li>
            <li>Find the <code style={{ color: 'var(--gold)' }}>{cur}</code> currency block</li>
            <li>Replace the relevant fields with Claude's output above</li>
            <li>Save the file — Vite hot-reloads instantly, no restart needed</li>
          </ol>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#444' }}>
            Tip: In VSCode, use <kbd>Ctrl+G</kbd> to jump to a line, or <kbd>Ctrl+F</kbd> to search for the field name.
          </div>
        </div>
      )}
    </>
  );
}
