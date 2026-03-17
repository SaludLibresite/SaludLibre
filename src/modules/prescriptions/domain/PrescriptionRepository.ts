import type { Prescription } from './PrescriptionEntity';

// ============================================================
// Prescription Repository Port (Interface)
// ============================================================

export interface PrescriptionRepository {
  findById(id: string): Promise<Prescription | null>;
  findByPatientId(patientId: string): Promise<Prescription[]>;
  findByDoctorId(doctorId: string): Promise<Prescription[]>;
  findByAppointmentId(appointmentId: string): Promise<Prescription | null>;
  save(prescription: Prescription): Promise<void>;
  add(prescription: Prescription): Promise<string>;
  update(id: string, data: Partial<Prescription>): Promise<void>;
  delete(id: string): Promise<void>;
}
