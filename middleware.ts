import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/admin', '/superadmin'];
const PROTECTED_PATIENT_PREFIX = '/paciente';
const PATIENT_PUBLIC_PATHS = ['/paciente/login', '/paciente/register'];

// Auth pages (redirect away if already logged in)
const DOCTOR_AUTH_PATHS = ['/auth/login', '/auth/register'];
const PATIENT_AUTH_PATHS = ['/paciente/login', '/paciente/register'];

const DASHBOARD_MAP: Record<string, string> = {
  doctor: '/admin',
  patient: '/paciente/dashboard',
  superadmin: '/superadmin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('__session')?.value;
  const userType = request.cookies.get('__userType')?.value;
  const isAuthenticated = session === '1' && !!userType;

  // --- Protected doctor/superadmin routes ---
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Ensure correct role
    if (pathname.startsWith('/admin') && userType !== 'doctor' && userType !== 'superadmin') {
      return NextResponse.redirect(new URL(DASHBOARD_MAP[userType!] || '/', request.url));
    }
    if (pathname.startsWith('/superadmin') && userType !== 'superadmin') {
      return NextResponse.redirect(new URL(DASHBOARD_MAP[userType!] || '/', request.url));
    }
    return NextResponse.next();
  }

  // --- Protected patient routes (exclude public paths) ---
  if (pathname.startsWith(PROTECTED_PATIENT_PREFIX) && !PATIENT_PUBLIC_PATHS.includes(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/paciente/login', request.url));
    }
    if (userType !== 'patient' && userType !== 'superadmin') {
      return NextResponse.redirect(new URL(DASHBOARD_MAP[userType!] || '/', request.url));
    }
    return NextResponse.next();
  }

  // --- Auth pages: redirect if already logged in ---
  if (DOCTOR_AUTH_PATHS.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_MAP[userType!] || '/', request.url));
  }
  if (PATIENT_AUTH_PATHS.includes(pathname) && isAuthenticated && (userType === 'patient' || userType === 'superadmin')) {
    return NextResponse.redirect(new URL(DASHBOARD_MAP[userType!] || '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/superadmin/:path*',
    '/paciente/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
