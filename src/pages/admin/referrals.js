import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ReferralsList from "../../components/admin/ReferralsList";

export default function ReferralsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <ReferralsList />
      </div>
    </AdminLayout>
  );
}
