const sub = require("./api/subscribe.js"), ev = require("./api/event.js");
const mk = () => { const r = { code: 0, status(c) { r.code = c; return r; }, json(o) { r.body = o; return r; }, end() { return r; } }; return r; };
(async () => {
  let f = 0; const t = (n, ok) => { console.log(ok ? "ok  " : "FAIL", n); if (!ok) f++; };
  let r = mk(); await sub({ method: "POST", body: { email: "bad" } }, r); t("neplatný e-mail 400", r.code === 400);
  r = mk(); await sub({ method: "POST", body: { email: "a@b.cz", website: "x" } }, r); t("honeypot 204", r.code === 204);
  r = mk(); await sub({ method: "POST", body: { email: "A@B.cz", newsletter: false, v: "a" } }, r); t("platný 200", r.code === 200 && r.body.ok);
  r = mk(); await sub({ method: "GET" }, r); t("GET 405", r.code === 405);
  r = mk(); await ev({ method: "POST", body: { event: "page_view", sid: "x" } }, r); t("event 204", r.code === 204);
  r = mk(); await ev({ method: "POST", body: { event: "evil" } }, r); t("event neznámý 400", r.code === 400);
  process.exit(f ? 1 : 0);
})();
