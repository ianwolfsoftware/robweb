// robweb (17 Nov 2026): the holding page for Robin Clevett's new website at robweb.wolf.uk.com until the rebuild lands.
// Static files from ./public on 0.0.0.0:6980 for the Hetzner edge (nginx + Let's Encrypt) to proxy to.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.PORT || 6980)
const ROOT = join(import.meta.dirname, 'public')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp' }

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
  const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'X-Robots-Tag': 'noindex' })
    res.end(body)
  } catch {
    const body = await readFile(join(ROOT, 'index.html'))
    res.writeHead(200, { 'Content-Type': TYPES['.html'], 'X-Robots-Tag': 'noindex' })
    res.end(body)
  }
}).listen(PORT, '0.0.0.0', () => console.log(`robweb holding page on :${PORT}`))
