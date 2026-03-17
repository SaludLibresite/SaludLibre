import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

// GET /api/patients/me — Get own patient profile (v2 + legacy supplement)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const patient = await getPatientService().getByUserId(user.uid);
    if (!patient) return jsonError('Patient profile not found', 404);

    // Supplement with legacy fields (bloodType, etc.) not present in v2 entity
    let bloodType = '';
    const legacySnap = await adminDb
      .collection('patients')
      .where('userId', '==', user.uid)
      .limit(1)
      .get();
    if (!legacySnap.empty) {
      bloodType = legacySnap.docs[0].data().bloodType ?? '';
    }

    return jsonOk({ ...patient, bloodType });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PATCH /api/patients/me — Update own patient profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const patient = await getPatientService().getByUserId(user.uid);
    if (!patient) return jsonError('Patient profile not found', 404);

    const body = await request.json();

    // Save to v2
    await getPatientService().updateProfile(patient.id, body);

    // If bloodType provided, persist it to legacy patients collection too
    if (typeof body.bloodType === 'string') {
      const legacySnap = await adminDb
        .collection('patients')
        .where('userId', '==', user.uid)
        .limit(1)
        .get();
      if (!legacySnap.empty) {
        await legacySnap.docs[0].ref.update({ bloodType: body.bloodType });
      }
    }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
