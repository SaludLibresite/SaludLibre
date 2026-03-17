import type { Referral } from '../domain/ReferralEntity';
import type { ReferralRepository } from '../domain/ReferralRepository';
import type { DoctorRepository } from '@/src/modules/doctors/domain/DoctorRepository';
import type { ReferralStatus } from '@/src/shared/domain/types';

// ============================================================
// Referral Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreateReferralInput {
  referrerDoctorId: string;       // Doctor who generates the code
  referredDoctorUserId: string;   // Firebase Auth UID of referred doctor
  referredDoctorName: string;
  referredDoctorEmail: string;
  referredDoctorSpecialty: string;
}

export interface ReferralStats {
  totalReferrals: number;
  confirmed: number;
  pending: number;
  conversionRate: number;       // confirmed / total * 100
}

// --- Service ---

export class ReferralService {
  constructor(
    private readonly referralRepo: ReferralRepository,
    private readonly doctorRepo: DoctorRepository,
  ) {}

  /** Create a new referral record when a referred doctor registers */
  async create(input: CreateReferralInput): Promise<Referral> {
    const referrer = await this.doctorRepo.findById(input.referrerDoctorId);
    if (!referrer) throw new Error('Referrer doctor not found');

    const now = new Date();
    const referral: Referral = {
      id: '',
      referrerDoctorId: input.referrerDoctorId,
      referredDoctorId: input.referredDoctorUserId,
      referredDoctorName: input.referredDoctorName,
      referredDoctorEmail: input.referredDoctorEmail,
      referredDoctorSpecialty: input.referredDoctorSpecialty,
      status: 'pending',
      confirmedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.referralRepo.save(referral);
    return referral;
  }

  /** Confirm a referral (e.g. when referred doctor subscribes) */
  async confirm(referralId: string): Promise<void> {
    const now = new Date();
    await this.referralRepo.update(referralId, {
      status: 'confirmed',
      confirmedAt: now,
      updatedAt: now,
    });
  }

  /** Reject a referral (superadmin manual action) */
  async reject(referralId: string): Promise<void> {
    await this.referralRepo.update(referralId, {
      status: 'rejected',
      updatedAt: new Date(),
    });
  }

  /** List all referrals by a referring doctor */
  async listByReferrer(doctorId: string): Promise<Referral[]> {
    return this.referralRepo.findByReferrerId(doctorId);
  }

  /** List referrals where this doctor was referred */
  async listByReferred(doctorId: string): Promise<Referral[]> {
    return this.referralRepo.findByReferredId(doctorId);
  }

  /** List all referrals — superadmin */
  async listAll(): Promise<Referral[]> {
    return this.referralRepo.findAll();
  }

  /** Get referral statistics for a doctor */
  async getStats(doctorId: string): Promise<ReferralStats> {
    const referrals = await this.referralRepo.findByReferrerId(doctorId);

    const confirmed = referrals.filter(r => r.status === 'confirmed').length;
    const pending = referrals.filter(r => r.status === 'pending').length;

    return {
      totalReferrals: referrals.length,
      confirmed,
      pending,
      conversionRate: referrals.length > 0
        ? Math.round((confirmed / referrals.length) * 100)
        : 0,
    };
  }
}
