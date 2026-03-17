import type { Timestamps, ReferralStatus } from '@/src/shared/domain/types';

// ============================================================
// Referral Entity — V2 Domain Model
// ============================================================

export interface Referral extends Timestamps {
  id: string;                           // Firestore document ID
  referrerDoctorId: string;             // Doctor Firestore doc ID who referred
  referredDoctorId: string;             // Firebase Auth UID of referred doctor
  referredDoctorName: string;
  referredDoctorEmail: string;
  referredDoctorSpecialty: string;
  status: ReferralStatus;
  confirmedAt: Date | null;
}
