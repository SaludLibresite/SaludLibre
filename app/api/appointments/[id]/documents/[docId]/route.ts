import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb, adminStorage } from '@/src/infrastructure/config/firebase.admin';

type Params = { params: Promise<{ id: string; docId: string }> };

// DELETE /api/appointments/[id]/documents/[docId]
// Only the uploader or a doctor associated with the appointment can delete.
export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id, docId } = await params;

    const docRef = adminDb.collection('appointmentDocuments').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) return jsonError('Documento no encontrado', 404);

    const data = snap.data()!;

    // Verify the document belongs to this appointment
    if (data.appointmentId !== id) return jsonError('Documento no encontrado', 404);

    // Only the original uploader or a doctor can delete
    if (data.uploadedBy !== user.uid && user.userType !== 'doctor' && user.userType !== 'superadmin') {
      return jsonError('Sin permiso para eliminar este documento', 403);
    }

    // Delete from Firebase Storage if storagePath exists
    if (data.storagePath) {
      try {
        await adminStorage.bucket().file(data.storagePath).delete();
      } catch {
        // File may already be gone — continue to delete the Firestore record
      }
    }

    await docRef.delete();

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
