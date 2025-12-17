import AdminLayout from "@/components/admin/AdminLayout";
import PatientsList from "@/components/admin/PatientsList";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeatureProtectedRoute from "@/components/FeatureProtectedRoute";
import SubscriptionDebugInfo from "@/components/admin/SubscriptionDebugInfo";

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
      
      {/* Componente temporal de debug - ELIMINAR después de resolver el problema */}
      <SubscriptionDebugInfo />
    </ProtectedRoute>
  );
}
