import { NextRequest, NextResponse } from 'next/server';
import { getDoctorService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonCreated, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/doctors — List all doctors (including unverified)
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const doctors = await getDoctorService().listAll();
    return jsonOk({ doctors, total: doctors.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/superadmin/doctors — Create a new doctor (superadmin)
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    if (!body.name?.trim() || !body.email?.trim()) {
      return jsonError('Nombre y email son obligatorios', 400);
    }

    const doctor = await getDoctorService().createAsAdmin({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone ?? '',
      gender: body.gender ?? 'not_specified',
      specialty: body.specialty ?? '',
      description: body.description ?? '',
      schedule: body.schedule ?? '',
      onlineConsultation: body.onlineConsultation ?? false,
      location: body.location,
      professional: body.professional,
      verified: body.verified ?? false,
    });

    return jsonCreated({ doctor });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
