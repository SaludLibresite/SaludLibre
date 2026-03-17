import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService, getReferralService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/subscriptions/activate — Superadmin activates a subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'superadmin') {
      return jsonError('Superadmin access required', 403);
    }

    const body = await request.json();
    if (!body.subscriptionId) {
      return jsonError('subscriptionId is required', 400);
    }

    await getSubscriptionService().activate({
      subscriptionId: body.subscriptionId,
      activatedBy: user.uid,
    });

    // Auto-confirm any pending referral for this doctor
    try {
      const referrals = await getReferralService().listByReferred(user.uid);
      for (const ref of referrals) {
        if (ref.status === 'pending') {
          await getReferralService().confirm(ref.id);
        }
      }
    } catch { /* referral confirmation is best-effort */ }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
