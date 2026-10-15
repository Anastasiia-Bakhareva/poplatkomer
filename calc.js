/* Výpočet poplatků ETF. Zrcadlí tax_model.py (měsíční model). Ilustrace, ne předpověď. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EtfCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var YEARS = 20, R_GROSS = 0.07, TAX_DIV = 0.15;

  // ter a y jako desetinná čísla (0.0007 = 0,07 %), monthly v Kč
  function finalValue(monthly, ter, taxDiv, y, years, rGross) {
    years = years || YEARS;
    rGross = rGross == null ? R_GROSS : rGross;
    var g = rGross - y, v = 0;
    for (var i = 0; i < years * 12; i++) {
      v += monthly;
      v *= Math.pow(1 + g, 1 / 12);
      v += v * (y / 12) * (1 - taxDiv);
      v -= v * (ter / 12);
    }
    return v;
  }

  // Cena poplatku za N let = hodnota bez poplatku − hodnota s poplatkem (stejná daň u obou)
  function feeCost(monthly, terPct, y, years) {
    var a = finalValue(monthly, 0, TAX_DIV, y, years);
    var b = finalValue(monthly, terPct / 100, TAX_DIV, y, years);
    return a - b;
  }

  function paidIn(monthly, years) { return monthly * 12 * (years || YEARS); }

  function fmtCzk(n) {
    var r = Math.round(n / 100) * 100 >= 10000 ? Math.round(n / 100) * 100 : Math.round(n);
    return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kč";
  }
  function fmtPct(p) { // 0.0945 -> "0,0945 %" ; 0.07 -> "0,07 %"
    var s = String(+p.toFixed(4)); if (s.indexOf(".") < 0) s += ".00"; else if (s.split(".")[1].length < 2) s += "0";
    return s.replace(".", ",") + " %";
  }

  return { finalValue: finalValue, feeCost: feeCost, paidIn: paidIn, fmtCzk: fmtCzk, fmtPct: fmtPct, YEARS: YEARS, TAX_DIV: TAX_DIV };
});
