import { z } from 'zod';

try { process.loadEnvFile('.env'); } catch { /* .env is optional; production can inject environment variables */ }

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(6981),
  PUBLIC_ORIGIN: z.url().default('http://localhost:6980'),
  GO_LIVE: z.enum(['true', 'false']).default('false'),
  REPOSITORY: z.enum(['mariadb', 'memory']).default('mariadb'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().regex(/^[A-Za-z0-9_]+$/).default('robweb'),
  DB_USER: z.string().default('robweb'),
  DB_PASSWORD: z.string().default(''),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  FORM_RETENTION_DAYS: z.coerce.number().int().min(1).max(730).default(90),
  NOTIFICATION_TRANSPORT: z.enum(['disabled', 'smtp']).default('disabled'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  FORM_NOTIFICATION_TO: z.string().default(''),
  GA_MEASUREMENT_ID: z.string().regex(/^G-[A-Z0-9]+$/).default('G-XQNLT1H91R'),
  SHOPIFY_STOREFRONT_TOKEN: z.string().default(''),
});

export type AppConfig = ReturnType<typeof loadConfig>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.parse(source);
  if (parsed.NODE_ENV === 'production' && parsed.REPOSITORY === 'memory') {
    throw new Error('REPOSITORY=memory is test/development only');
  }
  if (parsed.REPOSITORY === 'mariadb' && !parsed.DB_PASSWORD) {
    throw new Error('DB_PASSWORD is required for the MariaDB repository');
  }
  return { ...parsed, goLive: parsed.GO_LIVE === 'true', secureCookies: parsed.NODE_ENV === 'production' };
}
