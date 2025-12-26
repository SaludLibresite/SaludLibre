import AdminLayout from "@/components/admin/AdminLayout";
import PatientsList from "@/components/admin/PatientsList";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeatureProtectedRoute from "@/components/FeatureProtectedRoute";

export default function PatientsPage() {
  return (
    <ProtectedRoute>
      <FeatureProtectedRoute feature="patients">
        <AdminLayout>
          <div className="p-6">
            <PatientsList />
          </div>
        </AdminLayout>
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}
