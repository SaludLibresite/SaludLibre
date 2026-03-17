import { getSpecialtyService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/specialties — Public: list active specialties
export async function GET() {
  try {
    const specialties = await getSpecialtyService().listActive();
    return jsonOk({ specialties, total: specialties.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
