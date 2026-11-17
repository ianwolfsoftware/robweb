# Products + App simplification — verification report

Task: `d9367c5f-c535-4579-8637-a11745acdee7`

Branch: `codex/desk/robweb/d9367c5f-c535-4579-8637-a11745acdee7`

Implementation commit: `fd84029` (`Simplify Robweb around products and app`)

## Outcome

The candidate now has one focused public proposition: Robin's Tools & Jigs products and the RC Calculators app. Header and phone navigation contain only Home, Shop, App and Contact, with a prominent tracked Tools & Jigs action. Footer content is equally reduced, and social destinations are small icon links only. Fifteen retired/legacy route aliases use one source-controlled map and return a real 301 to Home or Shop; those pages are absent from navigation, home bands and the sitemap while their source inventory remains in the repository.

The server-side catalogue fetches the public Tools & Jigs Shopify feed first with a polite user agent, six-second timeout, request de-duplication and a 15-minute memory cache. A read-only Storefront token is optional, and the committed 11-product snapshot is the final fallback. The snapshot was refreshed directly from `https://toolsandjigs.com/products.json?limit=250` at `2026-11-17T16:32:21.430Z`; it contains only the approved product fields, stripped descriptions and Shopify URLs. Cards keep GBP prices and availability from the feed, use lazy Shopify CDN images with a second-image hover, and leave buying on the canonical Shopify product through the aggregate `/go/shop?product=` tracker.

Home moves from Robin's real logo/photo hero directly to four catalogue products, the app, official shop and contact. App uses the current V3 light/dark product screens and states the approved £24.99 monthly / £254.99 yearly VAT-inclusive pricing, all-calculator subscription, metric-first workflow, regular additions and coming-soon member offers. Google Play and App Store controls remain explicitly unavailable placeholders. No inventory statistics, baked-caption gallery, work, service, recommends or video section remains.

## Browser proof and review

This directory contains 48 final full-page PNGs, named `{theme}-{viewport}-{page}.png`, for all 12 remaining pages at exactly:

- phone 390 × 844, dark and light;
- desktop 1440 × 900, dark and light.

`browser-evidence.json` records the complete run generated at `2026-11-17T17:07:19.385Z`. Eight `contact-*.jpg` sheets show the top viewport and full composition in all four combinations. I reviewed every sheet plus the full Home, Shop, App and Contact captures. Product imagery is complete through all 11 phone cards; app screens are legible in both modes; phone layouts remain one-column without clipping; legal pages retain readable measure; and there are no empty bands, unfocused skip-link artefacts or former internal statistics.

Final automated browser results:

```text
pages: 12
theme/viewport combinations: 4
screenshots: 48
legacy 301s checked: 15
page errors: 0
unsolicited external origins: 0
horizontal overflow: 0 routes
reduced motion: designed fallback / reduced-motion
mobile local LCP: 92 ms
mobile local CLS: 0
```

The local LCP/CLS result is repeatable built-server regression evidence, not public-network field performance. The harness additionally verifies the four-link desktop/phone choice set, ≥44 px phone targets, keyboard-visible skip link, one prerendered H1, noindex, logo/favicon/social assets, all 11 products, lazy-loading attributes, tracked buy links, app pricing/screens, shared redirect targets, reduced sitemap, real 404 and secure admin sign-in.

## Quality gates

```text
npm run typecheck        passed (client + server)
npm test                 1 file / 5 tests passed
npm run inventory:check  21 preserved source pages / 135 assets / 11 shop products; no failures
npm run build            75 client modules; prerender + server compile passed
npm run shell:check      12 pages / 48 screenshots / 15 redirects; all assertions passed
git diff --check          passed
```

Task evidence logs are in `/home/ianc/brains/codex/work/robweb-d9367c5f-products-app/` (`gates-final.log`, `shell-final.log`, `proof-files.txt`).

## Honest launch boundaries

- This is a committed candidate only. No deploy, service restart, push, database/SQL operation, migration, DNS, edge, TLS or `robc.co.uk` change occurred.
- App Store and Google Play destinations are not approved/live, so the UI deliberately does not link them.
- Final legal identity, contact, processor and retention wording still requires owner review before launch; noindex remains enabled.
- Shopify product content can change after this snapshot. Runtime refresh is the source of truth when reachable, while the committed snapshot prevents an empty shop during an upstream failure.
- WebGL/reduced-motion behavior is covered in headless Chrome/SwiftShader; this task does not claim a physical-device GPU or public-network field run.
