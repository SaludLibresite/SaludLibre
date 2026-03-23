'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type UserType = 'doctor' | 'patient' | 'superadmin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType | UserType[];
}

const REDIRECT_MAP: Record<UserType, string> = {
  doctor: '/admin',
  patient: '/paciente/dashboard',
  superadmin: '/superadmin',
};

const LOGIN_MAP: Record<UserType, string> = {
  doctor: '/auth/login',
  patient: '/paciente/login',
  superadmin: '/auth/login',
};

export default function ProtectedRoute({ children, requiredUserType = 'doctor' }: ProtectedRouteProps) {
  const { user, userType, loading } = useAuth();
  const router = useRouter();

  const allowedTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType];
  const loginPath = LOGIN_MAP[allowedTypes[0]];
  const isAllowed = userType ? allowedTypes.includes(userType) : false;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginPath);
      return;
    }
    if (userType && !isAllowed) {
      router.replace(REDIRECT_MAP[userType] || '/');
    }
  }, [user, userType, loading, isAllowed, loginPath, router]);

  if (loading) {
    return <LoadingScreen message="Verificando acceso" />;
  }

  if (!user) return null;

  if (userType && !isAllowed) return null;

  if (!userType) {
    return <LoadingScreen message="Detectando tipo de usuario" />;
  }

  return <>{children}</>;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" />
        <p className="text-lg font-medium text-gray-700">{message}...</p>
        <p className="mt-1 text-sm text-gray-500">Por favor espere un momento</p>
      </div>
    </div>
  );
}
