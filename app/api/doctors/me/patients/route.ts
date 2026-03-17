import { NextRequest, NextResponse } from 'next/server';
import { requireRole, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

// GET /api/doctors/me/patients — List patients who have had an appointment with the authenticated doctor
export async function GET(request: NextRequest) {
  const user = await requireRole(request, 'doctor');
  if (user instanceof NextResponse) return user;

  if (!user.doctorId) return jsonError('Doctor profile not found', 404);

  try {
    // 1. Get all appointments for this doctor from v2 and legacy collections
    const [v2Snap, legacySnap] = await Promise.all([
      adminDb.collection('v2_appointments').where('doctorId', '==', user.doctorId).get(),
      adminDb.collection('appointments').where('doctorId', '==', user.doctorId).get(),
    ]);

    // 2. Collect unique patientIds (v2 uses patientId, legacy may use patientId too)
    const patientIdSet = new Set<string>();
    for (const doc of [...v2Snap.docs, ...legacySnap.docs]) {
      const pid = doc.data().patientId as string | undefined;
      if (pid) patientIdSet.add(pid);
    }

    if (patientIdSet.size === 0) {
      return jsonOk({ patients: [] });
    }

    // 3. Batch-fetch patients from v2_patients (admin SDK getAll, max 30 per call)
    const patientIds = [...patientIdSet];
    const CHUNK = 30;
    const patients: {
      id: string;
      name: string;
      email: string;
      phone: string;
      createdAt: string | null;
    }[] = [];

    for (let i = 0; i < patientIds.length; i += CHUNK) {
      const chunk = patientIds.slice(i, i + CHUNK);
      const refs = chunk.map((id) => adminDb.collection('v2_patients').doc(id));
      const snaps = await adminDb.getAll(...refs);

      for (const snap of snaps) {
        if (!snap.exists) continue;
        const d = snap.data()!;
        patients.push({
          id: snap.id,
          name: d.name ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        });
      }
    }

    // 4. Sort by name
    patients.sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return jsonOk({ patients, total: patients.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
