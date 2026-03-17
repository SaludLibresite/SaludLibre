import type { Review } from '../domain/ReviewEntity';
import type { ReviewRepository } from '../domain/ReviewRepository';
import type { AppointmentRepository } from '@/src/modules/appointments/domain/AppointmentRepository';

// ============================================================
// Review Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface CreateReviewInput {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  rating: number;                    // 1-5
  aspects: {
    punctuality: number;
    attention: number;
    explanation: number;
    facilities: number;
  };
  comment?: string;
  wouldRecommend: boolean;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  averageAspects: {
    punctuality: number;
    attention: number;
    explanation: number;
    facilities: number;
  };
}

// --- Service ---

export class ReviewService {
  constructor(
    private readonly reviewRepo: ReviewRepository,
    private readonly appointmentRepo: AppointmentRepository,
  ) {}

  /** Create a review for a completed appointment */
  async create(input: CreateReviewInput): Promise<Review> {
    // Validate rating range
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check appointment exists and is completed
    const appointment = await this.appointmentRepo.findById(input.appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status !== 'completed') {
      throw new Error('Can only review completed appointments');
    }

    // Check not already reviewed
    const existing = await this.reviewRepo.findByAppointmentId(input.appointmentId);
    if (existing) throw new Error('This appointment has already been reviewed');

    const now = new Date();
    const review: Review = {
      id: '',
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      patientName: input.patientName,
      doctorName: input.doctorName,
      rating: input.rating,
      aspects: input.aspects,
      comment: input.comment ?? '',
      wouldRecommend: input.wouldRecommend,
      createdAt: now,
      updatedAt: now,
    };

    await this.reviewRepo.save(review);
    return review;
  }

  /** List all reviews for a doctor (public profile) */
  async listByDoctor(doctorId: string): Promise<Review[]> {
    return this.reviewRepo.findByDoctorId(doctorId);
  }

  /** List all reviews written by a patient */
  async listByPatient(patientId: string): Promise<Review[]> {
    return this.reviewRepo.findByPatientId(patientId);
  }

  /** Get review summary/stats for a doctor */
  async getDoctorSummary(doctorId: string): Promise<ReviewSummary> {
    const reviews = await this.reviewRepo.findByDoctorId(doctorId);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let totalPunctuality = 0;
    let totalAttention = 0;
    let totalExplanation = 0;
    let totalFacilities = 0;

    for (const r of reviews) {
      const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (rounded >= 1 && rounded <= 5) distribution[rounded]++;
      totalPunctuality += r.aspects.punctuality;
      totalAttention += r.aspects.attention;
      totalExplanation += r.aspects.explanation;
      totalFacilities += r.aspects.facilities;
    }

    const count = reviews.length || 1; // avoid division by zero

    return {
      averageRating:
        reviews.length > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : 0,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      averageAspects: {
        punctuality: Math.round((totalPunctuality / count) * 10) / 10,
        attention: Math.round((totalAttention / count) * 10) / 10,
        explanation: Math.round((totalExplanation / count) * 10) / 10,
        facilities: Math.round((totalFacilities / count) * 10) / 10,
      },
    };
  }

  /** Get completed appointments that haven't been reviewed yet */
  async getReviewableAppointments(patientId: string): Promise<string[]> {
    const appointments = await this.appointmentRepo.findByPatientId(patientId);
    const completed = appointments.filter(a => a.status === 'completed');

    const reviewable: string[] = [];
    for (const apt of completed) {
      const review = await this.reviewRepo.findByAppointmentId(apt.id);
      if (!review) {
        reviewable.push(apt.id);
      }
    }

    return reviewable;
  }
}
