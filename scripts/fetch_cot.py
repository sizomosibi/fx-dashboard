#!/usr/bin/env python3
"""
Fetch CFTC COT data and write public/cot-data.json.

Runs via GitHub Actions every Friday at 4:30pm ET (21:30 UTC).
Uses urllib (stdlib only) — no pip install needed, URL sent exactly as-is.
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

CONTRACTS = {
    "EURO FX - CHICAGO MERCANTILE EXCHANGE":                "EUR",
    "JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE":           "JPY",
    "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE": "GBP",
    "SWISS FRANC - CHICAGO MERCANTILE EXCHANGE":            "CHF",
    "CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE":        "CAD",
    "AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE":      "AUD",
    "NZ DOLLAR - CHICAGO MERCANTILE EXCHANGE":     "NZD",
    "USD INDEX - ICE FUTURES U.S.":                 "USD",
    "GOLD - COMMODITY EXCHANGE INC.":                       "XAU",
}

# Using urllib.request — does NOT re-encode the URL string.
# requests.get(url_string) silently normalises/re-encodes even pre-encoded URLs.

def http_get(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; FXDashboard-GHActions/1.0)",
            "Accept":     "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_all_rows():
    # Build URL with literal $ — no library will touch this string.
    # Commas in $select are fine unencoded per Socrata docs.
    # Space in DESC must be %20.
    cols = ",".join([
        "market_and_exchange_names",
        "report_date_as_yyyy_mm_dd",
        "open_interest_all",
        "noncomm_positions_long_all",
        "noncomm_positions_short_all",
    ])
    url = (
        "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
        f"?$order=report_date_as_yyyy_mm_dd%20DESC"
        f"&$limit=500"
        f"&$select={cols}"
    )
    print(f"  GET {url}")
    data = http_get(url)
    if not isinstance(data, list):
        raise ValueError(f"Expected list, got: {json.dumps(data)[:300]}")
    print(f"  Fetched {len(data)} rows")

    return data


def calc_net(oi, lng, sht):
    oi = float(oi or 0)
    if oi == 0:
        return None
    return round(((float(lng) - float(sht)) / oi) * 100)


def parse_rows(rows):
    by_contract = {}
    for row in rows:
        name = row.get("market_and_exchange_names", "")
        if name not in by_contract:
            by_contract[name] = []
        if len(by_contract[name]) < 2:
            by_contract[name].append(row)

    cot    = {}
    errors = {}
    as_of  = None

    for contract_name, ccy in CONTRACTS.items():
        contract_rows = by_contract.get(contract_name, [])
        if not contract_rows:
            errors[ccy] = "not found in results"
            print(f"  WARN [{ccy}] not found: '{contract_name}'")
            continue

        row = contract_rows[0]
        net = calc_net(
            row.get("open_interest_all"),
            row.get("noncomm_positions_long_all"),
            row.get("noncomm_positions_short_all"),
        )
        if net is None:
            errors[ccy] = "zero open interest"
            continue

        prev = net
        if len(contract_rows) > 1:
            prev = calc_net(
                contract_rows[1].get("open_interest_all"),
                contract_rows[1].get("noncomm_positions_long_all"),
                contract_rows[1].get("noncomm_positions_short_all"),
            ) or net

        cot[ccy] = {"net": net, "prev": prev}
        if not as_of:
            as_of = row.get("report_date_as_yyyy_mm_dd")
        print(f"  OK  [{ccy}] net={net:+d}%  prev={prev:+d}%")

    return cot, as_of, errors


def main():
    output_path = Path(__file__).parent.parent / "public" / "cot-data.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("Fetching COT data from CFTC Socrata...")
    try:
        rows = fetch_all_rows()
    except urllib.error.HTTPError as e:
        body = e.read(500).decode("utf-8", errors="replace")
        print(f"FATAL: HTTP {e.code} {e.reason}")
        print(f"  Response body: {body}")
        if output_path.exists():
            print("Keeping existing cot-data.json")
            sys.exit(0)
        sys.exit(1)
    except Exception as e:
        print(f"FATAL: {e}")
        if output_path.exists():
            print("Keeping existing cot-data.json")
            sys.exit(0)
        sys.exit(1)

    cot, as_of, errors = parse_rows(rows)

    if not cot:
        print(f"FATAL: Parsed 0 contracts. Errors: {errors}")
        # Print first few rows to debug column names
        if rows:
            print(f"Sample row keys: {list(rows[0].keys())}")
            print(f"Sample row: {rows[0]}")
        sys.exit(1)

    result = {
        "cot":       cot,
        "asOf":      as_of,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source":    "CFTC Socrata via GitHub Actions",
    }
    if errors:
        result["errors"] = errors

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nWrote {output_path}")
    print(f"  {len(cot)}/9 contracts  |  asOf: {as_of}")
    if errors:
        print(f"  Errors: {errors}")


if __name__ == "__main__":
    main()