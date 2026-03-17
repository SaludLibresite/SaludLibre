import type {
  Prescription,
  PrescriptionMedication,
  PrescriptionDoctorSnapshot,
  PrescriptionPatientSnapshot,
} from '../domain/PrescriptionEntity';
import type { PrescriptionRepository } from '../domain/PrescriptionRepository';
import type { DoctorRepository } from '@/src/modules/doctors/domain/DoctorRepository';
import type { PatientRepository } from '@/src/modules/patients/domain/PatientRepository';

// ============================================================
// Prescription Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreatePrescriptionInput {
  appointmentId: string;
  doctorUserId: string;     // Firebase Auth UID — used to look up doctor
  patientId: string;        // Patient Firestore doc ID
  medications: PrescriptionMedication[];
  diagnosis: string;
  notes?: string;
}

// --- Service ---

export class PrescriptionService {
  constructor(
    private readonly prescriptionRepo: PrescriptionRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly patientRepo: PatientRepository,
  ) {}

  /** Get prescription by Firestore ID */
  async getById(id: string): Promise<Prescription | null> {
    return this.prescriptionRepo.findById(id);
  }

  /** Get prescription linked to an appointment */
  async getByAppointmentId(appointmentId: string): Promise<Prescription | null> {
    return this.prescriptionRepo.findByAppointmentId(appointmentId);
  }

  /** Create a new prescription with frozen doctor/patient snapshots */
  async create(input: CreatePrescriptionInput): Promise<Prescription> {
    const [doctor, patient] = await Promise.all([
      this.doctorRepo.findByUserId(input.doctorUserId),
      this.patientRepo.findById(input.patientId),
    ]);
    if (!doctor) throw new Error('Doctor not found');
    if (!patient) throw new Error('Patient not found');

    const now = new Date();
    const age = this.calculateAge(patient.dateOfBirth);

    const doctorSnapshot: PrescriptionDoctorSnapshot = {
      doctorDocId: doctor.id,
      userId: doctor.userId,
      name: doctor.name,
      specialty: doctor.specialty,
      profession: doctor.professional.profession,
      phone: doctor.phone,
      officeAddress: doctor.professional.officeAddress,
      licenseNumber: doctor.professional.licenseNumber,
      signatureUrl: doctor.professional.signatureUrl,
      stampUrl: doctor.professional.stampUrl,
    };

    const patientSnapshot: PrescriptionPatientSnapshot = {
      patientDocId: patient.id,
      name: patient.name,
      age,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      dni: patient.dni,
      insuranceProvider: patient.insurance.provider,
    };

    const prescription: Prescription = {
      id: '',
      appointmentId: input.appointmentId,
      doctorId: doctor.userId,
      patientId: input.patientId,
      doctorSnapshot,
      patientSnapshot,
      medications: input.medications,
      diagnosis: input.diagnosis,
      notes: input.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };

    await this.prescriptionRepo.add(prescription);
    return prescription;
  }

  /** List prescriptions for a patient */
  async listByPatient(patientId: string): Promise<Prescription[]> {
    return this.prescriptionRepo.findByPatientId(patientId);
  }

  /** List prescriptions by a doctor */
  async listByDoctor(doctorId: string): Promise<Prescription[]> {
    return this.prescriptionRepo.findByDoctorId(doctorId);
  }

  /** Delete a prescription */
  async delete(prescriptionId: string): Promise<void> {
    await this.prescriptionRepo.delete(prescriptionId);
  }

  // --- Private helpers ---

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }
}
