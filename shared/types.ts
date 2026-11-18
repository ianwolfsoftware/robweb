export const sectionTypes = [
  'Hero',
  'FeatureList',
  'Proof',
  'ShopCta',
  'AppCta',
  'VideoGrid',
  'Faq',
  'ContactCta',
  'Text',
  'Image',
] as const;

export type SectionType = (typeof sectionTypes)[number];
export type UserRole = 'owner' | 'editor';
export type FormType = 'contact' | 'interest' | 'media' | 'cladding';
export type FormStatus = 'new' | 'handled' | 'spam';
export type DeviceClass = 'phone' | 'tablet' | 'desktop' | 'other';

export type ContentSection = {
  id: string;
  type: SectionType;
  position: number;
  data: Record<string, string | number | boolean | string[]>;
};

export type PublicFormFields = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  consent: boolean;
  organisation?: string;
  enquiryType?: string;
  deadline?: string;
  claddingRef?: string;
  squareMetres?: string;
  leadTime?: string;
  ukLocation?: string;
};

export type FormSubmission = {
  id: string;
  type: FormType;
  fields: PublicFormFields;
  status: FormStatus;
  createdAt: string;
  handledAt: string | null;
  handledBy: string | null;
};

export type AnalyticsInput = {
  day: string;
  path: string;
  referrerHost: string;
  deviceClass: DeviceClass;
};

export type AnalyticsRow = AnalyticsInput & { visits: number };
export type OutboundRow = { day: string; sourcePath: string; target: string; count: number };

export type DashboardSnapshot = {
  visits: number;
  forms: Record<FormStatus, number>;
  topPages: Array<{ label: string; count: number }>;
  referrers: Array<{ label: string; count: number }>;
  devices: Array<{ label: string; count: number }>;
  outbound: Array<{ label: string; count: number }>;
};

export type SafeUser = {
  id: string;
  email: string;
  role: UserRole;
  status: 'invited' | 'active' | 'disabled';
  createdAt: string;
};

export type UserRecord = SafeUser & { passwordHash: string | null };
export type SessionRecord = { tokenHash: string; userId: string; csrfToken: string; expiresAt: string };
export type InvitationRecord = { tokenHash: string; userId: string; expiresAt: string; usedAt: string | null };

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  sections: ContentSection[];
  currentRevision: number;
  updatedAt: string;
};

export type MediaRecord = {
  id: string;
  path: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  bytes: number;
  width: number;
  height: number;
  altText: string;
  createdAt: string;
};

export const contentItemKinds = ['youtube', 'episode', 'interview', 'press', 'partner', 'product'] as const;
export type ContentItemKind = (typeof contentItemKinds)[number];

export type ContentControl = {
  kind: ContentItemKind;
  key: string;
  hidden: boolean;
  pinned: boolean;
  position: number | null;
  updatedAt: string;
};

export type MediaFeedItem = {
  key: string;
  kind: Exclude<ContentItemKind, 'partner' | 'product'>;
  title: string;
  url: string;
  published: string;
  outlet: string;
  description?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  duration?: string;
  pinned?: boolean;
};

export type PartnerRecord = {
  id: string;
  name: string;
  url: string;
  logoPath: string | null;
  evidenceUrl: string;
  position: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MediaFeedSnapshot = {
  fetchedAt: string;
  youtube: MediaFeedItem[];
  episodes: MediaFeedItem[];
  interviews: MediaFeedItem[];
  press: MediaFeedItem[];
  partners: PartnerRecord[];
  counts: { youtube: number; episodes: number };
  sources: { youtube: string; podcast: string; apple: string; fixRadio: string };
};

export type AdminContentItem = {
  kind: ContentItemKind;
  key: string;
  title: string;
  meta: string;
  hidden: boolean;
  pinned: boolean;
  position: number | null;
};

export type AdminContentSnapshot = {
  items: AdminContentItem[];
  partners: PartnerRecord[];
};
