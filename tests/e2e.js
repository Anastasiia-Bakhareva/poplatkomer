// E2E kontrola podle checklistu zadání (390 a 1280 px, varianty A i B, hlavičky CSP z vercel.json).
// Spuštění: npm run test:e2e   (prohlížeč: npx playwright-core@1.63.0 install chromium, nebo CHROMIUM_PATH=/cesta/k/chrome)
// Výstup (screenshoty, PDF): tests/out/
const { chromium } = require("playwright-core");
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const L = path.resolve(__dirname, ".."), OUT = path.resolve(process.argv[2] || path.join(__dirname, "out")); fs.mkdirSync(OUT, { recursive: true });
const C = require(path.join(L, "calc.js")), D = require(path.join(L, "data/etf_data.json")), M = require(path.join(L, "data/tax_model.json"));
const EXE = process.env.CHROMIUM_PATH || undefined; // bez proměnné použije prohlížeč nainstalovaný přes playwright-core
const ter = t => D.pairs.map(p => [p.us, p.ucits]).flat().find(f => f.ticker.split(" ")[0] === t).ter_pct;
const yld = t => M.assumptions.dividend_yields[D.pairs.find(p => [p.us.ticker, p.ucits.ticker].some(x => x.split(" ")[0] === t)).index];
const PORT = 4310, BASE = "http://127.0.0.1:" + PORT;
let fail = 0; const ok = (n, c, info) => { console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(info))); if (!c) fail++; };
const fee = (tick, amt) => { for (const p of D.pairs) for (const s of ["us", "ucits"]) if (p[s].ticker.split(" ")[0] === tick) return C.fmtCzk(C.feeCost(amt, p[s].ter_pct, M.assumptions.dividend_yields[p.index])); };
(async () => {
  const srv = spawn("node", [path.join(__dirname, "dev.js"), L, PORT], { stdio: ["ignore", "pipe", "inherit"] });
  await new Promise(r => srv.stdout.once("data", r));
  const br = await chromium.launch(EXE ? { executablePath: EXE } : {});
  try {
    for (const [w, h, mob] of [[390, 844, true], [1280, 900, false]]) for (const v of ["a", "b"]) {
      const tag = `${w}-${v}`;
      const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob });
      const pg = await ctx.newPage(); const errs = [];
      pg.on("console", m => { if (m.type() === "error") errs.push(m.text()); }); pg.on("pageerror", e => errs.push(String(e)));
      await pg.goto(`${BASE}/?v=${v}&utm_source=meta&utm_medium=paid&utm_campaign=test&utm_content=${v}`);
      await pg.waitForSelector("#bars .bar"); await pg.waitForTimeout(1300);
      ok(`${tag} bez horiz. scrollu`, await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), await pg.evaluate(() => [document.documentElement.scrollWidth, innerWidth]));
      const h1 = await pg.evaluate(() => [...document.querySelectorAll("h1")].filter(e => e.offsetParent).map(e => e.textContent));
      ok(`${tag} H1`, h1.length === 1 && h1[0] === (v === "a" ? "Zjistěte, kolik vás za 20 let stojí poplatky ETF" : "Najděte evropského dvojníka amerického ETF"), h1);
      const exp = v === "a" ? ["SPYL", "CSPX", "IWDA", "EIMI"] : ["SPY", "SPYL", "IVV", "CSPX", "URTH", "IWDA"];
      for (const amt of [3000, 5000, 8000]) {
        await pg.click(`.amt-hero button[data-amount="${amt}"]`); await pg.waitForTimeout(1000);
        const vals = await pg.$$eval("#bars .bar-val", e => e.map(x => x.textContent));
        ok(`${tag} hero ${amt}`, JSON.stringify(vals) === JSON.stringify(exp.map(t => fee(t, amt))), { vals, exp: exp.map(t => fee(t, amt)) });
        {
          const m = await pg.evaluate(() => [document.getElementById("meter-read").textContent, [...document.querySelectorAll(".w .strip")].map(s => Math.round(-parseFloat(s.style.transform.replace("translateY(", "")) / 10)).join("")]);
          ok(`${tag} měřák ${amt} = IWDA`, m[0] === fee("IWDA", amt) && +m[1] === +fee("IWDA", amt).replace(/\D/g, ""), m);
        }
      }
      {
        await pg.click("#bars .bar >> nth=0"); await pg.waitForTimeout(300);
        ok(`${tag} klik na fond přepne měřák`, (await pg.textContent("#meter-read")) === fee(exp[0], 8000) && (await pg.getAttribute("#bars .bar >> nth=0", "aria-pressed")) === "true");
        const iw = await pg.$$eval("#bars .bar", (els) => els.findIndex(e => /IWDA/.test(e.textContent)));
        await pg.click(`#bars .bar >> nth=${iw}`);
        await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(400);
      }
      {
        await pg.$eval("#growth-year", e => { e.value = 7; e.dispatchEvent(new Event("input", { bubbles: true })); });
        const gr = await pg.textContent("#growth-read");
        ok(`${tag} graf růstu rok 7 IWDA`, gr.includes(C.fmtCzk(C.feeCost(8000, ter("IWDA"), yld("IWDA"), 7))) && gr.includes(C.fmtCzk(C.feeCost(8000, ter("IWDA"), yld("IWDA"), 20))), gr);
        await pg.click('.g-fund[data-fund="EIMI"]');
        ok(`${tag} graf přepne fond`, (await pg.textContent("#growth-read")).includes(C.fmtCzk(C.feeCost(8000, ter("EIMI"), yld("EIMI"), 7))));
        ok(`${tag} graf má 4 křivky`, (await pg.$$("#growth-svg .gline")).length === 4);
        const eqT = await pg.textContent("#meter-big"), n = Math.round(C.feeCost(8000, ter("IWDA"), yld("IWDA")) / 8000);
        ok(`${tag} měřák: přepočet na vklady`, eqT === n + " z 240", eqT);
        ok(`${tag} finální výpočet = měřák`, (await pg.textContent("#final-calc")).includes(fee("IWDA", 8000)), await pg.textContent("#final-calc"));
        await pg.click('.q[data-q="1"] .qa[data-ok="1"]'); await pg.click('.q[data-q="2"] .qa[data-ok="0"] >> nth=0'); await pg.click('.q[data-q="3"] .qa[data-ok="1"]');
        ok(`${tag} kvíz 2 ze 3`, (await pg.textContent("#quiz-score")) === "3 ze 3" && /^2 ze 3/.test(await pg.textContent("#quiz-result-t")), await pg.textContent("#quiz-result-t"));
        const q2 = C.feeCost(M.assumptions.monthly_czk, ter("IWDA"), yld("IWDA")), k = Math.pow(10, Math.floor(Math.log10(q2)));
        ok(`${tag} kvíz otázka 2 = model`, (await pg.textContent('.q[data-q="2"] .qa.correct')) === "zhruba " + C.fmtCzk(Math.round(q2 / k) * k));
        await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(400);
      }
      {
        const fl = await pg.$$eval("[data-fill]", es => es.map(e => e.getAttribute("data-fill") + "=" + e.textContent));
        const t = D.pairs.map(p => p.ucits.ter_pct);
        const exp = ["ter-min=" + C.fmtPct(Math.min(...t)), "ter-max=" + C.fmtPct(Math.max(...t)), "q2-ter=" + C.fmtPct(ter("IWDA")), "q2-amt=" + C.fmtCzk(M.assumptions.monthly_czk)];
        ok(`${tag} čísla v textu z dat`, exp.every(x => fl.includes(x)), fl);
        ok(`${tag} čísla v „Pro koho“ v řádku s textem`, await pg.$$eval('.pains [data-fill]', es => es.every(e => getComputedStyle(e).display === "inline")));
        if (w > 700) ok(`${tag} FAQ na celou šířku obsahu`, await pg.$eval(".faq-list", e => Math.abs(e.getBoundingClientRect().width - e.closest(".wrap").getBoundingClientRect().width + parseFloat(getComputedStyle(e.closest(".wrap")).paddingLeft) * 2) < 2));
        ok(`${tag} CTA bez slibu odeslání`, !(await pg.evaluate(() => /Poslat mi/.test(document.body.innerText))));
      }
      const heroTxt = await pg.$eval(".hero", e => e.innerText);
      ok(`${tag} hero bez VOO/VUAA`, !/VOO|VUAA/.test(heroTxt));
      ok(`${tag} náhled se vejde`, await pg.$eval("#prev-table", t => t.scrollWidth <= t.parentElement.clientWidth + 1), await pg.$eval("#prev-table", t => [t.scrollWidth, t.parentElement.clientWidth]));
      const prev = await pg.$$eval("#prev-table tbody tr", r => r.map(x => [x.className, x.innerText.replace(/\s+/g, " ")]));
      ok(`${tag} náhled 3+2, VOO poslední`, prev.length === 5 && prev.filter(r => r[0].split(" ").includes("hid")).length === 2 && /VOO/.test(prev[4][1]), prev);
      await pg.click(`.amt-hero button[data-amount="5000"]`); await pg.waitForTimeout(1000);
      await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(500);
      await pg.screenshot({ path: `${OUT}/${tag}-first.png` });
      await pg.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true });
      if (mob) {
        const stVis = () => pg.$eval("#sticky", e => !e.hidden && getComputedStyle(e).visibility !== "hidden");
        ok(`${tag} sticky skryté nahoře`, !(await stVis()));
        await pg.evaluate(() => document.getElementById("nahled").scrollIntoView()); await pg.waitForTimeout(500);
        ok(`${tag} sticky viditelné uprostřed`, await stVis());
        await pg.screenshot({ path: `${OUT}/${tag}-sticky.png` });
        await pg.evaluate(() => document.getElementById("final").scrollIntoView()); await pg.waitForTimeout(500);
        ok(`${tag} sticky skryté u formuláře`, !(await stVis()));
        await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(300);
      }
      await pg.click("#formular"); await pg.waitForTimeout(1500);
      ok(`${tag} hero CTA -> fokus v poli`, await pg.evaluate(() => document.activeElement && document.activeElement.id === "email-final"));
      await pg.fill("#email-final", "spatny-email"); await pg.click("#formular-dole button[type=submit]"); await pg.waitForTimeout(200);
      ok(`${tag} chyba u neplatného`, await pg.$eval("#email-err", e => !e.hidden) && await pg.$eval("#email-final", e => e.getAttribute("aria-invalid") === "true"));
      await pg.screenshot({ path: `${OUT}/${tag}-invalid.png` });
      await pg.fill("#email-final", "test@example.cz"); await pg.click("#formular-dole button[type=submit]"); await pg.waitForTimeout(1200);
      const st = await pg.evaluate(() => ({ th: !document.getElementById("thanks").hidden, hero: getComputedStyle(document.querySelector(".hero")).display, fin: getComputedStyle(document.getElementById("final")).display, sticky: getComputedStyle(document.getElementById("sticky")).display, preview: getComputedStyle(document.getElementById("nahled")).display }));
      ok(`${tag} po odeslání přehled, ostatní skryté`, st.th && st.hero === "none" && st.fin === "none" && st.sticky === "none" && st.preview === "none", st);
      const extra = await pg.evaluate(() => ["rust", "kviz"].filter(id => document.getElementById(id)).map(id => id + ":" + getComputedStyle(document.getElementById(id)).display));
      ok(`${tag} po odeslání skrytý graf růstu a kvíz`, extra.every(x => x.endsWith(":none")), extra);
      const full = await pg.$$eval("#full-table tbody tr", r => r.map(x => x.innerText.replace(/\s+/g, " ")));
      ok(`${tag} přehled 5 párů / 10 ETF + ISIN`, full.length === 5 && D.pairs.every(p => full.some(t => t.includes(p.ucits.isin))), full.length);
      ok(`${tag} VOO s poznámkou`, full.some(t => /VOO/.test(t) && /ověřeny částečně/.test(t)));
      const tax = await pg.$eval("#taxbox", e => e.innerText.replace(/\s+/g, " "));
      ok(`${tag} typ fondu 41–81 tis. a 27 tis.`, /41 000 Kč až 81 000 Kč/.test(tax) && /27 000 Kč/.test(tax), tax);
      ok(`${tag} bez slibu e-mailu`, !/(pošleme|zašleme) (vám )?(přehled|kopii|PDF)/i.test(await pg.evaluate(() => document.body.innerText)));
      await pg.screenshot({ path: `${OUT}/${tag}-thanks.png`, fullPage: true });
      if (w === 390) ok(`${tag} po odeslání bez horiz. scrollu`, await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      ok(`${tag} bez chyb v konzoli (vč. CSP)`, errs.length === 0, errs);
      await ctx.close();
    }
    // tisk
    const ctx = await br.newContext(); const pg = await ctx.newPage(); await pg.goto(BASE + "/?v=a"); await pg.waitForSelector("#bars .bar");
    await pg.fill("#email-final", "tisk@example.cz"); await pg.click("#formular-dole button[type=submit]"); await pg.waitForTimeout(800);
    await pg.emulateMedia({ media: "print" }); await pg.pdf({ path: `${OUT}/prehled.pdf`, format: "A4" });
    ok("print: hero skryté", await pg.$eval(".hero", e => getComputedStyle(e).display === "none"));
    const log = JSON.parse(await (await fetch(BASE + "/__log")).text());
    const evs = new Set(log.filter(l => l.startsWith("EVENT")).map(l => JSON.parse(l.slice(6)).e));
    ok("události v logu", ["page_view", "section_view", "amount_selected", "cta_click", "form_focus", "submit_attempt", "submit_invalid", "submit_success"].concat(["fund_selected", "quiz_answer", "growth_fund", "growth_scrub"]).every(e => evs.has(e)), [...evs]);
    const lead = log.filter(l => l.startsWith("LEAD")).map(l => JSON.parse(l.slice(5)));
    ok("LEAD maskovaný + utm + v3", lead.length >= 4 && lead[0].email === "t***@example.cz" && lead[0].marketing_consent === false && lead[0].consent_text_version === "2026-10-v3" && lead[0].utm.source === "meta" && lead[0].loc === "final", lead[0]);
    const ff = log.filter(l => l.includes('"e":"form_focus"')).map(l => JSON.parse(l.slice(6)).loc);
    ok("form_focus loc hero", ff.includes("hero"), ff);
  } finally { await br.close(); srv.kill(); }
  console.log(fail ? `\n${fail} FAIL` : "\nVŠE OK"); process.exit(fail ? 1 : 0);
})();
