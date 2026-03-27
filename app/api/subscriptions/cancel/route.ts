import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/subscriptions/cancel — Cancel current recurring subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const service = getSubscriptionService();
    const activeSub = await service.getByDoctor(user.uid);

    if (!activeSub) {
      return jsonError('No active subscription found', 404);
    }

    await service.cancelRecurring(activeSub.id);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
