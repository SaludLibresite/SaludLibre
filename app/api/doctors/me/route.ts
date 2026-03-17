import { NextRequest } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireRole, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { NextResponse } from 'next/server';

// GET /api/doctors/me — Authenticated doctor profile
export async function GET(request: NextRequest) {
  const user = await requireRole(request, 'doctor');
  if (user instanceof NextResponse) return user;

  try {
    const doctor = await getDoctorService().getByUserId(user.uid);
    if (!doctor) return jsonError('Doctor profile not found', 404);
    return jsonOk(doctor);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PATCH /api/doctors/me — Update own doctor profile
export async function PATCH(request: NextRequest) {
  const user = await requireRole(request, 'doctor');
  if (user instanceof NextResponse) return user;

  try {
    if (!user.doctorId) return jsonError('Doctor profile not found', 404);

    const body = await request.json();
    await getDoctorService().updateProfile(user.doctorId, body);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
