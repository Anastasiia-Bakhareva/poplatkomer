(function () {
  "use strict";
  var C = window.EtfCalc;
  var NAME = { SPYL: "SPDR S&P 500", CSPX: "iShares Core S&P 500", VUAA: "Vanguard S&P 500", IWDA: "iShares Core MSCI World", EIMI: "iShares Core MSCI EM IMI",
    SPY: "SPDR S&P 500 (USA)", IVV: "iShares Core S&P 500 (USA)", URTH: "iShares MSCI World (USA)", VOO: "Vanguard S&P 500 (USA)", IEMG: "iShares Core MSCI EM (USA)" };
  var IDX = { "S&P 500": "500 největších firem USA", "MSCI World (Net)": "vyspělé trhy světa", "MSCI Emerging Markets IMI (Net)": "rozvojové trhy" };
  var IXC = { "S&P 500": "ix-sp", "MSCI World (Net)": "ix-world", "MSCI Emerging Markets IMI (Net)": "ix-em" }; // barevné kódování indexů
  // barva podle fondu (páru): tři fondy na S&P 500 mají tři odstíny modré, aby se daly rozlišit
  var FX = { "sp500-spdr": "ix-sp", "sp500-ishares": "ix-sp2", "sp500-vanguard": "ix-sp3", "msci-world": "ix-world", "msci-em-imi": "ix-em" };
  function fx(p) { return FX[p.id] || IXC[p.index]; }
  var IDXH = { "S&P 500": "500 firem USA", "MSCI World (Net)": "celý svět", "MSCI Emerging Markets IMI (Net)": "rozvojové trhy" }; // krátké popisky do hero
  var IDXS = { "S&P 500": "S&P 500", "MSCI World (Net)": "Svět", "MSCI Emerging Markets IMI (Net)": "Rozvoj. trhy" };
  var state = { amount: 5000, data: null, tax: null, sent: {}, via: "direct" };
  var $ = function (id) { return document.getElementById(id); };
  var all = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var params = new URLSearchParams(location.search);
  var variant = params.get("v") === "b" ? "b" : "a";
  var sid = Math.random().toString(36).slice(2) + Date.now().toString(36); // jen v paměti, bez cookies
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- měření celé cesty ---------- */
  function track(name, extra, once) {
    var key = once ? name + (extra && (extra.sec || extra.loc) ? ":" + (extra.sec || extra.loc) : "") : null;
    if (key) { if (state.sent[key]) return; state.sent[key] = 1; }
    var p = { event: name, sid: sid, v: variant, t: Date.now(), amount: state.amount };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) { if (params.get(k)) p[k] = params.get(k); });
    if (extra) for (var k in extra) p[k] = extra[k];
    (window.dataLayer = window.dataLayer || []).push(p);
    try {
      var body = JSON.stringify(p);
      if (!(navigator.sendBeacon && navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }))))
        fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    } catch (e) {}
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtDate(iso) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? (+m[3]) + ". " + (+m[2]) + ". " + m[1] : iso; }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } }
  function aum(n) { return n == null ? "neověřeno" : n >= 1e12 ? (n / 1e12).toFixed(2).replace(".", ",") + "\u00a0bil. USD" : (n < 1e10 ? (n / 1e9).toFixed(1).replace(".", ",") : Math.round(n / 1e9)) + "\u00a0mld. USD"; }
  function tk(p) { return p.ucits.ticker.split(" ")[0]; }
  function idxp(p) { return esc(IDX[p.index] || p.index); }
  function ordered() { var P = state.data.pairs.slice(); return P.filter(function (p) { return p.us.verification !== "partial" && p.ucits.verification !== "partial"; }).concat(P.filter(function (p) { return p.us.verification === "partial" || p.ucits.verification === "partial"; })); }
  function costs(p) { var y = state.tax.assumptions.dividend_yields[p.index]; return { us: C.feeCost(state.amount, p.us.ter_pct, y), uc: C.feeCost(state.amount, p.ucits.ter_pct, y) }; }

  /* ---------- hlavní graf: sloupce poplatků ---------- */
  function barRows() {
    var P = state.data.pairs, by = function (t, side) { return P.filter(function (p) { return (side === "us" ? p.us.ticker : tk(p)) === t; })[0]; }, rows = [];
    if (variant === "a") {
      ["SPYL", "CSPX", "IWDA", "EIMI"].forEach(function (t) { var p = by(t, "uc"); if (p) rows.push({ p: p, side: "uc" }); });
    } else {
      ["SPY", "IVV", "URTH"].forEach(function (t, i) { var p = by(t, "us"); if (p) { rows.push({ p: p, side: "us", gap: i > 0 }); rows.push({ p: p, side: "uc" }); } });
    }
    return rows;
  }
  function rowVal(r) { var c = costs(r.p); return r.side === "us" ? c.us : c.uc; }
  var barEls = [], sel = -1;
  function buildBars() {
    var box = $("bars"); box.innerHTML = ""; barEls = [];
    barRows().forEach(function (r) {
      if (r.gap) { var g = document.createElement("div"); g.className = "bar-gap"; box.appendChild(g); }
      var t = r.side === "us" ? r.p.us : r.p.ucits, tick = r.side === "us" ? t.ticker : tk(r.p);
      // řádek = tlačítko: vybere fond, jehož poplatky ukazuje měřák
      var el = document.createElement("button"); el.type = "button"; el.className = "bar " + (r.side === "us" ? "us" : "uc") + " " + fx(r.p);
      // jeden řádek: ticker + krátký index, sloupec, částka (popisky přímo u dat, ne jen barvou)
      var lab = r.side === "us" ? "americký" : IDXH[r.p.index];
      el.setAttribute("aria-label", (NAME[tick] || tick) + " (" + tick + "), poplatek " + C.fmtPct(t.ter_pct) + " ročně" + (r.side === "us" ? ", v EU obvykle nedostupný" : ""));
      el.innerHTML = '<span class="bar-name"><b>' + esc(tick) + " <em>" + C.fmtPct(t.ter_pct) + "</em></b><span>" + esc(lab) + '</span></span><span class="track"><i></i></span><b class="bar-val"></b>';
      el.setAttribute("data-i", barEls.length);
      box.appendChild(el); barEls.push({ el: el, r: r, tick: tick, name: NAME[tick] || tick });
    });
    // výchozí fond na měřáku: IWDA (fond na celý svět, u začátečníků nejčastější volba)
    var d = 0; barEls.forEach(function (b, i) { if (b.tick === "IWDA") d = i; });
    selectBar(d);
  }
  function selectBar(i) {
    sel = i;
    barEls.forEach(function (b, k) { b.el.setAttribute("aria-pressed", k === i); b.el.classList.toggle("is-sel", k === i); });
    updateMeter();
  }
  function updateBars() {
    var vals = barEls.map(function (b) { return rowVal(b.r); }), max = Math.max.apply(null, vals);
    barEls.forEach(function (b, i) {
      var fill = b.el.querySelector("i");
      b.el.querySelector(".bar-val").textContent = C.fmtCzk(vals[i]);
      requestAnimationFrame(function () { fill.style.width = Math.max(3, vals[i] / max * 100).toFixed(1) + "%"; });
    });
    updateMeter();
  }

  /* ---------- měřák: šest číselníků jako na vodoměru ---------- */
  var wheels = [];
  function buildMeter() {
    var dial = $("meter-wheels"); if (!dial) return; dial.innerHTML = ""; wheels = [];
    for (var i = 0; i < 6; i++) {
      var w = document.createElement("span"); w.className = "w" + (i === 2 ? " gap" : "");
      var strip = document.createElement("span"); strip.className = "strip";
      for (var d = 0; d <= 9; d++) { var n = document.createElement("span"); n.textContent = d; strip.appendChild(n); }
      w.appendChild(strip); dial.appendChild(w); wheels.push(w);
    }
    // 240 teček = 240 měsíčních vkladů za 20 let (řádek = 2 roky)
    var wf = $("waffle"); if (wf) { var h = ""; for (var k = 0; k < 240; k++) h += "<i></i>"; wf.innerHTML = h; }
  }
  function updateMeter() {
    if (!wheels.length || sel < 0 || !barEls[sel]) return;
    var b = barEls[sel], v = rowVal(b.r);
    var r = Math.round(v / 100) * 100 >= 10000 ? Math.round(v / 100) * 100 : Math.round(v); // stejné zaokrouhlení jako fmtCzk
    var digits = String(r).padStart(6, "0"), lead = true;
    wheels.forEach(function (w, i) {
      var d = +digits[i]; if (d !== 0 || i === 5) lead = false;
      w.classList.toggle("lead", lead);
      w.firstChild.style.transform = "translateY(" + (-d * 10) + "%)";
    });
    $("meter-read").textContent = C.fmtCzk(v);
    $("meter-fund").textContent = b.tick + (b.r.side === "us" ? ", USA" : ", " + IDXH[b.r.p.index]);
    // přepočet na „kolik vašich měsíčních vkladů“ (z modelu, ne odhad) + tečky
    var n = Math.min(240, Math.round(v / state.amount));
    var big = $("meter-big");
    if (big) { big.textContent = (n < 1 ? "<1" : n) + " z 240"; $("meter-eq").textContent = "vašich měsíčních vkladů sní poplatky"; }
    else $("meter-eq").innerHTML = "<b>" + (n < 1 ? "méně než 1" : n) + " z 240</b> vašich měsíčních vkladů sní poplatky";
    var dots = $("waffle") ? $("waffle").children : [];
    for (var k = 0; k < dots.length; k++) dots[k].className = k >= 240 - n ? "on" : "";
    var fc = $("final-calc"); if (fc) fc.innerHTML = "Váš výpočet: <b>" + esc(b.tick) + "</b> při vkladu " + C.fmtCzk(state.amount) + " měsíčně, poplatky za 20 let <b>" + C.fmtCzk(v) + "</b>. V přehledu uvidíte všech 10 fondů vedle sebe a dopad daní.";
    var sv = $("st-val"); if (sv) sv.innerHTML = esc(b.tick) + "<b>" + C.fmtCzk(v) + "</b>";
  }

  /* ---------- tabulky ---------- */
  function compactRow(p, hidden, max) {
    var c = costs(p), w = function (v) { return Math.max(3, v / max * 100).toFixed(1); }; // šířka se nastaví v JS (CSP zakazuje style="")
    return "<tr class=\"" + fx(p) + (hidden ? ' hid" aria-hidden="true"' : '"') + "><td><span class=\"ixd " + fx(p) + "\"></span>" + esc(IDXS[p.index] || p.index) + "</td>" +
      "<td><b>" + esc(p.us.ticker) + "</b><small>" + C.fmtPct(p.us.ter_pct) + '<span class="x"> ročně</span></small></td>' +
      "<td><b>" + esc(tk(p)) + "</b><small>" + C.fmtPct(p.ucits.ter_pct) + '<span class="x"> ročně, ' + (p.ucits.accumulating ? "akumulační" : "distribuční") + "</span></small></td>" +
      '<td class="num"><span class="two"><i>' + esc(p.us.ticker) + "</i><b>" + C.fmtCzk(c.us) + '</b><span class="mb us"><em data-w="' + w(c.us) + '"></em></span></span><span class="two"><i>' + esc(tk(p)) + "</i><b>" + C.fmtCzk(c.uc) + '</b><span class="mb"><em data-w="' + w(c.uc) + '"></em></span></span></td></tr>';
  }
  function renderCompact() {
    var P = ordered(), max = 0; P.forEach(function (p) { var c = costs(p); max = Math.max(max, c.us, c.uc); });
    var tb = $("prev-table").querySelector("tbody");
    tb.innerHTML = P.map(function (p, i) { return compactRow(p, i >= 3, max); }).join("");
    [].forEach.call(tb.querySelectorAll("em[data-w]"), function (e) { e.style.width = e.getAttribute("data-w") + "%"; });
  }
  function renderFull() {
    var m = state.amount, rows = "";
    ordered().forEach(function (p) {
      var c = costs(p), part = (p.us.verification === "partial" || p.ucits.verification === "partial") ? "<small>údaje ověřeny částečně (starší factsheet)</small>" : "";
      rows += "<tr><td><span class=\"ixd " + fx(p) + "\"></span>" + idxp(p) + part + "</td>" +
        "<td><b>" + esc(p.us.ticker) + "</b><small>poplatek " + C.fmtPct(p.us.ter_pct) + ", NYSE Arca</small><small>velikost " + aum(p.us.aum_usd) + "</small><small><a href=\"" + esc(p.us.source) + "\" target=\"_blank\" rel=\"noopener\">" + esc(host(p.us.source)) + "</a>, " + fmtDate(p.us.as_of) + "</small></td>" +
        "<td><b>" + esc(tk(p)) + "</b><small>" + esc(p.ucits.isin) + "</small><small>poplatek " + C.fmtPct(p.ucits.ter_pct) + ", " + (p.ucits.accumulating ? "akumulační" : "distribuční") + "</small><small>velikost " + aum(p.ucits.aum_usd) + (p.ucits.aum_scope ? " (třída)" : "") + (p.ucits.aum_as_of ? ", stav k " + fmtDate(p.ucits.aum_as_of) : "") + "</small><small><a href=\"" + esc(p.ucits.source) + "\" target=\"_blank\" rel=\"noopener\">" + esc(host(p.ucits.source)) + "</a>, " + fmtDate(p.ucits.as_of) + "</small></td>" +
        '<td class="num"><span class="two"><i>' + esc(p.us.ticker) + "</i><b>" + C.fmtCzk(c.us) + '</b></span><span class="two"><i>' + esc(tk(p)) + "</i><b>" + C.fmtCzk(c.uc) + "</b></span></td></tr>";
    });
    $("full-table").querySelector("tbody").innerHTML = rows;
    var t = state.tax, minG = 1e12, maxG = 0, maxFee = 0;
    t.results.forEach(function (r, i) {
      var g = (r.final_czk["UCITS accumulating"] - r.final_czk["UCITS distributing (same TER)"]) * m / t.assumptions.monthly_czk;
      minG = Math.min(minG, g); maxG = Math.max(maxG, g);
      var c = costs(state.data.pairs[i]); maxFee = Math.max(maxFee, Math.abs(c.uc - c.us));
    });
    var r2 = function (n) { return Math.round(n / 1000) * 1000; };
    $("taxbox").innerHTML = "<h3>Co je víc než poplatek: typ fondu</h3><p>U evropských fondů se stejným poplatkem vychází akumulační varianta za 20 let o <b>" + C.fmtCzk(r2(minG)) + " až " + C.fmtCzk(r2(maxG)) + "</b> lépe než distribuční (při vkladu " + C.fmtCzk(m) + " měsíčně). Největší rozdíl v poplatcích mezi americkým a evropským fondem v přehledu je jen <b>" + C.fmtCzk(r2(maxFee)) + "</b>. Zdanění: 15&nbsp;% srážka v USA na úrovni fondu; akumulační fond nevyplácí dividendy, takže dividendovou daň v ČR neplatíte do prodeje. Model je zjednodušený a nenahrazuje daňové poradenství.</p>";
  }

  /* ---------- volba částky ---------- */
  function amountHTML() {
    return '<span class="amt-l">Při vkladu měsíčně</span><div class="seg">' + [3000, 5000, 8000].map(function (a) {
      return '<button type="button" data-amount="' + a + '"' + (a === state.amount ? ' class="is-on" aria-pressed="true"' : "") + ">" + C.fmtCzk(a) + "</button>";
    }).join("") + "</div>";
  }
  function setAmount(a) {
    state.amount = a;
    all(".seg button[data-amount]").forEach(function (b) { var on = +b.getAttribute("data-amount") === a; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    updateBars(); renderCompact(); renderFull(); renderGrowth();
  }

  /* ---------- graf: jak poplatky rostou v čase (4 evropské fondy) ---------- */
  var G = { sel: "IWDA", year: 10, funds: [] }, GX0 = 10, GX1 = 590, GY0 = 232, GY1 = 34;
  function gx(n) { return GX0 + n * (GX1 - GX0) / 20; }
  function buildGrowth() {
    var box = $("growth-svg"); if (!box) return;
    G.funds = ["SPYL", "CSPX", "IWDA", "EIMI"].map(function (t) {
      var p = state.data.pairs.filter(function (q) { return tk(q) === t; })[0];
      return { t: t, p: p, ter: p.ucits.ter_pct, y: state.tax.assumptions.dividend_yields[p.index], ix: fx(p) };
    });
    $("growth-legend").innerHTML = G.funds.map(function (f) {
      return '<button type="button" class="g-fund ' + f.ix + '" data-fund="' + f.t + '"><i></i>' + esc(NAME[f.t]) + " <span>" + f.t + ", " + C.fmtPct(f.ter) + "</span></button>";
    }).join("");
    renderGrowth();
  }
  function kTick(v) { return v >= 1000 ? Math.round(v / 1000) + "\u00a0tis." : Math.round(v) + ""; }
  function renderGrowth() {
    var box = $("growth-svg"); if (!box || !G.funds.length) return;
    var m = state.amount, max = 0;
    G.funds.forEach(function (f) { f.v = []; for (var n = 0; n <= 20; n++) f.v.push(n ? C.feeCost(m, f.ter, f.y, n) : 0); max = Math.max(max, f.v[20]); });
    var step = Math.pow(10, Math.floor(Math.log10(max / 2))), top = Math.ceil(max / step / 2) * step * 2; // „hezké“ maximum osy
    var gy = function (v) { return GY0 - v / top * (GY0 - GY1); };
    var o = "";
    [0, top / 2, top].forEach(function (t) { o += '<line class="gl" x1="' + GX0 + '" x2="' + GX1 + '" y1="' + gy(t) + '" y2="' + gy(t) + '"/>' + (t ? '<text class="gt" x="' + GX0 + '" y="' + (gy(t) - 7) + '">' + kTick(t) + " Kč</text>" : ""); });
    [0, 5, 10, 15, 20].forEach(function (n) { o += '<text class="gt" x="' + gx(n) + '" y="' + (GY0 + 26) + '" text-anchor="' + (n === 0 ? "start" : n === 20 ? "end" : "middle") + '">' + (n ? n + ". rok" : "start") + "</text>"; });
    var selF = G.funds.filter(function (f) { return f.t === G.sel; })[0];
    var line = function (f) { return f.v.map(function (v, n) { return (n ? "L" : "M") + gx(n).toFixed(1) + " " + gy(v).toFixed(1); }).join(" "); };
    o += '<path class="ga ' + selF.ix + '" d="' + line(selF) + " L" + gx(20) + " " + GY0 + " L" + gx(0) + " " + GY0 + ' Z"/>';
    G.funds.forEach(function (f) { if (f !== selF) o += '<path class="gline dim ' + f.ix + '" d="' + line(f) + '"/>'; });
    o += '<path class="gline ' + selF.ix + '" d="' + line(selF) + '"/>';
    var yv = selF.v[G.year];
    o += '<line class="gm" x1="' + gx(G.year) + '" x2="' + gx(G.year) + '" y1="' + GY1 + '" y2="' + GY0 + '"/><circle class="gdot ' + selF.ix + '" cx="' + gx(G.year) + '" cy="' + gy(yv) + '" r="7"/>';
    box.innerHTML = o;
    [].forEach.call(document.querySelectorAll(".g-fund"), function (b) { var on = b.getAttribute("data-fund") === G.sel; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    var ratio = selF.v[20] / selF.v[10];
    $("growth-year-l").textContent = G.year + ". rok";
    $("growth-read").innerHTML = "<b>" + esc(NAME[selF.t]) + "</b> po " + G.year + (G.year === 1 ? " roce" : " letech") + ": <strong>" + C.fmtCzk(yv) + "</strong> na poplatcích. Za 20 let to je " + C.fmtCzk(selF.v[20]) + ", tedy zhruba " + ratio.toFixed(1).replace(".", ",") + "× víc než po 10 letech. Poplatek se strhává z rostoucí částky, proto roste rychleji než vklady.";
  }

  /* ---------- štítky zdrojů: web správce a nejnovější datum údaje (z etf_data.json) ---------- */
  function renderSources() {
    var box = $("src-dates"); if (!box) return; var H = {};
    state.data.pairs.forEach(function (p) { [p.us, p.ucits].forEach(function (f) {
      var h = host(f.source), d = (/(\d{4}-\d{2}-\d{2})/.exec(f.as_of || "") || [])[1] || "", part = f.verification === "partial";
      if (!H[h]) H[h] = { d: d, n: 0, part: false }; H[h].n++; if (d > H[h].d) H[h].d = d; H[h].part = H[h].part || part;
    }); });
    box.innerHTML = Object.keys(H).map(function (h) {
      return "<li" + (H[h].part ? ' class="part"' : "") + "><b>" + esc(h) + "</b><span>" + H[h].n + (H[h].n === 1 ? " údaj" : H[h].n < 5 ? " údaje" : " údajů") + ", k " + fmtDate(H[h].d) + (H[h].part ? ", ověřeno částečně" : "") + "</span></li>";
    }).join("");
  }

  /* ---------- kvíz: 3 otázky, odpovědi z dat ---------- */
  var Q = { done: 0, ok: 0 };
  // vyplní <span data-fill="…"> čísly z dat (v HTML nejsou natvrdo)
  function fill(k, t) { [].forEach.call(document.querySelectorAll('[data-fill="' + k + '"]'), function (e) { e.textContent = t; }); }
  function fillPains() {
    var ters = state.data.pairs.map(function (p) { return p.ucits.ter_pct; });
    fill("ter-min", C.fmtPct(Math.min.apply(null, ters))); fill("ter-max", C.fmtPct(Math.max.apply(null, ters)));
  }
  function buildQuiz() {
    var box = $("quiz-opts-2"); if (!box) return;
    var p = state.data.pairs.filter(function (q) { return tk(q) === "IWDA"; })[0];
    var m = state.tax.assumptions.monthly_czk, v = C.feeCost(m, p.ucits.ter_pct, state.tax.assumptions.dividend_yields[p.index]);
    fill("q2-ter", C.fmtPct(p.ucits.ter_pct)); fill("q2-amt", C.fmtCzk(m));
    var r = function (x) { var k = Math.pow(10, Math.floor(Math.log10(x)) - 0); return Math.round(x / k) * k; };
    box.innerHTML = [[r(v / 10), 0], [r(v), 1], [r(v * 10), 0]].map(function (o) {
      return '<button type="button" class="qa" data-ok="' + o[1] + '">zhruba ' + C.fmtCzk(o[0]) + "</button>";
    }).join("");
    $("quiz-exp-2").innerHTML = "Podle modelu " + C.fmtCzk(v) + " (IWDA, " + Math.round(state.tax.assumptions.gross_return * 100) + "&nbsp;% hrubý výnos ročně). Malé procento z rostoucí částky dělá za 20 let velké číslo.";
  }
  function answer(btn) {
    var q = btn.closest(".q"); if (q.classList.contains("answered")) return;
    var ok = btn.getAttribute("data-ok") === "1";
    q.classList.add("answered", ok ? "right" : "wrong");
    btn.classList.add("picked");
    [].forEach.call(q.querySelectorAll(".qa"), function (b) { b.disabled = true; if (b.getAttribute("data-ok") === "1") b.classList.add("correct"); });
    q.querySelector(".q-exp").hidden = false;
    Q.done++; if (ok) Q.ok++;
    track("quiz_answer", { sec: q.getAttribute("data-q") + (ok ? ":ok" : ":no") });
    $("quiz-score").textContent = Q.done + " ze 3";
    if (Q.done === 3) {
      var res = $("quiz-result"); res.hidden = false;
      $("quiz-result-t").textContent = Q.ok === 3 ? "3 ze 3. Máte dobrý přehled, v tabulce si ověříte detaily." : Q.ok + " ze 3. Přesně tohle přehled vysvětluje v korunách.";
    }
  }

  /* ---------- formuláře ---------- */
  function bindForms() {
    all(".lead-form").forEach(function (f) {
      var loc = f.getAttribute("data-loc"), em = f.elements.email, err = f.querySelector(".err"), btn = f.querySelector("button[type=submit]");
      // loc = odkud návštěvník k poli přišel: "hero" po kliknutí na tlačítko v hero, jinak "final"
      em.addEventListener("focus", function () { track("form_focus", { loc: state.via === "hero" ? "hero" : "final", via: state.via }, true); });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        track("submit_attempt", { loc: loc });
        var ok = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim()) && em.value.length <= 254;
        err.hidden = ok; em.setAttribute("aria-invalid", !ok);
        if (!ok) { track("submit_invalid", { loc: loc }); em.focus(); return; }
        btn.disabled = true; btn.textContent = "Načítám přehled…";
        var payload = { email: em.value.trim(), website: f.elements.website.value, newsletter: false, consent_text_version: "2026-10-v3",
          v: variant, amount: state.amount, loc: loc, sid: sid,
          utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign"), content: params.get("utm_content") } };
        fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); })
          .catch(function () { track("submit_api_error", { loc: loc }); })
          .then(function () {
            track("submit_success", { loc: loc });
            document.body.classList.add("done"); $("thanks").hidden = false; renderFull();
            window.scrollTo(0, 0);
            var h = $("thanks").querySelector("h2"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
          });
      });
    });
    $("print-btn").addEventListener("click", function () { track("print_pdf"); window.print(); });
    var sh = $("share-btn");
    if (sh) sh.addEventListener("click", function () {
      track("share_click");
      var url = location.origin + location.pathname + "?v=" + variant; // bez utm a bez osobních údajů
      if (navigator.share) { navigator.share({ title: "Poplatkoměr: kolik stojí poplatky ETF", url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { sh.textContent = "Odkaz zkopírován"; }, function () {});
    });
  }

  /* ---------- chování stránky ---------- */
  function bindPage() {
    document.addEventListener("click", function (e) {
      var qa = e.target.closest(".qa"); if (qa) { answer(qa); return; }
      var gf = e.target.closest(".g-fund"); if (gf) { G.sel = gf.getAttribute("data-fund"); track("growth_fund", { fund: G.sel }); renderGrowth(); return; }
      var fb = e.target.closest("#bars .bar");
      if (fb) { var fi = +fb.getAttribute("data-i"); if (fi !== sel) { track("fund_selected", { fund: barEls[fi].tick }); selectBar(fi); } return; }
      var b = e.target.closest(".seg button[data-amount]");
      if (b) { var a = +b.getAttribute("data-amount"); track("amount_selected", { amount: a }); setAmount(a); return; }
      var c = e.target.closest("[data-cta]");
      if (c) {
        state.via = c.getAttribute("data-cta");
        track("cta_click", { cta: state.via });
        e.preventDefault();
        var f = $("formular-dole"); f.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
        setTimeout(function () { f.elements.email.focus({ preventScroll: true }); }, 450);
      }
    });
    all("details").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) track("faq_open", { sec: d.querySelector("summary").textContent.slice(0, 30) }, true); }); });
    if (!("IntersectionObserver" in window)) return;
    var secObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) track("section_view", { sec: en.target.getAttribute("data-sec") || en.target.id }, true); });
    }, { threshold: 0.35 });
    all("[data-sec]").forEach(function (s) { secObs.observe(s); });
    // lepicí tlačítko: po odrolování hero CTA, schované u finálního formuláře
    var st = $("sticky"), heroGone = false, finalSeen = false;
    function upd() { st.hidden = !(heroGone && !finalSeen) || document.body.classList.contains("done"); }
    new IntersectionObserver(function (es) { var r = es[0]; heroGone = !r.isIntersecting && r.boundingClientRect.top < 0; upd(); }).observe($("formular"));
    new IntersectionObserver(function (es) { finalSeen = es[0].isIntersecting; upd(); }).observe($("final"));
  }

  /* ---------- start ---------- */
  Promise.all([fetch("data/etf_data.json").then(function (r) { return r.json(); }), fetch("data/tax_model.json").then(function (r) { return r.json(); })])
    .then(function (a) {
      state.data = a[0]; state.tax = a[1];
      all(".amt-light").forEach(function (n) { n.innerHTML = amountHTML(); });
      buildMeter(); buildBars(); updateBars(); renderCompact(); buildGrowth(); buildQuiz(); fillPains(); renderSources();
      var yr = $("growth-year");
      if (yr) yr.addEventListener("input", function () { G.year = +yr.value; renderGrowth(); track("growth_scrub", null, true); });
      bindForms(); bindPage();
      track("page_view", null, true);
    })
    .catch(function () { $("bars").textContent = "Data se nepodařilo načíst. Obnovte stránku."; });
})();
