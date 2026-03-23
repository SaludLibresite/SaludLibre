import type { MedicalEntity, EntityType } from './EntityEntity';

// ============================================================
// Medical Entity Repository Port (Interface)
// ============================================================

export interface EntityRepository {
  findById(id: string): Promise<MedicalEntity | null>;
  findBySlug(slug: string): Promise<MedicalEntity | null>;
  findAll(): Promise<MedicalEntity[]>;
  findByType(type: EntityType): Promise<MedicalEntity[]>;
  findVerified(): Promise<MedicalEntity[]>;
  save(entity: MedicalEntity): Promise<void>;
  update(id: string, data: Partial<MedicalEntity>): Promise<void>;
  delete(id: string): Promise<void>;
}
