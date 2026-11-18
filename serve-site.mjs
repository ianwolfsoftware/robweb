// robweb: serves the built, prerendered site (./dist) on :6980 and proxies /api and /go to the project API on :6981.
import { createServer, request as httpRequest } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { extname, join, normalize } from "node:path"

const PORT = Number(process.env.PORT || 6980)
const API = Number(process.env.API_PORT || 6981)
const ROOT = join(import.meta.dirname, "dist")
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".mp4": "video/mp4", ".webmanifest": "application/manifest+json" }

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x")
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/go/")) {
    const up = httpRequest({ host: "127.0.0.1", port: API, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res) })
    up.on("error", () => { res.writeHead(502).end("API unavailable") })
    req.pipe(up); return
  }
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, "")
  let file = join(ROOT, path)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try { if ((await stat(file)).isDirectory()) file = join(file, "index.html") } catch {}
  let status = 200
  try { await stat(file) } catch { file = join(ROOT, "404.html"); status = 404 }
  const body = await readFile(file)
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "X-Robots-Tag": "noindex", "Cache-Control": file.includes("/assets/") ? "public, max-age=31536000, immutable" : "no-cache" })
  res.end(body)
}).listen(PORT, "0.0.0.0", () => console.log("robweb site on :" + PORT + " (API :" + API + ")"))
