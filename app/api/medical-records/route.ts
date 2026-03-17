import { NextRequest, NextResponse } from 'next/server';
import { getMedicalRecordService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import type { DocumentCategory } from '@/src/shared/domain/types';

// GET /api/medical-records — List medical records for a patient
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { searchParams } = request.nextUrl;
    const patientId = searchParams.get('patientId') ?? user.patientId;
    const category = searchParams.get('category') as DocumentCategory | undefined;

    if (!patientId) {
      return jsonError('patientId is required', 400);
    }

    // Only allow own records for patients, or doctor/superadmin access
    if (user.userType === 'patient' && patientId !== user.patientId) {
      return jsonError('Insufficient permissions', 403);
    }

    const documents = await getMedicalRecordService().listByPatient(patientId, category);
    const summary = await getMedicalRecordService().getSummary(patientId);

    return jsonOk({ documents, summary, total: documents.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
