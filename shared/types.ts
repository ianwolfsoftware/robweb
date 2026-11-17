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
export type FormType = 'contact' | 'interest';
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
