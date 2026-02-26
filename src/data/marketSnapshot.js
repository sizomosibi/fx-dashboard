// ── marketSnapshot.js ───────────────────────────────────────────────
// Static baseline — used ONLY as fallback while live data loads.
// All values update live via Netlify proxy functions (Yahoo Finance,
// US Treasury XML) automatically on page load. No API keys needed.
// Last manually reviewed: Feb 23, 2026.

export const MARKET_SNAPSHOT = {
  // US Treasury Yields — live via /api/yields (Treasury XML feed)
  yields: {
    US2Y:  { v: '4.20%', chg: '-0.03%', dir: 'down', interp: 'dove' },
    US5Y:  { v: '4.28%', chg: '-0.02%', dir: 'down', interp: 'dove' },
    US10Y: { v: '4.42%', chg: '+0.01%', dir: 'up',   interp: 'hawk' },
    US30Y: { v: '4.68%', chg: '+0.03%', dir: 'up',   interp: 'hawk' },
    spread2s10s: {
      v:         '+22bp',
      direction: 'Normal (steepening)',
      signal:    'norm',
      note:      'Curve steepening — 10Y > 2Y signals growth expected. Steep curve = risk-on environment. Inverted = recession risk.',
    },
    realRate10Y: {
      v:    '+1.52%',
      chg:  '-0.08%',
      dir:  'down',
      note: 'Nominal 10Y (~4.42%) minus CPI (~2.9%) ≈ real rate. Falling real rates = gold bullish, USD neutral-bearish.',
    },
  },

  // Risk appetite indicators — live via /api/markets (Yahoo Finance)
  vix:    { v: '18.2',    chg: '+1.4',    dir: 'up',   signal: 'risk-off', note: 'Above 20 = elevated fear. Sustained above 25 = crisis pricing. Below 15 = complacent risk-on.' },
  dxy:    { v: '106.2',   chg: '-0.3',    dir: 'down', signal: 'neutral',  note: 'USD Index. Falling = risk-on, commodity currencies bid. Rising = risk-off/safe-haven flow.' },
  spx:    { v: '6,085',   chg: '-24',     dir: 'down', signal: 'risk-off', note: 'S&P 500. Falling = risk-off = AUD/NZD/CAD sell, JPY/CHF/Gold bid. Rising = risk-on.' },
  gold:   { v: '$2,936',  chg: '+$15',    dir: 'up',   signal: 'risk-off', note: 'Gold rising = global uncertainty elevated. Best single risk-off gauge for FX.' },
  oil:    { v: '$70.80',  chg: '-$0.90',  dir: 'down', signal: 'neutral',  note: 'WTI. Falling = CAD/NOK bearish, global growth concerns. Rising = inflation risk = CB hawkish.' },
  copper: { v: '$4.62/lb', chg: '-$0.05', dir: 'down', signal: 'risk-off', note: '"Dr. Copper" — PhD in economics. Falling = global growth slowdown. Leading indicator for AUD, global risk.' },

  // Fed speech log — update manually after each speech
  fedSpeeches: [
    {
      speaker: 'Powell (Chair)',
      date:    'Feb 19, 2026',
      pre1H:   '4.40%', post1H: '4.44%', change: '+4bp',
      reaction: 'hawk',
      quote:   'We do not need to be in a hurry to adjust policy.',
      goldReaction: '-$8 (initial), +$14 recovery',
      usdReaction:  '+0.25% DXY',
      fxImpact: 'USD bid. AUD/USD -35 pips. USD/JPY +45 pips. Gold dipped then recovered as real rate fears returned.',
    },
    {
      speaker: 'Waller (Governor)',
      date:    'Feb 12, 2026',
      pre1H:   '4.44%', post1H: '4.41%', change: '-3bp',
      reaction: 'dove',
      quote:   'I could see conditions warranting cuts later this year.',
      goldReaction: '+$22',
      usdReaction:  '-0.2% DXY',
      fxImpact: 'USD dipped. AUD/USD +30 pips. Gold rallied. Rate cut bets briefly repriced for H2 2026.',
    },
  ],
};
