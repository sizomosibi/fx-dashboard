// ── ThesisView.jsx — How to Form a Trade Thesis ─────────────────────

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
  red:   { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--red)' },
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

function ChainRow({ items, color = 'var(--teal)' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem', margin: '0.5rem 0 1rem' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color, background: color + '12', border: `1px solid ${color}44`, padding: '0.15rem 0.5rem' }}>
            {item}
          </span>
          {i < items.length - 1 && <span style={{ color: '#333', fontSize: '0.75rem' }}>→</span>}
        </span>
      ))}
    </div>
  );
}

function Criterion({ n, label, question, good, bad }) {
  return (
    <div style={{ borderTop: '1px solid var(--rule2)', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--rule)', flexShrink: 0, paddingTop: '0.1rem' }}>{n}</span>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.2rem', letterSpacing: '0.04em' }}>{label}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>{question}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--teal)', lineHeight: 1.5 }}>✓ {good}</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--red)', lineHeight: 1.5 }}>✗ {bad}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePair({ pair, dir, score1, score2, ccy1, ccy2, thesis, chain, catalyst, entry, target, stop, risk1, risk2 }) {
  const isLong = dir === 'long';
  return (
    <div style={{ background: 'var(--paper2)', border: '1px solid var(--rule)', padding: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem', color: 'var(--ink)' }}>{pair}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: isLong ? 'var(--teal)' : 'var(--red)', border: `1px solid ${isLong ? 'var(--teal)' : 'var(--red)'}44`, padding: '0.15rem 0.5rem' }}>
          {dir.toUpperCase()}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#555' }}>
          {ccy1} score {score1 > 0 ? '+' : ''}{score1} vs {ccy2} score {score2 > 0 ? '+' : ''}{score2} = spread {Math.abs(score1 - score2)}
        </span>
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '0.75rem' }}>{thesis}</div>
      <ChainRow items={chain} color={isLong ? 'var(--teal)' : 'var(--red)'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[['CATALYST', catalyst], ['ENTRY', entry], ['TARGET', target], ['STOP', stop]].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--paper3)', padding: '0.5rem', border: '1px solid var(--rule2)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#555', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>{k}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.6 }}>
        <span style={{ color: 'var(--red)', marginRight: '0.4rem' }}>RISKS:</span>{risk1} &nbsp;·&nbsp; {risk2}
      </div>
    </div>
  );
}

export function ThesisView() {
  return (
    <div style={S.page}>
      <div style={S.h1}>TRADE THESIS FRAMEWORK</div>
      <div style={S.title}>How to Form a Trade Thesis</div>
      <div style={S.sub}>
        A thesis is a falsifiable directional argument with a defined catalyst, entry, target, and stop.
        Opinion is not a thesis. "I think USD is strong" is not a thesis. What follows is the construction method.
      </div>

      {/* ── WHAT A THESIS IS ─────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>01 — DEFINITION</div>
        <div style={S.h2}>What a valid trade thesis contains</div>
        <p style={S.p}>
          A trade thesis answers six questions precisely. If you cannot answer all six, the thesis is incomplete
          and should not be traded:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {[
            ['DIRECTION', 'Long or short which pair? Not a currency in isolation — a pair.'],
            ['REASON', 'What is the fundamental divergence between the two currencies?'],
            ['CATALYST', 'What specific event or data release triggers the move? When is it?'],
            ['ENTRY', 'At what price or price zone do you enter? Market order or limit?'],
            ['TARGET', 'At what price does the thesis play out? What is the expected move?'],
            ['INVALIDATION', 'At what price does the thesis fail? Where does your stop go?'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--paper2)', border: '1px solid var(--rule2)', padding: '0.75rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{k}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>
        <Block label="THE MINIMUM VIABLE THESIS — EXAMPLE" color="var(--teal)">
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            <span style={S.rule}>Long AUD/NZD.</span> RBA hiked to 3.85% on Feb 3 while RBNZ is cutting into a confirmed NZ recession — 160bp rate differential and widening. <span style={S.rule}>Catalyst:</span> RBNZ March 19 decision, expected 25bp cut. <span style={S.rule}>Entry:</span> 1.1080–1.1100 zone. <span style={S.rule}>Target:</span> 1.1350 (prior resistance). <span style={S.rule}>Stop:</span> 1.0880, below Jan low. <span style={S.rule}>Invalid if:</span> RBA minutes (Mar 18) show split vote or explicit pause guidance.
          </div>
        </Block>
      </div>

      {/* ── THE DIVERGENCE FRAMEWORK ─────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>02 — FINDING THE DIVERGENCE</div>
        <div style={S.h2}>The three types of FX divergence that produce tradeable moves</div>
        <p style={S.p}>
          FX rates are relative prices. A currency moves because of its fundamentals <em>relative to another</em>.
          The wider the divergence, the stronger the directional force. There are three divergences that
          consistently produce multi-week moves in G10 FX:
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            TYPE 1 — MONETARY POLICY DIVERGENCE
          </div>
          <div style={{ borderLeft: '2px solid var(--teal)', paddingLeft: '1rem', marginBottom: '0.5rem' }}>
            <p style={{ ...S.p, marginBottom: '0.4rem' }}>
              One central bank is hiking (or holding at restrictive levels) while the other is cutting.
              This is the single most reliable FX driver. The pair moves in the direction of the
              higher-rate currency because capital flows toward yield. The move is sustained as long as
              the rate differential is widening.
            </p>
            <ChainRow items={['CB A Hikes', 'Rate Differential Widens', 'Capital Flows to A', 'Currency A Appreciates']} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--ink)' }}>Where to look:</span> §2 Monetary Policy — rate path projections, CB bias, and OIS market pricing for both currencies.
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            TYPE 2 — GROWTH / INFLATION DIVERGENCE
          </div>
          <div style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1rem', marginBottom: '0.5rem' }}>
            <p style={{ ...S.p, marginBottom: '0.4rem' }}>
              One economy is accelerating (rising GDP, falling unemployment, above-target inflation)
              while the other is decelerating. This creates <em>future</em> monetary policy divergence even
              before the central bank has acted. Leading this with the triad data gives you a head start
              on the market.
            </p>
            <ChainRow items={['Economy A CPI Rising', 'CB A Forced to Hike', 'Rate Differential Widens', 'Currency A Appreciates']} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--ink)' }}>Where to look:</span> §3 Economic Triad — compare inflation trend, GDP direction, and surprise index between the two currencies.
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            TYPE 3 — RISK ENVIRONMENT DIVERGENCE
          </div>
          <div style={{ borderLeft: '2px solid var(--red)', paddingLeft: '1rem', marginBottom: '0.5rem' }}>
            <p style={{ ...S.p, marginBottom: '0.4rem' }}>
              One currency benefits from risk-off flows (JPY, CHF, USD) while the other suffers
              (AUD, NZD, CAD). This divergence is driven by global macro events — geopolitical shocks,
              recession fears, equity drawdowns — not individual CB policy. It overrides Type 1 and
              Type 2 divergences during stress events and must be monitored continuously via §1.
            </p>
            <ChainRow items={['VIX Spikes', 'Carry Trades Unwind', 'Risk Currencies Sold', 'Safe Havens Bid']} color="var(--red)" />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--ink)' }}>Where to look:</span> §1 Macro Context — VIX, DXY, risk banner, and the geopolitical alerts in §6.
          </div>
        </div>
      </div>

      {/* ── THE 7-POINT FILTER ───────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>03 — THE 7-POINT FILTER</div>
        <div style={S.h2}>Test every thesis against these criteria before sizing</div>
        <p style={S.p}>
          A thesis that passes all seven criteria is high-conviction. Three or fewer passes = do not trade.
          The criteria are ordered by importance — monetary policy is more persistent than news flow.
        </p>
        <Criterion
          n="01"
          label="MONETARY POLICY ALIGNMENT"
          question="Is the rate differential widening in your favour?"
          good="CB divergence is confirmed by OIS pricing — the market agrees the paths are diverging"
          bad="Rate differential is stable or compressing — both CBs on same path or converging"
        />
        <Criterion
          n="02"
          label="MACRO ENVIRONMENT"
          question="Is the risk environment consistent with your direction?"
          good="Risk-on for commodity currency longs; risk-off or neutral for safe-haven longs"
          bad="VIX above 25 and you are long a commodity currency — macro overrides the pair thesis"
        />
        <Criterion
          n="03"
          label="FUNDAMENTAL DIVERGENCE SCORE"
          question="Is the divergence score spread meaningful (>8 points on the matrix)?"
          good="Large spread — multiple dimensions (monetary, growth, inflation) all pointing same direction"
          bad="Narrow spread — only one dimension diverging; other factors neutral or opposed"
        />
        <Criterion
          n="04"
          label="CATALYST"
          question="Is there a specific, dated catalyst in the next 2–6 weeks?"
          good="Identified: CB meeting, CPI release, NFP — with a known date and a trigger level"
          bad="No near-term catalyst — thesis is theoretically correct but may take months to play out"
        />
        <Criterion
          n="05"
          label="POSITIONING"
          question="Is the COT position uncrowded (<±45% net)?"
          good="Light or neutral positioning — room for new participants to enter on your side"
          bad="Crowded in your direction (>±60%) — trade is consensus; squeeze risk is elevated"
        />
        <Criterion
          n="06"
          label="RISK/REWARD"
          question="Is the reward at least 2× the risk (stop size in pips)?"
          good="Target is 2–3× the distance from entry to stop — asymmetric payoff justifies the trade"
          bad="Target and stop are similar distance — a coin-flip with commission drag"
        />
        <Criterion
          n="07"
          label="CORRELATION"
          question="Are you adding this without duplicating an existing position?"
          good="No correlation >0.70 with existing open trades — genuine diversification"
          bad="Adding AUD/USD when already long NZD/USD — one China risk in two positions"
        />
      </div>

      {/* ── CONSTRUCTING THE CHAIN ───────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>04 — THE CAUSAL CHAIN</div>
        <div style={S.h2}>Building the logic chain that connects data to price</div>
        <p style={S.p}>
          Every valid thesis has an explicit causal chain: a sequence of <span style={S.rule}>if X, then Y</span> statements
          that connects an observable event to a currency move. If you cannot write the chain, the thesis
          is intuition, not analysis. The chain forces you to identify where it can break — each link is
          a potential invalidation point.
        </p>
        <p style={S.p}>
          The chains in §8 Trade Ideas use this format. When building your own, write each step as a
          market fact rather than a prediction. "BoJ hikes" is a market event. "JPY strengthens" is a
          market response. The mechanism connecting them (carry unwind, yield differential shift) should
          be explicit.
        </p>
        <Block label="CHAIN CONSTRUCTION — USD/JPY SHORT" color="var(--red)">
          <ChainRow items={['Shunto Wages 4.8%+', 'BoJ Hikes Mid-2026', 'JPY Carry Positions Unwind', 'USD/JPY Falls 6–8%']} color="var(--teal)" />
          <div style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            <span style={{ color: 'var(--ink)' }}>Link 1 breaks if:</span> Shunto negotiations come in below 3.5% — BoJ pauses. <br />
            <span style={{ color: 'var(--ink)' }}>Link 2 breaks if:</span> US tariffs on Japan autos force BoJ to hold to protect growth. <br />
            <span style={{ color: 'var(--ink)' }}>Link 3 breaks if:</span> Carry reinstatement by global risk-on offsetting the rate differential shift.
          </div>
        </Block>
        <p style={S.p}>
          Notice that each break condition is specific and observable. "Something changes" is not a break
          condition. "Shunto wages below 3.5%" is — you can watch for it, set an alert for it, and act on it.
        </p>
      </div>

      {/* ── WORKED EXAMPLES ──────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>05 — WORKED EXAMPLES</div>
        <div style={S.h2}>Three current theses and how they were constructed</div>
        <ExamplePair
          pair="AUD/NZD" dir="long"
          ccy1="AUD" score1={5} ccy2="NZD" score2={-17}
          thesis="RBA hiking cycle (3.85%, first hike since Nov 2023) vs RBNZ in aggressive easing into confirmed NZ recession. Rate spread 160bp and widening. AUD CPI at 3.2% — above RBA's 2–3% target — keeps the May meeting live for a second hike. NZ GDP contracting, dairy prices soft, RBNZ explicitly guiding toward neutral 3% by mid-year."
          chain={['RBA Holds/Hikes May', 'RBNZ Cuts Mar 19', 'Rate Spread 160bp+', 'AUD/NZD ↑']}
          catalyst="RBNZ Mar 19 — any cut widens spread further. RBA Mar 18 minutes confirm hike conviction."
          entry="Market ~1.1100" target="1.1350" stop="1.0880"
          risk1="China iron ore collapse hurts AUD more than NZD"
          risk2="AUD CPI undershoots Q1 — RBA pause guidance kills second hike premium"
        />
        <ExamplePair
          pair="GBP/EUR" dir="long"
          ccy1="GBP" score1={2} ccy2="EUR" score2={-11}
          thesis="BoE cutting slowly at 3.75% constrained by services CPI at 5.0% — the explicit brake on pace. ECB in an aggressive easing cycle targeting ~1.65% neutral by end-2026. UK growth surprising to the upside. ECB press conference this week (Mar 6) expected to signal additional cuts; BoE Mar 20 expected to hold. Rate path divergence widens through H1 2026."
          chain={['ECB Cuts Mar 6', 'BoE Holds Mar 20', 'Rate Path Diverges', 'GBP/EUR ↑']}
          catalyst="ECB Mar 6 rate decision + Lagarde press conference pace guidance"
          entry="EUR/GBP 0.8300 (sell)" target="EUR/GBP 0.8130" stop="EUR/GBP 0.8420"
          risk1="UK services CPI surprise lower — BoE forced to cut March"
          risk2="Russia-Ukraine ceasefire deal — EUR safe-haven unwind rally"
        />
        <ExamplePair
          pair="USD/CAD" dir="long"
          ccy1="USD" score1={16} ccy2="CAD" score2={-14}
          thesis="Fed holding at 3.50–3.75% at restrictive levels. BoC in aggressive easing cycle facing existential tariff risk — 76% of Canadian exports go to the US. WTI falling on US shale supply glut compresses CAD via the commodity channel simultaneously. BoC meeting this week (Mar 4) with 64% probability of a 25bp cut. Rate differential 125–150bp and widening."
          chain={['BoC Cuts Mar 4', 'Rate Differential 150bp+', 'WTI Below $75', 'USD/CAD ↑']}
          catalyst="BoC Mar 4 decision — size of cut and tariff language in press conference"
          entry="Market ~1.4380" target="1.4750" stop="1.4100"
          risk1="US-Canada tariff deal or delay — violent CAD short squeeze from -64% COT"
          risk2="Fed dovish surprise — USD selling offsets CAD weakness"
        />
      </div>

      {/* ── SIZING & TIMING ──────────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>06 — SIZING AND TIMING</div>
        <div style={S.h2}>When to enter and how much to risk</div>
        <p style={S.p}>
          Macro thesis provides direction. It does not provide timing. A structurally correct thesis
          (AUD/NZD long) can spend weeks moving against you before the catalyst triggers. Entry discipline
          requires a separate framework — most macro traders use one of three approaches:
        </p>
        {[
          ['CATALYST ENTRY', 'Enter after the catalyst event confirms the thesis direction. Sacrifice some of the move in exchange for confirmation. Example: wait for RBNZ to cut, then enter AUD/NZD long on the reaction. Miss the initial 50 pips, enter with confirmation.'],
          ['LIMIT ORDER INTO PULLBACK', 'Set a limit order at a technical support/resistance level that aligns with the macro thesis direction. Example: AUD/NZD long limit at 1.1030 (prior support) within the thesis framework. Risk is that the pullback never comes and the trade moves without you.'],
          ['SCALED ENTRY', 'Enter 50% of intended size immediately, add the remaining 50% on a pullback or confirmation. Balances the risk of missing the move against entering at a poor level.'],
        ].map(([label, body]) => (
          <div key={label} style={{ marginBottom: '1rem', borderLeft: '2px solid var(--rule)', paddingLeft: '1rem' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--ink)', marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7 }}>{body}</div>
          </div>
        ))}
        <Block label="POSITION SIZING RULE — NON-NEGOTIABLE" color="var(--red)">
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            Risk no more than <span style={{ color: 'var(--ink)' }}>1–2% of account equity per trade</span>. Use
            the §10 Execution calculator to determine lot size from account size, risk percentage, and stop
            in pips. Set the stop at minimum <span style={{ color: 'var(--ink)' }}>1.25× the 14-day ATR</span> from
            entry — this is the daily noise range; a tighter stop guarantees being stopped out on normal
            intraday volatility before the thesis plays out. The calculator shows you both numbers.
          </div>
        </Block>
      </div>

      {/* ── MANAGING THE TRADE ───────────────────────────────── */}
      <div style={S.sec}>
        <div style={S.secH}>07 — TRADE MANAGEMENT</div>
        <div style={S.h2}>What to do after entry</div>
        <p style={S.p}>
          A thesis-based trade has a clear lifecycle: entry → catalyst event → move → exit. Management
          decisions should be made before entry, not while watching the position.
        </p>
        {[
          ['PRE-EVENT', 'If a high-impact event (§5) falls during the hold period, decide before entry whether to hold through it or close ahead of it. Holding through a CB decision when the outcome is uncertain is speculation, not thesis trading. If the event IS the catalyst, hold. If it is an unrelated risk, close or reduce.'],
          ['THESIS CONFIRMED', 'After the catalyst event confirms the thesis direction, trail the stop to breakeven. You are now playing with house money. Let the macro move develop. Do not take profit early because the position looks good — that is the thesis playing out, not a time to exit.'],
          ['THESIS PARTIALLY CONFIRMED', 'The catalyst happened but the move was smaller than expected. Reassess: is the thesis still intact, or did the market already have this priced? Check OIS again. If the next catalyst is still pending, hold with reduced size.'],
          ['THESIS INVALIDATED', 'The specific invalidation condition you identified at entry has occurred. Close immediately, regardless of where the position is. A thesis that is wrong is wrong — price action confirming it wrong is not a reason to hold. The stop prevents catastrophic loss; honour it.'],
        ].map(([label, body]) => (
          <div key={label} style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--gold)', marginBottom: '0.35rem', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.7, paddingLeft: '1rem', borderLeft: '2px solid var(--rule)' }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
