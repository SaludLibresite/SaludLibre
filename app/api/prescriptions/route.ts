import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';

// GET /api/prescriptions — List prescriptions (auto-detects doctor vs patient)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    let prescriptions;
    if (user.userType === 'doctor' && user.doctorId) {
      prescriptions = await getPrescriptionService().listByDoctor(user.doctorId);
    } else if (user.patientId) {
      prescriptions = await getPrescriptionService().listByPatient(user.patientId);
    } else {
      return jsonError('No doctor or patient profile found', 400);
    }

    return jsonOk({ prescriptions, total: prescriptions.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/prescriptions — Doctor creates a prescription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.userType !== 'doctor' && user.userType !== 'superadmin') {
      return jsonError('Only doctors can create prescriptions', 403);
    }

    const body = await request.json();
    const prescription = await getPrescriptionService().create({
      appointmentId: body.appointmentId,
      doctorUserId: user.uid,
      patientId: body.patientId,
      medications: body.medications,
      diagnosis: body.diagnosis,
      notes: body.notes,
    });
    return jsonCreated(prescription);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
