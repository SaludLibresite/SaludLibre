import { NextRequest, NextResponse } from 'next/server';
import { getReferralService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// PATCH /api/superadmin/referrals/[id] — Manually confirm or reject a referral
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    if (action === 'confirm') {
      await getReferralService().confirm(id);
      return jsonOk({ success: true });
    }

    if (action === 'reject') {
      await getReferralService().reject(id);
      return jsonOk({ success: true });
    }

    return jsonError('Invalid action. Use "confirm" or "reject".', 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
