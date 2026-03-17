import type { VideoConsultation } from '../domain/VideoConsultationEntity';
import type { VideoConsultationRepository } from '../domain/VideoConsultationRepository';
import type { AppointmentRepository } from '@/src/modules/appointments/domain/AppointmentRepository';
import type { VideoService } from '@/src/shared/domain/ports/VideoService';

// ============================================================
// Video Consultation Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreateVideoRoomInput {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  scheduledAt: Date;
}

export interface ValidateAccessResult {
  allowed: boolean;
  reason?: string;
  roomUrl?: string;
}

// --- Service ---

export class VideoConsultationService {
  constructor(
    private readonly videoRepo: VideoConsultationRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly videoService: VideoService,
  ) {}

  /** Doctor creates a video room for an appointment */
  async createRoom(input: CreateVideoRoomInput): Promise<VideoConsultation> {
    const appointment = await this.appointmentRepo.findById(input.appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    // Check if room already exists for this appointment
    const existing = await this.videoRepo.findByAppointmentId(input.appointmentId);
    if (existing) return existing;

    const roomName = `sala-${input.appointmentId}-${Date.now()}`;
    // Expiry must always be in the future — use whichever is later: now or scheduledAt
    const base = new Date(Math.max(Date.now(), input.scheduledAt.getTime()));
    const expiresAt = new Date(base.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    const room = await this.videoService.createRoom({
      roomName,
      expiresAt,
      maxParticipants: 2,
    });

    const now = new Date();
    const consultation: VideoConsultation = {
      id: '',
      roomName: room.name,
      roomUrl: room.url,
      appointmentId: input.appointmentId,
      doctorId: input.doctorId,
      patientId: input.patientId,
      doctorName: input.doctorName,
      patientName: input.patientName,
      status: 'scheduled',
      scheduledAt: input.scheduledAt,
      startedAt: null,
      endedAt: null,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    const newId = await this.videoRepo.add(consultation);
    consultation.id = newId;

    // Update appointment status to in_progress
    await this.appointmentRepo.update(input.appointmentId, {
      status: 'in_progress',
      updatedAt: now,
    });

    return consultation;
  }

  /** Validate if a user can join a video room */
  async validateAccess(
    roomName: string,
    userId: string,
    userRole: 'doctor' | 'patient',
  ): Promise<ValidateAccessResult> {
    const consultation = await this.videoRepo.findByRoomName(roomName);
    if (!consultation) {
      return { allowed: false, reason: 'Room not found' };
    }

    if (consultation.status === 'ended' || consultation.status === 'expired') {
      return { allowed: false, reason: 'Room is no longer active' };
    }

    // Check user is either the doctor or patient for this consultation
    const isDoctor = userRole === 'doctor' && consultation.doctorId === userId;
    const isPatient = userRole === 'patient' && consultation.patientId === userId;

    if (!isDoctor && !isPatient) {
      return { allowed: false, reason: 'Not authorized for this room' };
    }

    return { allowed: true, roomUrl: consultation.roomUrl };
  }

  /** Get consultation details by appointment */
  async getByAppointment(appointmentId: string): Promise<VideoConsultation | null> {
    return this.videoRepo.findByAppointmentId(appointmentId);
  }

  /** Get consultation by room name */
  async getByRoomName(roomName: string): Promise<VideoConsultation | null> {
    return this.videoRepo.findByRoomName(roomName);
  }

  /** List active consultations for a doctor (dashboard) */
  async listActiveByDoctor(doctorId: string): Promise<VideoConsultation[]> {
    return this.videoRepo.findActiveByDoctorId(doctorId);
  }

  /** List active consultations for a patient (dashboard) */
  async listActiveByPatient(patientId: string): Promise<VideoConsultation[]> {
    const all = await this.videoRepo.findByPatientId(patientId);
    return all.filter(c => c.status === 'scheduled' || c.status === 'active');
  }

  /** End a video consultation */
  async endRoom(roomName: string): Promise<void> {
    const consultation = await this.videoRepo.findByRoomName(roomName);
    if (!consultation) throw new Error('Room not found');

    const now = new Date();
    await this.videoRepo.update(consultation.id, {
      status: 'ended',
      endedAt: now,
      updatedAt: now,
    });

    await this.videoService.deleteRoom(roomName);
  }

  /** Delete a video room completely (Firestore + Daily.co) so a new one can be created */
  async deleteRoom(appointmentId: string): Promise<void> {
    const consultation = await this.videoRepo.findByAppointmentId(appointmentId);
    if (!consultation) return; // nothing to delete

    // Delete from Daily.co (ignore errors if already gone)
    await this.videoService.deleteRoom(consultation.roomName).catch(() => {});

    // Delete from Firestore
    await this.videoRepo.delete(consultation.id);
  }

  /** Cleanup expired rooms (scheduled job) */
  async cleanupExpired(): Promise<number> {
    const expired = await this.videoRepo.findExpired(new Date());
    let cleaned = 0;

    for (const consultation of expired) {
      await this.videoRepo.update(consultation.id, {
        status: 'expired',
        endedAt: new Date(),
        updatedAt: new Date(),
      });
      await this.videoService.deleteRoom(consultation.roomName).catch(() => {});
      cleaned++;
    }

    return cleaned;
  }
}
