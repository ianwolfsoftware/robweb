# Robweb WebGL concept lab

These are standalone, noindex design-risk spikes, not production components. They use local `three` from npm and do not contact a CDN. HTML content and CSS fallback render before `shared/boot.js` checks reduced motion, Save-Data, device memory, CPU count, battery state and WebGL support. The scene is imported during idle time only when those gates pass; render loops pause while the scene is offscreen or the document is hidden.

## Run and verify

From `design/`:

```bash
npm install
npm run verify
npm run serve
# in another shell, while the local server is running
npm run capture
```

`capture.mjs` launches `/usr/bin/google-chrome` itself through Playwright Core with a fresh, unsigned, headless context. It does not use a shared or signed-in browser.

## Final headless evidence

Captured 17 November 2026. Full machine-readable results, including response status, console errors, external requests, horizontal overflow, headings and noindex, are in [`screenshots/browser-evidence.json`](./screenshots/browser-evidence.json).

| Scene | 390 × 844 average / p95 RAF interval | 1440 × 900 average / p95 RAF interval | Calls / triangles | Result |
| --- | ---: | ---: | ---: | --- |
| Blueprint truss | 16.67 / 16.8 ms | 16.80 / 16.7 ms | 2 / 2 | 60 fps cadence; no phone long frames. |
| Timber and shavings | 16.67 / 16.7 ms | 16.98 / 16.8 ms | 2 / 2 | 60 fps cadence; no phone long frames. |
| Exploded joint | 17.14 / 16.7 ms | 17.14 / 16.8 ms | 14 / 84 | One >25 ms interval in each sample; p95 remains within budget. |

The local unminified three.js ESM module is 658,900 bytes raw / 129,980 bytes gzip; scene sources are 3.5–4.3 kB raw / 1.5–1.8 kB gzip each. Production must bundle, tree-shake and retain the ≤190 kB Brotli optional-chunk gate in `docs/DESIGN.md`.

This is headless Chrome using SwiftShader, so the figures are a repeatable regression signal rather than proof of a physical mid-range phone GPU. The design gate still requires testing the selected launch concept on representative Android hardware. All four reduced-motion checks returned the static fallback with reason `reduced-motion` and imported no scene.

## Captures

| Concept | Phone | Desktop |
| --- | --- | --- |
| Blueprint truss | [`blueprint-truss-mobile.png`](./screenshots/blueprint-truss-mobile.png) | [`blueprint-truss-desktop.png`](./screenshots/blueprint-truss-desktop.png) |
| Timber and shavings | [`timber-shavings-mobile.png`](./screenshots/timber-shavings-mobile.png) | [`timber-shavings-desktop.png`](./screenshots/timber-shavings-desktop.png) |
| Exploded joint | [`exploded-joint-mobile.png`](./screenshots/exploded-joint-mobile.png) | [`exploded-joint-desktop.png`](./screenshots/exploded-joint-desktop.png) |
| Home prototype | [`prototype-mobile.png`](./screenshots/prototype-mobile.png) | [`prototype-desktop.png`](./screenshots/prototype-desktop.png) |

The Home captures are full-page feel checks. The three concept captures are exact required viewports.
