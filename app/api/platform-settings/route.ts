import { adminDb } from '@/src/infrastructure/config/firebase.admin';
import { jsonOk } from '@/src/infrastructure/api/auth';

export async function GET() {
  const doc = await adminDb.collection('v2_platform_settings').doc('global').get();
  const data = doc.data() ?? {};
  return jsonOk({ freemiumMode: data.freemiumMode ?? false });
}
