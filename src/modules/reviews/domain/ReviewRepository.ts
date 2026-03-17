import type { Review } from './ReviewEntity';

// ============================================================
// Review Repository Port (Interface)
// ============================================================

export interface ReviewRepository {
  findById(id: string): Promise<Review | null>;
  findByDoctorId(doctorId: string): Promise<Review[]>;
  findByPatientId(patientId: string): Promise<Review[]>;
  findByAppointmentId(appointmentId: string): Promise<Review | null>;
  save(review: Review): Promise<void>;
  update(id: string, data: Partial<Review>): Promise<void>;
  delete(id: string): Promise<void>;
}
