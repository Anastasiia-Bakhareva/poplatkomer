// Cookie-less měření cesty. Ukládá jen anonymní událost (náhodné sid v paměti prohlížeče, bez IP).
module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b.event !== "string" || b.event.length > 40) return res.status(400).end();
  const ALLOWED = ["page_view","section_view","amount_selected","fund_selected","cta_click","growth_fund","growth_scrub","quiz_answer","share_click","faq_open","form_focus","submit_attempt","submit_invalid","submit_api_error","submit_success","print_pdf"];
  if (!ALLOWED.includes(b.event)) return res.status(400).end();
  const rec = { e: b.event, sid: String(b.sid || "").slice(0, 32), v: b.v, amount: b.amount, fund: String(b.fund || "").slice(0, 12), t: b.t,
    utm_source: b.utm_source, utm_medium: b.utm_medium, utm_campaign: b.utm_campaign, utm_content: b.utm_content, loc: b.loc, sec: String(b.sec || "").slice(0, 40), cta: b.cta, via: b.via };
  console.log("EVENT " + JSON.stringify(rec)); // Vercel Logs; pro produkci napojit na EVENT_WEBHOOK_URL
  const hook = process.env.EVENT_WEBHOOK_URL;
  const done = () => res.status(204).end();
  if (!hook) return done();
  fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) }).catch(() => {}).then(done);
};
