import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import { getPatientsPaginated } from "../../lib/patientsService";
import SuperAdminLayout from "../../components/superadmin/SuperAdminLayout";

const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default function PatientsManagement() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const queryParams = useMemo(() => {
    const pageNum = parseInt(router.query?.page, 10);
    return {
      search: router.query?.search || "",
      page: !isNaN(pageNum) && pageNum > 0 ? pageNum : 1,
      sort: router.query?.sort || "recent",
    };
  }, [router.query?.search, router.query?.page, router.query?.sort]);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Debounce timer ref
  const [debounceTimer, setDebounceTimer] = useState(null);

  const updateURL = useCallback(
    (params) => {
      if (!router.isReady) return;

      const newQuery = { ...router.query };

      Object.entries(params).forEach(([key, value]) => {
        if (
          value === "" ||
          (key === "sort" && value === "recent") ||
          (key === "page" && value === 1)
        ) {
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
    },
    [router.isReady, router.query, router.pathname]
  );

  // Auth check
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
    }
  }, [currentUser, authLoading]);

  // Set initial search input from URL
  useEffect(() => {
    if (router.isReady && queryParams.search !== searchInput) {
      setSearchInput(queryParams.search);
    }
  }, [router.isReady]);

  // Load patients when query params change
  useEffect(() => {
    if (
      !authLoading &&
      currentUser &&
      SUPERADMIN_EMAILS.includes(currentUser.email) &&
      router.isReady
    ) {
      loadPatients();
    }
  }, [
    queryParams.search,
    queryParams.page,
    queryParams.sort,
    router.isReady,
    authLoading,
    currentUser,
  ]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setIsSearching(true);

      const data = await getPatientsPaginated({
        page: queryParams.page,
        limit: 20,
        search: queryParams.search,
        sort: queryParams.sort,
      });

      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      updateURL({ search: value, page: 1 });
    }, 400);
    setDebounceTimer(timer);
  };

  const handleSortChange = useCallback(
    (newSort) => {
      updateURL({ sort: newSort, page: 1 });
    },
    [updateURL]
  );

  const handlePageChange = useCallback(
    (page) => {
      updateURL({ page });
    },
    [updateURL]
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const currentPage = queryParams.page;

  return (
    <SuperAdminLayout>
      <div className="px-2">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Pacientes
              </h1>
              <p className="text-gray-600 mt-1">
                {pagination.total} paciente{pagination.total !== 1 ? "s" : ""}{" "}
                registrado{pagination.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Sort controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre, email, teléfono, DNI..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg
                    className="animate-spin h-4 w-4 text-teal-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Ordenar:
              </span>
              <button
                onClick={() => handleSortChange("recent")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  queryParams.sort === "recent"
                    ? "bg-teal-600 text-white"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Más recientes
              </button>
              <button
                onClick={() => handleSortChange("alphabetical")}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  queryParams.sort === "alphabetical"
                    ? "bg-teal-600 text-white"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                A → Z
              </button>
            </div>
          </div>
        </div>

        {/* Patients list */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading && !patients.length ? (
            <div className="flex justify-center py-16">
              <svg
                className="animate-spin h-8 w-8 text-teal-600"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron pacientes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {queryParams.search
                  ? "Probá con otro término de búsqueda."
                  : "Aún no hay pacientes registrados."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        DNI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor asignado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                              <span className="text-teal-700 font-medium text-sm">
                                {(patient.name || "?")
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {patient.name || "Sin nombre"}
                              </div>
                              {patient.patientId && (
                                <div className="text-xs text-gray-400">
                                  {patient.patientId}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.email || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.phone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {patient.dni || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {patient.doctors && patient.doctors.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {patient.doctors
                                .slice(0, 2)
                                .map((doc, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm text-gray-700"
                                  >
                                    {doc.doctorName || "Doctor"}
                                  </span>
                                ))}
                              {patient.doctors.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{patient.doctors.length - 2} más
                                </span>
                              )}
                            </div>
                          ) : patient.doctorName ? (
                            <span className="text-sm text-gray-700">
                              {patient.doctorName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(patient.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {patients.map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-700 font-medium text-sm">
                          {(patient.name || "?")
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {patient.name || "Sin nombre"}
                        </p>
                        {patient.email && (
                          <p className="text-sm text-gray-500 truncate">
                            {patient.email}
                          </p>
                        )}
                        {patient.phone && (
                          <p className="text-sm text-gray-500">
                            {patient.phone}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          {patient.dni && <span>DNI: {patient.dni}</span>}
                          <span>Registro: {formatDate(patient.createdAt)}</span>
                        </div>
                        {(patient.doctorName ||
                          (patient.doctors && patient.doctors.length > 0)) && (
                          <p className="mt-1 text-xs text-teal-600">
                            Dr.{" "}
                            {patient.doctors?.[0]?.doctorName ||
                              patient.doctorName}
                            {patient.doctors?.length > 1 &&
                              ` (+${patient.doctors.length - 1})`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * pagination.limit + 1} -{" "}
                {Math.min(currentPage * pagination.limit, pagination.total)} de{" "}
                {pagination.total} pacientes
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
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
                              ? "bg-teal-600 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
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
      </div>
    </SuperAdminLayout>
  );
}
