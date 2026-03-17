import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/doctors — List all doctors (including unverified)
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const doctors = await getDoctorService().listAll();
    return jsonOk({ doctors, total: doctors.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
