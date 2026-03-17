import type { Timestamps, AppointmentStatus, AppointmentType, AppointmentUrgency } from '@/src/shared/domain/types';

// ============================================================
// Appointment Entity — V2 Domain Model
// ============================================================
// V1 issues fixed:
//   - date (Timestamp) + time (string "11:00") → single dateTime: Date
//   - Denormalized doctor/patient names kept for read performance
//     but referenced IDs are the source of truth
//   - Inconsistent fields across docs (some have patientEmail,
//     patientPhone, doctorGender, duration — all now explicit)
// ============================================================

export interface Appointment extends Timestamps {
  id: string;                           // Firestore document ID
  appointmentId: string;                // Human-readable ID (e.g. "APT-833366")

  // References
  patientId: string;                    // Patient Firestore doc ID
  patientUserId: string;                // Patient Firebase Auth UID
  doctorId: string;                     // Doctor Firestore doc ID

  // Denormalized for read performance (updated via Cloud Functions)
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorGender: string;

  // Scheduling
  dateTime: Date;                       // Unified: was date (Timestamp) + time (string)
  durationMinutes: number;              // was "duration", default 30

  // Details
  type: AppointmentType;
  reason: string;
  urgency: AppointmentUrgency;
  notes: string;

  // Status lifecycle
  status: AppointmentStatus;
  requestedAt: Date;
  approvedAt: Date | null;
}
