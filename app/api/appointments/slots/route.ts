import { NextRequest } from 'next/server';
import { getAppointmentService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/appointments/slots?doctorId=X&start=ISO&end=ISO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const doctorId = searchParams.get('doctorId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const duration = searchParams.get('duration');

    if (!doctorId || !start || !end) {
      return jsonError('doctorId, start, and end query params required');
    }

    const slots = await getAppointmentService().getAvailableSlots(
      doctorId,
      new Date(start),
      new Date(end),
      duration ? parseInt(duration) : 30,
    );

    return jsonOk({ slots, total: slots.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
