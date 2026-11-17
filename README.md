# Robweb

Robin Clevett’s new noindex website foundation. It is independent from ROBC: its own React/Vite public site, Express API on port 6981, MariaDB database, session/auth model and mobile-friendly admin.

The live LXC still serves the existing holding page on port 6980 through `serve.mjs` and `start.sh`. Building this repository does not cut over or restart that process.

## What is included

- Static-prerendered public routes for Home, App, Shop, Videos, About, Services, Projects, Robin Recommends, Contact, Register interest, four legal pages, stable calculator-app legal URLs and 404.
- Fixed content blocks only: Hero, Feature list, Proof, Shop CTA, App CTA, Video grid, FAQ, Contact CTA, Text and Image. Content cannot inject arbitrary HTML or script.
- Admin routes for aggregate analytics, page revisions/publish/revert, media inventory, forms inbox/CSV export, users and settings.
- Owner/editor invitations, one-time password setup, bcrypt password hashes, server-side sessions, secure same-site cookies, CSRF tokens and rate limits. There are no default credentials.
- Validated contact/interest forms with a honeypot, rate limiting, project-owned storage and optional SMTP notification. SMTP is disabled by default and sends only the inbox reference, not submitted fields.
- First-party aggregate counters with no IP field and safe `/go/shop` click logging. The client sends counters only after analytics consent while the Irish ePrivacy basis is confirmed with Ian/Paul.
- Consent-first GA4: no Google script or request before positive consent. The configured property is `G-XQNLT1H91R` unless deployment configuration changes it.
- Locked npm dependencies, unit/API tests, TypeScript checks, prerender build, sitemap, disallow-all robots policy and security headers.

## Local commands

```bash
cp .env.example .env
npm ci
npm run dev
```

`npm run dev` uses the in-memory repository and starts Vite on `127.0.0.1:6980` plus the API on `127.0.0.1:6981`. It stores no durable form/admin data. For database-backed API work, set private DB values and run `tsx watch server/index.ts` without the development script’s `REPOSITORY=memory` override.

Quality gates:

```bash
npm run typecheck
npm test
npm run inventory:check
npm run build
ROBWEB_EVIDENCE_DIR=/tmp/robweb-evidence npm run shell:check
```

The build writes prerendered HTML to `dist/` and compiled API code to `build-server/`. `npm start` starts only the API from `build-server/server/index.js`; the public production-server cut-over remains a separate reviewed task.

## Configuration

Copy `.env.example` and keep `.env` private. Production refuses `REPOSITORY=memory`; MariaDB credentials are mandatory. Store/app destinations stay absent until approved URLs are supplied. `GO_LIVE=false` and the generated/public metadata remain noindex until a separate approval changes them.

Form retention defaults to 90 days and is owner-editable. Media rows accept JPEG, PNG, WebP or AVIF, up to 10 MB, with non-empty alt text. The current source-controlled inventory remains governed by `content/assets.json`.

## One-time database setup for Ian/Paul review

No SQL has been applied. The DBA must replace the marker with a generated private value, review the host scope, then run the numbered migrations using the new least-privilege account:

```sql
CREATE DATABASE robweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'robweb'@'10.%' IDENTIFIED BY 'REPLACE_WITH_GENERATED_SECRET';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON robweb.* TO 'robweb'@'10.%';
FLUSH PRIVILEGES;
```

The same statements are in `db/setup.sql`. The canonical current schema is `db/schema.sql`; ordered changes are in `db/migrations/001_initial.sql` and `002_seed_content.sql`. Migrations are deliberately not hidden in `npm start`, build or deploy commands.

After schema review/application, create the first expiring owner link without sharing a password:

```bash
npm run admin:invite -- owner@example.com owner
```

The link is printed once, expires after 48 hours and becomes unusable after password setup. Further invitations are owner-only in `/admin/users/`.

## Privacy and operational boundaries

- Contact fields, email addresses and messages never enter analytics or UTMs.
- `/go/shop` accepts only `https://toolsandjigs.com` targets and adds stable attribution parameters.
- The shop cache is currently empty because the public Shopify feed rate-limited the single inventory request. The UI links to the authoritative store and invents no product, price or availability.
- Final legal identity/contact/processor wording and first-party cookieless measurement basis remain review items before go-live.
- Do not edit DNS, edge/TLS, `robc.co.uk`, ROBC data/auth/services, or apply SQL as part of ordinary build verification.

See `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `CLAUDE.md` and `docs/robweb-scoping-plan.md`.
