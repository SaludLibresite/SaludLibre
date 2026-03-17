import type { Timestamps, DocumentCategory, UploaderRole } from '@/src/shared/domain/types';

// ============================================================
// MedicalDocument Entity — V2 Domain Model
// ============================================================
// V1 had TWO overlapping collections:
//   - medicalFiles (uploaded by doctor)
//   - patientDocuments (uploaded by patient)
// V2 unifies them into a single collection with `uploaderRole`
// ============================================================

export interface MedicalDocument extends Timestamps {
  id: string;                           // Firestore document ID
  patientId: string;                    // Patient Firestore doc ID
  doctorId: string;                     // Doctor Firestore doc ID (if uploaded by doctor)

  // File metadata
  fileName: string;
  fileSize: number;                     // bytes
  fileType: string;                     // MIME type
  filePath: string;                     // Storage path
  downloadUrl: string;

  // Classification
  title: string;
  category: DocumentCategory;

  // Provenance
  uploadedBy: string;                   // Firebase Auth UID of uploader
  uploadedByRole: UploaderRole;
  uploadedAt: Date;
}
