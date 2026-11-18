import { randomUUID } from 'node:crypto';
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import type {
  AnalyticsInput,
  ContentControl,
  ContentItemKind,
  DashboardSnapshot,
  FormStatus,
  FormSubmission,
  FormType,
  InvitationRecord,
  MediaRecord,
  OutboundRow,
  PageRecord,
  PartnerRecord,
  PublicFormFields,
  SafeUser,
  SessionRecord,
  UserRecord,
  UserRole,
} from '../shared/types.js';
import type { AppConfig } from './config.js';
import type { Repository } from './repository.js';

type Row = RowDataPacket & Record<string, unknown>;

function iso(value: unknown) { return value instanceof Date ? value.toISOString() : String(value); }
function json<T>(value: unknown): T { return typeof value === 'string' ? JSON.parse(value) as T : value as T; }
function safeUser(row: Row): SafeUser {
  return { id: String(row.id), email: String(row.email), role: row.role as UserRole, status: row.status as SafeUser['status'], createdAt: iso(row.created_at) };
}
function userRecord(row: Row): UserRecord { return { ...safeUser(row), passwordHash: row.password_hash ? String(row.password_hash) : null }; }

export class MariaDbRepository implements Repository {
  constructor(readonly pool: Pool) {}

  static fromConfig(config: AppConfig) {
    return new MariaDbRepository(mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      connectionLimit: 8,
      charset: 'utf8mb4',
      dateStrings: false,
    }));
  }

  async close() { await this.pool.end(); }

  async createForm(type: FormType, fields: PublicFormFields) {
    const id = randomUUID();
    await this.pool.execute('INSERT INTO form_submissions (id, type, fields_json, status) VALUES (?, ?, ?, \'new\')', [id, type, JSON.stringify(fields)]);
    return { id, type, fields, status: 'new' as const, createdAt: new Date().toISOString(), handledAt: null, handledBy: null };
  }

  async listForms(status?: FormStatus) {
    const [rows] = status
      ? await this.pool.execute<Row[]>('SELECT * FROM form_submissions WHERE status = ? ORDER BY created_at DESC LIMIT 1000', [status])
      : await this.pool.query<Row[]>('SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 1000');
    return rows.map((row): FormSubmission => ({
      id: String(row.id), type: row.type as FormType, fields: json<PublicFormFields>(row.fields_json), status: row.status as FormStatus,
      createdAt: iso(row.created_at), handledAt: row.handled_at ? iso(row.handled_at) : null, handledBy: row.handled_by ? String(row.handled_by) : null,
    }));
  }

  async updateFormStatus(id: string, status: FormStatus, handledBy: string) {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'UPDATE form_submissions SET status = ?, handled_at = IF(? = \'handled\', CURRENT_TIMESTAMP, NULL), handled_by = IF(? = \'handled\', ?, NULL) WHERE id = ?',
      [status, status, status, handledBy, id],
    );
    return result.affectedRows === 1;
  }

  async recordVisit(input: AnalyticsInput) {
    await this.pool.execute(
      `INSERT INTO analytics_daily (day, path, referrer_host, device_class, visits)
       VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE visits = visits + 1`,
      [input.day, input.path, input.referrerHost, input.deviceClass],
    );
  }

  async recordOutbound(input: Omit<OutboundRow, 'count'>) {
    await this.pool.execute(
      `INSERT INTO outbound_clicks (day, source_path, target, count)
       VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE count = count + 1`,
      [input.day, input.sourcePath, input.target],
    );
  }

  async dashboard(): Promise<DashboardSnapshot> {
    const [summary] = await this.pool.query<Row[]>('SELECT COALESCE(SUM(visits), 0) visits FROM analytics_daily');
    const [formRows] = await this.pool.query<Row[]>('SELECT status label, COUNT(*) count FROM form_submissions GROUP BY status');
    const [pages] = await this.pool.query<Row[]>('SELECT path label, SUM(visits) count FROM analytics_daily GROUP BY path ORDER BY count DESC LIMIT 10');
    const [refs] = await this.pool.query<Row[]>('SELECT referrer_host label, SUM(visits) count FROM analytics_daily GROUP BY referrer_host ORDER BY count DESC LIMIT 10');
    const [devices] = await this.pool.query<Row[]>('SELECT device_class label, SUM(visits) count FROM analytics_daily GROUP BY device_class ORDER BY count DESC');
    const [outbound] = await this.pool.query<Row[]>('SELECT source_path label, SUM(count) count FROM outbound_clicks GROUP BY source_path ORDER BY count DESC LIMIT 10');
    const list = (rows: Row[]) => rows.map((row) => ({ label: String(row.label), count: Number(row.count) }));
    const forms = { new: 0, handled: 0, spam: 0 };
    for (const row of formRows) forms[row.label as FormStatus] = Number(row.count);
    return { visits: Number(summary[0]?.visits ?? 0), forms, topPages: list(pages), referrers: list(refs), devices: list(devices), outbound: list(outbound) };
  }

  async createInvitation(email: string, role: UserRole, tokenHash: string, expiresAt: string) {
    const normal = email.toLowerCase();
    const [rows] = await this.pool.execute<Row[]>('SELECT * FROM users WHERE email = ?', [normal]);
    let user: SafeUser;
    if (rows[0]) {
      user = safeUser(rows[0]);
      await this.pool.execute('UPDATE users SET role = ?, status = IF(status = \'active\', status, \'invited\') WHERE id = ?', [role, user.id]);
      user.role = role;
    } else {
      const id = randomUUID();
      await this.pool.execute('INSERT INTO users (id, email, role, status) VALUES (?, ?, ?, \'invited\')', [id, normal, role]);
      user = { id, email: normal, role, status: 'invited', createdAt: new Date().toISOString() };
    }
    await this.pool.execute('UPDATE user_invitations SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL', [user.id]);
    await this.pool.execute('INSERT INTO user_invitations (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)', [randomUUID(), user.id, tokenHash, expiresAt]);
    return user;
  }

  async findInvitation(tokenHash: string) {
    const [rows] = await this.pool.execute<Row[]>(
      `SELECT i.token_hash, i.user_id, i.expires_at, i.used_at,
              u.id, u.email, u.role, u.status, u.password_hash, u.created_at
       FROM user_invitations i JOIN users u ON u.id = i.user_id WHERE i.token_hash = ?`, [tokenHash],
    );
    if (!rows[0]) return null;
    const row = rows[0];
    const invitation: InvitationRecord = { tokenHash: String(row.token_hash), userId: String(row.user_id), expiresAt: iso(row.expires_at), usedAt: row.used_at ? iso(row.used_at) : null };
    return { invitation, user: userRecord(row) };
  }

  async activateInvitation(tokenHash: string, passwordHash: string) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<Row[]>(
        `SELECT i.user_id, i.expires_at, i.used_at, u.* FROM user_invitations i
         JOIN users u ON u.id = i.user_id WHERE i.token_hash = ? FOR UPDATE`, [tokenHash],
      );
      const row = rows[0];
      if (!row || row.used_at || new Date(iso(row.expires_at)) <= new Date()) { await connection.rollback(); return null; }
      await connection.execute('UPDATE users SET password_hash = ?, status = \'active\' WHERE id = ?', [passwordHash, row.user_id]);
      await connection.execute('UPDATE user_invitations SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ?', [tokenHash]);
      await connection.commit();
      return { ...userRecord(row), passwordHash, status: 'active' as const };
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async findUserByEmail(email: string) { const [rows] = await this.pool.execute<Row[]>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]); return rows[0] ? userRecord(rows[0]) : null; }
  async findUserById(id: string) { const [rows] = await this.pool.execute<Row[]>('SELECT * FROM users WHERE id = ?', [id]); return rows[0] ? userRecord(rows[0]) : null; }
  async listUsers() { const [rows] = await this.pool.query<Row[]>('SELECT * FROM users ORDER BY created_at'); return rows.map(safeUser); }
  async createSession(session: SessionRecord) { await this.pool.execute('INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)', [session.tokenHash, session.userId, session.csrfToken, session.expiresAt]); }
  async findSession(tokenHash: string) {
    const [rows] = await this.pool.execute<Row[]>(
      `SELECT s.token_hash, s.user_id, s.csrf_token, s.expires_at,
              u.id, u.email, u.role, u.status, u.password_hash, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`, [tokenHash],
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return { session: { tokenHash: String(row.token_hash), userId: String(row.user_id), csrfToken: String(row.csrf_token), expiresAt: iso(row.expires_at) }, user: userRecord(row) };
  }
  async deleteSession(tokenHash: string) { await this.pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]); }

  async listPages() {
    const [pages] = await this.pool.query<Row[]>('SELECT * FROM pages ORDER BY title');
    const result: PageRecord[] = [];
    for (const page of pages) {
      const [sections] = await this.pool.execute<Row[]>('SELECT * FROM sections WHERE page_id = ? ORDER BY position', [page.id]);
      result.push({
        id: String(page.id), slug: String(page.slug), title: String(page.title), status: page.status as PageRecord['status'],
        currentRevision: Number(page.current_revision), updatedAt: iso(page.updated_at),
        sections: sections.map((row) => ({ id: String(row.id), type: row.type as PageRecord['sections'][number]['type'], position: Number(row.position), data: json(row.data_json) })),
      });
    }
    return result;
  }

  async savePage(id: string, title: string, sections: PageRecord['sections'], actorId: string) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [pages] = await connection.execute<Row[]>('SELECT * FROM pages WHERE id = ? FOR UPDATE', [id]);
      if (!pages[0]) { await connection.rollback(); return null; }
      const nextRevision = Number(pages[0].current_revision) + 1;
      await connection.execute(
        'INSERT INTO page_revisions (id, page_id, revision_number, title, sections_json, action, created_by) VALUES (?, ?, ?, ?, ?, \'draft\', ?)',
        [randomUUID(), id, nextRevision, title, JSON.stringify(sections), actorId],
      );
      await connection.execute('DELETE FROM sections WHERE page_id = ?', [id]);
      for (const section of sections) {
        await connection.execute('INSERT INTO sections (id, page_id, type, position, data_json) VALUES (?, ?, ?, ?, ?)', [section.id || randomUUID(), id, section.type, section.position, JSON.stringify(section.data)]);
      }
      await connection.execute('UPDATE pages SET title = ?, status = \'draft\', current_revision = ?, updated_by = ? WHERE id = ?', [title, nextRevision, actorId, id]);
      await connection.commit();
      return (await this.listPages()).find((page) => page.id === id) ?? null;
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  }

  async publishPage(id: string, actorId: string) {
    const pages = await this.listPages();
    const page = pages.find((row) => row.id === id);
    if (!page) return null;
    const nextRevision = page.currentRevision + 1;
    await this.pool.execute(
      'INSERT INTO page_revisions (id, page_id, revision_number, title, sections_json, action, created_by) VALUES (?, ?, ?, ?, ?, \'publish\', ?)',
      [randomUUID(), id, nextRevision, page.title, JSON.stringify(page.sections), actorId],
    );
    await this.pool.execute('UPDATE pages SET status = \'published\', current_revision = ?, published_revision = ?, updated_by = ? WHERE id = ?', [nextRevision, nextRevision, actorId, id]);
    return { ...page, status: 'published' as const, currentRevision: nextRevision, updatedAt: new Date().toISOString() };
  }

  async revertPage(id: string, actorId: string) {
    const [rows] = await this.pool.execute<Row[]>(
      `SELECT title, sections_json FROM page_revisions WHERE page_id = ? AND action IN ('draft','publish')
       ORDER BY revision_number DESC LIMIT 1 OFFSET 1`, [id],
    );
    if (!rows[0]) return null;
    const sections = json<PageRecord['sections']>(rows[0].sections_json);
    return this.savePage(id, String(rows[0].title), sections, actorId);
  }

  async listMedia() {
    const [rows] = await this.pool.query<Row[]>('SELECT * FROM media ORDER BY created_at DESC LIMIT 500');
    return rows.map((row): MediaRecord => ({ id: String(row.id), path: String(row.path), mimeType: row.mime_type as MediaRecord['mimeType'], bytes: Number(row.bytes), width: Number(row.width), height: Number(row.height), altText: String(row.alt_text), createdAt: iso(row.created_at) }));
  }
  async listContentControls() {
    const [rows] = await this.pool.query<Row[]>('SELECT * FROM content_controls ORDER BY item_kind, position IS NULL, position, item_key');
    return rows.map((row): ContentControl => ({
      kind: row.item_kind as ContentItemKind, key: String(row.item_key), hidden: Boolean(row.hidden), pinned: Boolean(row.pinned),
      position: row.position === null ? null : Number(row.position), updatedAt: iso(row.updated_at),
    }));
  }
  async upsertContentControl(kind: ContentItemKind, key: string, values: Pick<ContentControl, 'hidden' | 'pinned' | 'position'>, actorId: string) {
    await this.pool.execute(
      `INSERT INTO content_controls (item_kind, item_key, hidden, pinned, position, updated_by)
       VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE hidden = VALUES(hidden), pinned = VALUES(pinned), position = VALUES(position), updated_by = VALUES(updated_by)`,
      [kind, key, values.hidden, values.pinned, values.position, actorId],
    );
    return { kind, key, ...values, updatedAt: new Date().toISOString() };
  }
  async listPartners() {
    const [rows] = await this.pool.query<Row[]>('SELECT * FROM partners ORDER BY position, name');
    return rows.map((row): PartnerRecord => ({
      id: String(row.id), name: String(row.name), url: String(row.url), logoPath: row.logo_path ? String(row.logo_path) : null,
      evidenceUrl: String(row.evidence_url), position: Number(row.position), active: Boolean(row.active),
      createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
    }));
  }
  async savePartner(partner: Omit<PartnerRecord, 'createdAt' | 'updatedAt'>, actorId: string) {
    await this.pool.execute(
      `INSERT INTO partners (id, name, url, logo_path, evidence_url, position, active, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), url = VALUES(url), logo_path = VALUES(logo_path), evidence_url = VALUES(evidence_url), position = VALUES(position), active = VALUES(active), updated_by = VALUES(updated_by)`,
      [partner.id, partner.name, partner.url, partner.logoPath, partner.evidenceUrl, partner.position, partner.active, actorId],
    );
    const rows = await this.listPartners();
    const row = rows.find((item) => item.id === partner.id);
    if (!row) throw new Error('Partner write did not return a row');
    return row;
  }
  async getSettings() { const [rows] = await this.pool.query<Row[]>('SELECT setting_key, value_json FROM settings'); return Object.fromEntries(rows.map((row) => [String(row.setting_key), String(json<unknown>(row.value_json))])); }
  async setSetting(key: string, value: string) { await this.pool.execute('INSERT INTO settings (setting_key, value_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)', [key, JSON.stringify(value)]); }
}
