import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ReviewsList from "../../components/admin/ReviewsList";
import ProtectedRoute from "../../components/ProtectedRoute";
import FeatureProtectedRoute from "../../components/FeatureProtectedRoute";

export default function ReviewsPage() {
  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="reviews">
        <AdminLayout>
          <div className="p-6">
            <ReviewsList />
          </div>
        </AdminLayout>
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
