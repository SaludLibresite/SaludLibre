import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserStore } from "../../store/userStore";
import { useRouter } from "next/router";
import { canAccessPanel } from "../../lib/userTypeService";
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import ZonesManagement from '../../components/superadmin/ZonesManagement';
import { useEffect, useState } from "react";

export default function ZonesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);

  // Redirect if user doesn't have superadmin access
  useEffect(() => {
    if (!authLoading && !userStoreLoading) {
      if (!currentUser) {
        router.push("/auth/login?message=superadmin");
        return;
      }

      if (userType && !canAccessPanel(userType, "superadmin")) {
        // Redirect based on user type
        if (userType === 'patient') {
          router.push('/paciente/dashboard');
        } else if (userType === 'doctor') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        return;
      }

      // If user type is still unknown after auth is complete
      if (!userType) {
        console.warn('User type not detected, redirecting to login');
        router.push('/auth/login?message=superadmin');
        return;
      }

      setAccessChecked(true);
    }
  }, [authLoading, userStoreLoading, currentUser, userType, router]);

  // Show loading while checking authentication and user type
  if (authLoading || userStoreLoading || !accessChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso de superadmin...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not authorized, show access denied
  if (!currentUser || (userType && !canAccessPanel(userType, "superadmin"))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso Denegado</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder al panel de superadmin.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/auth/login?message=superadmin')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Iniciar Sesión como SuperAdmin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      <ZonesManagement />
    </SuperAdminLayout>
  );
}
