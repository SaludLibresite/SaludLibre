import type { Appointment, } from './AppointmentEntity';

// ============================================================
// Appointment Repository Port (Interface)
// ============================================================

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByAppointmentId(appointmentId: string): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDoctorId(doctorId: string): Promise<Appointment[]>;
  findByStatus(status: string): Promise<Appointment[]>;
  findByDateRange(doctorId: string, start: Date, end: Date): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  update(id: string, data: Partial<Appointment>): Promise<void>;
  delete(id: string): Promise<void>;
}
