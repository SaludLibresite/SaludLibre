import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/subscriptions — List all subscriptions with doctor info
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const subscriptions = await getSubscriptionService().listAll();
    const doctors = await getDoctorService().listAll();
    const doctorMap = new Map(doctors.map(d => [d.id, d]));

    const enriched = subscriptions.map(sub => {
      const doc = doctorMap.get(sub.userId);
      return {
        id: sub.id,
        doctorId: sub.userId,
        doctorName: doc?.name ?? 'Desconocido',
        doctorEmail: doc?.email ?? '',
        tier: sub.planName?.toLowerCase().includes('plus') ? 'plus'
            : sub.planName?.toLowerCase().includes('medium') ? 'medium'
            : 'free',
        planName: sub.planName,
        status: sub.status,
        price: sub.price,
        activationType: sub.activationType,
        startDate: sub.activatedAt?.toISOString?.() ?? '',
        endDate: sub.expiresAt?.toISOString?.() ?? '',
      };
    });

    return jsonOk({ subscriptions: enriched });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
