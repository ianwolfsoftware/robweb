import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const evidenceDir = process.env.ROBWEB_EVIDENCE_DIR;
const routes = ['/', '/about/', '/services/', '/projects/', '/videos/', '/tools-and-jigs/', '/contact/', '/calculator-app/', '/calculator-app/privacy/', '/calculator-app/terms/'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const errors = [];
  let currentRoute = 'before navigation';
  const externalRequests = new Set();
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  desktop.on('pageerror', (error) => errors.push(`${currentRoute}: pageerror: ${error.message}`));
  desktop.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== baseUrl && url.protocol !== 'data:') externalRequests.add(url.origin);
  });

  for (const route of routes) {
    currentRoute = route;
    const response = await desktop.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
    assert.equal(response?.status(), 200, `${route} should return 200`);
    const summary = await desktop.evaluate(() => ({
      noindex: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
      h1: document.querySelector('h1')?.textContent?.trim(),
      main: document.querySelector('main')?.id,
    }));
    assert.equal(summary.noindex, 'noindex, nofollow, noarchive', `${route} has noindex metadata`);
    assert.ok(summary.h1, `${route} has a rendered h1`);
    assert.equal(summary.main, 'content', `${route} exposes the main landmark`);
  }

  await desktop.goto(baseUrl, { waitUntil: 'networkidle0' });
  await desktop.keyboard.press('Tab');
  assert.equal(await desktop.evaluate(() => document.activeElement?.className), 'skip-link', 'first keyboard target is skip link');
  await desktop.click('.theme-toggle');
  assert.ok(await desktop.evaluate(() => document.querySelector('.site')?.classList.contains('theme-dark')), 'theme control changes appearance');
  assert.equal(await desktop.$eval('.desktop-nav', (element) => getComputedStyle(element).display), 'flex', 'desktop navigation is visible');
  if (evidenceDir) await desktop.screenshot({ path: `${evidenceDir}/desktop-home.png`, fullPage: true });

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
  mobile.on('pageerror', (error) => errors.push(`mobile: pageerror: ${error.message}`));
  mobile.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== baseUrl && url.protocol !== 'data:') externalRequests.add(url.origin);
  });
  await mobile.goto(`${baseUrl}/tools-and-jigs/`, { waitUntil: 'networkidle0' });
  const mobileControl = await mobile.$eval('.mobile-nav summary', (element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  assert.ok(mobileControl.width >= 44 && mobileControl.height >= 44, 'mobile menu has a 44px touch target');
  await mobile.click('.mobile-nav summary');
  assert.equal(await mobile.$$eval('.mobile-nav nav a', (links) => links.length), 8, 'mobile menu exposes every public navigation route');
  assert.equal(await mobile.$eval('.desktop-nav', (element) => getComputedStyle(element).display), 'none', 'desktop navigation is hidden on mobile');
  if (evidenceDir) await mobile.screenshot({ path: `${evidenceDir}/mobile-tools-and-jigs.png`, fullPage: true });

  await browser.close();
  assert.deepEqual(errors, [], `browser errors: ${errors.join('; ')}`);
  assert.deepEqual([...externalRequests], [], `unexpected external requests: ${[...externalRequests].join(', ')}`);
  console.log(JSON.stringify({ ok: true, routes: routes.length, keyboard: 'skip link first', mobileTouchTarget: mobileControl, externalRequests: [] }));
} finally {
  server.kill('SIGTERM');
}
