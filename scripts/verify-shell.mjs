import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const port = Number(process.env.ROBWEB_SHELL_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const evidenceDir = process.env.ROBWEB_EVIDENCE_DIR;
const routes = [
  ['home', '/'], ['shop', '/shop/'], ['app', '/app/'], ['contact', '/contact/'], ['privacy', '/legal/privacy/'],
  ['terms', '/legal/terms/'], ['disclaimer', '/legal/disclaimer/'], ['cookies', '/legal/cookies/'],
  ['calculator-app', '/calculator-app/'], ['calculator-privacy', '/calculator-app/privacy/'],
  ['calculator-terms', '/calculator-app/terms/'], ['404', '/404/'],
];
const redirectMap = JSON.parse(await readFile(new URL('../content/redirects.json', import.meta.url), 'utf8'));
const redirects = Object.keys(redirectMap);
const viewports = [
  ['mobile', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
  ['desktop', { width: 1440, height: 900, isMobile: false, deviceScaleFactor: 1 }],
];
const themes = ['dark', 'light'];
const server = spawn(process.execPath, ['serve.mjs'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port), ROBWEB_SITE_ROOT: 'dist' },
});

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Preview server did not start: ${lastError ?? 'unknown error'}`);
}

try {
  await waitForServer();
  if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-angle=swiftshader'],
  });
  const errors = [];
  const externalRequests = new Set();
  const results = [];

  for (const [viewportName, viewport] of viewports) {
    for (const theme of themes) {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await page.setCacheEnabled(false);
      await page.evaluateOnNewDocument((selectedTheme) => {
        localStorage.setItem('robweb-theme', selectedTheme);
        localStorage.setItem('robweb-analytics-consent-v1', 'rejected');
      }, theme);
      let currentRoute = 'before navigation';
      page.on('pageerror', (error) => errors.push(`${viewportName}/${theme}/${currentRoute}: ${error.message}`));
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.origin !== baseUrl && url.protocol !== 'data:' && url.origin !== 'https://cdn.shopify.com') externalRequests.add(url.origin);
      });

      for (const [slug, route] of routes) {
        currentRoute = route;
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
        assert.equal(response?.status(), 200, `${route} should return 200`);
        assert.match(await response.text(), /<h1[ >]/, `${route} view-source contains rendered heading HTML`);
        await page.waitForSelector(`.site.theme-${theme}`);
        await new Promise((resolve) => setTimeout(resolve, 120));
        if (route === '/') {
          await page.waitForFunction(() => document.querySelector('[data-motion-loader]')?.getAttribute('data-motion-loader') === 'done', { timeout: 4000 });
          await page.waitForFunction(() => (innerWidth < 672 ? ['.hero-stage', '.mobile-hero-statement', '.hero-title'] : ['.hero-logo', '.hero-title', '.home-hero .button-row']).every((selector) => {
            const element = document.querySelector(selector);
            if (!element) return false;
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return Number(style.opacity) >= .99 && style.visibility === 'visible' && box.width > 0 && box.height > 0;
          }), { timeout: 4000 });
          await page.waitForFunction(() => ['ready', 'fallback'].includes(document.querySelector('.webgl-slot')?.getAttribute('data-state')), { timeout: 6000 });
        }
        const summary = await page.evaluate(() => ({
          noindex: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
          h1Count: document.querySelectorAll('h1').length,
          h1: document.querySelector('h1')?.textContent?.trim(),
          main: document.querySelector('main')?.id,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          headerLogo: !!document.querySelector('.site-header .brand-logo-dark'),
          footerLogo: !!document.querySelector('.site-footer .brand-logo-dark'),
          favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
          touchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
          socialImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
          heroImage: (() => { const image = document.querySelector('.hero-portrait img'); return image ? { currentSrc: image.currentSrc, naturalWidth: image.naturalWidth, fetchPriority: image.fetchPriority } : null; })(),
          heroPreloads: document.querySelectorAll('link[rel="preload"][as="image"][href*="/portrait-robin/"]').length,
          portraitSources: document.querySelectorAll('.hero-portrait source').length,
          lightSweep: Boolean(document.querySelector('[data-hero-light]')),
          logoScene: (() => { const scene = document.querySelector('.webgl-slot'); return scene ? { state: scene.getAttribute('data-state'), dpr: Number(scene.getAttribute('data-dpr')), canvas: Boolean(scene.querySelector('[data-rc-logo-canvas]')), paused: scene.getAttribute('data-paused') } : null; })(),
          heroParagraphs: document.querySelectorAll('.hero-copy p').length,
          heroLinks: [...document.querySelectorAll('.home-hero nav a')].map((link) => link.getAttribute('href')),
          motionLoader: document.querySelector('[data-motion-loader]')?.getAttribute('data-motion-loader'),
          lenisActive: document.documentElement.classList.contains('lenis-active'),
          splitCharacters: document.querySelectorAll('.hero-title .split-char').length,
          marqueeGroups: document.querySelectorAll('.name-marquee-group').length,
          heroControlsVisible: (innerWidth < 672 ? ['.hero-stage', '.mobile-hero-statement', '.hero-title'] : ['.hero-logo', '.hero-title', '.home-hero .button-row']).every((selector) => {
            const element = document.querySelector(selector);
            if (!element) return false;
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return Number(style.opacity) >= .99 && style.visibility === 'visible' && box.width > 0 && box.height > 0;
          }),
          mobileTopLine: innerWidth >= 672 || ['.mobile-header-name', '.mobile-header-label'].every((selector) => {
            const element = document.querySelector(selector);
            return element && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().height > 0;
          }),
          mobilePortraitCard: innerWidth >= 672 || (() => {
            const stage = document.querySelector('.hero-stage');
            if (!stage) return false;
            const box = stage.getBoundingClientRect();
            return box.height > box.width * 1.5 && parseFloat(getComputedStyle(stage).borderRadius) > 0;
          })(),
          mobileDock: innerWidth >= 672 || (() => {
            const dock = document.querySelector('.mobile-dock');
            return Boolean(dock && getComputedStyle(dock).position === 'fixed' && dock.querySelector('.mobile-dock-mark') && dock.querySelector('.mobile-dock-menu'));
          })(),
          emptyBands: [...document.querySelectorAll('main section')].filter((section) => {
            const box = section.getBoundingClientRect();
            const meaningful = section.textContent?.trim() || section.querySelector('img, canvas, form');
            return box.height > 120 && !meaningful;
          }).length,
        }));
        assert.equal(summary.noindex, 'noindex, nofollow, noarchive', `${route} has noindex metadata`);
        assert.equal(summary.h1Count, 1, `${route} has exactly one h1`);
        assert.ok(summary.h1, `${route} has a visible heading`);
        assert.equal(summary.main, 'content', `${route} exposes the main landmark`);
        assert.equal(summary.overflow, false, `${route} has no horizontal overflow at ${viewportName}`);
        assert.equal(summary.headerLogo, true, `${route} includes the real header logo`);
        assert.equal(summary.footerLogo, true, `${route} includes the real footer logo`);
        assert.ok(summary.favicon, `${route} exposes a favicon`);
        assert.equal(summary.touchIcon, '/brand/apple-touch-icon.png', `${route} exposes the touch icon`);
        assert.match(summary.socialImage || '', /social-card\.png$/, `${route} exposes the logo social image`);
        assert.equal(summary.emptyBands, 0, `${route} has no empty visual bands`);
        if (route === '/') {
          assert.match(summary.h1, /^RobinClevett$/, 'home hero names Robin without a tagline');
          assert.equal(summary.heroParagraphs, 0, 'home hero contains no tagline or marketing copy');
          assert.deepEqual(summary.heroLinks, ['/shop/', '/app/'], 'home hero exposes only Products and App entry points');
          assert.equal(summary.heroControlsVisible, true, 'home hero logo, name and actions are visibly settled');
          assert.equal(summary.mobileTopLine, true, 'phone home uses the minimal Robin/name top line');
          assert.equal(summary.mobilePortraitCard, true, 'phone home uses a tall rounded portrait card');
          assert.equal(summary.mobileDock, true, 'phone home provides fixed logo and Menu controls in the thumb zone');
          assert.equal(summary.motionLoader, 'done', 'home branded loader completes before acceptance');
          assert.equal(summary.lenisActive, viewportName === 'desktop', viewportName === 'mobile' ? 'compact home avoids the desktop smooth-scroll runtime' : 'desktop home initialises the shared Lenis motion runtime');
          assert.equal(summary.splitCharacters, viewportName === 'desktop' ? 12 : 0, viewportName === 'mobile' ? 'compact home keeps the wordmark immediately visible without JS splitting' : 'desktop wordmark is prepared for GSAP character staggers');
          assert.equal(summary.marqueeGroups, 2, 'home provides two seamless direction-aware marquee groups');
          assert.equal(summary.heroPreloads, 2, 'home preloads the viewport-appropriate AVIF hero source');
          assert.equal(summary.portraitSources, 4, 'home supplies compact and desktop AVIF/WebP portrait sources');
          assert.equal(summary.lightSweep, true, 'home provides the scroll-scrubbed portrait light layer');
          assert.ok(summary.heroImage?.naturalWidth > 0, 'home hero image is decoded');
          assert.equal(summary.heroImage?.fetchPriority, 'high', 'home hero image has high fetch priority');
          assert.match(summary.heroImage?.currentSrc || '', /robin-portrait-(480-static|800|1200)\.webp$/, 'home selects a responsive portrait WebP source');
          const expectedLogoScene = viewportName === 'mobile'
            ? { state: 'fallback', dpr: 0, canvas: false, paused: null }
            : { state: 'ready', dpr: Math.min(viewport.deviceScaleFactor, 2), canvas: true, paused: 'false' };
          assert.deepEqual(summary.logoScene, expectedLogoScene, viewportName === 'mobile' ? 'compact screens keep the designed static RC fallback' : 'capable desktops render the real RC SVG through the capped Three.js scene');
        }
        if (route === '/shop/') {
          assert.equal(await page.$$eval('.product-card', (cards) => cards.length), 11, 'shop renders all 11 committed Shopify products');
          assert.equal(await page.$$eval('.product-card a[href^="/go/shop?product="]', (links) => links.length >= 11), true, 'every shop product buys through the click tracker');
          assert.equal(await page.$$eval('.product-card img', (images) => images.every((image) => image.getAttribute('loading') === 'lazy')), true, 'Shopify catalogue images are lazy-loaded in the shipped UI');
        }
        if (route === '/app/') {
          const appCopy = await page.$eval('main', (element) => element.textContent || '');
          assert.match(appCopy, /£24\.99/, 'app shows the approved monthly price');
          assert.match(appCopy, /£254\.99/, 'app shows the approved yearly price');
          assert.equal(await page.$$eval('.app-screens img', (images) => images.length), 2, 'app shows light and dark V3 design screens');
        }
        await page.evaluate(async () => {
          document.querySelectorAll('img[loading="lazy"]').forEach((image) => { image.loading = 'eager'; });
          const pause = () => new Promise((resolve) => setTimeout(resolve, 120));
          const step = Math.max(420, Math.floor(innerHeight * .7));
          for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
            scrollTo(0, top);
            await pause();
          }
          scrollTo(0, 0);
          await pause();
        });
        await page.waitForFunction(() => [...document.querySelectorAll('.product-card img, .app-screens img')].every((image) => image.complete && image.naturalWidth > 0), { timeout: 15000 });
        await new Promise((resolve) => setTimeout(resolve, 350));
        const screenshot = evidenceDir ? `${evidenceDir}/${theme}-${viewportName}-${slug}.png` : null;
        if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
        results.push({ route, slug, viewport: viewportName, theme, status: response?.status(), screenshot, ...summary });
      }

      await page.goto(baseUrl, { waitUntil: 'networkidle0' });
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.className), 'skip-link', 'first keyboard target is skip link');
      assert.equal(await page.$eval('.skip-link', (element) => getComputedStyle(element).opacity), '1', 'focused skip link becomes visible');
      if (viewportName === 'mobile') {
        const box = await page.$eval('.mobile-dock-menu', (element) => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height }; });
        assert.ok(box.width >= 44 && box.height >= 44, 'phone menu trigger is at least 44px');
        const scrollPositions = [0, 560, 1200];
        for (const [index, scrollPosition] of scrollPositions.entries()) {
          await page.evaluate((top) => {
            document.documentElement.style.scrollBehavior = 'auto';
            scrollTo(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
          }, scrollPosition);
          const expectedScroll = await page.evaluate(() => scrollY);
          await page.$eval('.mobile-dock-menu', (element) => element.click());
          await page.waitForFunction(() => {
            const panel = document.querySelector('.mobile-menu-panel');
            return panel?.open && Number(getComputedStyle(panel).opacity) > .98;
          });
          await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Close site navigation');
          const menuState = await page.$eval('.mobile-menu-panel', (element) => {
            const rect = element.getBoundingClientRect();
            const topmost = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
            return {
              rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
              position: getComputedStyle(element).position,
              zIndex: Number(getComputedStyle(element).zIndex),
              topmost: Boolean(topmost?.closest('.mobile-menu-panel')),
              scrollLock: document.documentElement.style.overflow,
              lockedScrollY: scrollY,
              dialogOpen: element.open,
              activeLabel: document.activeElement?.getAttribute('aria-label'),
            };
          });
          assert.deepEqual(menuState.rect, { top: 0, left: 0, width: 390, height: 844 }, `menu covers the viewport at scroll position ${expectedScroll}`);
          assert.equal(menuState.position, 'fixed', 'menu is fixed to the viewport');
          assert.ok(menuState.zIndex >= 1000, 'menu sits above the hero and page chrome');
          assert.equal(menuState.topmost, true, 'menu is the top painted layer over the hero');
          assert.equal(menuState.scrollLock, 'hidden', 'document scrolling is disabled while the menu is open');
          assert.equal(menuState.dialogOpen, true, 'the modal dialog makes background content inert while the menu is open');
          assert.equal(menuState.activeLabel, 'Close site navigation', 'focus moves into the menu');
          const links = await page.$$eval('.mobile-menu-panel nav a', (elements) => elements.map((element) => { const rect = element.getBoundingClientRect(); return { height: rect.height, text: element.textContent?.trim() }; }));
          assert.equal(links.length, 4, 'phone menu exposes only Home, Shop, App and Contact');
          assert.ok(links.every((link) => link.height >= 44), 'all phone menu routes have large tap targets');
          if (index === 0) await page.keyboard.press('Escape');
          else if (index === 1) await page.$eval('.mobile-menu-close', (element) => element.click());
          else await page.evaluate(() => history.back());
          await page.waitForFunction(() => !document.querySelector('.mobile-menu-panel'));
          await page.waitForFunction((top) => Math.abs(scrollY - top) <= 1, {}, expectedScroll);
          assert.ok(Math.abs(await page.evaluate(() => scrollY) - expectedScroll) <= 1, 'closing the menu restores scroll position');
        }
        await page.$eval('.mobile-dock-menu', (element) => element.click());
        await page.waitForSelector('.mobile-menu-panel');
        await page.waitForFunction(() => {
          const style = getComputedStyle(document.querySelector('.mobile-menu-panel nav a[href="/shop/"]'));
          const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
          return Number(style.opacity) === 1 && Math.abs(matrix.m42) < .01;
        });
        await page.$eval('.mobile-menu-panel nav a[href="/shop/"]', (element) => element.click());
        await page.waitForFunction(() => location.pathname === '/shop/');
        await page.waitForFunction(() => !document.querySelector('.mobile-menu-panel'));
        assert.equal(new URL(page.url()).pathname, '/shop/', 'a menu link navigates to its destination');
        assert.equal(await page.$('.mobile-menu-panel'), null, 'a menu link closes the overlay');
      } else {
        assert.equal(await page.$eval('.desktop-nav', (element) => getComputedStyle(element).display), 'flex', 'desktop navigation is visible');
      }
      const beforeTheme = await page.$eval('.site', (element) => element.className);
      if (viewportName === 'mobile') {
        await page.$eval('.mobile-dock-menu', (element) => element.click());
        await page.waitForSelector('.mobile-menu-panel');
        await page.click('.mobile-menu-actions .theme-toggle');
      } else {
        await page.click('.theme-toggle');
      }
      const afterTheme = await page.$eval('.site', (element) => element.className);
      assert.notEqual(beforeTheme, afterTheme, 'theme control changes appearance');
      if (viewportName === 'mobile') {
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.mobile-menu-panel'));
      }
      await page.close();
    }
  }

  for (const route of redirects) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
    assert.equal(response.status, 301, `${route} is a permanent redirect`);
    assert.equal(response.headers.get('location'), redirectMap[route], `${route} uses the source-controlled redirect target`);
    assert.ok(['/', '/shop/'].includes(response.headers.get('location')), `${route} redirects to Home or Shop`);
  }
  const missing = await fetch(`${baseUrl}/definitely-missing/`, { redirect: 'manual' });
  assert.equal(missing.status, 404, 'unknown paths return the real 404 status');
  const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
  assert.doesNotMatch(sitemap, /videos|projects|services|robin-recommends/, 'sitemap excludes retired routes');
  assert.match(sitemap, /<loc>https:\/\/robweb\.wolf\.uk\.com\/shop\/<\/loc>/, 'sitemap includes Shop');

  const reduced = await browser.newPage();
  await reduced.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
  await reduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await reduced.goto(baseUrl, { waitUntil: 'networkidle0' });
  await reduced.waitForFunction(() => document.querySelector('.webgl-slot')?.getAttribute('data-state') === 'fallback');
  const reducedState = await reduced.$eval('.home-hero', (element) => ({
    hero: element.querySelector('.hero-portrait img')?.complete ? 'static-portrait' : 'missing',
    webglState: element.querySelector('.webgl-slot')?.getAttribute('data-state'),
    webglReason: element.querySelector('.webgl-slot')?.getAttribute('data-webgl-reason'),
    webglCanvas: Boolean(element.querySelector('.webgl-slot canvas')),
    smoothScroll: document.documentElement.classList.contains('lenis-active'),
    splitCharacters: element.querySelectorAll('.split-char').length,
    loaderDisplay: getComputedStyle(document.querySelector('.page-loader')).display,
    lightSweepDisplay: getComputedStyle(element.querySelector('[data-hero-light]')).display,
  }));
  assert.deepEqual(reducedState, { hero: 'static-portrait', webglState: 'fallback', webglReason: 'reduced-motion', webglCanvas: false, smoothScroll: false, splitCharacters: 0, loaderDisplay: 'none', lightSweepDisplay: 'none' }, 'reduced motion keeps static portrait/logo fallbacks and skips the loader, smooth scroll, text splitting, sweep and canvas layer');
  await reduced.close();

  const lowPower = await browser.newPage();
  await lowPower.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
  await lowPower.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 1 }); });
  await lowPower.goto(baseUrl, { waitUntil: 'networkidle0' });
  await lowPower.waitForFunction(() => document.querySelector('.webgl-slot')?.getAttribute('data-state') === 'fallback');
  const lowPowerState = await lowPower.$eval('.webgl-slot', (element) => ({ state: element.getAttribute('data-state'), reason: element.getAttribute('data-webgl-reason'), canvas: Boolean(element.querySelector('canvas')), fallback: Boolean(element.querySelector('img')) }));
  assert.deepEqual(lowPowerState, { state: 'fallback', reason: 'low-memory', canvas: false, fallback: true }, 'low-memory phones keep the static RC mark and never create a Three.js canvas');
  await lowPower.close();

  const scenePage = await browser.newPage();
  await scenePage.setViewport({ width: 1440, height: 900, isMobile: false, deviceScaleFactor: 3 });
  await scenePage.goto(baseUrl, { waitUntil: 'networkidle0' });
  await scenePage.waitForFunction(() => document.querySelector('.webgl-slot')?.getAttribute('data-state') === 'ready');
  assert.equal(await scenePage.$eval('.webgl-slot', (element) => element.getAttribute('data-dpr')), '2', 'Three.js renderer caps DPR at 2');
  await scenePage.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await scenePage.waitForFunction(() => document.querySelector('.webgl-slot')?.getAttribute('data-paused') === 'true');
  const logoScene = await scenePage.$eval('.webgl-slot', (element) => ({ state: element.getAttribute('data-state'), dpr: element.getAttribute('data-dpr'), pausedOffscreen: element.getAttribute('data-paused') }));
  assert.deepEqual(logoScene, { state: 'ready', dpr: '2', pausedOffscreen: 'true' }, 'Three.js RC scene pauses while the hero is off-screen');
  await scenePage.close();

  const performancePage = await browser.newPage();
  await performancePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
  await performancePage.setCacheEnabled(false);
  await performancePage.evaluateOnNewDocument(() => {
    localStorage.setItem('robweb-theme', 'dark');
    localStorage.setItem('robweb-analytics-consent-v1', 'rejected');
    window.__ROBWEB_METRICS__ = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => { const entries = list.getEntries(); window.__ROBWEB_METRICS__.lcp = entries.at(-1)?.startTime || 0; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__ROBWEB_METRICS__.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await performancePage.goto(baseUrl, { waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const performance = await performancePage.evaluate(() => window.__ROBWEB_METRICS__);
  assert.ok(performance.lcp > 0 && performance.lcp < 2500, `mobile local LCP ${performance.lcp}ms should be under 2.5s`);
  assert.ok(performance.cls < .03, `mobile local CLS ${performance.cls} should be approximately zero`);
  await performancePage.close();

  const admin = await browser.newPage();
  await admin.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
  await admin.goto(`${baseUrl}/admin/`, { waitUntil: 'networkidle0' });
  await admin.waitForSelector('.admin-login-card form');
  assert.match(await admin.$eval('h1', (element) => element.textContent ?? ''), /Sign in securely/, 'admin defaults to secure sign in');
  assert.equal(await admin.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'phone admin has no horizontal overflow');
  await admin.close();

  await browser.close();
  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
  assert.deepEqual([...externalRequests], [], `unexpected external requests: ${[...externalRequests].join(', ')}`);
  const evidence = { ok: true, generatedAt: new Date().toISOString(), screenshotCount: results.length, routes: routes.length, combinations: 4, permanentRedirects: redirects.length, results, reducedMotion: reducedState, lowPower: lowPowerState, logoScene, performance, externalRequests: [] };
  if (evidenceDir) await writeFile(`${evidenceDir}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, screenshots: results.length, routes: routes.length, reducedMotion: reducedState, performance, externalRequests: [] }));
} finally {
  server.kill('SIGTERM');
}
