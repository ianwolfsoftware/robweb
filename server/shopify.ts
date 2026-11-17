import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SHOP_ORIGIN = 'https://toolsandjigs.com';
const PUBLIC_FEED = `${SHOP_ORIGIN}/products.json?limit=250`;
const CACHE_MS = 15 * 60_000;
const REQUEST_TIMEOUT_MS = 6_000;
const USER_AGENT = 'Robweb/1.0 (+https://robweb.wolf.uk.com; Tools & Jigs catalogue)';

export type ShopProduct = {
  title: string;
  handle: string;
  price: string;
  currency: 'GBP';
  images: string[];
  shortDescription: string;
  available: boolean;
  url: string;
};

export type ShopCatalogue = {
  fetchedAt: string;
  source: 'shopify-public-feed' | 'shopify-storefront-api' | 'committed-snapshot';
  products: ShopProduct[];
};

type FetchLike = typeof fetch;

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === '#') {
      const code = body[1]?.toLowerCase() === 'x' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    }
    return named[body.toLowerCase()] ?? ' ';
  });
}

export function stripHtml(value: unknown, limit = 190) {
  const text = decodeEntities(String(value ?? '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1);
  const boundary = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, boundary > limit * .7 ? boundary : limit).trim()}…`;
}

function imageUrl(value: unknown) {
  const raw = typeof value === 'string' ? value : '';
  if (raw.startsWith('//')) return `https:${raw}`;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('shopify.com') ? parsed.toString() : '';
  } catch { return ''; }
}

function price(value: unknown) {
  if (typeof value === 'number') return (value / 100).toFixed(2);
  const amount = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(amount) ? amount.toFixed(2) : '';
}

function safeHandle(value: unknown) {
  const handle = String(value ?? '').trim();
  return /^[\p{L}\p{N}][\p{L}\p{N}®_-]{0,180}$/u.test(handle) ? handle : '';
}

function normalisePublicFeed(payload: unknown): ShopProduct[] {
  const products = (payload as { products?: unknown[] })?.products;
  if (!Array.isArray(products)) throw new Error('Shopify public feed did not return a product list');
  return products.flatMap((entry) => {
    const product = entry as Record<string, unknown>;
    const handle = safeHandle(product.handle);
    const variants = Array.isArray(product.variants) ? product.variants as Array<Record<string, unknown>> : [];
    const amount = price(variants[0]?.price ?? product.price_min ?? product.price);
    const rawImages = Array.isArray(product.images) ? product.images : [];
    const images = rawImages.map((item) => imageUrl(typeof item === 'string' ? item : (item as Record<string, unknown>)?.src)).filter(Boolean).slice(0, 6);
    if (!handle || !amount || !String(product.title ?? '').trim()) return [];
    return [{
      title: String(product.title).trim(),
      handle,
      price: amount,
      currency: 'GBP' as const,
      images,
      shortDescription: stripHtml(product.body_html ?? product.description),
      available: variants.length ? variants.some((variant) => variant.available === true) : product.available === true,
      url: `${SHOP_ORIGIN}/products/${encodeURIComponent(handle)}`,
    }];
  });
}

function normaliseStorefrontFeed(payload: unknown): ShopProduct[] {
  const edges = (payload as { data?: { products?: { edges?: unknown[] } } })?.data?.products?.edges;
  if (!Array.isArray(edges)) throw new Error('Shopify Storefront API did not return products');
  return edges.flatMap((edge) => {
    const node = (edge as { node?: Record<string, unknown> }).node ?? {};
    const handle = safeHandle(node.handle);
    const priceRange = node.priceRange as { minVariantPrice?: { amount?: unknown; currencyCode?: unknown } } | undefined;
    const imageEdges = (node.images as { edges?: Array<{ node?: { url?: unknown } }> } | undefined)?.edges ?? [];
    const amount = price(priceRange?.minVariantPrice?.amount);
    if (!handle || !amount || !String(node.title ?? '').trim()) return [];
    return [{
      title: String(node.title).trim(), handle, price: amount, currency: 'GBP' as const,
      images: imageEdges.map((item) => imageUrl(item.node?.url)).filter(Boolean).slice(0, 6),
      shortDescription: stripHtml(node.description), available: node.availableForSale === true,
      url: `${SHOP_ORIGIN}/products/${encodeURIComponent(handle)}`,
    }];
  });
}

async function jsonRequest(fetcher: FetchLike, url: string, init: RequestInit = {}) {
  const response = await fetcher(url, {
    ...init,
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT, ...init.headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Shopify returned HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export class ShopifyCatalogue {
  private cached: { expiresAt: number; value: ShopCatalogue } | null = null;
  private pending: Promise<ShopCatalogue> | null = null;

  constructor(private readonly token = '', private readonly fetcher: FetchLike = fetch) {}

  async get(): Promise<ShopCatalogue> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;
    if (this.pending) return this.pending;
    this.pending = this.refresh().finally(() => { this.pending = null; });
    const value = await this.pending;
    this.cached = { expiresAt: Date.now() + CACHE_MS, value };
    return value;
  }

  private async refresh(): Promise<ShopCatalogue> {
    try {
      const products = normalisePublicFeed(await jsonRequest(this.fetcher, PUBLIC_FEED));
      if (!products.length) throw new Error('Shopify public feed was empty');
      return { fetchedAt: new Date().toISOString(), source: 'shopify-public-feed', products };
    } catch (publicError) {
      if (this.token) {
        try {
          const query = `query RobwebProducts { products(first: 250) { edges { node { title handle description availableForSale priceRange { minVariantPrice { amount currencyCode } } images(first: 6) { edges { node { url } } } } } } }`;
          const payload = await jsonRequest(this.fetcher, `${SHOP_ORIGIN}/api/2026-10/graphql.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': this.token },
            body: JSON.stringify({ query }),
          });
          const products = normaliseStorefrontFeed(payload);
          if (!products.length) throw new Error('Shopify Storefront API was empty');
          return { fetchedAt: new Date().toISOString(), source: 'shopify-storefront-api', products };
        } catch { /* the committed snapshot remains the safe fallback */ }
      }
      const snapshot = JSON.parse(await readFile(path.resolve(process.cwd(), 'content/shop-products.json'), 'utf8')) as { fetchedAt?: string; products?: ShopProduct[] };
      if (!Array.isArray(snapshot.products) || !snapshot.products.length) throw publicError;
      return { fetchedAt: snapshot.fetchedAt ?? new Date(0).toISOString(), source: 'committed-snapshot', products: snapshot.products };
    }
  }
}

export const shopifyInternals = { normalisePublicFeed, normaliseStorefrontFeed };
