import { NextRequest, NextResponse } from 'next/server';
import { getReferralService, getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/referrals — List all referrals with doctor info
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const referrals = await getReferralService().listAll();
    const doctors = await getDoctorService().listAll();
    const doctorMap = new Map(doctors.map(d => [d.id, d]));

    const enriched = referrals.map(ref => {
      const referrer = doctorMap.get(ref.referrerDoctorId);
      return {
        id: ref.id,
        referrerId: ref.referrerDoctorId,
        referrerName: referrer?.name ?? 'Desconocido',
        referrerEmail: referrer?.email ?? '',
        referredId: ref.referredDoctorId,
        referredName: ref.referredDoctorName,
        referredEmail: ref.referredDoctorEmail,
        referredSpecialty: ref.referredDoctorSpecialty,
        status: ref.status,
        confirmedAt: ref.confirmedAt?.toISOString?.() ?? null,
        createdAt: ref.createdAt?.toISOString?.() ?? '',
      };
    });

    return jsonOk({ referrals: enriched });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
