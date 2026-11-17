# Robweb source inventory

Prepared 17 November 2026 from the public `robc.co.uk` sitemap, visible page
markup, YouTube's public RSS/oEmbed endpoints, and the public Tools and Jigs
storefront. This is a source inventory, not a migration or a release. No
production route, DNS, edge setting, database or third-party account changed.

## Collection record

- Sitemap: `https://robc.co.uk/wp-sitemap-posts-page-1.xml` (20 entries).
- Extra requested landing page: `https://robc.co.uk/landing/cladding.php`.
- The crawler used a normal browser user agent, a 0.75-second delay between
  requests, stored no raw HTML and redacted contact identifiers from markdown.
- `robots.txt` excluded `/privacy-policy-2/` under `Disallow: /privacy-policy`
  and `/disclaimer/` under `Disallow: */disclaimer/*`. Those pages have a
  transparent retrieval note rather than scraped copy.
- `content/pages/` contains 21 records (the sitemap plus cladding); all
  fetched records retain source URL, sitemap last-modified value, title, meta
  description, cleaned copy, links and image references.
- `content/assets.json` contains 128 unique image references. 111 Robin-owned
  on-site assets were copied to `assets/source/` (28,339,548 bytes, below the
  150 MiB cap); 17 third-party/plugin/YouTube thumbnail references remain
  metadata-only and are marked `needs-approval`.
- Instagram was not scraped: `content/instagram.json` contains only the public
  profile URL linked from the old site.

## Page decisions

| Old URL | Evidence file | Decision | Reason |
| --- | --- | --- | --- |
| `/` | `content/pages/home.md` | Improve | Keep Robin's construction/craft story, but give calculators, videos, shop and contact clear primary paths. |
| `/projects/` | `content/pages/projects.md` | Keep and improve | Strong proof imagery; turn the long legacy gallery into curated, dated project stories with approved captions. |
| `/about-robin-clevett-listed-and-new-build/` | `content/pages/about-robin-clevett-listed-and-new-build.md` | Keep | Maps cleanly to the planned About Rob page. |
| `/our-services/` | `content/pages/our-services.md` | Keep and improve | Retain service intent but use concise current copy and clear enquiries. |
| `/contact-robin-clevett/` | `content/pages/contact-robin-clevett.md` | Keep and improve | A basic contact form exists; rebuild it with validated, consent-aware handling and an approved recipient/retention policy. |
| `/disclaimer/` | `content/pages/disclaimer.md` | Keep, manual source required | Robots prevented copying the legacy text; get a first-party export before publishing its successor. |
| `/terms-and-conditions/` | `content/pages/terms-and-conditions.md` | Merge | Legacy 2013 terms should be reconciled with the newer terms route into one reviewed legal page. |
| `/youtube/` | `content/pages/youtube.md`, `content/videos.json` | Keep and improve | Public channel gallery is valuable; the new page should use the recorded channel feed and click-to-load embeds. |
| `/instagram/` | `content/pages/instagram.md`, `content/instagram.json` | Merge | Keep the profile link in a social follow block; no separate content page is needed. |
| `/robin-recommends/` | `content/pages/robin-recommends.md` | Merge | Fold useful recommendations into guides/videos after Robin confirms current recommendations and affiliate disclosures. |
| `/shop/` | `content/pages/shop.md` | Merge | Replace legacy WooCommerce copy with a Tools and Jigs introduction and outbound product/category links. |
| `/cart/` | `content/pages/cart.md` | Drop | Do not recreate the old on-site cart; send visitors to Tools and Jigs. |
| `/checkout/` | `content/pages/checkout.md` | Drop | Do not recreate the old checkout; send visitors to Tools and Jigs. |
| `/my-account/` | `content/pages/my-account.md` | Drop | Store accounts belong to Tools and Jigs, not Robweb. |
| `/privacy-policy-2/` | `content/pages/privacy-policy-2.md` | Keep, manual source required | Robots prevented copying the current text; publish a reviewed Robweb privacy notice, not an inferred rewrite. |
| `/terms-conditions/` | `content/pages/terms-conditions.md` | Merge | Duplicate legal destination; consolidate with the terms above after legal review. |
| `/register-your-interest/` | `content/pages/register-your-interest.md` | Merge | Fold into Contact/Register-interest form only if the purpose, recipient and retention terms are approved. |
| `/calculator-app/` | `content/pages/calculator-app.md` | Keep exactly | Published app page; preserve the URL and enhance the app/store call-to-action only after its destination is confirmed. |
| `/calculator-app/privacy/` | `content/pages/calculator-app-privacy.md` | Keep exactly | Store-linked app privacy URL: must continue to resolve at the identical path. |
| `/calculator-app/terms/` | `content/pages/calculator-app-terms.md` | Keep exactly | Store-linked app terms URL: must continue to resolve at the identical path. |
| `/landing/cladding.php` | `content/pages/landing-cladding-php.md` | Keep and improve | A live cladding-enquiry campaign. Rebuild as an approved `/cladding-enquiries` flow and verify claims, delivery and consent wording. |

## Proposed old-to-new URL map

This map is a build input only. Do not configure redirects on `robc.co.uk`
unless a separate domain-migration decision authorises it. In particular, the
three calculator-app paths are deliberately unchanged.

| Old path | Proposed Robweb path / destination | Treatment |
| --- | --- | --- |
| `/` | `/` | Serve improved home. |
| `/projects/` | `/projects/` | Preserve project proof. |
| `/about-robin-clevett-listed-and-new-build/` | `/about/` | Shorter About Rob route. |
| `/our-services/` | `/services/` | Current services copy. |
| `/contact-robin-clevett/` | `/contact/` | Approved enquiry flow. |
| `/disclaimer/` | `/disclaimer/` | Only after source/legal review. |
| `/terms-and-conditions/` | `/terms/` | Merge duplicate legal copy. |
| `/youtube/` | `/videos/` | Channel/video hub. |
| `/instagram/` | `/about/#follow` | Social profile link, not a duplicate page. |
| `/robin-recommends/` | `/videos/#recommended` | Merge with approved guides/recommendations. |
| `/shop/` | `/tools-and-jigs/` | External-shop introduction. |
| `/cart/` | `https://toolsandjigs.com/` | Remove legacy WooCommerce cart. |
| `/checkout/` | `https://toolsandjigs.com/` | Remove legacy WooCommerce checkout. |
| `/my-account/` | `https://toolsandjigs.com/` | Store account remains on Shopify. |
| `/privacy-policy-2/` | `/privacy/` | Reviewed Robweb policy. |
| `/terms-conditions/` | `/terms/` | Merge duplicate legal copy. |
| `/register-your-interest/` | `/contact/#register-interest` | Merge if approved. |
| `/calculator-app/` | `/calculator-app/` | Identical, non-negotiable app URL. |
| `/calculator-app/privacy/` | `/calculator-app/privacy/` | Identical, non-negotiable app URL. |
| `/calculator-app/terms/` | `/calculator-app/terms/` | Identical, non-negotiable app URL. |
| `/landing/cladding.php` | `/cladding-enquiries/` | Replace legacy PHP form after approval. |

## Video and social inventory

The old YouTube page identifies channel `UCrgxh4FbbI4j0prD_KkIqfA`.
`content/videos.json` contains the 15 entries available in the public channel
RSS feed at collection time. Titles were independently taken from YouTube
oEmbed (15/15 successful); no videos were downloaded. The old gallery showed a
much larger paginated archive, so the RSS data is the current feed, not proof
of an exhaustive historical archive.

The only Instagram record is the linked profile URL
`https://www.instagram.com/robinclevett`; no posts, comments, followers or
other profile data were collected.

## Tools and Jigs inventory

### Current catalogue snapshot (17 November 2026)

The simplified Products + App candidate refreshed `content/shop-products.json` directly from the public key-free Shopify feed. It contains 11 products and only title, handle, GBP price, Shopify CDN image URLs, HTML-stripped short description, availability and canonical Tools & Jigs URL. Runtime fetching uses a 15-minute cache, polite user agent and timeout; the snapshot remains available when Shopify is unavailable. The historical collection attempt below explains the earlier empty cache and is no longer the current catalogue state.

The public `https://toolsandjigs.com/` storefront returned HTTP 200. The
task-supplied Shopify hostname `cf7084-4.myshopify.com` publicly resolves via
`shops.myshopify.com`, confirming the Shopify store association. The single
public request to `/products.json?limit=250` returned HTTP 429 with
`Retry-After: 60`; it was not retried or bypassed. To avoid working around that
rate limit, the collections endpoint was not requested afterwards.

`content/shop-products.json` and `content/shop-collections.json` preserve that
state with empty arrays rather than inventing product data. Safe follow-ups are
a read-only Storefront API token supplied by Robin, or an approved manual
Shopify CSV/export feed.

## Gaps and weaknesses to address

- **No measurable public analytics evidence:** the approved scoping review's
  public-source check found no Google tag, GTM identifier or Google analytics
  host in the initial old-site HTML. Treat this as a public observation rather
  than an account diagnosis.
- **Weak conversion paths:** the home page has biography copy but no extracted
  primary calculator, video, shop or contact action. The calculator page only
  exposes its legal links in server-rendered copy, so its store/web destination
  must be confirmed.
- **Dated or duplicate content:** the sitemap shows 2013 terms/disclaimer,
  2014 project imagery, duplicate terms URLs and legacy WooCommerce account,
  cart and checkout pages.
- **Legal source unavailable to this crawl:** `robots.txt` blocks the old
  disclaimer and privacy-policy route; they need a first-party export and
  review, not copied/inferred text.
- **Shop catalogue unavailable:** Shopify's public JSON rate-limited this run;
  product, price, tag, availability and collection details are deliberately
  absent until an approved feed is provided.
- **Cladding campaign needs modernisation:** its standalone PHP form asks for
  enquiries and uses email verification. Its pricing, stock, delivery,
  technical and consent statements must be re-approved before transfer.
- **Bounded link checks:** `stocktrack.php`, checkout and contact all returned
  HTTP 200; Tools and Jigs' public root returned HTTP 200. No HTTP-broken link
  was found in that small set. However, project/terms content exposes
  `#respond` and WordPress-login comment artefacts, which are irrelevant and
  should not be recreated.

## Questions for Ian and Robin

1. Please provide a first-party export or approved text for the old disclaimer
   and privacy policy, then confirm which Robweb legal pages supersede them.
2. Which current App Store, Play Store and/or web calculator destinations
   should `/calculator-app/` promote while preserving its three published URLs?
3. May each downloaded image be republished on Robweb, and which project
   images/captions should lead the public gallery?
4. Can Robin supply a read-only Storefront API token or approved product and
   collection export for Tools and Jigs?
5. Which current recommendations, affiliate disclosures and historic YouTube
   videos should appear beyond the RSS feed's latest 15 entries?
6. Is cladding still offered, with the stated stock lengths, delivery coverage
   and YouTube-subscriber pricing? Who receives those enquiries and what is the
   approved retention period?
7. Which legal entity, contact recipient and consent wording are approved for
   the contact/register-interest forms?
8. Is `robweb.wolf.uk.com` only a workspace hostname, and what is the final
   canonical domain/relationship to `robc.co.uk`?
