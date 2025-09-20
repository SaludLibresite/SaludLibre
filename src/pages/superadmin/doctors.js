import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import {
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
} from "../../lib/doctorsService";
import { getAllSpecialties } from "../../lib/specialtiesService";

// Components
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import DoctorsPageHeader from '../../components/superadmin/DoctorsPageHeader';
import DoctorsNavigation from '../../components/superadmin/DoctorsNavigation';
import DoctorsList from '../../components/superadmin/DoctorsList';
import DoctorsLoading from '../../components/superadmin/DoctorsLoading';
import BulkSubscriptionModal from '../../components/admin/BulkSubscriptionModal';
import EditDoctorModal from '../../components/superadmin/EditDoctorModal';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function DoctorsManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // States
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("all");
  const [showBulkSubscriptionModal, setShowBulkSubscriptionModal] = useState(false);
  
  // Modal states (if you have other modals)
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Authentication and initial load
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/superadmin");
        return;
      }

      if (!SUPERADMIN_EMAILS.includes(currentUser.email)) {
        router.push("/superadmin");
        return;
      }

      loadDoctors();
      loadSpecialties();
    }
  }, [currentUser, authLoading, router]);

  // Data loading functions
  const loadDoctors = async () => {
    try {
      setLoading(true);
      const allDoctors = await getAllDoctors();
      setDoctors(allDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const allSpecialties = await getAllSpecialties();
      const activeSpecialties = allSpecialties.filter(
        (specialty) => specialty.isActive !== false
      );
      setSpecialties(activeSpecialties);
    } catch (error) {
      console.error("Error loading specialties:", error);
    }
  };

  // Doctor actions
  const handleVerifyDoctor = async (doctorId, verified) => {
    try {
      setUpdating((prev) => ({ ...prev, [doctorId]: true }));
      await updateDoctor(doctorId, { verified });

      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.id === doctorId ? { ...doctor, verified } : doctor
        )
      );
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Error al actualizar el doctor");
    } finally {
      setUpdating((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este doctor?")) {
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [doctorId]: true }));
      await deleteDoctor(doctorId);
      
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== doctorId));
      alert("Doctor eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting doctor:", error);
      alert("Error al eliminar el doctor");
    } finally {
      setUpdating((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowEditModal(true);
  };

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    if (filter === "pending") return !doctor.verified;
    if (filter === "verified") return doctor.verified;
    return true;
  });

  // Calculate counts
  const pendingCount = doctors.filter((d) => !d.verified).length;
  const verifiedCount = doctors.filter((d) => d.verified).length;
  const totalCount = doctors.length;

  // Loading state
  if (authLoading || loading) {
    return <DoctorsLoading />;
  }

  return (
    <SuperAdminLayout>
      <div className="px-2">
        <DoctorsPageHeader
          onOpenBulkSubscription={() => setShowBulkSubscriptionModal(true)}
        />

        <DoctorsNavigation
          filter={filter}
          setFilter={setFilter}
          pendingCount={pendingCount}
          verifiedCount={verifiedCount}
          totalCount={totalCount}
        />

        <div className="mt-6">
          <DoctorsList
            doctors={filteredDoctors}
            updating={updating}
            onVerifyDoctor={handleVerifyDoctor}
            onEditDoctor={handleEditDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onDoctorUpdated={loadDoctors}
          />
        </div>

        {/* Modals */}
        <BulkSubscriptionModal
          isOpen={showBulkSubscriptionModal}
          onClose={() => setShowBulkSubscriptionModal(false)}
          doctors={doctors}
          onDoctorUpdated={loadDoctors}
        />

        {/* Edit Doctor Modal */}
        <EditDoctorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDoctor(null);
          }}
          doctor={editingDoctor}
          onDoctorUpdated={loadDoctors}
        />

        {/* Add other modals here if needed */}
        {/* {showSpecialtyModal && ...} */}
        {/* {showDetailsModal && ...} */}
      </div>
    </SuperAdminLayout>
  );
}
