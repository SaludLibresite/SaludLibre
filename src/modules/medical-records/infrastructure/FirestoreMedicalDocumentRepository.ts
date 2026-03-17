import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { MedicalDocument } from '../domain/MedicalDocumentEntity';
import type { MedicalDocumentRepository } from '../domain/MedicalDocumentRepository';
import type { DocumentCategory, UploaderRole } from '@/src/shared/domain/types';

const medicalDocConverter: FirestoreDataConverter<MedicalDocument> = {
  toFirestore(doc: MedicalDocument) {
    return {
      patientId: doc.patientId,
      doctorId: doc.doctorId,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      filePath: doc.filePath,
      downloadUrl: doc.downloadUrl,
      title: doc.title,
      category: doc.category,
      uploadedBy: doc.uploadedBy,
      uploadedByRole: doc.uploadedByRole,
      uploadedAt: Timestamp.fromDate(doc.uploadedAt),
      createdAt: Timestamp.fromDate(doc.createdAt),
      updatedAt: Timestamp.fromDate(doc.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): MedicalDocument {
    const d = snap.data();
    return {
      id: snap.id,
      patientId: d.patientId ?? '',
      doctorId: d.doctorId ?? '',
      fileName: d.fileName ?? '',
      fileSize: d.fileSize ?? 0,
      fileType: d.fileType ?? '',
      filePath: d.filePath ?? '',
      downloadUrl: d.downloadUrl ?? '',
      title: d.title ?? '',
      category: (d.category ?? 'general') as DocumentCategory,
      uploadedBy: d.uploadedBy ?? '',
      uploadedByRole: (d.uploadedByRole ?? 'doctor') as UploaderRole,
      uploadedAt: d.uploadedAt?.toDate?.() ?? new Date(),
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreMedicalDocumentRepository
  extends BaseRepository<MedicalDocument>
  implements MedicalDocumentRepository
{
  protected collectionName = 'v2_medical_documents';
  protected converter = medicalDocConverter;

  async findByPatientId(patientId: string): Promise<MedicalDocument[]> {
    return this.findWhere('patientId', patientId);
  }

  async findByDoctorId(doctorId: string): Promise<MedicalDocument[]> {
    return this.findWhere('doctorId', doctorId);
  }

  async findByCategory(patientId: string, category: string): Promise<MedicalDocument[]> {
    const { where } = await import('firebase/firestore');
    return this.findAll([
      where('patientId', '==', patientId),
      where('category', '==', category),
    ]);
  }
}
