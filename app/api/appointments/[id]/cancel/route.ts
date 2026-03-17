import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';
import { FieldValue } from 'firebase-admin/firestore';

type Params = { params: Promise<{ id: string }> };

// POST /api/appointments/[id]/cancel
// Works for both v2 (v2_appointments) and legacy (appointments) collections.
export async function POST(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const source = (body as { source?: string }).source;

    // --- Try v2 first ---
    const v2Apt = await getAppointmentService().getById(id);

    if (v2Apt) {
      // Ownership check
      const isOwner =
        v2Apt.patientUserId === user.uid ||
        v2Apt.patientId === user.patientId ||
        user.userType === 'superadmin';
      if (!isOwner) return jsonError('Not authorized', 403);

      await getAppointmentService().cancel(id);
      return jsonOk({ success: true });
    }

    // --- Fall back to legacy collection ---
    if (source === 'legacy' || !v2Apt) {
      const legacyRef = adminDb.collection('appointments').doc(id);
      const legacySnap = await legacyRef.get();

      if (!legacySnap.exists) return jsonError('Appointment not found', 404);

      const d = legacySnap.data()!;

      // Find the legacy patient doc to verify ownership
      const legacyPatientSnap = await adminDb
        .collection('patients')
        .where('userId', '==', user.uid)
        .limit(1)
        .get();

      let authorized = user.userType === 'superadmin';
      if (!legacyPatientSnap.empty) {
        const legacyPatientId = legacyPatientSnap.docs[0].id;
        // The appointment belongs to this patient or one of their family members
        authorized =
          d.patientId === legacyPatientId ||
          d.primaryPatientId === legacyPatientId;
      }

      if (!authorized) return jsonError('Not authorized', 403);

      await legacyRef.update({
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: 'patient',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return jsonOk({ success: true });
    }

    return jsonError('Appointment not found', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
