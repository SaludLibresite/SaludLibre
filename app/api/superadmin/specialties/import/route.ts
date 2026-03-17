import { NextRequest, NextResponse } from 'next/server';
import { getSpecialtyService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/superadmin/specialties/import — Bulk import specialties
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    if (!Array.isArray(body.specialties)) {
      return jsonError('specialties array is required', 400);
    }

    const result = await getSpecialtyService().importBulk(body.specialties);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
