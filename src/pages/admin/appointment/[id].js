import { useRouter } from "next/router";
import { useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AppointmentDetail from "../../../components/admin/AppointmentDetail";
import ProtectedRoute from "../../../components/ProtectedRoute";
import FeatureProtectedRoute from "../../../components/FeatureProtectedRoute";

export default function AppointmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="appointments">
        <AdminLayout>
          <div className="p-6">
            <AppointmentDetail appointmentId={id} />
          </div>
        </AdminLayout>
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
