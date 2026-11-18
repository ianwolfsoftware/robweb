import process from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

function readArgument(name, fallback) {
  const entry = process.argv.slice(2).find((argument) => argument.startsWith(`--${name}=`));
  return entry ? entry.slice(name.length + 3) : fallback;
}

const url = readArgument('url');
const outputDirectory = readArgument('out');
const prefix = readArgument('prefix', 'phone');
const step = Number(readArgument('step', '250'));
const settle = Number(readArgument('settle', '180'));

if (!url || !outputDirectory || !Number.isFinite(step) || step < 1) {
  throw new Error('Usage: node scripts/capture-scroll-frames.mjs --url=https://example.test/ --out=/path/to/output [--prefix=phone] [--step=250]');
}

await mkdir(outputDirectory, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('robweb-theme', 'dark');
      localStorage.setItem('robweb-analytics-consent-v1', 'rejected');
      sessionStorage.setItem('robweb-motion-intro', 'seen');
    } catch { /* Cross-origin references may disallow storage. */ }
  });

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await new Promise((resolve) => setTimeout(resolve, 2_000));

  const documentState = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: { width: innerWidth, height: innerHeight },
    title: document.title,
  }));
  const maximumScroll = Math.max(0, documentState.height - documentState.viewport.height);
  const positions = [];
  for (let position = 0; position < maximumScroll; position += step) positions.push(position);
  if (positions.at(-1) !== maximumScroll) positions.push(maximumScroll);

  const frames = [];
  for (const [index, requestedScroll] of positions.entries()) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), requestedScroll);
    await new Promise((resolve) => setTimeout(resolve, settle));
    const state = await page.evaluate(() => {
      const marquee = document.querySelector('[data-marquee-track]');
      const portrait = document.querySelector('[data-hero-portrait]');
      const watched = [...document.querySelectorAll('[data-phone-reveal-state]')];
      return {
        scrollY: Math.round(scrollY),
        portraitTransform: portrait ? getComputedStyle(portrait).transform : null,
        marqueeTransform: marquee ? getComputedStyle(marquee).transform : null,
        revealDone: watched.filter((element) => element.getAttribute('data-phone-reveal-state') === 'done').length,
        revealWatching: watched.filter((element) => element.getAttribute('data-phone-reveal-state') === 'watch').length,
      };
    });
    const filename = `${prefix}-${String(index).padStart(2, '0')}-${String(state.scrollY).padStart(5, '0')}.png`;
    await page.screenshot({ path: `${outputDirectory}/${filename}`, fullPage: false });
    frames.push({ filename, requestedScroll, ...state });
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    url,
    step,
    settle,
    document: documentState,
    maximumScroll,
    frameCount: frames.length,
    errors,
    frames,
  };
  await writeFile(`${outputDirectory}/${prefix}-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ ok: errors.length === 0, ...manifest }, null, 2));
} finally {
  await browser.close();
}
