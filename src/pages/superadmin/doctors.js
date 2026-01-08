import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import DoctorsSearchInput from '../../components/superadmin/DoctorsSearchInput';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function DoctorsManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Leer parámetros de la URL de forma segura
  const queryParams = useMemo(() => {
    const pageNum = parseInt(router.query?.page, 10);
    return {
      search: router.query?.search || '',
      page: !isNaN(pageNum) && pageNum > 0 ? pageNum : 1,
      filter: router.query?.filter || 'all',
    };
  }, [router.query?.search, router.query?.page, router.query?.filter]);

  // States para datos
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [updating, setUpdating] = useState({});
  const [showBulkSubscriptionModal, setShowBulkSubscriptionModal] = useState(false);
  
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
  
  // Modal states
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Función para actualizar URL sin recargar página
  const updateURL = useCallback((params) => {
    if (!router.isReady) return;
    
    const newQuery = { ...router.query };
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === '' || value === 'all' || (key === 'page' && value === 1)) {
        delete newQuery[key];
      } else {
        newQuery[key] = String(value);
      }
    });

    router.push(
      { pathname: router.pathname, query: newQuery },
      undefined,
      { shallow: true }
    );
  }, [router.isReady, router.query, router.pathname]);

  // Authentication check
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

      loadSpecialties();
    }
  }, [currentUser, authLoading]);

  // Cargar doctores cuando cambian los query params
  useEffect(() => {
    if (!authLoading && currentUser && SUPERADMIN_EMAILS.includes(currentUser.email) && router.isReady) {
      loadDoctors();
    }
  }, [queryParams.search, queryParams.page, queryParams.filter, router.isReady, authLoading, currentUser]);

  // Data loading functions
  const loadDoctors = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      const data = await getDoctorsPaginated({
        page: queryParams.page,
        limit: 20,
        search: queryParams.search,
        filter: queryParams.filter,
      });
      
      setDoctors(data.doctors);
      setPagination(data.pagination);
      setCounts(data.counts);
      
      if (!allDoctors.length) {
        setAllDoctors(data.doctors);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
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

  // Handlers que actualizan la URL
  const handleSearch = useCallback((term) => {
    updateURL({ search: term, page: 1 });
  }, [updateURL]);

  const handleFilterChange = useCallback((newFilter) => {
    updateURL({ filter: newFilter, page: 1 });
  }, [updateURL]);

  const handlePageChange = useCallback((page) => {
    updateURL({ page });
  }, [updateURL]);

  // Loading state inicial
  if (authLoading || (loading && !doctors.length)) {
    return <DoctorsLoading />;
  }

  const currentPage = queryParams.page;

  return (
    <SuperAdminLayout>
      <div className="px-2">
        <DoctorsPageHeader
          onOpenBulkSubscription={() => setShowBulkSubscriptionModal(true)}
        />

        {/* Search Bar - Componente aislado */}
        <DoctorsSearchInput
          initialValue={queryParams.search}
          onSearch={handleSearch}
          isSearching={isSearching}
          resultCount={pagination.total}
        />

        <DoctorsNavigation
          filter={queryParams.filter}
          setFilter={handleFilterChange}
          pendingCount={counts.pending}
          verifiedCount={counts.verified}
          totalCount={counts.total}
        />

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <DoctorsList
              doctors={doctors}
              updating={updating}
              onVerifyDoctor={handleVerifyDoctor}
              onEditDoctor={handleEditDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onDoctorUpdated={loadDoctors}
            />
          )}
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

        <EditDoctorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDoctor(null);
          }}
          doctor={editingDoctor}
          onDoctorUpdated={loadDoctors}
        />
      </div>
    </SuperAdminLayout>
  );
}
