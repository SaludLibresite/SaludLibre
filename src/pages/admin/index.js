import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/admin/AdminLayout";
import DashboardStats from "../../components/admin/DashboardStats";
import RecentAppointments from "../../components/admin/RecentAppointments";
import UpcomingAppointments from "../../components/admin/UpcomingAppointments";
import PendingAppointments from "../../components/admin/PendingAppointments";
import ProtectedRoute from "../../components/ProtectedRoute";
import CompleteProfileModal from "../../components/admin/CompleteProfileModal";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

  useEffect(() => {
    async function loadDoctorData() {
      if (!currentUser) return;

      try {
        const doctor = await getDoctorByUserId(currentUser.uid);
        setDoctorData(doctor);
        
        // Check if profile needs completion
        if (doctor && (doctor.profileCompleted === false || 
                      doctor.especialidad === "Por definir" || 
                      doctor.telefono === "Sin especificar" ||
                      doctor.genero === "Sin especificar" ||
                      doctor.ubicacion === "Sin especificar")) {
          setShowCompleteProfileModal(true);
        }
      } catch (error) {
        console.error("Error loading doctor data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDoctorData();
  }, [currentUser]);

  const handleProfileCompleted = (updatedDoctor) => {
    setDoctorData(updatedDoctor);
    setShowCompleteProfileModal(false);
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Control
            </h1>
            <p className="text-gray-600">
              {loading
                ? "Cargando..."
                : doctorData
                ? `Bienvenido de vuelta, ${doctorData.nombre}`
                : "Bienvenido de vuelta"}
            </p>
          </div>

          <DashboardStats />

          {/* Pending Appointments - Full Width */}
          <div className="mt-8">
            <PendingAppointments />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <RecentAppointments />
            <UpcomingAppointments />
          </div>
        </div>
        
        {/* Complete Profile Modal */}
        {showCompleteProfileModal && doctorData && (
          <CompleteProfileModal
            doctor={doctorData}
            isOpen={showCompleteProfileModal}
            onClose={() => setShowCompleteProfileModal(false)}
            onComplete={handleProfileCompleted}
          />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
