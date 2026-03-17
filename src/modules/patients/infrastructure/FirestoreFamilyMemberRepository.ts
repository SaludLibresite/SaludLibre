import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { FamilyMember } from '../domain/FamilyMemberEntity';
import type { FamilyMemberRepository } from '../domain/PatientRepository';
import type { Gender } from '@/src/shared/domain/types';

const familyMemberConverter: FirestoreDataConverter<FamilyMember> = {
  toFirestore(fm: FamilyMember) {
    return {
      familyMemberId: fm.familyMemberId,
      primaryPatientId: fm.primaryPatientId,
      doctorId: fm.doctorId,
      name: fm.name,
      relationship: fm.relationship,
      dateOfBirth: Timestamp.fromDate(fm.dateOfBirth),
      gender: fm.gender,
      phone: fm.phone,
      email: fm.email,
      allergies: fm.allergies,
      currentMedications: fm.currentMedications,
      notes: fm.notes,
      insuranceProvider: fm.insuranceProvider,
      insuranceNumber: fm.insuranceNumber,
      emergencyContact: fm.emergencyContact,
      emergencyPhone: fm.emergencyPhone,
      isActive: fm.isActive,
      createdAt: Timestamp.fromDate(fm.createdAt),
      updatedAt: Timestamp.fromDate(fm.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): FamilyMember {
    const d = snap.data();
    return {
      id: snap.id,
      familyMemberId: d.familyMemberId ?? '',
      primaryPatientId: d.primaryPatientId ?? '',
      doctorId: d.doctorId ?? '',
      name: d.name ?? '',
      relationship: d.relationship ?? '',
      dateOfBirth: d.dateOfBirth?.toDate?.() ?? new Date(0),
      gender: (d.gender ?? 'not_specified') as Gender,
      phone: d.phone ?? '',
      email: d.email ?? '',
      allergies: d.allergies ?? '',
      currentMedications: d.currentMedications ?? '',
      notes: d.notes ?? '',
      insuranceProvider: d.insuranceProvider ?? '',
      insuranceNumber: d.insuranceNumber ?? '',
      emergencyContact: d.emergencyContact ?? '',
      emergencyPhone: d.emergencyPhone ?? '',
      isActive: d.isActive ?? true,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreFamilyMemberRepository
  extends BaseRepository<FamilyMember>
  implements FamilyMemberRepository
{
  protected collectionName = 'v2_family_members';
  protected converter = familyMemberConverter;

  async findByPrimaryPatientId(patientId: string): Promise<FamilyMember[]> {
    return this.findWhere('primaryPatientId', patientId);
  }

  async findByDoctorId(doctorId: string): Promise<FamilyMember[]> {
    return this.findWhere('doctorId', doctorId);
  }
}
