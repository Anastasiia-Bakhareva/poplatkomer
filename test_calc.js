const C = require("./calc.js"), M = require("./data/tax_model.json"), D = require("./data/etf_data.json");
const Y = M.assumptions.dividend_yields;
let fail = 0;
const chk = (n, ok, info) => { if (!ok) { fail++; console.log("FAIL", n, info || ""); } else console.log("ok  ", n); };
const rows = [
  ["VOO vs VUAA", 0, 1], ["SPY vs SPYL", 1, 0] ];
// porovnání finálních hodnot se scénáři v JSON
D.pairs.forEach((p, i) => {
  const y = Y[p.index], r = M.results[i], m = M.assumptions.monthly_czk;
  const ter = x => x.ter_pct / 100;
  const us = C.finalValue(m, ter(p.us), 0.15, y), uc = C.finalValue(m, ter(p.ucits), 0.15, y);
  chk(r.pair + " US W8", Math.abs(us - r.final_czk["US ETF, with W-8BEN"]) < 1, us);
  chk(r.pair + " UCITS Acc", Math.abs(uc - r.final_czk["UCITS accumulating"]) < 1, uc);
});
chk("feeCost kladné", C.feeCost(5000, 0.07, 0.0106) > 0);
chk("feeCost roste s TER", C.feeCost(5000, 0.2, 0.0138) > C.feeCost(5000, 0.07, 0.0138));
console.log("SPY", Math.round(C.feeCost(5000, 0.0945, 0.0106)), "SPYL", Math.round(C.feeCost(5000, 0.03, 0.0106)), "CSPX", Math.round(C.feeCost(5000, 0.07, 0.0106)));
console.log(C.fmtPct(0.0945), C.fmtPct(0.07), C.fmtPct(0.2), C.fmtCzk(1200000), C.fmtCzk(12345.6));
process.exit(fail ? 1 : 0);
