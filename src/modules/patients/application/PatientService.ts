import type { Patient, AssignedDoctor } from '../domain/PatientEntity';
import type { FamilyMember } from '../domain/FamilyMemberEntity';
import type { PatientRepository, FamilyMemberRepository } from '../domain/PatientRepository';
import type { EmailService } from '@/src/shared/domain/ports/EmailService';
import type { FileStorage } from '@/src/shared/domain/ports/FileStorage';
import type { Gender, RegistrationMethod } from '@/src/shared/domain/types';

// ============================================================
// Patient Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface RegisterPatientInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  address: string;
  registrationMethod: RegistrationMethod;
  // Optional step-2 fields
  allergies?: string;
  currentMedications?: string;
  medicalHistory?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Optional step-3
  referralCode?: string;
  selectedDoctorId?: string;
  // Google auth
  googleDisplayName?: string;
  googlePhotoUrl?: string;
}

export interface UpdatePatientProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  gender?: Gender;
  allergies?: string;
  currentMedications?: string;
  medicalHistory?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dni?: string;
}

export interface AddFamilyMemberInput {
  primaryPatientId: string;
  doctorId: string;
  name: string;
  relationship: string;
  dateOfBirth: Date;
  gender: Gender;
  phone?: string;
  email?: string;
  allergies?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

// --- Service ---

export class PatientService {
  constructor(
    private readonly patientRepo: PatientRepository,
    private readonly familyMemberRepo: FamilyMemberRepository,
    private readonly emailService: EmailService,
    private readonly fileStorage: FileStorage,
  ) {}

  // ========== Patient Profile ==========

  /** Get patient by Firestore document ID */
  async getById(id: string): Promise<Patient | null> {
    return this.patientRepo.findById(id);
  }

  /** Get patient by Firebase Auth UID */
  async getByUserId(userId: string): Promise<Patient | null> {
    return this.patientRepo.findByUserId(userId);
  }

  /** Register a new patient (3-step flow from legacy) */
  async register(input: RegisterPatientInput): Promise<Patient> {
    const existing = await this.patientRepo.findByUserId(input.userId);
    if (existing) {
      throw new Error('Patient already registered for this user');
    }

    const now = new Date();
    const patient: Patient = {
      id: '',
      userId: input.userId,
      userType: 'patient',
      name: input.name,
      email: input.email,
      phone: input.phone,
      dni: '',
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      profilePhoto: input.googlePhotoUrl ?? null,
      allergies: input.allergies ?? '',
      currentMedications: input.currentMedications ?? '',
      medicalHistory: input.medicalHistory ?? '',
      insurance: {
        provider: input.insuranceProvider ?? '',
        number: input.insuranceNumber ?? '',
      },
      emergencyContact: {
        name: input.emergencyContactName ?? '',
        phone: input.emergencyContactPhone ?? '',
      },
      registrationMethod: input.registrationMethod,
      isActive: true,
      dataComplete: this.isProfileComplete(input),
      referralCode: input.referralCode ?? '',
      temporaryPassword: false,
      googleInfo: input.googleDisplayName
        ? {
            displayName: input.googleDisplayName,
            photoUrl: input.googlePhotoUrl ?? null,
            providerId: 'google.com',
          }
        : null,
      doctors: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.patientRepo.save(patient);

    // Send welcome email (fire-and-forget)
    this.emailService
      .send({
        to: { email: input.email, name: input.name },
        subject: 'Bienvenido a Salud Libre',
        html: this.buildWelcomeEmail(input.name),
      })
      .catch(() => {}); // non-blocking

    return patient;
  }

  /** Update patient profile */
  async updateProfile(patientId: string, input: UpdatePatientProfileInput): Promise<void> {
    const patient = await this.patientRepo.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    const updates: Partial<Patient> = { updatedAt: new Date() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.address !== undefined) updates.address = input.address;
    if (input.gender !== undefined) updates.gender = input.gender;
    if (input.dni !== undefined) updates.dni = input.dni;
    if (input.allergies !== undefined) updates.allergies = input.allergies;
    if (input.currentMedications !== undefined) updates.currentMedications = input.currentMedications;
    if (input.medicalHistory !== undefined) updates.medicalHistory = input.medicalHistory;

    if (input.insuranceProvider !== undefined || input.insuranceNumber !== undefined) {
      updates.insurance = {
        provider: input.insuranceProvider ?? patient.insurance.provider,
        number: input.insuranceNumber ?? patient.insurance.number,
      };
    }

    if (input.emergencyContactName !== undefined || input.emergencyContactPhone !== undefined) {
      updates.emergencyContact = {
        name: input.emergencyContactName ?? patient.emergencyContact.name,
        phone: input.emergencyContactPhone ?? patient.emergencyContact.phone,
      };
    }

    await this.patientRepo.update(patientId, updates);
  }

  /** Upload/update profile photo */
  async updateProfilePhoto(patientId: string, file: Buffer, contentType: string): Promise<string> {
    const stored = await this.fileStorage.upload({
      path: `patients/${patientId}/profile.${contentType.split('/')[1] ?? 'jpg'}`,
      content: file,
      contentType,
    });

    await this.patientRepo.update(patientId, {
      profilePhoto: stored.downloadUrl,
      updatedAt: new Date(),
    });

    return stored.downloadUrl;
  }

  /** Assign a doctor to a patient */
  async assignDoctor(patientId: string, doctor: AssignedDoctor): Promise<void> {
    const patient = await this.patientRepo.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    const alreadyAssigned = patient.doctors.some(d => d.doctorId === doctor.doctorId);
    if (alreadyAssigned) return;

    const updatedDoctors = [...patient.doctors, doctor];
    await this.patientRepo.update(patientId, {
      doctors: updatedDoctors,
      updatedAt: new Date(),
    });
  }

  /** List patients by assigned doctor ID */
  async listByDoctorId(doctorId: string): Promise<Patient[]> {
    return this.patientRepo.findByDoctorId(doctorId);
  }

  /** List all patients — superadmin only */
  async listAll(): Promise<Patient[]> {
    return this.patientRepo.findAll();
  }

  /** Delete patient — superadmin only */
  async delete(patientId: string): Promise<void> {
    await this.patientRepo.delete(patientId);
  }

  // ========== Family Members ==========

  /** Add a family member (dependent) */
  async addFamilyMember(input: AddFamilyMemberInput): Promise<FamilyMember> {
    const now = new Date();
    const familyMemberId = `FAM-${Math.random().toString().slice(2, 8)}`;
    const member: FamilyMember = {
      id: '',
      familyMemberId,
      primaryPatientId: input.primaryPatientId,
      doctorId: input.doctorId,
      name: input.name,
      relationship: input.relationship,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone ?? '',
      email: input.email ?? '',
      allergies: input.allergies ?? '',
      currentMedications: input.currentMedications ?? '',
      notes: '',
      insuranceProvider: input.insuranceProvider ?? '',
      insuranceNumber: input.insuranceNumber ?? '',
      emergencyContact: input.emergencyContact ?? '',
      emergencyPhone: input.emergencyPhone ?? '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.familyMemberRepo.save(member);
    return member;
  }

  /** List family members for a primary patient */
  async listFamilyMembers(primaryPatientId: string): Promise<FamilyMember[]> {
    return this.familyMemberRepo.findByPrimaryPatientId(primaryPatientId);
  }

  /** Update a family member */
  async updateFamilyMember(memberId: string, data: Partial<FamilyMember>): Promise<void> {
    await this.familyMemberRepo.update(memberId, { ...data, updatedAt: new Date() });
  }

  /** Delete a family member */
  async deleteFamilyMember(memberId: string): Promise<void> {
    await this.familyMemberRepo.delete(memberId);
  }

  // ========== Private helpers ==========

  private isProfileComplete(input: RegisterPatientInput): boolean {
    return !!(
      input.name &&
      input.email &&
      input.phone &&
      input.dateOfBirth &&
      input.gender
    );
  }

  private buildWelcomeEmail(name: string): string {
    return `
      <h1>¡Bienvenido a Salud Libre, ${name}!</h1>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Ya podés buscar profesionales de salud y agendar turnos desde tu panel.</p>
    `;
  }
}
