import { NextRequest, NextResponse } from 'next/server';
import { getSpecialtyService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import type { UpdateSpecialtyInput } from '@/src/modules/specialties/application/SpecialtyService';

// PATCH /api/superadmin/specialties/[id] — Update a specialty (supports FormData with image)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const contentType = request.headers.get('content-type') ?? '';
    const input: UpdateSpecialtyInput = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const title = formData.get('title') as string | null;
      const description = formData.get('description') as string | null;
      const isActive = formData.get('isActive') as string | null;
      if (title !== null) input.title = title;
      if (description !== null) input.description = description;
      if (isActive !== null) input.isActive = isActive === 'true';

      const file = formData.get('image') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        input.image = { content: buffer, contentType: file.type };
      }
    } else {
      const body = await request.json();
      if (body.title !== undefined) input.title = body.title;
      if (body.description !== undefined) input.description = body.description;
      if (body.isActive !== undefined) input.isActive = body.isActive;
    }

    await getSpecialtyService().update(id, input);
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/superadmin/specialties/[id] — Delete a specialty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    await getSpecialtyService().delete(id);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
