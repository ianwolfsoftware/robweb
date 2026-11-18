import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import shopSnapshot from '../content/shop-products.json';
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

function Header({ path, theme, setTheme }: { path: string; theme: Theme; setTheme: (theme: Theme) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', close);
    document.body.classList.add('menu-is-open');
    const frame = requestAnimationFrame(() => { if (menuRef.current) void animateMenu(menuRef.current); });
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', close); document.body.classList.remove('menu-is-open'); };
  }, [menuOpen]);
  return <header className="site-header"><div className="header-shell"><a className="brand" href="/" aria-label="Robin Clevett home"><BrandLogo /></a><div className="nav-pill"><nav className="desktop-nav" aria-label="Primary navigation">{navRoutes.map((route) => <a className={path === route.path ? 'active' : ''} aria-current={path === route.path ? 'page' : undefined} key={route.path} href={route.path}><span data-link-label>{route.navLabel}</span></a>)}</nav><ThemeControl theme={theme} setTheme={setTheme} /><a className="button button-small header-shop" data-magnetic href={shopUrl('/header/')}><span data-link-label>Tools &amp; Jigs</span> <Arrow external /></a><button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close site navigation' : 'Open site navigation'}><span /><span /><span /></button></div></div>
    {menuOpen && <div ref={menuRef} className="mobile-menu-panel" id="mobile-menu"><nav aria-label="Mobile navigation">{navRoutes.map((route, index) => <a className="mobile-menu-link" key={route.path} href={route.path} onClick={() => setMenuOpen(false)}><span>{String(index + 1).padStart(2, '0')}</span>{route.navLabel}<Arrow /></a>)}</nav><div className="mobile-menu-actions"><a className="button mobile-menu-link" href={shopUrl('/mobile-menu/')}>Tools &amp; Jigs <Arrow external /></a><p>Robin's products and the RC Calculators app, without the clutter.</p></div></div>}
  </header>;
}

const socials = [
  ['YouTube', 'https://www.youtube.com/@robinclevettcarpenter', '▶'], ['Instagram', 'https://www.instagram.com/robinclevett', '◎'],
  ['Facebook', 'https://www.facebook.com/robc.co.uk', 'f'], ['X', 'https://x.com/RobinClevett', '𝕏'],
  ['LinkedIn', 'https://www.linkedin.com/in/robin-clevett', 'in'], ['Pinterest', 'https://www.pinterest.co.uk/robinclevett', 'P'],
] as const;

function Footer() {
  return <footer className="site-footer"><div className="footer-gradient" aria-hidden="true" /><div className="page-frame footer-signoff"><div><a href="/" aria-label="Robin Clevett home"><BrandLogo footer /></a><p>Tools that earn their place. Site maths that stays close to the job.</p></div><div><p className="eyebrow">TWO USEFUL ROUTES</p><h2 data-split>Find the product. Make the calculation.</h2><div className="button-row"><a className="button" href="/shop/">Shop products <Arrow /></a><a className="button button-ghost" href="/app/">RC Calculators <Arrow /></a></div></div></div>
    <div className="page-frame footer-grid footer-grid-simple"><nav aria-label="Main links"><b>Explore</b><a href="/">Home</a><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/contact/">Contact</a><a href={shopUrl('/footer/')}>Tools &amp; Jigs ↗</a></nav><nav aria-label="Legal"><b>Legal</b><a href="/legal/privacy/">Privacy</a><a href="/legal/cookies/">Cookies</a><a href="/legal/terms/">Terms</a><a href="/legal/disclaimer/">Disclaimer</a></nav><div className="footer-socials"><b>Follow Robin</b><div>{socials.map(([label, href, icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><span aria-hidden="true">{icon}</span></a>)}</div></div><div className="footer-meta"><p>Noindex preview</p><p>Analytics stay off until you choose them.</p></div></div>
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
  return <><section className="home-hero"><div className="hero-stage" data-hero-stage><div className="hero-depth-field" aria-hidden="true" /><WebglSlot /><picture className="hero-portrait"><source media="(max-width: 47.99rem)" srcSet="/optimised/portrait-robin/robin-portrait-480-static.webp" type="image/webp" /><source media="(max-width: 47.99rem)" srcSet="/optimised/portrait-robin/robin-portrait-480-static.avif" type="image/avif" /><source srcSet="/optimised/portrait-robin/robin-portrait-800.webp 800w, /optimised/portrait-robin/robin-portrait-1200.webp 1200w" sizes="58vw" type="image/webp" /><source srcSet="/optimised/portrait-robin/robin-portrait-800.avif 800w, /optimised/portrait-robin/robin-portrait-1200.avif 1200w" sizes="58vw" type="image/avif" /><img data-hero-portrait src="/source/portraits/robin-portrait-cutout.png" alt="Robin Clevett smiling at the camera" width="1254" height="1254" fetchPriority="high" /></picture><div className="hero-light-sweep" data-hero-light aria-hidden="true" /></div><div className="hero-scrim" aria-hidden="true" /><div className="page-frame hero-content"><div className="hero-copy"><div className="hero-logo hero-intro"><BrandLogo hero /></div><h1 className="hero-title" data-split="hero" aria-label="Robin Clevett"><span className="hero-line">R<em className="accent-letter">o</em>bin</span><span className="hero-line">Clevett</span></h1><nav className="button-row hero-intro" aria-label="Featured destinations"><a className="button" data-magnetic href="/shop/">Products <Arrow /></a><a className="button button-ghost" href="/app/">RC Calculators <Arrow /></a></nav></div></div></section>
    <section className="name-marquee" aria-label="Robin Clevett"><div className="name-marquee-track" data-marquee-track><div className="name-marquee-group"><span>Robin Clevett</span><i className="marquee-spark">✦</i><span>Robin Clevett</span><i>✦</i></div><div className="name-marquee-group" aria-hidden="true"><span>Robin Clevett</span><i>✦</i><span>Robin Clevett</span><i>✦</i></div></div></section>
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

function PublicForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setState('sending'); const form = event.currentTarget; const data = new FormData(form); const payload = Object.fromEntries(data.entries());
    try { const response = await fetch('/api/forms/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, consent: data.get('consent') === 'on' }) }); if (!response.ok) throw new Error('submission failed'); const result = await response.json() as { reference: string }; setReference(result.reference); setState('sent'); form.reset(); } catch { setState('error'); }
  };
  if (state === 'sent') return <section className="form-receipt" role="status"><p className="eyebrow">MESSAGE RECEIVED</p><h2>Thank you.</h2><p>Your reference is <code>{reference}</code>. The message is in Robin's website inbox for review.</p></section>;
  return <form className="public-form" onSubmit={submit} noValidate><div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength={120} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label></div><div className="form-row"><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>Subject <span>(optional)</span><input name="subject" maxLength={160} /></label></div><label>Message<textarea name="message" rows={7} maxLength={4000} required /></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="check-field"><input name="consent" type="checkbox" required /><span>I understand this message will be stored so the enquiry can be handled. See the <a href="/legal/privacy/">privacy notice</a>.</span></label>{state === 'error' && <p className="form-error" role="alert">That did not send. Your message is still here—try again.</p>}<button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send enquiry'} <Arrow /></button></form>;
}

function Contact() {
  return <><PageIntro eyebrow="CONTACT" title="Start with the right information." index="04"><p>Share only what is needed. Messages are rate-limited, honeypot-protected and kept in this project's own admin inbox.</p></PageIntro><section className="page-frame contact-form-layout"><aside data-reveal><p className="eyebrow">BEFORE YOU SEND</p><h2>Keep it useful.</h2><p>Describe the product, app question or collaboration clearly. Do not include passwords, payment details or sensitive documents.</p></aside><div data-reveal><PublicForm /></div></section></>;
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
  return <section className="not-found"><div className="blueprint-grid" aria-hidden="true" /><div className="page-frame"><p className="eyebrow">404 · OFF THE LINE</p><h1>That page doesn't fit here.</h1><p>The address may have moved or been mistyped.</p><a className="button" href="/">Back to home <Arrow /></a><nav aria-label="Useful pages"><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/contact/">Contact</a></nav></div></section>;
}

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />;
  if (path === '/shop/') return <Shop />;
  if (path === '/contact/') return <Contact />;
  if (path === '/app/' || path.startsWith('/calculator-app/')) return <AppPage path={path} />;
  if (path.startsWith('/legal/')) return <Legal path={path} />;
  return <NotFound />;
}

export function Site({ path }: SiteProps) {
  if (path.startsWith('/admin')) return <AdminApp path={path} />;
  const [theme, setThemeState] = useState<Theme>('dark');
  useEffect(() => { const saved = localStorage.getItem('robweb-theme'); if (saved === 'light' || saved === 'dark') setThemeState(saved); }, []);
  const setTheme = (next: Theme) => { localStorage.setItem('robweb-theme', next); setThemeState(next); };
  const page = routeFor(path); const activePath = normalisePath(path);
  return <div className={`site theme-${theme}`}><MotionChrome /><a className="skip-link" href="#content">Skip to content</a><Header path={activePath} theme={theme} setTheme={setTheme} /><main id="content" tabIndex={-1}><MotionPage path={activePath}><Page path={activePath} /></MotionPage></main><Footer /><ConsentBanner />{!page && <span className="sr-only">Page not found</span>}</div>;
}
