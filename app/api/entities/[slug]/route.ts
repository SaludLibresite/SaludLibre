import { NextRequest } from 'next/server';
import { getEntityService } from '@/src/infrastructure/container';
import { jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/entities/[slug] — Public: get entity by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const entity = await getEntityService().getBySlug(slug);
    if (!entity) return jsonError('Entity not found', 404);

    return jsonOk({ entity });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
