import type { Timestamps, PaymentMethod, PaymentStatus } from '@/src/shared/domain/types';

// ============================================================
// Payment Entity — V2 Domain Model
// ============================================================

export interface Payment extends Timestamps {
  id: string;                           // Firestore document ID
  subscriptionId: string;              // Reference to Subscription
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionAmount: number;
  approvedAt: Date;
  activatedBy: string;                 // Email or system identifier
}
