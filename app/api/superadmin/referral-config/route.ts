import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

const CONFIG_DOC = 'v2_config/referral_rewards';

interface ReferralConfig {
  referrerReward: number;
  referredDiscount: number;
  minSubscriptionTier: string;
  active: boolean;
}

const DEFAULT_CONFIG: ReferralConfig = {
  referrerReward: 10,
  referredDiscount: 10,
  minSubscriptionTier: 'medium',
  active: true,
};

// GET /api/superadmin/referral-config — Retrieve referral config
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const doc = await adminDb.doc(CONFIG_DOC).get();
    const config = doc.exists ? (doc.data() as ReferralConfig) : DEFAULT_CONFIG;

    return jsonOk({ config });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PUT /api/superadmin/referral-config — Update referral config
export async function PUT(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const config: ReferralConfig = {
      referrerReward: Number(body.referrerReward) || DEFAULT_CONFIG.referrerReward,
      referredDiscount: Number(body.referredDiscount) || DEFAULT_CONFIG.referredDiscount,
      minSubscriptionTier: body.minSubscriptionTier ?? DEFAULT_CONFIG.minSubscriptionTier,
      active: Boolean(body.active),
    };

    await adminDb.doc(CONFIG_DOC).set(config, { merge: true });

    return jsonOk({ config });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
