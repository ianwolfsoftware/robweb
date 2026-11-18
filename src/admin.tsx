import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { sectionTypes, type AdminContentItem, type AdminContentSnapshot, type DashboardSnapshot, type FormSubmission, type MediaRecord, type PageRecord, type PartnerRecord, type SafeUser } from '../shared/types';

type Session = { user: SafeUser; csrfToken: string };
type AdminProps = { path: string };

async function jsonRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...options.headers } });
  if (!response.ok) throw new Error(response.status === 401 ? 'authentication_required' : `request_failed_${response.status}`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function AdminLogin({ onLogin }: { onLogin: (session: Session) => void }) {
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    try { onLogin(await jsonRequest<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) })); }
    catch { setError('Sign-in details were not recognised.'); }
  };
  return <main className="admin-entry"><div className="admin-login-card"><p className="eyebrow">ROBWEB ADMIN</p><h1>Sign in securely.</h1><p>There are no default credentials. An owner invitation is required before first use.</p><form onSubmit={submit} className="stack-form"><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" type="submit">Sign in</button></form></div></main>;
}

function SetPassword({ onLogin }: { onLogin: (session: Session) => void }) {
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage('');
    const data = new FormData(event.currentTarget);
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setMessage('This invitation link is incomplete.'); return; }
    try { onLogin(await jsonRequest<Session>('/api/auth/set-password', { method: 'POST', body: JSON.stringify({ token, password: data.get('password') }) })); }
    catch { setMessage('The invitation is invalid, expired, or the password does not meet the requirements.'); }
  };
  return <main className="admin-entry"><div className="admin-login-card"><p className="eyebrow">ONE-TIME INVITATION</p><h1>Set your password.</h1><p>Use at least 14 characters with upper-case, lower-case and a number. The link can be used once.</p><form onSubmit={submit} className="stack-form"><label>New password<input name="password" type="password" minLength={14} autoComplete="new-password" required /></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="button" type="submit">Set password</button></form></div></main>;
}

const adminNav = [
  ['/admin/', 'Dashboard'], ['/admin/pages/', 'Pages'], ['/admin/media/', 'Media library'], ['/admin/content/', 'Public content'], ['/admin/forms/', 'Forms'],
  ['/admin/analytics/', 'Analytics'], ['/admin/users/', 'Users'], ['/admin/settings/', 'Settings'],
] as const;

function Metric({ label, value }: { label: string; value: string | number }) { return <article className="metric"><span>{label}</span><strong>{value}</strong></article>; }
function Ranking({ title, rows }: { title: string; rows?: Array<{ label: string; count: number }> }) {
  return <section className="admin-panel"><h2>{title}</h2>{rows?.length ? <ol className="ranking">{rows.map((row) => <li key={row.label}><span>{row.label}</span><b>{row.count}</b></li>)}</ol> : <p className="empty-state">No aggregated data yet.</p>}</section>;
}

function Dashboard({ data }: { data?: DashboardSnapshot }) {
  return <><div className="metric-grid"><Metric label="Visits" value={data?.visits ?? 0}/><Metric label="New forms" value={data?.forms.new ?? 0}/><Metric label="Handled" value={data?.forms.handled ?? 0}/><Metric label="Shop clicks" value={data?.outbound.reduce((sum, row) => sum + row.count, 0) ?? 0}/></div><div className="admin-grid"><Ranking title="Top pages" rows={data?.topPages}/><Ranking title="Referrers" rows={data?.referrers}/><Ranking title="Devices" rows={data?.devices}/><Ranking title="Tools & Jigs outbound" rows={data?.outbound}/></div></>;
}

function Pages({ pages = [], csrf, refresh }: { pages?: PageRecord[]; csrf: string; refresh: () => void }) {
  const [selected, setSelected] = useState<PageRecord | null>(null);
  const [preview, setPreview] = useState<PageRecord | null>(null);
  const [error, setError] = useState('');
  const mutate = async (page: PageRecord, action: 'publish' | 'revert') => {
    try { await jsonRequest(`/api/admin/pages/${page.id}/${action}`, { method: 'POST', headers: { 'x-csrf-token': csrf } }); refresh(); setError(''); }
    catch { setError(action === 'revert' ? 'There is no earlier revision to restore yet.' : 'The page could not be published.'); }
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return;
    const data = new FormData(event.currentTarget);
    await jsonRequest(`/api/admin/pages/${selected.id}`, { method: 'PUT', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ title: data.get('title'), sections: selected.sections }) });
    setSelected(null); refresh();
  };
  if (preview) return <section className="admin-panel editor"><button className="text-button" onClick={() => setPreview(null)}>← Back to pages</button><p className="eyebrow">STRUCTURED PREVIEW · {preview.status}</p><div className="preview-canvas"><h1>{preview.title}</h1>{preview.sections.length ? preview.sections.map((section) => <section key={section.id}><span>{section.type}</span><h2>{String(section.data.heading ?? section.data.title ?? section.type)}</h2><p>{String(section.data.body ?? section.data.copy ?? '')}</p></section>) : <p>This draft has no managed blocks yet; the current source-led page remains in the public build.</p>}</div></section>;
  if (selected) return <section className="admin-panel editor"><button className="text-button" onClick={() => setSelected(null)}>← Back to pages</button><h2>Edit {selected.title}</h2><form onSubmit={save} className="stack-form"><label>Page title<input name="title" defaultValue={selected.title} required /></label><div className="section-list">{selected.sections.map((section, index) => <article key={section.id}><header><b>{section.type}</b><span>Block {index + 1}</span></header><label>Heading<input value={String(section.data.heading ?? '')} onChange={(event) => setSelected({ ...selected, sections: selected.sections.map((row) => row.id === section.id ? { ...row, data: { ...row.data, heading: event.target.value } } : row) })} /></label><label>Body<textarea rows={4} value={String(section.data.body ?? '')} onChange={(event) => setSelected({ ...selected, sections: selected.sections.map((row) => row.id === section.id ? { ...row, data: { ...row.data, body: event.target.value } } : row) })} /></label><button className="text-button" type="button" onClick={() => setSelected({ ...selected, sections: selected.sections.filter((row) => row.id !== section.id).map((row, position) => ({ ...row, position })) })}>Remove block</button></article>)}</div><label>Add designed block<select defaultValue="" onChange={(event) => { if (!event.target.value) return; setSelected({ ...selected, sections: [...selected.sections, { id: crypto.randomUUID(), type: event.target.value as PageRecord['sections'][number]['type'], position: selected.sections.length, data: {} }] }); event.target.value = ''; }}><option value="">Choose a block…</option>{sectionTypes.map((type) => <option key={type}>{type}</option>)}</select></label><button className="button" type="submit">Save draft</button></form></section>;
  return <section className="admin-panel"><div className="panel-heading"><div><h2>Pages and content</h2><p>Only fixed, reviewed blocks can be added. Scripts and arbitrary HTML are not accepted.</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="admin-table" role="table">{pages.map((page) => <article role="row" key={page.id}><div><b>{page.title}</b><span>{page.slug} · revision {page.currentRevision}</span></div><span className={`status status-${page.status}`}>{page.status}</span><div className="row-actions"><button onClick={() => setSelected(page)}>Edit</button><button onClick={() => setPreview(page)}>Preview</button><button onClick={() => void mutate(page, 'publish')}>Publish</button><button onClick={() => void mutate(page, 'revert')}>Revert</button></div></article>)}</div></section>;
}

function Media({ rows = [] }: { rows?: MediaRecord[] }) {
  return <section className="admin-panel"><h2>Media library</h2><p>Accepted formats are JPEG, PNG, WebP and AVIF, up to 10 MB. Every asset requires useful alt text before it can be selected in content.</p><div className="media-grid">{rows.length ? rows.map((row) => <article key={row.id}><b>{row.path}</b><span>{row.width} × {row.height} · {Math.round(row.bytes / 1024)} KB</span><p>{row.altText}</p></article>) : <p className="empty-state">No managed media has been uploaded. Robin-owned inventory assets remain source-controlled.</p>}</div></section>;
}

function ContentRow({ item, csrf, refresh }: { item: AdminContentItem; csrf: string; refresh: () => void }) {
  const save = async (values: Pick<AdminContentItem, 'hidden' | 'pinned' | 'position'>) => {
    await jsonRequest(`/api/admin/content/${item.kind}/${encodeURIComponent(item.key)}`, { method: 'PUT', headers: { 'x-csrf-token': csrf }, body: JSON.stringify(values) });
    refresh();
  };
  const position = item.position ?? 0;
  return <article className={item.hidden ? 'content-row is-hidden' : 'content-row'}><div><b>{item.title}</b><span>{item.kind} · {item.meta}</span></div><form className="content-order" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void save({ hidden: item.hidden, pinned: item.pinned, position: Number(data.get('position')) }); }}><label>Order<input name="position" type="number" min="0" max="10000" defaultValue={position} /></label><button type="submit">Save order</button></form><div className="row-actions"><button onClick={() => void save({ hidden: item.hidden, pinned: !item.pinned, position: item.position })}>{item.pinned ? 'Unpin' : 'Pin'}</button><button onClick={() => void save({ hidden: !item.hidden, pinned: item.pinned, position: item.position })}>{item.hidden ? 'Show' : 'Hide'}</button></div></article>;
}

function PartnerEditor({ partner, csrf, refresh }: { partner: PartnerRecord; csrf: string; refresh: () => void }) {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await jsonRequest(`/api/admin/partners/${partner.id}`, { method: 'PUT', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ name: data.get('name'), url: data.get('url'), logoPath: data.get('logoPath'), evidenceUrl: data.get('evidenceUrl'), position: Number(data.get('position')), active: data.get('active') === 'on' }) });
    refresh();
  };
  return <details className="partner-editor"><summary><b>{partner.name}</b><span>{partner.active ? 'visible' : 'hidden'} · order {partner.position}</span></summary><form className="stack-form" onSubmit={submit}><label>Name<input name="name" defaultValue={partner.name} required /></label><label>Destination URL<input name="url" type="url" defaultValue={partner.url} required /></label><label>Evidence URL<input name="evidenceUrl" type="url" defaultValue={partner.evidenceUrl} required /></label><label>Logo path <span>(optional, /partners/...)</span><input name="logoPath" defaultValue={partner.logoPath ?? ''} /></label><label>Order<input name="position" type="number" min="0" max="10000" defaultValue={partner.position} required /></label><label className="check-field"><input name="active" type="checkbox" defaultChecked={partner.active} />Visible on the website</label><button className="button" type="submit">Save partner</button></form></details>;
}

function ContentManager({ data, csrf, refresh }: { data?: AdminContentSnapshot; csrf: string; refresh: () => void }) {
  const addPartner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    await jsonRequest('/api/admin/partners', { method: 'POST', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ name: values.get('name'), url: values.get('url'), logoPath: values.get('logoPath'), evidenceUrl: values.get('evidenceUrl'), position: Number(values.get('position')), active: true }) });
    form.reset(); refresh();
  };
  const groups = (data?.items ?? []).reduce<Record<string, AdminContentItem[]>>((result, item) => {
    (result[item.kind] ??= []).push(item); return result;
  }, {});
  return <div className="admin-grid content-admin"><section className="admin-panel"><div className="panel-heading"><div><h2>Media and products</h2><p>Pin important items, hide anything unsuitable, and use a lower order number to move it forward.</p></div></div>{Object.entries(groups).map(([kind, items]) => <section className="content-group" key={kind}><h3>{kind}</h3><div className="admin-table">{items?.map((item) => <ContentRow key={`${item.kind}:${item.key}`} item={item} csrf={csrf} refresh={refresh} />)}</div></section>)}</section><section className="admin-panel"><h2>Partners</h2><p>Edit links, evidence, display order and visibility. Logo paths must point to reviewed files in <code>/partners/</code>.</p><div className="partner-list">{data?.partners.map((partner) => <PartnerEditor key={partner.id} partner={partner} csrf={csrf} refresh={refresh} />)}</div><h3>Add a partner</h3><form className="stack-form" onSubmit={addPartner}><label>Name<input name="name" required /></label><label>Destination URL<input name="url" type="url" placeholder="https://" required /></label><label>Evidence URL<input name="evidenceUrl" type="url" placeholder="https://" required /></label><label>Logo path <span>(optional)</span><input name="logoPath" placeholder="/partners/logo.svg" /></label><label>Order<input name="position" type="number" min="0" max="10000" defaultValue="70" required /></label><button className="button" type="submit">Add partner</button></form></section></div>;
}

function Forms({ rows = [], csrf, refresh }: { rows?: FormSubmission[]; csrf: string; refresh: () => void }) {
  const mark = async (row: FormSubmission, status: FormSubmission['status']) => { await jsonRequest(`/api/admin/forms/${row.id}`, { method: 'PATCH', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ status }) }); refresh(); };
  return <section className="admin-panel"><div className="panel-heading"><div><h2>Forms inbox</h2><p>Contact, media and cladding enquiries stay together, with visible handling status.</p></div><a className="button button-small" href="/api/admin/forms.csv">Export CSV</a></div><div className="admin-table">{rows.length ? rows.map((row) => <details key={row.id}><summary><b>{row.fields.name}</b><span>{row.type} · {row.status} · {new Date(row.createdAt).toLocaleDateString('en-IE')}</span></summary><div className="form-detail"><a href={`mailto:${row.fields.email}`}>{row.fields.email}</a>{row.fields.phone && <p><b>Phone:</b> {row.fields.phone}</p>}{row.fields.organisation && <p><b>Organisation:</b> {row.fields.organisation}</p>}{row.fields.enquiryType && <p><b>Enquiry:</b> {row.fields.enquiryType} · {row.fields.deadline || 'no deadline supplied'}</p>}{row.fields.claddingRef && <p><b>Cladding:</b> {row.fields.claddingRef} · {row.fields.squareMetres} · {row.fields.leadTime} · {row.fields.ukLocation}</p>}<p>{row.fields.message}</p><div className="row-actions"><button onClick={() => void mark(row, 'handled')}>Mark handled</button><button onClick={() => void mark(row, 'spam')}>Mark spam</button></div></div></details>) : <p className="empty-state">The inbox is clear.</p>}</div></section>;
}

function Users({ rows = [], csrf, refresh }: { rows?: SafeUser[]; csrf: string; refresh: () => void }) {
  const [invitation, setInvitation] = useState('');
  const invite = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const result = await jsonRequest<{ invitationUrl: string }>('/api/admin/invitations', { method: 'POST', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ email: data.get('email'), role: data.get('role') }) }); setInvitation(result.invitationUrl); refresh(); };
  return <div className="admin-grid"><section className="admin-panel"><h2>Users</h2>{rows.map((row) => <p key={row.id}><b>{row.email}</b><br/><span>{row.role} · {row.status}</span></p>)}</section><section className="admin-panel"><h2>Invite a user</h2><form onSubmit={invite} className="stack-form"><label>Email<input name="email" type="email" required /></label><label>Role<select name="role"><option value="editor">Editor</option><option value="owner">Owner</option></select></label><button className="button" type="submit">Create one-time link</button></form>{invitation && <div className="invitation"><b>Shown once</b><code>{invitation}</code></div>}</section></div>;
}

function Settings({ settings, csrf }: { settings?: Record<string, string>; csrf: string }) {
  const [saved, setSaved] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); await jsonRequest('/api/admin/settings', { method: 'PUT', headers: { 'x-csrf-token': csrf }, body: JSON.stringify({ form_retention_days: data.get('form_retention_days') }) }); setSaved(true); };
  return <section className="admin-panel narrow"><h2>Settings</h2><form onSubmit={submit} className="stack-form"><label>Form retention (days)<input name="form_retention_days" type="number" min="1" max="730" defaultValue={settings?.form_retention_days ?? '90'} required /></label><button className="button" type="submit">Save settings</button>{saved && <p role="status">Settings saved.</p>}</form><hr/><h3>App destinations</h3><p>Store and web links are deployment configuration. Empty values keep unapproved buttons hidden.</p></section>;
}

export function AdminApp({ path }: AdminProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [data, setData] = useState<unknown>();
  const [loadKey, setLoadKey] = useState(0);
  const section = useMemo(() => path.split('/').filter(Boolean)[1] ?? 'dashboard', [path]);
  useEffect(() => { void jsonRequest<Session>('/api/auth/session').then(setSession).catch(() => setSession(null)); }, []);
  const endpoint = section === 'dashboard' ? 'dashboard' : section;
  useEffect(() => {
    if (!session || section === 'settings' && session.user.role !== 'owner' || section === 'users' && session.user.role !== 'owner') return;
    void jsonRequest(`/api/admin/${endpoint}`).then(setData).catch(() => setData(undefined));
  }, [session, endpoint, section, loadKey]);
  if (path.startsWith('/admin/set-password')) return <SetPassword onLogin={setSession}/>;
  if (session === undefined) return <main className="admin-entry"><div className="admin-login-card"><p className="eyebrow">ROBWEB ADMIN</p><h1>Checking your session.</h1><p>The admin is noindex and requires a secure invitation.</p></div></main>;
  if (!session) return <AdminLogin onLogin={setSession}/>;
  const refresh = () => setLoadKey((value) => value + 1);
  const title = section === 'dashboard' ? 'Dashboard' : section[0].toUpperCase() + section.slice(1);
  return <div className="admin-shell"><aside><a className="admin-brand" href="/admin/">RC <span>Admin</span></a><nav>{adminNav.filter(([href]) => session.user.role === 'owner' || !href.includes('/users') && !href.includes('/settings')).map(([href, label]) => <a key={href} className={path === href || path.startsWith(href) ? 'active' : ''} href={href}>{label}</a>)}</nav><a href="/">View website ↗</a></aside><main><header className="admin-header"><div><p className="eyebrow">ROBIN CLEVETT WEBSITE</p><h1>{title}</h1></div><div><b>{session.user.email}</b><span>{session.user.role}</span></div></header>{section === 'dashboard' && <Dashboard data={data as DashboardSnapshot}/>} {section === 'pages' && <Pages pages={data as PageRecord[]} csrf={session.csrfToken} refresh={refresh}/>} {section === 'media' && <Media rows={data as MediaRecord[]}/>} {section === 'content' && <ContentManager data={data as AdminContentSnapshot} csrf={session.csrfToken} refresh={refresh}/>} {section === 'forms' && <Forms rows={data as FormSubmission[]} csrf={session.csrfToken} refresh={refresh}/>} {section === 'analytics' && <div className="admin-grid"><Ranking title="Top pages" rows={(data as DashboardSnapshot)?.topPages}/><Ranking title="Referrers" rows={(data as DashboardSnapshot)?.referrers}/><Ranking title="Devices" rows={(data as DashboardSnapshot)?.devices}/><Ranking title="Outbound clicks" rows={(data as DashboardSnapshot)?.outbound}/></div>} {section === 'users' && session.user.role === 'owner' && <Users rows={data as SafeUser[]} csrf={session.csrfToken} refresh={refresh}/>} {section === 'settings' && session.user.role === 'owner' && <Settings settings={data as Record<string, string>} csrf={session.csrfToken}/>}</main></div>;
}
