# FX Macro Intelligence — React v5

A professional FX macro dashboard built in React + Vite. Modular, no hardcoded values, full-width layout.

---

## Quick Start (VSCode + npm)

```bash
# 1. Unzip and open in VSCode
cd fx-react

# 2. Install dependencies (~30 seconds)
npm install

# 3. Start dev server
npm run dev
# → opens at http://localhost:3000
```

That's it. The dashboard loads immediately with static baseline data.  
FX rates (Frankfurter), partial yield curve (US Treasury), ECB rate, BoC rate, and SNB rate  
auto-fetch in the background — **no API key needed for these**.

---

## Adding Live Data Keys

Click ⚙ in the top-right corner of the dashboard, or open **Settings**.

| Key | Where to get | What it unlocks |
|-----|--------------|-----------------|
| FRED API Key | [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) | Fed rate, full yield curve, US CPI/PCE/unemployment/NFP |
| Twelve Data Key | [twelvedata.com](https://twelvedata.com) → Free tier | Gold, Oil, S&P 500, VIX, DXY, Copper (1 batch call) |

Both are free. Registration takes ~2 minutes each.

Keys are stored in your **browser's localStorage** — never sent to any server except the target API.

### Central Bank Rates

ECB, BoC, SNB fetch automatically without a key.  
RBA, BoE, BoJ, RBNZ require manual update after each CB meeting (~6-8× per year each).  
Fed rate fetches via FRED key.  
Update manually: ⚙ Settings → Central Bank Rates section.

---

## AI Analyst (§09)

The AI Analyst calls the Anthropic Claude API.  
**This only works when deployed** — not in `npm run dev` — because:
- Anthropic blocks direct browser requests (CORS)
- The API key must stay server-side (security)

When deployed to Netlify, the `netlify/functions/claude-proxy.js` function handles this securely.

To test AI locally, use [netlify-cli](https://docs.netlify.com/cli/get-started/):
```bash
npm install -g netlify-cli
netlify dev   # runs both Vite + Netlify Functions locally
```
Then add `ANTHROPIC_API_KEY=sk-ant-...` to a `.env` file in the project root.

---

## Build for Production

```bash
npm run build
# output goes to ./dist/
```

Upload `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

---

## Data Update Schedule

| Data | Frequency | How to update |
|------|-----------|---------------|
| CB speeches, triad (CPI/GDP/employment), weekAhead | Monthly / after meetings | Edit `src/data/currencies.js` |
| COT positioning | Weekly | Edit `SCORES` block in `src/data/scores.js` |
| Market snapshot baseline | Monthly | Edit `src/data/marketSnapshot.js` |
| Rate path projections | Quarterly | Edit `ratePath` in each currency in `currencies.js` |
| Fed speeches log | After each speech | Edit `fedSpeeches` array in `marketSnapshot.js` |

All market prices (Gold, Oil, S&P, VIX, DXY, Copper) and FX rates auto-refresh via API keys.
