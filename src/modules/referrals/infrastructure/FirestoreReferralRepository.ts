import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Referral } from '../domain/ReferralEntity';
import type { ReferralRepository } from '../domain/ReferralRepository';
import type { ReferralStatus } from '@/src/shared/domain/types';

const referralConverter: FirestoreDataConverter<Referral> = {
  toFirestore(ref: Referral) {
    return {
      referrerDoctorId: ref.referrerDoctorId,
      referredDoctorId: ref.referredDoctorId,
      referredDoctorName: ref.referredDoctorName,
      referredDoctorEmail: ref.referredDoctorEmail,
      referredDoctorSpecialty: ref.referredDoctorSpecialty,
      status: ref.status,
      confirmedAt: ref.confirmedAt ? Timestamp.fromDate(ref.confirmedAt) : null,
      createdAt: Timestamp.fromDate(ref.createdAt),
      updatedAt: Timestamp.fromDate(ref.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Referral {
    const d = snap.data();
    return {
      id: snap.id,
      referrerDoctorId: d.referrerDoctorId ?? '',
      referredDoctorId: d.referredDoctorId ?? '',
      referredDoctorName: d.referredDoctorName ?? '',
      referredDoctorEmail: d.referredDoctorEmail ?? '',
      referredDoctorSpecialty: d.referredDoctorSpecialty ?? '',
      status: (d.status ?? 'pending') as ReferralStatus,
      confirmedAt: d.confirmedAt?.toDate?.() ?? null,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreReferralRepository
  extends BaseRepository<Referral>
  implements ReferralRepository
{
  protected collectionName = 'v2_referrals';
  protected converter = referralConverter;

  async findByReferrerId(doctorId: string): Promise<Referral[]> {
    return this.findWhere('referrerDoctorId', doctorId);
  }

  async findByReferredId(doctorId: string): Promise<Referral[]> {
    return this.findWhere('referredDoctorId', doctorId);
  }

  async findByStatus(status: string): Promise<Referral[]> {
    return this.findWhere('status', status);
  }
}
