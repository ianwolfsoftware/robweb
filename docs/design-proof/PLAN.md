# Premium visual rebuild plan

Task: `ee45a2c7-515b-4c0e-8ed9-aa93b50dd13f`
Prepared: 17 November 2026

## Direction and audience

The site is for people who already know Robin from site work, YouTube, Instagram or Tools & Jigs, plus homeowners and tradespeople who need a quick route to his work, videos, calculators, shop or contact form. The public experience should feel like Robin: practical, measured and direct. It must not feel like a generic contractor template.

The visual language is **measured craft**: near-black steel, warm amber `#f5a623`, white/metal RC artwork, blueprint lines, timber texture and Robin-owned site photography. Amber marks actions and measurements; it is not used as wallpaper and never recolours the logo.

The page-wide system matches the strongest reGDPR traits observed in its current source and browser render:

- a dark hero with a lazy, optional WebGL ribbon field and a designed static fallback;
- large confident display type, compact mono labels and one obvious primary action;
- a compact sticky navigation pill with a full-screen phone menu;
- a real human image composed into the hero rather than a detached card;
- alternating dark/light editorial bands, hairline rules and stat rows;
- staggered hero motion, scroll reveals and restrained button movement;
- generous phone spacing, 48 px actions and layouts that become one column without losing hierarchy.

Robweb keeps its own identity: construction geometry, roof lines, tool-like controls, amber/steel colour, Robin's immutable logo and his own media only.

## Page layouts

| Route | Layout and primary action |
| --- | --- |
| Home | Dark full-height hero with Robin at work, animated amber blueprint ribbons, proof stats and “Watch Robin's videos”; proof marquee; project image feature; Tools & Jigs and RC Calculators split panels; contact close. |
| About | Dark editorial intro, Robin portrait/site image split, measured approach principles, source-led image band; primary action to videos. |
| Services | Dark intro, three numbered service routes, project image band and enquiry close; primary action to contact. |
| Work / Projects | Dark intro, four-stage masonry gallery with keyboard lightbox and honest source labels; primary action opens the work. |
| Videos | Dark intro, horizontally moving YouTube/Instagram proof rail, local no-cookie video cards which open YouTube only on choice; primary action to the latest video. |
| Robin Recommends | Dark intro and three disclosure-first recommendation panels; primary action to Robin's videos/shop. |
| Shop / Tools & Jigs | Dark workshop intro, official-store explanation, reviewed-cache state, three clear buying steps; primary action through `/go/shop`. |
| App / Calculator app | Dark app hero with a real V3 login-screen capture and RC artwork, metric-first steps, placeholder store controls and stable legal links; primary action is conditional on approved URLs only. |
| Contact | Dark concise intro, safety note and existing API-backed enquiry form; primary action submits the enquiry. |
| Register interest | Dark concise intro and existing API-backed interest form, with explicit purpose/retention copy; primary action registers interest. |
| Privacy / Terms / Disclaimer / Cookies | Dark masthead, narrow readable legal sheet and visible review status; privacy control remains available. |
| Calculator privacy / terms | Same legal treatment while preserving the published URLs exactly. |
| 404 | Dark blueprint scene, short recovery copy and four high-value routes; primary action returns home. |

## Interaction plan

- anime.js v4: hero word/line stagger, page entrance, observed section reveals, count-up of source-backed stats, marquee movement and magnetic pointer response on primary buttons. Motion never determines access to content.
- WebGL: a dependency-free shader draws flowing amber/steel blueprint ribbons behind the home hero. It imports during idle time, caps pixel density, pauses when hidden/offscreen, and falls back for reduced motion, Save-Data, <=2 GB memory, <=2 logical CPUs, low battery, missing WebGL or load failure.
- Navigation: Home, Videos, Work, Services, App, Shop and Contact live in the sticky pill; Tools & Jigs is the dominant outbound action. About and Robin Recommends remain in the full-screen mobile menu and footer to keep the desktop choice set readable.
- Gallery: native button controls, labelled dialog, Escape/arrow navigation and visible close/previous/next controls.
- Theme: dark is the designed default. The light palette retains black/steel type, pale warm surfaces and dark hero bands; the immutable steel logo variant is used on light navigation/footer surfaces.

## Verification and proof matrix

Every public route in the prerender inventory will be captured at:

- `390 × 844`, dark;
- `390 × 844`, light;
- `1440 × 900`, dark;
- `1440 × 900`, light.

The capture check will also assert no horizontal overflow, one visible H1, `noindex`, no page errors, no unsolicited external requests, logo presence, 44 px minimum menu targets, reduced-motion WebGL fallback and no layout band with zero meaningful content. Output lives in this directory with a machine-readable `browser-evidence.json`.

Performance checks use the built preview, responsive local images, self-hosted Latin font subsets, fixed image dimensions/aspect ratios and a browser timing record. The target is mobile LCP under 2.5 seconds and CLS approximately zero in the repeatable local proof environment; this is not presented as a public-network field measurement.

## Design principles

- **Hick's Law / cognitive load:** one dominant action in each hero; secondary routes grouped into proof strips or the full menu.
- **Fitts's Law:** 48 px actions and a full-screen phone menu put core routes in the thumb zone.
- **Jakob's Law:** familiar sticky header, theme control, dialog lightbox, forms and footer patterns.
- **Gestalt:** shared rules, spacing and surfaces make related projects, stats and legal text read as groups.
- **Colour psychology:** near-black and steel signal dependable craft; amber signals energy, measurement and action, never status by colour alone.
