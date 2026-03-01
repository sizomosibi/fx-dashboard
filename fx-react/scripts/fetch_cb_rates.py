#!/usr/bin/env python3
"""
Fetch G10 central bank benchmark rates from global-rates.com
and write public/cb-rates.json.

Runs via GitHub Actions on a schedule (weekly) AND on every push to main,
so rates update automatically after each CB meeting once the site is redeployed.

Uses urllib only (stdlib) — no pip install needed.

Output: public/cb-rates.json
  {
    "rates": {
      "USD": "3.50-3.75%",
      "AUD": "3.85%",
      ...
    },
    "source": "global-rates.com",
    "fetchedAt": "2026-03-01T12:00:00+00:00"
  }
"""

import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path


# ── Target currencies ─────────────────────────────────────────────────────────
# Maps the "Country/Region" column text in global-rates.com table → CCY code
COUNTRY_MAP = {
    "United States":  "USD",
    "Australia":      "AUD",
    "United Kingdom": "GBP",
    "Canada":         "CAD",
    "Europe":         "EUR",
    "Japan":          "JPY",
    "New Zealand":    "NZD",
    "Switzerland":    "CHF",
}

# ── Fallback rates — updated Mar 1, 2026 ─────────────────────────────────────
# Used only if scrape fails entirely. Correct as of this date.
FALLBACK = {
    "USD": "3.50-3.75%",  # Fed held Jan 28, 2026
    "AUD": "3.85%",       # RBA hiked +25bp Feb 3, 2026
    "EUR": "2.15%",       # ECB cut Jun 5, 2025
    "GBP": "3.75%",       # BoE cut Dec 18, 2025
    "JPY": "0.75%",       # BoJ hiked Dec 19, 2025
    "CHF": "0.00%",       # SNB cut Jun 19, 2025
    "CAD": "2.25%",       # BoC cut Oct 29, 2025
    "NZD": "2.25%",       # RBNZ cut Nov 26, 2025
}

URL = "https://www.global-rates.com/en/interest-rates/central-banks/"


# ── HTML parser ───────────────────────────────────────────────────────────────

class CBRateParser(HTMLParser):
    """
    Walks the global-rates.com central bank rate table.
    Each relevant <tr> has structure:
      <td><a>Bank name</a></td>
      <td>Country/Region</td>      ← cells[1]
      <td>X.XX %</td>              ← cells[2]
      <td>direction arrow</td>
      <td>previous rate</td>
      <td>date of change</td>
    """

    def __init__(self):
        super().__init__()
        self.rates      = {}     # {CCY: "X.XX%"}
        self._in_td     = False
        self._cells     = []     # cells collected for current <tr>
        self._cur_cell  = ""

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._cells    = []
            self._cur_cell = ""
        elif tag == "td":
            self._in_td    = True
            self._cur_cell = ""

    def handle_endtag(self, tag):
        if tag == "td":
            self._in_td = False
            self._cells.append(self._cur_cell.strip())
            self._cur_cell = ""
        elif tag == "tr":
            self._process_row(self._cells)
            self._cells = []

    def handle_data(self, data):
        if self._in_td:
            self._cur_cell += data

    def _process_row(self, cells):
        if len(cells) < 3:
            return

        country = cells[1].strip()
        ccy     = COUNTRY_MAP.get(country)
        if not ccy:
            return

        # Rate cell: "3.75 %" or "0.00 %" — strip whitespace around digits
        rate_str = cells[2].replace("\xa0", " ").strip()
        if "%" not in rate_str:
            return

        try:
            rate_num = float(rate_str.replace("%", "").strip())
        except ValueError:
            print(f"  WARN [{ccy}] could not parse rate: {rate_str!r}")
            return

        if ccy == "USD":
            # Fed target range: global-rates shows upper bound
            lower = round(rate_num - 0.25, 2)
            upper = round(rate_num, 2)
            # Use hyphen (not en-dash) for JSON portability
            self.rates["USD"] = f"{lower:.2f}-{upper:.2f}%"
        else:
            self.rates[ccy] = f"{rate_num:.2f}%"

        print(f"  OK  [{ccy}] {self.rates[ccy]}")


# ── Fetch helpers ─────────────────────────────────────────────────────────────

def http_get_html(url, timeout=20):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept":          "text/html,application/xhtml+xml,*/*;q=0.9",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control":   "no-cache",
        }
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        # Follow redirects (urlopen does this automatically)
        html = resp.read().decode("utf-8", errors="replace")
    return html


def scrape_global_rates(retries=3, delay=4):
    """Fetch global-rates.com with retries. Returns dict of {CCY: rate_str}."""
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            print(f"  Attempt {attempt}/{retries}: GET {URL}")
            html = http_get_html(URL)

            if len(html) < 5000:
                raise ValueError(f"Response suspiciously short ({len(html)} chars) — likely blocked")

            if "Central Bank" not in html and "central-bank" not in html:
                raise ValueError("Expected page content not found — URL may have changed")

            parser = CBRateParser()
            parser.feed(html)

            found = len(parser.rates)
            if found < 5:
                raise ValueError(
                    f"Only {found} currencies parsed — HTML structure may have changed. "
                    f"Found: {list(parser.rates.keys())}"
                )

            print(f"  Parsed {found}/8 G10 currencies successfully")
            return parser.rates

        except urllib.error.HTTPError as e:
            last_error = f"HTTP {e.code}: {e.reason}"
            print(f"  WARN attempt {attempt}: {last_error}")
        except urllib.error.URLError as e:
            last_error = f"URLError: {e.reason}"
            print(f"  WARN attempt {attempt}: {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"  WARN attempt {attempt}: {last_error}")

        if attempt < retries:
            print(f"  Waiting {delay}s before retry...")
            time.sleep(delay)

    raise RuntimeError(f"All {retries} attempts failed. Last error: {last_error}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    output_path = Path(__file__).parent.parent / "public" / "cb-rates.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("Fetching CB rates from global-rates.com...")

    scraped = {}
    scrape_ok = False
    scrape_error = None

    try:
        scraped   = scrape_global_rates()
        scrape_ok = True
    except Exception as e:
        scrape_error = str(e)
        print(f"\nFATAL: Scrape failed — {scrape_error}")
        if output_path.exists():
            print("Keeping existing cb-rates.json (will not overwrite with fallback)")
            # Exit 0 so the workflow doesn't fail and blow up the commit step
            sys.exit(0)
        else:
            print("No existing file — writing hardcoded fallback rates")
            scraped = {}

    # Merge: fallback fills any missing currencies (e.g. if 7/8 parsed)
    rates = {**FALLBACK, **scraped}

    result = {
        "rates":      rates,
        "source":     "global-rates.com" if scrape_ok else "fallback",
        "fetchedAt":  datetime.now(timezone.utc).isoformat(),
    }
    if scrape_error:
        result["scrapeError"] = scrape_error

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nWrote {output_path}")
    for ccy, rate in rates.items():
        src = "scraped" if ccy in scraped else "fallback"
        print(f"  {ccy}: {rate}  ({src})")

    if not scrape_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
