import { writeFile } from 'node:fs/promises';

const origin = 'https://toolsandjigs.com';
const feed = `${origin}/products.json?limit=250`;
const headers = { Accept: 'application/json', 'User-Agent': 'Robweb/1.0 (+https://robweb.wolf.uk.com; snapshot refresh)' };
const strip = (html) => String(html ?? '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
const short = (html) => { const text = strip(html); if (text.length <= 190) return text; const cut = text.slice(0, 191); return `${cut.slice(0, cut.lastIndexOf(' ') > 135 ? cut.lastIndexOf(' ') : 190).trim()}…`; };
const image = (value) => value.startsWith('//') ? `https:${value}` : value;
const amount = (value) => typeof value === 'number' ? (value / 100).toFixed(2) : Number.parseFloat(value).toFixed(2);

async function getJson(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

let raw;
let sourceUrl = feed;
try {
  raw = (await getJson(feed)).products;
} catch (error) {
  console.warn(`${error.message}; refreshing through the public Shopify product endpoints.`);
  sourceUrl = `${origin}/sitemap_products_1.xml + /products/{handle}.js`;
  const sitemapResponse = await fetch(`${origin}/sitemap_products_1.xml?from=0&to=999999999999999999`, { headers, signal: AbortSignal.timeout(12_000) });
  if (!sitemapResponse.ok) throw new Error(`Shopify product sitemap returned HTTP ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/toolsandjigs\.com\/products\/[^<]+)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
  raw = [];
  for (const url of urls) raw.push(await getJson(`${url}.js`));
}

const products = raw.map((product) => ({
  title: product.title.trim(),
  handle: product.handle,
  price: amount(product.variants?.[0]?.price ?? product.price_min ?? product.price),
  currency: 'GBP',
  images: (product.images ?? []).map((entry) => image(typeof entry === 'string' ? entry : entry.src)).filter(Boolean).slice(0, 6),
  shortDescription: short(product.body_html ?? product.description),
  available: (product.variants ?? []).length ? product.variants.some((variant) => variant.available) : Boolean(product.available),
  url: `${origin}/products/${encodeURIComponent(product.handle)}`,
}));

if (!products.length) throw new Error('The live Shopify catalogue was empty; snapshot left unchanged.');
await writeFile('content/shop-products.json', `${JSON.stringify({ fetchedAt: new Date().toISOString(), sourceUrl, products }, null, 2)}\n`);
console.log(`Refreshed ${products.length} Tools & Jigs products.`);
