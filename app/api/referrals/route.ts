import { NextRequest, NextResponse } from 'next/server';
import { getReferralService } from '@/src/infrastructure/container';
import { requireRole, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';

// GET /api/referrals — Doctor: list own referrals
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'doctor');
    if (user instanceof NextResponse) return user;

    const [sent, received, stats] = await Promise.all([
      getReferralService().listByReferrer(user.doctorId!),
      getReferralService().listByReferred(user.doctorId!),
      getReferralService().getStats(user.doctorId!),
    ]);

    return jsonOk({ sent, received, stats });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/referrals — Doctor: create a referral
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'doctor');
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const referral = await getReferralService().create({
      referrerDoctorId: user.doctorId!,
      referredDoctorUserId: body.referredDoctorUserId,
      referredDoctorName: body.referredDoctorName,
      referredDoctorEmail: body.referredDoctorEmail,
      referredDoctorSpecialty: body.referredDoctorSpecialty,
    });

    return jsonCreated(referral);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
