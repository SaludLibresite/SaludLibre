import type {
  PaymentGateway,
  CreatePreferenceParams,
  PaymentPreferenceResult,
  PaymentInfo,
} from '@/src/shared/domain/ports/PaymentGateway';

// ============================================================
// MercadoPago Gateway — Infrastructure implementation
// Uses MercadoPago REST API directly (no SDK dependency)
// Requires env: MERCADOPAGO_ACCESS_TOKEN
// ============================================================

export class MercadoPagoGateway implements PaymentGateway {
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN environment variable is required');
    this.accessToken = token;
  }

  async createPreference(params: CreatePreferenceParams): Promise<PaymentPreferenceResult> {
    const body = {
      items: params.items.map(item => ({
        title: item.title,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        currency_id: 'ARS',
      })),
      payer: { email: params.payerEmail },
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      notification_url: params.notificationUrl,
      auto_return: 'approved',
    };

    const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MercadoPago API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    };
  }

  async getPaymentInfo(paymentId: string): Promise<PaymentInfo> {
    const response = await fetch(`${this.baseUrl}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MercadoPago API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      id: number;
      status: string;
      status_detail: string;
      transaction_amount: number;
      payer: { email: string };
      external_reference: string;
      date_approved: string | null;
    };

    const statusMap: Record<string, PaymentInfo['status']> = {
      approved: 'approved',
      pending: 'pending',
      rejected: 'rejected',
      refunded: 'refunded',
    };

    return {
      id: String(data.id),
      status: statusMap[data.status] ?? 'rejected',
      statusDetail: data.status_detail,
      transactionAmount: data.transaction_amount,
      payerEmail: data.payer?.email ?? '',
      externalReference: data.external_reference ?? '',
      approvedAt: data.date_approved ? new Date(data.date_approved) : null,
    };
  }
}
