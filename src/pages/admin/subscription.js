import React from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminLayout from "../../components/admin/AdminLayout";
import SubscriptionManagement from "../../components/admin/SubscriptionManagement";

export default function AdminSubscriptionPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <SubscriptionManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}
