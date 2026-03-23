import type { Patient } from './PatientEntity';
import type { FamilyMember } from './FamilyMemberEntity';

// ============================================================
// Patient Repository Port (Interface)
// ============================================================

export interface PatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findByDoctorId(doctorId: string): Promise<Patient[]>;
  findAll(): Promise<Patient[]>;
  save(patient: Patient): Promise<void>;
  add(patient: Patient): Promise<string>;
  update(id: string, data: Partial<Patient>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface FamilyMemberRepository {
  findById(id: string): Promise<FamilyMember | null>;
  findByPrimaryPatientId(patientId: string): Promise<FamilyMember[]>;
  findByDoctorId(doctorId: string): Promise<FamilyMember[]>;
  save(familyMember: FamilyMember): Promise<void>;
  add(familyMember: FamilyMember): Promise<string>;
  update(id: string, data: Partial<FamilyMember>): Promise<void>;
  delete(id: string): Promise<void>;
}
