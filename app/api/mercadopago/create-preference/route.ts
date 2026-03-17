import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// POST /api/mercadopago/create-preference — Create MercadoPago checkout preference
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    if (!body.planId) {
      return jsonError('planId is required', 400);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    const result = await getSubscriptionService().createPaymentPreference({
      userId: user.uid,
      userEmail: user.email,
      planId: body.planId,
      baseUrl,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
