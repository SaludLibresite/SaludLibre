import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import {
  query,
  collection,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import PatientLayout from "../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../components/paciente/ProtectedPatientRoute";
import AppointmentRequestModal from "../../components/paciente/AppointmentRequestModal";
import {
  getAppointmentsByPatientId,
  cancelAppointment,
  rescheduleAppointment,
} from "../../lib/appointmentsService";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function PatientAppointments() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, cancelled
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadPatientData();
    }
  }, [currentUser]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Get patient data
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", currentUser.uid)
      );
      const patientsSnapshot = await getDocs(patientsQuery);

      if (!patientsSnapshot.empty) {
        const patientDoc = patientsSnapshot.docs[0];
        const patient = { id: patientDoc.id, ...patientDoc.data() };
        setPatientData(patient);

        // Load appointments for this patient
        await loadAppointments(patient.id);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setMessage("Error al cargar los datos del paciente");
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async (patientId) => {
    try {
      const appointmentsList = await getAppointmentsByPatientId(patientId);
      setAppointments(appointmentsList);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setMessage("Error al cargar las citas");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
      return;
    }

    try {
      await cancelAppointment(
        appointmentId,
        "Cancelada por el paciente",
        "patient"
      );
      await loadAppointments(patientData.id);
      setMessage("Cita cancelada exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setMessage("Error al cancelar la cita");
    }
  };

  const handleAppointmentSuccess = () => {
    if (patientData) {
      loadAppointments(patientData.id);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const now = new Date();
    const appointmentDate = appointment.date?.toDate
      ? appointment.date.toDate()
      : new Date(appointment.date);

    switch (filter) {
      case "upcoming":
        return appointmentDate >= now && appointment.status === "scheduled";
      case "past":
        return appointmentDate < now || appointment.status === "completed";
      case "cancelled":
        return appointment.status === "cancelled";
      default:
        return true;
    }
  });

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case "rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Confirmada";
      case "pending":
        return "Pendiente Aprobación";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "rejected":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  };

  const getAppointmentTypeText = (type) => {
    switch (type) {
      case "consultation":
        return "Consulta General";
      case "followup":
        return "Control/Seguimiento";
      case "specialist":
        return "Consulta Especializada";
      case "checkup":
        return "Chequeo Médico";
      case "procedure":
        return "Procedimiento";
      case "emergency":
        return "Urgencia";
      default:
        return "Consulta General";
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando citas...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <ProtectedPatientRoute>
      <PatientLayout>
        <div className="p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mr-4">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Mis Citas
                  </h1>
                  <p className="text-gray-600">
                    Gestiona todas tus citas médicas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewAppointmentModal(true)}
                disabled={!patientData}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Cita
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
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "upcoming"
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Próximas (
                {
                  appointments.filter(
                    (a) =>
                      new Date(a.date) >= new Date() && a.status === "scheduled"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "past"
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Pasadas (
                {
                  appointments.filter(
                    (a) =>
                      new Date(a.date) < new Date() || a.status === "completed"
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setFilter("cancelled")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "cancelled"
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Canceladas (
                {appointments.filter((a) => a.status === "cancelled").length})
              </button>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="h-16 w-16 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-6">
                        <span className="text-lg font-bold text-white">
                          {appointment.doctorName
                            ? appointment.doctorName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "DR"}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            Dr.{" "}
                            {appointment.doctorName || "Nombre no disponible"}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-amber-600" />
                            <span>
                              {(appointment.date?.toDate
                                ? appointment.date.toDate()
                                : new Date(appointment.date)
                              ).toLocaleDateString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-amber-600" />
                            <span>{appointment.time} hs</span>
                          </div>

                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-2 text-amber-600" />
                            <span>
                              {getAppointmentTypeText(appointment.type)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">
                            {appointment.doctorSpecialty ||
                              "Especialidad no especificada"}
                          </p>
                          {appointment.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Motivo:</strong> {appointment.reason}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Notas:</strong> {appointment.notes}
                            </p>
                          )}
                          {appointment.rejectionReason && (
                            <p className="text-sm text-red-600 mt-1">
                              <strong>Motivo del rechazo:</strong>{" "}
                              {appointment.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {getStatusIcon(appointment.status)}
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                          onClick={() =>
                            router.push(
                              `/paciente/appointment/${appointment.id}`
                            )
                          }
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Ver detalles</span>
                        </button>
                        {(appointment.status === "scheduled" ||
                          appointment.status === "pending") && (
                          <>
                            {appointment.status === "scheduled" && (
                              <button
                                className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                                onClick={() => {
                                  // TODO: Implement reschedule functionality
                                  alert(
                                    "Funcionalidad de reprogramación próximamente"
                                  );
                                }}
                              >
                                Reprogramar
                              </button>
                            )}
                            <button
                              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                              onClick={() =>
                                handleCancelAppointment(appointment.id)
                              }
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay citas{" "}
                  {filter === "all"
                    ? ""
                    : filter === "upcoming"
                    ? "próximas"
                    : filter === "past"
                    ? "pasadas"
                    : "canceladas"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === "upcoming"
                    ? "No tienes citas programadas. ¡Agenda tu próxima consulta!"
                    : filter === "past"
                    ? "No tienes historial de citas completadas aún."
                    : filter === "cancelled"
                    ? "No tienes citas canceladas."
                    : "Aún no has programado ninguna cita médica."}
                </p>
                <button
                  onClick={() => setShowNewAppointmentModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Agendar Primera Cita
                </button>
              </div>
            )}
          </div>

          {/* Appointment Request Modal */}
          <AppointmentRequestModal
            isOpen={showNewAppointmentModal}
            onClose={() => setShowNewAppointmentModal(false)}
            onSuccess={handleAppointmentSuccess}
            patientId={patientData?.id}
          />
        </div>
      </PatientLayout>
    </ProtectedPatientRoute>
  );
}
