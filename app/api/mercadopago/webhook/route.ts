import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/mercadopago/webhook — MercadoPago IPN webhook
// No auth required — validated via HMAC-SHA256 signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate HMAC signature if secret is configured
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const xSignature = request.headers.get('x-signature') ?? '';
      const xRequestId = request.headers.get('x-request-id') ?? '';

      const parts = Object.fromEntries(
        xSignature.split(',').map((part) => {
          const [key, ...rest] = part.trim().split('=');
          return [key, rest.join('=')];
        }),
      );

      const ts = parts['ts'] ?? '';
      const v1 = parts['v1'] ?? '';

      const manifest = `id:${body.data?.id ?? body.id};request-id:${xRequestId};ts:${ts};`;
      const computed = createHmac('sha256', webhookSecret).update(manifest).digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      if (
        computed.length !== v1.length ||
        !timingSafeEqual(Buffer.from(computed), Buffer.from(v1))
      ) {
        return jsonError('Invalid signature', 401);
      }
    }

    // Process the webhook
    const topic = body.type ?? body.topic;
    const paymentId = String(body.data?.id ?? body.id ?? '');

    if (topic === 'payment' && paymentId) {
      await getSubscriptionService().processWebhook({
        paymentId,
        topic,
      });
    }

    return jsonOk({ received: true });
  } catch (error) {
    // Always return 200 to prevent MercadoPago from retrying
    console.error('[MercadoPago Webhook Error]', error);
    return jsonOk({ received: true, error: 'processing_failed' });
  }
}
