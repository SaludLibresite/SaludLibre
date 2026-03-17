import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';
import type { FamilyMember } from '@/src/modules/patients/domain/FamilyMemberEntity';

// GET /api/patients/me/family — List family members (v2 + legacy collections)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    // --- V2 family members ---
    let v2Members: FamilyMember[] = [];
    const patient = await getPatientService().getByUserId(user.uid);
    if (patient) {
      v2Members = await getPatientService().listFamilyMembers(patient.id);
    }

    // --- Legacy family members (familyMembers collection) ---
    // Find the legacy patient by userId to get their primaryPatientId
    const legacyPatientSnap = await adminDb
      .collection('patients')
      .where('userId', '==', user.uid)
      .limit(1)
      .get();

    let legacyMembers: FamilyMember[] = [];
    if (!legacyPatientSnap.empty) {
      const legacyPatientId = legacyPatientSnap.docs[0].id;
      const legacyMembersSnap = await adminDb
        .collection('familyMembers')
        .where('primaryPatientId', '==', legacyPatientId)
        .get();

      legacyMembers = legacyMembersSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          familyMemberId: d.familyMemberId ?? doc.id,
          primaryPatientId: d.primaryPatientId ?? legacyPatientId,
          doctorId: d.doctorId ?? '',
          name: d.name ?? '',
          relationship: d.relationship ?? '',
          dateOfBirth: d.dateOfBirth?.toDate?.() ?? new Date(d.dateOfBirth ?? 0),
          gender: d.gender ?? 'other',
          phone: d.phone ?? '',
          email: d.email ?? '',
          allergies: d.allergies ?? '',
          currentMedications: d.currentMedications ?? '',
          notes: d.notes ?? '',
          insuranceProvider: d.insuranceProvider ?? '',
          insuranceNumber: d.insuranceNumber ?? '',
          emergencyContact: d.emergencyContact ?? '',
          emergencyPhone: d.emergencyPhone ?? '',
          isActive: d.isActive !== false,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
          updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
        } as FamilyMember;
      });
    }

    // Merge — avoid duplicates by familyMemberId
    const v2Ids = new Set(v2Members.map((m) => m.familyMemberId));
    const uniqueLegacy = legacyMembers.filter((m) => !v2Ids.has(m.familyMemberId));
    const members = [...v2Members, ...uniqueLegacy];

    return jsonOk({ members, total: members.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/patients/me/family — Add family member
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const patient = await getPatientService().getByUserId(user.uid);
    if (!patient) return jsonError('Patient profile not found', 404);

    const body = await request.json();
    const member = await getPatientService().addFamilyMember({
      primaryPatientId: patient.id,
      doctorId: body.doctorId,
      name: body.name,
      relationship: body.relationship,
      dateOfBirth: new Date(body.dateOfBirth),
      gender: body.gender,
      phone: body.phone,
      email: body.email,
      allergies: body.allergies,
      currentMedications: body.currentMedications,
      insuranceProvider: body.insuranceProvider,
      insuranceNumber: body.insuranceNumber,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
    });
    return jsonCreated(member);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
