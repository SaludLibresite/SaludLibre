import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService, getDoctorService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

// Maps any legacy planId / planName / price to 'free' | 'medium' | 'plus'
// planId/planName take precedence over price so embedded doctor docs (price=0) map correctly.
function normalizePlanTier(planId: string, planName: string, price: number): 'free' | 'medium' | 'plus' {
  const idMap: Record<string, 'free' | 'medium' | 'plus'> = {
    free: 'free', medium: 'medium', plus: 'plus',
    'plan-free': 'free', 'plan-medium': 'medium', 'plan-plus': 'plus',
  };
  const idKey = planId?.toLowerCase();
  if (idMap[idKey]) return idMap[idKey];
  const lower = planName?.toLowerCase() ?? '';
  if (lower.includes('plus') || lower.includes('premium')) return 'plus';
  if (lower.includes('medium') || lower.includes('medio')) return 'medium';
  if (lower.includes('free') || lower.includes('gratis') || price === 0) return 'free';
  return 'free';
}

// GET /api/subscriptions/me — Get current subscription for authenticated doctor
// Checks v2_subscriptions first (with MP verification), then falls back to legacy.
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    // 1. Try v2 subscriptions — verifies status with MercadoPago if recurring
    const v2Sub = await getSubscriptionService().verifySubscriptionStatus(user.uid);
    if (v2Sub) {
      return jsonOk({ subscription: v2Sub });
    }

    // 2. Fall back to legacy `subscriptions` collection
    const snap = await adminDb
      .collection('subscriptions')
      .where('userId', '==', user.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snap.empty) {
      // 3. Fall back to subscription embedded in the v2_doctors document
      const doctor = await getDoctorService().getByUserId(user.uid);
      if (doctor?.subscription?.status === 'active') {
        const sub = doctor.subscription;
        const expiresAt = sub.expiresAt ?? null;
        if (!expiresAt || expiresAt > new Date()) {
          const tier = normalizePlanTier(sub.planId ?? '', sub.planName ?? '', 0);
          return jsonOk({
            subscription: {
              id: doctor.id,
              planId: tier,
              planName: sub.planName || tier,
              status: 'active',
              price: 0,
              expiresAt: expiresAt?.toISOString() ?? null,
              _source: 'doctor_doc',
            },
          });
        }
      }
      return jsonOk({ subscription: null });
    }

    const doc = snap.docs[0];
    const d = doc.data();

    // Respect expiration date
    const expiresAt: Date | null = d.expiresAt?.toDate?.() ?? null;
    if (expiresAt && expiresAt <= new Date()) {
      return jsonOk({ subscription: null });
    }

    const planId: string = d.planId ?? '';
    const planName: string = d.planName ?? '';
    const price: number = d.price ?? 0;
    const tier = normalizePlanTier(planId, planName, price);
    const displayName = tier === 'plus' ? 'Plus' : tier === 'medium' ? 'Medium' : 'Free';

    return jsonOk({
      subscription: {
        id: doc.id,
        planId: tier,
        planName: planName || displayName,
        status: 'active',
        price,
        activatedAt: d.activatedAt?.toDate?.()?.toISOString() ?? null,
        expiresAt: expiresAt?.toISOString() ?? null,
        _source: 'legacy',
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
