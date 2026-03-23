import type { Specialty } from '../domain/SpecialtyEntity';
import type { SpecialtyRepository } from '../domain/SpecialtyRepository';
import type { FileStorage } from '@/src/shared/domain/ports/FileStorage';

// ============================================================
// Specialty Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreateSpecialtyInput {
  title: string;
  description: string;
  image?: { content: Buffer; contentType: string };
}

export interface UpdateSpecialtyInput {
  title?: string;
  description?: string;
  isActive?: boolean;
  image?: { content: Buffer; contentType: string };
}

export interface ImportSpecialtyRow {
  title: string;
  description?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  skippedTitles: string[];
}

// --- Service ---

export class SpecialtyService {
  constructor(
    private readonly specialtyRepo: SpecialtyRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  /** List all active specialties (public) */
  async listActive(): Promise<Specialty[]> {
    return this.specialtyRepo.findActive();
  }

  /** List ALL specialties including inactive — superadmin only */
  async listAll(): Promise<Specialty[]> {
    return this.specialtyRepo.findAll();
  }

  /** Get specialty by ID */
  async getById(id: string): Promise<Specialty | null> {
    return this.specialtyRepo.findById(id);
  }

  /** Create a new specialty — superadmin only */
  async create(input: CreateSpecialtyInput): Promise<Specialty> {
    let imagePath = '';
    let imageUrl = '';

    if (input.image) {
      const ext = input.image.contentType.split('/')[1] ?? 'jpg';
      const path = `specialties/${Date.now()}.${ext}`;
      const stored = await this.fileStorage.upload({
        path,
        content: input.image.content,
        contentType: input.image.contentType,
      });
      imagePath = path;
      imageUrl = stored.downloadUrl;
    }

    const now = new Date();
    const specialty: Specialty = {
      id: '',
      title: input.title,
      description: input.description,
      isActive: true,
      imagePath,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    };

    const newId = await this.specialtyRepo.add(specialty);
    return { ...specialty, id: newId };
  }

  /** Update a specialty — superadmin only */
  async update(specialtyId: string, input: UpdateSpecialtyInput): Promise<void> {
    const updates: Partial<Specialty> = { updatedAt: new Date() };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.isActive !== undefined) updates.isActive = input.isActive;

    if (input.image) {
      const ext = input.image.contentType.split('/')[1] ?? 'jpg';
      const path = `specialties/${specialtyId}.${ext}`;
      const stored = await this.fileStorage.upload({
        path,
        content: input.image.content,
        contentType: input.image.contentType,
      });
      updates.imagePath = path;
      updates.imageUrl = stored.downloadUrl;
    }

    await this.specialtyRepo.update(specialtyId, updates);
  }

  /** Permanently delete a specialty — superadmin only */
  async delete(specialtyId: string): Promise<void> {
    await this.specialtyRepo.delete(specialtyId);
  }

  /** Bulk import specialties from parsed Excel rows — superadmin only */
  async importBulk(rows: ImportSpecialtyRow[]): Promise<ImportResult> {
    const existing = await this.specialtyRepo.findAll();
    const existingTitles = new Set(existing.map(s => s.title.toLowerCase()));

    let imported = 0;
    const skippedTitles: string[] = [];

    for (const row of rows) {
      if (!row.title?.trim()) continue;

      if (existingTitles.has(row.title.toLowerCase())) {
        skippedTitles.push(row.title);
        continue;
      }

      await this.create({
        title: row.title.trim(),
        description: row.description?.trim() ?? `Especialidad de ${row.title.trim()}`,
      });
      imported++;
    }

    return {
      imported,
      skipped: skippedTitles.length,
      skippedTitles,
    };
  }
}
