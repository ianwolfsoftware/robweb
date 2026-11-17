import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const designDir = dirname(fileURLToPath(import.meta.url));
const root = join(designDir, '..');
const require = createRequire(import.meta.url);
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const tokens = JSON.parse(await readFile(join(designDir, 'tokens.json'), 'utf8'));
const preset = require('./tailwind.preset.cjs');
check(tokens.color.brand.amber.$value === '#f5a623', 'amber token changed');
check(preset.theme.extend.colors.ink === '#0b0d10', 'Tailwind preset does not expose ink');
check(preset.theme.extend.colors.steel[300] === '#c7ccd4', 'Tailwind preset does not expose steel text');

const references = await readFile(join(root, 'docs/DESIGN-REFERENCES.md'), 'utf8');
const spellLinks = references.match(/https:\/\/designspells\.com\/spells\//g) || [];
check(spellLinks.length >= 25, `expected at least 25 spell references, found ${spellLinks.length}`);

const pages = [
  'design/prototype/index.html',
  'design/spikes/blueprint-truss/index.html',
  'design/spikes/timber-shavings/index.html',
  'design/spikes/exploded-joint/index.html'
];
for (const page of pages) {
  const source = await readFile(join(root, page), 'utf8');
  check(/<meta name="robots" content="noindex, nofollow, noarchive">/.test(source), `${page} lost noindex`);
  check(!/<script[^>]+src="https?:\/\//.test(source), `${page} loads a remote script`);
  check(!/<iframe/i.test(source), `${page} contains an iframe`);
}

const boot = await readFile(join(designDir, 'spikes/shared/boot.js'), 'utf8');
for (const gate of ['reduced-motion', 'save-data', 'low-memory', 'low-cpu', 'low-battery', 'no-webgl', 'load-error']) {
  check(boot.includes(gate), `missing WebGL fallback gate: ${gate}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'ok',
  designSpellReferences: spellLinks.length,
  standalonePages: pages.length,
  webglFallbackGates: 7,
  tokens: 'valid JSON and Tailwind preset loaded'
}, null, 2));
