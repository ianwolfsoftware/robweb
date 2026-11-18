import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import shopSnapshot from '../content/shop-products.json';
import videoSnapshot from '../content/videos.json';
import { curatedInterviews, curatedPress, mediaSources, seededPartners } from '../shared/media-content';
import type { MediaFeedItem, MediaFeedSnapshot, PartnerRecord } from '../shared/types';
import { navRoutes, normalisePath, productUrl, routeFor, shopUrl } from './content';
import { AdminApp } from './admin';
import { animateMenu, MotionChrome, MotionPage, WebglSlot } from './motion';
import { ConsentBanner } from './privacy';

type SiteProps = { path: string };
type Theme = 'dark' | 'light';
type ShopProduct = { title: string; handle: string; price: string; currency: 'GBP'; images: string[]; shortDescription: string; available: boolean; url: string };
type Catalogue = { fetchedAt: string; source?: string; products: ShopProduct[] };

const initialCatalogue = shopSnapshot as Catalogue;
const featuredHandles = ['robangle', 'architrave-tool', '3-inch-76-2mm-hinge-jig', '4-inch-101-6mm-hinge-jig'];

function Arrow({ external = false }: { external?: boolean }) {
  return <span aria-hidden="true" className="arrow">{external ? '↗' : '→'}</span>;
}

function BrandLogo({ footer = false, hero = false }: { footer?: boolean; hero?: boolean }) {
  return <span className={`brand-art ${footer ? 'brand-art-footer' : ''} ${hero ? 'hero-brand-logo' : ''}`} aria-hidden="true">
    <img className="brand-logo brand-logo-dark" src="/source/2020/08/cropped-logo-1.png" width="500" height="200" alt="" />
    {!footer && !hero && <span className="brand-logo-light"><img src="/brand/logo-steel.svg" width="441" height="224" alt="" /><b>ROBIN CLEVETT</b></span>}
  </span>;
}

function ThemeControl({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Use ${next} appearance`;
  return <button className="theme-toggle" type="button" onClick={() => setTheme(next)} aria-label={label} title={label}><span className="theme-icon" aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span></button>;
}

function Header({ path, theme, setTheme, menuOpen, openMenu }: { path: string; theme: Theme; setTheme: (theme: Theme) => void; menuOpen: boolean; openMenu: () => void }) {
  return <header className="site-header"><div className="header-shell"><a className="brand" href="/" aria-label="Robin Clevett home"><BrandLogo /></a><a className="mobile-header-name" href="/">Robin Clevett</a><span className="mobile-header-label">Carpentry · tools</span><div className="nav-pill"><nav className="desktop-nav" aria-label="Primary navigation">{navRoutes.map((route) => <a className={path === route.path ? 'active' : ''} aria-current={path === route.path ? 'page' : undefined} key={route.path} href={route.path}><span data-link-label>{route.navLabel}</span></a>)}</nav><ThemeControl theme={theme} setTheme={setTheme} /><a className="button button-small header-shop" data-magnetic href={shopUrl('/header/')}><span data-link-label>Tools &amp; Jigs</span> <Arrow external /></a><button className="menu-toggle header-menu-toggle" type="button" onClick={openMenu} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Open site navigation"><span /><span /><span /></button></div></div></header>;
}

function MobileDock({ menuOpen, openMenu }: { menuOpen: boolean; openMenu: () => void }) {
  return <nav className="mobile-dock" aria-label="Quick navigation"><a className="mobile-dock-mark" href="/" aria-label="Robin Clevett home"><img src="/brand/logo.svg" width="441" height="224" alt="" /></a><button className="mobile-dock-menu" type="button" onClick={openMenu} aria-expanded={menuOpen} aria-controls="mobile-menu"><span className="menu-dots" aria-hidden="true"><i /><i /><i /></span>Menu</button></nav>;
}

function FullScreenMenu({ open, theme, setTheme, closeMenu, closeForNavigation }: { open: boolean; theme: Theme; setTheme: (theme: Theme) => void; closeMenu: () => void; closeForNavigation: (href: string) => void }) {
  const menuRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
    };
    const previousDocumentStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
      scrollBehavior: document.documentElement.style.scrollBehavior,
    };
    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    document.body.classList.add('menu-is-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.scrollBehavior = 'auto';
    menuRef.current?.showModal();
    const cancel = (event: Event) => { event.preventDefault(); closeMenu(); };
    menuRef.current?.addEventListener('cancel', cancel);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = [...menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    let focusFrame = 0;
    const frame = requestAnimationFrame(() => {
      if (menuRef.current) void animateMenu(menuRef.current).then(() => {
        focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', keydown);
      menuRef.current?.removeEventListener('cancel', cancel);
      if (menuRef.current?.open) menuRef.current.close();
      document.body.classList.remove('menu-is-open');
      document.body.style.overflow = previousBodyStyles.overflow;
      document.documentElement.style.overflow = previousDocumentStyles.overflow;
      document.documentElement.style.overscrollBehavior = previousDocumentStyles.overscrollBehavior;
      window.scrollTo(0, scrollY);
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          window.scrollTo(0, scrollY);
          document.documentElement.style.scrollBehavior = previousDocumentStyles.scrollBehavior;
          history.scrollRestoration = previousScrollRestoration;
        }, 100);
      });
    };
  }, [closeMenu, open]);
  if (!open || typeof document === 'undefined') return null;
  const shopHref = shopUrl('/mobile-menu/');
  return createPortal(<dialog ref={menuRef} className="mobile-menu-panel" id="mobile-menu" aria-labelledby="mobile-menu-title"><div className="mobile-menu-top"><p>Robin Clevett</p><button ref={closeRef} className="mobile-menu-close" type="button" onClick={closeMenu} aria-label="Close site navigation"><span aria-hidden="true" /></button></div><div className="mobile-menu-body"><p className="mobile-menu-kicker">Explore</p><h2 id="mobile-menu-title">Where would you like to go?</h2><nav aria-label="Mobile navigation">{navRoutes.map((route, index) => <a className="mobile-menu-link" key={route.path} href={route.path} onClick={(event) => { event.preventDefault(); closeForNavigation(route.path); }}><span>{String(index + 1).padStart(2, '0')}</span>{route.navLabel}<Arrow /></a>)}</nav></div><div className="mobile-menu-actions"><a className="button mobile-menu-link" href={shopHref} onClick={(event) => { event.preventDefault(); closeForNavigation(shopHref); }}>Tools &amp; Jigs <Arrow external /></a><ThemeControl theme={theme} setTheme={setTheme} /><p>Products, practical videos and RC Calculators.</p></div></dialog>, document.body);
}

const socials = [
  ['YouTube', 'https://www.youtube.com/@robinclevettcarpenter', '▶'], ['Instagram', 'https://www.instagram.com/robinclevett', '◎'],
  ['Facebook', 'https://www.facebook.com/robc.co.uk', 'f'], ['X', 'https://x.com/RobinClevett', '𝕏'],
  ['LinkedIn', 'https://www.linkedin.com/in/robin-clevett', 'in'], ['Pinterest', 'https://www.pinterest.co.uk/robinclevett', 'P'],
] as const;

function Footer() {
  return <footer className="site-footer"><div className="footer-gradient" aria-hidden="true" /><div className="page-frame footer-signoff"><div><a href="/" aria-label="Robin Clevett home"><BrandLogo footer /></a><p>Tools that earn their place. Site maths that stays close to the job.</p></div><div><p className="eyebrow">TWO USEFUL ROUTES</p><h2 data-split>Find the product. Make the calculation.</h2><div className="button-row"><a className="button" href="/shop/">Shop products <Arrow /></a><a className="button button-ghost" href="/app/">RC Calculators <Arrow /></a></div></div></div>
    <div className="page-frame footer-grid footer-grid-simple"><nav aria-label="Main links"><b>Explore</b><a href="/">Home</a><a href="/media/">Media</a><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/contact/">Contact</a><a href="/cladding/">Cladding enquiries</a><a href={shopUrl('/footer/')}>Tools &amp; Jigs ↗</a></nav><nav aria-label="Legal"><b>Legal</b><a href="/legal/privacy/">Privacy</a><a href="/legal/cookies/">Cookies</a><a href="/legal/terms/">Terms</a><a href="/legal/disclaimer/">Disclaimer</a></nav><div className="footer-socials"><b>Follow Robin</b><div>{socials.map(([label, href, icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><span aria-hidden="true">{icon}</span></a>)}</div></div><div className="footer-meta"><p>Noindex preview</p><p>Analytics stay off until you choose them.</p></div></div>
  </footer>;
}

function PageIntro({ eyebrow, title, children, index }: { eyebrow: string; title: string; children: ReactNode; index: string }) {
  return <section className="page-hero"><div className="blueprint-grid" aria-hidden="true" /><div className="page-frame page-hero-inner"><div data-reveal><p className="eyebrow">{eyebrow}</p><h1 data-split>{title}</h1><div className="intro-copy">{children}</div></div><span className="page-index" aria-hidden="true">{index} / RC</span></div></section>;
}

function useProducts() {
  const [catalogue, setCatalogue] = useState<Catalogue>(initialCatalogue);
  useEffect(() => {
    let active = true;
    void fetch('/api/shop', { headers: { Accept: 'application/json' } }).then(async (response) => {
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
      const next = await response.json() as Catalogue;
      if (active && Array.isArray(next.products) && next.products.length) setCatalogue(next);
    }).catch(() => { /* the committed snapshot is intentionally the offline fallback */ });
    return () => { active = false; };
  }, []);
  return catalogue;
}

const fallbackMedia: MediaFeedSnapshot = {
  fetchedAt: videoSnapshot.fetchedAt,
  youtube: videoSnapshot.videos.map((video) => ({ key: video.id, kind: 'youtube', title: video.title, url: video.url, published: video.published, outlet: 'Robin Clevett · YouTube', thumbnailUrl: video.thumbnailUrl })),
  episodes: [],
  interviews: curatedInterviews,
  press: curatedPress,
  partners: seededPartners,
  counts: { youtube: videoSnapshot.videos.length, episodes: 0 },
  sources: { youtube: mediaSources.youtube, podcast: '', apple: mediaSources.apple, fixRadio: mediaSources.fixRadio },
};

function useMedia() {
  const [media, setMedia] = useState<MediaFeedSnapshot>(fallbackMedia);
  useEffect(() => {
    let active = true;
    void fetch('/api/media', { headers: { Accept: 'application/json' } }).then(async (response) => {
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
      const next = await response.json() as MediaFeedSnapshot;
      if (active && Array.isArray(next.youtube) && Array.isArray(next.partners)) setMedia({ ...next, youtube: next.youtube.length ? next.youtube : fallbackMedia.youtube });
    }).catch(() => { /* committed, verified items are the offline fallback */ });
    return () => { active = false; };
  }, []);
  return media;
}

function readableDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function VideoCard({ item, play }: { item: MediaFeedItem; play: (item: MediaFeedItem) => void }) {
  return <article className="media-card video-card" data-reveal><button type="button" className="video-poster" onClick={() => play(item)} aria-label={`Play ${item.title}`}><img src={item.thumbnailUrl} width="640" height="360" loading="lazy" alt="" /><span className="play-mark" aria-hidden="true">▶</span></button><div><p className="card-meta">{readableDate(item.published)}</p><h3>{item.title}</h3><button className="text-link" type="button" onClick={() => play(item)}>Watch without tracking <Arrow /></button></div></article>;
}

function EpisodeCard({ item }: { item: MediaFeedItem }) {
  return <article className="media-card episode-card" data-reveal><p className="card-meta">{readableDate(item.published)}{item.duration ? ` · ${item.duration}` : ''}</p><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.audioUrl ? <audio controls preload="none" src={item.audioUrl}>Your browser cannot play this audio. <a href={item.url}>Open the episode</a>.</audio> : null}<a className="text-link" href={item.url} target="_blank" rel="noreferrer">Episode details <Arrow external /></a></article>;
}

function PartnerWall({ partners }: { partners: PartnerRecord[] }) {
  return <div className="partner-wall" data-reveal-group>{partners.filter((partner) => partner.active).map((partner) => <a key={partner.id} href={partner.url} target="_blank" rel="noreferrer" aria-label={`${partner.name} website`}>{partner.logoPath ? <img src={partner.logoPath} width="220" height="90" loading="lazy" alt={partner.name} /> : <strong>{partner.name}</strong>}</a>)}</div>;
}

function MediaTeasers() {
  const media = useMedia();
  return <><section className="page-frame home-media-section"><div className="section-heading"><div><p className="eyebrow">WATCH</p><h2>On site, in detail.</h2></div><a className="text-link" href="/media/#watch">All videos <Arrow /></a></div><div className="media-grid home-media-grid">{media.youtube.slice(0, 2).map((item) => <article className="media-card video-card" key={item.key}><a className="video-poster" href="/media/#watch"><img src={item.thumbnailUrl} width="640" height="360" loading="lazy" alt="" /><span className="play-mark" aria-hidden="true">▶</span></a><div><p className="card-meta">{readableDate(item.published)}</p><h3>{item.title}</h3></div></article>)}</div><div className="section-heading listen-heading"><div><p className="eyebrow">LISTEN</p><h2>The Carpentry Show.</h2></div><a className="text-link" href="/media/#listen">Latest episodes <Arrow /></a></div><div className="listen-teaser"><div><p>Robin's own weekly Fix Radio show: trade conversation, techniques, tools and the realities of the job.</p><p className="card-meta">Mondays from 6pm · in partnership with Festool</p></div><div className="button-row"><a className="button" href="/media/#listen">Listen now <Arrow /></a><a className="button button-ghost" href={mediaSources.fixRadioLive} target="_blank" rel="noreferrer">Fix Radio live <Arrow external /></a></div></div></section><section className="partners-section"><div className="page-frame"><div className="section-heading"><div><p className="eyebrow">PARTNERS</p><h2>Brands Robin works with.</h2></div><p>Official destinations for current partners and featured brands.</p></div><PartnerWall partners={media.partners} /></div></section></>;
}

function shopifyImage(src: string, width: number) {
  try { const url = new URL(src); url.searchParams.set('width', String(width)); return url.toString(); } catch { return src; }
}

function ProductCard({ product, placement }: { product: ShopProduct; placement: 'home' | 'shop' }) {
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency: product.currency }).format(Number(product.price));
  return <article className="product-card" data-reveal><a className="product-image" href={productUrl(product.handle, `/${placement}/product/`)} aria-label={`Buy ${product.title} on Tools & Jigs`}>{product.images[0] ? <img src={shopifyImage(product.images[0], 900)} alt={product.title} width="900" height="900" loading="lazy" referrerPolicy="no-referrer" /> : <span aria-hidden="true">RC</span>}{product.images[1] && <img className="product-image-hover" src={shopifyImage(product.images[1], 900)} alt="" width="900" height="900" loading="lazy" referrerPolicy="no-referrer" />}{!product.available && <b className="sold-out">Sold out</b>}</a><div className="product-card-copy"><p>{price}</p><h3>{product.title}</h3><p className="product-description">{product.shortDescription}</p><a className="text-link" href={productUrl(product.handle, `/${placement}/product/`)}>Buy on Tools &amp; Jigs <Arrow external /></a></div></article>;
}

function AppScreens({ compact = false }: { compact?: boolean }) {
  return <div className={`app-screens ${compact ? 'app-screens-compact' : ''}`} aria-label="RC Calculators V3 in light and dark modes"><figure><img src="/app/v3-home-light.png" width="390" height="844" loading="eager" alt="RC Calculators V3 home screen in light mode" /><figcaption>Light</figcaption></figure><figure><img src="/app/v3-home-dark.png" width="390" height="844" loading="eager" alt="RC Calculators V3 home screen in dark mode" /><figcaption>Dark</figcaption></figure></div>;
}

function Home() {
  const { products } = useProducts();
  const featured = featuredHandles.map((handle) => products.find((product) => product.handle === handle)).filter((product): product is ShopProduct => Boolean(product));
  return <><section className="home-hero"><div className="hero-stage" data-hero-stage><div className="hero-depth-field" aria-hidden="true" /><WebglSlot /><picture className="hero-portrait"><source media="(max-width: 47.99rem)" srcSet="/optimised/portrait-robin/robin-portrait-480-static.webp" type="image/webp" /><source media="(max-width: 47.99rem)" srcSet="/optimised/portrait-robin/robin-portrait-480-static.avif" type="image/avif" /><source srcSet="/optimised/portrait-robin/robin-portrait-800.webp 800w, /optimised/portrait-robin/robin-portrait-1200.webp 1200w" sizes="58vw" type="image/webp" /><source srcSet="/optimised/portrait-robin/robin-portrait-800.avif 800w, /optimised/portrait-robin/robin-portrait-1200.avif 1200w" sizes="58vw" type="image/avif" /><img data-hero-portrait src="/source/portraits/robin-portrait-cutout.png" alt="Robin Clevett smiling at the camera" width="1254" height="1254" fetchPriority="high" /></picture><div className="hero-light-sweep" data-hero-light aria-hidden="true" /></div><div className="mobile-hero-statement"><span aria-hidden="true">✦</span><p>Videos, Tools &amp; Jigs and RC Calculators.</p></div><div className="hero-scrim" aria-hidden="true" /><div className="page-frame hero-content"><div className="hero-copy"><div className="hero-logo hero-intro"><BrandLogo hero /></div><h1 className="hero-title" data-split="hero" aria-label="Robin Clevett"><span className="hero-line">R<em className="accent-letter">o</em>bin</span><span className="hero-line">Clevett</span></h1><nav className="button-row hero-intro" aria-label="Featured destinations"><a className="button" data-magnetic href="/shop/">Products <Arrow /></a><a className="button button-ghost" href="/app/">RC Calculators <Arrow /></a></nav></div></div></section>
    <section className="name-marquee" aria-label="Robin Clevett"><div className="name-marquee-track" data-marquee-track><div className="name-marquee-group"><span>Robin Clevett</span><i className="marquee-spark">✦</i><span>Robin Clevett</span><i>✦</i></div><div className="name-marquee-group" aria-hidden="true"><span>Robin Clevett</span><i>✦</i><span>Robin Clevett</span><i>✦</i></div></div></section>
    <MediaTeasers />
    <section className="page-frame product-section" data-reveal><div className="section-heading products-heading"><div><p className="eyebrow">FROM TOOLS &amp; JIGS</p><h2 data-split>Products made to get used.</h2></div><p>Current product details and prices from Robin's official Shopify catalogue. Checkout stays with Tools &amp; Jigs.</p></div><div className="product-grid product-grid-featured" data-reveal-group>{(featured.length ? featured : products.slice(0, 4)).map((product) => <ProductCard key={product.handle} product={product} placement="home" />)}</div><a className="button" href="/shop/">See the whole shop <Arrow /></a></section>
    <section className="home-app-section"><div className="page-frame home-app-grid"><div data-reveal><p className="eyebrow">RC CALCULATORS</p><h2>The figures you need, kept close to the job.</h2><p>All calculators are included with a subscription. Work metric-first, organise calculations by project, and switch between a focused dark or light interface.</p><ul className="feature-ticks"><li>Monthly £24.99, VAT included</li><li>Yearly £254.99, VAT included</li><li>New calculators added regularly</li></ul><a className="button" href="/app/">See RC Calculators <Arrow /></a></div><AppScreens compact /></div></section>
    <section className="tools-callout"><div className="page-frame"><p className="eyebrow">THE OFFICIAL SHOP</p><h2>Prefer to browse at source?</h2><p>Open the complete Tools &amp; Jigs store for current product detail, availability and checkout.</p><a className="button button-dark" href={shopUrl('/home/tools-and-jigs/')}>Visit Tools &amp; Jigs <Arrow external /></a></div></section>
    <section className="page-frame contact-callout" data-reveal><div><p className="eyebrow">CONTACT</p><h2>Need to get in touch?</h2></div><div><p>Send Robin a clear note through the website contact route. Messages stay in Robweb's own protected inbox.</p><a className="button" href="/contact/">Contact Robin <Arrow /></a></div></section></>;
}

function Shop() {
  const catalogue = useProducts();
  const sourceLabel = catalogue.source === 'shopify-public-feed' || catalogue.source === 'shopify-storefront-api' ? 'Live Shopify catalogue' : 'Current catalogue snapshot';
  return <><PageIntro eyebrow="SHOP" title="Products, straight from the source." index="02"><p>The product range is refreshed from Tools &amp; Jigs and safely falls back to the committed catalogue if Shopify is briefly unavailable. Prices and availability are shown in GBP as supplied.</p></PageIntro><section className="page-frame product-section"><div className="catalogue-status"><span aria-hidden="true" /><b>{sourceLabel}</b><p>{catalogue.products.length} products · buying and checkout stay on Tools &amp; Jigs</p></div><div className="product-grid">{catalogue.products.map((product) => <ProductCard key={product.handle} product={product} placement="shop" />)}</div></section><section className="tools-callout"><div className="page-frame"><p className="eyebrow">TOOLS &amp; JIGS</p><h2>Want the official storefront?</h2><p>Browse collections, full product detail and checkout directly with Robin's Shopify store.</p><a className="button button-dark" href={shopUrl('/shop/all/')}>Open Tools &amp; Jigs <Arrow external /></a></div></section></>;
}

function EnquiryForm({ type }: { type: 'contact' | 'media' | 'cladding' }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setState('sending'); const form = event.currentTarget; const data = new FormData(form); const payload = Object.fromEntries(data.entries());
    try { const response = await fetch(`/api/forms/${type}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, consent: data.get('consent') === 'on' }) }); if (!response.ok) throw new Error('submission failed'); const result = await response.json() as { reference: string }; setReference(result.reference); setState('sent'); form.reset(); } catch { setState('error'); }
  };
  if (state === 'sent') return <section className="form-receipt" role="status"><p className="eyebrow">ENQUIRY RECEIVED</p><h2>Thank you.</h2><p>Your reference is <code>{reference}</code>. The enquiry is in Robin's protected website inbox for review.</p></section>;
  return <form className="public-form" onSubmit={submit}>
    {type === 'cladding' && <><div className="form-row"><label>Cladding profile or section reference<input name="claddingRef" maxLength={120} required /></label><label>Approximate square metres<input name="squareMetres" maxLength={80} inputMode="decimal" required /></label></div><div className="form-row"><label>Required lead time<input name="leadTime" maxLength={120} required /></label><label>UK delivery location<input name="ukLocation" autoComplete="postal-code" maxLength={180} required /></label></div></>}
    <div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength={120} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label></div>
    <div className="form-row"><label>Phone {type !== 'cladding' && <span>(optional)</span>}<input name="phone" type="tel" autoComplete="tel" maxLength={40} required={type === 'cladding'} /></label>{type === 'contact' && <label>Subject <span>(optional)</span><input name="subject" maxLength={160} /></label>}{type === 'media' && <label>Organisation <span>(optional)</span><input name="organisation" autoComplete="organization" maxLength={160} /></label>}</div>
    {type === 'media' && <><div className="form-row"><label>Enquiry type<select name="enquiryType" required defaultValue=""><option value="" disabled>Choose one…</option><option>Interview or podcast</option><option>Press or media</option><option>Speaking or event</option><option>Brand collaboration</option><option>Other</option></select></label><label>Deadline <span>(optional)</span><input name="deadline" maxLength={120} placeholder="For example, 12 December" /></label></div><label>Subject<input name="subject" maxLength={160} required /></label></>}
    <label>{type === 'cladding' ? 'Anything else? (optional)' : 'Message'}<textarea name="message" rows={7} maxLength={4000} required={type !== 'cladding'} /></label>
    <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="check-field"><input name="consent" type="checkbox" required /><span>I understand this enquiry will be stored so it can be handled. See the <a href="/legal/privacy/">privacy notice</a>.</span></label>{state === 'error' && <p className="form-error" role="alert">That did not send. Your answers are still here—try again.</p>}<button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send enquiry'} <Arrow /></button>
  </form>;
}

function Contact() {
  return <><PageIntro eyebrow="CONTACT" title="Start with the right information." index="05"><p>Share only what is needed. Messages are rate-limited, honeypot-protected and kept in this project's own admin inbox.</p></PageIntro><section className="page-frame contact-form-layout"><aside data-reveal><p className="eyebrow">BEFORE YOU SEND</p><h2>Keep it useful.</h2><p>Describe the product, app question or collaboration clearly. Do not include passwords, payment details or sensitive documents.</p><p>Looking for Thermowood? Use the <a className="text-link" href="/cladding/">cladding enquiry form <Arrow /></a>.</p></aside><div data-reveal><EnquiryForm type="contact" /></div></section></>;
}

function MediaPage() {
  const media = useMedia();
  const [selected, setSelected] = useState<MediaFeedItem | null>(null);
  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    document.body.style.overflow = 'hidden';
    addEventListener('keydown', close);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', close); };
  }, [selected]);
  return <><PageIntro eyebrow="MEDIA" title="Watch the work. Hear the conversation." index="02"><p>Practical YouTube films, Robin's own weekly Fix Radio show, and a verified selection of interviews and press.</p></PageIntro>
    <section className="page-frame media-section" id="watch"><div className="section-heading"><div><p className="eyebrow">WATCH</p><h2>Latest from YouTube.</h2></div><a className="text-link" href="https://www.youtube.com/@robinclevettcarpenter" target="_blank" rel="noreferrer">Robin's channel <Arrow external /></a></div><p className="section-note">Choose a film to load it privately from YouTube's no-cookie domain.</p><div className="media-grid video-list">{media.youtube.slice(0, 9).map((item) => <VideoCard key={item.key} item={item} play={setSelected} />)}</div></section>
    <section className="listen-section" id="listen"><div className="page-frame"><div className="listen-lead"><div><p className="eyebrow">LISTEN · ROBIN'S OWN RADIO SHOW</p><h2>The Carpentry Show on Fix Radio.</h2></div><div><p>Robin hosts a weekly conversation for carpenters and joiners, covering tools, techniques, business and life in the trade. The show is made in partnership with Festool.</p><p className="card-meta">Mondays 6pm · repeat 11pm · podcast from 4pm</p><div className="button-row"><a className="button" href={mediaSources.fixRadioLive} target="_blank" rel="noreferrer">Listen live <Arrow external /></a><a className="button button-ghost" href={mediaSources.apple} target="_blank" rel="noreferrer">Apple Podcasts <Arrow external /></a><a className="button button-ghost" href={mediaSources.spotify} target="_blank" rel="noreferrer">Spotify <Arrow external /></a></div></div></div><div className="episode-grid">{media.episodes.length ? media.episodes.slice(0, 6).map((item) => <EpisodeCard key={item.key} item={item} />) : <article className="media-card episode-card"><p className="eyebrow">LATEST EPISODES</p><h3>Open The Carpentry Show</h3><p>The live episode feed is refreshed hourly. If it is briefly unavailable here, every episode remains on Fix Radio.</p><a className="text-link" href={mediaSources.fixRadio} target="_blank" rel="noreferrer">Browse on Fix Radio <Arrow external /></a></article>}</div></div></section>
    <section className="page-frame media-section"><div className="section-heading"><div><p className="eyebrow">GUEST PODCASTS &amp; INTERVIEWS</p><h2>Longer conversations.</h2></div></div><div className="editorial-grid">{media.interviews.map((item) => <article className="editorial-card" key={item.key} data-reveal><p className="card-meta">{item.outlet} · {readableDate(item.published)}</p><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<a className="text-link" href={item.url} target="_blank" rel="noreferrer">Listen or read <Arrow external /></a></article>)}</div></section>
    <section className="page-frame media-section press-section"><div className="section-heading"><div><p className="eyebrow">PRESS · AS SEEN IN</p><h2>Selected coverage.</h2></div></div><div className="press-list">{media.press.map((item) => <a key={item.key} href={item.url} target="_blank" rel="noreferrer"><span>{item.outlet}</span><strong>{item.title}</strong><Arrow external /></a>)}</div></section>
    <section className="page-frame contact-form-layout media-enquiry"><aside data-reveal><p className="eyebrow">MEDIA ENQUIRIES</p><h2>Make the brief clear.</h2><p>For interviews, press, speaking and relevant collaborations, include the outlet, format and deadline.</p></aside><div data-reveal><EnquiryForm type="media" /></div></section>
    {selected && createPortal(<div className="video-modal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div><button className="video-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close video">×</button><div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${selected.key}?rel=0`} title={selected.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><h2 id="video-modal-title">{selected.title}</h2><a className="text-link" href={selected.url} target="_blank" rel="noreferrer">Open on YouTube <Arrow external /></a></div></div>, document.body)}
  </>;
}

function Cladding() {
  return <><PageIntro eyebrow="THERMOWOOD CLADDING" title="Cladding enquiries." index="06"><p>If you would like a price for Thermowood Cladding at special YouTube Subscriber rates please fill in this initial form and one of our team will make contact with you and prepare a cost for your potential order.</p></PageIntro>
    <section className="page-frame cladding-overview"><div data-reveal><p className="eyebrow">THE MATERIAL</p><h2>Stable, warm and ready to finish.</h2><p>Length of cladding available depends on current stock on the ground and are available from 2.4m to 5.4m in .3m increments.</p><p>Some of our standard sections and dimensions are shown here.</p><p>Thermowood is a modified timber cladding option offering consistency in colour (golden brown).</p><p>The growing in Finland, Thermowood starts life as standard (non-durable) redwood, however, through Thermal modification technology we are able to modify the timber cells and create a durable product.</p><p>During the heat-treating process the timber darkens, it becomes much more stable and the thermal insulation properties also improve.</p><p>Due to the low moisture content, Thermowood takes stains, oils and lacquers very well.</p><p>Other species Available.</p><p><strong>Only available for delivery in the United Kingdom.</strong></p></div><div className="cladding-images" data-reveal><img src="/source/landing/cladding1.jpg" width="960" height="720" loading="eager" alt="Thermowood cladding boards fitted to an exterior" /><img src="/source/landing/cladding2.png" width="960" height="720" loading="lazy" alt="Thermowood cladding profile and finish detail" /></div></section>
    <section className="cladding-facts"><div className="page-frame"><article><span>01</span><h3>Lengths</h3><p>2.4m–5.4m, in 0.3m increments.</p></article><article><span>02</span><h3>Profiles</h3><p>A choice of standard sections and dimensions.</p></article><article><span>03</span><h3>Delivery</h3><p>UK delivery addresses only.</p></article></div></section>
    <section className="page-frame contact-form-layout cladding-form"><aside data-reveal><p className="eyebrow">INITIAL ENQUIRY</p><h2>Tell us what you need.</h2><p>A profile or section reference, approximate area, lead time and delivery location are enough to start.</p></aside><div data-reveal><EnquiryForm type="cladding" /></div></section>
  </>;
}

function AppPage({ path }: { path: string }) {
  if (path === '/calculator-app/privacy/') return <><PageIntro eyebrow="RC CALCULATORS" title="Privacy information" index="05"><p>The published calculator-app privacy URL is preserved exactly. The legacy text is held in the source inventory for final review.</p></PageIntro><section className="page-frame legal-sheet"><h2>Privacy review pending</h2><p>No app-store destination or tracking behaviour has been assumed. This path remains stable while the final policy is approved.</p><a className="text-link" href="/app/">Back to RC Calculators <Arrow /></a></section></>;
  if (path === '/calculator-app/terms/') return <><PageIntro eyebrow="RC CALCULATORS" title="Terms of use" index="06"><p>The published calculator-app terms URL is preserved exactly. This preview does not infer safety or regulatory claims.</p></PageIntro><section className="page-frame legal-sheet"><h2>Terms review pending</h2><p>Final terms remain subject to owner review before launch.</p><a className="text-link" href="/app/">Back to RC Calculators <Arrow /></a></section></>;
  return <><section className="app-hero app-hero-polished"><div className="page-frame app-hero-grid"><div data-reveal><p className="eyebrow">RC CALCULATORS · V3</p><h1>Site maths, ready when the job is.</h1><p className="lead">Metric-first construction calculators in a focused app built around real working projects.</p><div className="price-pills"><span><b>£24.99</b> monthly · VAT included</span><span><b>£254.99</b> yearly · VAT included</span></div><div className="store-actions" aria-label="App store links coming soon"><span aria-disabled="true"><b>Google Play</b> · link coming soon</span><span aria-disabled="true"><b>App Store</b> · link coming soon</span></div></div><AppScreens /></div></section><section className="page-frame app-feature-section"><div data-reveal><p className="eyebrow">ONE SUBSCRIPTION</p><h2>Every calculator. One clear toolkit.</h2><p>All calculators are included with the subscription. Enter measurements in millimetres or metres, keep work grouped by project and review results without leaving the job behind.</p></div><ul className="feature-cards"><li data-reveal><span>01</span><h3>Metric first</h3><p>Measurements and results start in the units used on site.</p></li><li data-reveal><span>02</span><h3>New calculators</h3><p>New calculators are added regularly for active subscribers.</p></li><li data-reveal><span>03</span><h3>Member offers</h3><p>Subscriber-only member offers are coming soon.</p></li></ul></section><section className="page-frame calculator-grid"><div><p className="eyebrow">APP INFORMATION</p><h2>The important links stay easy to find.</h2></div><nav aria-label="RC Calculator legal links"><a href="/calculator-app/privacy/">Privacy information <Arrow /></a><a href="/calculator-app/terms/">Terms of use <Arrow /></a></nav></section></>;
}

function Legal({ path }: { path: string }) {
  const content: Record<string, [string, string, string[]]> = {
    '/legal/privacy/': ['PRIVACY', 'Privacy notice', ['Robweb keeps contact messages in its own protected database and records only aggregate, consent-gated analytics. It does not place names, email addresses or enquiry text in analytics or shop attribution.']],
    '/legal/terms/': ['WEBSITE TERMS', 'Terms for using this site', ['Product purchases and checkout take place on the separate Tools & Jigs store. App destinations and subscriptions are governed by the terms presented with the app.']],
    '/legal/disclaimer/': ['DISCLAIMER', 'Use the information with care', ['This website shares general construction information. It is not project-specific professional advice and does not replace competent assessment, manufacturer instructions or applicable requirements.']],
    '/legal/cookies/': ['COOKIE NOTICE', 'Your privacy choices', ['Non-essential analytics stays off until you accept it. Reject is equally available, and the privacy control lets you change the choice later.']],
  };
  const [eyebrow, title, paragraphs] = content[path] ?? content['/legal/privacy/'];
  return <><PageIntro eyebrow={eyebrow} title={title} index="07"><>{paragraphs.map((copy) => <p key={copy}>{copy}</p>)}</></PageIntro><section className="page-frame legal-sheet" data-reveal><p className="eyebrow">REVIEW STATUS</p><h2>Clear now. Final before launch.</h2><p>This foundation copy remains noindex. Final legal identity, contact details, processors and approved retention wording must be reviewed before go-live.</p></section></>;
}

function NotFound() {
  return <section className="not-found"><div className="blueprint-grid" aria-hidden="true" /><div className="page-frame"><p className="eyebrow">404 · OFF THE LINE</p><h1>That page doesn't fit here.</h1><p>The address may have moved or been mistyped.</p><a className="button" href="/">Back to home <Arrow /></a><nav aria-label="Useful pages"><a href="/media/">Media</a><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/contact/">Contact</a></nav></div></section>;
}

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />;
  if (path === '/media/') return <MediaPage />;
  if (path === '/shop/') return <Shop />;
  if (path === '/contact/') return <Contact />;
  if (path === '/cladding/') return <Cladding />;
  if (path === '/app/' || path.startsWith('/calculator-app/')) return <AppPage path={path} />;
  if (path.startsWith('/legal/')) return <Legal path={path} />;
  return <NotFound />;
}

export function Site({ path }: SiteProps) {
  if (path.startsWith('/admin')) return <AdminApp path={path} />;
  const [theme, setThemeState] = useState<Theme>('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const saved = localStorage.getItem('robweb-theme'); if (saved === 'light' || saved === 'dark') setThemeState(saved); }, []);
  const setTheme = (next: Theme) => { localStorage.setItem('robweb-theme', next); setThemeState(next); };
  const openMenu = useCallback(() => {
    if (menuOpen) return;
    const state = history.state && typeof history.state === 'object' ? history.state : {};
    history.pushState({ ...state, robwebMenuOpen: true }, '');
    setMenuOpen(true);
  }, [menuOpen]);
  const closeMenu = useCallback(() => {
    if (history.state?.robwebMenuOpen) history.back();
    else setMenuOpen(false);
  }, []);
  const closeForNavigation = useCallback((href: string) => {
    if (history.state?.robwebMenuOpen) {
      const state = { ...history.state } as Record<string, unknown>;
      delete state.robwebMenuOpen;
      history.replaceState(state, '');
    }
    setMenuOpen(false);
    location.assign(href);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnBack = () => setMenuOpen(false);
    addEventListener('popstate', closeOnBack);
    return () => removeEventListener('popstate', closeOnBack);
  }, [menuOpen]);
  const page = routeFor(path); const activePath = normalisePath(path);
  return <><div className={`site theme-${theme}`}><MotionChrome /><a className="skip-link" href="#content">Skip to content</a><Header path={activePath} theme={theme} setTheme={setTheme} menuOpen={menuOpen} openMenu={openMenu} /><main id="content" tabIndex={-1}><MotionPage path={activePath}><Page path={activePath} /></MotionPage></main><Footer /><ConsentBanner /><MobileDock menuOpen={menuOpen} openMenu={openMenu} />{!page && <span className="sr-only">Page not found</span>}</div><FullScreenMenu open={menuOpen} theme={theme} setTheme={setTheme} closeMenu={closeMenu} closeForNavigation={closeForNavigation} /></>;
}
