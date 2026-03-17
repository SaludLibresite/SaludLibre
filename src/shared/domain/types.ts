// ============================================================
// Shared Value Objects, Enums & Types for the V2 Domain Layer
// ============================================================

// --- Timestamps ---
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// --- Gender ---
export type Gender = 'male' | 'female' | 'other' | 'not_specified';

// --- Appointment ---
export type AppointmentStatus =
  | 'pending'
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType = 'consultation' | 'follow_up' | 'emergency' | 'online';

export type AppointmentUrgency = 'low' | 'normal' | 'high' | 'urgent';

// --- Subscription ---
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'cancelled';

export type PaymentMethod =
  | 'manual_activation'
  | 'mercadopago'
  | 'credit_card'
  | 'debit_card'
  | 'transfer';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'manual';

export type ActivationType = 'manual' | 'automatic' | 'mercadopago';

// --- Referral ---
export type ReferralStatus = 'pending' | 'confirmed' | 'expired' | 'rejected';

// --- User ---
export type UserType = 'doctor' | 'patient' | 'superadmin';

export type RegistrationMethod = 'email' | 'google' | 'phone';

// --- Medical ---
export type DocumentCategory =
  | 'general'
  | 'lab_results'
  | 'imaging'
  | 'prescription'
  | 'report'
  | 'other';

export type UploaderRole = 'doctor' | 'patient';

// --- Geo ---
export interface GeoLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}
