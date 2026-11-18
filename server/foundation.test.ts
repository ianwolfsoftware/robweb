import { readFile } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, hashToken } from './app.js';
import { loadConfig } from './config.js';
import { InMemoryRepository } from './repository.js';
import { ShopifyCatalogue } from './shopify.js';
import { mediaFeedParsers } from './media-feeds.js';
import { claddingFormSchema, mediaFormSchema, publicFormSchema } from './validation.js';

const config = loadConfig({
  NODE_ENV: 'test', REPOSITORY: 'memory', PUBLIC_ORIGIN: 'http://localhost:6980', API_PORT: '6981',
  GO_LIVE: 'false', DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_NAME: 'robweb', DB_USER: 'robweb', DB_PASSWORD: '',
  SESSION_DAYS: '7', FORM_RETENTION_DAYS: '90', NOTIFICATION_TRANSPORT: 'disabled', SMTP_HOST: '', SMTP_PORT: '587',
  SMTP_USER: '', SMTP_PASSWORD: '', FORM_NOTIFICATION_TO: '', GA_MEASUREMENT_ID: 'G-XQNLT1H91R',
});
const notifications = { async formReceived() {} };

describe('public form validation', () => {
  it('accepts the minimal consented form and rejects a honeypot or missing consent', () => {
    expect(publicFormSchema.safeParse({ name: 'Test Person', email: 'test@example.invalid', message: 'A synthetic test message.', consent: true, website: '' }).success).toBe(true);
    expect(publicFormSchema.safeParse({ name: 'Test Person', email: 'test@example.invalid', message: 'A synthetic test message.', consent: false, website: '' }).success).toBe(false);
    expect(publicFormSchema.safeParse({ name: 'Bot', email: 'bot@example.invalid', message: 'Spam', consent: true, website: 'https://spam.invalid' }).success).toBe(false);
  });

  it('requires the brief fields for media and cladding enquiries', () => {
    expect(mediaFormSchema.safeParse({ name: 'Producer', email: 'producer@example.invalid', enquiryType: 'Interview or podcast', subject: 'December programme', message: 'Please tell us about your current work.', consent: true, website: '' }).success).toBe(true);
    expect(mediaFormSchema.safeParse({ name: 'Producer', email: 'producer@example.invalid', message: 'No brief fields', consent: true, website: '' }).success).toBe(false);
    expect(claddingFormSchema.safeParse({ claddingRef: 'Shadow gap profile', squareMetres: '48', leadTime: 'Six weeks', ukLocation: 'Bristol BS1', name: 'Synthetic Buyer', email: 'buyer@example.invalid', phone: '07000000000', message: '', consent: true, website: '' }).success).toBe(true);
    expect(claddingFormSchema.safeParse({ claddingRef: 'Profile', squareMetres: '48', leadTime: 'Soon', ukLocation: 'Bristol', name: 'Bot', email: 'bot@example.invalid', phone: '07000000000', message: '', consent: true, website: 'spam' }).success).toBe(false);
  });

  it('stores both new enquiry types in Robweb and returns reference numbers', async () => {
    const repository = new InMemoryRepository();
    const app = createApp({ repository, config, notifications });
    const media = await request(app).post('/api/forms/media').send({ name: 'Producer', email: 'producer@example.invalid', phone: '', organisation: 'Example Radio', enquiryType: 'Press or media', deadline: '', subject: 'A synthetic brief', message: 'A synthetic message for test coverage.', consent: true, website: '' }).expect(201);
    const cladding = await request(app).post('/api/forms/cladding').send({ claddingRef: 'Profile A', squareMetres: '32', leadTime: 'Eight weeks', ukLocation: 'Leeds LS1', name: 'Synthetic Buyer', email: 'buyer@example.invalid', phone: '07000000000', message: '', consent: true, website: '' }).expect(201);
    expect(media.body.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(cladding.body.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(repository.forms.map((row) => row.type).sort()).toEqual(['cladding', 'media']);
  });
});

describe('hourly media feed parsing', () => {
  it('reads YouTube entries and Fix Radio podcast enclosures without executing feed markup', () => {
    const youtube = mediaFeedParsers.parseYoutube('<feed><entry><yt:videoId>abc_123</yt:videoId><title>Clean &amp; square</title><published>2026-11-18T09:00:00Z</published><media:thumbnail url="https://i.ytimg.com/vi/abc_123/hqdefault.jpg" /></entry></feed>');
    const podcast = mediaFeedParsers.parsePodcast('<rss><channel><item><guid>https://api.spreaker.com/episode/123456</guid><title><![CDATA[The latest show]]></title><link>https://www.spreaker.com/episode/123456</link><pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Useful <b>trade</b> talk.</p>]]></description><enclosure url="https://cdn.example.invalid/episode.mp3" type="audio/mpeg"/><itunes:duration>42:03</itunes:duration></item></channel></rss>');
    expect(youtube[0]).toMatchObject({ key: 'abc_123', title: 'Clean & square', kind: 'youtube' });
    expect(podcast[0]).toMatchObject({ key: '123456', title: 'The latest show', audioUrl: 'https://cdn.example.invalid/episode.mp3', duration: '42:03', description: 'Useful trade talk.' });
  });
});

describe('content controls and partners', () => {
  it('persists pin, hide, order and partner edits in the isolated repository', async () => {
    const repository = new InMemoryRepository();
    await repository.upsertContentControl('youtube', 'abc_123', { hidden: true, pinned: false, position: 20 }, 'owner');
    await repository.upsertContentControl('youtube', 'abc_123', { hidden: false, pinned: true, position: 1 }, 'owner');
    expect(await repository.listContentControls()).toEqual([expect.objectContaining({ kind: 'youtube', key: 'abc_123', hidden: false, pinned: true, position: 1 })]);
    await repository.savePartner({ id: 'test-partner', name: 'Test Partner', url: 'https://example.invalid/', logoPath: null, evidenceUrl: 'https://example.invalid/evidence', position: 5, active: true }, 'owner');
    expect((await repository.listPartners())[0]).toMatchObject({ id: 'test-partner', position: 5, active: true });
  });
});

describe('analytics aggregation and outbound redirect', () => {
  it('aggregates only day/path/referrer/device and counts safe shop redirects', async () => {
    const repository = new InMemoryRepository();
    await repository.recordVisit({ day: '2026-11-17', path: '/videos/', referrerHost: 'direct', deviceClass: 'phone' });
    await repository.recordVisit({ day: '2026-11-17', path: '/videos/', referrerHost: 'direct', deviceClass: 'phone' });
    const app = createApp({ repository, config, notifications });
    const redirect = await request(app).get('/go/shop?product=robangle&source=%2Fshop%2Fproduct%2F&target=https%3A%2F%2Fevil.invalid%2Fcollect').expect(302);
    expect(redirect.headers.location).toMatch(/^https:\/\/toolsandjigs\.com\/products\/robangle/);
    expect(redirect.headers.location).toContain('utm_source=robweb');
    const snapshot = await repository.dashboard();
    expect(snapshot.visits).toBe(2);
    expect(snapshot.topPages).toEqual([{ label: '/videos/', count: 2 }]);
    expect(snapshot.outbound).toEqual([{ label: '/shop/product/', count: 1 }]);
    expect([...repository.visits.values()][0]).not.toHaveProperty('ip');
  });
});

describe('Shopify catalogue', () => {
  it('sanitises the public feed and holds the result in the 15-minute in-memory cache', async () => {
    let requests = 0;
    const fetcher = (async () => {
      requests += 1;
      return new Response(JSON.stringify({ products: [{
        title: 'Test Jig', handle: 'test-jig', body_html: '<p>Useful &amp; exact.</p><script>bad()</script>',
        variants: [{ price: '24.99', available: true }], images: [{ src: 'https://cdn.shopify.com/test.jpg' }],
      }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    const catalogue = new ShopifyCatalogue('', fetcher);
    const first = await catalogue.get();
    const second = await catalogue.get();
    expect(requests).toBe(1);
    expect(second).toBe(first);
    expect(first.source).toBe('shopify-public-feed');
    expect(first.products[0]).toMatchObject({ title: 'Test Jig', price: '24.99', currency: 'GBP', shortDescription: 'Useful & exact.', available: true });
  });
});

describe('invitation auth', () => {
  it('sets a password once, creates a secure-cookie session and enforces CSRF', async () => {
    const repository = new InMemoryRepository();
    const token = 'a'.repeat(48);
    await repository.createInvitation('owner@example.invalid', 'owner', hashToken(token), new Date(Date.now() + 60_000).toISOString());
    const agent = request.agent(createApp({ repository, config, notifications }));
    const activated = await agent.post('/api/auth/set-password').send({ token, password: 'LongSyntheticPassword42' }).expect(200);
    expect(activated.body.user).not.toHaveProperty('passwordHash');
    expect(activated.headers['set-cookie'][0]).toContain('HttpOnly');
    await agent.get('/api/admin/users').expect(200);
    await agent.put('/api/admin/settings').send({ form_retention_days: 30 }).expect(403);
    await agent.put('/api/admin/settings').set('x-csrf-token', activated.body.csrfToken).send({ form_retention_days: 30 }).expect(204);
    await agent.put('/api/admin/content/partner/hazardco').set('x-csrf-token', activated.body.csrfToken).send({ hidden: false, pinned: true, position: 0 }).expect(200);
    expect(await repository.listContentControls()).toEqual([expect.objectContaining({ kind: 'partner', key: 'hazardco', pinned: true })]);
    await agent.post('/api/auth/set-password').send({ token, password: 'AnotherSyntheticPassword42' }).expect(400);
  });
});

describe('schema files', () => {
  it('contain every isolated table and no ROBC database reference', async () => {
    const sql = await readFile(path.resolve('db/schema.sql'), 'utf8');
    const tables = [...sql.matchAll(/CREATE TABLE\s+([a-z_]+)/gi)].map((match) => match[1]);
    expect(tables).toEqual(expect.arrayContaining(['users', 'sessions', 'pages', 'sections', 'page_revisions', 'media', 'settings', 'form_submissions', 'content_controls', 'partners', 'analytics_daily', 'outbound_clicks']));
    expect(new Set(tables).size).toBe(tables.length);
    expect(sql.toLowerCase()).not.toContain('robc.');
    expect((sql.match(/\(/g) ?? []).length).toBe((sql.match(/\)/g) ?? []).length);
  });
});
