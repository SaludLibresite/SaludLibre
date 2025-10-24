import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ProfileSettings from "../../components/admin/ProfileSettings";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-3 sm:p-6">
          <ProfileSettings />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
