import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Doctor, DoctorSubscriptionSummary, DoctorProfessionalInfo, ScheduleConfig } from '../domain/DoctorEntity';
import type { DoctorRepository } from '../domain/DoctorRepository';
import type { Gender, SubscriptionStatus } from '@/src/shared/domain/types';

// ============================================================
// Firestore ↔ Doctor converter
// Handles Timestamp/Date mapping and field normalization
// ============================================================

const doctorConverter: FirestoreDataConverter<Doctor> = {
  toFirestore(doctor: Doctor) {
    return {
      userId: doctor.userId,
      name: doctor.name,
      slug: doctor.slug,
      email: doctor.email,
      phone: doctor.phone,
      gender: doctor.gender,
      specialty: doctor.specialty,
      description: doctor.description,
      profileImage: doctor.profileImage,
      schedule: doctor.schedule,
      ...(doctor.scheduleConfig !== undefined && { scheduleConfig: doctor.scheduleConfig }),
      onlineConsultation: doctor.onlineConsultation,
      location: doctor.location,
      verified: doctor.verified,
      subscription: {
        ...doctor.subscription,
        expiresAt: doctor.subscription.expiresAt
          ? Timestamp.fromDate(doctor.subscription.expiresAt)
          : null,
      },
      professional: doctor.professional,
      createdAt: Timestamp.fromDate(doctor.createdAt),
      updatedAt: Timestamp.fromDate(doctor.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Doctor {
    const d = snap.data();
    return {
      id: snap.id,
      userId: d.userId ?? '',
      name: d.name ?? '',
      slug: d.slug ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      gender: (d.gender ?? 'not_specified') as Gender,
      specialty: d.specialty ?? '',
      description: d.description ?? '',
      profileImage: d.profileImage ?? '',
      schedule: d.schedule ?? '',
      ...(d.scheduleConfig && { scheduleConfig: d.scheduleConfig as ScheduleConfig }),
      onlineConsultation: d.onlineConsultation ?? false,
      location: d.location ?? { latitude: 0, longitude: 0, formattedAddress: '' },
      verified: d.verified ?? false,
      subscription: {
        status: (d.subscription?.status ?? 'inactive') as SubscriptionStatus,
        planId: d.subscription?.planId ?? '',
        planName: d.subscription?.planName ?? '',
        expiresAt: d.subscription?.expiresAt?.toDate?.() ?? null,
      } satisfies DoctorSubscriptionSummary,
      professional: {
        profession: d.professional?.profession ?? '',
        licenseNumber: d.professional?.licenseNumber ?? '',
        officeAddress: d.professional?.officeAddress ?? '',
        signatureUrl: d.professional?.signatureUrl ?? null,
        stampUrl: d.professional?.stampUrl ?? null,
      } satisfies DoctorProfessionalInfo,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

// ============================================================
// Firestore Doctor Repository — Infrastructure implementation
// ============================================================

export class FirestoreDoctorRepository
  extends BaseRepository<Doctor>
  implements DoctorRepository
{
  protected collectionName = 'v2_doctors';
  protected converter = doctorConverter;

  async findByUserId(userId: string): Promise<Doctor | null> {
    return this.findFirst('userId', userId);
  }

  async findBySlug(slug: string): Promise<Doctor | null> {
    return this.findFirst('slug', slug);
  }

  async findBySpecialty(specialty: string): Promise<Doctor[]> {
    return this.findWhere('specialty', specialty);
  }

  async findVerified(): Promise<Doctor[]> {
    return this.findWhere('verified', true);
  }
}
