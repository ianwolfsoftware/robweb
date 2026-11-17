import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { sectionTypes, type FormStatus, type UserRecord } from '../shared/types.js';
import type { AppConfig } from './config.js';
import type { NotificationTransport } from './notifications.js';
import type { Repository } from './repository.js';
import { ShopifyCatalogue } from './shopify.js';
import { formStatusSchema, inviteSchema, loginSchema, publicFormSchema, setPasswordSchema, utcDay, visitSchema } from './validation.js';

const SESSION_COOKIE = 'robweb_session';
const shopOrigin = 'https://toolsandjigs.com';
const sourceSchema = z.string().startsWith('/').max(240).regex(/^\/[A-Za-z0-9/_-]*$/).default('/');
const productSchema = z.string().max(181).regex(/^[\p{L}\p{N}][\p{L}\p{N}®_-]{0,180}$/u);
const settingsSchema = z.object({ form_retention_days: z.coerce.number().int().min(1).max(730) }).strict();
const sectionSchema = z.object({
  id: z.string().max(64), type: z.enum(sectionTypes), position: z.number().int().min(0).max(200),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
}).strict();
const pageSchema = z.object({ title: z.string().trim().min(1).max(200), sections: z.array(sectionSchema).max(100) }).strict();

type AuthenticatedRequest = Request & { robwebUser?: UserRecord; robwebCsrf?: string; robwebTokenHash?: string };

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
function safeUser({ passwordHash: _passwordHash, ...user }: UserRecord) { return user; }
function asyncRoute(handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>) {
  return (request: Request, response: Response, next: NextFunction) => { void handler(request, response, next).catch(next); };
}
function validationError(response: Response, error: z.ZodError) {
  return response.status(422).json({ error: 'validation_failed', fields: error.flatten().fieldErrors });
}
function csvCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function routeParam(value: string | string[]) { return Array.isArray(value) ? value[0] : value; }

export function createApp({ repository, config, notifications }: { repository: Repository; config: AppConfig; notifications: NotificationTransport }) {
  const app = express();
  const shopify = new ShopifyCatalogue(config.SHOPIFY_STOREFRONT_TOKEN);
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"] } },
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  const formLimit = rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });
  const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });

  const createSession = async (response: Response, user: UserRecord) => {
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + config.SESSION_DAYS * 86_400_000).toISOString();
    await repository.createSession({ tokenHash: hashToken(token), userId: user.id, csrfToken, expiresAt });
    response.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: config.secureCookies, sameSite: 'strict', path: '/', maxAge: config.SESSION_DAYS * 86_400_000 });
    return csrfToken;
  };

  const authenticate = asyncRoute(async (request: AuthenticatedRequest, response, next) => {
    const token = request.cookies[SESSION_COOKIE];
    if (typeof token !== 'string') return response.status(401).json({ error: 'authentication_required' });
    const tokenHash = hashToken(token);
    const found = await repository.findSession(tokenHash);
    if (!found || found.user.status !== 'active') return response.status(401).json({ error: 'authentication_required' });
    request.robwebUser = found.user;
    request.robwebCsrf = found.session.csrfToken;
    request.robwebTokenHash = tokenHash;
    next();
  });
  const csrf = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (request.get('x-csrf-token') !== request.robwebCsrf) return response.status(403).json({ error: 'csrf_failed' });
    next();
  };
  const ownerOnly = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (request.robwebUser?.role !== 'owner') return response.status(403).json({ error: 'owner_required' });
    next();
  };

  app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'robweb-api' }));

  app.post('/api/forms/:type', formLimit, asyncRoute(async (request, response) => {
    if (request.params.type !== 'contact' && request.params.type !== 'interest') return response.status(404).json({ error: 'not_found' });
    const parsed = publicFormSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const { website: _honeypot, ...fields } = parsed.data;
    const submission = await repository.createForm(request.params.type as 'contact' | 'interest', fields);
    await notifications.formReceived(submission);
    return response.status(201).json({ ok: true, reference: submission.id });
  }));

  app.post('/api/analytics/visit', rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }), asyncRoute(async (request, response) => {
    const parsed = visitSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    await repository.recordVisit({ day: utcDay(), ...parsed.data });
    return response.status(202).end();
  }));

  app.get('/api/shop', asyncRoute(async (_request, response) => {
    const catalogue = await shopify.get();
    response.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
    return response.json(catalogue);
  }));

  app.get('/go/shop', asyncRoute(async (request, response) => {
    const sourcePath = sourceSchema.catch('/').parse(request.query.source);
    let target = new URL(shopOrigin);
    const product = productSchema.safeParse(request.query.product);
    if (product.success) {
      target = new URL(`/products/${encodeURIComponent(product.data)}`, shopOrigin);
    } else if (typeof request.query.target === 'string') {
      try {
        const candidate = new URL(request.query.target, shopOrigin);
        if (candidate.origin === shopOrigin) target = candidate;
      } catch { /* use the safe default */ }
    }
    target.searchParams.set('utm_source', 'robweb');
    target.searchParams.set('utm_medium', 'referral');
    target.searchParams.set('utm_campaign', 'tools_and_jigs');
    target.searchParams.set('utm_content', sourcePath === '/' ? 'home' : sourcePath.replaceAll('/', '_').replace(/^_+|_+$/g, ''));
    await repository.recordOutbound({ day: utcDay(), sourcePath, target: `${target.origin}${target.pathname}` });
    return response.redirect(302, target.toString());
  }));

  app.post('/api/auth/set-password', authLimit, asyncRoute(async (request, response) => {
    const parsed = setPasswordSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const passwordHash = await bcrypt.hash(parsed.data.password, config.NODE_ENV === 'test' ? 4 : 12);
    const user = await repository.activateInvitation(hashToken(parsed.data.token), passwordHash);
    if (!user) return response.status(400).json({ error: 'invitation_invalid_or_expired' });
    const csrfToken = await createSession(response, user);
    return response.json({ user: safeUser(user), csrfToken });
  }));

  app.post('/api/auth/login', authLimit, asyncRoute(async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const user = await repository.findUserByEmail(parsed.data.email);
    if (!user?.passwordHash || user.status !== 'active' || !await bcrypt.compare(parsed.data.password, user.passwordHash)) {
      return response.status(401).json({ error: 'invalid_credentials' });
    }
    const csrfToken = await createSession(response, user);
    return response.json({ user: safeUser(user), csrfToken });
  }));

  app.get('/api/auth/session', authenticate, (request: AuthenticatedRequest, response) => response.json({ user: safeUser(request.robwebUser!), csrfToken: request.robwebCsrf }));
  app.post('/api/auth/logout', authenticate, csrf, asyncRoute(async (request: AuthenticatedRequest, response) => {
    await repository.deleteSession(request.robwebTokenHash!);
    response.clearCookie(SESSION_COOKIE, { path: '/' });
    return response.status(204).end();
  }));

  app.get('/api/admin/dashboard', authenticate, asyncRoute(async (_request, response) => response.json(await repository.dashboard())));
  app.get('/api/admin/pages', authenticate, asyncRoute(async (_request, response) => response.json(await repository.listPages())));
  app.put('/api/admin/pages/:id', authenticate, csrf, asyncRoute(async (request: AuthenticatedRequest, response) => {
    const parsed = pageSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const page = await repository.savePage(routeParam(request.params.id), parsed.data.title, parsed.data.sections, request.robwebUser!.id);
    return page ? response.json(page) : response.status(404).json({ error: 'not_found' });
  }));
  app.post('/api/admin/pages/:id/publish', authenticate, csrf, asyncRoute(async (request: AuthenticatedRequest, response) => {
    const page = await repository.publishPage(routeParam(request.params.id), request.robwebUser!.id);
    return page ? response.json(page) : response.status(404).json({ error: 'not_found' });
  }));
  app.post('/api/admin/pages/:id/revert', authenticate, csrf, asyncRoute(async (request: AuthenticatedRequest, response) => {
    const page = await repository.revertPage(routeParam(request.params.id), request.robwebUser!.id);
    return page ? response.json(page) : response.status(409).json({ error: 'no_previous_revision' });
  }));
  app.get('/api/admin/media', authenticate, asyncRoute(async (_request, response) => response.json(await repository.listMedia())));
  app.get('/api/admin/forms', authenticate, asyncRoute(async (request, response) => {
    const status = typeof request.query.status === 'string' && ['new', 'handled', 'spam'].includes(request.query.status) ? request.query.status as FormStatus : undefined;
    return response.json(await repository.listForms(status));
  }));
  app.patch('/api/admin/forms/:id', authenticate, csrf, asyncRoute(async (request: AuthenticatedRequest, response) => {
    const parsed = formStatusSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const changed = await repository.updateFormStatus(routeParam(request.params.id), parsed.data.status, request.robwebUser!.id);
    return changed ? response.status(204).end() : response.status(404).json({ error: 'not_found' });
  }));
  app.get('/api/admin/forms.csv', authenticate, asyncRoute(async (_request, response) => {
    const rows = await repository.listForms();
    const header = ['reference', 'type', 'status', 'created', 'name', 'email', 'phone', 'subject', 'message'];
    const body = [header, ...rows.map((row) => [row.id, row.type, row.status, row.createdAt, row.fields.name, row.fields.email, row.fields.phone, row.fields.subject, row.fields.message])]
      .map((row) => row.map(csvCell).join(',')).join('\n');
    response.type('text/csv').attachment('robweb-form-submissions.csv');
    return response.send(body);
  }));
  app.get('/api/admin/analytics', authenticate, asyncRoute(async (_request, response) => response.json(await repository.dashboard())));
  app.get('/api/admin/users', authenticate, ownerOnly, asyncRoute(async (_request, response) => response.json(await repository.listUsers())));
  app.post('/api/admin/invitations', authenticate, csrf, ownerOnly, asyncRoute(async (request, response) => {
    const parsed = inviteSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 48 * 3_600_000).toISOString();
    const user = await repository.createInvitation(parsed.data.email, parsed.data.role, hashToken(token), expiresAt);
    return response.status(201).json({ user, invitationUrl: `${config.PUBLIC_ORIGIN}/admin/set-password?token=${encodeURIComponent(token)}`, expiresAt });
  }));
  app.get('/api/admin/settings', authenticate, ownerOnly, asyncRoute(async (_request, response) => response.json(await repository.getSettings())));
  app.put('/api/admin/settings', authenticate, csrf, ownerOnly, asyncRoute(async (request, response) => {
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) return validationError(response, parsed.error);
    await repository.setSetting('form_retention_days', String(parsed.data.form_retention_days));
    return response.status(204).end();
  }));

  app.get('/robots.txt', (_request, response) => {
    response.type('text/plain').send(config.goLive ? 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n' : 'User-agent: *\nDisallow: /\n');
  });
  app.get('/sitemap.xml', (_request, response) => {
    const paths = ['/', '/shop/', '/app/', '/contact/', '/legal/privacy/', '/legal/terms/', '/legal/disclaimer/', '/legal/cookies/', '/calculator-app/', '/calculator-app/privacy/', '/calculator-app/terms/'];
    response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((value) => `<url><loc>${config.PUBLIC_ORIGIN}${value}</loc></url>`).join('')}</urlset>`);
  });

  app.use('/api', (_request, response) => response.status(404).json({ error: 'not_found' }));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error(error instanceof Error ? error.message : 'Unknown API error');
    response.status(500).json({ error: 'internal_error' });
  });
  return app;
}

export { hashToken };
