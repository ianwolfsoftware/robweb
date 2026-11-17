# robweb.wolf.uk.com — scoping plan

## Scope and evidence

This is a plan for a separate future Rob marketing website. It authorises no DNS,
tunnel, certificate, hosting, database, account, repository, analytics,
Shopify or production changes. It must stay separate from the ROBC calculator
app until its agreed work is complete.

Prepared 17 November 2026 from read-only review of the ROBC worktree, wolf host,
public DNS/HTTPS, ROBC/reGDPR documentation and official privacy/analytics
guidance. No secret was read or copied.

### Comparable wolf.uk.com setup today

| Area | Verified observation | Implication for robweb |
| --- | --- | --- |
| Project tier | The catalog maps ROBC Calculators to wolf:/root/robc. Its live checkout is a reference, not a worker editing target. | New repository and new project directory only; never add robweb to ROBC. |
| ROBC serving | ROBC documentation records a built Vite site on port 6273, proxying an Express API on 3801. Project scripts restart the two processes and a five-minute watchdog/autostart discovers them. | Reuse the per-project, per-port supervisor pattern. A public site serves a production build, never Vite development mode. |
| Project provisioning | /root/new-site.sh detects Node web/API projects, chooses unused ports, creates project start scripts, and /root/start-all.sh auto-discovers them. | It is the approved future helper for a new wolf Node project; it does not create DNS, tunnel routes or certificates. |
| Tunnel | wolf has an active token-managed cloudflared service. ROBC documents its route as a Cloudflare Tunnel; tokens and remote ingress mappings were not inspected. | DNS/tunnel account work belongs to the account owner. Do not copy/reuse the token or assume local configuration is authoritative. |
| Public edge | On 17 November, robc.wolf.uk.com and regdpr.wolf.uk.com each resolved to 116.202.127.6 and returned HTTPS 200 with individual Let's Encrypt certificates. | Before a new route is made, the edge owner must resolve the difference between this public A-record path and the documented tunnel path. The deferred shared Nginx/load-balancer investigation is not part of this plan. |
| DNS and 20i | wolf.uk.com nameservers identify as ns[1-4].wolfsoftwaresystems.net. No inspected script/doc/config proved that 20i currently hosts the authoritative zone. | Do not make a speculative 20i change. It may be registrar/billing only; Paul must identify the real zone control plane. |
| Comparable content admin | reGDPR documents React/Vite, Express, MySQL and a self-hosted Puck editor rather than a paid hosted CMS. | A smaller version of this established pattern suits Rob/Paul if browser editing is required. |

The route discrepancy is a real deployment gate but not a reason to inspect or
change the shared public edge in this plan-only work.

## Ownership and future setup sequence

### Who does what

| Area | Agent can do in an approved implementation task | Ian must do | Paul must do |
| --- | --- | --- | --- |
| Public identity | Implement approved copy/assets and prepare a values sheet. | Approve canonical domain, positioning and launch scope. | Confirm approved company details, shop URL and operational contact route. |
| Repository | Scaffold, test and commit a separate robweb repo once access exists. | Authorise the owning GitHub organisation/account and its administrators. | Act only if appointed repository owner. |
| Container | Clone to wolf:/root/robweb, use the project helper, install locked dependencies, build and create project-only process scripts. | Approve an implementation/release task and whether an admin database is in scope. | Confirm project configuration values privately, without posting them in work items. |
| DNS, tunnel and TLS | Prepare hostname, expected local port and verification commands; verify after configuration. | Approve hostname and staging/production intent. | Use the confirmed DNS/tunnel/edge account to add the record and hostname route, and correct certificate issues. |
| Deploy | Write a project-local build/deploy/health-check script. | Approve a public release. | Trigger/observe the initial release if he is the operating owner. |
| GA4 and Shopify | Wire IDs only from private deployment configuration; never create accounts or commit credentials. | Ensure GA4 is business-owned and assign access. | Complete GA4/Shopify access and handover checks. |
| Admin handover | Build roles, invite/reset, preview/publish/revert and a non-secret guide. | Approve owner/editor and recovery roles. | Complete first sign-in and content/legal/measurement validation. |

### Exact future runbook

1. Ian confirms whether robweb.wolf.uk.com is a workspace hostname or names the
   final public domain and canonical redirect policy. Paul confirms the actual
   DNS/edge account. This prevents an untested 20i or Cloudflare action.
2. Ian or the organisation owner creates a separate private repository named
   robweb and grants least-privilege delivery access. ROBC's existing upstream
   is GitHub, so GitHub is the expected convention unless Ian chooses otherwise.
3. The agent builds and verifies the site in the repository, commits it on a
   feature branch and keeps all environment values out of source control.
4. In an authorised hosting job, the agent creates /root/robweb from the approved
   repository, installs locked dependencies, and runs /root/new-site.sh robweb
   to allocate ports and generate project-owned supervisor scripts.
5. Before first start, the agent reviews the generated scripts and configures
   them to serve the built output, such as Vite preview or the equivalent
   production server. The selected web/API ports and health endpoint go in the
   new project's CLAUDE.md. Do not run a public Vite development server.
6. Paul configures one confirmed public path: the active direct-edge record or
   the active Cloudflare Tunnel hostname mapping. The implementation record must
   name the responsible account, destination and port, but never a credential or
   tunnel token. An agent must not guess or alter shared edge configuration.
7. Paul confirms the certificate process covers the hostname. The agent then
   verifies SNI certificate name/validity, HTTPS 200, HTTP redirect if selected,
   host-header acceptance, health response and an unknown-path 404.
8. The agent adds a project-local deploy command: get approved revision; install
   locked dependencies; build; stop on build failure; restart only robweb's own
   processes; verify local and public health. Migrations, if ever required, are
   separate reviewed jobs, not hidden inside deploy.
9. The agent creates an expiring owner invitation/bootstrap command with no
   hard-coded default password. Paul consumes it privately and checks that an
   editor cannot access owner settings or other users.
10. Paul changes the temporary credential, enables an available second factor or
    recovery mechanism, verifies the owner recovery address, reviews company
    details, legal pages, contact route, shop/social/app links, creates a draft,
    previews it on phone and desktop, publishes a harmless change and confirms
    it can be reverted. Record completion only, never any credential.

## Recommended product and stack

Use a static-first React/Vite/TypeScript marketing site with Tailwind, a small
Express API, and MariaDB only when protected content administration is required.
Use a constrained Puck section editor rather than an unrestricted page builder.
This follows the ROBC/reGDPR Node pattern without introducing a paid CMS.

Public pages must be prerendered to real HTML at build/publish time. A
client-only SPA is the wrong default for a search-led trades/tools website:
heading, copy, links, images, metadata and structured data need to be in the
initial document.

- Public layer: React/Vite, TypeScript, Tailwind, static prerendering, optimised
  local images and no third-party widget by default.
- Content layer: fixed, designed blocks such as Hero, Proof, Feature List,
  Calculator CTA, Shop CTA, Video Grid, FAQ, Contact CTA and Footer. Editors
  cannot inject arbitrary script or HTML.
- Admin layer, if needed: Express routes; MariaDB pages/settings/revisions/users
  tables; owner/editor roles; invitation/reset; draft/preview/publish/revert;
  media type/size limits and required alt text.
- Operations: its own process scripts and deploy runbook. It never shares ROBC's
  database, auth, release scripts or services.

If Rob does not need browser editing at launch, defer the API/database/editor
and retain reviewed source-managed content. The public stack/SEO model stays
the same, and an editor becomes a later bounded phase.

### Information architecture

| Page | Purpose and main action |
| --- | --- |
| Home | Establish Rob's roofing/carpentry authority; direct people to calculators, Tools and Jigs, videos and contact. |
| ROBC Calculators | Explain metric-first calculator use and link to the current app/web/store destination. Do not make unapproved safety or regulatory claims. |
| Tools and Jigs | Curated introduction and outbound category/product calls to toolsandjigs.com, not a duplicate shop catalogue. |
| Videos and guides | Organise useful videos by task. Use privacy-enhanced/click-to-load embeds so they do not load before consent. |
| About Rob | Short approved biography, credentials and rights-cleared work/process images. |
| Projects / examples | Small, updateable proof library; only Rob-approved projects, locations and testimonials. |
| Contact | Clear contact route, approved phone/email and a minimal spam-protected form only if required. |
| Legal | Privacy Notice, Cookie Notice/preferences, Terms/site-use, accessibility/contact route; keep admin and previews noindex. |

Use Irish English and plain trade language. Millimetres/metres are the default;
imperial equivalents are labelled optional/secondary. Give mobile visitors one
primary action at a time, large tap targets, readable imagery and no autoplay.

### SEO and performance baseline

- Every indexable page gets a unique title, meta description, canonical, social
  card, H1 and meaningful image alt text.
- Generate sitemap.xml and robots.txt; block admin, preview, API and internal
  query routes. Provide a proper HTML 404.
- Use restrained, truthful JSON-LD for Organization or Person, WebSite,
  BreadcrumbList and genuine FAQs. Do not invent LocalBusiness, reviews,
  product prices or FAQ answers.
- Use descriptive internal links and an approved redirect map if any old URL is
  replaced. Do not replace robc.co.uk without a separate migration decision.
- Deliver sized responsive AVIF/WebP images, lazy-load non-critical media, use a
  small font/system stack and target fast mobile LCP/CLS.
- Keep Shopify product pages canonical on Shopify; the marketing site describes
  benefits and links out rather than duplicating thin product content.

## Consent and analytics for the new site

This is an Irish-company plan, not legal advice. The Irish Data Protection
Commission says consent is normally required for non-essential cookies/similar
tracking and it must be a clear, informed affirmative act. Analytics is off by
default.

Launch with **basic Google Consent Mode**:

1. First visit loads only essential site code and the required preference record.
   Present equally prominent Accept analytics and Reject non-essential choices,
   plus a persistent Preferences route. No pre-ticked switches, scroll consent
   or implied consent.
2. Before any Google code runs, set analytics_storage, ad_storage, ad_user_data
   and ad_personalization to denied. Do not run Ads/remarketing at launch.
3. Do not load GTM or the Google tag until positive analytics consent. This
   deliberately sends no Google measurement request before consent.
4. On acceptance, inject one controlled GA4 tag and update analytics_storage.
   On withdrawal, disable future tracking, remove GA cookies where possible and
   keep only the required consent-preference record.
5. Publish a Cookie Notice naming provider, purpose, choice, expiry and
   withdrawal method. Review the Privacy Notice against final fields,
   recipients, processors and retention before launch.

Advanced Consent Mode can send cookieless pings before acceptance. Do not select
it merely to improve reporting: it needs a documented legal/privacy decision.

### GA4 configuration and event dictionary

- Ian/Rob creates one dedicated business-owned GA4 property/web stream for the
  final hostname. Measurement ID lives in private deployment configuration, not
  source. Paul gets only necessary access; a recovery owner is documented.
- Use exactly one tagging method: one Google tag or one GTM container, not both.
  For client-side route changes set send_page_view false and emit one
  consent-gated page_view with query strings stripped.
- Leave Google signals, advertising features and user-provided-data features
  off until a separate approved decision. Never send names, email, phone,
  message text, address, persistent customer IDs or query strings to GA4.
- Retain Enhanced Measurement only for events not manually sent, avoiding
  duplicate automatic/manual scroll, outbound or form events.

| Event | When | Safe parameters | Key event |
| --- | --- | --- | --- |
| page_view | Initial page and route change after consent | page path/title/content group, no query string | No |
| shop_click | Tools and Jigs CTA | placement; destination: tools_and_jigs | Yes |
| app_click | Calculator/app CTA | placement; destination: robc_app | Yes |
| video_click | Visitor opens a video | topic/video slug; placement | No |
| generate_lead | Contact form succeeds | form_name; non-identifying outcome | Yes |
| contact_click | Phone/approved email link | contact_type; placement | Optional |

Test one consenting browser in DebugView and Realtime before launch, then store
a dated baseline of property owner, stream, event dictionary and key events.
Consent refusal is not a tracking failure.

### Shopify attribution and verification

All robweb-to-Shopify links use stable, lower-case UTMs. Example:

    utm_source=robweb
    utm_medium=referral
    utm_campaign=tools_and_jigs
    utm_content=home_hero

Use the same source/medium/campaign registry everywhere, with content values
such as header, home_hero, calculators_page, video_page and footer. Never place
a name, email, enquiry text or other personal data in a UTM. Do not introduce a
redirector unless it preserves UTMs and referrer.

This supplies two independent signals:

1. GA4 records a consented robweb shop_click by placement.
2. Shopify receives the browser referrer plus UTMs. Paul checks Shopify
   Analytics > Reports > Acquisition > Sessions by referrer and Marketing
   reports, grouping/filtering UTM source, medium and campaign. For an order,
   Shopify conversion details can show session referral and UTM information.

Reconcile, do not expect equality: consent, privacy controls, cross-device
activity, session expiry and different attribution models create valid gaps. The
acceptance test is a consenting test click carrying a unique content value, then
visible GA4 event plus Shopify session/referrer/UTM evidence. Do not create test
orders or customer records for this plan.

### Existing robc.co.uk tracking diagnosis — read-only checks

No GA4 login was used. A public-source check on 17 November found no Google tag
ID, GTM ID, googletagmanager host or google-analytics host in initial
robc.co.uk HTML; only a generic cookie marker appeared. That is a clue, not a
diagnosis: a WordPress plugin, consent tool, cache or delayed script can change
what a browser loads.

The separate browser/GA4 rundown should record, without changing settings:

1. In a clean profile, inspect View Source and DevTools Network on home, a
   standard page/post, contact and any key template. Filter gtag, GTM,
   googletagmanager and google-analytics. Record every measurement/container ID
   and whether it appears exactly once on all templates.
2. Before consent, check Network and browser cookies for GA/GTM requests and
   _ga values. Accept analytics and repeat. This distinguishes correct gating,
   a banner that never updates, firing too early and never firing.
3. Use Tag Assistant Preview on representative pages: Tags Fired/Not Fired,
   duplicate tags, consent default before the tag, consent update after choice,
   and CMP trigger/exception blocking.
4. In GA4 Admin, compare observed IDs to the intended web-stream ID and URL.
   Check selected property, stream typo/inactivity, data filters and timezone.
5. With the same consenting browser, check Realtime and DebugView for page_view.
   If a request exists but no event does, record status/ID mismatch; if no
   request exists, return to trigger/consent/CSP diagnosis. Do not edit GA4.
6. If GTM exists, compare page container to the published container/version and
   check wrong environment, unpublished changes, page-only triggers, consent
   exceptions and a second hard-coded tag.
7. Check console/response headers for CSP, mixed-content and script-block errors;
   repeat once without an ad blocker as a diagnostic control.
8. In Shopify, inspect matching date ranges, human/bot filters and the exact
   robc.co.uk referrer-domain value. “Largest referrer” remains a Shopify
   observation until GA4 outbound measurement is independently proven.

## Risks and open questions

| Item | Why it matters | Resolution |
| --- | --- | --- |
| Hostname route ambiguity | Existing docs mention a tunnel; public DNS/TLS exposes a shared direct edge. Guessing risks a wrong route/certificate. | Paul identifies owner and approved pattern before DNS/tunnel work. |
| 20i role not evidenced | A registrar panel cannot update a zone it does not host. | Paul confirms whether 20i is registrar-only or DNS control plane. |
| Canonical identity | robweb.wolf.uk.com might be staging, not the customer domain. | Ian chooses public hostname and relation to robc.co.uk. |
| Editor scope | Browser editor adds database/auth/security work; source content does not give live editing. | Ian selects launch editor requirement. |
| Legal facts | Legal entity, privacy contact, retention and processor wording cannot be guessed. | Paul supplies facts; Ian approves publication. |
| Assets/claims | Work imagery, testimonials and building-regulation statements need approval. | Rob/Paul approve assets and claims. |
| Measurement ownership | Personal GA4 access makes handover fragile. | Ian/Rob names business owner; Paul verifies access/recovery. |
| Attribution limits | Referrers and GA4 consent are not complete purchase attribution. | Use the two-signal reconciliation plan. |
| Lead handling | A form creates personal-data/inbox/retention duties. | Decide form vs direct contact and named recipient. |

Questions for Ian:

1. Is robweb.wolf.uk.com a workspace hostname, and what is the eventual public
   domain/canonical relationship to robc.co.uk?
2. Is live visual editing required at launch or can content stay source-managed?
3. Who owns GA4 and what access/recovery roles should Ian/Paul/Rob hold?
4. Which legal identity, contact route, privacy contact and retention wording are
   approved for publication?
5. Which calculator/app destinations, Shopify collections/products, profiles,
   videos, images, projects and testimonials are approved?
6. Is a contact form in scope; if so, what is the minimal field set and owner?
7. Can Paul confirm the live DNS/edge account and whether 20i is involved?

## Small-job build order and estimate

Estimate: 9–12 focused 60–90 minute sessions, plus 2–4 sessions for approved
copy, images and legal/business answers. DNS/tunnel/TLS, GA4 ownership and first
login are explicit owner checkpoints, not background agent work.

1. **Identity and content inventory** — approved domain role, audiences, pages,
   app/shop links, assets and legal facts. Acceptance: a values sheet with no
   publishable placeholder, personal data or unverified claim.
2. **Repository and scaffold** — isolated robweb repo; locked dependencies and
   build/type/test commands. Acceptance: clean first commit and repeatable build.
3. **Design system and structure** — responsive metric-first components,
   navigation and content schema. Acceptance: approved shell with no tracking.
4. **Home and conversion paths** — home/global nav/app/shop CTAs. Acceptance:
   keyboard/phone/desktop checks and visible temporary-link handling.
5. **Calculators, shop, video and about** — main decision pages. Acceptance:
   semantic heading structure, metadata and one clear action per page.
6. **Projects, contact and legal** — approved proof, contact flow and policy
   routes. Acceptance: no unnecessary third-party personal-data sending.
7. **Content admin or explicit deferral** — roles, draft/preview/publish/revert
   and invitation if selected. Acceptance: editor cannot reach owner controls.
8. **Prerender and SEO** — sitemap, robots, canonicals, structured data and
   redirects. Acceptance: representative view-source/curl shows real HTML.
9. **Consent and GA4** — basic-consent banner, preferences, event dictionary and
   UTM registry. Acceptance: no Google request before refusal; one post-consent
   event flow in DebugView.
10. **Wolf provisioning** — separate checkout, helper-generated project scripts
    and production build. Acceptance: project-only local health; ROBC untouched.
11. **Hostname/TLS validation** — Paul configures confirmed route; agent checks
    public endpoint. Acceptance: certificate, HTTPS, redirect, host, health and
    404 checks pass.
12. **Content/accessibility/release QA** — phone/desktop, keyboard, SEO,
    consent, GA4 and Shopify UTM/referrer tests. Acceptance: dated release
    report and defects-only list.
13. **Paul handover/baseline** — first login, recovery, publish/revert and
    GA4/Shopify access. Acceptance: owner confirms control without sharing a
    credential and receives a non-secret guide.

## References

- [Irish Data Protection Commission — cookies/tracking guidance](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies)
- [Google Analytics — set up consent mode](https://support.google.com/analytics/answer/14009635) and [troubleshoot consent mode](https://support.google.com/analytics/answer/14522438)
- [Google Analytics for Developers — GA4 events](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Shopify acquisition reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/acquisition-reports), [marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports) and [order conversion summary](https://help.shopify.com/en/manual/fulfillment/managing-orders/analytics/conversion-summary)
