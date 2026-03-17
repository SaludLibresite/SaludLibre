import { NextRequest } from 'next/server';
import { getPatientService } from '@/src/infrastructure/container';
import { requireAuth, requireRole, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';
import { NextResponse } from 'next/server';

// POST /api/patients — Register new patient
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const patient = await getPatientService().register({
      userId: user.uid,
      email: user.email,
      name: body.name,
      phone: body.phone,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      address: body.address,
      registrationMethod: body.registrationMethod ?? 'manual',
      allergies: body.allergies,
      currentMedications: body.currentMedications,
      medicalHistory: body.medicalHistory,
      insuranceProvider: body.insuranceProvider,
      insuranceNumber: body.insuranceNumber,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      referralCode: body.referralCode,
      selectedDoctorId: body.selectedDoctorId,
      googleDisplayName: body.googleDisplayName,
      googlePhotoUrl: body.googlePhotoUrl,
    });
    return jsonCreated(patient);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// GET /api/patients — Superadmin: list all patients
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'superadmin');
    if (user instanceof NextResponse) return user;

    const patients = await getPatientService().listAll();
    return jsonOk({ patients, total: patients.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
