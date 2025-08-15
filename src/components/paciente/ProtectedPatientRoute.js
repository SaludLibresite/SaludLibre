import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useUserStore } from "../../store/userStore";
import { canAccessPanel } from "../../lib/userTypeService";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ProtectedPatientRoute({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const { userType, loading: userStoreLoading } = useUserStore();
  const router = useRouter();
  const [patientVerified, setPatientVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyPatientAccess() {
      // Wait for both auth and user store to finish loading
      if (authLoading || userStoreLoading) return;

      if (!currentUser) {
        router.push("/paciente/login");
        return;
      }

      try {
        // If user type is detected but cannot access patient panel
        if (userType && !canAccessPanel(userType, "patient")) {
          // Redirect based on user type
          if (userType === 'doctor') {
            router.push('/admin');
          } else if (userType === 'superadmin') {
            router.push('/superadmin');
          } else {
            router.push('/');
          }
          return;
        }

        // If user type is still unknown after auth is complete
        if (!userType) {
          console.warn('User type not detected, redirecting to patient login');
          router.push('/paciente/login');
          return;
        }

        // Additional verification for patients (existing logic)
        const patientsQuery = query(
          collection(db, "patients"),
          where("userId", "==", currentUser.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);

        if (patientsSnapshot.empty) {
          // User exists but is not a patient, redirect to appropriate page
          console.log("User is not a patient, redirecting...");
          router.push("/paciente/login");
          return;
        }

        setPatientVerified(true);
      } catch (error) {
        console.error("Error verifying patient access:", error);
        router.push("/paciente/login");
      } finally {
        setLoading(false);
      }
    }

    verifyPatientAccess();
  }, [currentUser, authLoading, userType, userStoreLoading, router]);

  // Show loading while checking authentication and user type
  if (authLoading || userStoreLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso de paciente...</p>
        </div>
      </div>
    );
  }

  // If patient is verified, render the protected content
  if (patientVerified && currentUser && userType === 'patient') {
    return children;
  }

  // Fallback
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
          No tienes permisos para acceder al panel de pacientes.
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
