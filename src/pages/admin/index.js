import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import DashboardStats from "../../components/admin/DashboardStats";
import RecentAppointments from "../../components/admin/RecentAppointments";
import UpcomingAppointments from "../../components/admin/UpcomingAppointments";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorData() {
      if (!currentUser) return;

      try {
        const doctor = await getDoctorByUserId(currentUser.uid);
        setDoctorData(doctor);
      } catch (error) {
        console.error("Error loading doctor data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDoctorData();
  }, [currentUser]);

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <RecentAppointments />
            <UpcomingAppointments />
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
