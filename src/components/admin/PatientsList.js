import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  PlusIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import {
  getPatientsByDoctorAccess,
  deletePatient,
  searchPatients,
} from "../../lib/patientsService";
import AddPatientChoiceModal from "./AddPatientChoiceModal";
import PatientSearchModal from "./PatientSearchModal";

export default function PatientsList() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [sortBy, setSortBy] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [message, setMessage] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Load doctor data and patients
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Get doctor data first
        const doctor = await getDoctorByUserId(currentUser.uid);
        if (doctor) {
          setDoctorData(doctor);

          // Load patients where this doctor has access (primary or shared)
          const patientsList = await getPatientsByDoctorAccess(doctor.id);
          setPatients(patientsList);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Search patients when search term changes
  useEffect(() => {
    async function performSearch() {
      if (!doctorData) return;

      try {
        const results = await searchPatients(doctorData.id, searchTerm);
        setPatients(results);
      } catch (error) {
        console.error("Error searching patients:", error);
      }
    }

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, doctorData]);

  // Refresh patients list (called when returning from add page)
  const refreshPatients = async () => {
    if (!doctorData) return;

    try {
      const patientsList = await getPatientsByDoctorAccess(doctorData.id);
      setPatients(patientsList);
    } catch (error) {
      console.error("Error refreshing patients:", error);
    }
  };

  // Refresh when coming back to the page
  useEffect(() => {
    const handleRouteChange = () => {
      if (router.asPath === "/admin/patients" && doctorData) {
        refreshPatients();
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [doctorData, router]);

  const handleDeletePatient = async (patientId) => {
    if (!confirm("¿Está seguro de que desea eliminar este paciente?")) {
      return;
    }

    try {
      await deletePatient(patientId);
      setPatients((prev) => prev.filter((patient) => patient.id !== patientId));
      setMessage("Paciente eliminado exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting patient:", error);
      setMessage("Error al eliminar el paciente");
    }
  };

  // Handle add patient choice
  const handleAddPatientChoice = (choice) => {
    if (choice === "new") {
      router.push("/admin/nuevo-paciente");
    } else if (choice === "existing") {
      setShowSearchModal(true);
    }
  };

  // Handle patient assignment success
  const handlePatientAssigned = (assignedPatient) => {
    setPatients((prev) => [...prev, assignedPatient]);
    setMessage("✅ Paciente asignado exitosamente");
    setTimeout(() => setMessage(""), 3000);
  };

  // Sort patients
  const sortedPatients = [...patients].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name?.localeCompare(b.name) || 0;
      case "date":
        return (
          new Date(b.createdAt?.toDate?.() || b.createdAt) -
          new Date(a.createdAt?.toDate?.() || a.createdAt)
        );
      case "status":
        return (a.status || "active").localeCompare(b.status || "active");
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-2 text-gray-600">Cargando pacientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Pacientes
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {patients.length}{" "}
              {patients.length === 1 ? "paciente" : "pacientes"}
            </span>
          </div>
          <button
            onClick={() => setShowChoiceModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={!doctorData}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Agregar Paciente</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              message.includes("Error")
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-green-100 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm text-gray-600">Ordenar por</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md transition-colors duration-200"
                >
                  <option value="name">Nombre</option>
                  <option value="date">Fecha de registro</option>
                  <option value="status">Estado</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedPatients.length === 0 && !searchTerm ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <UserGroupIcon className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pacientes registrados
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Comience agregando su primer paciente para gestionar consultas.
          </p>
          <button
            onClick={() => setShowChoiceModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Agregar Primer Paciente
          </button>
        </div>
      ) : sortedPatients.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron pacientes
          </h3>
          <p className="text-sm text-gray-500">
            No hay pacientes que coincidan con "{searchTerm}"
          </p>
        </div>
      ) : (
        /* Patients Table */
        <div className="overflow-x-auto">
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
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center shadow-md">
                        <span className="text-sm font-medium text-white">
                          {patient.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.gender && `${patient.gender} • `}
                          {patient.age || "Edad no especificada"}
                        </div>
                        
                        {/* Multiple Doctors Indicator */}
                        {patient.doctors && patient.doctors.length > 1 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {patient.doctors.length} doctores
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                    <div className="text-sm text-gray-500">{patient.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.createdAt
                      ? new Date(
                          patient.createdAt?.toDate?.() || patient.createdAt
                        ).toLocaleDateString("es-ES")
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === "active"
                          ? "bg-green-100 text-green-800"
                          : patient.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {patient.status === "active"
                        ? "Activo"
                        : patient.status === "inactive"
                        ? "Inactivo"
                        : "Activo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/patients/${patient.id}`)
                        }
                        className="text-gray-600 hover:text-amber-600 p-1 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/patients/${patient.id}`)
                        }
                        className="text-gray-600 hover:text-amber-600 p-1 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-gray-600 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Patient Choice Modal */}
      <AddPatientChoiceModal
        isOpen={showChoiceModal}
        onClose={() => setShowChoiceModal(false)}
        onChoice={handleAddPatientChoice}
      />

      {/* Patient Search Modal */}
      <PatientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        doctorData={doctorData}
        onPatientAssigned={handlePatientAssigned}
      />
    </div>
  );
}
