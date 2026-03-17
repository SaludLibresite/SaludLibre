import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

type Params = { params: Promise<{ id: string }> };

// GET /api/appointments/[id]/documents
// Returns: appointment documents + prescriptions (v2 + legacy)
export async function GET(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;

    // ── Prescriptions ──────────────────────────────────────────────────────────

    const prescriptions: object[] = [];

    // V2 prescription by appointmentId
    const v2Rx = await getPrescriptionService().getByAppointmentId(id);
    if (v2Rx) {
      prescriptions.push({
        id: v2Rx.id,
        diagnosis: v2Rx.diagnosis,
        medications: v2Rx.medications,
        notes: v2Rx.notes,
        doctorName: v2Rx.doctorSnapshot?.name ?? '',
        createdAt: v2Rx.createdAt instanceof Date ? v2Rx.createdAt.toISOString() : null,
        _source: 'v2',
      });
    }

    // Legacy prescriptions by appointmentId
    const legacyRxSnap = await adminDb
      .collection('prescriptions')
      .where('appointmentId', '==', id)
      .get();
    legacyRxSnap.forEach((doc) => {
      const d = doc.data();
      prescriptions.push({
        id: doc.id,
        diagnosis: d.diagnosis ?? '',
        medications: Array.isArray(d.medications) ? d.medications : [],
        notes: d.notes ?? '',
        doctorName: d.doctorName ?? d.doctorSnapshot?.name ?? '',
        fileUrl: d.fileUrl ?? null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        _source: 'legacy',
      });
    });

    // ── Appointment Documents ──────────────────────────────────────────────────

    const documents: object[] = [];

    // Legacy appointmentDocuments collection
    const legacyDocsSnap = await adminDb
      .collection('appointmentDocuments')
      .where('appointmentId', '==', id)
      .get();
    legacyDocsSnap.forEach((doc) => {
      const d = doc.data();
      documents.push({
        id: doc.id,
        title: d.title ?? d.fileName ?? 'Documento',
        fileName: d.fileName ?? '',
        fileSize: d.fileSize ?? 0,
        fileType: d.fileType ?? '',
        downloadURL: d.downloadURL ?? d.fileUrl ?? '',
        uploadedBy: d.uploadedBy ?? '',
        uploadedByRole: d.uploadedByRole ?? 'doctor',
        uploadedAt: d.uploadedAt?.toDate?.()?.toISOString() ?? null,
        _source: 'legacy',
      });
    });

    return jsonOk({ prescriptions, documents });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/appointments/[id]/documents
// Body: { title, fileName, fileSize, fileType, downloadURL, storagePath }
// Called after the client has already uploaded the file to Firebase Storage.
export async function POST(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;
    const body = await request.json();

    const { title, fileName, fileSize, fileType, downloadURL, storagePath } = body;

    if (!downloadURL || !fileName) {
      return jsonError('downloadURL and fileName are required', 400);
    }

    const docRef = adminDb.collection('appointmentDocuments').doc();
    await docRef.set({
      appointmentId: id,
      title: title || fileName,
      fileName,
      fileSize: fileSize ?? 0,
      fileType: fileType ?? '',
      downloadURL,
      storagePath: storagePath ?? '',
      uploadedBy: user.uid,
      uploadedByRole: user.userType,
      uploadedAt: new Date(),
    });

    return jsonOk({
      id: docRef.id,
      title: title || fileName,
      fileName,
      fileSize: fileSize ?? 0,
      downloadURL,
      uploadedByRole: user.userType,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
