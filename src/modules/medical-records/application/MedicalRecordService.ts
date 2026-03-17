import type { MedicalDocument } from '../domain/MedicalDocumentEntity';
import type { MedicalDocumentRepository } from '../domain/MedicalDocumentRepository';
import type { FileStorage } from '@/src/shared/domain/ports/FileStorage';
import type { DocumentCategory, UploaderRole } from '@/src/shared/domain/types';

// ============================================================
// Medical Records Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface UploadDocumentInput {
  patientId: string;
  doctorId: string;
  uploadedByUid: string;
  uploadedByRole: UploaderRole;
  title: string;
  category: DocumentCategory;
  file: Buffer;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface MedicalRecordsSummary {
  totalDocuments: number;
  labResults: number;
  imaging: number;
  prescriptions: number;
  reports: number;
  other: number;
}

// --- Service ---

export class MedicalRecordService {
  constructor(
    private readonly documentRepo: MedicalDocumentRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  /** Upload a medical document to storage and create record */
  async upload(input: UploadDocumentInput): Promise<MedicalDocument> {
    const storagePath = `medical-documents/${input.patientId}/${Date.now()}-${input.fileName}`;

    const stored = await this.fileStorage.upload({
      path: storagePath,
      content: input.file,
      contentType: input.contentType,
      metadata: {
        patientId: input.patientId,
        category: input.category,
      },
    });

    const now = new Date();
    const document: MedicalDocument = {
      id: '',
      patientId: input.patientId,
      doctorId: input.doctorId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      fileType: input.contentType,
      filePath: storagePath,
      downloadUrl: stored.downloadUrl,
      title: input.title,
      category: input.category,
      uploadedBy: input.uploadedByUid,
      uploadedByRole: input.uploadedByRole,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.documentRepo.save(document);
    return document;
  }

  /** List all documents for a patient, optionally by category */
  async listByPatient(
    patientId: string,
    category?: DocumentCategory,
  ): Promise<MedicalDocument[]> {
    if (category) {
      return this.documentRepo.findByCategory(patientId, category);
    }
    return this.documentRepo.findByPatientId(patientId);
  }

  /** Get a summary of all document counts by category */
  async getSummary(patientId: string): Promise<MedicalRecordsSummary> {
    const docs = await this.documentRepo.findByPatientId(patientId);

    return {
      totalDocuments: docs.length,
      labResults: docs.filter(d => d.category === 'lab_results').length,
      imaging: docs.filter(d => d.category === 'imaging').length,
      prescriptions: docs.filter(d => d.category === 'prescription').length,
      reports: docs.filter(d => d.category === 'report').length,
      other: docs.filter(d => d.category === 'other' || d.category === 'general').length,
    };
  }

  /** Delete a medical document (removes from storage + Firestore) */
  async delete(documentId: string): Promise<void> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) throw new Error('Document not found');

    await this.fileStorage.delete(doc.filePath);
    await this.documentRepo.delete(documentId);
  }
}
