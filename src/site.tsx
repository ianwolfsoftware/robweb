import { useState, type FormEvent } from 'react';
import videosSource from '../content/videos.json';
import shopProductsSource from '../content/shop-products.json';
import { navRoutes, normalisePath, projectImages, routeFor, shopUrl } from './content';
import { AdminApp } from './admin';
import { MotionPage, WebglSlot } from './motion';
import { ConsentBanner } from './privacy';

type SiteProps = { path: string };
type Theme = 'system' | 'dark' | 'light';

const toolSteps = [
  ['1', 'Choose the job', 'Browse the Tools and Jigs shop when you know what will make the job easier.'],
  ['2', 'Open the product at source', 'Products, pricing, availability and checkout stay on the official shop.'],
  ['3', 'Get on with the work', 'This site keeps the route clear: practical work, videos and the calculator app.'],
];

function Arrow() {
  return <span aria-hidden="true" className="ml-2">→</span>;
}

function ThemeControl({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  const label = theme === 'system' ? 'Use dark appearance' : theme === 'dark' ? 'Use light appearance' : 'Use system appearance';
  return (
    <button className="theme-toggle" type="button" onClick={() => setTheme(next)} aria-label={label}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : theme === 'light' ? '◐' : '◒'}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Header({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  return (
    <header className="site-header">
      <div className="page-frame header-inner">
        <a className="brand" href="/" aria-label="Robin Clevett home">
          <span>ROBIN</span><span>CLEVETT</span>
          <i>Construction · craft · practical know-how</i>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navRoutes.map((route) => <a key={route.path} href={route.path}>{route.navLabel}</a>)}
        </nav>
        <div className="header-actions">
          <ThemeControl theme={theme} setTheme={setTheme} />
          <a className="button button-small header-shop" href={shopUrl('/header/')}>Tools &amp; Jigs <Arrow /></a>
          <details className="mobile-nav">
            <summary aria-label="Open site navigation"><span /><span /><span /></summary>
            <nav aria-label="Mobile navigation">
              {navRoutes.map((route) => <a key={route.path} href={route.path}>{route.navLabel}</a>)}
              <a href={shopUrl('/mobile-menu/')}>Tools &amp; Jigs ↗</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-frame footer-grid">
        <div><p className="eyebrow">ROBIN CLEVETT</p><p className="footer-mark">Built around the work.</p></div>
        <nav aria-label="Footer navigation" className="footer-links">
          <a href="/about/">About</a><a href="/projects/">Projects</a><a href="/videos/">Videos</a><a href="/shop/">Shop</a><a href="/contact/">Contact</a><a href="/app/">RC Calculators</a><a href="/robin-recommends/">Robin Recommends</a><a href="/legal/privacy/">Privacy</a><a href="/legal/cookies/">Cookies</a><a href="/legal/terms/">Terms</a>
        </nav>
        <p className="footer-note">Noindex foundation — analytics remain off until you choose them.</p>
      </div>
    </footer>
  );
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="page-intro page-frame"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="intro-copy">{children}</div></section>;
}

function Image({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

function Home() {
  return <>
    <section className="hero page-frame">
      <div className="hero-copy">
        <p className="eyebrow">ROBIN CLEVETT · CONSTRUCTION INDUSTRY FANATIC</p>
        <h1>Made for people who care how the work is done.</h1>
        <p className="lead">Practical construction work, straight-talking videos and tools selected for the job in hand.</p>
        <div className="button-row"><a className="button" href="/videos/">Watch the latest videos <Arrow /></a><a className="text-link" href="/projects/">See selected projects <Arrow /></a></div>
      </div>
      <div className="hero-image-wrap">
        <Image src="/source/2020/08/cropped-Robin-2-20180319-222021724-2.jpg" alt="Robin Clevett at work" className="hero-image" />
        <span className="image-caption">Construction · carpentry · site life</span>
      </div>
      <WebglSlot />
    </section>
    <section className="band"><div className="page-frame quick-grid">
      <a href="/app/"><b>RC Calculators</b><span>Metric-first tools for the job <Arrow /></span></a>
      <a href="/shop/"><b>Tools &amp; Jigs</b><span>Browse before opening the official shop <Arrow /></span></a>
      <a href="/contact/"><b>Get in touch</b><span>Enquiries and updates <Arrow /></span></a>
    </div></section>
    <section className="page-frame feature-split">
      <div><p className="eyebrow">IN THE WORKSHOP &amp; ON SITE</p><h2>From first cut to finished detail.</h2><p>The source inventory records Robin’s long-running project gallery: demolition, structure, roof work, interiors and completed details. This first public shell keeps those real images central and avoids stock substitutes.</p><a className="text-link" href="/projects/">Explore the project record <Arrow /></a></div>
      <div className="image-pair"><Image src={projectImages[0].src} alt={projectImages[0].alt} /><Image src={projectImages[2].src} alt={projectImages[2].alt} /></div>
    </section>
    <section className="page-frame latest-strip"><div><p className="eyebrow">LEARN BY WATCHING</p><h2>Current practical videos.</h2></div><a className="button button-outline" href="/videos/">View all videos <Arrow /></a></section>
  </>;
}

function About() {
  return <><PageIntro eyebrow="ABOUT ROBIN" title="A life in construction, shared clearly."><p>Robin’s original site describes a career built around construction, restoration and practical detail. This space brings that work, the videos and the tools together without the old site’s clutter.</p><p>It is a source-led preview: claims, credentials and project captions remain deliberately modest until Robin approves the final copy.</p></PageIntro><section className="page-frame image-statement"><Image src="/source/2012/03/Traditional-design-techniques.jpg" alt="Traditional construction design detail"/><div><p className="eyebrow">THE APPROACH</p><h2>Respect the material. Explain the method.</h2><p>Useful knowledge is easier to use when it is grounded in the work. That is the thread connecting projects, video and the shop.</p><a className="button" href="/videos/">Browse videos <Arrow /></a></div></section></>;
}

function Services() {
  const services = [
    ['Construction work', 'A concise, current overview is being prepared from Robin’s legacy services page.'],
    ['Carpentry & detail', 'Practical how-to content is organised through Robin’s videos and project images.'],
    ['Project guidance', 'Use the contact route for enquiries while scope and availability are confirmed.'],
  ];
  return <><PageIntro eyebrow="SERVICES" title="Clear work. Clear next steps."><p>The old services page is preserved in the content inventory. This shell groups the intent into a simple route to projects, videos and an enquiry — without making unapproved availability, safety or regulatory promises.</p></PageIntro><section className="page-frame card-grid">{services.map(([title, copy], index) => <article className="info-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{copy}</p></article>)}</section><section className="page-frame callout"><p className="eyebrow">HAVE A PROJECT IN MIND?</p><h2>Start with the facts, not a sales pitch.</h2><a className="button" href="/contact/">Contact Robin <Arrow /></a></section></>;
}

function Projects() {
  return <><PageIntro eyebrow="PROJECTS" title="Work, captured as it happened."><p>The source inventory holds Robin-owned images from a documented pavilion project, covering demolition, foundations, structure, roof and finished details. This curated set preserves that sequence rather than pretending every historic image has a final caption or location approval.</p></PageIntro><section className="page-frame project-grid">{projectImages.map((image, index) => <figure key={image.src} className={`project-card project-card-${index + 1}`}><Image src={image.src} alt={image.alt}/><figcaption><span>Project record</span><b>{image.label}</b></figcaption></figure>)}</section><section className="page-frame callout muted"><p className="eyebrow">SOURCE-LED CONTENT</p><h2>More project stories can be added once captions, locations and permissions are approved.</h2><a className="text-link" href="/contact/">Ask about a project <Arrow /></a></section></>;
}

function Videos() {
  const videos = videosSource.videos.filter((video) => !video.title.toLowerCase().startsWith('ad.'));
  return <><PageIntro eyebrow="VIDEOS" title="Practical knowledge, from the job."><p>These are the latest non-advertising titles recorded from Robin’s public YouTube channel in the source inventory. Each opens on YouTube only when you choose it; this shell does not embed a player or contact YouTube beforehand.</p></PageIntro><section className="page-frame video-grid">{videos.map((video) => <article className="video-card" key={video.id}><div className="video-placeholder"><span>{video.suggestedTopicTag}</span><b>▶</b></div><p>{new Intl.DateTimeFormat('en-IE', { month: 'short', year: 'numeric' }).format(new Date(video.published))}</p><h2>{video.title}</h2><a href={video.url} target="_blank" rel="noreferrer">Watch on YouTube <Arrow /></a></article>)}</section></>;
}

function ToolsAndJigs() {
  const products = (shopProductsSource as { products?: Array<{ id: string | number; title: string; handle: string; images?: Array<{ src: string }> }> }).products ?? [];
  return <><PageIntro eyebrow="TOOLS &amp; JIGS" title="Tools chosen for the work."><p>Tools and Jigs is Robin’s separate Shopify shop. Products, prices, stock, checkout and customer accounts all remain there — this site is a clean introduction, not a duplicate catalogue.</p></PageIntro><section className="page-frame tool-layout"><div className="tool-image"><Image src="/source/2014/07/New-steelwork-and-roof-construction-1024x768.jpg" alt="Steelwork and roof construction in progress"/></div><div><p className="eyebrow">THE OFFICIAL SHOP</p><h2>Browse direct from the source.</h2><p>{products.length ? 'This page reads the reviewed product cache. Buying and authoritative product details remain on the official store.' : 'The cached public product feed is currently empty after Shopify rate-limited its first polite request. No names, prices or stock are guessed: the official store remains authoritative.'}</p><a className="button" href={shopUrl('/shop/')}>Open Tools and Jigs <Arrow /></a></div></section>{products.length > 0 && <section className="page-frame product-grid">{products.map((product) => <article key={product.id}>{product.images?.[0] && <img src={product.images[0].src} alt="" loading="lazy" />}<h2>{product.title}</h2><a className="text-link" href={shopUrl('/shop/product/', `https://toolsandjigs.com/products/${product.handle}`)}>View on Tools &amp; Jigs <Arrow /></a></article>)}</section>}<section className="page-frame steps">{toolSteps.map(([number, title, copy]) => <div key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></div>)}</section></>;
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
  if (state === 'sent') return <section className="form-receipt" role="status"><p className="eyebrow">MESSAGE RECEIVED</p><h2>Thank you.</h2><p>Your reference is <code>{reference}</code>. The message is now in Robin’s website inbox for review.</p></section>;
  return <form className="public-form" onSubmit={submit} noValidate><div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength={120} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label></div><div className="form-row"><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>Subject <span>(optional)</span><input name="subject" maxLength={160} /></label></div><label>Message<textarea name="message" rows={7} maxLength={4000} required /></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="check-field"><input name="consent" type="checkbox" required /><span>I understand this message will be stored so the enquiry can be handled. See the <a href="/legal/privacy/">privacy notice</a>.</span></label>{state === 'error' && <p className="form-error" role="alert">That did not send. Your message is still here—try again.</p>}<button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : type === 'interest' ? 'Register interest' : 'Send enquiry'}</button></form>;
}

function Contact() {
  return <><PageIntro eyebrow="CONTACT" title="Let’s start with the right information."><p>Choose the enquiry route and share only what is needed. Messages are rate-limited, protected by a honeypot and kept in the project’s own admin inbox.</p></PageIntro><section className="page-frame contact-form-layout"><aside><p className="eyebrow">BEFORE YOU SEND</p><h2>Keep it useful.</h2><p>Describe the project, question or collaboration clearly. Do not include passwords, payment details or sensitive documents.</p><a className="text-link" href="/register-interest/">Register interest instead <Arrow /></a></aside><PublicForm type="contact" /></section></>;
}

function RegisterInterest() {
  return <><PageIntro eyebrow="REGISTER YOUR INTEREST" title="Tell Robin what you want to hear about."><p>This route is for genuine interest in future work, updates or collaboration. It does not silently add you to a third-party mailing list.</p></PageIntro><section className="page-frame contact-form-layout"><aside><p className="eyebrow">PURPOSE FIRST</p><h2>A short note is enough.</h2><p>Say what interests you and how you would like the team to respond. The default retention period is 90 days and can be changed by an owner.</p></aside><PublicForm type="interest" /></section></>;
}

function RobinRecommends() {
  return <><PageIntro eyebrow="ROBIN RECOMMENDS" title="Useful resources, clearly labelled."><p>Recommendations will be grouped by tools, reading, channels and methods. Each item needs Robin’s current approval and any affiliate relationship must be disclosed beside its link.</p></PageIntro><section className="page-frame card-grid"><article className="info-card"><span>01</span><h2>Tools</h2><p>For Robin’s own current range, use the official Tools and Jigs store. No third-party product is carried over without review.</p><a className="text-link" href={shopUrl('/robin-recommends/')}>Open Tools &amp; Jigs <Arrow /></a></article><article className="info-card"><span>02</span><h2>Videos</h2><p>Robin’s public videos remain the verified source for practical walkthroughs and current methods.</p><a className="text-link" href="/videos/">Browse videos <Arrow /></a></article><article className="info-card"><span>03</span><h2>Disclosure</h2><p>Commercial or affiliate relationships will be stated next to the relevant recommendation, never hidden in a general footer.</p></article></section></>;
}

function Legal({ path }: { path: string }) {
  const pages: Record<string, [string, string, string[]]> = {
    '/legal/privacy/': ['PRIVACY', 'Privacy notice', ['Contact and interest forms store the fields you submit in Robweb’s own database so authorised owner/editor users can respond.', 'The default form-retention setting is 90 days. Final legal identity, contact and processor wording requires Ian/Paul review before go-live.', 'Site analytics remain off until you accept. First-party counters store day, path, referrer host and device class only; they do not store an IP address. Whether those counters may run without consent remains to be confirmed with Ian/Paul under Irish ePrivacy.']],
    '/legal/terms/': ['TERMS', 'Website terms', ['This website shares Robin Clevett’s work, videos, app information and routes to the separate Tools and Jigs store.', 'Final legal terms require owner review before go-live. Nothing on this site changes the official store’s checkout terms.']],
    '/legal/disclaimer/': ['DISCLAIMER', 'Information, not site-specific advice', ['Construction content is general information and personal experience. It is not a substitute for site-specific professional advice, design, regulation checks or manufacturer instructions.', 'No safety, compliance or performance claim should be inferred from decorative measurements, project imagery or calculator descriptions.']],
    '/legal/cookies/': ['COOKIES & ANALYTICS', 'Your analytics choice', ['Essential site code and the privacy preference work without GA4. Google Analytics is not requested until you actively accept analytics.', 'If accepted, the configured GA4 property and privacy-limited first-party counters receive page-level usage information without form fields, names, email addresses or message text.', 'Use the Privacy preferences button at the bottom of any page to change the choice.']],
  };
  const [eyebrow, title, paragraphs] = pages[path] ?? pages['/legal/privacy/'];
  return <><PageIntro eyebrow={eyebrow} title={title}>{paragraphs.map((copy) => <p key={copy}>{copy}</p>)}</PageIntro><section className="page-frame legal-card"><h2>Review status</h2><p>This foundation copy is deliberately narrow and remains noindex. The final legal identity, contact details, processors and approved retention wording must be reviewed before go-live.</p></section></>;
}

function CalculatorApp({ path }: { path: string }) {
  if (path === '/calculator-app/privacy/') return <><PageIntro eyebrow="RC CALCULATORS" title="Privacy information"><p>The published calculator-app privacy URL is preserved exactly. The legacy text is held in the source inventory for review; a final app privacy notice needs a confirmed app destination and reviewed policy text.</p></PageIntro><section className="page-frame legal-card"><h2>Privacy review pending</h2><p>No app-store, web-app or tracking destination has been assumed. This page exists so the published URL remains stable while the final policy is approved.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  if (path === '/calculator-app/terms/') return <><PageIntro eyebrow="RC CALCULATORS" title="Terms of use"><p>The published calculator-app terms URL is preserved exactly. The legacy source is retained for review; this preview does not infer new terms or safety claims.</p></PageIntro><section className="page-frame legal-card"><h2>Terms review pending</h2><p>A confirmed calculator destination and reviewed terms are required before the final public legal copy is published.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  const destinations = [import.meta.env?.VITE_WEB_APP_URL, import.meta.env?.VITE_APP_STORE_URL, import.meta.env?.VITE_PLAY_STORE_URL].filter(Boolean);
  return <><PageIntro eyebrow="RC CALCULATORS" title="A metric-first calculator app, kept simple."><p>The calculator app’s published landing, privacy and terms paths are kept intact. Measurements are metric first; approved web and store destinations appear only when configured.</p></PageIntro><section className="page-frame calculator-grid"><div><p className="eyebrow">CHOOSE · ENTER · REVIEW</p><h2>Calculations should support the job, not interrupt it.</h2><p>Choose the relevant calculator, enter the known measurements in millimetres or metres, then review the result in the context of the job and applicable guidance.</p>{destinations.length ? destinations.map((url) => <a className="button" href={url} key={url}>Open RC Calculators <Arrow /></a>) : <p className="configuration-note">Download destinations are awaiting owner-approved URLs.</p>}</div><nav aria-label="RC Calculator legal links"><a href="/calculator-app/privacy/">Privacy information <Arrow /></a><a href="/calculator-app/terms/">Terms of use <Arrow /></a></nav></section></>;
}

function NotFound() {
  return <><PageIntro eyebrow="404 · OFF THE LINE" title="That page doesn’t fit here."><p>The address may have moved or been mistyped.</p><p><a className="button" href="/">Back to home <Arrow /></a></p></PageIntro><nav className="page-frame not-found-links"><a href="/shop/">Shop</a><a href="/app/">App</a><a href="/videos/">Videos</a><a href="/contact/">Contact</a></nav></>;
}

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />;
  if (path === '/about/') return <About />;
  if (path === '/services/') return <Services />;
  if (path === '/projects/') return <Projects />;
  if (path === '/videos/') return <Videos />;
  if (path === '/tools-and-jigs/' || path === '/shop/') return <ToolsAndJigs />;
  if (path === '/contact/') return <Contact />;
  if (path === '/register-interest/') return <RegisterInterest />;
  if (path === '/robin-recommends/') return <RobinRecommends />;
  if (path.startsWith('/legal/')) return <Legal path={path} />;
  if (path === '/app/' || path.startsWith('/calculator-app/')) return <CalculatorApp path={path === '/app/' ? '/calculator-app/' : path} />;
  return <NotFound />;
}

export function Site({ path }: SiteProps) {
  if (path.startsWith('/admin')) return <AdminApp path={path} />;
  const [theme, setTheme] = useState<Theme>('system');
  const page = routeFor(path);
  const activePath = normalisePath(path);
  return <div className={`site theme-${theme}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <Header theme={theme} setTheme={setTheme} />
    <main id="content" tabIndex={-1}><MotionPage path={activePath}><Page path={activePath} /></MotionPage></main>
    <Footer />
    <ConsentBanner />
    {!page && <span className="sr-only">Page not found</span>}
  </div>;
}
