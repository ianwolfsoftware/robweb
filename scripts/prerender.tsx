import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import { legacyRedirects, routes } from '../src/content';
import { Site } from '../src/site';

const dist = path.resolve('dist');
const template = await readFile(path.join(dist, 'index.html'), 'utf8');
const publicOrigin = (process.env.PUBLIC_ORIGIN || 'https://robweb.wolf.uk.com').replace(/\/$/, '');

for (const route of routes) {
  const markup = renderToString(<Site path={route.path} />);
  const document = template
    .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${route.description}" />`)
    .replace('</title>', `</title>\n    <link rel="canonical" href="${publicOrigin}${route.path}" />`)
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  const filename = route.path === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.path.slice(1), 'index.html');
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, document);
  if (route.path === '/404/') await writeFile(path.join(dist, '404.html'), document);
}

for (const [from, to] of Object.entries(legacyRedirects)) {
  const target = `${publicOrigin}${to}`;
  const document = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow, noarchive"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${target}"><title>Page moved | Robin Clevett</title></head><body><main><h1>This page has moved</h1><p><a href="${to}">Continue to the new page</a>.</p></main><script>location.replace(${JSON.stringify(to)})</script></body></html>`;
  const filename = path.join(dist, from.slice(1), from.endsWith('/') ? 'index.html' : '');
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, document, 'utf8');
}

await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
const sitemapRoutes = routes.filter((route) => route.sitemap !== false && !route.path.startsWith('/admin'));
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapRoutes.map((route) => `\n  <url><loc>${publicOrigin}${route.path}</loc></url>`).join('')}\n</urlset>\n`, 'utf8');
