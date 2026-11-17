import { createHash, randomBytes } from 'node:crypto';
import { loadConfig } from '../config.js';
import { MariaDbRepository } from '../mariadb-repository.js';

const email = process.argv[2];
const role = process.argv[3] === 'editor' ? 'editor' : 'owner';
if (!email) throw new Error('Usage: npm run admin:invite -- owner@example.com [owner|editor]');

const config = loadConfig();
const repository = MariaDbRepository.fromConfig(config);
const token = randomBytes(32).toString('base64url');
const tokenHash = createHash('sha256').update(token).digest('hex');
const expiresAt = new Date(Date.now() + 48 * 3_600_000).toISOString();
try {
  await repository.createInvitation(email, role, tokenHash, expiresAt);
  console.log(`Invitation (shown once, expires ${expiresAt}):`);
  console.log(`${config.PUBLIC_ORIGIN}/admin/set-password?token=${encodeURIComponent(token)}`);
} finally {
  await repository.close();
}
