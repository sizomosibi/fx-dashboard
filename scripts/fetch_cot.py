#!/usr/bin/env python3
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

CONTRACTS = {
    "EURO FX - CHICAGO MERCANTILE EXCHANGE": "EUR",
    "JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE": "JPY",
    "BRITISH POUND - CHICAGO MERCANTILE EXCHANGE": "GBP",
    "SWISS FRANC - CHICAGO MERCANTILE EXCHANGE": "CHF",
    "CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE": "CAD",
    "AUSTRALIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE": "AUD",
    "NZ DOLLAR - CHICAGO MERCANTILE EXCHANGE": "NZD",
    "USD INDEX - ICE FUTURES U.S.": "USD",
    "GOLD - COMMODITY EXCHANGE INC.": "XAU",
}

def http_get(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; FXDashboard-GHActions/1.0)",
            "Accept": "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def calc_net(oi, lng, sht):
    try:
        oi = float(oi or 0)
        if oi == 0: return None
        return round(((float(lng) - float(sht)) / oi) * 100)
    except (ValueError, TypeError):
        return None

def fetch_all_rows():
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
        f"&$limit=1000" # Increased limit to ensure we find all G10 + Gold
        f"&$select={cols}"
    )
    print(f"  GET {url}")
    return http_get(url)

def parse_rows(rows):
    by_contract = {}
    for row in rows:
        name = row.get("market_and_exchange_names", "").strip()
        if name not in by_contract:
            by_contract[name] = []
        if len(by_contract[name]) < 2:
            by_contract[name].append(row)

    cot = {}
    errors = {}
    as_of = None

    for contract_name, ccy in CONTRACTS.items():
        contract_rows = by_contract.get(contract_name, [])
        if not contract_rows:
            errors[ccy] = "not found"
            print(f"  WARN [{ccy}] mapping failed for: '{contract_name}'")
            continue

        row = contract_rows[0]
        net = calc_net(
            row.get("open_interest_all"),
            row.get("noncomm_positions_long_all"),
            row.get("noncomm_positions_short_all"),
        )
        
        if net is None:
            errors[ccy] = "invalid data"
            continue

        prev = net
        if len(contract_rows) > 1:
            prev_calc = calc_net(
                contract_rows[1].get("open_interest_all"),
                contract_rows[1].get("noncomm_positions_long_all"),
                contract_rows[1].get("noncomm_positions_short_all"),
            )
            prev = prev_calc if prev_calc is not None else net

        cot[ccy] = {"net": net, "prev": prev}
        if not as_of:
            as_of = row.get("report_date_as_yyyy_mm_dd")
        print(f"  OK   [{ccy}] net={net:+d}% (asOf: {row.get('report_date_as_yyyy_mm_dd')})")

    return cot, as_of, errors

def main():
    output_path = Path(__file__).parent.parent / "public" / "cot-data.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Starting COT Fetch: {datetime.now(timezone.utc).isoformat()}")
    
    try:
        rows = fetch_all_rows()
        cot, as_of, errors = parse_rows(rows)

        if not cot:
            print(f"FATAL: No contracts parsed. API likely empty or schema changed.")
            sys.exit(1)

        result = {
            "cot": cot,
            "asOf": as_of,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "source": "CFTC Socrata",
        }
        if errors:
            result["errors"] = errors

        with open(output_path, "w") as f:
            json.dump(result, f, indent=2)

        print(f"\nSUCCESS: Wrote {output_path}")
        print(f"As Of Date: {as_of}")

    except Exception as e:
        print(f"\nFATAL ERROR: {str(e)}")
        sys.exit(1) # Ensure GitHub Action reflects the failure

if __name__ == "__main__":
    main()