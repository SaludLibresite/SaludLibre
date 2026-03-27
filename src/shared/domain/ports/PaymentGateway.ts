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

// --- Recurring Subscription (Preapproval) ---

export interface CreateSubscriptionParams {
  reason: string;                  // e.g. "Salud Libre — Plan Medium"
  payerEmail: string;
  externalReference: string;
  transactionAmount: number;
  currencyId: string;              // e.g. "ARS"
  frequency: number;              // e.g. 1
  frequencyType: 'months' | 'days';
  backUrl: string;
  notificationUrl: string;
}

export interface SubscriptionResult {
  subscriptionId: string;          // MercadoPago preapproval ID
  initPoint: string;               // URL to redirect user for authorization
  status: string;
}

export interface SubscriptionInfo {
  id: string;
  status: 'authorized' | 'pending' | 'paused' | 'cancelled';
  payerEmail: string;
  externalReference: string;
  transactionAmount: number;
  nextPaymentDate: Date | null;
  lastModified: Date | null;
}

export interface PaymentGateway {
  createPreference(params: CreatePreferenceParams): Promise<PaymentPreferenceResult>;
  getPaymentInfo(paymentId: string): Promise<PaymentInfo>;
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  getSubscriptionInfo(subscriptionId: string): Promise<SubscriptionInfo>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
