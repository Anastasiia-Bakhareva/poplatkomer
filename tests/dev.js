// Mini Vercel pro testy: statika + /api/*.js + hlavičky z vercel.json. Použití: node tests/dev.js [root] [port]
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[2] || path.join(__dirname, "..")), port = +process.argv[3] || 4310;
const hdrs = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"))).headers[0].headers;
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2" };
global.LOG = [];
const ol = console.log; console.log = (...a) => { LOG.push(a.join(" ")); ol(...a); };
http.createServer((req, res) => {
  hdrs.forEach(h => res.setHeader(h.key, h.value));
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__log") { res.end(JSON.stringify(LOG)); return; }
  if (u.pathname.startsWith("/api/")) {
    let body = ""; req.on("data", c => body += c); req.on("end", () => {
      const fn = require(path.join(root, u.pathname + ".js"));
      const r = { status(c) { res.statusCode = c; return r; }, json(o) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return r; }, end() { res.end(); return r; } };
      let b = body; try { b = JSON.parse(body); } catch (e) {}
      fn({ method: req.method, body: b }, r);
    }); return;
  }
  let f = path.join(root, u.pathname === "/" ? "index.html" : u.pathname);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.statusCode = 404; res.end(); return; }
  res.setHeader("Content-Type", T[path.extname(f)] || "application/octet-stream"); fs.createReadStream(f).pipe(res);
}).listen(port, () => ol("listening " + port));
