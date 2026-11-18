import { z } from 'zod';

const cleanText = (max: number) => z.string().trim().min(1).max(max);

export const publicFormSchema = z.object({
  name: cleanText(120),
  email: z.email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().max(160).optional().default(''),
  message: cleanText(4000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
}).strict();

export const mediaFormSchema = z.object({
  name: cleanText(120),
  email: z.email().max(254),
  phone: z.string().trim().max(40).optional().default(''),
  organisation: z.string().trim().max(160).optional().default(''),
  enquiryType: cleanText(80),
  deadline: z.string().trim().max(120).optional().default(''),
  subject: cleanText(160),
  message: cleanText(4000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
}).strict();

export const claddingFormSchema = z.object({
  claddingRef: cleanText(120),
  squareMetres: cleanText(80),
  leadTime: cleanText(120),
  ukLocation: cleanText(180),
  name: cleanText(120),
  email: z.email().max(254),
  phone: cleanText(40),
  message: z.string().trim().max(4000).optional().default(''),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
}).strict();

export const visitSchema = z.object({
  path: z.string().trim().startsWith('/').max(240).regex(/^\/[A-Za-z0-9/_-]*$/),
  referrerHost: z.string().trim().max(255).regex(/^[A-Za-z0-9.-]*$/).default('direct'),
  deviceClass: z.enum(['phone', 'tablet', 'desktop', 'other']),
}).strict();

export const passwordSchema = z.string().min(14).max(200)
  .regex(/[a-z]/, 'Add a lower-case letter')
  .regex(/[A-Z]/, 'Add an upper-case letter')
  .regex(/[0-9]/, 'Add a number');

export const setPasswordSchema = z.object({ token: z.string().min(32).max(256), password: passwordSchema }).strict();
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) }).strict();
export const inviteSchema = z.object({ email: z.email().max(254), role: z.enum(['owner', 'editor']) }).strict();
export const formStatusSchema = z.object({ status: z.enum(['new', 'handled', 'spam']) }).strict();

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
