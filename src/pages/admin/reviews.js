import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ReviewsList from "../../components/admin/ReviewsList";

export default function ReviewsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <ReviewsList />
      </div>
    </AdminLayout>
  );
}
