import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/superadmin/plans/init — Initialize default plans if none exist
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const plans = await getSubscriptionService().initializeDefaultPlans();
    return jsonOk({ plans, initialized: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
