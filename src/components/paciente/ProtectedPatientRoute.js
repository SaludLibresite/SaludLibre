import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
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
  const router = useRouter();
  const [patientVerified, setPatientVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyPatientAccess() {
      if (authLoading) return;

      if (!currentUser) {
        router.push("/paciente/login");
        return;
      }

      try {
        // Check if user is a patient in Firestore
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
  }, [currentUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!patientVerified) {
    return null; // Router will handle the redirect
  }

  return children;
}
