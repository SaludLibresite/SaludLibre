import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getAppointmentById } from "../../../lib/appointmentsService";
import { getPatientById } from "../../../lib/patientsService";
import PatientLayout from "../../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../../components/paciente/ProtectedPatientRoute";
import AppointmentDocumentsPatient from "../../../components/paciente/AppointmentDocumentsPatient";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  DocumentIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function PatientAppointmentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Información");

  useEffect(() => {
    if (id && currentUser) {
      loadAppointmentData();
    }
  }, [id, currentUser]);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load appointment data
      const appointmentData = await getAppointmentById(id);
      if (!appointmentData) {
        setError("Cita no encontrada");
        return;
      }

      // Verify this appointment belongs to the current patient
      if (appointmentData.patientId) {
        const patientData = await getPatientById(appointmentData.patientId);
        if (patientData && patientData.userId === currentUser.uid) {
          setAppointment(appointmentData);
          setPatient(patientData);
        } else {
          setError("No tienes permisos para ver esta cita");
        }
      } else {
        setError("Cita no asociada a un paciente registrado");
      }
    } catch (error) {
      console.error("Error loading appointment:", error);
      setError("Error al cargar la información de la cita");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Agendada";
      case "pending":
        return "Pendiente";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "rejected":
        return "Rechazada";
      default:
        return status;
    }
  };

  const getDoctorTitle = (gender) => {
    if (!gender) return "Dr.";

    // Normalize gender to lowercase for comparison
    const normalizedGender = gender.toLowerCase().trim();

    switch (normalizedGender) {
      case "femenino":
      case "female":
      case "f":
      case "mujer":
      case "woman":
      case "w":
        return "Dra.";
      case "masculino":
      case "male":
      case "m":
      case "hombre":
      case "man":
        return "Dr.";
      default:
        // If gender is not clearly identified, try to infer from name patterns
        // This is a fallback for cases where gender data might be missing
        return "Dr.";
    }
  };

  const tabs = ["Información", "Documentos"];

  if (loading) {
    return (
      <ProtectedPatientRoute>
        <PatientLayout>
          <div className="bg-white rounded-lg shadow">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">
                Cargando información de la cita...
              </p>
            </div>
          </div>
        </PatientLayout>
      </ProtectedPatientRoute>
    );
  }

  if (error || !appointment) {
    return (
      <ProtectedPatientRoute>
        <PatientLayout>
          <div className="bg-white rounded-lg shadow">
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {error || "No se encontró la cita"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                La cita solicitada no está disponible o no existe.
              </p>
              <button
                onClick={() => router.push("/paciente/appointments")}
                className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center space-x-2 mx-auto"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Volver a Mis Citas</span>
              </button>
            </div>
          </div>
        </PatientLayout>
      </ProtectedPatientRoute>
    );
  }

  const appointmentDate = appointment.date?.toDate
    ? appointment.date.toDate()
    : new Date(appointment.date);

  return (
    <ProtectedPatientRoute>
      <PatientLayout>
        <div className="px-10 py-5">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/paciente/appointments")}
              className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Volver a Mis Citas</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalle de Cita
            </h1>
          </div>

          {/* Appointment Header */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {getDoctorTitle(appointment.doctorGender)} {appointment.doctorName}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{appointmentDate.toLocaleDateString("es-ES")}</span>
                      <span>•</span>
                      <span>{appointment.time}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? "border-amber-500 text-amber-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "Información" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appointment Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Información de la Cita
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {appointmentDate.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {appointment.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {appointment.reason || "No especificado"}
                        </span>
                      </div>
                      {appointment.doctorSpecialty && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Especialidad
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {appointment.doctorSpecialty}
                          </p>
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Notas
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Información del Doctor
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {getDoctorTitle(appointment.doctorGender)} {appointment.doctorName}
                        </span>
                      </div>
                      {appointment.doctorSpecialty && (
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.doctorSpecialty}
                          </span>
                        </div>
                      )}
                      {appointment.doctorPhone && (
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.doctorPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Documentos" && (
                <AppointmentDocumentsPatient
                  appointmentId={id}
                  readOnly={
                    appointment.status === "completed" ||
                    appointment.status === "cancelled"
                  }
                />
              )}
            </div>
          </div>
        </div>
      </PatientLayout>
    </ProtectedPatientRoute>
  );
}
