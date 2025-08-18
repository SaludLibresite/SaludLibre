import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Calendar from "../../components/admin/Calendar";
import ProtectedRoute from "../../components/ProtectedRoute";
import FeatureProtectedRoute from "../../components/FeatureProtectedRoute";

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="schedule">
        <AdminLayout>
          <div className="p-6">
            <Calendar />
          </div>
        </AdminLayout>
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
