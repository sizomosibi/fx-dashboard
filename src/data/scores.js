// ── scores.js ─────────────────────────────────────────
// Monetary score auto-derived from currencies.js bias field + per-currency overrides.
// When a CB pivots: update bias + cbGroup in currencies.js → monetary auto-updates here.
// Non-monetary dimensions (growth, inflation, risk, commodity) are analyst-assigned. Review monthly.

import { CURRENCIES } from './currencies.js';

// COT data: CFTC Commitments of Traders (Legacy Futures Only report)
// Update workflow: paste weekly CFTC report into Section 11 > COT Report mode.
// Update COT_AS_OF below whenever you update the COT numbers.
export const COT_AS_OF = 'Feb 18, 2026'; // update this when you update COT data



export const COPPER_ANALYSIS = {
  current: '$4.55/lb',
  change: '-$0.07 (-1.5%)',
  trend: 'neutral',
  signal: 'NEUTRAL',
  note: 'Copper is the most economically sensitive commodity — it goes into everything from construction to electronics. A falling copper price is a warning signal from the physical economy that demand is softening. Watch for: China PMI correlation, US ISM manufacturing.',
  keyLevels: [
    {level:'$4.80',label:'Resistance — above = global growth recovering = AUD/NZD bullish'},
    {level:'$4.55',label:'Current'},
    {level:'$4.00',label:'Support — break below = recession signal = major risk-off'},
  ],
};

// ── Monetary score: computed from currencies.js bias ──────────────────────────
// hawkish=+3, neutral/hold=0, dovish=-2
// Overrides for currencies where the bias label is too coarse:
const MONETARY_OVERRIDE = {
  USD:  2,   // restrictive hold — 3.50–3.75%, above neutral; not cutting soon
  GBP:  1,   // constrained-dovish: services CPI 5% caps pace of cuts
  CHF: -1,   // mild-dovish: at zero lower bound, cautious; not yet negative
  CAD: -3,   // aggressive-dovish: tariff + recession risk = emergency cuts possible
  NZD: -4,   // most-dovish G10: confirmed recession, 50bp cut pace, near neutral rate
};

function monetaryScore(ccy) {
  if (MONETARY_OVERRIDE[ccy] !== undefined) return MONETARY_OVERRIDE[ccy];
  const bias = CURRENCIES[ccy]?.bias || 'neutral';
  return { hawkish: 3, neutral: 0, hold: 0, dovish: -2 }[bias] ?? 0;
}

// ── Analyst-assigned non-monetary dimensions ──────────────────────────────────
// monetary is auto-computed above — do NOT add it here.
// formula: score = (monetary × 2) + growth + inflation + risk + commodity
// Review and update monthly via §11 Update Assistant → Data Release mode.
const ANALYST_SCORES = {
  USD: { growth:  3, inflation:  2, risk:  2, commodity:  1 },  // resilient growth, sticky CPI
  JPY: { growth: -1, inflation:  2, risk:  3, commodity: -1 },  // weak GDP, wage-driven CPI, prime safe-haven
  AUD: { growth: -1, inflation:  0, risk: -1, commodity: -1 },  // weak GDP (0.8%), CPI at target, China exposure
  GBP: { growth:  1, inflation:  2, risk:  0, commodity:  1 },  // OK growth, services CPI still elevated
  CHF: { growth:  1, inflation: -1, risk:  3, commodity:  1 },  // stable, deflationary risk, Europe safe-haven
  EUR: { growth: -2, inflation: -1, risk: -1, commodity: -1 },  // Eurozone sluggish, Germany weak, ECB cutting
  CAD: { growth: -3, inflation: -2, risk: -1, commodity: -2 },  // tariff risk, weak oil, BoC emergency mode
  NZD: { growth: -3, inflation: -2, risk: -2, commodity: -2 },  // confirmed recession, weak dairy, most dovish
  XAU: { growth:  1, inflation:  3, risk:  3, commodity:  3 },  // real rate + geopolitical + CB demand thesis
};

// Compute SCORES: merge analyst dimensions with auto-derived monetary
export const SCORES = Object.fromEntries(
  Object.entries(ANALYST_SCORES).map(([ccy, s]) => [
    ccy,
    { ...s, monetary: monetaryScore(ccy) },
  ])
);

// ── PAIR_THESIS ────────────────────────────────────────────────────
// Static fallback when AI brief is unavailable. AI brief (useAIBrief)
// regenerates these with live web search — always prefer AI over this.
// Levels approximate as of March 1, 2026. Update catalysts weekly via §11.
export const PAIR_THESIS = {
  'USD/CAD':{dir:'long',
    thesis:'Fed holding at 3.50–3.75% vs BoC in aggressive cut cycle at 2.25% — rate differential is 125–150bp and widening. US tariff threats on Canadian goods (25%) are existential for an economy where 76% of exports go to the US. WTI oil weakness compounds CAD via commodity channel.',
    chain:['Fed Holds at 3.50–3.75%','BoC Cuts to 2.00%','Rate Differential 175bp','USD/CAD ↑'],
    catalyst:'BoC March 4 meeting — any cut or dovish guidance widens differential. US tariff implementation deadline news.',
    timeframe:'2–6 weeks',entry:'Market (~1.4380)',target:'1.4750',stop:'1.4100',
    risks:['US-Canada tariff deal or delay = violent CAD short squeeze (CAD positioning -64%)','Oil price spike = CAD commodity bid','Fed dovish pivot = USD selling']},

  'USD/NZD':{dir:'long',
    thesis:'RBNZ deepest easing cycle in G10 with NZ GDP contracting. Rate differential vs Fed has widened to ~125bp and is still growing. NZD increasingly used as carry funding currency — risk-off events trigger rapid NZD selling. Dairy export prices soft.',
    chain:['RBNZ Cuts to 2.00%','Fed Holds at 3.50–3.75%','Rate Differential 150bp+','NZD/USD ↓'],
    catalyst:'RBNZ March 19 meeting — any cut confirms easing path. NZ GDP data mid-March.',
    timeframe:'4–8 weeks',entry:'NZD/USD 0.5680 (sell)',target:'0.5480',stop:'0.5830',
    risks:['China stimulus surprise = dairy/NZD positive squeeze','RBNZ pause = violent short squeeze (NZD positioning -55%)','Risk-off flows to JPY rather than NZD']},

  'JPY/NZD':{dir:'long',
    thesis:'Maximum divergence pair in G10: BoJ at 0.75% and hiking vs RBNZ at 2.25% and cutting. Japan shunto wage negotiations running at 4.8% — sustaining inflation above 2% and forcing further BoJ hikes. NZ GDP contracting. Rate path spread could exceed 200bp by year-end.',
    chain:['BoJ Hikes to 1.00%','RBNZ Cuts to 2.00%','Rate Spread 100bp','NZD/JPY ↓'],
    catalyst:'BoJ March 19 — any forward guidance on further hikes accelerates JPY rally. RBNZ March 19 cut confirmation.',
    timeframe:'6–12 weeks',entry:'NZD/JPY 84.50 (sell)',target:'80.00',stop:'88.50',
    risks:['US tariffs on Japan autos = BoJ pauses = JPY softens','Global risk-on = carry reinstated = NZD/JPY rally','China commodity stimulus = NZD outperforms']},

  'GBP/EUR':{dir:'long',
    thesis:'BoE cutting slowly at 3.75% constrained by services CPI at 5% vs ECB in an explicit easing cycle targeting 1.65% neutral. ECB rate path diverges further from BoE over 2026. UK growth surprising to the upside; Eurozone data still mixed with Germany the weak link.',
    chain:['UK Services CPI 5%','BoE Cuts Slower than ECB','Rate Path Diverges','GBP/EUR ↑'],
    catalyst:'ECB March 6 — expected cut to 2.00%. BoE March 20 — expected hold. UK CPI March 19 for BoE guidance.',
    timeframe:'3–6 weeks',entry:'EUR/GBP 0.8300 (sell)',target:'EUR/GBP 0.8130',stop:'EUR/GBP 0.8420',
    risks:['UK-EU trade frictions resurface = GBP bearish','US tariffs on UK = growth hit = BoE forced to cut','EU ceasefire dividend = EUR recovery trade']},

  'USD/JPY':{dir:'short',
    thesis:'BoJ hiking cycle only in early stages vs Fed on hold at restrictive levels. Shunto wage negotiations confirming 4.8% growth — sustains inflation above 2% and forces further BoJ action. Carry trade unwind potential is the single largest positioning risk in FX as JPY shorts remain large.',
    chain:['Shunto 4.8% Wages Confirmed','BoJ Hikes Mid-2026','Carry Trade Unwinds','USD/JPY ↓'],
    catalyst:'BoJ March 19 — rate decision and forward guidance. Shunto final results late March/April.',
    timeframe:'8–16 weeks',entry:'149.00 (sell)',target:'143.00',stop:'153.50',
    risks:['US tariffs on Japan autos = BoJ pauses hike path','US CPI resurgence = Fed hike = USD/JPY spike','Global risk-on = carry reinstated = JPY weakens']},

  'AUD/NZD':{dir:'long',
    thesis:'RBA surprised markets with a 25bp hike to 3.85% on Feb 3 — Australia is now the only commodity currency in a hiking cycle. RBNZ at 2.25% and cutting into a confirmed recession. Rate spread 160bp and widening. Australian CPI at 3.2% (above 2–3% target) keeps RBA hawkish; NZ GDP contracting. Tight AUS labour market (4.0% unemployment, wages 3.2%) vs deteriorating NZ employment.',
    chain:['RBA Hikes to 3.85%+','RBNZ Cuts to 2.00%','160bp+ Rate Spread','AUD/NZD ↑'],
    catalyst:'RBNZ March 19 — any cut widens AUD/NZD spread further. RBA March 18 meeting minutes reveal hike conviction depth.',
    timeframe:'3–6 weeks',entry:'Market (~1.1100)',target:'1.1350',stop:'1.0880',
    risks:['China iron ore demand collapse = hurts AUD more than NZD','Dairy price surge = NZD commodity bid','AUD CPI undershoots = RBA pauses hike path']},

  'EUR/CAD':{dir:'short',
    thesis:'Both currencies have bearish fundamentals, but CAD faces an existential tariff risk that could trigger emergency BoC cuts. EUR has Russia-Ukraine ceasefire optionality providing upside. Selling EUR/CAD captures the asymmetry: EUR downside is limited by ceasefire trade, CAD downside is unlimited in a tariff escalation.',
    chain:['US Tariffs on Canada Implemented','BoC Emergency Cuts','CAD Collapses','EUR/CAD ↓'],
    catalyst:'US-Canada tariff implementation headlines. BoC March 4 — emergency cut if tariffs confirmed.',
    timeframe:'1–4 weeks',entry:'1.4780 (sell)',target:'1.4380',stop:'1.5050',
    risks:['EU hit by US tariffs = EUR falls with CAD = EUR/CAD flat','Ceasefire fails = EUR bearish','Tariff deal removes CAD downside = EUR/CAD ↑']},

  'GBP/JPY':{dir:'short',
    thesis:'Risk-sensitive cross where both underlying macro stories are pushing price lower. BoJ hiking path compresses carry spread. BoE cutting slowly reduces GBP carry premium. GBP/JPY is the classic carry unwind pair — falls sharply on any geopolitical shock, risk-off event, or BoJ hawkish surprise.',
    chain:['BoJ Hawkish Signal Mar 19','BoE Dovish Mar 20','Carry Spread Compresses','GBP/JPY ↓'],
    catalyst:'BoJ March 19 — any forward rate guidance. BoE March 20 — dovish hold confirms BoE/BoJ divergence.',
    timeframe:'4–8 weeks',entry:'189.00 (sell)',target:'182.00',stop:'193.00',
    risks:['UK inflation spike forces BoE hawkishness = GBP holds','Risk-on continuation = carry reinstated = GBP/JPY rallies','BoJ pauses due to Japan tariff risk from US']},
};

export const COT={
  USD:{net:72,prev:68,label:'DXY (USD Index)',detail:'Speculators heavily long USD. Crowded positioning = contrarian risk. Any USD weakness = sharp unwind.'},
  EUR:{net:-58,prev:-52,label:'EUR Futures',detail:'Speculative shorts building. Not yet extreme but trend accelerating. Covering rally risk if ECB hawkish surprise.'},
  GBP:{net:12,prev:8,label:'GBP Futures',detail:'Mild long positioning. Not crowded. GBP moves driven by data, not squeeze risk.'},
  JPY:{net:-45,prev:-61,label:'JPY Futures',detail:'Shorts being covered rapidly — was -61, now -45. Smart money unwinding JPY short = bullish signal. BoJ hiking accelerating this.'},
  CHF:{net:8,prev:5,label:'CHF Futures',detail:'Near neutral. CHF moves in crises regardless of positioning.'},
  CAD:{net:-64,prev:-58,label:'CAD Futures',detail:'Extremely crowded short. Contrarian risk: any positive tariff news = violent CAD squeeze.'},
  AUD:{net:-38,prev:-42,label:'AUD Futures',detail:'Moderately short, slightly covered. Not at extreme. Follow fundamentals, not squeeze risk yet.'},
  NZD:{net:-55,prev:-50,label:'NZD Futures',detail:'Heavy short positioning growing. Near extreme. RBNZ surprise hold = massive short squeeze risk.'},
  XAU:{net:35,prev:17,label:'COMEX Gold Futures',detail:'Speculative longs building rapidly — net position rising week-on-week. Not yet in crowded territory (extreme = >60%). Room for further long accumulation. Confirms bullish trend. Watch for squeeze above $3,000 psychological level if net approaches 60%.'},
};

export const ATR={
  'EUR/USD':{atr:68,vol:'medium'},'GBP/USD':{atr:85,vol:'medium'},
  'USD/JPY':{atr:112,vol:'high'},'USD/CHF':{atr:58,vol:'low'},
  'USD/CAD':{atr:78,vol:'medium'},'AUD/USD':{atr:52,vol:'low'},
  'NZD/USD':{atr:48,vol:'low'},'GBP/JPY':{atr:145,vol:'high'},
};

export const CORR_WARNS={
  'AUD/USD+NZD/USD':'Both long commodity. 0.82 correlation — China risk doubled.',
  'EUR/USD+GBP/USD':'Both short USD. 0.74 correlation — USD move hits both.',
  'USD/CAD+USD/CHF':'Both long USD. 0.78 correlation — 2× USD exposure.',
  'USD/JPY+AUD/JPY':'Both short JPY. 0.71 correlation — carry unwind doubles hit.',
};

