import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Subscription } from '../domain/SubscriptionEntity';
import type { SubscriptionPlan } from '../domain/SubscriptionPlanEntity';
import type { Payment } from '../domain/PaymentEntity';
import type {
  SubscriptionRepository,
  SubscriptionPlanRepository,
  PaymentRepository,
} from '../domain/SubscriptionRepository';
import type {
  SubscriptionStatus,
  ActivationType,
  PaymentMethod,
  PaymentStatus,
} from '@/src/shared/domain/types';

// ===================== Subscription =====================

const subscriptionConverter: FirestoreDataConverter<Subscription> = {
  toFirestore(sub: Subscription) {
    return {
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      price: sub.price,
      status: sub.status,
      activationType: sub.activationType,
      activatedBy: sub.activatedBy,
      paymentMethod: sub.paymentMethod,
      activatedAt: Timestamp.fromDate(sub.activatedAt),
      expiresAt: Timestamp.fromDate(sub.expiresAt),
      deactivatedAt: sub.deactivatedAt ? Timestamp.fromDate(sub.deactivatedAt) : null,
      createdAt: Timestamp.fromDate(sub.createdAt),
      updatedAt: Timestamp.fromDate(sub.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Subscription {
    const d = snap.data();
    return {
      id: snap.id,
      userId: d.userId ?? '',
      planId: d.planId ?? '',
      planName: d.planName ?? '',
      price: d.price ?? 0,
      status: (d.status ?? 'inactive') as SubscriptionStatus,
      activationType: (d.activationType ?? 'manual') as ActivationType,
      activatedBy: d.activatedBy ?? '',
      paymentMethod: (d.paymentMethod ?? 'manual_activation') as PaymentMethod,
      activatedAt: d.activatedAt?.toDate?.() ?? new Date(),
      expiresAt: d.expiresAt?.toDate?.() ?? new Date(),
      deactivatedAt: d.deactivatedAt?.toDate?.() ?? null,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreSubscriptionRepository
  extends BaseRepository<Subscription>
  implements SubscriptionRepository
{
  protected collectionName = 'v2_subscriptions';
  protected converter = subscriptionConverter;

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.findWhere('userId', userId);
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const results = await this.findAll([
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ]);
    return results[0] ?? null;
  }
}

// ===================== SubscriptionPlan =====================

const planConverter: FirestoreDataConverter<SubscriptionPlan> = {
  toFirestore(plan: SubscriptionPlan) {
    return {
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      features: plan.features,
      createdAt: Timestamp.fromDate(plan.createdAt),
      updatedAt: Timestamp.fromDate(plan.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): SubscriptionPlan {
    const d = snap.data();
    return {
      id: snap.id,
      planId: d.planId ?? '',
      name: d.name ?? '',
      description: d.description ?? '',
      price: d.price ?? 0,
      durationDays: d.durationDays ?? 30,
      isActive: d.isActive ?? true,
      isPopular: d.isPopular ?? false,
      features: Array.isArray(d.features) ? d.features : [],
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreSubscriptionPlanRepository
  extends BaseRepository<SubscriptionPlan>
  implements SubscriptionPlanRepository
{
  protected collectionName = 'v2_subscription_plans';
  protected converter = planConverter;

  async findByPlanId(planId: string): Promise<SubscriptionPlan | null> {
    return this.findFirst('planId', planId);
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return this.findWhere('isActive', true);
  }
}

// ===================== Payment =====================

const paymentConverter: FirestoreDataConverter<Payment> = {
  toFirestore(payment: Payment) {
    return {
      subscriptionId: payment.subscriptionId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionAmount: payment.transactionAmount,
      approvedAt: Timestamp.fromDate(payment.approvedAt),
      activatedBy: payment.activatedBy,
      createdAt: Timestamp.fromDate(payment.createdAt),
      updatedAt: Timestamp.fromDate(payment.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Payment {
    const d = snap.data();
    return {
      id: snap.id,
      subscriptionId: d.subscriptionId ?? '',
      status: (d.status ?? 'pending') as PaymentStatus,
      paymentMethod: (d.paymentMethod ?? 'manual_activation') as PaymentMethod,
      transactionAmount: d.transactionAmount ?? 0,
      approvedAt: d.approvedAt?.toDate?.() ?? new Date(),
      activatedBy: d.activatedBy ?? '',
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestorePaymentRepository
  extends BaseRepository<Payment>
  implements PaymentRepository
{
  protected collectionName = 'v2_payments';
  protected converter = paymentConverter;

  async findBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    return this.findWhere('subscriptionId', subscriptionId);
  }
}
