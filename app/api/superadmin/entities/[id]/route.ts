import { NextRequest, NextResponse } from 'next/server';
import { getEntityService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/entities/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const entity = await getEntityService().getById(id);
    if (!entity) return jsonError('Entity not found', 404);

    return jsonOk({ entity });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PATCH /api/superadmin/entities/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const body = await request.json();

    if (body.action === 'verify') {
      await getEntityService().verify(id);
    } else {
      await getEntityService().update(id, body);
    }

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/superadmin/entities/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    await getEntityService().delete(id);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
