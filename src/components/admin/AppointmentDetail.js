import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  CalendarIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PencilIcon,
  DocumentIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import {
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentsByPatientId,
} from "../../lib/appointmentsService";
import { getPatientById, addMedicalNote } from "../../lib/patientsService";
import AppointmentDocuments from "./AppointmentDocuments";

export default function AppointmentDetail({ appointmentId }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Información");
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load appointment and patient data
  useEffect(() => {
    async function loadData() {
      if (!appointmentId || !currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Load appointment data
        const appointmentData = await getAppointmentById(appointmentId);
        if (!appointmentData) {
          setError("Cita no encontrada");
          return;
        }

        setAppointment(appointmentData);

        // Load patient data if appointment has patientId
        if (appointmentData.patientId) {
          const patientData = await getPatientById(appointmentData.patientId);
          if (patientData) {
            setPatient(patientData);
            setClinicalNotes(patientData.medicalNotes || "");

            // Load patient's appointment history
            const patientHistory = await getAppointmentsByPatientId(
              appointmentData.patientId
            );
            setPatientAppointments(patientHistory);
          }
        }
      } catch (error) {
        console.error("Error loading appointment:", error);
        setError("Error al cargar la información de la cita");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appointmentId, currentUser]);

  const tabs = [
    "Información",
    "Notas Médicas",
    `Historial${
      patientAppointments.length > 0 ? ` (${patientAppointments.length})` : ""
    }`,
    "Documentos",
  ];

  const handleCompleteVisit = async () => {
    try {
      await updateAppointmentStatus(appointmentId, "completed");
      setAppointment((prev) => ({ ...prev, status: "completed" }));
    } catch (error) {
      console.error("Error completing visit:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await updateAppointmentStatus(appointmentId, "cancelled");
      setAppointment((prev) => ({ ...prev, status: "cancelled" }));
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const handleConfirm = async () => {
    try {
      await updateAppointmentStatus(appointmentId, "confirmed");
      setAppointment((prev) => ({ ...prev, status: "confirmed" }));
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!patient) return;

    try {
      setSaving(true);
      await addMedicalNote(patient.id, clinicalNotes);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">
            Cargando información de la cita...
          </p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
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
            onClick={() => router.back()}
            className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const appointmentDate = appointment.date?.toDate
    ? appointment.date.toDate()
    : new Date(appointment.date);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {patient ? patient.name : "Cargando paciente..."}
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
                  {appointment.status === "confirmed"
                    ? "Confirmada"
                    : appointment.status === "pending"
                    ? "Pendiente"
                    : appointment.status === "cancelled"
                    ? "Cancelada"
                    : appointment.status === "completed"
                    ? "Completada"
                    : appointment.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {appointment.status === "pending" && (
              <button
                onClick={handleConfirm}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Confirmar</span>
              </button>
            )}

            {patient?.phone && (
              <button
                onClick={() => window.open(`tel:${patient.phone}`)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <PhoneIcon className="h-4 w-4" />
                <span>Llamar</span>
              </button>
            )}

            {patient?.phone && (
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${patient.phone.replace(/\D/g, "")}`
                  )
                }
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
            )}

            {appointment.status !== "cancelled" &&
              appointment.status !== "completed" && (
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              )}

            {appointment.status === "confirmed" && (
              <button
                onClick={handleCompleteVisit}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
              >
                Completar Visita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
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
                {appointment.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Notas de la Cita
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Info */}
            {patient && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información del Paciente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {patient.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {patient.email || "No especificado"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {patient.phone || "No especificado"}
                    </span>
                  </div>
                  {patient.address && (
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {patient.address}
                      </span>
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Nacido el{" "}
                        {new Date(patient.dateOfBirth).toLocaleDateString(
                          "es-ES"
                        )}
                      </span>
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Alergias
                      </h4>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {patient.allergies}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Notas Médicas" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Notas Médicas
              </h3>
              {patient && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 text-amber-600 hover:text-blue-700"
                  disabled={saving}
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>{isEditing ? "Cancelar" : "Editar"}</span>
                </button>
              )}
            </div>

            {!patient ? (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800">
                  Esta cita no está asociada a un paciente registrado. Las notas
                  médicas solo están disponibles para pacientes registrados.
                </p>
              </div>
            ) : isEditing ? (
              <div>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Ingrese notas médicas..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setClinicalNotes(patient.medicalNotes || "");
                    }}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  {clinicalNotes ||
                    "No hay notas médicas aún. Haga clic en Editar para agregar notas."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab.startsWith("Historial") && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Historial de Citas
              </h3>
              {patientAppointments.length > 0 && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">
                      Completadas:{" "}
                      {
                        patientAppointments.filter(
                          (a) => a.status === "completed"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-600">
                      Pendientes:{" "}
                      {
                        patientAppointments.filter(
                          (a) => a.status === "pending"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">
                      Canceladas:{" "}
                      {
                        patientAppointments.filter(
                          (a) => a.status === "cancelled"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!patient ? (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800">
                  El historial solo está disponible para pacientes registrados.
                </p>
              </div>
            ) : patientAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No se encontraron citas para este paciente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientAppointments
                  .sort((a, b) => {
                    const dateA = a.date?.toDate
                      ? a.date.toDate()
                      : new Date(a.date);
                    const dateB = b.date?.toDate
                      ? b.date.toDate()
                      : new Date(b.date);
                    return dateB - dateA; // Most recent first
                  })
                  .map((appt) => {
                    const appointmentDate = appt.date?.toDate
                      ? appt.date.toDate()
                      : new Date(appt.date);
                    const isCurrentAppointment = appt.id === appointmentId;

                    return (
                      <div
                        key={appt.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          isCurrentAppointment
                            ? "border-amber-300 bg-amber-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {appointmentDate.toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {appt.time}
                                </span>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  appt.status
                                )}`}
                              >
                                {appt.status === "confirmed"
                                  ? "Confirmada"
                                  : appt.status === "pending"
                                  ? "Pendiente"
                                  : appt.status === "cancelled"
                                  ? "Cancelada"
                                  : appt.status === "completed"
                                  ? "Completada"
                                  : appt.status}
                              </span>
                              {isCurrentAppointment && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Cita actual
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <strong>Motivo:</strong>{" "}
                                {appt.reason || "Consulta general"}
                              </p>
                              {appt.doctorName && (
                                <p className="text-sm text-gray-600">
                                  <strong>Doctor:</strong> {appt.doctorName}
                                </p>
                              )}
                              {appt.doctorSpecialty && (
                                <p className="text-sm text-gray-600">
                                  <strong>Especialidad:</strong>{" "}
                                  {appt.doctorSpecialty}
                                </p>
                              )}
                              {appt.notes && (
                                <p className="text-sm text-gray-600">
                                  <strong>Notas:</strong> {appt.notes}
                                </p>
                              )}
                              {appt.urgency && appt.urgency !== "normal" && (
                                <p className="text-sm text-red-600">
                                  <strong>Urgencia:</strong>{" "}
                                  {appt.urgency === "urgent"
                                    ? "Urgente"
                                    : appt.urgency}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!isCurrentAppointment && (
                              <button
                                onClick={() =>
                                  router.push(`/admin/appointment/${appt.id}`)
                                }
                                className="text-amber-600 hover:text-amber-700 px-3 py-1 rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors duration-200 text-sm"
                              >
                                Ver detalles
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Documentos" && (
          <AppointmentDocuments
            appointmentId={appointmentId}
            patientId={appointment?.patientId}
          />
        )}
      </div>
    </div>
  );
}
