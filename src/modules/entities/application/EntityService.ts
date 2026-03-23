import type { MedicalEntity, EntityType } from '../domain/EntityEntity';
import type { EntityRepository } from '../domain/EntityRepository';
import type { GeoLocation } from '@/src/shared/domain/types';

// ============================================================
// Entity Service — Application Layer (Use Cases)
// ============================================================

export interface CreateEntityInput {
  type: EntityType;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  schedule?: string;
  location?: GeoLocation;
  website?: string;
  verified?: boolean;
}

export interface UpdateEntityInput {
  type?: EntityType;
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  schedule?: string;
  location?: GeoLocation;
  website?: string;
  verified?: boolean;
  profileImage?: string;
}

export class EntityService {
  constructor(private readonly entityRepo: EntityRepository) {}

  // --- Queries ---

  async listAll(): Promise<MedicalEntity[]> {
    return this.entityRepo.findAll();
  }

  async listVerified(): Promise<MedicalEntity[]> {
    return this.entityRepo.findVerified();
  }

  async listByType(type: EntityType): Promise<MedicalEntity[]> {
    return this.entityRepo.findByType(type);
  }

  async getById(id: string): Promise<MedicalEntity | null> {
    return this.entityRepo.findById(id);
  }

  async getBySlug(slug: string): Promise<MedicalEntity | null> {
    return this.entityRepo.findBySlug(slug);
  }

  // --- Commands ---

  async create(input: CreateEntityInput): Promise<MedicalEntity> {
    const slug = this.generateSlug(input.name, input.type);
    const now = new Date();

    const entity: MedicalEntity = {
      id: '',
      type: input.type,
      name: input.name,
      slug,
      email: input.email,
      phone: input.phone ?? '',
      description: input.description ?? '',
      profileImage: '',
      schedule: input.schedule ?? '',
      location: input.location ?? { latitude: 0, longitude: 0, formattedAddress: '' },
      website: input.website ?? '',
      verified: input.verified ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const id = await this.entityRepo.add(entity);
    return { ...entity, id };
  }

  async update(entityId: string, input: UpdateEntityInput): Promise<void> {
    const entity = await this.entityRepo.findById(entityId);
    if (!entity) throw new Error('Entity not found');

    const updates: Partial<MedicalEntity> = { updatedAt: new Date() };

    if (input.type !== undefined) updates.type = input.type;
    if (input.name !== undefined) updates.name = input.name;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.description !== undefined) updates.description = input.description;
    if (input.schedule !== undefined) updates.schedule = input.schedule;
    if (input.location !== undefined) updates.location = input.location;
    if (input.website !== undefined) updates.website = input.website;
    if (input.verified !== undefined) updates.verified = input.verified;
    if (input.profileImage !== undefined) updates.profileImage = input.profileImage;

    if (input.name || input.type) {
      updates.slug = this.generateSlug(
        input.name ?? entity.name,
        input.type ?? entity.type,
      );
    }

    await this.entityRepo.update(entityId, updates);
  }

  async verify(entityId: string): Promise<void> {
    const entity = await this.entityRepo.findById(entityId);
    if (!entity) throw new Error('Entity not found');
    await this.entityRepo.update(entityId, { verified: true, updatedAt: new Date() });
  }

  async delete(entityId: string): Promise<void> {
    await this.entityRepo.delete(entityId);
  }

  // --- Helpers ---

  private generateSlug(name: string, type: string): string {
    const base = `${name} ${type}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}
