# robweb: Robin Clevett's new website

Replaces the WordPress site at robc.co.uk. Served at https://robweb.wolf.uk.com (workspace hostname; the public domain decision is Ian's). GitHub: ianwolfsoftware/robweb. Box: `wolf` LXC, `/root/robweb`.
Read `docs/robweb-scoping-plan.md` (the approved scoping plan) and this file before any change. Where this file and the plan differ, THIS FILE wins (it records Ian's later decisions).

## What Ian asked for (17 Nov 2026)
- React site with its **own ports, its own database and its own admin area**. Never share ROBC's database, auth, release scripts or services.
- **Admin** that manages the content, shows **analytics in one place** for Robin, and shows his **form responses** (contact / register-your-interest / enquiries).
- **Beautiful**, with **easy navigation**, linking to the **Tools and Jigs** shop (https://toolsandjigs.com, Robin's Shopify store). Products load on a **separate Shop page**; buying happens on Tools and Jigs (link out, canonical stays on Shopify).
- An **App page** for the RC Calculators app (metric-first; store/web links are placeholders until Ian supplies them).
- **Everything the old site had, but better** (inventory below).
- **Mobile website that is as brilliant as the desktop** (design mobile first, large tap targets, no autoplay).
- **anime.js** for transitions and playful motion; some **WebGL** for design; take **ideas** (not copies) from https://designspells.com/ to make it stunning.
- Use **Robin Clevett's own images and his YouTube videos** to add content. Only Robin's own material: robc.co.uk media library, his YouTube channel, his Instagram, Tools and Jigs product images. No stock or random web images. Record the source and rights status of every asset in `content/assets.json`.

## Stack (decided)
React + Vite + TypeScript + Tailwind; small Express API; MariaDB (own database `robweb`, own user, created by Ian/Paul after the SQL is reviewed: WRITE the schema/migrations as files, never apply them). Public pages prerendered to real HTML for SEO. Admin is a constrained section editor (fixed designed blocks, no arbitrary HTML/script injection), roles owner/editor, draft/preview/publish/revert, media limits with required alt text. Ports: web/holding page is already 6980; the API uses 6981. Check `ss -ltn` before any other port.
anime.js (v4) for motion, a small WebGL layer (three.js or ogl) lazy-loaded, never blocking content; respect `prefers-reduced-motion` and fall back gracefully on low-power phones. Performance targets: fast mobile LCP, CLS near 0.

## Analytics ("Robin sees it in one place")
1. Admin dashboard: first-party, privacy-friendly counters (no cookies, no IP stored, aggregated) for visits, pages, referrers, devices, plus **outbound clicks to Tools and Jigs** through a `/go/shop` redirect that records the source page. This fixes today's blind spot: Shopify says robc.co.uk is its top referrer but robc.co.uk has no analytics at all.
2. Consent-first GA4 (basic consent mode; no Google request before consent), with UTM-tagged shop links. The property already exists: "Robc.co.uk" 262364074 / G-XQNLT1H91R (never received data). Mark first-party-without-consent as "to confirm with Ian/Paul (Irish ePrivacy)".
3. Form responses stored in the DB, listed/exported/markable as handled in admin, with retention limits. Spam protection without third-party personal-data sending.

## Old site inventory (robc.co.uk, WordPress, 20 pages; keep or improve all)
Home ("ROBIN CLEVETT, CONSTRUCTION INDUSTRY FANATIC", bio, SHOP button, Cladding Enquiries button -> /landing/cladding.php), About (/about-robin-clevett-listed-and-new-build/), Our Services, Projects/Gallery, Robin Recommends, YouTube, Instagram, Shop (links to toolsandjigs.com), Contact (/contact-robin-clevett/), Register your interest, Calculator app (/calculator-app/ + /privacy/ + /terms/, published 26 Oct 2026, the app's store links point at these: keep the same URLs working or redirect), Privacy policy, Terms and conditions, Disclaimer, plus WooCommerce leftovers (cart, checkout, my-account: drop). Social: Facebook, Twitter/X, YouTube, Instagram, Pinterest, LinkedIn. Never break the calculator-app legal URLs.

## Rules
- Irish English, metric first. No unapproved safety/regulatory claims, reviews or prices. Do not invent testimonials or credentials.
- `noindex` until Ian says go live. No tracking before consent. No secrets in the repo.
- Do NOT touch DNS, the Hetzner edge, TLS, robc.co.uk or its hosting: Paul owns the edge (WhatsApp 17 Nov: nginx proxy to 10.0.10.118:6980 + Let's Encrypt).
- Work on a branch, one logical commit per step, never force-push. Do not deploy or restart anything unless the task says so. Show SQL inline; never apply migrations.
- Accessibility: keyboard, focus, contrast, reduced motion, alt text.
- Light and dark mode both work.
