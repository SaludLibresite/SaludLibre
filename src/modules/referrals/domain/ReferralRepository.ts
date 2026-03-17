import type { Referral } from './ReferralEntity';

// ============================================================
// Referral Repository Port (Interface)
// ============================================================

export interface ReferralRepository {
  findById(id: string): Promise<Referral | null>;
  findAll(): Promise<Referral[]>;
  findByReferrerId(doctorId: string): Promise<Referral[]>;
  findByReferredId(doctorId: string): Promise<Referral[]>;
  findByStatus(status: string): Promise<Referral[]>;
  save(referral: Referral): Promise<void>;
  update(id: string, data: Partial<Referral>): Promise<void>;
}
