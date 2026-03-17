import type { Timestamps } from '@/src/shared/domain/types';

// ============================================================
// Review Entity — V2 Domain Model
// ============================================================
// Patients rate doctors after completed appointments.
// Each review has an overall rating + aspect ratings + recommendation.
// ============================================================

export interface ReviewAspectRatings {
  punctuality: number;        // 1-5
  attention: number;          // 1-5
  explanation: number;        // 1-5
  facilities: number;         // 1-5
}

export interface Review extends Timestamps {
  id: string;                           // Firestore document ID

  // References
  appointmentId: string;                // Appointment this review is for
  patientId: string;                    // Patient who left the review
  doctorId: string;                     // Doctor being reviewed

  // Denormalized for display
  patientName: string;
  doctorName: string;

  // Ratings
  rating: number;                       // Overall 1-5
  aspects: ReviewAspectRatings;
  comment: string;
  wouldRecommend: boolean;
}
