import type { Specialty } from './SpecialtyEntity';

// ============================================================
// Specialty Repository Port (Interface)
// ============================================================

export interface SpecialtyRepository {
  findById(id: string): Promise<Specialty | null>;
  findAll(): Promise<Specialty[]>;
  findActive(): Promise<Specialty[]>;
  save(specialty: Specialty): Promise<void>;
  update(id: string, data: Partial<Specialty>): Promise<void>;
  delete(id: string): Promise<void>;
}
