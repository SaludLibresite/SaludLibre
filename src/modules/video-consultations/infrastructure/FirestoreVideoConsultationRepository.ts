import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { VideoConsultation, VideoRoomStatus } from '../domain/VideoConsultationEntity';
import type { VideoConsultationRepository } from '../domain/VideoConsultationRepository';

// ============================================================
// Firestore ↔ VideoConsultation converter
// ============================================================

const videoConsultationConverter: FirestoreDataConverter<VideoConsultation> = {
  toFirestore(vc: VideoConsultation) {
    return {
      roomName: vc.roomName,
      roomUrl: vc.roomUrl,
      appointmentId: vc.appointmentId,
      doctorId: vc.doctorId,
      patientId: vc.patientId,
      doctorName: vc.doctorName,
      patientName: vc.patientName,
      status: vc.status,
      scheduledAt: Timestamp.fromDate(vc.scheduledAt),
      startedAt: vc.startedAt ? Timestamp.fromDate(vc.startedAt) : null,
      endedAt: vc.endedAt ? Timestamp.fromDate(vc.endedAt) : null,
      expiresAt: Timestamp.fromDate(vc.expiresAt),
      createdAt: Timestamp.fromDate(vc.createdAt),
      updatedAt: Timestamp.fromDate(vc.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): VideoConsultation {
    const d = snap.data();
    return {
      id: snap.id,
      roomName: d.roomName ?? '',
      roomUrl: d.roomUrl ?? '',
      appointmentId: d.appointmentId ?? '',
      doctorId: d.doctorId ?? '',
      patientId: d.patientId ?? '',
      doctorName: d.doctorName ?? '',
      patientName: d.patientName ?? '',
      status: (d.status ?? 'scheduled') as VideoRoomStatus,
      scheduledAt: d.scheduledAt?.toDate?.() ?? new Date(),
      startedAt: d.startedAt?.toDate?.() ?? null,
      endedAt: d.endedAt?.toDate?.() ?? null,
      expiresAt: d.expiresAt?.toDate?.() ?? new Date(),
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

// ============================================================
// Firestore VideoConsultation Repository
// ============================================================

export class FirestoreVideoConsultationRepository
  extends BaseRepository<VideoConsultation>
  implements VideoConsultationRepository
{
  protected collectionName = 'v2_video_consultations';
  protected converter = videoConsultationConverter;

  async findByRoomName(roomName: string): Promise<VideoConsultation | null> {
    return this.findFirst('roomName', roomName);
  }

  async findByAppointmentId(appointmentId: string): Promise<VideoConsultation | null> {
    return this.findFirst('appointmentId', appointmentId);
  }

  async findByDoctorId(doctorId: string): Promise<VideoConsultation[]> {
    return this.findWhere('doctorId', doctorId);
  }

  async findByPatientId(patientId: string): Promise<VideoConsultation[]> {
    return this.findWhere('patientId', patientId);
  }

  async findActiveByDoctorId(doctorId: string): Promise<VideoConsultation[]> {
    const results = await this.findAll([
      where('doctorId', '==', doctorId),
      where('status', 'in', ['scheduled', 'active']),
    ]);
    return results;
  }

  async findExpired(before: Date): Promise<VideoConsultation[]> {
    return this.findAll([
      where('status', 'in', ['scheduled', 'active']),
      where('expiresAt', '<=', Timestamp.fromDate(before)),
    ]);
  }
}
