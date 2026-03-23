import type { Timestamps, Gender, GeoLocation, SubscriptionStatus } from '@/src/shared/domain/types';

// ============================================================
// Doctor Entity — V2 Domain Model
// ============================================================
// V1 fields mapped → V2 (Spanish to English, normalized)
//   nombre → name
//   descripcion → description
//   especialidad → specialty
//   telefono → phone
//   genero → gender (enum)
//   imagen → profileImage
//   horario → schedule
//   consultaOnline → onlineConsultation
//   ubicacion/latitude/longitude/formattedAddress → location (GeoLocation)
//   subscriptionStatus/subscriptionPlan/subscriptionPlanId → subscription (embedded)
// ============================================================

export interface DoctorSubscriptionSummary {
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  expiresAt: Date | null;
}

export interface DoctorProfessionalInfo {
  profession: string;       // "Médico", "Kinesiólogo", etc.
  licenseNumber: string;    // was "matricula"
  officeAddress: string;    // was "domicilio"
  signatureUrl: string | null;
  stampUrl: string | null;
}

export interface DayTimeRange {
  from: string; // "HH:mm"
  to: string;   // "HH:mm"
}

export interface DaySchedule {
  enabled: boolean;
  ranges: DayTimeRange[]; // up to 2 ranges per day
}

export type WeekDay = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface ScheduleConfig {
  enabled: boolean;
  slotDuration: number; // minutes (default 30)
  days: Record<WeekDay, DaySchedule>;
}

export interface Doctor extends Timestamps {
  id: string;                       // Firestore document ID
  userId: string;                   // Firebase Auth UID
  name: string;
  slug: string;
  email: string;
  phone: string;
  gender: Gender;
  specialty: string;
  description: string;
  profileImage: string;
  schedule: string;
  scheduleConfig?: ScheduleConfig;
  onlineConsultation: boolean;
  location: GeoLocation;
  verified: boolean;
  subscription: DoctorSubscriptionSummary;
  professional: DoctorProfessionalInfo;
}
