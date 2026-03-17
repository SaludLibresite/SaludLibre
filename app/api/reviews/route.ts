import { NextRequest, NextResponse } from 'next/server';
import { getReviewService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';

// GET /api/reviews — List reviews (by doctorId query param for public, or own reviews)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const doctorId = searchParams.get('doctorId');

    // Public endpoint: list by doctorId
    if (doctorId) {
      const reviews = await getReviewService().listByDoctor(doctorId);
      const summary = await getReviewService().getDoctorSummary(doctorId);
      return jsonOk({ reviews, summary, total: reviews.length });
    }

    // Authenticated: list own reviews
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.patientId) {
      const reviews = await getReviewService().listByPatient(user.patientId);
      return jsonOk({ reviews, total: reviews.length });
    }

    return jsonError('doctorId query param is required for non-patient users', 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/reviews — Patient creates a review
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (!user.patientId) {
      return jsonError('Only patients can create reviews', 403);
    }

    const body = await request.json();
    const review = await getReviewService().create({
      appointmentId: body.appointmentId,
      patientId: user.patientId,
      patientName: body.patientName,
      doctorId: body.doctorId,
      doctorName: body.doctorName,
      rating: body.rating,
      aspects: body.aspects,
      comment: body.comment,
      wouldRecommend: body.wouldRecommend,
    });

    return jsonCreated(review);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
