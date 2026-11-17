import { readFile } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, hashToken } from './app.js';
import { loadConfig } from './config.js';
import { InMemoryRepository } from './repository.js';
import { publicFormSchema } from './validation.js';

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
});

describe('analytics aggregation and outbound redirect', () => {
  it('aggregates only day/path/referrer/device and counts safe shop redirects', async () => {
    const repository = new InMemoryRepository();
    await repository.recordVisit({ day: '2026-11-17', path: '/videos/', referrerHost: 'direct', deviceClass: 'phone' });
    await repository.recordVisit({ day: '2026-11-17', path: '/videos/', referrerHost: 'direct', deviceClass: 'phone' });
    const app = createApp({ repository, config, notifications });
    const redirect = await request(app).get('/go/shop?source=%2Fvideos%2F&target=https%3A%2F%2Fevil.invalid%2Fcollect').expect(302);
    expect(redirect.headers.location).toMatch(/^https:\/\/toolsandjigs\.com\//);
    expect(redirect.headers.location).toContain('utm_source=robweb');
    const snapshot = await repository.dashboard();
    expect(snapshot.visits).toBe(2);
    expect(snapshot.topPages).toEqual([{ label: '/videos/', count: 2 }]);
    expect(snapshot.outbound).toEqual([{ label: '/videos/', count: 1 }]);
    expect([...repository.visits.values()][0]).not.toHaveProperty('ip');
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
    await agent.post('/api/auth/set-password').send({ token, password: 'AnotherSyntheticPassword42' }).expect(400);
  });
});

describe('schema files', () => {
  it('contain every isolated table and no ROBC database reference', async () => {
    const sql = await readFile(path.resolve('db/schema.sql'), 'utf8');
    const tables = [...sql.matchAll(/CREATE TABLE\s+([a-z_]+)/gi)].map((match) => match[1]);
    expect(tables).toEqual(expect.arrayContaining(['users', 'sessions', 'pages', 'sections', 'page_revisions', 'media', 'settings', 'form_submissions', 'analytics_daily', 'outbound_clicks']));
    expect(new Set(tables).size).toBe(tables.length);
    expect(sql.toLowerCase()).not.toContain('robc.');
    expect((sql.match(/\(/g) ?? []).length).toBe((sql.match(/\)/g) ?? []).length);
  });
});
