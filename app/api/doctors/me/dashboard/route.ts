import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireRole, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/doctors/me/dashboard — Doctor dashboard stats
export async function GET(request: NextRequest) {
  const user = await requireRole(request, 'doctor');
  if (user instanceof NextResponse) return user;

  try {
    if (!user.doctorId) return jsonError('Doctor profile not found', 404);
    const stats = await getDoctorService().getDashboardStats(user.doctorId);
    return jsonOk(stats);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
