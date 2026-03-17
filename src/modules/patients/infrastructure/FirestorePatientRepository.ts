import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type {
  Patient,
  AssignedDoctor,
  InsuranceInfo,
  EmergencyContact,
  GoogleAuthInfo,
} from '../domain/PatientEntity';
import type { PatientRepository } from '../domain/PatientRepository';
import type { Gender, RegistrationMethod, UserType } from '@/src/shared/domain/types';

const patientConverter: FirestoreDataConverter<Patient> = {
  toFirestore(patient: Patient) {
    return {
      userId: patient.userId,
      userType: patient.userType,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dni: patient.dni,
      dateOfBirth: Timestamp.fromDate(patient.dateOfBirth),
      gender: patient.gender,
      address: patient.address,
      profilePhoto: patient.profilePhoto,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      medicalHistory: patient.medicalHistory,
      insurance: patient.insurance,
      emergencyContact: patient.emergencyContact,
      registrationMethod: patient.registrationMethod,
      isActive: patient.isActive,
      dataComplete: patient.dataComplete,
      referralCode: patient.referralCode,
      temporaryPassword: patient.temporaryPassword,
      googleInfo: patient.googleInfo,
      doctors: patient.doctors.map((d) => ({
        ...d,
        assignedAt: Timestamp.fromDate(d.assignedAt),
      })),
      createdAt: Timestamp.fromDate(patient.createdAt),
      updatedAt: Timestamp.fromDate(patient.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Patient {
    const d = snap.data();

    const doctors: AssignedDoctor[] = Array.isArray(d.doctors)
      ? d.doctors.map((doc: Record<string, unknown>) => ({
          doctorId: (doc.doctorId as string) ?? '',
          doctorUserId: (doc.doctorUserId as string) ?? '',
          doctorName: (doc.doctorName as string) ?? '',
          doctorSpecialty: (doc.doctorSpecialty as string) ?? '',
          assignedAt: (doc.assignedAt as Timestamp)?.toDate?.() ?? new Date(),
          isPrimary: (doc.isPrimary as boolean) ?? false,
        }))
      : [];

    return {
      id: snap.id,
      userId: d.userId ?? '',
      userType: (d.userType ?? 'patient') as UserType,
      name: d.name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      dni: d.dni ?? '',
      dateOfBirth: d.dateOfBirth?.toDate?.() ?? new Date(0),
      gender: (d.gender ?? 'not_specified') as Gender,
      address: d.address ?? '',
      profilePhoto: d.profilePhoto ?? null,
      allergies: d.allergies ?? '',
      currentMedications: d.currentMedications ?? '',
      medicalHistory: d.medicalHistory ?? '',
      insurance: {
        provider: d.insurance?.provider ?? '',
        number: d.insurance?.number ?? '',
      } satisfies InsuranceInfo,
      emergencyContact: {
        name: d.emergencyContact?.name ?? '',
        phone: d.emergencyContact?.phone ?? '',
      } satisfies EmergencyContact,
      registrationMethod: (d.registrationMethod ?? 'email') as RegistrationMethod,
      isActive: d.isActive ?? true,
      dataComplete: d.dataComplete ?? false,
      referralCode: d.referralCode ?? '',
      temporaryPassword: d.temporaryPassword ?? false,
      googleInfo: d.googleInfo
        ? ({
            displayName: d.googleInfo.displayName ?? null,
            photoUrl: d.googleInfo.photoUrl ?? null,
            providerId: d.googleInfo.providerId ?? '',
          } satisfies GoogleAuthInfo)
        : null,
      doctors,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestorePatientRepository
  extends BaseRepository<Patient>
  implements PatientRepository
{
  protected collectionName = 'v2_patients';
  protected converter = patientConverter;

  async findByUserId(userId: string): Promise<Patient | null> {
    return this.findFirst('userId', userId);
  }

  async findByDoctorId(doctorId: string): Promise<Patient[]> {
    return this.findWhere('doctors', doctorId);
  }
}
