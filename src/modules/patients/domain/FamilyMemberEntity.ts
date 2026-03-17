import type { Timestamps, Gender } from '@/src/shared/domain/types';

// ============================================================
// FamilyMember Entity — V2 Domain Model
// ============================================================

export interface FamilyMember extends Timestamps {
  id: string;                         // Firestore document ID
  familyMemberId: string;             // Human-readable ID (e.g. "FAM-050851")
  primaryPatientId: string;           // Reference to the patient who added them
  doctorId: string;                   // Doctor managing this family member

  // Personal info
  name: string;
  relationship: string;
  dateOfBirth: Date;                  // was string in V1
  gender: Gender;
  phone: string;
  email: string;

  // Medical
  allergies: string;
  currentMedications: string;
  notes: string;

  // Insurance
  insuranceProvider: string;
  insuranceNumber: string;

  // Emergency
  emergencyContact: string;
  emergencyPhone: string;

  isActive: boolean;
}
