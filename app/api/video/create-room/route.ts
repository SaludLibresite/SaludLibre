import { NextRequest, NextResponse } from 'next/server';
import { getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';

// POST /api/video/create-room — Create video consultation room
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'doctor') {
      return jsonError('Only doctors can create video rooms', 403);
    }

    const body = await request.json();
    const room = await getVideoConsultationService().createRoom({
      appointmentId: body.appointmentId,
      doctorId: body.doctorId ?? user.doctorId!,
      doctorName: body.doctorName,
      patientId: body.patientId,
      patientName: body.patientName,
      scheduledAt: new Date(body.scheduledAt),
    });

    return jsonCreated(room);
  } catch (error) {
    console.error('[create-room] Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
