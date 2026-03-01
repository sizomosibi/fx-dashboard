// ── GuideView.jsx — How to use the FX Macro Intelligence Dashboard ─

const S = {
  page: { maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' },
  h1:   { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '0.18em', marginBottom: '0.5rem' },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', color: 'var(--ink)', lineHeight: 1.2, marginBottom: '0.4rem' },
  sub:  { fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '3rem', lineHeight: 1.6 },
  sec:  { marginBottom: '2.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1.5rem' },
  secH: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.18em', marginBottom: '0.75rem' },
  h2:   { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--ink)', marginBottom: '1rem' },
  p:    { fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: '0.85rem' },
  rule: { color: 'var(--ink)', fontWeight: 500 },
  mono: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--teal)' },
  warn: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--red)' },
  gold: { color: 'var(--gold)' },
  tag:  { display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', padding: '0.1rem 0.4rem', border: '1px solid', borderRadius: 2, marginRight: '0.4rem', letterSpacing: '0.06em' },
};

function Tag({ label, color = 'var(--teal)' }) {
  return <span style={{ ...S.tag, color, borderColor: color + '55', background: color + '12' }}>{label}</span>;
}

function Block({ label, children }) {
  return (
    <div style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', borderLeft: '3px solid var(--gold)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      {label && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--gold)', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>{label}</div>}
      {children}
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.4rem', color: 'var(--rule)', lineHeight: 1, paddingTop: '0.1rem', flexShrink: 0, width: 28, textAlign: 'right' }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--ink)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>{title}</div>
        <div style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function DotLegendRow({ color, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: '0.3rem', display: 'inline-block' }} />
      <div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--ink)' }}>{label}</span>
        <span style={{ fontSize: '0.88rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>{desc}</span>
      </div>
    </div>
  );
}

export function GuideView() {
  return (
    <div style={S.page}>
      <div style={S.h1}>DASHBOARD GUIDE</div>
      <div style={S.title}>How to Use This Dashboard</div>
      <div style={S.sub}>
        A structured workflow for macro FX research — from global risk environment to executable trade setup.
        Each section feeds the next. Read in order on first use.
      </div>

      {/* ── ARCHITECTURE ─────────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>01 — ARCHITECTURE</div>
        <div style={S.h2}>What this dashboard is and is not</div>
        <p style={S.p}>
          This is a <span style={S.rule}>macro research tool</span>, not a signal generator.
          It assembles the evidence you need to form a directional view on a currency pair and size a position.
          It does not tell you when to enter. That decision requires price action confirmation — a separate discipline.
        </p>
        <p style={S.p}>
          The dashboard operates on two data layers. <span style={S.rule}>Live data</span> — CB benchmark rates,
          Treasury yields, FX spot, COT positioning, market prices — updates automatically via GitHub Actions
          and Yahoo Finance. <span style={S.rule}>Static data</span> — triad indicators (CPI, GDP, unemployment),
          CB speech analysis, geopolitical context — requires manual refresh via the <Tag label="§11 UPDATE" color="var(--gold)" /> assistant
          after each major data release. The status dots on each data block tell you which layer is active.
        </p>
        <Block label="DATA STATUS LEGEND">
          <DotLegendRow color="#4fc3a1" label="LIVE"     desc="— auto-fetched this session. Trust these numbers." />
          <DotLegendRow color="#c4973a" label="BASELINE" desc="— last GitHub Actions run. Rates and COT current to last weekend." />
          <DotLegendRow color="#e05c5c" label="STALE"    desc="— hardcoded. Verify manually before using in a thesis." />
        </Block>
      </div>

      {/* ── WORKFLOW ─────────────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>02 — WORKFLOW</div>
        <div style={S.h2}>The correct reading order</div>
        <p style={S.p}>
          Always start at the macro level and work down to the specific. Skipping to the trade section before
          reading the monetary policy context produces bad theses that look right on the surface.
        </p>
        <Step n="1" title="§1 MACRO CONTEXT — Read this first, every session">
          The risk environment banner (<Tag label="S1 RISK" color="var(--red)" />) tells you whether the market
          is in risk-on or risk-off. This single fact determines whether commodity currencies (AUD, NZD, CAD)
          are likely to outperform or underperform safe havens (JPY, CHF, USD) <em>regardless of their individual
          fundamentals</em>. If VIX is above 25 and the banner is red, do not buy commodity currencies — the
          macro context overrides the pair thesis. The CB Policy Groups panel shows which central banks are hiking
          vs cutting. The carry pair panel shows where funding costs are compressing fastest.
        </Step>
        <Step n="2" title="§2 MONETARY POLICY — Select a currency and read its CB stance">
          The benchmark rate, rate path projection, and CB speech analysis form the core of any FX thesis.
          The <span style={S.mono}>NEXT MEETING — MARKET PRICING</span> card is the most important field on
          this page: it shows what is already priced in. A hawkish CB means nothing if the market has already
          priced 3 hikes — only a fourth hike surprises. Read the OIS probability split. If a cut is 90%
          priced, the currency will only move on the <em>size</em> of the cut or the <em>language</em> after it,
          not on the cut itself.
        </Step>
        <Step n="3" title="§3 ECONOMIC TRIAD — Verify the CB stance is justified by data">
          Inflation → Growth → Employment. These three data blocks tell you whether the central bank is
          reacting to real pressure or lagging behind. A currency with rising CPI, stable unemployment, and
          positive GDP surprise index is fundamentally stronger than one where the CB is hiking into a
          weakening economy. The <span style={S.mono}>ECONOMIC SURPRISE INDEX</span> bar shows whether recent
          releases have beaten or missed consensus — a sustained negative surprise index = the CB will be
          forced to pivot dovish sooner than expected.
        </Step>
        <Step n="4" title="§4 EXTERNAL SECTOR — Check commodity exposure and trade partners">
          For commodity currencies (AUD, NZD, CAD), this section often overrides monetary policy.
          AUD can have the highest rate in G10 and still fall if iron ore collapses because China's PMI
          dropped. Know which commodity drives each currency and monitor the live commodity prices in §1.
          Trade partner concentration risk (CAD 76% to US, NZD 28% to China) amplifies single-event moves.
        </Step>
        <Step n="5" title="§5 CALENDAR — Know what is coming this week">
          Never hold a position through a high-impact event without sizing down unless the event is your
          catalyst. The calendar shows prior, consensus, and trigger levels. The <Tag label="HIGH" color="var(--red)" /> impact
          events are the ones that move currencies 50–150 pips in minutes. A consensus NFP miss of 50K
          is not the same as a 150K miss — read the trigger field, not just the event label.
        </Step>
        <Step n="6" title="§7 COT POSITIONING — Check for crowded trades">
          Crowded positioning (&gt;±60%) means the trade is consensus. Consensus trades are dangerous not
          because the thesis is wrong, but because the exit is crowded. When a crowded short gets squeezed
          (e.g. a surprise positive data print), the unwinding is violent and fast. CAD at -64% net short
          means any tariff delay or BoC hold triggers a squeeze, not just a mild bounce. Use this to size
          smaller on crowded trades and set stops further out to survive the squeeze.
        </Step>
        <Step n="7" title="§8 TRADE IDEAS — Review the divergence matrix and pair thesis">
          The divergence matrix ranks all G10 pairs by the spread between their fundamental scores.
          A large spread = large divergence = higher-conviction thesis. Click any pair to see the full
          thesis card: direction, entry zone, target, stop, catalyst, and risk factors. The AI brief
          layer refreshes these with current CB language and geopolitical context. If the AI brief
          hasn't run (cached &gt;24h), the static fallback is shown — verify catalysts are current
          before using.
        </Step>
        <Step n="8" title="§10 EXECUTION — Size the position before placing it">
          Enter your account size, risk percentage (recommended 1–2% per trade), and stop loss in pips.
          The calculator outputs lot size, position value, and whether your stop is wide enough relative
          to the 14-day ATR. A stop inside the ATR is not a risk level — it is the daily noise range.
          The pre-trade checklist forces you to confirm macro context, direction, event risk, and
          correlation before committing.
        </Step>
      </div>

      {/* ── LIVE DATA ────────────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>03 — LIVE DATA SOURCES</div>
        <div style={S.h2}>What updates automatically and what doesn't</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'BENCHMARK RATES', src: 'global-rates.com', freq: 'Weekly + on push', col: 'var(--teal)' },
            { label: 'COT POSITIONING', src: 'CFTC Socrata API', freq: 'Every Friday 3:30pm ET', col: 'var(--teal)' },
            { label: 'TREASURY YIELDS', src: 'fiscaldata.treasury.gov', freq: 'Daily (session open)', col: 'var(--teal)' },
            { label: 'FX SPOT / MARKETS', src: 'Yahoo Finance proxy', freq: 'On page load', col: 'var(--teal)' },
            { label: '14-DAY ATR', src: 'Yahoo Finance (OHLC)', freq: 'Weekly via Actions', col: 'var(--teal)' },
            { label: 'ECONOMIC CALENDAR', src: 'ForexFactory RSS', freq: 'On page load', col: 'var(--teal)' },
            { label: 'NEWS FEED', src: 'FX Street / Reuters RSS', freq: 'On page load', col: 'var(--teal)' },
            { label: 'AI CURRENCY BRIEFS', src: 'Anthropic claude-sonnet + web search', freq: '24h cache, refreshable', col: 'var(--gold)' },
            { label: 'TRIAD DATA (CPI/GDP/EMP)', src: 'Manual — §11 Update Assistant', freq: 'Monthly (after release)', col: 'var(--red)' },
            { label: 'CB SPEECHES', src: 'Manual — §11 Update Assistant', freq: 'After each CB meeting', col: 'var(--red)' },
          ].map(({ label, src, freq, col }) => (
            <div key={label} style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', padding: '0.75rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: col, letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink)', marginBottom: '0.15rem' }}>{src}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#555' }}>{freq}</div>
            </div>
          ))}
        </div>

        <Block label="KEEPING TRIAD DATA CURRENT">
          <p style={{ ...S.p, marginBottom: 0 }}>
            After each major data release (CPI, GDP, employment), open <Tag label="§11 UPDATE ASSISTANT" color="var(--gold)" />,
            select <span style={S.mono}>DATA RELEASE</span> mode, paste the headline numbers into the prompt,
            and click Generate. The assistant produces a formatted data block you paste directly into
            <span style={S.mono}> currencies.js</span>. Takes 2 minutes. Without this, the triad section
            shows stale numbers — the AI brief will still give current context, but the bar charts will be wrong.
          </p>
        </Block>
      </div>

      {/* ── AI BRIEF ─────────────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>04 — AI BRIEF SYSTEM</div>
        <div style={S.h2}>What the AI layer does and its limits</div>
        <p style={S.p}>
          Each currency has an AI brief that runs on first load and caches for 24 hours. It uses web search
          to pull the latest CB speeches, rate decisions, geopolitical developments, and pair context,
          then surfaces this in §2 (speeches), §6 (geopolitical), §7 (COT commentary), and §8 (pair thesis).
          The <Tag label="⚡ AI" color="var(--teal)" /> badge shows when AI-generated content is active.
          The <Tag label="CACHED" color="var(--gold)" /> badge with a timestamp shows the last refresh time.
        </p>
        <p style={S.p}>
          Hit <span style={S.mono}>↺ REFRESH</span> to force a new brief for the current currency. Do this after a
          CB meeting or a major data release that changes the narrative. The AI brief costs one API call per
          refresh — the 24h cache prevents wasteful repeated calls.
        </p>
        <Block label="WHAT THE AI CANNOT DO">
          <p style={{ ...S.p, marginBottom: '0.4rem' }}>
            <span style={S.warn}>It cannot predict price.</span> It summarises current macro narrative from live sources.
            A good AI brief confirms whether your thesis is consistent with current market language —
            it does not generate the thesis for you.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            <span style={S.warn}>If the AI brief fails or is stale,</span> static fallback data is shown.
            Static catalysts may reference past events. Always check the date on the catalyst field in §8
            before executing.
          </p>
        </Block>
      </div>

      {/* ── SETTINGS ─────────────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>05 — SETTINGS</div>
        <div style={S.h2}>Customising the dashboard</div>
        <p style={S.p}>
          Click the <span style={S.mono}>⚙</span> icon in the top-right to open Settings. Here you can manually
          override any CB benchmark rate if the automated scraper falls behind after an unscheduled emergency
          decision. Manual overrides display with a <Tag label="MANUAL OVERRIDE" color="var(--gold)" /> badge.
          You can also trigger a full data refresh from this panel. The GitHub Actions automation runs weekly
          on Saturday — if a CB meets mid-week, use the manual override until the next automated run.
        </p>
      </div>

      {/* ── COMMON MISTAKES ──────────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>06 — COMMON MISTAKES</div>
        <div style={S.h2}>How analysts misuse macro dashboards</div>
        {[
          ['Trading the dashboard, not the chart', 'The dashboard tells you the direction bias. Price action and technical levels tell you the entry. A strong macro thesis with a poor entry is still a losing trade. Use the thesis to filter setups — not to skip technical analysis.'],
          ['Ignoring crowded positioning', 'A fundamentally correct thesis can lose money for weeks while a crowded position unwinds in the opposite direction. Check §7 COT before sizing. If the trade is consensus, reduce size by 50%.'],
          ['Treating the AI brief as fact', 'The AI brief is a synthesis of current narrative. It can misquote CB speakers, misread indirect sources, or reflect a stale cache. Cross-check any critical data point directly with the source before risking capital.'],
          ['Using stale catalysts', 'If the AI brief has not been refreshed and you are reading the static fallback in §8, the catalyst dates may be in the past. A thesis built on "RBNZ meeting next Wednesday" when that meeting already happened two weeks ago is not a thesis — it is a stale note.'],
          ['Forgetting correlation', 'AUD/USD and NZD/USD have 0.82 correlation. Trading both long simultaneously is not two positions — it is one concentrated China-risk position in two FX pairs. The §10 Execution checklist has a correlation check. Use it.'],
          ['Ignoring the macro overlay', 'If the §1 risk banner shows elevated VIX and active geopolitical alerts, the macro environment dominates individual pair fundamentals. A bullish AUD thesis based on the RBA hiking cycle becomes irrelevant the moment risk-off accelerates — AUD will sell off as a commodity proxy regardless of interest rates.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>⚠ {title}</div>
            <div style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.7, paddingLeft: '1.25rem', borderLeft: '2px solid var(--rule)' }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
