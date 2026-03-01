#!/usr/bin/env python3
"""
fetch_atr.py — Calculate 14-day ATR for G10 FX pairs from Yahoo Finance
=======================================================================
Runs via GitHub Actions weekly (Saturday) + on every push to main.
No dependencies beyond stdlib + urllib.

Output: public/atr-data.json

ATR (Average True Range) = mean of (high - low) over 14 sessions, in pips.
Pip values:
  JPY pairs: 1 pip = 0.01   (e.g. USD/JPY 149.50: 1 pip = 0.01 = ~$0.67)
  All others: 1 pip = 0.0001

Volatility classification:
  < 50  pips = low
  50–89 pips = medium
  90+   pips = high
"""

import json
import sys
import time
import re
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError

# ── Yahoo Finance ticker map ──────────────────────────────────────────
PAIRS = {
    'EUR/USD': 'EURUSD=X',
    'GBP/USD': 'GBPUSD=X',
    'USD/JPY': 'JPY=X',
    'USD/CHF': 'CHF=X',
    'USD/CAD': 'CAD=X',
    'AUD/USD': 'AUDUSD=X',
    'NZD/USD': 'NZDUSD=X',
    'GBP/JPY': 'GBPJPY=X',
}

# ── Current ATR fallback (updated manually when automation is unavailable) ──
# These were measured the week of Feb 24, 2026.
FALLBACK = {
    'EUR/USD': {'atr': 68,  'vol': 'medium'},
    'GBP/USD': {'atr': 85,  'vol': 'medium'},
    'USD/JPY': {'atr': 112, 'vol': 'high'},
    'USD/CHF': {'atr': 58,  'vol': 'low'},
    'USD/CAD': {'atr': 78,  'vol': 'medium'},
    'AUD/USD': {'atr': 52,  'vol': 'low'},
    'NZD/USD': {'atr': 48,  'vol': 'low'},
    'GBP/JPY': {'atr': 145, 'vol': 'high'},
}

def pip_multiplier(pair: str) -> float:
    """JPY pairs: 100 pips per 1.0; all others: 10,000 pips per 1.0"""
    return 100.0 if 'JPY' in pair else 10_000.0


def vol_label(pips: int) -> str:
    if pips < 50:  return 'low'
    if pips < 90:  return 'medium'
    return 'high'


def fetch_atr(pair: str, ticker: str, retries: int = 3) -> dict | None:
    """
    Fetch 30 days of daily OHLC from Yahoo Finance chart API.
    Returns {'atr': int_pips, 'vol': str} or None on failure.
    """
    url = (
        f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}'
        f'?interval=1d&range=30d'
    )
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (compatible; FX-Dashboard-ATR/1.0; '
            '+https://github.com/actions/fetch-atr)'
        ),
    }

    for attempt in range(retries):
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode())

            result = data.get('chart', {}).get('result', [])
            if not result:
                raise ValueError('No result in Yahoo response')

            indicators = result[0].get('indicators', {})
            quote       = indicators.get('quote', [{}])[0]
            highs       = quote.get('high', [])
            lows        = quote.get('low',  [])
            closes      = quote.get('close',[])

            # Filter None values (gaps / non-trading days)
            rows = [
                (h, l, c)
                for h, l, c in zip(highs, lows, closes)
                if h is not None and l is not None and c is not None
            ]

            if len(rows) < 2:
                raise ValueError(f'Only {len(rows)} valid rows for {pair}')

            # True Range = max(high-low, |high-prev_close|, |low-prev_close|)
            trs = []
            for i in range(1, len(rows)):
                h, l, _ = rows[i]
                prev_c   = rows[i - 1][2]
                tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
                trs.append(tr)

            # Use last 14 TR values for ATR
            atr_raw = sum(trs[-14:]) / min(14, len(trs))
            atr_pips = max(1, round(atr_raw * pip_multiplier(pair)))

            return {'atr': atr_pips, 'vol': vol_label(atr_pips)}

        except (URLError, ValueError, KeyError) as e:
            print(f'  [{pair}] attempt {attempt + 1} failed: {e}', file=sys.stderr)
            if attempt < retries - 1:
                time.sleep(4)

    return None


def main():
    output_path = 'public/atr-data.json'

    print(f'Fetching 14-day ATR for {len(PAIRS)} pairs...')
    results  = {}
    fallback_used = []

    for pair, ticker in PAIRS.items():
        print(f'  {pair} ({ticker})...', end=' ', flush=True)
        data = fetch_atr(pair, ticker)
        if data:
            results[pair] = data
            print(f"{data['atr']} pips ({data['vol']})")
        else:
            results[pair] = FALLBACK[pair]
            fallback_used.append(pair)
            print(f"FALLBACK {FALLBACK[pair]['atr']} pips")
        time.sleep(0.8)   # polite pacing

    payload = {
        'atr':          results,
        'fetchedAt':    datetime.now(timezone.utc).isoformat(),
        'fallbackUsed': fallback_used,
    }

    with open(output_path, 'w') as f:
        json.dump(payload, f, indent=2)

    print(f'\nWrote {output_path}')
    if fallback_used:
        print(f'WARNING: fallback used for: {", ".join(fallback_used)}')

    # Exit 1 if ALL pairs fell back (likely a connectivity issue worth surfacing)
    if len(fallback_used) == len(PAIRS):
        print('ERROR: all pairs used fallback — likely network failure', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
