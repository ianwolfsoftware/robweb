import { randomUUID } from 'node:crypto';
import type {
  AnalyticsInput,
  AnalyticsRow,
  DashboardSnapshot,
  FormStatus,
  FormSubmission,
  FormType,
  InvitationRecord,
  MediaRecord,
  OutboundRow,
  PageRecord,
  PublicFormFields,
  SafeUser,
  SessionRecord,
  UserRecord,
  UserRole,
} from '../shared/types.js';

export interface Repository {
  createForm(type: FormType, fields: PublicFormFields): Promise<FormSubmission>;
  listForms(status?: FormStatus): Promise<FormSubmission[]>;
  updateFormStatus(id: string, status: FormStatus, handledBy: string): Promise<boolean>;
  recordVisit(input: AnalyticsInput): Promise<void>;
  recordOutbound(row: Omit<OutboundRow, 'count'>): Promise<void>;
  dashboard(): Promise<DashboardSnapshot>;
  createInvitation(email: string, role: UserRole, tokenHash: string, expiresAt: string): Promise<SafeUser>;
  findInvitation(tokenHash: string): Promise<{ invitation: InvitationRecord; user: UserRecord } | null>;
  activateInvitation(tokenHash: string, passwordHash: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  listUsers(): Promise<SafeUser[]>;
  createSession(session: SessionRecord): Promise<void>;
  findSession(tokenHash: string): Promise<{ session: SessionRecord; user: UserRecord } | null>;
  deleteSession(tokenHash: string): Promise<void>;
  listPages(): Promise<PageRecord[]>;
  savePage(id: string, title: string, sections: PageRecord['sections'], actorId: string): Promise<PageRecord | null>;
  publishPage(id: string, actorId: string): Promise<PageRecord | null>;
  revertPage(id: string, actorId: string): Promise<PageRecord | null>;
  listMedia(): Promise<MediaRecord[]>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string): Promise<void>;
}

const emptyDashboard = (): DashboardSnapshot => ({
  visits: 0,
  forms: { new: 0, handled: 0, spam: 0 },
  topPages: [],
  referrers: [],
  devices: [],
  outbound: [],
});

function ranked(rows: Array<[string, number]>) {
  return rows.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count }));
}

export class InMemoryRepository implements Repository {
  forms: FormSubmission[] = [];
  visits = new Map<string, AnalyticsRow>();
  outbound = new Map<string, OutboundRow>();
  users = new Map<string, UserRecord>();
  invitations = new Map<string, InvitationRecord>();
  sessions = new Map<string, SessionRecord>();
  pages: PageRecord[] = ['/', '/app/', '/shop/', '/videos/', '/about/', '/services/', '/projects/', '/robin-recommends/', '/contact/', '/register-interest/'].map((slug) => ({
    id: randomUUID(), slug, title: slug === '/' ? 'Home' : slug.split('/').filter(Boolean).join(' ').replace(/\b\w/g, (value) => value.toUpperCase()),
    status: 'draft', sections: [], currentRevision: 0, updatedAt: new Date().toISOString(),
  }));
  revisions = new Map<string, PageRecord[]>();
  media: MediaRecord[] = [];
  settings = new Map<string, string>([['form_retention_days', '90']]);

  async createForm(type: FormType, fields: PublicFormFields) {
    const row: FormSubmission = { id: randomUUID(), type, fields, status: 'new', createdAt: new Date().toISOString(), handledAt: null, handledBy: null };
    this.forms.unshift(row);
    return row;
  }

  async listForms(status?: FormStatus) { return this.forms.filter((row) => !status || row.status === status); }
  async updateFormStatus(id: string, status: FormStatus, handledBy: string) {
    const row = this.forms.find((item) => item.id === id);
    if (!row) return false;
    row.status = status;
    row.handledAt = status === 'handled' ? new Date().toISOString() : null;
    row.handledBy = status === 'handled' ? handledBy : null;
    return true;
  }

  async recordVisit(input: AnalyticsInput) {
    const key = [input.day, input.path, input.referrerHost, input.deviceClass].join('|');
    const existing = this.visits.get(key);
    this.visits.set(key, { ...input, visits: (existing?.visits ?? 0) + 1 });
  }

  async recordOutbound(input: Omit<OutboundRow, 'count'>) {
    const key = [input.day, input.sourcePath, input.target].join('|');
    const existing = this.outbound.get(key);
    this.outbound.set(key, { ...input, count: (existing?.count ?? 0) + 1 });
  }

  async dashboard() {
    const result = emptyDashboard();
    const pages = new Map<string, number>();
    const refs = new Map<string, number>();
    const devices = new Map<string, number>();
    for (const row of this.visits.values()) {
      result.visits += row.visits;
      pages.set(row.path, (pages.get(row.path) ?? 0) + row.visits);
      refs.set(row.referrerHost, (refs.get(row.referrerHost) ?? 0) + row.visits);
      devices.set(row.deviceClass, (devices.get(row.deviceClass) ?? 0) + row.visits);
    }
    for (const row of this.forms) result.forms[row.status] += 1;
    result.topPages = ranked([...pages]);
    result.referrers = ranked([...refs]);
    result.devices = ranked([...devices]);
    result.outbound = ranked([...this.outbound.values()].map((row) => [row.sourcePath, row.count]));
    return result;
  }

  async createInvitation(email: string, role: UserRole, tokenHash: string, expiresAt: string) {
    const normal = email.toLowerCase();
    let user = [...this.users.values()].find((row) => row.email === normal);
    if (!user) {
      user = { id: randomUUID(), email: normal, role, status: 'invited', passwordHash: null, createdAt: new Date().toISOString() };
      this.users.set(user.id, user);
    }
    this.invitations.set(tokenHash, { tokenHash, userId: user.id, expiresAt, usedAt: null });
    return this.safeUser(user);
  }

  async findInvitation(tokenHash: string) {
    const invitation = this.invitations.get(tokenHash);
    const user = invitation && this.users.get(invitation.userId);
    return invitation && user ? { invitation, user } : null;
  }

  async activateInvitation(tokenHash: string, passwordHash: string) {
    const found = await this.findInvitation(tokenHash);
    if (!found || found.invitation.usedAt || new Date(found.invitation.expiresAt) <= new Date()) return null;
    found.invitation.usedAt = new Date().toISOString();
    found.user.passwordHash = passwordHash;
    found.user.status = 'active';
    return found.user;
  }

  async findUserByEmail(email: string) { return [...this.users.values()].find((row) => row.email === email.toLowerCase()) ?? null; }
  async findUserById(id: string) { return this.users.get(id) ?? null; }
  async listUsers() { return [...this.users.values()].map((user) => this.safeUser(user)); }
  async createSession(session: SessionRecord) { this.sessions.set(session.tokenHash, session); }
  async findSession(tokenHash: string) {
    const session = this.sessions.get(tokenHash);
    const user = session && this.users.get(session.userId);
    if (!session || !user || new Date(session.expiresAt) <= new Date()) return null;
    return { session, user };
  }
  async deleteSession(tokenHash: string) { this.sessions.delete(tokenHash); }
  async listPages() { return this.pages; }
  async savePage(id: string, title: string, sections: PageRecord['sections'], _actorId: string) {
    const page = this.pages.find((row) => row.id === id);
    if (!page) return null;
    this.snapshot(page);
    page.title = title; page.sections = structuredClone(sections); page.currentRevision += 1; page.status = 'draft'; page.updatedAt = new Date().toISOString();
    return page;
  }
  async publishPage(id: string, _actorId: string) {
    const page = this.pages.find((row) => row.id === id);
    if (!page) return null;
    this.snapshot(page); page.currentRevision += 1; page.status = 'published'; page.updatedAt = new Date().toISOString(); return page;
  }
  async revertPage(id: string, _actorId: string) {
    const page = this.pages.find((row) => row.id === id);
    const revisions = this.revisions.get(id);
    const previous = revisions?.pop();
    if (!page || !previous) return null;
    Object.assign(page, structuredClone(previous), { currentRevision: page.currentRevision + 1, status: 'draft', updatedAt: new Date().toISOString() });
    return page;
  }
  async listMedia() { return this.media; }
  async getSettings() { return Object.fromEntries(this.settings); }
  async setSetting(key: string, value: string) { this.settings.set(key, value); }

  private safeUser({ passwordHash: _passwordHash, ...user }: UserRecord): SafeUser { return user; }
  private snapshot(page: PageRecord) { this.revisions.set(page.id, [...(this.revisions.get(page.id) ?? []), structuredClone(page)]); }
}
