import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type {
  Prescription,
  PrescriptionMedication,
  PrescriptionDoctorSnapshot,
  PrescriptionPatientSnapshot,
} from '../domain/PrescriptionEntity';
import type { PrescriptionRepository } from '../domain/PrescriptionRepository';

const prescriptionConverter: FirestoreDataConverter<Prescription> = {
  toFirestore(rx: Prescription) {
    return {
      appointmentId: rx.appointmentId,
      doctorId: rx.doctorId,
      patientId: rx.patientId,
      doctorSnapshot: {
        ...rx.doctorSnapshot,
      },
      patientSnapshot: {
        ...rx.patientSnapshot,
        dateOfBirth: Timestamp.fromDate(rx.patientSnapshot.dateOfBirth),
      },
      medications: rx.medications,
      diagnosis: rx.diagnosis,
      notes: rx.notes,
      createdAt: Timestamp.fromDate(rx.createdAt),
      updatedAt: Timestamp.fromDate(rx.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Prescription {
    const d = snap.data();

    const medications: PrescriptionMedication[] = Array.isArray(d.medications)
      ? d.medications.map((m: Record<string, string>) => ({
          name: m.name ?? '',
          dosage: m.dosage ?? '',
          frequency: m.frequency ?? '',
          duration: m.duration ?? '',
          instructions: m.instructions ?? '',
        }))
      : [];

    const ds = d.doctorSnapshot ?? {};
    const ps = d.patientSnapshot ?? {};

    return {
      id: snap.id,
      appointmentId: d.appointmentId ?? '',
      doctorId: d.doctorId ?? '',
      patientId: d.patientId ?? '',
      doctorSnapshot: {
        doctorDocId: ds.doctorDocId ?? '',
        userId: ds.userId ?? '',
        name: ds.name ?? '',
        specialty: ds.specialty ?? '',
        profession: ds.profession ?? '',
        phone: ds.phone ?? '',
        officeAddress: ds.officeAddress ?? '',
        licenseNumber: ds.licenseNumber ?? '',
        signatureUrl: ds.signatureUrl ?? null,
        stampUrl: ds.stampUrl ?? null,
      } satisfies PrescriptionDoctorSnapshot,
      patientSnapshot: {
        patientDocId: ps.patientDocId ?? '',
        name: ps.name ?? '',
        age: ps.age ?? 0,
        dateOfBirth: ps.dateOfBirth?.toDate?.() ?? new Date(0),
        gender: ps.gender ?? '',
        dni: ps.dni ?? '',
        insuranceProvider: ps.insuranceProvider ?? '',
      } satisfies PrescriptionPatientSnapshot,
      medications,
      diagnosis: d.diagnosis ?? '',
      notes: d.notes ?? '',
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestorePrescriptionRepository
  extends BaseRepository<Prescription>
  implements PrescriptionRepository
{
  protected collectionName = 'v2_prescriptions';
  protected converter = prescriptionConverter;

  async findByPatientId(patientId: string): Promise<Prescription[]> {
    return this.findWhere('patientId', patientId);
  }

  async findByDoctorId(doctorId: string): Promise<Prescription[]> {
    return this.findWhere('doctorId', doctorId);
  }

  async findByAppointmentId(appointmentId: string): Promise<Prescription | null> {
    return this.findFirst('appointmentId', appointmentId);
  }
}
