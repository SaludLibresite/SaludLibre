import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// PATCH /api/superadmin/plans/[id] — Update a subscription plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();
    await getSubscriptionService().updatePlan(id, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
