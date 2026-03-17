import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireAuth, requireRole, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/subscriptions/plans — Public: list subscription plans
export async function GET() {
  try {
    const plans = await getSubscriptionService().getPlans();
    return jsonOk({ plans });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
