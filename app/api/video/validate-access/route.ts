import { NextRequest, NextResponse } from 'next/server';
import { getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/video/validate-access — Validate user access to video room
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    if (!body.roomName) {
      return jsonError('roomName is required', 400);
    }

    const userRole = user.userType === 'doctor' ? 'doctor' : 'patient';
    const profileId = userRole === 'doctor' ? user.doctorId : user.patientId;
    const result = await getVideoConsultationService().validateAccess(
      body.roomName,
      profileId ?? user.uid,
      userRole,
    );

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
