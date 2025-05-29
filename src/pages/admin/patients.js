import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PatientsList from "../../components/admin/PatientsList";

export default function PatientsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <PatientsList />
      </div>
    </AdminLayout>
  );
}
