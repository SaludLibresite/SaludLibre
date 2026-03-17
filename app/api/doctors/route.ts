import { NextRequest } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/doctors — Public: list verified doctors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const specialty = searchParams.get('specialty') ?? undefined;
    const online = searchParams.get('online');

    const doctors = await getDoctorService().listVerified({
      specialty,
      onlineConsultation: online === 'true' ? true : undefined,
    });

    return jsonOk({
      doctors,
      total: doctors.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
