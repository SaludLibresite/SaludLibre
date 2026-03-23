import type { Doctor } from './DoctorEntity';

// ============================================================
// Doctor Repository Port (Interface)
// Domain layer defines WHAT, infrastructure defines HOW
// ============================================================

export interface DoctorRepository {
  findById(id: string): Promise<Doctor | null>;
  findByUserId(userId: string): Promise<Doctor | null>;
  findBySlug(slug: string): Promise<Doctor | null>;
  findAll(): Promise<Doctor[]>;
  findBySpecialty(specialty: string): Promise<Doctor[]>;
  findVerified(): Promise<Doctor[]>;
  save(doctor: Doctor): Promise<void>;
  add(doctor: Doctor): Promise<string>;
  update(id: string, data: Partial<Doctor>): Promise<void>;
  delete(id: string): Promise<void>;
}
