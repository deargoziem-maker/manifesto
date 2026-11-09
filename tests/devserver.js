// Local only: serves the site plus /api/room, /api/group and a stub /api/track, backed by an
// in-memory database, so Play with friends can be tried in two browser tabs without Supabase.
//   node tests/devserver.js [port]
const http = require("http"), fs = require("fs"), path = require("path"), Module = require("module");
const { makeDb } = require("./fakedb");
const db = makeDb();
const real = Module._load;
Module._load = function (req, parent, ...r) {
  if (/_lib\/supabaseAdmin$/.test(req)) return { supabaseAdmin: () => db };
  return real.call(this, req, parent, ...r);
};
const root = path.join(__dirname, "..");
const handlers = { "/api/room": require("../api/room"), "/api/group": require("../api/group") };
const MIME = { ".html": "text/html", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".avif": "image/avif", ".js": "text/javascript", ".css": "text/css" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const h = handlers[u.pathname];
  if (h || u.pathname === "/api/track") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      res.status = (c) => { res.statusCode = c; return res; };
      res.send = (b) => res.end(b);
      if (!h) { res.setHeader("content-type", "application/json"); return res.end("{}"); }
      req.body = raw || undefined;
      h(req, res);
    });
    return;
  }
  let f = path.join(root, u.pathname === "/" ? "index.html" : decodeURIComponent(u.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("content-type", MIME[path.extname(f)] || "application/octet-stream");
  res.setHeader("cache-control", "no-store");
  fs.createReadStream(f).pipe(res);
}).listen(Number(process.argv[2]) || 5512, () => console.log("together dev server on", process.argv[2] || 5512));
