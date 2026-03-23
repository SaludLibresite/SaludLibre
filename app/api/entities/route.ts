import { NextRequest } from 'next/server';
import { getEntityService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/entities — Public: list verified entities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') ?? undefined;

    let entities;
    if (type) {
      const all = await getEntityService().listVerified();
      entities = all.filter(e => e.type === type);
    } else {
      entities = await getEntityService().listVerified();
    }

    return jsonOk({
      entities,
      total: entities.length,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
