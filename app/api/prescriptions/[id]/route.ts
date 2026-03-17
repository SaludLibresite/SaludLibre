import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/prescriptions/[id] — Get prescription by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const prescription = await getPrescriptionService().getById(id);
    if (!prescription) return jsonError('Prescription not found', 404);

    // Verify ownership
    const isDoctor = user.userType === 'doctor' && prescription.doctorId === user.doctorId;
    const isPatient = user.patientId && prescription.patientId === user.patientId;
    const isSuperadmin = user.userType === 'superadmin';

    if (!isDoctor && !isPatient && !isSuperadmin) {
      return jsonError('Insufficient permissions', 403);
    }

    return jsonOk(prescription);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/prescriptions/[id] — Delete prescription (doctor only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'doctor' && user.userType !== 'superadmin') {
      return jsonError('Only doctors can delete prescriptions', 403);
    }

    const { id } = await params;
    await getPrescriptionService().delete(id);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
