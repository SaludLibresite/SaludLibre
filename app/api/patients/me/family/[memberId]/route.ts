import { NextRequest, NextResponse } from 'next/server';
import { getPatientService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';

// PATCH /api/patients/me/family/[memberId] — Update family member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { memberId } = await params;
    const body = await request.json();
    await getPatientService().updateFamilyMember(memberId, body);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// DELETE /api/patients/me/family/[memberId] — Delete family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { memberId } = await params;
    await getPatientService().deleteFamilyMember(memberId);

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
