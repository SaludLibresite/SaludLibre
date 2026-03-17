import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentService, getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/appointments/[id]/status — Update appointment status (doctor only)
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  if (user.userType !== 'doctor' && user.userType !== 'superadmin') {
    return jsonError('Only doctors can update appointment status', 403);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body as { action: string; notes?: string };

    const apt = await getAppointmentService().getById(id);
    if (!apt) return jsonError('Appointment not found', 404);

    if (user.userType === 'doctor' && apt.doctorId !== user.doctorId) {
      return jsonError('Not authorized', 403);
    }

    switch (action) {
      case 'confirm':
        await getAppointmentService().confirm(id);
        break;
      case 'complete':
        await getAppointmentService().complete(id, notes);
        // Delete video room when visit is completed
        try { await getVideoConsultationService().deleteRoom(id); } catch { /* room may not exist */ }
        break;
      case 'reject':
        await getAppointmentService().reject(id, notes);
        break;
      case 'cancel':
        await getAppointmentService().cancel(id, notes);
        break;
      default:
        return jsonError('Invalid action. Use: confirm, complete, reject, cancel', 400);
    }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
