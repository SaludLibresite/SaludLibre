import type { Timestamps } from '@/src/shared/domain/types';

// ============================================================
// Prescription Entity — V2 Domain Model
// ============================================================
// V1 issues fixed:
//   - doctorInfo/patientInfo were deeply nested maps → flattened
//     to reference IDs + snapshot for PDF generation
//   - medications array has proper types
// ============================================================

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

/** Snapshot of doctor info at prescription time (for PDF generation) */
export interface PrescriptionDoctorSnapshot {
  doctorDocId: string;          // Doctor Firestore doc ID
  userId: string;               // Doctor Firebase Auth UID
  name: string;
  specialty: string;
  profession: string;
  phone: string;
  officeAddress: string;
  licenseNumber: string;
  signatureUrl: string | null;
  stampUrl: string | null;
}

/** Snapshot of patient info at prescription time (for PDF generation) */
export interface PrescriptionPatientSnapshot {
  patientDocId: string;         // Patient Firestore doc ID
  name: string;
  age: number;
  dateOfBirth: Date;
  gender: string;
  dni: string;
  insuranceProvider: string;
}

export interface Prescription extends Timestamps {
  id: string;                           // Firestore document ID
  appointmentId: string;                // Reference to appointment

  // Reference IDs (source of truth)
  doctorId: string;                     // Doctor Firebase Auth UID
  patientId: string;                    // Patient Firestore doc ID

  // Snapshots (frozen at creation time for PDF)
  doctorSnapshot: PrescriptionDoctorSnapshot;
  patientSnapshot: PrescriptionPatientSnapshot;

  // Prescription content
  medications: PrescriptionMedication[];
  diagnosis: string;
  notes: string;
}
