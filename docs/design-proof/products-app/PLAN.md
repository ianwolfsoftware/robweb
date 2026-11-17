# Products + App simplification proof plan

Task: `d9367c5f-c535-4579-8637-a11745acdee7`
Prepared: 17 November 2026

## Scope

The public site has four primary routes: Home, Shop, App and Contact. Legal pages, all three stable calculator-app URLs and 404 remain. Work, Videos, Services, Robin Recommends, About, Register interest and historic shop aliases are absent from navigation and content bands; their URLs return a permanent redirect from the shared source/production map.

Shop renders the current 11-product Shopify snapshot before JavaScript and progressively refreshes from the same-origin API. Product cards preserve feed title, GBP price, availability, descriptions and canonical Tools & Jigs destinations. Home uses three signature products from that same catalogue and immediately presents the app, shop and contact routes. App uses the V3 light/dark screens with approved pricing and clearly unavailable store controls.

## Proof matrix

Capture every remaining page at exactly:

- 390 × 844, dark;
- 390 × 844, light;
- 1440 × 900, dark;
- 1440 × 900, light.

The 12-page route set is Home, Shop, App, Contact, Privacy, Terms, Disclaimer, Cookies, Calculator App, Calculator Privacy, Calculator Terms and 404: 48 full-page PNGs total.

In addition to visual review, the automated proof must assert the four-link desktop/phone navigation, real RC logos, one prerendered H1, noindex, no overflow or empty bands, 11 product cards and tracked links, app prices/screens, permanent legacy redirects, reduced sitemap, real 404, reduced-motion fallback, keyboard focus, phone target sizes, local LCP/CLS and zero unsolicited external origins.

## Review standard

Review top-of-page contact sheets and representative full pages in all four viewport/theme combinations. Check hierarchy, typography, product image crops, two-image cards, app-screen readability, legal-page measure, form layout, footer/social restraint and the absence of blank bands or internal inventory language. Local performance is regression evidence, not a public field claim.
