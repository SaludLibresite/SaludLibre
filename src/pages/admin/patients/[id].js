import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { getPatientById } from "@/lib/patientsService";
import { getAppointmentsByPatientId } from "@/lib/appointmentsService";
import { getDoctorByUserId } from "@/lib/doctorsService";
import PatientAppointments from "@/components/admin/PatientAppointments";
import NewAppointmentModal from "@/components/admin/NewAppointmentModal";
import EditPatientModal from "@/components/admin/EditPatientModal";
import PrescriptionModal from "@/components/admin/PrescriptionModal";

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [message, setMessage] = useState("");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  useEffect(() => {
    if (id && currentUser) {
      loadPatientData();
    }
  }, [id, currentUser]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Get doctor data first
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (!doctor) {
        throw new Error("No se encontró el perfil del doctor");
      }
      setDoctorData(doctor);

      // Load patient data
      const patientData = await getPatientById(id);

      // Verify this patient belongs to the current doctor
      if (patientData.doctorId !== doctor.id) {
        throw new Error("No tienes permiso para ver este paciente");
      }

      setPatient(patientData);

      // Load patient appointments
      const patientAppointments = await getAppointmentsByPatientId(id);
      setAppointments(patientAppointments);
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage(error.message || "Error al cargar los datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  const refreshAppointments = async () => {
    try {
      const patientAppointments = await getAppointmentsByPatientId(id);
      setAppointments(patientAppointments);
    } catch (error) {
      console.error("Error refreshing appointments:", error);
    }
  };

  const refreshPatientData = async () => {
    try {
      const patientData = await getPatientById(id);
      setPatient(patientData);
    } catch (error) {
      console.error("Error refreshing patient data:", error);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Cargando información del paciente...
              </p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (message && !patient) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.push("/admin/patients")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver a Pacientes
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{message}</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin/patients")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Volver
              </button>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center shadow-md mr-4">
                  <span className="text-lg font-medium text-white">
                    {patient?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {patient?.name || "Paciente"}
                  </h1>
                  <p className="text-gray-600">
                    {patient?.patientId && `ID: ${patient.patientId} • `}
                    {patient?.age || calculateAge(patient?.dateOfBirth)} años
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewAppointmentModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Nueva Cita</span>
              </button>
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Receta</span>
              </button>
              <button
                onClick={() => setShowEditPatientModal(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("Error")
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: "info", name: "Información", icon: UserIcon },
                  { id: "appointments", name: "Citas", icon: CalendarIcon },
                  {
                    id: "medical",
                    name: "Historial Médico",
                    icon: ClipboardDocumentListIcon,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "border-amber-500 text-amber-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Personal
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Nombre</div>
                            <div className="font-medium">
                              {patient?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">
                              {patient?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Teléfono
                            </div>
                            <div className="font-medium">
                              {patient?.phone || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Fecha de Nacimiento
                            </div>
                            <div className="font-medium">
                              {patient?.dateOfBirth
                                ? new Date(
                                    patient.dateOfBirth
                                  ).toLocaleDateString("es-ES")
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Género</div>
                            <div className="font-medium">
                              {patient?.gender || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Dirección
                            </div>
                            <div className="font-medium">
                              {patient?.address || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Contacto de Emergencia
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Nombre</div>
                            <div className="font-medium">
                              {patient?.emergencyContact || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Teléfono
                            </div>
                            <div className="font-medium">
                              {patient?.emergencyPhone || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical & Insurance Information */}
                  <div className="space-y-6">
                    {/* Medical Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información Médica
                      </h3>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Alergias
                          </div>
                          <div className="font-medium">
                            {patient?.allergies || "Ninguna registrada"}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Medicaciones Actuales
                          </div>
                          <div className="font-medium">
                            {patient?.currentMedications ||
                              "Ninguna registrada"}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">
                            Historial Médico
                          </div>
                          <div className="font-medium">
                            {patient?.medicalHistory &&
                            patient.medicalHistory.length > 0
                              ? patient.medicalHistory[0]?.notes || "Sin notas"
                              : "Sin historial registrado"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insurance Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Información del Seguro
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Obra Social/Prepaga
                            </div>
                            <div className="font-medium">
                              {patient?.insuranceProvider || "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <IdentificationIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">
                              Número de Afiliado
                            </div>
                            <div className="font-medium">
                              {patient?.insuranceNumber || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appointments" && (
                <PatientAppointments
                  patient={patient}
                  appointments={appointments}
                  onRefresh={refreshAppointments}
                />
              )}

              {activeTab === "medical" && (
                <div>
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Historial Médico Detallado
                    </h3>
                    <p className="text-gray-600 mb-4">
                      El historial médico detallado estará disponible
                      próximamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modals */}
          <NewAppointmentModal
            isOpen={showNewAppointmentModal}
            onClose={() => setShowNewAppointmentModal(false)}
            patient={patient}
            doctorData={doctorData}
            onSuccess={() => {
              setShowNewAppointmentModal(false);
              refreshAppointments();
              setMessage("Cita creada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />

          <EditPatientModal
            isOpen={showEditPatientModal}
            onClose={() => setShowEditPatientModal(false)}
            patient={patient}
            onSuccess={() => {
              setShowEditPatientModal(false);
              refreshPatientData();
              setMessage("Información del paciente actualizada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />

          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            patient={patient}
            doctorData={doctorData}
            onSuccess={() => {
              setShowPrescriptionModal(false);
              setMessage("Receta generada exitosamente");
              setTimeout(() => setMessage(""), 3000);
            }}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
