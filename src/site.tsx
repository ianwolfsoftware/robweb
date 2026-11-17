import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import videosSource from '../content/videos.json';
import shopProductsSource from '../content/shop-products.json';
import { navRoutes, normalisePath, projectImages, routeFor, shopUrl } from './content';
import { AdminApp } from './admin';
import { MotionPage, WebglSlot } from './motion';
import { ConsentBanner } from './privacy';

type SiteProps = { path: string };
type Theme = 'dark' | 'light';

const extraMobileRoutes = [
  { path: '/about/', label: 'About Robin' },
  { path: '/robin-recommends/', label: 'Robin Recommends' },
  { path: '/register-interest/', label: 'Register interest' },
];

const optimisedImages: Record<string, { avif: string; webp: string; widths: number[] }> = {
  hero: { avif: '/optimised/robin-hero-{w}.avif', webp: '/optimised/robin-hero-{w}.webp', widths: [640, 960, 1440] },
  'project-detail': { avif: '/optimised/project-detail-{w}.avif', webp: '/optimised/project-detail-{w}.webp', widths: [480, 960] },
  'project-build': { avif: '/optimised/project-build-{w}.avif', webp: '/optimised/project-build-{w}.webp', widths: [480, 960] },
  'project-complete': { avif: '/optimised/project-complete-{w}.avif', webp: '/optimised/project-complete-{w}.webp', widths: [480, 960] },
  'project-interior': { avif: '/optimised/project-interior-{w}.avif', webp: '/optimised/project-interior-{w}.webp', widths: [480, 960] },
  'roof-steel': { avif: '/optimised/roof-steel-{w}.avif', webp: '/optimised/roof-steel-{w}.webp', widths: [480, 960] },
  'about-craft': { avif: '/optimised/about-craft-{w}.avif', webp: '/optimised/about-craft-{w}.webp', widths: [480, 960] },
};

const projectOptimised = ['project-detail', 'project-build', 'project-complete', 'project-interior'];

function Arrow({ external = false }: { external?: boolean }) {
  return <span aria-hidden="true" className="arrow">{external ? '↗' : '→'}</span>;
}

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`brand-art ${footer ? 'brand-art-footer' : ''}`} aria-hidden="true">
      <img className="brand-logo brand-logo-dark" src="/source/2020/08/cropped-logo-1.png" width="500" height="200" alt="" />
      {!footer && <span className="brand-logo-light"><img src="/brand/logo-steel.svg" width="441" height="224" alt="" /><b>ROBIN CLEVETT</b></span>}
    </span>
  );
}

function ResponsiveImage({ sourceKey, src, alt, width, height, className = '', sizes = '100vw', eager = false }: {
  sourceKey?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const source = sourceKey ? optimisedImages[sourceKey] : undefined;
  const set = (template: string) => source?.widths.map((w) => `${template.replace('{w}', String(w))} ${w}w`).join(', ');
  return (
    <picture>
      {source && <source type="image/avif" srcSet={set(source.avif)} sizes={sizes} />}
      {source && <source type="image/webp" srcSet={set(source.webp)} sizes={sizes} />}
      <img src={src} alt={alt} width={width} height={height} className={className} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />
    </picture>
  );
}

function ThemeControl({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Use ${next} appearance`;
  return (
    <button className="theme-toggle" type="button" onClick={() => setTheme(next)} aria-label={label} title={label}>
      <span className="theme-icon" aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Header({ path, theme, setTheme }: { path: string; theme: Theme; setTheme: (theme: Theme) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', close);
    document.body.classList.add('menu-is-open');
    void import('animejs').then(({ animate, stagger }) => {
      animate('.mobile-menu-panel', { opacity: [0, 1], translateY: [-20, 0], duration: 300, ease: 'out(3)' });
      animate('.mobile-menu-link', { opacity: [0, 1], translateY: [24, 0], delay: stagger(45, { start: 80 }), duration: 420, ease: 'out(3)' });
    });
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('menu-is-open'); };
  }, [menuOpen]);
  return (
    <header className="site-header">
      <div className="header-shell">
        <a className="brand" href="/" aria-label="Robin Clevett home"><BrandLogo /></a>
        <div className="nav-pill">
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navRoutes.map((route) => <a className={path === route.path ? 'active' : ''} aria-current={path === route.path ? 'page' : undefined} key={route.path} href={route.path}>{route.navLabel}</a>)}
          </nav>
          <ThemeControl theme={theme} setTheme={setTheme} />
          <a className="button button-small header-shop" data-magnetic href={shopUrl('/header/')}>Tools &amp; Jigs <Arrow external /></a>
          <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Close site navigation' : 'Open site navigation'}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      {menuOpen && <div className="mobile-menu-panel" id="mobile-menu">
        <nav aria-label="Mobile navigation">
          {[...navRoutes, ...extraMobileRoutes.map((route) => ({ ...route, navLabel: route.label }))].map((route, index) => <a className="mobile-menu-link" key={route.path} href={route.path} onClick={() => setMenuOpen(false)}><span>{String(index + 1).padStart(2, '0')}</span>{route.navLabel}<Arrow /></a>)}
        </nav>
        <div className="mobile-menu-actions">
          <a className="button mobile-menu-link" href={shopUrl('/mobile-menu/')}>Tools &amp; Jigs <Arrow external /></a>
          <p>Robin's work, videos, practical tools and calculator app.</p>
        </div>
      </div>}
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-frame footer-signoff">
        <div><a href="/" aria-label="Robin Clevett home"><BrandLogo footer /></a><p>Construction, carpentry and practical know-how, built around the work.</p></div>
        <div><p className="eyebrow">READY FOR THE NEXT JOB?</p><h2>Start with the right route.</h2><a className="button" data-magnetic href="/contact/">Contact Robin <Arrow /></a></div>
      </div>
      <div className="page-frame footer-grid">
        <nav aria-label="Explore"><b>Explore</b><a href="/about/">About</a><a href="/projects/">Work</a><a href="/services/">Services</a><a href="/videos/">Videos</a></nav>
        <nav aria-label="Tools"><b>Tools</b><a href="/app/">RC Calculators</a><a href="/shop/">Shop</a><a href={shopUrl('/footer/')}>Tools &amp; Jigs ↗</a><a href="/robin-recommends/">Robin Recommends</a></nav>
        <nav aria-label="Legal"><b>Legal</b><a href="/legal/privacy/">Privacy</a><a href="/legal/cookies/">Cookies</a><a href="/legal/terms/">Terms</a><a href="/legal/disclaimer/">Disclaimer</a></nav>
        <div className="footer-meta"><p>Noindex preview</p><p>Analytics stay off until you choose them.</p></div>
      </div>
    </footer>
  );
}

function PageIntro({ eyebrow, title, children, index = '01' }: { eyebrow: string; title: string; children: ReactNode; index?: string }) {
  return <section className="page-hero"><div className="blueprint-grid" aria-hidden="true" /><div className="page-frame page-hero-inner"><div data-reveal><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="intro-copy">{children}</div></div><span className="page-index" aria-hidden="true">{index} / RC</span></div></section>;
}

function StatBand() {
  const stats = [
    { value: 111, label: 'Robin-owned local media files' },
    { value: 15, label: 'Recent channel titles recorded' },
    { value: 4, label: 'Project stages selected here' },
  ];
  return <dl className="stat-band page-frame" data-reveal>{stats.map((stat) => <div key={stat.label}><dd><span data-count={stat.value}>{stat.value}</span></dd><dt>{stat.label}</dt></div>)}</dl>;
}

function ProofMarquee() {
  const videos = videosSource.videos.filter((video) => !video.title.toLowerCase().startsWith('ad.')).slice(0, 6);
  const items = [...videos, ...videos];
  return <section className="proof-marquee" aria-label="Latest YouTube and Instagram proof"><div className="marquee-heading page-frame"><p className="eyebrow">FROM ROBIN'S CHANNELS</p><p>Current work. Current methods. No stock stories.</p></div><div className="marquee-window"><div className="marquee-track">{items.map((video, index) => <a tabIndex={index >= videos.length ? -1 : 0} aria-hidden={index >= videos.length ? 'true' : undefined} href={video.url} target="_blank" rel="noreferrer" key={`${video.id}-${index}`}><span>{video.suggestedTopicTag}</span><b>{video.title}</b><Arrow external /></a>)}</div></div><div className="social-row page-frame"><a href={videosSource.channelUrl} target="_blank" rel="noreferrer">YouTube <Arrow external /></a><a href="https://www.instagram.com/robinclevett" target="_blank" rel="noreferrer">Instagram <Arrow external /></a></div></section>;
}

function Home() {
  return <>
    <section className="home-hero">
      <WebglSlot />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-photo" aria-hidden="true"><ResponsiveImage sourceKey="hero" src="/source/2020/08/cropped-Robin-2-20180319-222021724-2.jpg" alt="" width={1920} height={1080} sizes="(max-width: 700px) 100vw, 62vw" eager /></div>
      <div className="page-frame hero-content">
        <div className="hero-copy">
          <p className="eyebrow hero-intro">CARPENTRY · BUILDING · KNOW-HOW</p>
          <h1 className="hero-title"><span className="hero-line">Built properly.</span><span className="hero-line accent-text">Explained clearly.</span></h1>
          <p className="lead hero-intro">Robin Clevett shares the work, tools and hard-won details behind better building.</p>
          <div className="button-row hero-intro"><a className="button" data-magnetic href="/videos/">Watch Robin's videos <Arrow /></a><a className="button button-ghost" href="/projects/">See the work <Arrow /></a></div>
          <p className="hero-note hero-intro">Real projects · Robin's own media · Metric first</p>
        </div>
        <span className="hero-measure hero-intro" aria-hidden="true">ROOF STUDY / 4 800 MM</span>
      </div>
    </section>
    <StatBand />
    <ProofMarquee />
    <section className="editorial-section page-frame work-feature" data-reveal>
      <div className="section-heading"><p className="eyebrow">WORK IN THE REAL WORLD</p><h2>Details you can see. Judgement earned on site.</h2><a className="text-link" href="/projects/">Explore selected work <Arrow /></a></div>
      <figure className="feature-image"><ResponsiveImage sourceKey="project-build" src={projectImages[1].src} alt={projectImages[1].alt} width={1024} height={768} sizes="(max-width: 760px) 100vw, 60vw" /><figcaption><span>Project record / 02</span><b>Structure taking shape</b></figcaption></figure>
    </section>
    <section className="split-band shop-band" data-reveal><div className="split-art tool-art" aria-hidden="true"><span /><span /><b>90°</b></div><div className="split-copy"><p className="eyebrow">TOOLS &amp; JIGS</p><h2>Made for the way the job actually goes.</h2><p>Browse the reviewed range here, then buy from Robin's official Tools &amp; Jigs store.</p><div className="button-row"><a className="button button-dark" href="/shop/">Explore the shop <Arrow /></a><a className="text-link" href={shopUrl('/home-tools/')}>Official store <Arrow external /></a></div></div></section>
    <section className="split-band app-band" data-reveal><div className="split-copy"><p className="eyebrow">RC CALCULATORS</p><h2>Site maths without the head-scratching.</h2><p>A metric-first calculator app with its public landing, privacy and terms routes kept easy to find.</p><a className="button" href="/app/">Discover the app <Arrow /></a></div><div className="phone-stage"><picture><source srcSet="/app/v3-login-screen.avif" type="image/avif" /><source srcSet="/app/v3-login-screen.webp" type="image/webp" /><img src="/app/v3-login-screen.png" width="390" height="844" loading="lazy" alt="RC Calculators V3 sign-in screen" /></picture></div></section>
  </>;
}

function About() {
  return <><PageIntro eyebrow="ABOUT ROBIN" title="A life in construction, shared straight." index="02"><p>Robin's original site records a career built around construction, restoration and practical detail. This is where the work, videos and tools come together without the old site's clutter.</p></PageIntro><section className="editorial-section page-frame about-grid" data-reveal><div className="portrait-stack"><ResponsiveImage sourceKey="about-craft" src="/source/2012/03/Traditional-design-techniques.jpg" alt="Robin fitting a shaped timber detail" width={2848} height={4288} sizes="(max-width: 760px) 100vw, 52vw" /><img className="portrait-inset" src="/source/2013/09/Taking-a-break-200x300.jpg" width="200" height="300" loading="lazy" alt="Robin Clevett taking a break on a timber frame" /></div><div><p className="eyebrow">THE APPROACH</p><h2>Respect the material. Explain the method.</h2><p>Useful knowledge is easier to act on when it is grounded in the work. That is the thread connecting Robin's project archive, practical video and tools.</p><p>Claims and credentials stay deliberately modest until Robin approves the final words.</p><a className="button" href="/videos/">Learn by watching <Arrow /></a></div></section><section className="quote-band" data-reveal><div className="page-frame"><span>“</span><p>Show the detail. Share what works. Keep the route to the answer clear.</p></div></section></>;
}

function Services() {
  const services = [
    ['Construction work', 'A concise route into Robin’s recorded construction and restoration work.'],
    ['Carpentry & detail', 'Practical techniques organised through Robin’s own videos and project imagery.'],
    ['Project enquiries', 'A direct contact route while current scope and availability are confirmed.'],
  ];
  return <><PageIntro eyebrow="SERVICES" title="Clear work. Clear next steps." index="03"><p>The legacy services page is preserved in the inventory. This version groups what people need without making unapproved availability, safety or regulatory promises.</p></PageIntro><section className="page-frame numbered-grid">{services.map(([title, copy], index) => <article data-reveal key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p>{index < 2 ? <a className="text-link" href={index === 0 ? '/projects/' : '/videos/'}>Explore <Arrow /></a> : <a className="text-link" href="/contact/">Enquire <Arrow /></a>}</article>)}</section><section className="image-banner" data-reveal><ResponsiveImage sourceKey="roof-steel" src="/source/2014/07/New-steelwork-and-roof-construction-1024x768.jpg" alt="Steelwork and roof construction in progress" width={1024} height={768} sizes="100vw" /><div><p className="eyebrow">HAVE A PROJECT IN MIND?</p><h2>Start with the facts, not a sales pitch.</h2><a className="button" href="/contact/">Contact Robin <Arrow /></a></div></section></>;
}

function Projects() {
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (selected === null) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowRight') setSelected((selected + 1) % projectImages.length);
      if (event.key === 'ArrowLeft') setSelected((selected - 1 + projectImages.length) % projectImages.length);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [selected]);
  const active = selected === null ? null : projectImages[selected];
  return <><PageIntro eyebrow="WORK / PROJECTS" title="Work, captured as it happened." index="04"><p>A source-led sequence from demolition and structure to completed details. No invented locations, testimonials or project claims.</p></PageIntro><section className="page-frame project-grid">{projectImages.map((image, index) => <button type="button" onClick={() => setSelected(index)} key={image.src} className={`project-card project-card-${index + 1}`} data-reveal aria-label={`Open ${image.label} image`}><ResponsiveImage sourceKey={projectOptimised[index]} src={image.src} alt={image.alt} width={1024} height={768} sizes="(max-width: 760px) 100vw, 50vw" /><span><small>Project record / 0{index + 1}</small><b>{image.label}</b><i>View</i></span></button>)}</section><section className="page-frame source-note" data-reveal><p className="eyebrow">SOURCE-LED CONTENT</p><h2>More stories can be added when captions, locations and permissions are approved.</h2><a className="text-link" href="/contact/">Ask about a project <Arrow /></a></section>{active && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${active.label} project image`}><button className="lightbox-close" onClick={() => setSelected(null)} aria-label="Close image">×</button><button className="lightbox-prev" onClick={() => setSelected((selected! - 1 + projectImages.length) % projectImages.length)} aria-label="Previous image">←</button><img src={active.src} alt={active.alt} /><div><span>0{selected! + 1} / 0{projectImages.length}</span><b>{active.label}</b></div><button className="lightbox-next" onClick={() => setSelected((selected! + 1) % projectImages.length)} aria-label="Next image">→</button></div>}</>;
}

function Videos() {
  const videos = videosSource.videos.filter((video) => !video.title.toLowerCase().startsWith('ad.'));
  return <><PageIntro eyebrow="VIDEOS" title="Practical knowledge, from the job." index="05"><p>Recent non-advertising titles recorded from Robin's public YouTube channel. A video opens on YouTube only when you choose it; nothing embeds or contacts YouTube beforehand.</p></PageIntro><ProofMarquee /><section className="page-frame video-grid">{videos.map((video, index) => <article className="video-card" data-reveal key={video.id}><div className="video-art"><span>RC / {String(index + 1).padStart(2, '0')}</span><b>▶</b><i>{video.suggestedTopicTag}</i></div><p>{new Intl.DateTimeFormat('en-IE', { month: 'short', year: 'numeric' }).format(new Date(video.published))}</p><h2>{video.title}</h2><a href={video.url} target="_blank" rel="noreferrer">Watch on YouTube <Arrow external /></a></article>)}</section></>;
}

function ToolsAndJigs() {
  const products = (shopProductsSource as { products?: Array<{ id: string | number; title: string; handle: string; images?: Array<{ src: string }> }> }).products ?? [];
  return <><PageIntro eyebrow="SHOP / TOOLS & JIGS" title="Tools chosen for the work." index="06"><p>Tools and Jigs is Robin's separate Shopify shop. Product details, prices, stock, checkout and customer accounts remain authoritative there.</p></PageIntro><section className="page-frame shop-lead" data-reveal><div className="shop-image"><ResponsiveImage sourceKey="roof-steel" src="/source/2014/07/New-steelwork-and-roof-construction-1024x768.jpg" alt="Steelwork and roof construction in progress" width={1024} height={768} sizes="(max-width: 760px) 100vw, 52vw" /></div><div><p className="eyebrow">THE OFFICIAL STORE</p><h2>Browse here. Buy at source.</h2><p>{products.length ? 'This page reads the reviewed product cache. Buying and authoritative product details remain on the official store.' : 'The reviewed product cache is empty after the public feed rate-limited its first request. Nothing is guessed; the official store remains the source.'}</p><a className="button" data-magnetic href={shopUrl('/shop/')}>Open Tools &amp; Jigs <Arrow external /></a></div></section>{products.length > 0 && <section className="page-frame product-grid">{products.map((product) => <article data-reveal key={product.id}>{product.images?.[0] && <img src={product.images[0].src} alt="" loading="lazy" />}<h2>{product.title}</h2><a className="text-link" href={shopUrl('/shop/product/', `https://toolsandjigs.com/products/${product.handle}`)}>View at source <Arrow external /></a></article>)}</section>}<section className="process-band"><div className="page-frame"><p className="eyebrow">A CLEAN HAND-OFF</p><ol>{[['Choose the job', 'Find the right route for the work in hand.'], ['Check at source', 'Open current product detail, price and stock at the official shop.'], ['Get on with it', 'Checkout stays securely with Tools & Jigs.']].map(([title, copy], index) => <li data-reveal key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p></li>)}</ol></div></section></>;
}

function PublicForm({ type }: { type: 'contact' | 'interest' }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setState('sending');
    const form = event.currentTarget; const data = new FormData(form);
    const body: Record<string, unknown> = Object.fromEntries(data.entries()); body.consent = data.get('consent') === 'on';
    try {
      const response = await fetch(`/api/forms/${type}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json() as { reference?: string };
      if (!response.ok || !result.reference) throw new Error('send_failed');
      setReference(result.reference); setState('sent'); form.reset();
    } catch { setState('error'); }
  };
  if (state === 'sent') return <section className="form-receipt" role="status"><p className="eyebrow">MESSAGE RECEIVED</p><h2>Thank you.</h2><p>Your reference is <code>{reference}</code>. The message is now in Robin's website inbox for review.</p></section>;
  return <form className="public-form" onSubmit={submit} noValidate><div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength={120} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label></div><div className="form-row"><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>Subject <span>(optional)</span><input name="subject" maxLength={160} /></label></div><label>Message<textarea name="message" rows={7} maxLength={4000} required /></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="check-field"><input name="consent" type="checkbox" required /><span>I understand this message will be stored so the enquiry can be handled. See the <a href="/legal/privacy/">privacy notice</a>.</span></label>{state === 'error' && <p className="form-error" role="alert">That did not send. Your message is still here—try again.</p>}<button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : type === 'interest' ? 'Register interest' : 'Send enquiry'} <Arrow /></button></form>;
}

function Contact({ interest = false }: { interest?: boolean }) {
  return <><PageIntro eyebrow={interest ? 'REGISTER YOUR INTEREST' : 'CONTACT'} title={interest ? 'Tell Robin what you want to hear about.' : 'Let’s start with the right information.'} index={interest ? '08' : '07'}><p>{interest ? 'A route for genuine interest in future work, updates or collaboration. It does not silently add you to a third-party mailing list.' : 'Share only what is needed. Messages are rate-limited, honeypot-protected and kept in this project’s own admin inbox.'}</p></PageIntro><section className="page-frame contact-form-layout"><aside data-reveal><p className="eyebrow">{interest ? 'PURPOSE FIRST' : 'BEFORE YOU SEND'}</p><h2>{interest ? 'A short note is enough.' : 'Keep it useful.'}</h2><p>{interest ? 'Say what interests you and how you would like the team to respond. The default retention period is 90 days and can be changed by an owner.' : 'Describe the project, question or collaboration clearly. Do not include passwords, payment details or sensitive documents.'}</p>{!interest && <a className="text-link" href="/register-interest/">Register interest instead <Arrow /></a>}</aside><div data-reveal><PublicForm type={interest ? 'interest' : 'contact'} /></div></section></>;
}

function RobinRecommends() {
  const cards = [
    ['Tools', 'Robin’s own current range lives at the official Tools & Jigs store.', shopUrl('/robin-recommends/'), 'Open the shop'],
    ['Videos', 'Robin’s public channel is the verified source for current practical walkthroughs.', '/videos/', 'Browse videos'],
    ['Disclosure', 'Commercial or affiliate relationships will sit beside the relevant link, never hidden in a general footer.', '', ''],
  ];
  return <><PageIntro eyebrow="ROBIN RECOMMENDS" title="Useful resources, clearly labelled." index="09"><p>Recommendations are grouped by their job. Every item needs Robin's current approval and every commercial relationship needs a clear disclosure.</p></PageIntro><section className="page-frame numbered-grid recommends-grid">{cards.map(([title, copy, href, label], index) => <article data-reveal key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p>{href && <a className="text-link" href={href}>{label} <Arrow external={href.startsWith('/go/')} /></a>}</article>)}</section></>;
}

function Legal({ path }: { path: string }) {
  const pages: Record<string, [string, string, string[]]> = {
    '/legal/privacy/': ['PRIVACY', 'Privacy notice', ['Contact and interest forms store the fields you submit in Robweb’s own database so authorised owner/editor users can respond.', 'The default form-retention setting is 90 days. Final legal identity, contact and processor wording requires Ian/Paul review before go-live.', 'Site analytics remain off until you accept. First-party counters store day, path, referrer host and device class only; they do not store an IP address. Whether those counters may run without consent remains to be confirmed with Ian/Paul under Irish ePrivacy.']],
    '/legal/terms/': ['TERMS', 'Website terms', ['This website shares Robin Clevett’s work, videos, app information and routes to the separate Tools and Jigs store.', 'Final legal terms require owner review before go-live. Nothing on this site changes the official store’s checkout terms.']],
    '/legal/disclaimer/': ['DISCLAIMER', 'Information, not site-specific advice', ['Construction content is general information and personal experience. It is not a substitute for site-specific professional advice, design, regulation checks or manufacturer instructions.', 'No safety, compliance or performance claim should be inferred from decorative measurements, project imagery or calculator descriptions.']],
    '/legal/cookies/': ['COOKIES & ANALYTICS', 'Your analytics choice', ['Essential site code and the privacy preference work without GA4. Google Analytics is not requested until you actively accept analytics.', 'If accepted, the configured GA4 property and privacy-limited first-party counters receive page-level usage information without form fields, names, email addresses or message text.', 'Use the Privacy preferences button at the bottom of any page to change the choice.']],
  };
  const [eyebrow, title, paragraphs] = pages[path] ?? pages['/legal/privacy/'];
  return <><PageIntro eyebrow={eyebrow} title={title} index="10"><>{paragraphs.map((copy) => <p key={copy}>{copy}</p>)}</></PageIntro><section className="page-frame legal-sheet" data-reveal><p className="eyebrow">REVIEW STATUS</p><h2>Clear now. Final before launch.</h2><p>This foundation copy is deliberately narrow and remains noindex. Final legal identity, contact details, processors and approved retention wording must be reviewed before go-live.</p></section></>;
}

function CalculatorApp({ path }: { path: string }) {
  if (path === '/calculator-app/privacy/') return <><PageIntro eyebrow="RC CALCULATORS" title="Privacy information" index="11"><p>The published calculator-app privacy URL is preserved exactly. The legacy text is held in the source inventory for review; final wording needs the confirmed app destinations.</p></PageIntro><section className="page-frame legal-sheet"><h2>Privacy review pending</h2><p>No app-store, web-app or tracking destination has been assumed. This path remains stable while the final policy is approved.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  if (path === '/calculator-app/terms/') return <><PageIntro eyebrow="RC CALCULATORS" title="Terms of use" index="12"><p>The published calculator-app terms URL is preserved exactly. This preview does not infer new terms or safety claims.</p></PageIntro><section className="page-frame legal-sheet"><h2>Terms review pending</h2><p>A confirmed calculator destination and reviewed terms are required before final public legal copy is published.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  const destinations = [import.meta.env?.VITE_WEB_APP_URL, import.meta.env?.VITE_APP_STORE_URL, import.meta.env?.VITE_PLAY_STORE_URL].filter(Boolean);
  return <><section className="app-hero"><div className="page-frame app-hero-grid"><div data-reveal><p className="eyebrow">RC CALCULATORS · V3</p><h1>Site maths, measured for the job.</h1><p className="lead">A metric-first calculator app with a dark, focused interface and its public legal routes kept intact.</p><div className="store-actions">{destinations.length ? destinations.map((url) => <a className="button" href={url} key={url}>Open RC Calculators <Arrow /></a>) : <><span>App Store · link awaiting approval</span><span>Google Play · link awaiting approval</span></>}</div></div><div className="app-device" data-reveal><picture><source srcSet="/app/v3-login-screen.avif" type="image/avif" /><source srcSet="/app/v3-login-screen.webp" type="image/webp" /><img src="/app/v3-login-screen.png" width="390" height="844" alt="Real RC Calculators V3 sign-in screen" /></picture><i aria-hidden="true">REAL V3 SCREEN / 17.11.26</i></div></div></section><section className="page-frame calculator-grid" data-reveal><div><p className="eyebrow">CHOOSE · ENTER · REVIEW</p><h2>Calculations should support the job, not interrupt it.</h2><p>Choose the relevant calculator, enter known measurements in millimetres or metres, then review the result in the context of the job and applicable guidance.</p></div><nav aria-label="RC Calculator legal links"><a href="/calculator-app/privacy/">Privacy information <Arrow /></a><a href="/calculator-app/terms/">Terms of use <Arrow /></a></nav></section></>;
}

function NotFound() {
  return <section className="not-found"><div className="blueprint-grid" aria-hidden="true" /><div className="page-frame"><p className="eyebrow">404 · OFF THE LINE</p><h1>That page doesn't fit here.</h1><p>The address may have moved or been mistyped.</p><a className="button" href="/">Back to home <Arrow /></a><nav aria-label="Useful pages"><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/videos/">Videos</a><a href="/contact/">Contact</a></nav></div></section>;
}

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />;
  if (path === '/about/') return <About />;
  if (path === '/services/') return <Services />;
  if (path === '/projects/') return <Projects />;
  if (path === '/videos/') return <Videos />;
  if (path === '/tools-and-jigs/' || path === '/shop/') return <ToolsAndJigs />;
  if (path === '/contact/') return <Contact />;
  if (path === '/register-interest/') return <Contact interest />;
  if (path === '/robin-recommends/') return <RobinRecommends />;
  if (path.startsWith('/legal/')) return <Legal path={path} />;
  if (path === '/app/' || path.startsWith('/calculator-app/')) return <CalculatorApp path={path === '/app/' ? '/calculator-app/' : path} />;
  return <NotFound />;
}

export function Site({ path }: SiteProps) {
  if (path.startsWith('/admin')) return <AdminApp path={path} />;
  const [theme, setThemeState] = useState<Theme>('dark');
  useEffect(() => {
    const saved = localStorage.getItem('robweb-theme');
    if (saved === 'light' || saved === 'dark') setThemeState(saved);
  }, []);
  const setTheme = (next: Theme) => { localStorage.setItem('robweb-theme', next); setThemeState(next); };
  const page = routeFor(path);
  const activePath = normalisePath(path);
  return <div className={`site theme-${theme}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <Header path={activePath} theme={theme} setTheme={setTheme} />
    <main id="content" tabIndex={-1}><MotionPage path={activePath}><Page path={activePath} /></MotionPage></main>
    <Footer />
    <ConsentBanner />
    {!page && <span className="sr-only">Page not found</span>}
  </div>;
}
