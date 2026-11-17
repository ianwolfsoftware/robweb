import { useState } from 'react';
import videosSource from '../content/videos.json';
import { navRoutes, normalisePath, projectImages, routeFor, shopUrl } from './content';

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
          <a className="button button-small header-shop" href="/tools-and-jigs/">Shop <Arrow /></a>
          <details className="mobile-nav">
            <summary aria-label="Open site navigation"><span /><span /><span /></summary>
            <nav aria-label="Mobile navigation">
              {navRoutes.map((route) => <a key={route.path} href={route.path}>{route.navLabel}</a>)}
              <a href="/calculator-app/">RC Calculators</a>
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
          <a href="/about/">About</a><a href="/projects/">Projects</a><a href="/videos/">Videos</a><a href="/tools-and-jigs/">Tools &amp; Jigs</a><a href="/contact/">Contact</a><a href="/calculator-app/">RC Calculators</a>
        </nav>
        <p className="footer-note">Preview shell — search indexing and analytics remain off until approved.</p>
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
    </section>
    <section className="band"><div className="page-frame quick-grid">
      <a href="/calculator-app/"><b>RC Calculators</b><span>Metric-first tools for the job <Arrow /></span></a>
      <a href="/tools-and-jigs/"><b>Tools &amp; Jigs</b><span>Visit the official shop <Arrow /></span></a>
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
  return <><PageIntro eyebrow="TOOLS &amp; JIGS" title="Tools chosen for the work."><p>Tools and Jigs is Robin’s separate Shopify shop. Products, prices, stock, checkout and customer accounts all remain there — this site is a clean introduction, not a duplicate catalogue.</p></PageIntro><section className="page-frame tool-layout"><div className="tool-image"><Image src="/source/2014/07/New-steelwork-and-roof-construction-1024x768.jpg" alt="Steelwork and roof construction in progress"/></div><div><p className="eyebrow">THE OFFICIAL SHOP</p><h2>Browse direct from the source.</h2><p>The current public shop inventory was rate-limited during collection, so no product details are guessed here. The shop is the authoritative place to browse and buy.</p><a className="button" href={shopUrl}>Open Tools and Jigs <Arrow /></a></div></section><section className="page-frame steps">{toolSteps.map(([number, title, copy]) => <div key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></div>)}</section></>;
}

function Contact() {
  return <><PageIntro eyebrow="CONTACT" title="Let’s start with the right information."><p>The old contact form invited general enquiries, comments and support questions. A form is intentionally not live in this preview: its recipient, retention and consent wording still need approval before visitor data is collected.</p></PageIntro><section className="page-frame contact-grid"><div className="contact-panel"><p className="eyebrow">WHAT’S AVAILABLE NOW</p><h2>Explore the work first.</h2><p>Use the project and video pages to see the sort of work and practical guidance Robin shares. The contact route will be enabled with a reviewed privacy notice and clear handling information.</p><a className="button" href="/projects/">View projects <Arrow /></a></div><div className="contact-panel quiet"><p className="eyebrow">REGISTER INTEREST</p><h2>Updates, without a vague promise.</h2><p>Registration stays switched off until the purpose, recipient and retention period are approved. There is no hidden mailing-list form or third-party capture in this shell.</p></div></section></>;
}

function CalculatorApp({ path }: { path: string }) {
  if (path === '/calculator-app/privacy/') return <><PageIntro eyebrow="RC CALCULATORS" title="Privacy information"><p>The published calculator-app privacy URL is preserved exactly. The legacy text is held in the source inventory for review; a final app privacy notice needs a confirmed app destination and reviewed policy text.</p></PageIntro><section className="page-frame legal-card"><h2>Privacy review pending</h2><p>No app-store, web-app or tracking destination has been assumed. This page exists so the published URL remains stable while the final policy is approved.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  if (path === '/calculator-app/terms/') return <><PageIntro eyebrow="RC CALCULATORS" title="Terms of use"><p>The published calculator-app terms URL is preserved exactly. The legacy source is retained for review; this preview does not infer new terms or safety claims.</p></PageIntro><section className="page-frame legal-card"><h2>Terms review pending</h2><p>A confirmed calculator destination and reviewed terms are required before the final public legal copy is published.</p><a className="text-link" href="/calculator-app/">Back to RC Calculators <Arrow /></a></section></>;
  return <><PageIntro eyebrow="RC CALCULATORS" title="A metric-first calculator app, kept simple."><p>The calculator app’s published landing, privacy and terms paths are kept intact. Store and web destinations are not yet approved, so this shell avoids a broken or invented download button.</p></PageIntro><section className="page-frame calculator-grid"><div><p className="eyebrow">COMING INTO FOCUS</p><h2>Calculations should support the job, not interrupt it.</h2><p>Once the app’s approved web, App Store or Play Store link is confirmed, it can be added here without changing these three stable paths.</p></div><nav aria-label="RC Calculator legal links"><a href="/calculator-app/privacy/">Privacy information <Arrow /></a><a href="/calculator-app/terms/">Terms of use <Arrow /></a></nav></section></>;
}

function NotFound() {
  return <PageIntro eyebrow="NOT FOUND" title="That page isn’t in this preview."><p>Try one of the clear routes below instead.</p><p><a className="button" href="/">Back to home <Arrow /></a></p></PageIntro>;
}

function Page({ path }: { path: string }) {
  if (path === '/') return <Home />;
  if (path === '/about/') return <About />;
  if (path === '/services/') return <Services />;
  if (path === '/projects/') return <Projects />;
  if (path === '/videos/') return <Videos />;
  if (path === '/tools-and-jigs/') return <ToolsAndJigs />;
  if (path === '/contact/') return <Contact />;
  if (path.startsWith('/calculator-app/')) return <CalculatorApp path={path} />;
  return <NotFound />;
}

export function Site({ path }: SiteProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const page = routeFor(path);
  const activePath = normalisePath(path);
  return <div className={`site theme-${theme}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <Header theme={theme} setTheme={setTheme} />
    <main id="content" tabIndex={-1}><Page path={activePath} /></main>
    <Footer />
    {!page && <span className="sr-only">Page not found</span>}
  </div>;
}
