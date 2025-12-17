import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import {
  getDoctorsPaginated,
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
  const [allDoctors, setAllDoctors] = useState([]); // For bulk operations
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState("all");
  const [showBulkSubscriptionModal, setShowBulkSubscriptionModal] = useState(false);
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    verified: 0,
  });
  
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

  // Load doctors when page, search or filter changes
  useEffect(() => {
    if (!authLoading && currentUser && SUPERADMIN_EMAILS.includes(currentUser.email)) {
      loadDoctors();
    }
  }, [currentPage, searchTerm, filter]);

  // Data loading functions
  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await getDoctorsPaginated({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        filter: filter,
      });
      
      setDoctors(data.doctors);
      setPagination(data.pagination);
      setCounts(data.counts);
      
      // Store all doctors for bulk operations if needed
      if (!allDoctors.length) {
        setAllDoctors(data.doctors);
      }
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

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, email, especialidad o DNI..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              {pagination.total} resultado{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <DoctorsNavigation
          filter={filter}
          setFilter={handleFilterChange}
          pendingCount={counts.pending}
          verifiedCount={counts.verified}
          totalCount={counts.total}
        />

        <div className="mt-6">
          <DoctorsList
            doctors={doctors}
            updating={updating}
            onVerifyDoctor={handleVerifyDoctor}
            onEditDoctor={handleEditDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onDoctorUpdated={loadDoctors}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * pagination.limit + 1} -{" "}
                {Math.min(currentPage * pagination.limit, pagination.total)} de{" "}
                {pagination.total} doctores
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          pageNum === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}

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
