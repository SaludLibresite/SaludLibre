import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireRole, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// POST /api/doctors/me/photo — Upload profile photo
export async function POST(request: NextRequest) {
  const user = await requireRole(request, 'doctor');
  if (user instanceof NextResponse) return user;

  try {
    if (!user.doctorId) return jsonError('Doctor profile not found', 404);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return jsonError('No file provided', 400);
    if (!ALLOWED_TYPES.includes(file.type)) return jsonError('Only JPG, PNG and WebP are allowed', 400);
    if (file.size > MAX_SIZE) return jsonError('File must be under 5 MB', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await getDoctorService().updateProfilePhoto(user.doctorId, buffer, file.type);

    return jsonOk({ url });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
