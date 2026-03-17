// ============================================================
// Email Service Port — Hexagonal boundary for email delivery
// Infrastructure implementations: Resend, SendGrid, etc.
// ============================================================

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailParams {
  to: EmailRecipient;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailService {
  send(params: SendEmailParams): Promise<{ id: string }>;
}
