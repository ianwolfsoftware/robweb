# Robweb design direction

Status: design system plus historical exploration. The current public implementation follows the simplified 17 November 2026 direction below and supersedes the broader information architecture later in this document. It continues to follow `CLAUDE.md`: immutable RC logo artwork, Robin-owned imagery only, Irish English, metric first, no unapproved claims/prices/reviews, no tracking before consent and `noindex` until launch approval.

## Current Products + App direction

- Header and phone menu expose only Home, Shop, App and Contact, plus the prominent external Tools & Jigs action.
- Home moves directly from Robin's premium dark hero into featured products, RC Calculators, the official shop and Contact. There are no stats, work gallery, services, video or recommendations bands.
- Shop is the product catalogue. It shows the live/snapshot Shopify fields without rewriting prices, availability or product claims; buying and product canonical URLs remain on Tools & Jigs.
- App uses real V3 light/dark product screens, metric-first copy, the approved subscription prices and honest unavailable store-link placeholders.
- Legal and stable calculator-app URLs remain first-class utility routes. Retired public sections are not linked and permanently redirect.
- Every remaining page is reviewed at phone/desktop in light/dark. The task-specific plan and proof are in `docs/design-proof/products-app/`.

The audience, flows, navigation and wireframes below document the earlier full-site exploration. They remain useful design rationale but are not the active public information architecture.

## 1. The idea: **Measured craft**

Robweb should feel like standing at a clean workbench with an expert who enjoys explaining the detail. It is precise without being clinical, energetic without being frantic, and tactile without becoming faux-rustic. Dark steel creates focus; warm amber behaves like a pencil mark, laser line or active control; Robin's own photographs supply the human texture.

Three recurring visual gestures bind the site together:

- **The measured line** — thin grids, dimension notes and rule marks establish clarity.
- **The fitted part** — cards and scenes assemble from simple pieces; motion explains relationships.
- **The clean reveal** — imagery moves from drawing/detail into finished work, never from arbitrary decoration.

The site is not a blueprint-themed novelty. The metaphor stops wherever it would compete with reading, imply technical advice, slow navigation or weaken a call to action.

## 2. UX foundation

### Audiences and jobs

| Audience | What they came to do | Shortest successful route |
| --- | --- | --- |
| Working carpenter / builder | Find a practical video, calculator or Robin-endorsed tool. | Search/topic → useful item → watch/use/buy out. |
| DIY or trade learner | Understand Robin and find a clear place to start. | Home → Videos or App → labelled next step. |
| Tools and Jigs shopper | See the relevant range and reach the official store. | Shop page → product/category summary → UTM-tagged Tools and Jigs link. |
| Potential client / collaborator | Judge the standard of work and make an appropriate enquiry. | Services/Projects → Contact → receipt and next-step expectation. |
| Existing app user | Find the calculator destination, privacy or terms quickly. | App page → destination/legal link in one tap. |

Representative stories:

- As a carpenter on a phone, I want Shop, Tools and Jigs, App and Contact within thumb reach so I can act without hunting through a header.
- As a learner, I want videos grouped by the job I am doing so I do not need to understand Robin's publishing chronology.
- As a potential client, I want project evidence and service boundaries before a form so I know whether my enquiry fits.
- As an app user, I want the existing calculator legal URLs to remain obvious and stable so I can verify what I use.

### Information architecture

Primary task groups, in visitor language:

1. **Learn:** Videos, Robin Recommends.
2. **Use:** RC Calculators App.
3. **Buy:** Shop page, then explicit external Tools and Jigs destination.
4. **See the work:** Projects, Services, About.
5. **Get in touch:** Contact / Register interest.

Home gives one dominant action (“Watch & learn”), then two equal routes (“Shop” and “App”). This applies Hick's Law and cognitive-load control: visitors choose a job, not one of fifteen pages. Related cards use consistent proportions and spacing (Gestalt similarity/proximity). Familiar header, menu sheet, cards and bottom navigation honour Jakob's Law. Phone actions remain at least 44 × 44 CSS pixels and the four high-value routes sit in the lower thumb zone (Fitts's Law).

### Core flows

```text
Learn:  Home → Videos → Topic/filter → YouTube privacy notice → deliberate outbound watch
Buy:    Home/Shop → Shop item/category → explicit “Opens Tools and Jigs” → official store
App:    Home/App → understand use → approved store/web destination OR privacy/terms
Proof:  Home/Services → Projects → detail → Contact
Lead:   Contact → choose enquiry type → minimum fields → review/consent → send → clear receipt
```

No flow depends on WebGL, animation, hover, autoplay media or a custom cursor.

## 3. Brand system

### RC mark

- Use only approved source artwork. Never redraw, trace, recolour, gradient-map, distort, outline or animate the mark.
- **Dark fields:** supplied metal/white RC logo. **Light fields:** supplied black-steel logo. If a correct light-field asset is not supplied, keep the approved metal mark on its own dark holding plate; do not manufacture a black version.
- Minimum clear space: the height of the `R` diagonal on every side. Minimum digital width: 128 px full lock-up, 40 px approved monogram if supplied.
- The adjacent environment may animate, but the logo pixels do not. Seasonal or hover detail belongs beside it, never on it.
- No amber RC logo. Amber is the UI action/measurement accent.

### Colour

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Dark canvas | `ink` | `#0b0d10` | Main dark background and strongest text on light. |
| Dark surface | `steel-900` | `#14171c` | Header, cards, sheets. |
| Dark raised | `steel-800` | `#1c2026` | Hover/selected surface, dividers. |
| Dark body text | `steel-300` | `#c7ccd4` | Paragraphs on dark; headings use white. |
| Action accent | `amber` | `#f5a623` | Primary controls, focus, measurements, small highlights. |
| Light canvas | `paper` | `#f3f4f6` | Long reading and alternating feature sections. |
| Light surface | `white` | `#ffffff` | Cards/forms on light. |

Amber should cover roughly 5–10% of a screen: it means “active, measured or next”. It never carries a warning by itself. Status colours include icon and text, not colour alone. Contrast is checked against the actual paired surface; small amber copy is darkened on light (`#9d6100`) while the brand accent remains unchanged for fills/large marks.

### Light and dark

- Default public presentation may follow system preference, but each page must have a deliberate dominant mode rather than alternating every card.
- Dark mode: steel layers, white headings, `#c7ccd4` body, amber action.
- Light mode: paper/white layers, `#0b0d10` headings, `#1c2026` body, amber fill with dark text.
- Robin's photographs retain their source colour. Never use CSS colour filters to force them into theme.
- WebGL uses the dark palette only; in a light section it sits in a contained dark “drawing table”.

### Typography

Use at most two families:

1. **Inter Variable**, self-hosted WOFF2 (OFL), weights 400–850: all interface, headings, body, figures and navigation. The fallback is the system sans stack.
2. **Georgia**, system serif, italic only: one short human phrase in a display heading or pull quote. Never use it for controls or paragraphs.

The tight display scale feels engineered; normal body leading keeps it approachable.

| Style | Mobile | Desktop | Line height | Notes |
| --- | ---: | ---: | ---: | --- |
| Display | 56 px | `clamp(64px, 8vw, 120px)` | .88–.94 | Maximum 12–14 words, balanced. |
| H1 interior | 44 px | 72 px | .95 | One per page. |
| H2 | 36 px | 56 px | 1.0 | Section proposition. |
| H3 | 24 px | 30 px | 1.1 | Card group heading. |
| Lead | 18 px | 20 px | 1.55 | Maximum 34 rem. |
| Body | 16 px | 17 px | 1.6 | Reading line 60–72 characters. |
| Label | 12 px | 12 px | 1.2 | 0.12–0.16 em tracking, uppercase only for short labels. |

Numbers and dimensions use the system monospace stack as a third *utility style*, not a third branded family.

### Spacing, radius and shadow

- Base spacing step: 4 px; common rhythm: 8, 12, 16, 24, 32, 48, 64, 80, 96, 128.
- Mobile section padding: 48–64 px vertical, 16 px horizontal. Desktop: 96–128 px vertical, fluid 32–96 px horizontal.
- Radius communicates object type: 4 px workshop controls, 8 px inputs, 16 px cards/sheets, full pill only for compact filters/status.
- Shadows appear only when elevation adds meaning. Most hierarchy comes from surface, border and space. `lift` is for menus/cards; `float` is for the mobile dock or a device mock-up.
- Focus: two-stage dark + amber ring, never removed.

Canonical machine-readable tokens live in [`design/tokens.json`](../design/tokens.json); [`design/tailwind.preset.cjs`](../design/tailwind.preset.cjs) exposes the same primitives to Tailwind.

### Grid

- Content maximum: 1440 px; reading maximum: 672 px.
- Phone: 4 columns, 16 px gutter, 16 px outer margin.
- Tablet: 8 columns, 20 px gutter, 24 px outer margin.
- Desktop: 12 columns, 24 px gutter, 32–64 px outer margin.
- Marketing splits use 5/7 or 6/6. Text never stretches simply to fill its half.
- Use visible rule lines sparingly to connect sections and align measurements. Irregular collage layouts are reserved for Projects, where the images justify them.

### Imagery and video

- Only assets documented as Robin-owned/approved in `content/assets.json`, his approved YouTube thumbnails or Tools and Jigs feed assets.
- Hero: one decisive working image, 16:9 or 3:2, with a known focal point. Never put important faces/hands under text.
- Projects: preserve documentary honesty; correct orientation/exposure at most, no fake sky, removed scaffolding or invented finished work.
- Crops: 4:3 for project cards, 16:9 for videos, 3:4 for portrait/process. Store focal-point metadata so phone crops remain intentional.
- Every image has dimensions, responsive `srcset`, AVIF/WebP plus fallback, descriptive alt or an empty alt when adjacent copy already describes it.
- YouTube thumbnails show title, topic and duration in HTML. The external player loads only after deliberate action and any required consent; never autoplay.
- Overlays are neutral black/steel gradients. Amber is not washed across photography.

### Iconography and microcopy

- One 1.75 px rounded-line SVG family, 20/24 px grid. Prefer simple construction-adjacent shapes only when their meaning is familiar; otherwise use standard interface symbols.
- Label external links with `↗` plus visually hidden “opens Tools and Jigs/YouTube”. Label icons whose meaning is not universal.
- Use `mm`, `m` and metric examples first. Do not add safety or compliance implications to decorative measurement art.
- Voice is direct, warm and specific: “Watch the roof detail”, “See what fits your job”, “Your enquiry has reached us”. Avoid “Unlock”, “revolutionary”, “best-in-class” and invented authority.
- Empty state: “Nothing matches those filters yet. Clear filters or browse all videos.” Error: “That did not send. Your message is still here—try again.”

## 4. Navigation

### Phone: one-handed without hiding the site

The top bar carries the immutable logo and a labelled Menu button. A persistent bottom dock carries the four highest-intent destinations:

```text
┌─────────────────────────────────┐
│ [RC logo]                 Menu  │
│                                 │
│            PAGE                 │
│                                 │
├─────────────────────────────────┤
│ Shop | Tools & Jigs ↗ | App | Contact │
└─────────────────────────────────┘
```

- Each target is at least 56 px high; safe-area inset is included.
- `Shop` opens Robweb's curated shop page. `Tools & Jigs ↗` is an explicit external-store shortcut. They are not conflated.
- The Menu opens a familiar full-height sheet listing Videos, Projects, Services, About, Robin Recommends and legal/help routes, with the current page announced.
- Bottom dock becomes static near the footer so it does not cover legal content. The page remains fully navigable without it.

### Desktop

```text
[immutable RC logo]   Videos  Work  Services  App  Shop   [Tools & Jigs ↗] [Contact]
```

The first five are quiet text links, Tools and Jigs is a bordered external destination, and Contact is the amber primary. A sticky header gains an opaque steel surface after 64 px of scroll; no shrinking logo animation.

## 5. Page wireframes

The boxes show hierarchy, not final copy. `P` is the one primary action for that viewport; `S` is secondary.

### Home

```text
PHONE                              DESKTOP
┌ logo / Menu ┐                    ┌ logo ─ nav ─ Tools↗ Contact ┐
│ eyebrow     │                    ├──────────────┬───────────────┤
│ BUILT       │                    │ proposition  │ optional      │
│ PROPERLY    │                    │ lead + [P]   │ blueprint     │
│ lead        │                    │ proof row    │ truss spike   │
│ [P Videos]  │                    └──────────────┴───────────────┘
│ S Shop      │                    ┌ full-width Robin work image  ┐
├ blueprint ──┤                    ├ shop split ─┬ app split ──────┤
├ project hero│                    ├ latest videos / topics         ┤
├ Shop teaser│                    └ Contact / footer               ┘
├ App teaser │
└ quick dock ┘
```

### App

```text
PHONE                              DESKTOP
┌ App / metric-first ┐             ┌ copy + [P approved destination] │ device/art ┐
│ what it helps with │             ├ calculator categories (not claims/prices)   ┤
│ [P destination]*   │             ├ how it works: choose → enter → result        ┤
│ *pending is honest │             ├ privacy / terms / support links              ┤
│ three-step usage   │             └ related videos + footer                      ┘
│ Privacy | Terms    │
└ related videos     ┘
```

### Shop

```text
PHONE                              DESKTOP
┌ Shop on Robweb ┐                 ┌ intro / why Robin's tools ─ [P Tools & Jigs↗]┐
│ what happens  │                 ├ category rail / approved product cards         ┤
│ [P Tools&Jigs↗]│                │ [image] name + use + external link              │
├ categories    │                 ├ buying happens securely on official store      ┤
├ product cards │                 └ workshop videos / footer                       ┘
└ clear external│
```

No price, availability or product claim appears until supplied by the approved shop feed. Shopify remains canonical.

### Videos

```text
PHONE                              DESKTOP
┌ Videos [Search] ┐                ┌ title + search / latest featured video         ┐
│ topic chips     │                ├ topic filter rail                              ┤
│ featured 16:9  │                ├ 3-column cards: thumbnail, topic, title         ┤
│ latest cards   │                ├ Load more (not endless scroll)                  ┤
└ YouTube notice │                └ click-to-load / outbound explanation            ┘
```

### About

```text
PHONE                              DESKTOP
┌ Robin portrait ┐                ┌ portrait 5 cols │ approved biography 7 cols    ┐
│ short bio      │                ├ timeline / principles / process                 ┤
│ principles     │                ├ selected work image + quotation if approved     ┤
│ timeline       │                └ [P See projects] / social links                 ┘
└ [P Projects]   │
```

### Services

```text
PHONE                              DESKTOP
┌ Service scope ┐                 ┌ plain-language scope + [P Contact]              ┐
│ fit / not fit │                ├ three service blocks with evidence images       ┤
│ service cards │                ├ fit / not-fit boundaries + enquiry preparation  ┤
│ process steps │                ├ process: discuss → assess → agreed next step     ┤
└ [P Contact]   │                └ related projects                                ┘
```

### Projects / Gallery

```text
PHONE                              DESKTOP
┌ Projects [Filter]┐              ┌ title / concise filter bar                     ┐
│ lead project 4:3 │              ├ lead project: 7-col image + 5-col context       ┤
│ card + caption   │              ├ asymmetric 12-col gallery, consistent captions  ┤
│ card + caption   │              ├ project detail: challenge / process / result*   ┤
└ Load more       │              └ [P Contact] *only approved facts                ┘
```

### Robin Recommends

```text
PHONE                              DESKTOP
┌ What this means ┐               ┌ disclosure + selection principles              ┐
│ disclosure      │               ├ grouped: tools / reading / channels / methods   ┤
│ group selector  │               │ cards: why it is useful + approved external link│
│ labelled cards  │               └ latest related guides                           ┘
└ related guides  │
```

Affiliate relationships are stated next to the relevant link. No recommendation is carried over until Robin confirms it is current.

### Contact / Register interest

```text
PHONE                              DESKTOP
┌ Choose route ┐                  ┌ route chooser 4 cols │ form 8 cols              ┐
│ General      │                  │ General / service / collaboration / interest    │
│ Service      │                  ├ minimum fields, purpose and retention summary    ┤
│ Collaboration│                 ├ [P Send enquiry] + inline errors                 │
├ minimum form │                  └ success receipt replaces form, no dead-end modal │
│ [P Send]     │
└ privacy note │
```

Register interest is a purpose choice within the contact system, not a duplicated mystery form. Until recipient, fields, retention and consent are approved, the production form remains disabled.

### 404

```text
PHONE                              DESKTOP
┌ 404 / off the line ┐             ┌ clear 404 copy │ optional spirit-level sketch  ┐
│ [P Home]           │             ├ [P Home] [Shop] [App] [Videos]                 ┤
│ Shop App Videos    │             └ Search / report broken link                    ┘
└ tiny level detail  │
```

The 404 delight is under 8 kB without WebGL and never blocks the exits.

## 6. Motion specification — anime.js v4

### Principles

- Motion explains **where**, **what changed** or **what completed**.
- One orchestrated entrance per view; no perpetual text motion, scroll hijack, custom cursor or autoplay camera tour.
- Transform/opacity first. Avoid animating layout, large blurs and filters. Never animate the RC mark.
- Interaction remains responsive before anime.js loads. Motion is progressive enhancement.

Anime.js v4 vocabulary: use `animate`, `stagger` and timelines from the ESM build. Standard easing tokens are `out(3)` (primary settle), `inOut(2)` (spatial continuity) and `linear` (determinate progress only).

| Moment | Duration / sequence | Easing | Behaviour |
| --- | --- | --- | --- |
| Page leave | 140 ms | `in(2)` | Current main content fades to .0 and moves up 6 px; header stays. |
| Page enter | 320 ms | `out(3)` | New main fades in and moves 12 → 0 px after content/route is ready. Never wait for WebGL. |
| Initial hero | 520–680 ms | `out(3)` | Eyebrow, H1, lead, action, proof; 55 ms stagger, max total 900 ms. |
| Scroll reveal | 420 ms | `out(3)` | Opacity 0 → 1, y 24 → 0 at 15% visibility; once only. Content is visible if JS fails. |
| Card group | 360 ms | `out(3)` | 45 ms stagger, maximum six animated cards; remaining cards appear together. |
| Hover lift | 160 ms in / 120 ms out | `out(2)` | y 0 → -3 px, border changes; pointer-fine devices only. |
| Button press | 90 ms down / 150 ms release | `out(3)` | scale 1 → .98 → 1; state also changes by text/icon. |
| Desktop menu | 220 ms open / 160 ms close | `out(3)` / `in(2)` | Trigger-to-panel scaleY .97 → 1 and y -8 → 0; focus moves on open. |
| Mobile nav sheet | 280 ms open / 220 ms close | `out(3)` / `in(2)` | Sheet y 24 → 0; backdrop opacity; items stagger 28 ms. Body does not scroll. |
| Bottom dock | 240 ms | `out(3)` | Enters once from y 12; active item changes without moving the whole dock. |
| Number counter | 600–900 ms | `out(3)` | Only verified numeric data, triggered once; final value exists in HTML and is announced once. |
| Determinate loader | real duration | `linear` | Measuring-tape line follows actual progress; start only after 400 ms wait. |
| Indeterminate loader | 900 ms loop | `inOut(2)` | One moving rule mark, no percentage, with task label and Cancel where possible. |
| Form success | 420 ms + 120 ms stagger | `out(3)` | Button label settles into “Sent”; receipt panel reveals with reference/next step. No generic confetti. |
| Form error | 180 ms | `out(2)` | Error text expands 4 px; field does not shake. Focus first invalid field. |
| Image/detail comparison | 380 ms | `inOut(2)` | Explicit tap/click; preserve aspect ratio and caption throughout. |

Page transitions run only for client-side navigation where focus management, history and loading states are correct. Back/forward navigation preserves expected scroll position. View Transitions API may enhance this later, but never becomes a dependency.

### Reduced motion

At `prefers-reduced-motion: reduce`:

- page/section/card movement becomes an immediate opacity/state change (≤ 80 ms);
- stagger is removed; counters show their final HTML value; loaders use a static progress/status treatment;
- menu opens in place, focus still moves correctly;
- WebGL is not imported and its CSS/image fallback remains;
- no tilt, particles, parallax, auto-rotation or smooth scrolling.

The same static behaviour is available when Save-Data is on, device memory/CPU is low, battery is low and not charging, WebGL is unavailable, or the optional module throws.

## 7. WebGL concepts and budgets

All concepts are optional hero/background layers. The HTML headline, action and imagery render first. `design/spikes/shared/boot.js` waits for idle time, evaluates motion/data/hardware/battery gates, probes WebGL, then dynamically imports the scene. Failure sets a labelled static fallback without an error surface.

### Concept A — Blueprint truss

Working spike: [`design/spikes/blueprint-truss/`](../design/spikes/blueprint-truss/)

- A procedural two-scale drawing grid sits behind an amber line truss.
- Segments assemble from measured points during the first 1.15 s; scroll can complete the same progression. Pointer adds at most 5° apparent depth.
- Best fit: Home hero or Projects introduction. It expresses precision without borrowing a third-party asset.
- Fallback: CSS two-scale grid plus a static amber highlight; production can add a tiny inline SVG truss drawn from original geometry.
- Scene budget: 2 draw calls, 2 plane triangles plus 9 line segments, no textures, DPR ≤ 1.5.

### Concept B — Timber and shavings

Working spike: [`design/spikes/timber-shavings/`](../design/spikes/timber-shavings/)

- A fragment shader creates abstract grain; 130 points on phone / 220 on desktop suggest light shavings.
- Pointer attraction is intentionally weak. No gyroscope permission, vibration or audio.
- Best fit: Shop or About transition, used once on the whole site.
- Fallback: layered CSS radial/repeating gradients.
- Scene budget: 2 draw calls, 2 triangles + ≤ 220 points, no textures, DPR ≤ 1.5.

### Concept C — Exploded roof joint

Working spike: [`design/spikes/exploded-joint/`](../design/spikes/exploded-joint/)

- Seven simple members settle from an exploded view into a recognisable roof frame; edges make assembly readable.
- It is brand storytelling, not a dimensioned specification. No measurement or compliance claim is attached.
- Best fit: Services or Projects. Pointer rotation is capped and the model stops doing meaningful work after assembly.
- Fallback: static line composition in CSS/SVG.
- Scene budget: ≤ 16 draw calls, < 150 triangles, no shadows/textures/post-processing, DPR ≤ 1.5.

### Shared production performance contract

| Budget | Target / gate |
| --- | --- |
| Core WebGL dependency | Lazy separate chunk, target ≤ 190 kB Brotli including three.js; never in critical public shell. Consider OGL if the production scene cannot meet this. |
| Scene code | ≤ 12 kB Brotli per concept; only one scene loaded on a route. |
| Startup | Import after content and first paint; first WebGL frame target < 150 ms after idle import on a mid phone. |
| Frame time | 60 fps target: average ≤ 16.7 ms, p95 ≤ 25 ms during a 4-second interaction sample. |
| GPU/CPU | DPR ≤ 1.5; no textures in spikes; no allocation in the animation loop; pause when hidden or offscreen. |
| Memory | Context + geometry target < 12 MB. Lose/dispose context on route removal. |
| Thermal/data | Disable for reduced motion, Save-Data, ≤ 2 GB device memory, ≤ 2 logical cores, low unplugged battery, failed probe or load error. |
| Layout | Canvas has reserved dimensions; CLS contribution 0. Content stays interactive while it initialises. |

Headless Chrome evidence is a regression signal, not proof of a physical mid-range phone's GPU. Before production selection, repeat the winning concept on one representative Android phone using Chrome Performance, 4× CPU test, battery/thermal observation and a throttled cold load. Select one concept for launch; shipping all three would dilute the signature and multiply cost.

## 8. Static prototype and evaluation

The Home feel study is [`design/prototype/index.html`](../design/prototype/index.html). It demonstrates:

- immutable metal RC artwork on dark;
- desktop header plus mobile menu and thumb dock;
- proposition + optional Blueprint Truss hero;
- a real Robin-owned work photograph;
- Shop/Tools and Jigs separation and explicit external-link language;
- a clearly illustrative App block with destination caveat;
- anime.js v4 entrance, reveal and menu motion with reduced-motion fallbacks.

It intentionally contains no live form, analytics, external request, prices, testimonial, app-store claim or invented product data.

## 9. Acceptance checklist for the eventual build

- Phone (390 × 844) and desktop (1440 × 900) browser passes: hierarchy, overflow, tap targets, menu, keyboard order, focus, zoom to 200%, dark/light and reduced motion.
- One primary action per page/section; grouped alternatives and honest external destinations (Hick, cognitive load, Jakob).
- Four phone high-intent destinations in the thumb zone, ≥ 44 px targets (Fitts).
- Cards, captions, filters and related actions use consistent spacing and visual grouping (Gestalt).
- RC artwork file/variant review; no CSS filters or recolouring.
- Robin-owned/approved asset record, crop/focal point, dimensions and alt text for every image.
- No external request before deliberate outbound action/consent; no autoplay.
- WebGL disabled-path tests for reduced motion, Save-Data, low resource, no WebGL and load error; content and CTA stay identical.
- Performance measurement on real representative Android hardware before choosing a launch scene.
- Content review for Irish English, metric-first presentation, legal URL preservation, and absence of unapproved safety, regulatory, price, review or credential claims.
