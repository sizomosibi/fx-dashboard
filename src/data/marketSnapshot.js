// ── marketSnapshot.js ─────────────────────────────────────────

export const MARKET_SNAPSHOT = {
  // US Treasury Yields — critical for risk sentiment + gold + USD
  yields:{
    US2Y:  {v:'4.38%', chg:'-0.02%', dir:'down', interp:'dove'},  // Rising = hawkish, Falling = dovish
    US5Y:  {v:'4.41%', chg:'-0.01%', dir:'down', interp:'dove'},
    US10Y: {v:'4.62%', chg:'+0.04%', dir:'up',   interp:'hawk'},   // KEY benchmark
    US30Y: {v:'4.88%', chg:'+0.06%', dir:'up',   interp:'hawk'},
    spread2s10s: {v:'+24bp', direction:'Normal (steepening)', signal:'norm',
      note:'Yield curve steepening. 10Y > 2Y = growth expected. Steep curve = risk-on. Inverted curve = recession signal.'},
    realRate10Y: {v:'+0.30%',chg:'-0.15%',dir:'down',
      note:'Nominal 10Y (4.62%) minus CPI (2.9%) ≈ +1.72% true real rate. But using TIPS: +0.30%. Falling real rates = gold bullish, USD neutral-bearish.'},
  },
  // Risk appetite indicators
  vix:     {v:'22.4',  chg:'+3.1',   dir:'up',   signal:'risk-off', note:'Above 20 = elevated fear. Sustained above 25 = crisis pricing. Below 15 = complacent risk-on.'},
  dxy:     {v:'106.8', chg:'-0.4',   dir:'down',  signal:'neutral',  note:'USD Index. Falling = risk-on, commodity currencies bid. Rising = risk-off/safe-haven flow.'},
  spx:     {v:'5,892', chg:'-38',    dir:'down',  signal:'risk-off', note:'S&P 500. Falling = risk-off = AUD/NZD/CAD sell, JPY/CHF/Gold bid. Rising = risk-on.'},
  gold:    {v:'$2,935',chg:'+$18',   dir:'up',    signal:'risk-off', note:'Gold rising = global uncertainty elevated. Best single risk-off gauge for FX.'},
  oil:     {v:'$72.30',chg:'-$1.20', dir:'down',  signal:'neutral',  note:'WTI. Falling = CAD/NOK bearish, global growth concerns. Rising = inflation risk = CB hawkish.'},
  copper:  {v:'$4.31/lb',chg:'-$0.08',dir:'down', signal:'risk-off', note:'"Dr. Copper" — PhD in economics. Falling = global growth slowdown. Leading indicator for AUD, global risk.'},
  // Fed speech reaction — current week
  fedSpeeches:[
    {speaker:'Powell',date:'Feb 12',
      pre1H:'4.58%', post1H:'4.62%', change:'+4bp',
      reaction:'hawk',
      quote:'Do not need to be in a hurry. Inflation progress uneven.',
      goldReaction:'-$12 (initial), +$8 recovery',
      usdReaction:'+0.3% DXY',
      fxImpact:'USD bid. AUD/USD -40 pips. USD/JPY +55 pips. Gold sold then recovered as real rate concern grew.'},
    {speaker:'Waller (Fed Governor)',date:'Feb 18',
      pre1H:'4.64%', post1H:'4.61%', change:'-3bp',
      reaction:'dove',
      quote:'I could see conditions warranting cuts later this year if data cooperates.',
      goldReaction:'+$22',
      usdReaction:'-0.2% DXY',
      fxImpact:'USD dipped. AUD/USD +35 pips. Gold rallied. Rate cut bets briefly repriced.'},
  ],
};

