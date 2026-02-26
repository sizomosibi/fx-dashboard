// ── scores.js ─────────────────────────────────────────

export const COT_AS_OF = 'Feb 18, 2026';

export const COPPER_ANALYSIS = {
  current: '$4.31/lb',
  change: '-$0.08 (-1.8%)',
  trend: 'down',
  signal: 'RISK-OFF',
  note: 'Copper is the most economically sensitive commodity — it goes into everything from construction to electronics. A falling copper price is a warning signal from the physical economy that demand is softening. Watch for: China PMI correlation, US ISM manufacturing.',
  keyLevels: [
    {level:'$4.50',label:'Resistance — above = global growth recovering = AUD/NZD bullish'},
    {level:'$4.31',label:'Current'},
    {level:'$4.00',label:'Support — break below = recession signal = major risk-off'},
  ],
};

export const SCORES = {
  USD:{monetary:4,growth:3,inflation:2,risk:2,commodity:1},
  JPY:{monetary:3,growth:-1,inflation:2,risk:3,commodity:-1},
  GBP:{monetary:1,growth:1,inflation:2,risk:0,commodity:1},
  CHF:{monetary:-1,growth:1,inflation:-1,risk:3,commodity:1},
  EUR:{monetary:-3,growth:-2,inflation:-1,risk:-1,commodity:-1},
  AUD:{monetary:-2,growth:-1,inflation:-1,risk:-1,commodity:-1},
  NZD:{monetary:-4,growth:-3,inflation:-2,risk:-2,commodity:-2},
  CAD:{monetary:-3,growth:-3,inflation:-2,risk:-1,commodity:-2},
  XAU:{monetary:3,growth:1,inflation:3,risk:3,commodity:3},  // bullish on geopolitical + real rate thesis
};

export const PAIR_THESIS = {
  'USD/CAD':{dir:'long',thesis:'Fed hold vs BoC aggressive cut cycle creates growing rate differential. 25% tariff threat on Canadian goods is an existential risk to the Canadian economy — 76% of exports go to the US. WTI oil falling compounds CAD weakness via commodity channel.',chain:['Fed Holds','BoC Cuts Aggressively','Rate Differential Widens','USD/CAD ↑'],catalyst:'Canada Retail Sales Tue + tariff headlines',timeframe:'2–6 weeks',entry:'Market (1.4350)',target:'1.4750',stop:'1.4100',risks:['Tariff deal or delay = violent CAD short squeeze','Oil price spike = CAD positive','Fed dovish surprise on Core PCE']},
  'USD/NZD':{dir:'long',thesis:'RBNZ most dovish G10 central bank with NZ in confirmed recession. Rate path divergence vs Fed higher-for-longer creates widening rate differential. NZD increasingly used as carry funding currency — any risk-off = NZD selling.',chain:['RBNZ Cuts','Fed Holds','Rate Differential Maximum','NZD/USD ↓'],catalyst:'RBNZ decision Wed Feb 25 — 50bp would be NZD crash',timeframe:'4–8 weeks',entry:'NZD/USD 0.5750 (sell)',target:'0.5550',stop:'0.5900',risks:['RBNZ hold (hold) = violent NZD squeeze','China stimulus surprise = dairy/NZD positive','Risk-off paradoxically lifts NZD if carry unwinds to JPY instead']},
  'JPY/NZD':{dir:'long',thesis:'Maximum divergence pair: BoJ hiking vs RBNZ in aggressive easing cycle. Japan wage growth accelerating (shunto 4.8%) while NZ in recession. Rate path spread could widen 125bp+ this year.',chain:['BoJ Hikes','RBNZ Cuts','Rate Spread Widens','NZD/JPY ↓'],catalyst:'Shunto wage data Mar-Apr + RBNZ Feb 25',timeframe:'6–12 weeks',entry:'NZD/JPY 87.50 (sell)',target:'83.00',stop:'91.00',risks:['Japan auto tariff = BoJ pause = JPY softens','Global risk-off could initially lift JPY but complicate carry dynamics']},
  'GBP/EUR':{dir:'long',thesis:'BoE constrained by services inflation at 5% vs ECB in explicit easing cycle toward 1.90% neutral. UK data has been surprising to the upside (GDP, CPI) while German data disappoints. Rate path divergence favours GBP.',chain:['UK Services CPI 5%','BoE Holds Longer','ECB Cuts Faster','GBP/EUR ↑'],catalyst:'UK Services CPI Tue Feb 24 — above 5% = GBP rally',timeframe:'3–6 weeks',entry:'0.8380 (buy GBP)',target:'0.8200',stop:'0.8480',risks:['UK-EU trade deal collapses = GBP bearish','US tariffs on UK = growth hit = BoE cuts','EU ceasefire deal = EUR recovery']},
  'USD/JPY':{dir:'short',thesis:'BoJ hiking cycle just beginning vs Fed on hold at elevated rates. Spring wage negotiations (shunto) showing 4.8% growth — if sustained, BoJ hikes mid-2026. Massive carry trade unwind risk as rate differential compresses.',chain:['Shunto Wages Strong','BoJ Hikes Mid-2026','Carry Trade Unwinds','USD/JPY ↓'],catalyst:'Tokyo CPI Thu + shunto final results April',timeframe:'8–16 weeks',entry:'149.50 (sell)',target:'143.00',stop:'153.00',risks:['US tariffs on Japan autos = BoJ cautious','US inflation resurgence = Fed hike = USD/JPY ↑','Global risk-on = carry reinstated = JPY softens']},
  'AUD/NZD':{dir:'long',thesis:'RBA cutting cautiously (one cut, hawkish hold language) vs RBNZ in aggressive easing with NZ in recession. Rate path divergence between two commodity currencies with different commodity exposures.',chain:['RBA Hawkish Hold','RBNZ Aggressive Cuts','AUD/NZD Rate Differential','AUD/NZD ↑'],catalyst:'RBNZ decision vs RBA minutes this week',timeframe:'3–6 weeks',entry:'1.0950 (buy)',target:'1.1200',stop:'1.0800',risks:['China commodity demand collapse = hurts AUD more than NZD','Dairy price surge = NZD positive']},
  'EUR/CAD':{dir:'short',thesis:'Both currencies bearish but CAD has existential tariff risk that could accelerate moves. CAD exposed to US-Canada tariff escalation while EUR has ceasefire upside optionality.',chain:['US Tariffs on Canada','BoC Emergency Cuts','CAD Collapses','EUR/CAD ↓'],catalyst:'US-Canada trade headlines + Canada Retail Sales',timeframe:'1–4 weeks',entry:'1.4900 (sell)',target:'1.4500',stop:'1.5100',risks:['EU tariff hit = EUR/CAD flat','Tariff deal = CAD spike, EUR/CAD ↑']},
  'GBP/JPY':{dir:'short',thesis:'Risk-sensitive pair. GBP supported by inflation but JPY has structural upside from BoJ hike path. GBP/JPY tends to fall sharply in risk-off events — current geopolitical environment has elevated tail risk.',chain:['Global Risk-Off','Carry Unwind','GBP/JPY Sells Off','JPY Surge'],catalyst:'Any geopolitical escalation or BoJ signal',timeframe:'Event-driven',entry:'190.50 (sell)',target:'185.00',stop:'193.50',risks:['Risk-on continuation = GBP/JPY rallies','BoE hawkish surprise = GBP strength buffers JPY rally']},
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
  XAU:{net:35,prev:17,label:'COMEX Gold Futures',detail:'Speculative positioning building rapidly — was +17%, now +35%. Not yet extreme (extreme = >60%). Room for further longs. Confirms bullish trend. Short squeeze risk above $3,000 psychological level.'},
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

