import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useUserStore } from '../store/userStore';
import { canAccessPanel, getRedirectUrl } from '../lib/userTypeService';

/**
 * Higher-order component that protects routes based on user type
 * @param {React.Component} WrappedComponent - Component to protect
 * @param {string} requiredUserType - Required user type ('doctor', 'patient', 'superadmin')
 * @param {string} fallbackUrl - URL to redirect if not authorized (optional)
 */
export function withUserTypeProtection(WrappedComponent, requiredUserType, fallbackUrl) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { currentUser, loading: authLoading } = useAuth();
    const { userType, loading: userStoreLoading } = useUserStore();

    useEffect(() => {
      // Wait for both auth and user store to finish loading
      if (!authLoading && !userStoreLoading) {
        // If no user is logged in, redirect to appropriate login
        if (!currentUser) {
          const loginUrl = requiredUserType === 'patient' 
            ? '/paciente/login' 
            : '/auth/login';
          router.push(fallbackUrl || loginUrl);
          return;
        }

        // If user type is detected but cannot access this panel
        if (userType && !canAccessPanel(userType, requiredUserType)) {
          const redirectUrl = getRedirectUrl(userType, requiredUserType);
          router.push(fallbackUrl || redirectUrl);
          return;
        }

        // If user type is still unknown after auth is complete
        if (!userType) {
          console.warn('User type not detected, redirecting to home');
          router.push('/');
          return;
        }
      }
    }, [authLoading, userStoreLoading, currentUser, userType, router]);

    // Show loading while checking authentication and user type
    if (authLoading || userStoreLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    // Show loading if user is logged in but user type is not yet detected
    if (currentUser && !userType) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Detectando tipo de usuario...</p>
          </div>
        </div>
      );
    }

    // If user is authorized, render the protected component
    if (currentUser && userType && canAccessPanel(userType, requiredUserType)) {
      return <WrappedComponent {...props} />;
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
  };
}

/**
 * Hook for components that need user type information
 */
export function useUserTypeAccess(requiredUserType) {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();

  const isLoading = authLoading || userStoreLoading;
  const isAuthenticated = !!currentUser;
  const hasAccess = userType && canAccessPanel(userType, requiredUserType);
  const isAuthorized = isAuthenticated && hasAccess;

  return {
    isLoading,
    isAuthenticated,
    hasAccess,
    isAuthorized,
    userType,
    currentUser
  };
}
