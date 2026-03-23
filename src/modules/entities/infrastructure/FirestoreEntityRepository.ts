import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { MedicalEntity, EntityType } from '../domain/EntityEntity';
import type { EntityRepository } from '../domain/EntityRepository';

// ============================================================
// Firestore ↔ MedicalEntity converter
// ============================================================

const entityConverter: FirestoreDataConverter<MedicalEntity> = {
  toFirestore(entity: MedicalEntity) {
    return {
      type: entity.type,
      name: entity.name,
      slug: entity.slug,
      email: entity.email,
      phone: entity.phone,
      description: entity.description,
      profileImage: entity.profileImage,
      schedule: entity.schedule,
      location: entity.location,
      website: entity.website,
      verified: entity.verified,
      createdAt: Timestamp.fromDate(entity.createdAt),
      updatedAt: Timestamp.fromDate(entity.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): MedicalEntity {
    const d = snap.data();
    return {
      id: snap.id,
      type: (d.type ?? 'centro_medico') as EntityType,
      name: d.name ?? '',
      slug: d.slug ?? '',
      email: d.email ?? '',
      phone: d.phone ?? '',
      description: d.description ?? '',
      profileImage: d.profileImage ?? '',
      schedule: d.schedule ?? '',
      location: d.location ?? { latitude: 0, longitude: 0, formattedAddress: '' },
      website: d.website ?? '',
      verified: d.verified ?? false,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

// ============================================================
// Firestore Entity Repository
// ============================================================

export class FirestoreEntityRepository
  extends BaseRepository<MedicalEntity>
  implements EntityRepository
{
  protected collectionName = 'v2_entities';
  protected converter = entityConverter;

  async findBySlug(slug: string): Promise<MedicalEntity | null> {
    return this.findFirst('slug', slug);
  }

  async findByType(type: EntityType): Promise<MedicalEntity[]> {
    return this.findWhere('type', type);
  }

  async findVerified(): Promise<MedicalEntity[]> {
    return this.findWhere('verified', true);
  }
}
