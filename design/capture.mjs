import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const designDir = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(designDir, 'spikes', 'screenshots');
const base = `http://127.0.0.1:${process.env.ROBWEB_DESIGN_PORT || 4179}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-webgl']
});

const routes = [
  ['blueprint-truss', '/design/spikes/blueprint-truss/'],
  ['timber-shavings', '/design/spikes/timber-shavings/'],
  ['exploded-joint', '/design/spikes/exploded-joint/'],
  ['prototype', '/design/prototype/']
];
const viewports = [
  ['mobile', { width: 390, height: 844, deviceScaleFactor: 1 }],
  ['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }]
];
const results = [];
let failed = false;

for (const [viewportName, viewport] of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  for (const [name, route] of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    const externalRequests = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== base) externalRequests.push(request.url());
    });
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    await page.mouse.move(Math.floor(viewport.width * .72), Math.floor(viewport.height * .4));
    try {
      await page.waitForFunction(() => document.documentElement.dataset.webglState !== 'loading', null, { timeout: 6000 });
      await page.waitForFunction(() => window.__ROBWEB_PERF__?.mode !== 'webgl' || window.__ROBWEB_PERF__?.samples >= 90, null, { timeout: 7000 });
    } catch {
      pageErrors.push('WebGL state/performance sample timed out');
    }
    await page.waitForTimeout(250);

    if (name === 'prototype' && viewportName === 'mobile') {
      const toggle = page.locator('.menu-toggle');
      await toggle.click();
      await page.waitForTimeout(300);
      const expanded = await toggle.getAttribute('aria-expanded');
      if (expanded !== 'true') pageErrors.push('mobile menu did not open');
      await page.keyboard.press('Escape');
      const sizes = await page.locator('.thumb-nav a').evaluateAll((links) => links.map((link) => {
        const box = link.getBoundingClientRect();
        return { label: link.textContent.trim(), width: box.width, height: box.height };
      }));
      if (sizes.some(({ height }) => height < 44)) pageErrors.push('thumb navigation target below 44px');
    }

    const screenshot = join(screenshotDir, `${name}-${viewportName}.png`);
    await page.screenshot({ path: screenshot, fullPage: name === 'prototype' });
    const data = await page.evaluate(() => ({
      title: document.title,
      webglState: document.documentElement.dataset.webglState,
      webglReason: document.documentElement.dataset.webglReason || null,
      performance: window.__ROBWEB_PERF__ || null,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      h1Count: document.querySelectorAll('h1').length,
      noindex: document.querySelector('meta[name="robots"]')?.content || null
    }));
    const record = { name, viewport: viewportName, status: response?.status(), screenshot: screenshot.replace(`${designDir}/`, 'design/'), pageErrors, externalRequests, ...data };
    if (record.status !== 200 || pageErrors.length || externalRequests.length || data.horizontalOverflow || data.h1Count !== 1 || data.webglState !== 'ready') failed = true;
    results.push(record);
    await page.close();
  }
  await context.close();
}

const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
for (const [name, route] of routes) {
  const page = await reducedContext.newPage();
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.webglState !== 'loading');
  const state = await page.evaluate(() => ({ state: document.documentElement.dataset.webglState, reason: document.documentElement.dataset.webglReason }));
  results.push({ name, viewport: 'mobile-reduced-motion', webglState: state.state, webglReason: state.reason });
  if (state.state !== 'fallback' || state.reason !== 'reduced-motion') failed = true;
  await page.close();
}
await reducedContext.close();
await browser.close();

const evidence = {
  generatedAt: new Date().toISOString(),
  chrome: '/usr/bin/google-chrome (isolated Playwright-launched headless profile)',
  note: 'Headless SwiftShader frame intervals are regression evidence, not a physical mid-phone GPU benchmark.',
  results
};
await writeFile(join(screenshotDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (failed) process.exit(1);
