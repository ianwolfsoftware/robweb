import nodemailer from 'nodemailer';
import type { FormSubmission } from '../shared/types.js';
import type { AppConfig } from './config.js';

export interface NotificationTransport { formReceived(submission: FormSubmission): Promise<void> }

export function createNotificationTransport(config: AppConfig): NotificationTransport {
  if (config.NOTIFICATION_TRANSPORT === 'disabled') return { async formReceived() {} };
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD || !config.FORM_NOTIFICATION_TO) {
    throw new Error('SMTP notification transport is enabled but its private configuration is incomplete');
  }
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
  });
  return {
    async formReceived(submission) {
      await transport.sendMail({
        from: config.SMTP_USER,
        to: config.FORM_NOTIFICATION_TO,
        subject: `Robweb ${submission.type} form received`,
        text: `A new ${submission.type} submission is available in the Robweb admin inbox. Reference: ${submission.id}`,
      });
    },
  };
}
