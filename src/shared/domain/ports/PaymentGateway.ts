// ============================================================
// Payment Gateway Port — Hexagonal boundary for payment processing
// Infrastructure implementations: MercadoPago, Stripe, etc.
// ============================================================

export interface PaymentPreferenceItem {
  title: string;
  unitPrice: number;
  quantity: number;
}

export interface CreatePreferenceParams {
  items: PaymentPreferenceItem[];
  payerEmail: string;
  externalReference: string;       // e.g. "userId_planId_timestamp"
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;               // Production checkout URL
  sandboxInitPoint: string;        // Sandbox checkout URL
}

export interface PaymentInfo {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'refunded';
  statusDetail: string;
  transactionAmount: number;
  payerEmail: string;
  externalReference: string;
  approvedAt: Date | null;
}

export interface PaymentGateway {
  createPreference(params: CreatePreferenceParams): Promise<PaymentPreferenceResult>;
  getPaymentInfo(paymentId: string): Promise<PaymentInfo>;
}
