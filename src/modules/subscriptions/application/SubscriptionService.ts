import type { Subscription } from '../domain/SubscriptionEntity';
import type { SubscriptionPlan } from '../domain/SubscriptionPlanEntity';
import type { Payment } from '../domain/PaymentEntity';
import type {
  SubscriptionRepository,
  SubscriptionPlanRepository,
  PaymentRepository,
} from '../domain/SubscriptionRepository';
import type { DoctorRepository } from '@/src/modules/doctors/domain/DoctorRepository';
import type {
  PaymentGateway,
  SubscriptionResult,
} from '@/src/shared/domain/ports/PaymentGateway';
import type { SubscriptionStatus } from '@/src/shared/domain/types';

// ============================================================
// Subscription Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreatePaymentPreferenceInput {
  userId: string;       // Doctor Firestore doc ID
  userEmail: string;
  planId: string;       // SubscriptionPlan doc ID
  baseUrl: string;      // For return URLs
}

export interface ProcessWebhookInput {
  paymentId: string;
  topic: string;
  resourceId?: string;           // For subscription_preapproval events
}

export interface ActivateSubscriptionInput {
  subscriptionId: string;
  activatedBy: string;    // Email of activator (superadmin or system)
}

export interface ManualActivationInput {
  doctorId: string;       // Doctor Firestore doc ID
  planId: string;         // SubscriptionPlan doc ID
  activatedBy: string;    // Superadmin email
  overridePrice?: number;
  durationDays?: number;
}

// --- Service ---

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly planRepo: SubscriptionPlanRepository,
    private readonly paymentRepo: PaymentRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  // ========== Plans ==========

  /** List all active subscription plans (pricing page) */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.findActive();
  }

  /** List ALL plans including inactive — superadmin */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.findAll();
  }

  /** Get single plan by ID */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return this.planRepo.findById(planId);
  }

  /** Update a subscription plan — superadmin only */
  async updatePlan(planId: string, data: Partial<SubscriptionPlan>): Promise<void> {
    await this.planRepo.update(planId, { ...data, updatedAt: new Date() });
  }

  /** Initialize default plans if they don't exist */
  async initializeDefaultPlans(): Promise<SubscriptionPlan[]> {
    const existing = await this.planRepo.findAll();
    if (existing.length > 0) return existing;

    const now = new Date();
    const defaults: SubscriptionPlan[] = [
      {
        id: 'plan-free',
        planId: 'plan-free',
        name: 'Plan Free',
        description: 'Comenzá gratis con funcionalidades básicas.',
        price: 0,
        durationDays: 30,
        isActive: true,
        isPopular: false,
        features: ['Perfil profesional', 'Aparecer en búsquedas', 'Sistema de referencias'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan-medium',
        planId: 'plan-medium',
        name: 'Plan Medium',
        description: 'Herramientas completas para gestionar tu consultorio.',
        price: 15000,
        durationDays: 30,
        isActive: true,
        isPopular: true,
        features: ['Todo del Plan Free', 'Gestión de pacientes', 'Agenda de turnos', 'Citas y recordatorios', 'Reseñas de pacientes'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'plan-plus',
        planId: 'plan-plus',
        name: 'Plan Plus',
        description: 'La experiencia completa con videoconsultas.',
        price: 25000,
        durationDays: 30,
        isActive: true,
        isPopular: false,
        features: ['Todo del Plan Medium', 'Video consulta', 'Recetas digitales', 'Soporte prioritario'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const plan of defaults) {
      await this.planRepo.save(plan);
    }

    return defaults;
  }

  /** Manually activate a subscription for a doctor — superadmin */
  async activateManually(input: ManualActivationInput): Promise<void> {
    const plan = await this.planRepo.findById(input.planId);
    if (!plan) throw new Error('Plan not found');

    // Deactivate any existing active subscription
    const existing = await this.subscriptionRepo.findActiveByUserId(input.doctorId);
    if (existing) {
      await this.subscriptionRepo.update(existing.id, {
        status: 'cancelled' as SubscriptionStatus,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const now = new Date();
    const days = input.durationDays ?? plan.durationDays;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const subscription: Subscription = {
      id: `manual_${input.doctorId}_${Date.now()}`,
      userId: input.doctorId,
      planId: plan.id,
      planName: plan.name,
      price: input.overridePrice ?? plan.price,
      status: 'active',
      activationType: 'manual',
      activatedBy: input.activatedBy,
      paymentMethod: 'manual_activation',
      activatedAt: now,
      expiresAt,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.subscriptionRepo.save(subscription);

    // Create payment record
    const payment: Payment = {
      id: `pay_manual_${input.doctorId}_${Date.now()}`,
      subscriptionId: subscription.id,
      status: 'approved',
      paymentMethod: 'manual_activation',
      transactionAmount: input.overridePrice ?? plan.price,
      approvedAt: now,
      activatedBy: input.activatedBy,
      createdAt: now,
      updatedAt: now,
    };
    await this.paymentRepo.save(payment);

    // Update doctor subscription summary
    await this.doctorRepo.update(input.doctorId, {
      subscription: {
        status: 'active',
        planId: plan.id,
        planName: plan.name,
        expiresAt,
      },
      updatedAt: now,
    });
  }

  /** Get all subscriptions — superadmin */
  async listAll(): Promise<Subscription[]> {
    return this.subscriptionRepo.findAll();
  }

  // ========== Checkout Flow ==========

  /** Create a MercadoPago recurring subscription (preapproval) */
  async createRecurringSubscription(
    input: CreatePaymentPreferenceInput,
  ): Promise<SubscriptionResult & { subscriptionId: string }> {
    const plan = await this.planRepo.findById(input.planId);
    if (!plan) throw new Error('Subscription plan not found');
    if (plan.price <= 0) throw new Error('Cannot create payment for free plan');

    const externalReference = `${input.userId}_${plan.id}_${Date.now()}`;
    const baseUrl = input.baseUrl;

    // Cancel any existing MP subscription for this user
    const existingActive = await this.subscriptionRepo.findActiveByUserId(input.userId);
    if (existingActive?.mpSubscriptionId) {
      try {
        await this.paymentGateway.cancelSubscription(existingActive.mpSubscriptionId);
      } catch {
        // If cancellation fails (already cancelled, etc.), continue
      }
    }

    // Create recurring subscription on MercadoPago
    const mpResult = await this.paymentGateway.createSubscription({
      reason: `Salud Libre — ${plan.name} (mensual)`,
      payerEmail: input.userEmail,
      externalReference,
      transactionAmount: plan.price,
      currencyId: 'ARS',
      frequency: 1,
      frequencyType: 'months',
      backUrl: `${baseUrl}/subscription/success`,
      notificationUrl: `${baseUrl}/api/mercadopago/webhook`,
    });

    // Deactivate any existing active subscription
    if (existingActive) {
      await this.subscriptionRepo.update(existingActive.id, {
        status: 'cancelled' as SubscriptionStatus,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create pending subscription record
    const now = new Date();
    const subscription: Subscription = {
      id: '',
      userId: input.userId,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      status: 'inactive',
      activationType: 'mercadopago',
      activatedBy: '',
      paymentMethod: 'mercadopago',
      activatedAt: now,
      expiresAt: new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000),
      deactivatedAt: null,
      mpSubscriptionId: mpResult.subscriptionId,
      createdAt: now,
      updatedAt: now,
    };
    const subscriptionId = await this.subscriptionRepo.add(subscription);

    // Create pending payment record for the first charge
    const payment: Payment = {
      id: '',
      subscriptionId,
      status: 'pending',
      paymentMethod: 'mercadopago',
      transactionAmount: plan.price,
      approvedAt: now,
      activatedBy: 'system',
      createdAt: now,
      updatedAt: now,
    };
    await this.paymentRepo.add(payment);

    return { ...mpResult, subscriptionId };
  }

  /** Process MercadoPago webhook notification (IPN) */
  async processWebhook(input: ProcessWebhookInput): Promise<void> {
    // Handle subscription lifecycle events (authorized, paused, cancelled)
    if (input.topic === 'subscription_preapproval' && input.resourceId) {
      await this.processSubscriptionEvent(input.resourceId);
      return;
    }

    // Handle individual payment events (first charge + renewals)
    if (input.topic === 'payment' && input.paymentId) {
      const paymentInfo = await this.paymentGateway.getPaymentInfo(input.paymentId);
      if (paymentInfo.status !== 'approved') return;

      // Parse external_reference: "userId_planId_timestamp"
      const [userId] = paymentInfo.externalReference.split('_');
      if (!userId) return;

      // Check if this payment belongs to a recurring subscription
      const subscriptions = await this.subscriptionRepo.findByUserId(userId);
      const activeSub = subscriptions.find(s => s.status === 'active' && s.mpSubscriptionId);

      if (activeSub) {
        // This is a renewal payment — extend the subscription
        await this.processRenewalPayment(activeSub, paymentInfo.transactionAmount);
        return;
      }

      // First payment — activate pending subscription
      const pendingSub = subscriptions.find(s => s.status === 'inactive' && s.mpSubscriptionId);
      if (!pendingSub) return;
      await this.activate({ subscriptionId: pendingSub.id, activatedBy: 'mercadopago-webhook' });
    }
  }

  /** Process subscription_preapproval event from MercadoPago */
  private async processSubscriptionEvent(mpSubscriptionId: string): Promise<void> {
    const mpInfo = await this.paymentGateway.getSubscriptionInfo(mpSubscriptionId);
    const sub = await this.subscriptionRepo.findByMpSubscriptionId(mpSubscriptionId);
    if (!sub) return;

    const now = new Date();

    if (mpInfo.status === 'authorized' && sub.status === 'inactive') {
      // Subscription was just authorized — activate it
      await this.activate({ subscriptionId: sub.id, activatedBy: 'mercadopago-webhook' });
    } else if (mpInfo.status === 'paused' || mpInfo.status === 'cancelled') {
      // Subscription was paused or cancelled
      await this.subscriptionRepo.update(sub.id, {
        status: 'cancelled' as SubscriptionStatus,
        deactivatedAt: now,
        updatedAt: now,
      });
      await this.doctorRepo.update(sub.userId, {
        subscription: {
          status: 'cancelled',
          planId: sub.planId,
          planName: sub.planName,
          expiresAt: sub.expiresAt,
        },
        updatedAt: now,
      });
    }
  }

  /** Process a renewal payment — extend subscription by 30 days */
  private async processRenewalPayment(sub: Subscription, amount: number): Promise<void> {
    const now = new Date();
    const currentExpiry = sub.expiresAt > now ? sub.expiresAt : now;
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.subscriptionRepo.update(sub.id, {
      expiresAt: newExpiry,
      updatedAt: now,
    });

    // Log the renewal payment
    const payment: Payment = {
      id: '',
      subscriptionId: sub.id,
      status: 'approved',
      paymentMethod: 'mercadopago',
      transactionAmount: amount,
      approvedAt: now,
      activatedBy: 'mercadopago-renewal',
      createdAt: now,
      updatedAt: now,
    };
    await this.paymentRepo.add(payment);

    // Update doctor's subscription expiry
    await this.doctorRepo.update(sub.userId, {
      subscription: {
        status: 'active',
        planId: sub.planId,
        planName: sub.planName,
        expiresAt: newExpiry,
      },
      updatedAt: now,
    });
  }

  /** Verify subscription status with MercadoPago and sync locally */
  async verifySubscriptionStatus(userId: string): Promise<Subscription | null> {
    const sub = await this.subscriptionRepo.findActiveByUserId(userId);
    if (!sub) return null;

    // If no MP subscription ID, it's manual — just check expiry
    if (!sub.mpSubscriptionId) {
      if (sub.expiresAt <= new Date()) {
        await this.subscriptionRepo.update(sub.id, {
          status: 'expired' as SubscriptionStatus,
          updatedAt: new Date(),
        });
        await this.doctorRepo.update(sub.userId, {
          subscription: { status: 'expired', planId: sub.planId, planName: sub.planName, expiresAt: sub.expiresAt },
          updatedAt: new Date(),
        });
        return null;
      }
      return sub;
    }

    // Verify with MercadoPago
    try {
      const mpInfo = await this.paymentGateway.getSubscriptionInfo(sub.mpSubscriptionId);

      if (mpInfo.status === 'authorized') {
        // Still active — update next payment info if we have it
        return sub;
      }

      if (mpInfo.status === 'paused' || mpInfo.status === 'cancelled') {
        const now = new Date();
        await this.subscriptionRepo.update(sub.id, {
          status: 'cancelled' as SubscriptionStatus,
          deactivatedAt: now,
          updatedAt: now,
        });
        await this.doctorRepo.update(sub.userId, {
          subscription: { status: 'cancelled', planId: sub.planId, planName: sub.planName, expiresAt: sub.expiresAt },
          updatedAt: now,
        });
        return null;
      }

      return sub;
    } catch {
      // If MP API fails, trust local state
      return sub;
    }
  }

  /** Cancel a MercadoPago recurring subscription */
  async cancelRecurring(subscriptionId: string): Promise<void> {
    const sub = await this.subscriptionRepo.findById(subscriptionId);
    if (!sub) throw new Error('Subscription not found');

    // Cancel on MercadoPago side if it's a recurring subscription
    if (sub.mpSubscriptionId) {
      await this.paymentGateway.cancelSubscription(sub.mpSubscriptionId);
    }

    const now = new Date();
    await this.subscriptionRepo.update(subscriptionId, {
      status: 'cancelled' as SubscriptionStatus,
      deactivatedAt: now,
      updatedAt: now,
    });

    await this.doctorRepo.update(sub.userId, {
      subscription: { status: 'cancelled', planId: sub.planId, planName: sub.planName, expiresAt: sub.expiresAt },
      updatedAt: now,
    });
  }

  // ========== Subscription Lifecycle ==========

  /** Activate a subscription (after payment or manual by superadmin) */
  async activate(input: ActivateSubscriptionInput): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const now = new Date();
    await this.subscriptionRepo.update(input.subscriptionId, {
      status: 'active',
      activatedBy: input.activatedBy,
      activatedAt: now,
      updatedAt: now,
    });

    // Update doctor subscription summary
    const plan = await this.planRepo.findById(subscription.planId);
    await this.doctorRepo.update(subscription.userId, {
      verified: true,
      subscription: {
        status: 'active',
        planId: subscription.planId,
        planName: plan?.name ?? subscription.planName,
        expiresAt: subscription.expiresAt,
      },
      updatedAt: now,
    });
  }

  /** Cancel a subscription */
  async cancel(subscriptionId: string): Promise<void> {
    const now = new Date();
    await this.subscriptionRepo.update(subscriptionId, {
      status: 'cancelled',
      deactivatedAt: now,
      updatedAt: now,
    });
  }

  /** Get active subscription for a doctor */
  async getByDoctor(doctorUserId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findActiveByUserId(doctorUserId);
  }

  /** Get all subscriptions for a doctor (history) */
  async getHistory(doctorUserId: string): Promise<Subscription[]> {
    return this.subscriptionRepo.findByUserId(doctorUserId);
  }

  /** Get all payments for a subscription */
  async getPayments(subscriptionId: string): Promise<Payment[]> {
    return this.paymentRepo.findBySubscriptionId(subscriptionId);
  }
}
