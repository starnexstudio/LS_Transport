// Serves the static export (out/) on http://localhost:4173 the way GitHub Pages
// does: index.html per folder, a redirect to the trailing slash, and 404.html
// with status 404, text compressed with gzip. Set BASE_PATH (e.g. /LS_Transport) to match a build made with
// NEXT_PUBLIC_BASE_PATH. Usage: npm run build && npm run preview
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve("out");
const port = Number(process.env.PORT ?? 4173);
const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".hdr": "application/octet-stream",
};

function send(req, res, status, file) {
  const type = types[path.extname(file)] ?? "application/octet-stream";
  const gzip =
    /^(text|application\/(json|xml))|svg/.test(type) &&
    /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
  res.writeHead(status, {
    "content-type": type,
    ...(gzip && { "content-encoding": "gzip" }),
  });
  const stream = fs.createReadStream(file);
  (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const notFound = () => send(req, res, 404, path.join(root, "404.html"));
    const inside =
      url.pathname === basePath || url.pathname.startsWith(basePath + "/");
    if (!inside) return notFound();
    const relative = decodeURIComponent(url.pathname.slice(basePath.length));
    const file = path.join(root, relative);
    if (!file.startsWith(root)) return notFound();
    let stat = fs.statSync(file, { throwIfNoEntry: false });
    if (stat?.isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { location: url.pathname + "/" + url.search });
        return res.end();
      }
      stat = fs.statSync(path.join(file, "index.html"), {
        throwIfNoEntry: false,
      });
      return stat
        ? send(req, res, 200, path.join(file, "index.html"))
        : notFound();
    }
    return stat ? send(req, res, 200, file) : notFound();
  })
  .listen(port, () =>
    console.log(`Serving out/ at http://localhost:${port}${basePath}/`),
  );
