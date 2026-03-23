import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { getPatientService } from '@/src/infrastructure/container';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { getSpecialtyService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/stats — Aggregated platform statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const [doctors, patients, subscriptions, specialties] = await Promise.all([
      getDoctorService().listAll(),
      getPatientService().listAll(),
      getSubscriptionService().listAll(),
      getSpecialtyService().listAll(),
    ]);

    const now = new Date();
    const verifiedDoctors = doctors.filter(d => d.verified);
    const pendingDoctors = doctors.filter(d => !d.verified);
    const activeSpecialties = specialties.filter(s => s.isActive);

    const activeSubs = subscriptions.filter(
      s => s.status === 'active' && (!s.expiresAt || s.expiresAt > now),
    );
    const expiredSubs = subscriptions.filter(
      s => s.expiresAt && s.expiresAt <= now,
    );

    const totalRevenue = activeSubs.reduce((sum, s) => sum + (s.price ?? 0), 0);

    const planBreakdown = {
      plus: activeSubs.filter(s => s.planName?.toLowerCase().includes('plus')).length,
      medium: activeSubs.filter(s => s.planName?.toLowerCase().includes('medium')).length,
      free: doctors.length - activeSubs.filter(s => s.planName?.toLowerCase().includes('plus') || s.planName?.toLowerCase().includes('medium')).length,
    };

    const onlineDoctors = doctors.filter(d => d.onlineConsultation).length;

    return jsonOk({
      totalDoctors: doctors.length,
      verifiedDoctors: verifiedDoctors.length,
      pendingDoctors: pendingDoctors.length,
      totalPatients: patients.length,
      activeSubscriptions: activeSubs.length,
      expiredSubscriptions: expiredSubs.length,
      totalSubscriptions: subscriptions.length,
      totalRevenue,
      totalSpecialties: specialties.length,
      activeSpecialties: activeSpecialties.length,
      planBreakdown,
      onlineDoctors,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
