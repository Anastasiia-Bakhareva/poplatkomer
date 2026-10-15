// Export reklam A a B: kreativa 1080 × 1350 (PNG) a náhled příspěvku. Spuštění: npm run ads → ads/export/
const { chromium } = require("playwright-core");
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const L = path.resolve(__dirname, ".."), OUT = path.join(L, "ads/export"); fs.mkdirSync(OUT, { recursive: true });
const C = require(path.join(L, "calc.js")), D = require(path.join(L, "data/etf_data.json")), M = require(path.join(L, "data/tax_model.json"));
const EXE = process.env.CHROMIUM_PATH || undefined, PORT = 4311, BASE = "http://127.0.0.1:" + PORT;
let fail = 0; const ok = (n, c, info) => { console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(info))); if (!c) fail++; };
(async () => {
  const srv = spawn("node", [path.join(__dirname, "dev.js"), L, PORT], { stdio: ["ignore", "pipe", "inherit"] }); await new Promise(r => srv.stdout.once("data", r));
  const br = await chromium.launch(EXE ? { executablePath: EXE } : {});
  try {
    for (const v of ["a", "b"]) {
      const errs = [];
      const ex = await (await br.newContext({ viewport: { width: 1080, height: 1350 } })).newPage();
      ex.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
      await ex.goto(`${BASE}/ads/reklama.html?v=${v}&export=1`); await ex.waitForSelector("body[data-ready]"); await ex.evaluate(() => document.fonts.ready);
      await (await ex.$("#creative")).screenshot({ path: path.join(OUT, `reklama-${v}-1080x1350.png`) });
      ok(`${v.toUpperCase()}: vše uvnitř 1080 × 1350 (vč. upozornění)`, await ex.$eval("#creative", c => { const r = c.getBoundingClientRect(); return [...c.querySelectorAll("*")].every(e => e.getBoundingClientRect().bottom <= r.bottom - 40 + 0.5) && c.scrollHeight <= c.clientHeight; }));
      if (v === "a") {
        const p = D.pairs.find(p => p.ucits.ticker.startsWith("IWDA")), fee = C.feeCost(M.assumptions.monthly_czk, p.ucits.ter_pct, M.assumptions.dividend_yields[p.index]);
        const shown = await ex.$$eval(".cr-dial .w", ws => ws.map(w => w.textContent).join(""));
        ok("A: číselníky = model (IWDA)", +shown === Math.round(fee / 100) * 100, [shown, fee]);
        ok("A: 12 z 240 = model", (await ex.textContent(".cr-stat b")) === Math.round(fee / M.assumptions.monthly_czk) + " z 240");
      } else {
        const t = await ex.textContent("#creative");
        ok("B: TER z dat", ["SPY", "SPYL", "IVV", "CSPX", "URTH", "IWDA"].every(x => t.includes(x)) && t.includes(C.fmtPct(0.0945)) && t.includes(C.fmtPct(0.24)));
      }
      const pv = await (await br.newContext({ viewport: { width: 440, height: 900 }, deviceScaleFactor: 2 })).newPage();
      pv.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
      await pv.goto(`${BASE}/ads/reklama.html?v=${v}`); await pv.waitForSelector("body[data-ready]"); await pv.evaluate(() => document.fonts.ready);
      await (await pv.$("#post")).screenshot({ path: path.join(OUT, `reklama-${v}-nahled-prispevku.png`) });
      ok(`${v.toUpperCase()}: bez chyb konzole (vč. CSP)`, errs.length === 0, errs);
    }
  } finally { await br.close(); srv.kill(); }
  console.log(fail ? `\n${fail} FAIL` : "\nVŠE OK"); process.exit(fail ? 1 : 0);
})();
