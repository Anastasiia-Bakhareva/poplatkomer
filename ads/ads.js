(function () {
  "use strict";
  var C = window.EtfCalc, q = new URLSearchParams(location.search), v = q.get("v") === "b" ? "b" : "a";
  if (q.get("export")) document.body.classList.add("export");
  // Texty reklam přesně podle zadání (kap. 8); prostřední věta A doplněna, viz README.
  var AD = {
    a: { text: "Kolik stojí poplatky ETF za 20 let? Spočítali jsme to v korunách pro 10 fondů. Ilustrace, ne doporučení.", title: "Kolik stojí poplatky ETF za 20 let?", desc: "Data ze stránek správců fondů", cta: "Zjistit více" },
    b: { text: "VOO a SPY si drobný investor z Česka obvykle nekoupí. Jaký je jejich evropský dvojník a kolik stojí? Informativní přehled.", title: "Americké ETF a jejich evropští dvojníci", desc: "Poplatky u 5 párů fondů", cta: "Zobrazit srovnání" }
  }[v];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  $("post-text").textContent = AD.text; $("post-title").textContent = AD.title; $("post-desc").textContent = AD.desc; $("post-cta").textContent = AD.cta;
  document.title = "Poplatkoměr – reklama " + v.toUpperCase();
  var logo = '<svg class="logo" viewBox="0 0 40 24" aria-hidden="true"><rect x=".5" y=".5" width="39" height="23" rx="6"/><rect class="d" x="5" y="5" width="8" height="14" rx="1.5"/><rect class="d" x="16" y="5" width="8" height="14" rx="1.5"/><rect class="d r" x="27" y="5" width="8" height="14" rx="1.5"/></svg>';
  var tk = function (f) { return f.ticker.split(" ")[0]; };

  Promise.all([fetch("../data/etf_data.json").then(function (r) { return r.json(); }), fetch("../data/tax_model.json").then(function (r) { return r.json(); })]).then(function (a) {
    var D = a[0], M = a[1], m = M.assumptions.monthly_czk, ret = Math.round(M.assumptions.gross_return * 100);
    var pair = function (t) { return D.pairs.filter(function (p) { return tk(p.ucits) === t || tk(p.us) === t; })[0]; };
    var asof = "Data: stránky správců fondů, říjen 2026.";
    var html;
    if (v === "a") {
      var p = pair("IWDA"), fee = C.feeCost(m, p.ucits.ter_pct, M.assumptions.dividend_yields[p.index]);
      var r = Math.round(fee / 100) * 100, digits = String(r).padStart(6, "0"), n = Math.round(fee / m), lead = true;
      var wheels = digits.split("").map(function (d, i) { if (d !== "0") lead = false; return '<span class="w' + (lead ? " lead" : "") + (i === 2 ? " gap" : "") + '">' + d + "</span>"; }).join("");
      var dots = ""; for (var k = 0; k < 240; k++) dots += "<i" + (k >= 240 - n ? ' class="on"' : "") + "></i>";
      html = '<div class="cr-top">' + logo + "<b>Poplatkoměr</b></div>" +
        '<h1 class="cr-h">Kolik stojí poplatky ETF <em>za 20&nbsp;let?</em></h1>' +
        '<div class="cr-meter"><div class="cr-mh"><span>Poplatky za 20 let</span><span>' + esc(tk(p.ucits)) + ", celý svět</span></div>" +
        '<div class="cr-dial">' + wheels + '<span class="unit">Kč</span></div>' +
        '<div class="cr-waffle"><span class="wf">' + dots + '</span><span class="cr-stat"><b>' + n + " z 240</b>vašich měsíčních vkladů sní poplatky</span></div>" +
        '<p class="cr-sub">Poplatek ' + C.fmtPct(p.ucits.ter_pct) + " ročně, vklad " + C.fmtCzk(m) + " měsíčně</p></div>" +
        '<p class="cr-fine">Ilustrace, ne doporučení. Výpočet: ' + ret + "&nbsp;% hrubý výnos ročně, daň z dividend 15&nbsp;%. Minulá výkonnost nezaručuje budoucí výsledky. " + asof + "</p>";
    } else {
      var rows = ["SPY", "IVV", "URTH"].map(function (t) {
        var p = pair(t), idx = { "S&P 500": "500 firem USA", "MSCI World (Net)": "celý svět" }[p.index] || p.index;
        return '<div class="cr-pair"><div class="f us"><b>' + esc(t) + "</b><span>" + C.fmtPct(p.us.ter_pct) + "</span><small>" + esc(idx) + "</small></div>" +
          '<svg class="arr" viewBox="0 0 48 24" aria-hidden="true"><path d="M2 12h40M32 4l10 8-10 8"/></svg>' +
          '<div class="f uc ' + ({ SPY: "ix-sp", IVV: "ix-sp2", URTH: "ix-world" }[t]) + '"><b>' + esc(tk(p.ucits)) + "</b><span>" + C.fmtPct(p.ucits.ter_pct) + "</span><small>" + esc(idx) + "</small></div></div>";
      }).join("");
      html = '<div class="cr-top">' + logo + "<b>Poplatkoměr</b></div>" +
        '<h1 class="cr-h">Americké ETF a jejich <em>evropští dvojníci</em></h1>' +
        '<div class="cr-pairs"><div class="cr-ph"><span>Americký fond, v EU obvykle nedostupný</span><span>Evropský dvojník na stejný index</span></div>' + rows + "</div>" +
        '<p class="cr-sub b">Poplatky ročně. Celkem 5 párů v přehledu.</p>' +
        '<p class="cr-fine">Informativní přehled, ne doporučení. Dostupnost ověřte u svého zprostředkovatele. ' + asof + "</p>";
    }
    $("creative").innerHTML = html; $("creative").classList.add(v);
    document.body.setAttribute("data-ready", "1");
  });
})();
