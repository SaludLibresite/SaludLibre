import type { Timestamps, GeoLocation } from '@/src/shared/domain/types';

// ============================================================
// Medical Entity — V2 Domain Model
// Represents Centros Médicos, Farmacias, Laboratorios
// These appear on /doctores but link to /entidades/[slug]
// They do NOT support appointment booking.
// ============================================================

export type EntityType = 'centro_medico' | 'farmacia' | 'laboratorio';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  centro_medico: 'Centro Médico',
  farmacia: 'Farmacia',
  laboratorio: 'Laboratorio',
};

export const ENTITY_TYPE_COLORS: Record<EntityType, { bg: string; text: string; dot: string }> = {
  centro_medico: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  farmacia: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  laboratorio: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export interface MedicalEntity extends Timestamps {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  email: string;
  phone: string;
  description: string;
  profileImage: string;
  schedule: string;
  location: GeoLocation;
  website: string;
  verified: boolean;
}
