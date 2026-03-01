// ── GuideView.jsx — How Each Dashboard Section Builds a Trade Thesis ─

const S = {
  page:  { maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' },
  h1:    { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '0.18em', marginBottom: '0.5rem' },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', color: 'var(--ink)', lineHeight: 1.2, marginBottom: '0.4rem' },
  sub:   { fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '3rem', lineHeight: 1.6 },
  sec:   { marginBottom: '2.5rem', borderTop: '1px solid var(--rule)', paddingTop: '1.5rem' },
  secH:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.18em', marginBottom: '0.75rem' },
  h2:    { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--ink)', marginBottom: '1rem' },
  p:     { fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: '0.85rem' },
  rule:  { color: 'var(--ink)', fontWeight: 500 },
  mono:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--teal)' },
  warn:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--red)' },
  gold:  { color: 'var(--gold)' },
};

function Block({ label, color = 'var(--gold)', children }) {
  return (
    <div style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', borderLeft: `3px solid ${color}`, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      {label && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color, letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function SubHead({ label }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--ink)', letterSpacing: '0.06em', marginTop: '1.25rem', marginBottom: '0.4rem' }}>
      {label}
    </div>
  );
}

function PairBox({ label, children }) {
  return (
    <div style={{ background: 'var(--paper3)', border: '1px solid var(--rule2)', padding: '0.75rem 1rem', marginBottom: '0.6rem' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--teal)', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
        FOR PAIR SELECTION — {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function FlowRow({ items, color = 'var(--teal)' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem', margin: '0.6rem 0 0.9rem' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color, background: color + '12', border: `1px solid ${color}44`, padding: '0.15rem 0.5rem' }}>
            {item}
          </span>
          {i < items.length - 1 && <span style={{ color: '#333', fontSize: '0.75rem' }}>→</span>}
        </span>
      ))}
    </div>
  );
}

// ── Section component ──────────────────────────────────────────────
function Sec({ num, label, title, children }) {
  return (
    <div style={S.sec}>
      <div style={S.secH}>{num} — {label}</div>
      <div style={S.h2}>{title}</div>
      {children}
    </div>
  );
}

export function GuideView() {
  return (
    <div style={S.page}>
      <div style={S.h1}>DASHBOARD GUIDE</div>
      <div style={S.title}>How Each Section Builds a Trade Thesis</div>
      <div style={S.sub}>
        A trade thesis answers three questions precisely: why one currency should appreciate relative
        to another, what specific event will trigger the move, and at what price the thesis fails.
        Every section of the dashboard feeds one or more of those three questions. The sections are
        not independent — they are a sequence of filters, each narrowing the field of viable trades.
      </div>

      {/* ── §1 MACRO CONTEXT ─────────────────────────────────── */}
      <Sec num="§1" label="MACRO CONTEXT" title="The environment before the pair">
        <p style={S.p}>
          The macro environment is the tide. Individual currency fundamentals are boats. A strongly
          bullish AUD thesis built on the RBA hiking cycle will lose money if the macro environment
          flips risk-off — AUD sells off as a commodity proxy regardless of interest rates when VIX
          spikes and global growth fears accelerate. §1 tells you whether the tide is with you or
          against you before you look at anything specific.
        </p>

        <SubHead label="RISK ENVIRONMENT BANNER" />
        <p style={S.p}>
          Aggregates VIX, DXY direction, gold, and copper into a single risk-on / risk-off / neutral
          signal. If VIX is above 25 and the banner is red, safe havens (JPY, CHF, USD) are being bid
          regardless of their domestic fundamentals — you short commodity currencies not because of
          their individual CB stance, but because the macro environment is doing the work. In risk-on,
          carry trades and commodity currencies outperform because global flows reward yield-seeking.
        </p>
        <PairBox label="RISK ENVIRONMENT">
          §1 immediately eliminates entire classes of trades. In risk-off, do not go long AUD, NZD, or
          CAD against JPY or CHF regardless of what §2–§7 show. The risk environment defines the universe
          of macro-consistent trades before you have read a single CB rate.
        </PairBox>

        <SubHead label="CB POLICY GROUPS" />
        <p style={S.p}>
          Classifies every G10 central bank into Hiking / On Hold / Cutting Slowly / Cutting
          Aggressively. This is not detailed enough to build a thesis from — that is §2's job — but it
          gives you the directional matrix at a glance. The pairs with the highest-conviction thesis
          always sit at opposite ends of this spectrum. AUD/NZD (Hiking vs Cutting Aggressively) is
          a stronger structural thesis than EUR/GBP (both Cutting Slowly) because the divergence is
          more extreme and more durable.
        </p>

        <SubHead label="CARRY PAIR SPREADS" />
        <p style={S.p}>
          Shows which pairs have the widest interest rate differential — the pairs where the cost of
          being wrong is lower (you collect carry while waiting) and where positioning is most active.
          A compressing carry spread is a warning: the trade is losing its income advantage and will
          face positioning unwind pressure as carry traders exit.
        </p>
      </Sec>

      {/* ── §2 MONETARY POLICY ───────────────────────────────── */}
      <Sec num="§2" label="MONETARY POLICY" title="The primary driver of sustained FX moves">
        <p style={S.p}>
          Monetary policy divergence is the single most reliable driver of sustained G10 FX moves.
          Capital flows toward yield — a currency with a central bank hiking or holding at restrictive
          levels attracts capital because investors earn more holding it. This is a structural flow
          that lasts weeks to months as long as the rate differential is widening.
        </p>

        <SubHead label="BENCHMARK RATE AND RATE PATH" />
        <p style={S.p}>
          A static rate means nothing in isolation — what matters is the trajectory. A currency at
          3.85% expected to hike again in May is structurally stronger than one at 4.00% expected to
          cut to 3.25% by year-end, even though the latter has a higher rate today. You are trading
          the direction of the path, not the current level.
        </p>
        <PairBox label="RATE PATH COMPARISON">
          Compare rate paths for both currencies in a candidate pair. If both slope downward at the
          same gradient, there is no monetary policy divergence — not a thesis candidate. If one slopes
          up and one slopes down, you have a widening differential and a directional force. The steeper
          the divergence, the more persistent the move.
        </PairBox>

        <SubHead label="NEXT MEETING — OIS MARKET PRICING" />
        <p style={S.p}>
          This is the most important single field in the entire dashboard for timing. OIS pricing
          represents what the market has already priced in for the next CB decision. A central bank
          hiking rates is only a positive surprise for its currency if the hike was not fully priced.
          The currency moves on the <span style={S.rule}>delta between what happened and what was
          priced</span> — not on what happened in absolute terms.
        </p>
        <Block label="READING OIS PROBABILITY" color="var(--teal)">
          <p style={{ ...S.p, marginBottom: '0.4rem' }}>
            A cut at 64% probability means 36% probability of a hold — a hold would be a significant
            surprise and trigger a violent short squeeze. A hike at 92% probability means the hike is
            priced in — the thesis needs to be about what comes <em>after</em> the hike, not the hike itself.
          </p>
          <p style={{ ...S.p, marginBottom: 0 }}>
            Read OIS pricing for <span style={S.rule}>both currencies</span> in the candidate pair.
            The asymmetry lies where one currency has a high-probability event already priced while the
            other has a genuinely uncertain outcome — that is where the surprise potential concentrates.
          </p>
        </Block>

        <SubHead label="CURRENT ACCOUNT" />
        <p style={S.p}>
          Shows whether the country runs a structural surplus or deficit. Japan's +3.9% surplus means
          a constant structural bid for JPY from export repatriation. New Zealand's -6.7% deficit means
          NZD requires constant external financing — in stress events this financing dries up and the
          currency is vulnerable. This does not create short-term catalysts but explains why certain
          currencies always recover (JPY, CHF) and why others are permanently fragile under pressure
          (NZD, AUD to a lesser extent).
        </p>
        <PairBox label="STRUCTURAL FLOW ALIGNMENT">
          A surplus currency vs deficit currency trade has the structural flow on your side — a
          lower-friction hold. The current account is the slow-moving force that determines long-term
          valuation; the rate differential is the short-term driver. When both point the same direction,
          the trade has multiple reinforcing layers.
        </PairBox>

        <SubHead label="CB SPEECHES" />
        <p style={S.p}>
          A central banker does not accidentally say "we are not on a pre-set path" — that is a
          deliberate signal that the next meeting is live in both directions. The implication field
          contains the market's working interpretation of the current stance. When the AI brief is
          live, speeches are updated with the most recent language including between-meeting comments.
          This is what you use when writing the thesis narrative.
        </p>
      </Sec>

      {/* ── §3 ECONOMIC TRIAD ────────────────────────────────── */}
      <Sec num="§3" label="ECONOMIC TRIAD" title="Whether the CB stance is justified and durable">
        <p style={S.p}>
          The CB's monetary policy stance (§2) is a reaction to economic data. The triad tells you
          whether the stance is justified by the data and whether it is likely to change. If the CB
          is hawkish but inflation is falling and GDP is contracting, the hawkish stance is
          unsustainable — the market will eventually force a pivot and the currency will reprice.
        </p>

        <SubHead label="INFLATION (CPI, CORE, PPI)" />
        <p style={S.p}>
          Above-target inflation gives a CB cover to hike or hold at restrictive levels. Below-target
          inflation forces cuts. The <span style={S.rule}>direction</span> is as important as the level
          — a CPI at 3.2% and rising is more bullish for the currency than one at 3.5% and falling,
          because the former implies the CB cannot cut soon while the latter implies it will cut sooner
          than expected. PPI leads CPI by 1–2 months — a rising PPI when CPI appears stable is an early
          warning of re-acceleration.
        </p>
        <PairBox label="INFLATION TRAJECTORY COMPARISON">
          Compare inflation trajectory between the two currencies. The one with more persistent
          above-target inflation has a CB more constrained from cutting — that currency is more
          defensible as the long side of the trade.
        </PairBox>

        <SubHead label="GROWTH (GDP, PMI, RETAIL SALES)" />
        <p style={S.p}>
          Growth data tells you whether the CB has headroom to maintain its policy stance. A hiking
          CB facing a contracting economy cannot hike indefinitely — growth weakness is the constraint
          that forces premature pivots. PMI is particularly useful because it is monthly and
          forward-looking; it shows directional change before the GDP print confirms it. Composite
          PMI above 50 = expansion; below 50 = contraction.
        </p>
        <PairBox label="GROWTH AS LEADING INDICATOR">
          Growth divergence is a leading indicator of future monetary policy divergence. If Currency A
          has GDP accelerating and Currency B is contracting, the CB for A will hike (or hold) while
          the CB for B will cut — even if rates are currently similar. Trading this divergence early,
          before the CB acts, is how you get the best risk/reward on thesis trades.
        </PairBox>

        <SubHead label="EMPLOYMENT (UNEMPLOYMENT, PARTICIPATION, WAGES)" />
        <p style={S.p}>
          Unemployment is the lagging indicator — it confirms a trend that growth already signalled.
          <span style={S.rule}> Wage growth</span> is the crucial link: tight labour markets → wage
          pressure → services inflation → CB constrained from cutting. This is exactly why BoE cannot
          cut quickly despite cutting rates — services CPI at 5.0% is directly driven by wage growth
          at 5.6%. Unemployment alone is insufficient; wages tell you whether the labour market is
          generating inflationary pressure.
        </p>
        <PairBox label="WAGES AS HIDDEN INFLATION INDICATOR">
          A currency with strong wages and tight unemployment has a central bank that will be
          constrained from easing longer than the market expects. This is systematically mispriced
          because markets focus on headline unemployment rather than the wage-services-CPI transmission.
        </PairBox>

        <SubHead label="ECONOMIC SURPRISE INDEX" />
        <p style={S.p}>
          Summarises whether recent releases have beaten (+) or missed (−) market consensus
          cumulatively — not a single data point but the trend. A strongly negative surprise index
          (EUR at -22) means analysts are consistently wrong to the bullish side, and the CB will
          be forced to ease more aggressively than its guidance suggests. A strongly positive index
          means the CB will be forced to stay tighter longer.
        </p>
        <PairBox label="PREDICTING CB PIVOTS BEFORE THEY HAPPEN">
          The surprise index predicts CB pivots before they happen. A pair where one currency has
          a strongly positive surprise index and the other has a strongly negative one is the
          highest-conviction fundamental trade — you are aligned with the direction of future policy
          adjustment, not just current policy.
        </PairBox>
      </Sec>

      {/* ── §4 EXTERNAL SECTOR ───────────────────────────────── */}
      <Sec num="§4" label="EXTERNAL SECTOR" title="For commodity currencies, this often overrides monetary policy">
        <p style={S.p}>
          For commodity currencies — AUD, NZD, CAD — the external sector often overrides monetary
          policy as the primary short-term driver. AUD can have the highest interest rate in G10 and
          still fall if iron ore prices collapse, because 31% of Australian exports go to China and
          the commodity price IS the export revenue.
        </p>

        <SubHead label="TRADE PARTNERS" />
        <p style={S.p}>
          Shows single-point-of-failure concentration risk. CAD has 76% of exports going to the US
          — a tariff threat is not a marginal risk, it is an existential threat. NZD has 28% going
          to China dominated by dairy — weak Chinese consumer spending directly reduces GDT auction
          prices and NZD follows within days. USD has diversified partners with no single country
          above 18% — structurally less sensitive to bilateral disruptions.
        </p>
        <PairBox label="CONCENTRATED TRADE DEPENDENCY AS CATALYST AMPLIFIER">
          When constructing a pair, identify each currency's concentrated trade dependency and whether
          any upcoming event touches it. A USD/CAD long thesis becomes exponentially more powerful
          when the US-Canada tariff story is active — it adds a specific, concentrated catalyst on top
          of the monetary policy divergence.
        </PairBox>

        <SubHead label="COMMODITY EXPOSURE" />
        <p style={S.p}>
          Shows which commodities the currency is most sensitive to and their current direction. Two
          currencies can have similar CB stances but opposite commodity exposures, creating a
          non-monetary divergence. AUD is an iron ore and LNG currency; NZD is dairy and lamb. In
          a scenario where iron ore rises but dairy falls, AUD outperforms NZD on the pure commodity
          channel — this is why AUD/NZD moves even when both CBs are on the same path.
        </p>
        <PairBox label="COMMODITY CHANNEL AS CONFIRMATION OR CONTRADICTION">
          For any pair involving a commodity currency, the commodity section is the cross-check that
          confirms or contradicts the monetary policy thesis. A thesis where monetary policy and
          commodity exposure both point the same direction is significantly stronger than one where
          they diverge. If you are long AUD based on RBA hiking but iron ore is in a confirmed
          downtrend, the commodity headwind can overwhelm the rate advantage.
        </PairBox>
      </Sec>

      {/* ── §5 CALENDAR ──────────────────────────────────────── */}
      <Sec num="§5" label="ECONOMIC CALENDAR" title="When the market is forced to look at the data">
        <p style={S.p}>
          Macro thesis provides direction; the calendar provides timing. A structurally correct thesis
          needs a catalyst — a specific event that forces the market to reprice the currency. Without
          a near-term catalyst, a thesis can be directionally right for months but lose money to time
          decay, adverse carry, and random volatility before the market catches up.
        </p>

        <SubHead label="HIGH-IMPACT EVENTS" />
        <p style={S.p}>
          CB rate decisions, NFP, CPI, GDP — these move currencies 50–200 pips in minutes. They are
          binary events: the currency moves sharply immediately after the release and does not give
          you time to enter after the fact. You need to be positioned before the event or not at all.
        </p>

        <SubHead label="THE TRIGGER FIELD" />
        <p style={S.p}>
          The most analytically important field in the calendar. It is not enough to know that NFP is
          on Friday — you need to know what specific reading changes the thesis: "NFP below 100K = Fed
          cuts sooner = USD selloff. NFP above 200K = Fed holds = USD bid." These are not symmetric;
          a 50K miss has a different magnitude than a 150K miss. The trigger field gives you the
          asymmetry analysis before the event.
        </p>
        <PairBox label="STACKING CATALYSTS FOR MAXIMUM TIMING PRECISION">
          When you have identified a candidate pair from §1–§4, the calendar tells you when both CBs
          meet and when major data releases occur for both currencies. The highest-conviction entry
          window is when both catalysts are stacked in your favour in the same week — ECB cutting
          Thursday and BoE holding the following Thursday creates a two-week window of maximum
          GBP/EUR divergence. Position before the first event, not after both.
        </PairBox>

        <SubHead label="EVENT RISK MANAGEMENT" />
        <p style={S.p}>
          The calendar also tells you when to reduce size. If three simultaneous high-impact events
          fall in the same week for your pair, the position faces event risk from multiple directions.
          This is not a reason to exit the thesis — but it is a reason to halve position size until
          the events resolve.
        </p>
      </Sec>

      {/* ── §6 GEOPOLITICAL ──────────────────────────────────── */}
      <Sec num="§6" label="GEOPOLITICAL" title="Discontinuous shocks that repricing misses">
        <p style={S.p}>
          Geopolitical events are not priced into fundamental models — they are discontinuous shocks.
          They create two types of FX impact: <span style={S.rule}>safe-haven flows</span> (JPY, CHF,
          USD bid in any global crisis regardless of fundamentals) and{' '}
          <span style={S.rule}>currency-specific shocks</span> (CAD impacted by US tariffs, NZD by
          China slowdown, AUD by iron ore demand). §6 tracks which specific risks are live and how
          they transmit to currency price.
        </p>

        <SubHead label="TRANSMISSION MECHANISM" />
        <p style={S.p}>
          "Tariffs are bad for CAD" is not actionable. "25% US tariffs on Canadian goods → 76% of
          Canadian exports at risk → BoC emergency cuts to 1.75% → rate differential with USD widens
          to 200bp → USD/CAD moves to 1.48–1.50" is a causal chain that gives you a thesis, a target,
          and a timeline. The analysis field in each geopolitical entry contains this chain.
        </p>
        <PairBox label="ASYMMETRIC PAIR OPPORTUNITIES">
          Geopolitical events create asymmetric pair opportunities. A risk that specifically hurts
          Currency A but is neutral for Currency B creates a pair trade where A falls and B stays flat
          — an easier trade than one where both move in opposite directions. The ideal configuration:
          the event is Currency A's specific risk (CAD tariffs, NZD China dairy) and Currency B is a
          safe haven that benefits from the same risk-off impulse (USD, CHF) — double catalyst on
          the same pair.
        </PairBox>
      </Sec>

      {/* ── §7 COT POSITIONING ───────────────────────────────── */}
      <Sec num="§7" label="COT POSITIONING" title="How much of the trade the market already owns">
        <p style={S.p}>
          Positioning data tells you not whether a thesis is right, but how much of the market already
          agrees with it and how violent the reversal will be if it is wrong. A currency at -64% net
          short (CAD) is a crowded short — everyone who wants to be short is already short. Any
          positive surprise triggers a violent short squeeze because everyone rushes to cover
          simultaneously, and the expected profit from a new short is limited because most of the
          move has already happened.
        </p>

        <SubHead label="NET POSITIONING AS % OF OPEN INTEREST" />
        <p style={S.p}>
          The scale: ±15% = light, ±30% = moderate, ±45% = heavy, ±60% = extreme/crowded. Extreme
          positioning in either direction is a contrarian risk warning — it does not mean the thesis
          is wrong, but it means the position is fragile to any surprise.
        </p>

        <SubHead label="WEEK-ON-WEEK CHANGE" />
        <p style={S.p}>
          More useful than the absolute level for timing. A position moving from -40% to -60% over
          three weeks is momentum positioning — the market is building consensus short. This confirms
          the thesis direction but warns you are late. A position reversing from -60% to -40% (covering)
          signals smart money is taking profits or a narrative shift is underway — early warning of a
          coming squeeze.
        </p>
        <PairBox label="ASYMMETRIC SQUEEZE CONFIGURATION">
          If you are long Currency A (speculators flat) against short Currency B (speculators -60%
          net short), your position has asymmetric squeeze protection. If the thesis plays out
          normally, you profit from A appreciating. If a surprise hits, B's short covering amplifies
          your gains because the B side is being squeezed at the same time. This is the most
          favourable positioning configuration for a new trade.
        </PairBox>
        <Block label="WHAT EXTREME POSITIONING MEANS IN PRACTICE" color="var(--red)">
          <p style={{ ...S.p, marginBottom: 0 }}>
            Going long Currency A where speculators are already +55% net long is dangerous — the
            crowd is already with you, so there is limited upside from new positioning accumulation,
            and any negative surprise triggers a rapid unwind directly against your position. The
            ideal trade is where the fundamental thesis is strongest and the positioning is lightest
            — maximum room for the crowd to agree with you from here.
          </p>
        </Block>
      </Sec>

      {/* ── §8 TRADE IDEAS ───────────────────────────────────── */}
      <Sec num="§8" label="TRADE IDEAS" title="Where the analysis from §1–§7 is synthesised">
        <p style={S.p}>
          The divergence score for each currency is a weighted composite of its monetary policy,
          growth, inflation, risk, and commodity dimensions. The matrix ranks every possible G10 pair
          by the spread between the two currencies' scores — a large spread means large divergence,
          which means a stronger directional force.
        </p>

        <SubHead label="DIVERGENCE MATRIX" />
        <p style={S.p}>
          Answers the question: given all the fundamentals, which pair has the strongest argument for
          a directional move? A pair with a score spread of 33 (USD +16 vs NZD -17) has a dramatically
          stronger fundamental case than a pair with a spread of 5 (GBP +2 vs CHF -1). The matrix
          forces cross-universe comparison rather than falling in love with a single thesis.
        </p>
        <PairBox label="MATRIX AS CANDIDATE FILTER">
          Rather than analysing all 36 possible G10 pairs individually, the matrix surfaces the
          top-ranked pairs by divergence score. Your job is then to cross-check the candidate against
          macro environment (§1), event calendar (§5), and positioning (§7) to confirm or identify
          structural problems. The matrix identifies candidates; the other sections validate them.
        </PairBox>

        <SubHead label="PAIR THESIS CARDS" />
        <p style={S.p}>
          Each card answers all six thesis questions: direction, narrative, causal chain, catalyst,
          entry/target/stop, and risk factors. The <span style={S.rule}>causal chain</span> is the
          most important field — it maps the specific sequence from current macro reality to expected
          price move, making every assumption explicit. Each link in the chain is a potential
          invalidation point. If any link breaks, you know immediately whether the thesis has failed.
        </p>

        <SubHead label="AI BRIEF LAYER" />
        <p style={S.p}>
          When live, the AI brief refreshes thesis cards with current CB language, recent speeches,
          and updated geopolitical context. The <span style={S.mono}>⚡ AI</span> badge confirms the
          content is current. If the brief is stale or unavailable, the static fallback is shown —
          always check the catalyst date field before using a static card, as catalysts may reference
          past events.
        </p>
      </Sec>

      {/* ── §9 AI ANALYST ────────────────────────────────────── */}
      <Sec num="§9" label="AI ANALYST" title="Stress-testing assumptions against current data">
        <p style={S.p}>
          A Q&amp;A interface that answers natural language questions using the current dashboard data
          as context — triad readings, CB speeches, COT numbers, market data. The most useful
          application is testing a thesis against scenarios you have not considered.
        </p>
        <p style={S.p}>
          After writing your thesis narrative, describe it to the AI analyst and ask what would
          invalidate it. The answer will surface implicit assumptions that should either be stated
          as risk factors in your thesis or should cause you to revise it entirely.
        </p>
        <Block label="LIMITATION" color="var(--red)">
          <p style={{ ...S.p, marginBottom: 0 }}>
            The AI analyst is only as good as the data it receives as context. It reasons from the
            triad and CB speech data in currencies.js — if that data is stale, the AI's answers are
            grounded in outdated facts. Use it after a data refresh via §11, not as a substitute for
            checking whether the underlying data is current.
          </p>
        </Block>
      </Sec>

      {/* ── §10 EXECUTION ────────────────────────────────────── */}
      <Sec num="§10" label="EXECUTION" title="Converting a thesis into a correctly sized position">
        <p style={S.p}>
          Having a correct thesis and executing it incorrectly are two different ways to lose money.
          §10 ensures position size is appropriate for account risk tolerance and that the stop is
          wide enough to survive normal daily volatility before the thesis plays out.
        </p>

        <SubHead label="ATR REFERENCE TABLE" />
        <p style={S.p}>
          Shows the average daily range for each major pair over the last 14 trading days. A stop loss
          set inside the ATR is a guarantee of being stopped out by normal intraday noise — the market
          will hit the stop as a matter of statistical routine, before the thesis has had time to
          develop. The standard minimum is <span style={S.rule}>1.25× ATR</span> from entry. If the
          distance from entry to the level that invalidates the thesis is less than 1.25× ATR, the
          entry point is wrong — find a better entry or accept the risk/reward does not work at
          current volatility.
        </p>

        <SubHead label="POSITION SIZER" />
        <p style={S.p}>
          Enter account size, risk percentage (1–2% recommended), and stop loss in pips. The calculator
          outputs lot size, position value, and whether the stop is adequate relative to ATR. The
          pre-trade checklist enforces the seven-point thesis filter before execution — macro aligned,
          direction confirmed, catalyst identified, size within limit, stop adequate, correlation clean.
        </p>
        <PairBox label="CORRELATION CHECK">
          AUD/USD and NZD/USD have 0.82 correlation — running both simultaneously is not two
          positions, it is one concentrated China-risk position at double the exposure. The correlation
          warnings table in §10 lists specific high-correlation combinations to avoid stacking.
        </PairBox>
      </Sec>

      {/* ── §11 UPDATE ASSISTANT ─────────────────────────────── */}
      <Sec num="§11" label="UPDATE ASSISTANT" title="Keeping the static data layer honest">
        <p style={S.p}>
          The live data layer (rates, yields, COT, markets) updates automatically. Triad data and CB
          speeches require human judgement to interpret and update. Without §11, a CPI print that
          changes the inflation trajectory for a currency leaves the dashboard showing stale numbers,
          and the divergence scores that drive the §8 matrix are wrong.
        </p>
        <Block label="WHY THIS MATTERS FOR THESIS ACCURACY" color="var(--gold)">
          <p style={{ ...S.p, marginBottom: 0 }}>
            The divergence score in §8 that identifies AUD as a strong long is only correct because
            the inflation and monetary score for AUD were updated to reflect the February hike. Before
            that update, the dashboard incorrectly showed AUD as bearish. Every thesis built on the
            divergence matrix is only as accurate as the last §11 update — this is the human
            maintenance step that keeps the machine honest.
          </p>
        </Block>
      </Sec>

      {/* ── §12 NEWS FEED ────────────────────────────────────── */}
      <Sec num="§12" label="NEWS FEED" title="Monitoring whether the thesis narrative is stable">
        <p style={S.p}>
          News flow is the real-time layer above the analytical framework. A thesis that is
          structurally correct can be momentarily disrupted by a headline — a surprise CB speech, an
          unexpected geopolitical development, a breaking data release. The news feed lets you monitor
          whether the narrative supporting your thesis is stable or whether something has shifted.
        </p>
        <p style={S.p}>
          This is not where theses are built — they are built from §1–§8. It is where you monitor
          whether a live thesis is being threatened by an emerging story. A news item about 25% tariffs
          on Canadian goods does not invalidate a USD/CAD long thesis; it amplifies it. A news item
          about the RBA governor signalling a pause puts the AUD/NZD long thesis under immediate review.
        </p>
      </Sec>

      {/* ── HOW SECTIONS WORK TOGETHER ───────────────────────── */}
      <div style={{ ...S.sec, borderTop: '2px solid var(--rule)' }}>
        <div style={S.secH}>SYNTHESIS — HOW THE SECTIONS WORK TOGETHER TO BUILD A PAIR</div>
        <div style={S.h2}>The sequential filter from macro to execution</div>
        <p style={S.p}>
          Each section narrows the set of viable trades. The workflow is cumulative — skipping steps
          produces theses that look correct but fail on dimensions you did not check.
        </p>
        <FlowRow
          items={['§1 Macro Environment', 'Eliminates macro-inconsistent directions']}
          color="var(--red)"
        />
        <FlowRow
          items={['§2 + §3 + §4 Fundamental Profile', 'Builds divergence score for each currency']}
          color="var(--gold)"
        />
        <FlowRow
          items={['§8 Divergence Matrix', 'Cross-compares all currencies, surfaces candidates']}
          color="var(--teal)"
        />
        <FlowRow
          items={['§7 COT Positioning', 'Filters crowded trades, identifies squeeze setups']}
          color="var(--teal)"
        />
        <FlowRow
          items={['§5 Calendar', 'Adds timing dimension and catalyst identification']}
          color="var(--teal)"
        />
        <FlowRow
          items={['§6 Geopolitical', 'Checks for amplifiers or invalidators on the specific pair']}
          color="var(--teal)"
        />
        <FlowRow
          items={['§10 Execution', 'Converts thesis into a sized position with ATR-valid stop']}
          color="var(--teal)"
        />
        <Block label="THE RESULT" color="var(--teal)">
          <p style={{ ...S.p, marginBottom: 0 }}>
            A trade that has passed seven independent analytical filters, each grounded in current
            data, each addressing a different dimension of risk. That is what distinguishes a thesis
            from an opinion — not that you believe a currency will appreciate, but that you can
            identify the specific mechanism, the specific catalyst, the specific price at which you
            are wrong, and the reason every alternative explanation has been considered and rejected.
          </p>
        </Block>
      </div>
    </div>
  );
}
