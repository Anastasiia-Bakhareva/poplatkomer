// Přijme e-mail jako záznam žádosti o přehled. Marketingový souhlas se tu nesbírá (vždy false);
// zprávy jen po samostatném souhlasu (budoucí double opt-in přes ESP, zde není implementován).
const RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const CONSENT_TEXT_VERSION = "2026-10-v3";
const s = (x, n) => (x == null ? null : String(x).slice(0, n));
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (b && b.website) return res.status(204).end(); // honeypot: tvářit se, že vše prošlo
  if (!b || typeof b.email !== "string" || b.email.length > 254 || !RE.test(b.email.trim())) return res.status(400).json({ error: "invalid_email" });
  const u = b.utm || {};
  const rec = {
    email: b.email.trim().toLowerCase(),
    marketing_consent: false,
    consent_text_version: CONSENT_TEXT_VERSION,
    requested_at: new Date().toISOString(),
    variant: b.v === "b" ? "b" : "a", amount: [3000, 5000, 8000].includes(b.amount) ? b.amount : null, loc: s(b.loc, 20),
    sid: s(b.sid, 32),
    utm: { source: s(u.source, 100), medium: s(u.medium, 100), campaign: s(u.campaign, 100), content: s(u.content, 100) }
  };
  console.log("LEAD " + JSON.stringify({ ...rec, email: rec.email.replace(/^(.).*(@.*)$/, "$1***$2") })); // v logu maskovaný
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    try {
      const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) });
      if (!r.ok) return res.status(502).json({ error: "upstream" });
    } catch (e) { return res.status(502).json({ error: "upstream" }); }
  }
  return res.status(200).json({ ok: true });
};
