import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { BaseRepository } from '@/src/infrastructure/persistence/BaseRepository';
import type { Review, ReviewAspectRatings } from '../domain/ReviewEntity';
import type { ReviewRepository } from '../domain/ReviewRepository';

// ============================================================
// Firestore ↔ Review converter
// ============================================================

const reviewConverter: FirestoreDataConverter<Review> = {
  toFirestore(review: Review) {
    return {
      appointmentId: review.appointmentId,
      patientId: review.patientId,
      doctorId: review.doctorId,
      patientName: review.patientName,
      doctorName: review.doctorName,
      rating: review.rating,
      aspects: review.aspects,
      comment: review.comment,
      wouldRecommend: review.wouldRecommend,
      createdAt: Timestamp.fromDate(review.createdAt),
      updatedAt: Timestamp.fromDate(review.updatedAt),
    };
  },

  fromFirestore(snap: QueryDocumentSnapshot): Review {
    const d = snap.data();
    return {
      id: snap.id,
      appointmentId: d.appointmentId ?? '',
      patientId: d.patientId ?? '',
      doctorId: d.doctorId ?? '',
      patientName: d.patientName ?? '',
      doctorName: d.doctorName ?? '',
      rating: d.rating ?? 0,
      aspects: {
        punctuality: d.aspects?.punctuality ?? 0,
        attention: d.aspects?.attention ?? 0,
        explanation: d.aspects?.explanation ?? 0,
        facilities: d.aspects?.facilities ?? 0,
      } satisfies ReviewAspectRatings,
      comment: d.comment ?? '',
      wouldRecommend: d.wouldRecommend ?? false,
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  },
};

// ============================================================
// Firestore Review Repository — Infrastructure implementation
// ============================================================

export class FirestoreReviewRepository
  extends BaseRepository<Review>
  implements ReviewRepository
{
  protected collectionName = 'v2_reviews';
  protected converter = reviewConverter;

  async findByDoctorId(doctorId: string): Promise<Review[]> {
    return this.findWhere('doctorId', doctorId);
  }

  async findByPatientId(patientId: string): Promise<Review[]> {
    return this.findWhere('patientId', patientId);
  }

  async findByAppointmentId(appointmentId: string): Promise<Review | null> {
    return this.findFirst('appointmentId', appointmentId);
  }
}
