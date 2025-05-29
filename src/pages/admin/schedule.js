import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Calendar from "../../components/admin/Calendar";

export default function SchedulePage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <Calendar />
      </div>
    </AdminLayout>
  );
}
