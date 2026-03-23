import type { Subscription } from './SubscriptionEntity';
import type { SubscriptionPlan } from './SubscriptionPlanEntity';
import type { Payment } from './PaymentEntity';

// ============================================================
// Subscription Repository Ports (Interfaces)
// ============================================================

export interface SubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription[]>;
  findActiveByUserId(userId: string): Promise<Subscription | null>;
  findAll(): Promise<Subscription[]>;
  save(subscription: Subscription): Promise<void>;
  add(subscription: Subscription): Promise<string>;
  update(id: string, data: Partial<Subscription>): Promise<void>;
}

export interface SubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlan | null>;
  findByPlanId(planId: string): Promise<SubscriptionPlan | null>;
  findAll(): Promise<SubscriptionPlan[]>;
  findActive(): Promise<SubscriptionPlan[]>;
  save(plan: SubscriptionPlan): Promise<void>;
  update(id: string, data: Partial<SubscriptionPlan>): Promise<void>;
}

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findBySubscriptionId(subscriptionId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  add(payment: Payment): Promise<string>;
}
