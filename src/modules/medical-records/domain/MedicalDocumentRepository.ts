import type { MedicalDocument } from './MedicalDocumentEntity';

// ============================================================
// MedicalDocument Repository Port (Interface)
// ============================================================

export interface MedicalDocumentRepository {
  findById(id: string): Promise<MedicalDocument | null>;
  findByPatientId(patientId: string): Promise<MedicalDocument[]>;
  findByDoctorId(doctorId: string): Promise<MedicalDocument[]>;
  findByCategory(patientId: string, category: string): Promise<MedicalDocument[]>;
  save(document: MedicalDocument): Promise<void>;
  update(id: string, data: Partial<MedicalDocument>): Promise<void>;
  delete(id: string): Promise<void>;
}
