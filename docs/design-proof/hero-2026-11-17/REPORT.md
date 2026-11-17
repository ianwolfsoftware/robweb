# Robin Clevett hero proof — 17 November 2026

## Result

The homepage now opens with a full-bleed photograph of Robin, his existing logo, his name and two direct entry points: **Products** and **RC Calculators**. The hero contains no tagline, eyebrow or marketing paragraph.

The selected photograph is a 3840×2160 frame from Robin's official YouTube channel. It was chosen for direct eye contact, an open natural smile and crop room around Robin. The mobile and desktop compositions use separate source crops so his face remains in the safe area.

## Source evidence

- Candidate sheet: `assets/source/hero-candidates/contact-sheet.jpg`
- Source metadata, timestamps, resolutions and sharpness scores: `assets/source/hero-candidates/candidates.json`
- Eight full-resolution candidate stills: `assets/source/hero-candidates/candidate-*.jpg`
- 16:9, 21:9 and 4:5 crops for the top three: `assets/source/hero-candidates/top-{1,2,3}/`
- Selected source: Robin Clevett's official video, *Japanese Carpentry and Joinery in London 2025. My visit to Japan House Kensington*, at 42.75 seconds

All downloaded video segments were deleted after frame extraction. Asset rights and origin are recorded in `content/assets.json` as `robin-own-youtube`.

## Delivery

- Responsive AVIF and WebP files at 640, 960, 1440 and 2560 widths are in `assets/optimised/hero-robin/`.
- Mobile uses the 4:5 source crop; desktop uses the 21:9 source crop.
- The prerendered homepage preloads the matching mobile or desktop AVIF source.
- The hero image has intrinsic dimensions, meaningful alternative text and high fetch priority.
- The previous homepage WebGL layer is not mounted, reducing competition with the LCP image.

## Browser proof

- `dark-390x844-hero.png`
- `light-390x844-hero.png`
- `dark-1440x900-hero.png`
- `light-1440x900-hero.png`

The four captures were produced from the built site at exactly the named viewport dimensions. They were visually checked for face crop, name/logo legibility, button hierarchy and horizontal overflow.

## Verification

- `npm run build` — pass
- `npm run check` — pass
- `npm test` — 5 tests pass
- `npm run inventory:check` — 143 assets pass provenance and integrity checks
- `npm run shell:check` — 48 route/theme/viewport combinations pass; no browser errors or unexpected external requests
- Local browser performance check — LCP 64 ms, CLS 0 at 390×844

No database, API/proxy, live service, DNS or deployment changes were made.
