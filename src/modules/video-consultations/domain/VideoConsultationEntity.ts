import type { Timestamps } from '@/src/shared/domain/types';

// ============================================================
// VideoConsultation Entity — V2 Domain Model
// ============================================================
// Represents a video consultation room powered by Daily.co.
// Created by doctor, joined by patient. Linked to an appointment.
// ============================================================

export type VideoRoomStatus = 'scheduled' | 'active' | 'ended' | 'expired';

export interface VideoConsultation extends Timestamps {
  id: string;                           // Firestore document ID
  roomName: string;                     // Unique room slug (used in URL)
  roomUrl: string;                      // Full Daily.co room URL

  // References
  appointmentId: string;
  doctorId: string;
  patientId: string;

  // Denormalized for display
  doctorName: string;
  patientName: string;

  // Lifecycle
  status: VideoRoomStatus;
  scheduledAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  expiresAt: Date;                      // Auto-cleanup threshold
}
