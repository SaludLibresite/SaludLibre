import type { Timestamps, SubscriptionStatus, ActivationType, PaymentMethod } from '@/src/shared/domain/types';

// ============================================================
// Subscription Entity — V2 Domain Model
// ============================================================

export interface Subscription extends Timestamps {
  id: string;                           // Firestore document ID
  userId: string;                       // Doctor Firestore doc ID (subscriptions are for doctors)
  planId: string;                       // Reference to SubscriptionPlan
  planName: string;                     // Denormalized for display
  price: number;

  // Lifecycle
  status: SubscriptionStatus;
  activationType: ActivationType;
  activatedBy: string;                  // Email of activator (superadmin or system)
  paymentMethod: PaymentMethod;
  activatedAt: Date;
  expiresAt: Date;
  deactivatedAt: Date | null;

  // MercadoPago recurring subscription
  mpSubscriptionId?: string;            // MercadoPago preapproval ID for recurring billing
}
