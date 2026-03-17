import type { Timestamps } from '@/src/shared/domain/types';

// ============================================================
// SubscriptionPlan Entity — V2 Domain Model
// ============================================================

export interface SubscriptionPlan extends Timestamps {
  id: string;                           // Firestore document ID
  planId: string;                       // Human-readable plan ID (e.g. "plan-free")
  name: string;
  description: string;
  price: number;
  durationDays: number;                 // was "duration"
  isActive: boolean;
  isPopular: boolean;
  features: string[];
}
