import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function PatientIndex() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    const checkPatientAccess = async () => {
      if (loading) return; // Wait for auth to initialize

      if (!currentUser) {
        // No user logged in, redirect to patient login
        router.replace("/paciente/login");
        return;
      }

      try {
        // Check if the logged-in user is actually a patient
        const patientsQuery = query(
          collection(db, "patients"),
          where("userId", "==", currentUser.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);

        if (patientsSnapshot.empty) {
          // User exists but is not a patient, redirect to patient login
          router.replace("/paciente/login");
          return;
        }

        // User is authenticated and is a patient, redirect to dashboard
        router.replace("/paciente/dashboard");
      } catch (error) {
        console.error("Error checking patient access:", error);
        // On error, redirect to login for safety
        router.replace("/paciente/login");
      }
    };

    checkPatientAccess();
  }, [currentUser, loading, router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <svg
            className="animate-spin h-8 w-8 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pacientes
        </h2>
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    </div>
  );
}
