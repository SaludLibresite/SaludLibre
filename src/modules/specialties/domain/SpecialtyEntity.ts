import type { Timestamps } from '@/src/shared/domain/types';

// ============================================================
// Specialty Entity — V2 Domain Model
// ============================================================

export interface Specialty extends Timestamps {
  id: string;                           // Firestore document ID
  title: string;
  description: string;
  isActive: boolean;
  imagePath: string;
  imageUrl: string;
}
