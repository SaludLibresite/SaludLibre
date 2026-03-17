import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/infrastructure/config/firebase.admin';
import type { UserType } from '@/src/shared/domain/types';

// ============================================================
// Auth Helpers for API Routes
// ============================================================
// Fixes the legacy security gap: V1 had NO auth on API routes.
// V2 verifies Firebase ID tokens on every protected endpoint.
// ============================================================

export interface AuthenticatedUser {
  uid: string;           // Firebase Auth UID
  email: string;
  userType: UserType;
  doctorId?: string;     // Firestore doc ID (if doctor)
  patientId?: string;    // Firestore doc ID (if patient)
}

/**
 * Extract and verify Firebase ID token from Authorization header.
 * Returns the authenticated user or null if invalid/missing.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userType = await detectUserType(decoded.uid, decoded.email ?? '');
    return {
      uid: decoded.uid,
      email: decoded.email ?? '',
      ...userType,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns 401 if not authenticated.
 * Use in API routes: `const user = await requireAuth(request); if (user instanceof NextResponse) return user;`
 */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return user;
}

/**
 * Require a specific role — returns 403 if role doesn't match.
 */
export async function requireRole(
  request: NextRequest,
  ...allowedRoles: UserType[]
): Promise<AuthenticatedUser | NextResponse> {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  if (!allowedRoles.includes(user.userType)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  return user;
}

/**
 * Superadmin-only guard — checks against email whitelist.
 */
const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? 'juan@jhernandez.mx').split(',');

export async function requireSuperadmin(
  request: NextRequest,
): Promise<AuthenticatedUser | NextResponse> {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  if (!SUPERADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }
  return user;
}

// --- Internal helpers ---

async function detectUserType(
  uid: string,
  email: string,
): Promise<{ userType: UserType; doctorId?: string; patientId?: string }> {
  // Check superadmin first
  if (SUPERADMIN_EMAILS.includes(email)) {
    // Superadmins may also be doctors — look up their doctor profile
    const saDocSnap = await adminDb
      .collection('v2_doctors')
      .where('userId', '==', uid)
      .limit(1)
      .get();
    return {
      userType: 'superadmin',
      doctorId: saDocSnap.empty ? undefined : saDocSnap.docs[0].id,
    };
  }

  // Check if doctor
  const doctorSnap = await adminDb
    .collection('v2_doctors')
    .where('userId', '==', uid)
    .limit(1)
    .get();

  if (!doctorSnap.empty) {
    return { userType: 'doctor', doctorId: doctorSnap.docs[0].id };
  }

  // Check if patient
  const patientSnap = await adminDb
    .collection('v2_patients')
    .where('userId', '==', uid)
    .limit(1)
    .get();

  if (!patientSnap.empty) {
    return { userType: 'patient', patientId: patientSnap.docs[0].id };
  }

  // Unknown — default to patient (new users registering)
  return { userType: 'patient' };
}

// ============================================================
// JSON response helpers
// ============================================================

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}
