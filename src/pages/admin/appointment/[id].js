import { useRouter } from "next/router";
import { useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import AppointmentDetail from "../../../components/admin/AppointmentDetail";

export default function AppointmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <AdminLayout>
      <div className="p-6">
        <AppointmentDetail appointmentId={id} />
      </div>
    </AdminLayout>
  );
}
