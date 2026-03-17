import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Specialty } from '../domain/SpecialtyEntity';
import type { SpecialtyRepository } from '../domain/SpecialtyRepository';

const specialtyConverter: FirestoreDataConverter<Specialty> = {
  toFirestore(spec: Specialty) {
    return {
      title: spec.title,
      description: spec.description,
      isActive: spec.isActive,
      imagePath: spec.imagePath,
      imageUrl: spec.imageUrl,
      createdAt: Timestamp.fromDate(spec.createdAt),
      updatedAt: Timestamp.fromDate(spec.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Specialty {
    const d = snap.data();
    return {
      id: snap.id,
      title: d.title ?? '',
      description: d.description ?? '',
      isActive: d.isActive ?? true,
      imagePath: d.imagePath ?? '',
      imageUrl: d.imageUrl ?? '',
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

export class FirestoreSpecialtyRepository
  extends BaseRepository<Specialty>
  implements SpecialtyRepository
{
  protected collectionName = 'v2_specialties';
  protected converter = specialtyConverter;

  async findActive(): Promise<Specialty[]> {
    return this.findWhere('isActive', true);
  }
}
