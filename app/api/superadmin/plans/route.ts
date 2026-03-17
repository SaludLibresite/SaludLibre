import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/plans — List all subscription plans
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const plans = await getSubscriptionService().getPlans();
    return jsonOk({ plans });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
