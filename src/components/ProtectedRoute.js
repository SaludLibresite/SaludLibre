import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useUserStore } from "../store/userStore";
import { canAccessPanel } from "../lib/userTypeService";
import AuthLoadingScreen from "./AuthLoadingScreen";

export default function ProtectedRoute({ children, requiredUserType = "doctor" }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while still loading
    if (authLoading || userStoreLoading) {
      return;
    }

    // If no user is logged in, redirect to appropriate login
    if (!currentUser) {
      const loginUrl = requiredUserType === 'patient' 
        ? '/paciente/login' 
        : '/auth/login';
      router.push(loginUrl);
      return;
    }

    // If user type is not detected yet, wait for it
    // This prevents premature redirections
    if (!userType) {
      console.log('User type not detected yet, waiting...');
      return;
    }

    // If user type is detected but cannot access this panel
    if (!canAccessPanel(userType, requiredUserType)) {
      console.log(`User type ${userType} cannot access ${requiredUserType} panel, redirecting...`);
      // Redirect based on user type
      if (userType === 'patient') {
        router.push('/paciente/dashboard');
      } else if (userType === 'doctor') {
        router.push('/admin');
      } else if (userType === 'superadmin') {
        router.push('/superadmin');
      } else {
        router.push('/');
      }
      return;
    }

    // If we reach here, user has proper access
    console.log(`User type ${userType} has access to ${requiredUserType} panel`);
  }, [authLoading, userStoreLoading, currentUser, userType, router, requiredUserType]);

  // Show loading while checking authentication and user type
  if (authLoading || userStoreLoading) {
    return <AuthLoadingScreen message="Verificando acceso" showDetails={true} />;
  }

  // Show loading if user is logged in but user type is not yet detected
  // This prevents showing "Access Denied" before user type detection is complete
  if (currentUser && !userType) {
    return <AuthLoadingScreen message="Detectando tipo de usuario" showDetails={true} />;
  }

  // If user is authorized, render the protected content
  if (currentUser && userType && canAccessPanel(userType, requiredUserType)) {
    return children;
  }

  // Fallback: show access denied (shouldn't reach here due to useEffect redirects)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
          No tienes permisos para acceder a esta página.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
