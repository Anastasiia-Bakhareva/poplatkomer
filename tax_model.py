"""Daňový model pro Poplatkoměr (zrcadlí calc.js). Ilustrace, ne předpověď.

Spuštění:  python3 tax_model.py            -> vypíše výsledky a zkontroluje data/tax_model.json
           python3 tax_model.py --write    -> přepíše data/tax_model.json

Měsíční krok:  v += vklad; v *= (1+g)^(1/12); v += v*(y/12)*(1-daň); v -= v*(ter/12),  g = 0,07 - y
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MONTHLY, YEARS, R_GROSS = 5000, 20, 0.07
YIELDS = {"S&P 500": 0.0106, "MSCI World (Net)": 0.0138, "MSCI Emerging Markets IMI (Net)": 0.0219}
TAX = {"US ETF with W-8BEN": 0.15, "US ETF no W-8BEN": 0.30, "UCITS accumulating": 0.15,
       "UCITS distributing": round(1 - 0.85 * 0.85, 4)}  # 0,2775


def final_value(monthly, ter, tax_div, y, years=YEARS, r_gross=R_GROSS):
    g, v = r_gross - y, 0.0
    for _ in range(years * 12):
        v += monthly
        v *= (1 + g) ** (1 / 12)
        v += v * (y / 12) * (1 - tax_div)
        v -= v * (ter / 12)
    return v


def build():
    data = json.loads((ROOT / "data/etf_data.json").read_text(encoding="utf-8"))
    results = []
    for p in data["pairs"]:
        y, us, uc = YIELDS[p["index"]], p["us"]["ter_pct"] / 100, p["ucits"]["ter_pct"] / 100
        final = {
            "US ETF, with W-8BEN": final_value(MONTHLY, us, TAX["US ETF with W-8BEN"], y),
            "US ETF, no W-8BEN": final_value(MONTHLY, us, TAX["US ETF no W-8BEN"], y),
            "UCITS accumulating": final_value(MONTHLY, uc, TAX["UCITS accumulating"], y),
            "UCITS distributing (same TER)": final_value(MONTHLY, uc, TAX["UCITS distributing"], y),
        }
        final = {k: round(v) for k, v in final.items()}
        best = max(final.values())
        results.append({"pair": p["us"]["ticker"] + " vs " + p["ucits"]["ticker"], "paid_in_czk": MONTHLY * 12 * YEARS,
                        "final_czk": final, "gap_vs_best_czk": {k: v - best for k, v in final.items()}})
    return results


if __name__ == "__main__":
    path = ROOT / "data/tax_model.json"
    current = json.loads(path.read_text(encoding="utf-8"))
    res = build()
    for r in res:
        print(r["pair"], r["final_czk"])
    if "--write" in sys.argv:
        current["results"] = res
        path.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("zapsáno:", path)
    else:
        diff = [(a["pair"], k, a["final_czk"][k], b["final_czk"][k]) for a, b in zip(res, current["results"])
                for k in a["final_czk"] if abs(a["final_czk"][k] - b["final_czk"][k]) > 1]
        print("shoda s data/tax_model.json:", "ANO" if not diff else diff)
        sys.exit(1 if diff else 0)
