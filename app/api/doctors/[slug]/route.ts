import { NextRequest } from 'next/server';
import { getDoctorService, getReviewService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/doctors/[slug] — Public: get doctor profile + reviews + related
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const doctor = await getDoctorService().getBySlug(slug);
    if (!doctor) {
      return jsonError('Doctor not found', 404);
    }

    const [reviews, relatedDoctors, reviewSummary] = await Promise.all([
      getReviewService().listByDoctor(doctor.id),
      getDoctorService().listBySpecialty(doctor.specialty, doctor.id),
      getReviewService().getDoctorSummary(doctor.id),
    ]);

    return jsonOk({
      doctor,
      reviews,
      relatedDoctors: relatedDoctors.slice(0, 3),
      averageRating: reviewSummary.averageRating,
      totalReviews: reviewSummary.totalReviews,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
