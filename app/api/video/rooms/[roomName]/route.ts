import { NextRequest, NextResponse } from 'next/server';
import { getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/video/rooms/[roomName] — Get room info for joining
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { roomName } = await params;
    if (!roomName) {
      return jsonError('roomName is required', 400);
    }

    const userRole = user.userType === 'doctor' ? 'doctor' : user.userType === 'superadmin' ? 'doctor' : 'patient';
    // validateAccess compares against doctorId/patientId (Firestore doc IDs, not auth UIDs)
    const profileId = userRole === 'doctor' ? user.doctorId : user.patientId;

    // Superadmins can always join — skip access check
    if (user.userType === 'superadmin') {
      const service = getVideoConsultationService();
      // Use validateAccess just to find the room URL
      const consultation = await service.getByRoomName(roomName);
      if (!consultation) {
        return jsonError('Room not found', 404);
      }
      if (consultation.status === 'ended' || consultation.status === 'expired') {
        return jsonError('Room is no longer active', 403);
      }
      return jsonOk({ url: consultation.roomUrl });
    }

    if (!profileId) {
      return jsonError('User profile not found', 403);
    }

    const result = await getVideoConsultationService().validateAccess(
      roomName,
      profileId,
      userRole as 'doctor' | 'patient',
    );

    if (!result.allowed) {
      return jsonError(result.reason ?? 'No se puede acceder a la sala', 403);
    }

    return jsonOk({ url: result.roomUrl });
  } catch (error) {
    console.error('[rooms/get] Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/video/rooms/[roomName] — Delete room (doctor only, roomName = appointmentId here)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'doctor') {
      return jsonError('Only doctors can delete video rooms', 403);
    }

    const { roomName: appointmentId } = await params;
    if (!appointmentId) {
      return jsonError('appointmentId is required', 400);
    }

    await getVideoConsultationService().deleteRoom(appointmentId);
    return jsonOk({ deleted: true });
  } catch (error) {
    console.error('[rooms/delete] Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
