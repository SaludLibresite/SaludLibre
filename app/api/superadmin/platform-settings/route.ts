import { NextRequest } from 'next/server';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

export async function GET(request: NextRequest) {
  const user = await requireSuperadmin(request);
  if (user instanceof Response) return user;
  const doc = await adminDb.collection('v2_platform_settings').doc('global').get();
  const data = doc.data() ?? {};
  return jsonOk({ freemiumMode: data.freemiumMode ?? false });
}

export async function PATCH(request: NextRequest) {
  const user = await requireSuperadmin(request);
  if (user instanceof Response) return user;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.freemiumMode !== 'boolean') {
    return jsonError('freemiumMode must be boolean');
  }
  await adminDb
    .collection('v2_platform_settings')
    .doc('global')
    .set({ freemiumMode: body.freemiumMode }, { merge: true });
  return jsonOk({ freemiumMode: body.freemiumMode });
}
