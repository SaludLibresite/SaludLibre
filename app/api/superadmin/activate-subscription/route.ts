import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService, getReferralService, getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/superadmin/activate-subscription — Manually activate a subscription for a doctor
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { doctorId, planId, overridePrice, durationDays } = body;

    if (!doctorId || !planId) {
      return jsonError('doctorId and planId are required', 400);
    }

    await getSubscriptionService().activateManually({
      doctorId,
      planId,
      activatedBy: user.email ?? 'superadmin',
      overridePrice: overridePrice !== undefined ? Number(overridePrice) : undefined,
      durationDays: durationDays !== undefined ? Number(durationDays) : undefined,
    });

    // Auto-confirm any pending referral for this doctor
    try {
      const doctor = await getDoctorService().getById(doctorId);
      if (doctor) {
        const referrals = await getReferralService().listByReferred(doctor.userId);
        for (const ref of referrals) {
          if (ref.status === 'pending') {
            await getReferralService().confirm(ref.id);
          }
        }
      }
    } catch { /* referral confirmation is best-effort */ }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
