import type { VideoConsultation } from './VideoConsultationEntity';

// ============================================================
// VideoConsultation Repository Port (Interface)
// ============================================================

export interface VideoConsultationRepository {
  findById(id: string): Promise<VideoConsultation | null>;
  findByRoomName(roomName: string): Promise<VideoConsultation | null>;
  findByAppointmentId(appointmentId: string): Promise<VideoConsultation | null>;
  findByDoctorId(doctorId: string): Promise<VideoConsultation[]>;
  findByPatientId(patientId: string): Promise<VideoConsultation[]>;
  findActiveByDoctorId(doctorId: string): Promise<VideoConsultation[]>;
  findExpired(before: Date): Promise<VideoConsultation[]>;
  save(consultation: VideoConsultation): Promise<void>;
  add(consultation: VideoConsultation): Promise<string>;
  update(id: string, data: Partial<VideoConsultation>): Promise<void>;
  delete(id: string): Promise<void>;
}
