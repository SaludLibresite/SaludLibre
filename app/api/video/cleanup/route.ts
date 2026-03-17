import { NextRequest, NextResponse } from 'next/server';
import { getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/video/cleanup — Clean up expired video rooms
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'superadmin') {
      return jsonError('Superadmin access required', 403);
    }

    const cleaned = await getVideoConsultationService().cleanupExpired();
    return jsonOk({ cleaned });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
