# Premium visual rebuild — verification report

Task: `ee45a2c7-515b-4c0e-8ed9-aa93b50dd13f`
Branch: `codex/desk/robweb/ee45a2c7-515b-4c0e-8ed9-aa93b50dd13f`

## Outcome

The flat public foundation has been rebuilt as a dark-first “measured craft” site with a complete light theme. The real RC / Robin Clevett artwork now appears in the sticky header, full-screen phone menu, footer, favicon/touch icon and 1200 × 630 social card. The home hero uses Robin's own roof-frame image with a lazy custom WebGL amber/steel ribbon field and a designed static blueprint fallback; it no longer renders a detached empty black strip.

anime.js v4 drives staggered hero copy, section reveals, source-backed count-up stats, the YouTube proof marquee, magnetic primary buttons, menu entrance and page exit/entrance transitions. Content stays visible before animation, so delayed JavaScript or observers cannot create empty bands. Reduced motion retains the complete static composition.

The public pages now share the same editorial system: compact pill navigation, confident display type, hairline stat/card grids, amber measurement cues, alternating steel/light bands, responsive local imagery and a large dark footer. Work has a keyboard lightbox; Videos uses no-cookie local cards and opens YouTube only after a choice; App shows a fresh real RC Calculators V3 screen; forms retain their existing validated API submission path.

## Commits

- `4f6d882` — plan, immutable brand assets, real V3 screen, self-hosted Latin font subsets and responsive AVIF/WebP media.
- `83ae757` — public experience, light/dark system, WebGL, anime.js interactions, navigation, page layouts and expanded browser proof.

The screenshot/report evidence is committed separately after the verified build so it corresponds to the candidate above.

## Browser proof

`docs/design-proof/captures/` contains 72 full-page PNGs: all 18 public routes at exactly:

- phone `390 × 844`, dark;
- phone `390 × 844`, light;
- desktop `1440 × 900`, dark;
- desktop `1440 × 900`, light.

Naming is `{theme}-{viewport}-{page}.png`. Four contact sheets in the same directory were visually reviewed after the final run:

- `contact-dark-mobile.jpg`
- `contact-light-mobile.jpg`
- `contact-dark-desktop.jpg`
- `contact-light-desktop.jpg`

`browser-evidence.json` records every route/combination. Final automated results:

```text
screenshots: 72
routes: 18
page errors: 0
unsolicited external requests: 0
horizontal overflow: 0 routes
home WebGL: ready in all four ordinary captures
reduced motion: fallback / reduced-motion
mobile local LCP: 64 ms
mobile local CLS: 0
```

The LCP/CLS figures are repeatable built-preview evidence on this workstation, not public-network field data. The WebGL result is headless SwiftShader regression evidence; fallback gates also cover Save-Data, <=2 GB memory, <=2 logical CPUs, low unplugged battery, unavailable WebGL and load failure.

The browser check additionally verified one H1, prerendered heading source, noindex, the main landmark, real header/footer logos, favicon, touch icon, social image, first keyboard focus on the skip link, theme switching, desktop navigation, all ten full-screen phone-menu routes, >=44 px phone targets and secure admin sign-in.

## Quality gates

```text
npm run typecheck       passed (client + server)
npm test                1 file / 4 tests passed
npm run inventory:check 21 pages / 133 assets / 15 videos; no failures
npm run build           75 modules; prerender and server compile passed
npm run shell:check     72 screenshots; all assertions passed
cd design && npm run verify
                         30 references / 4 pages / 7 WebGL gates passed
git diff --check         passed
```

## Honest remaining boundaries

- The reviewed Shopify product cache is still empty because its original single public request returned HTTP 429. The Shop page is polished and honest, but has no invented product cards; `/go/shop` remains the buying route.
- App Store, Play Store and web-app links deliberately remain labelled placeholders until owner-approved URLs are configured.
- Final legal identity/contact/processor wording still needs owner review before launch. `noindex` remains everywhere as required.
- The optional WebGL layer was verified in Chrome/SwiftShader and its low-power fallbacks were exercised. A physical representative Android GPU field run is still a launch-quality check, not evidence claimed here.

No deploy, service restart, database operation, migration, DNS/edge/TLS/`robc.co.uk` change, push, customer-data experiment, external message or purchase occurred.

## Design principles used

Hick's Law and cognitive-load control keep one dominant action per hero and group lesser routes; Fitts's Law shapes 48 px actions and the full-screen phone menu; Jakob's Law keeps familiar navigation, form, theme and dialog patterns; Gestalt proximity and shared hairlines join related stats/cards; amber colour psychology signals action and measurement without recolouring the RC mark. Every public route was exercised at the required phone and desktop sizes before this report.
