import { NextRequest } from 'next/server';
import { getDoctorService, getReferralService } from '@/src/infrastructure/container';
import { requireAuth, jsonCreated, jsonError } from '@/src/infrastructure/api/auth';
import { NextResponse } from 'next/server';

// POST /api/doctors/register — Create new doctor profile during registration
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();

    const doctor = await getDoctorService().createProfile({
      userId: user.uid,
      email: user.email,
      name: body.name,
      phone: body.phone ?? '',
      gender: body.gender ?? 'not_specified',
      specialty: body.specialty ?? '',
      description: body.description ?? '',
      schedule: body.schedule ?? '',
      onlineConsultation: body.onlineConsultation ?? false,
      location: body.location ?? { latitude: 0, longitude: 0, formattedAddress: '' },
      professional: body.professional ?? {
        profession: '',
        licenseNumber: '',
        officeAddress: '',
        signatureUrl: '',
        stampUrl: '',
      },
    });

    // Create referral record if a referral code was provided
    const referralCode = (body.referralCode ?? '').trim();
    if (referralCode) {
      try {
        // referralCode is the referrer's Firebase Auth UID — look up their doctor profile
        const referrer = await getDoctorService().getByUserId(referralCode);
        if (referrer) {
          await getReferralService().create({
            referrerDoctorId: referrer.id,
            referredDoctorUserId: user.uid,
            referredDoctorName: body.name ?? '',
            referredDoctorEmail: user.email,
            referredDoctorSpecialty: body.specialty ?? '',
          });
        }
      } catch {
        // Referral creation failure should not block registration
      }
    }

    return jsonCreated(doctor);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('already exists') ? 409 : 500;
    return jsonError(message, status);
  }
}
