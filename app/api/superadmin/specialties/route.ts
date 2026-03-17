import { NextRequest, NextResponse } from 'next/server';
import { getSpecialtyService } from '@/src/infrastructure/container';
import { requireSuperadmin, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';

// GET /api/superadmin/specialties — List all specialties (including inactive)
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const specialties = await getSpecialtyService().listAll();
    return jsonOk({ specialties, total: specialties.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// POST /api/superadmin/specialties — Create a specialty (supports FormData with image)
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperadmin(request);
    if (user instanceof NextResponse) return user;

    const contentType = request.headers.get('content-type') ?? '';
    let title = '';
    let description = '';
    let image: { content: Buffer; contentType: string } | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = formData.get('title') as string ?? '';
      description = formData.get('description') as string ?? '';
      const file = formData.get('image') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        image = { content: buffer, contentType: file.type };
      }
    } else {
      const body = await request.json();
      title = body.title;
      description = body.description;
    }

    const specialty = await getSpecialtyService().create({ title, description, image });
    return jsonCreated(specialty);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
