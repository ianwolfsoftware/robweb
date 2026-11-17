import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import { routes } from '../src/content';
import { Site } from '../src/site';

const dist = path.resolve('dist');
const template = await readFile(path.join(dist, 'index.html'), 'utf8');

for (const route of routes) {
  const markup = renderToString(<Site path={route.path} />);
  const document = template
    .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${route.description}" />`)
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  const filename = route.path === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.path.slice(1), 'index.html');
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, document);
}

await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
