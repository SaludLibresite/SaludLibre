import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Appointment } from '../domain/AppointmentEntity';
import type { AppointmentRepository } from '../domain/AppointmentRepository';
import type { AppointmentStatus, AppointmentType, AppointmentUrgency } from '@/src/shared/domain/types';

const appointmentConverter: FirestoreDataConverter<Appointment> = {
  toFirestore(appt: Appointment) {
    return {
      appointmentId: appt.appointmentId,
      patientId: appt.patientId,
      patientUserId: appt.patientUserId,
      doctorId: appt.doctorId,
      patientName: appt.patientName,
      patientEmail: appt.patientEmail,
      patientPhone: appt.patientPhone,
      doctorName: appt.doctorName,
      doctorSpecialty: appt.doctorSpecialty,
      doctorGender: appt.doctorGender,
      dateTime: Timestamp.fromDate(appt.dateTime),
      durationMinutes: appt.durationMinutes,
      type: appt.type,
      reason: appt.reason,
      urgency: appt.urgency,
      notes: appt.notes,
      status: appt.status,
      requestedAt: Timestamp.fromDate(appt.requestedAt),
      approvedAt: appt.approvedAt ? Timestamp.fromDate(appt.approvedAt) : null,
      createdAt: Timestamp.fromDate(appt.createdAt),
      updatedAt: Timestamp.fromDate(appt.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Appointment {
    const d = snap.data();
    return {
      id: snap.id,
      appointmentId: d.appointmentId ?? '',
      patientId: d.patientId ?? '',
      patientUserId: d.patientUserId ?? '',
      doctorId: d.doctorId ?? '',
      patientName: d.patientName ?? '',
      patientEmail: d.patientEmail ?? '',
      patientPhone: d.patientPhone ?? '',
      doctorName: d.doctorName ?? '',
      doctorSpecialty: d.doctorSpecialty ?? '',
      doctorGender: d.doctorGender ?? '',
      dateTime: d.dateTime?.toDate?.() ?? new Date(0),
      durationMinutes: d.durationMinutes ?? 30,
      type: (d.type ?? 'consultation') as AppointmentType,
      reason: d.reason ?? '',
      urgency: (d.urgency ?? 'normal') as AppointmentUrgency,
      notes: d.notes ?? '',
      status: (d.status ?? 'pending') as AppointmentStatus,
      requestedAt: d.requestedAt?.toDate?.() ?? new Date(),
      approvedAt: d.approvedAt?.toDate?.() ?? null,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreAppointmentRepository
  extends BaseRepository<Appointment>
  implements AppointmentRepository
{
  protected collectionName = 'v2_appointments';
  protected converter = appointmentConverter;

  async findByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    return this.findFirst('appointmentId', appointmentId);
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return this.findWhere('patientId', patientId);
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    return this.findWhere('doctorId', doctorId);
  }

  async findByStatus(status: string): Promise<Appointment[]> {
    return this.findWhere('status', status);
  }

  async findByDateRange(doctorId: string, start: Date, end: Date): Promise<Appointment[]> {
    return this.findAll([
      where('doctorId', '==', doctorId),
      where('dateTime', '>=', Timestamp.fromDate(start)),
      where('dateTime', '<=', Timestamp.fromDate(end)),
    ]);
  }
}
