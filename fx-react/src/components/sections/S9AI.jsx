import { useState } from 'react';
import { SectionHead } from '../ui/SectionHead.jsx';
import { COT } from '../../data/scores.js';
import { score } from '../../hooks/useScores.js';

const QUICK_PROMPTS = [
  { label: 'CURRENT BIAS',   fn: (ccy, cb) => `What is the primary fundamental driver of ${ccy} right now and what is the directional bias?` },
  { label: 'POLICY CHAIN',   fn: (ccy, cb) => `Walk me through the cause-effect chain from ${cb} policy to ${ccy} currency direction.` },
  { label: 'WEEK RISKS',     fn: (ccy)     => `What are the key risks to ${ccy} this week and how should a trader position ahead of key data?` },
  { label: 'BEST PAIR',      fn: (ccy)     => `Which G10 currency has the strongest fundamental divergence against ${ccy} right now and why?` },
  { label: 'PARTNERS',       fn: (ccy)     => `Explain how ${ccy} trading partners affect currency direction this week.` },
  { label: 'GEO IMPACT',     fn: (ccy)     => `Is ${ccy} a safe-haven or risk-on currency and what geopolitical scenarios would trigger big moves?` },
];

export function S9AI({ d, mkt }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('Ready. Ask a question or use a quick prompt above.');
  const [loading,  setLoading]  = useState(false);

  const isGold = d.name === 'XAU';

  function buildContext() {
    if (isGold) {
      return `You are a professional macro analyst specialising in gold (XAU/USD).
CURRENT DATA:
- Gold Spot: ${d.spotPrice} (YTD ${d.ytdChange})
- US 10Y: ${mkt.yields.US10Y.v} (${mkt.yields.US10Y.chg}) — ${mkt.yields.US10Y.interp === 'hawk' ? 'HAWKISH' : 'DOVISH'}
- Real Rate: ${mkt.yields.realRate10Y.v} (${mkt.yields.realRate10Y.dir === 'down' ? 'FALLING = BULLISH GOLD' : 'RISING = HEADWIND'})
- DXY: ${mkt.dxy.v} | VIX: ${mkt.vix.v}
Framework: Gold rises when (1) real rates fall, (2) USD weakens, (3) geopolitical fear rises, (4) CB demand grows. Be direct. Under 350 words.`;
    }
    return `You are a professional FX macro analyst.
CURRENT DATA:
- ${d.name} (${d.full}) | CB: ${d.centralBank} | Rate: ${d.interestRate} | Bias: ${d.bias}
- Inflation: ${d.triad?.inf?.map(x => `${x.n}: ${x.v}`).join(', ')}
- Growth: ${d.triad?.gro?.map(x => `${x.n}: ${x.v}`).join(', ')}
- Employment: ${d.triad?.emp?.map(x => `${x.n}: ${x.v}`).join(', ')}
- CB Guidance: ${d.cbSpeeches?.[0]?.implication}
- Divergence Score: ${score(d.name).toFixed(1)}
- COT: Net ${COT[d.name]?.net > 0 ? 'Long' : 'Short'} ${Math.abs(COT[d.name]?.net || 0)}%
- Global: 10Y ${mkt.yields.US10Y.v}, VIX ${mkt.vix.v}, DXY ${mkt.dxy.v}, Gold ${mkt.gold.v}
Framework: Data → CB Reaction → Rates → Capital Flows → Currency. Direct, under 350 words. No disclaimers.`;
  }

  async function runAI(q) {
    if (!q?.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     buildContext(),
          messages:   [{ role: 'user', content: q }],
        }),
      });
      const data = await res.json();
      setResponse(data.content?.map(c => c.text || '').join('') || 'No response received.');
    } catch (e) {
      setResponse('Connection error. If running locally, deploy to Netlify for AI Analyst access.');
    }
    setLoading(false);
  }

  function handlePrompt(promptFn) {
    const q = promptFn(d.name, d.centralBank);
    setQuestion(q);
    runAI(q);
  }

  return (
    <>
      <hr className="sec-rule" />
      <SectionHead num={9} title="AI Macro Analyst — Powered by Claude" />

      <div className="ai-panel">
        <div className="ai-lbl">
          CLAUDE MACRO ANALYST · {d.flag} {d.name} · {d.centralBank?.toUpperCase()}
        </div>

        <div className="ai-quick">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} className="ai-qbtn" onClick={() => handlePrompt(p.fn)}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="ai-row">
          <textarea
            className="ai-ta"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={`Ask anything about ${d.name}: macro fundamentals, trade ideas, risk scenarios...`}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) runAI(question); }}
          />
          <button className="ai-go" onClick={() => runAI(question)} disabled={loading}>
            {loading ? '...' : 'ANALYSE →'}
          </button>
        </div>

        <div className="ai-resp" style={{ color: loading ? '#444' : undefined }}>
          {loading
            ? <div className="ai-loading">Analysing <div className="dots"><span /><span /><span /></div></div>
            : response}
        </div>
      </div>
    </>
  );
}
