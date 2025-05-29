import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import DashboardStats from "../../components/admin/DashboardStats";
import RecentAppointments from "../../components/admin/RecentAppointments";
import UpcomingAppointments from "../../components/admin/UpcomingAppointments";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600">Bienvenido de vuelta, Dr. García</p>
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <RecentAppointments />
          <UpcomingAppointments />
        </div>
      </div>
    </AdminLayout>
  );
}
