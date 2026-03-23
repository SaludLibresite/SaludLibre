import { NextRequest, NextResponse } from 'next/server';
import { getEntityService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonCreated, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/entities — List all entities
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const entities = await getEntityService().listAll();
    return jsonOk({ entities, total: entities.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/superadmin/entities — Create a new entity
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    if (!body.name?.trim() || !body.type) {
      return jsonError('Nombre y tipo son obligatorios', 400);
    }

    const entity = await getEntityService().create({
      type: body.type,
      name: body.name.trim(),
      email: body.email?.trim() ?? '',
      phone: body.phone ?? '',
      description: body.description ?? '',
      schedule: body.schedule ?? '',
      location: body.location,
      website: body.website ?? '',
      verified: body.verified ?? false,
    });

    return jsonCreated({ entity });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
