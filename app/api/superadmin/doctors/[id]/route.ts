import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/doctors/[id] — Get doctor details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const doctor = await getDoctorService().getById(id);
    if (!doctor) return jsonError('Doctor not found', 404);

    return jsonOk({ doctor });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PATCH /api/superadmin/doctors/[id] — Update a doctor (superadmin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();

    if (body.action === 'verify') {
      await getDoctorService().verify(id);
    } else {
      await getDoctorService().updateAsAdmin(id, body);
    }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/superadmin/doctors/[id] — Delete a doctor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    await getDoctorService().delete(id);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
