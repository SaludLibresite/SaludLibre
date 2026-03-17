import type {
  EmailService,
  SendEmailParams,
} from '@/src/shared/domain/ports/EmailService';

// ============================================================
// Resend Email Service — Infrastructure implementation
// Uses Resend REST API directly (no SDK dependency)
// Requires env: RESEND_API_KEY, EMAIL_FROM
// ============================================================

export class ResendEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly baseUrl = 'https://api.resend.com';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY environment variable is required');
    this.apiKey = apiKey;
    this.from = process.env.EMAIL_FROM ?? 'Salud Libre <noreply@email.jhernandez.mx>';
  }

  async send(params: SendEmailParams): Promise<{ id: string }> {
    const body: Record<string, unknown> = {
      from: this.from,
      to: [params.to.email],
      subject: params.subject,
      html: params.html,
    };

    if (params.attachments?.length) {
      body.attachments = params.attachments.map(a => ({
        filename: a.filename,
        content: a.content.toString('base64'),
        type: a.contentType,
      }));
    }

    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as { id: string };
    return { id: data.id };
  }
}
