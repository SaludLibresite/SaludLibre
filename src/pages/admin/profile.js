import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import ProfileSettings from "../../components/admin/ProfileSettings";

export default function ProfilePage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <ProfileSettings />
      </div>
    </AdminLayout>
  );
}
