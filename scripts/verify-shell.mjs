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
  ['mobile', { width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 }],
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
          heroImage: (() => { const image = document.querySelector('.hero-photo img'); return image ? { currentSrc: image.currentSrc, naturalWidth: image.naturalWidth, fetchPriority: image.fetchPriority } : null; })(),
          heroPreloads: document.querySelectorAll('link[rel="preload"][as="image"][href*="/hero-robin/"]').length,
          heroParagraphs: document.querySelectorAll('.home-hero p').length,
          heroLinks: [...document.querySelectorAll('.home-hero nav a')].map((link) => link.getAttribute('href')),
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
          assert.equal(summary.heroPreloads, 2, 'home preloads the viewport-appropriate AVIF hero source');
          assert.ok(summary.heroImage?.naturalWidth > 0, 'home hero image is decoded');
          assert.equal(summary.heroImage?.fetchPriority, 'high', 'home hero image has high fetch priority');
          assert.match(summary.heroImage?.currentSrc || '', /hero-robin-(640|960|1440|2560)\.avif$/, 'home selects a responsive AVIF hero source');
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
        const box = await page.$eval('.menu-toggle', (element) => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height }; });
        assert.ok(box.width >= 44 && box.height >= 44, 'phone menu trigger is at least 44px');
        await page.click('.menu-toggle');
        await page.waitForSelector('.mobile-menu-panel');
        const links = await page.$$eval('.mobile-menu-panel nav a', (elements) => elements.map((element) => { const rect = element.getBoundingClientRect(); return { height: rect.height, text: element.textContent?.trim() }; }));
        assert.equal(links.length, 4, 'phone menu exposes only Home, Shop, App and Contact');
        assert.ok(links.every((link) => link.height >= 44), 'all phone menu routes have large tap targets');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('.mobile-menu-panel'));
      } else {
        assert.equal(await page.$eval('.desktop-nav', (element) => getComputedStyle(element).display), 'flex', 'desktop navigation is visible');
      }
      const beforeTheme = await page.$eval('.site', (element) => element.className);
      await page.click('.theme-toggle');
      const afterTheme = await page.$eval('.site', (element) => element.className);
      assert.notEqual(beforeTheme, afterTheme, 'theme control changes appearance');
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
  const reducedState = await reduced.$eval('.home-hero', (element) => ({ hero: element.querySelector('img')?.complete ? 'static-photo' : 'missing', webgl: Boolean(element.querySelector('canvas, .webgl-slot')) }));
  assert.deepEqual(reducedState, { hero: 'static-photo', webgl: false }, 'reduced motion keeps the static photo hero without a canvas layer');
  await reduced.close();

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
  const evidence = { ok: true, generatedAt: new Date().toISOString(), screenshotCount: results.length, routes: routes.length, combinations: 4, permanentRedirects: redirects.length, results, reducedMotion: reducedState, performance, externalRequests: [] };
  if (evidenceDir) await writeFile(`${evidenceDir}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, screenshots: results.length, routes: routes.length, reducedMotion: reducedState, performance, externalRequests: [] }));
} finally {
  server.kill('SIGTERM');
}
