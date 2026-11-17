# Robweb architecture

## Boundaries

Robweb is one repository but two runtime processes:

```text
browser
  ├─ :6980 static prerendered React site (holding server remains until cut-over)
  └─ :6981 Express API
       └─ robweb MariaDB database (never ROBC)
```

The web build does not require the API to render its public headings, copy, links or navigation. Every route in `src/content.ts` is rendered by `scripts/prerender.tsx` into route-specific HTML. JavaScript hydrates forms, theme, consent, admin and progressive motion afterward.

## Public site

`src/site.tsx` owns semantic route layouts; `src/content.ts` is the route/metadata registry. The current source-led photographs/videos remain local, and every outbound shop click uses the API redirect so only aggregate source-path counts are stored.

`MotionPage` lazy-loads anime.js after hydration. It does not run under reduced motion. `WebglSlot` reserves its dimensions, waits for intersection, checks reduced-motion and Save-Data, then imports a tiny non-critical WebGL module. Text and actions exist before it and remain identical if WebGL fails.

GA4 is not present in the initial document. `ConsentBanner` creates the Google script only after an explicit Accept action. Reject is equally available, and preferences can be reopened. First-party visits are currently also consent-gated; the unresolved Irish ePrivacy decision is therefore conservative rather than silently assuming an exemption.

## API and privacy

`server/app.ts` is dependency-injected: tests pass `InMemoryRepository`; production uses `MariaDbRepository`. The production config rejects the in-memory repository. Express applies Helmet, a 32 KB JSON limit, route-specific rate limits and allow-listed validation before storage.

Analytics rows contain only UTC day, path, referrer hostname, device class and count. No repository method accepts an IP address, user agent, query string, form value or persistent visitor ID. Outbound rows contain day, source path, Tools and Jigs target and count.

Form submission fields are validated and size-limited. The honeypot must be empty. SMTP is off unless explicitly configured; when enabled it sends only the form type/reference and directs an authorised user to the admin inbox.

## Authentication and authorisation

There is no seeded account or password. A one-time invitation stores only a SHA-256 token digest. Passwords use bcrypt; session cookies are HTTP-only, Strict SameSite and Secure in production. The random raw session token is stored only in the cookie; the database receives its digest. Each session has a separate CSRF token required for mutations.

Editors can read analytics, pages, media and forms and can handle content/form work. Only owners can invite users or change retention/settings. Invitation links expire in 48 hours and are invalidated after use.

## Content and revisions

Page sections use an ENUM allow-list and JSON object data. The API separately validates the same block names and primitive data values. It cannot accept arbitrary HTML, script, event attributes or a new block type.

Saving creates a draft revision. Publish records the exact structured section snapshot and marks that revision published. Revert restores an earlier structured snapshot into a new draft; it never erases history. Media schema limits types and bytes and requires alt text.

## Database changes

`db/schema.sql` describes the current full schema. `db/migrations/` is ordered and reviewable. No server startup or build command executes DDL. One-time account/database SQL is in `db/setup.sql` and README for Ian/Paul review.

Tables:

- `users`, `user_invitations`, `sessions`
- `pages`, `sections`, `page_revisions`, `media`, `settings`
- `form_submissions`
- `analytics_daily`, `outbound_clicks`

The DB user is scoped to `robweb.*`; no ROBC database name, connection, session or service is referenced.

## Testing and release boundary

Vitest/Supertest covers form validation/honeypot/consent, password invitation/session/CSRF, analytics aggregation/no-IP shape, allow-listed shop redirects and schema-file parsing. The browser check loads every public route at desktop plus the Shop route on phone, verifies prerendered headings, noindex, keyboard focus, tap size and no unsolicited external request.

`serve.mjs` and `start.sh` deliberately keep serving `public/` on 6980 until a reviewed cut-over task changes the runtime. This candidate adds no deployment, process restart, DNS/edge/TLS action or database mutation.
