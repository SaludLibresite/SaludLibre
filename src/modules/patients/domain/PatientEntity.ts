import type { Timestamps, Gender, RegistrationMethod, UserType } from '@/src/shared/domain/types';

// ============================================================
// Patient Entity — V2 Domain Model
// ============================================================
// V1 issues fixed:
//   - dateOfBirth was string → now Date
//   - doctorName/doctorId/doctorUserId denormalized → moved to doctors[] array only
//   - obraSocial duplicated insuranceProvider → unified as insuranceProvider
//   - googleInfo/profilePhoto optionals documented
// ============================================================

export interface AssignedDoctor {
  doctorId: string;           // Doctor Firestore doc ID
  doctorUserId: string;       // Doctor Firebase Auth UID
  doctorName: string;
  doctorSpecialty: string;
  assignedAt: Date;
  isPrimary: boolean;
}

export interface InsuranceInfo {
  provider: string;           // was insuranceProvider / obraSocial
  number: string;             // was insuranceNumber
}

export interface EmergencyContact {
  name: string;               // was emergencyContact
  phone: string;              // was emergencyPhone
}

export interface GoogleAuthInfo {
  displayName: string | null;
  photoUrl: string | null;
  providerId: string;
}

export interface Patient extends Timestamps {
  id: string;                         // Firestore document ID
  userId: string;                     // Firebase Auth UID
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  dni: string;
  dateOfBirth: Date;                  // was string in V1
  gender: Gender;
  address: string;
  profilePhoto: string | null;

  // Medical
  allergies: string;
  currentMedications: string;
  medicalHistory: string;

  // Insurance
  insurance: InsuranceInfo;

  // Emergency
  emergencyContact: EmergencyContact;

  // Registration
  registrationMethod: RegistrationMethod;
  isActive: boolean;
  dataComplete: boolean;
  referralCode: string;
  temporaryPassword: boolean;
  googleInfo: GoogleAuthInfo | null;

  // Assigned doctors (normalized array — source of truth)
  doctors: AssignedDoctor[];
}
