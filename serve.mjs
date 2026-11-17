// Robweb's small production static server. It serves the prerendered build when
// present, preserves the noindex launch guard and owns the legacy 301 map.
import { createServer, request as httpRequest } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.PORT || 6980)
const API_PORT = Number(process.env.API_PORT || 6981)
const DIST = join(import.meta.dirname, 'dist')
const ROOT = process.env.ROBWEB_SITE_ROOT || (existsSync(join(DIST, 'index.html')) ? DIST : join(import.meta.dirname, 'public'))
const REDIRECTS = JSON.parse(await readFile(join(import.meta.dirname, 'content/redirects.json'), 'utf8'))
const TYPES = { '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2' }

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const pathname = decodeURIComponent(url.pathname)
  if (pathname.startsWith('/api/') || pathname.startsWith('/go/')) {
    const upstream = httpRequest({ host: '127.0.0.1', port: API_PORT, path: req.url, method: req.method, headers: req.headers }, (response) => {
      res.writeHead(response.statusCode ?? 502, response.headers)
      response.pipe(res)
    })
    upstream.on('error', () => { res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('API unavailable') })
    req.pipe(upstream)
    return
  }
  const redirectPath = pathname.endsWith('/') || extname(pathname) ? pathname : `${pathname}/`
  if (REDIRECTS[redirectPath]) {
    res.writeHead(301, { Location: REDIRECTS[redirectPath], 'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex, nofollow, noarchive' })
    res.end()
    return
  }
  const path = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'X-Robots-Tag': 'noindex, nofollow, noarchive' })
    res.end(body)
  } catch {
    const notFound = join(ROOT, '404.html')
    const body = await readFile(existsSync(notFound) ? notFound : join(ROOT, 'index.html'))
    res.writeHead(existsSync(notFound) ? 404 : 200, { 'Content-Type': TYPES['.html'], 'X-Robots-Tag': 'noindex, nofollow, noarchive' })
    res.end(body)
  }
}).listen(PORT, '0.0.0.0', () => console.log(`robweb site on :${PORT} from ${ROOT}`))
