import { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  updateAppointmentStatus,
  deleteAppointment,
} from "../../lib/appointmentsService";

export default function PatientAppointments({
  patient,
  appointments,
  onRefresh,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rescheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "scheduled":
        return "Programada";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "pending":
        return "Pendiente";
      case "rescheduled":
        return "Reprogramada";
      default:
        return status;
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      await updateAppointmentStatus(appointmentId, newStatus);
      onRefresh();
      setMessage(`Cita marcada como ${getStatusText(newStatus).toLowerCase()}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setMessage("Error al actualizar el estado de la cita");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm("¿Está seguro de que desea eliminar esta cita?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteAppointment(appointmentId);
      onRefresh();
      setMessage("Cita eliminada exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setMessage("Error al eliminar la cita");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const appointmentDate = date?.toDate ? date.toDate() : new Date(date);
    return appointmentDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return time;
  };

  // Sort appointments by date (newest first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB - dateA;
  });

  const upcomingAppointments = sortedAppointments.filter((appointment) => {
    const appointmentDate = appointment.date?.toDate
      ? appointment.date.toDate()
      : new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today && appointment.status !== "cancelled";
  });

  const pastAppointments = sortedAppointments.filter((appointment) => {
    const appointmentDate = appointment.date?.toDate
      ? appointment.date.toDate()
      : new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate < today || appointment.status === "completed";
  });

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("Error")
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-green-100 text-green-700 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Próximas Citas ({upcomingAppointments.length})
        </h3>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <CalendarIcon className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-blue-900 mb-2">
              No hay citas próximas
            </h4>
            <p className="text-blue-700">
              No se encontraron citas programadas para este paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatTime(appointment.time)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Motivo:</strong>{" "}
                        {appointment.reason || "Consulta general"}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Notas:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointment.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment.id, "scheduled")
                          }
                          disabled={loading}
                          className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors duration-200"
                          title="Confirmar cita"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(appointment.id, "cancelled")
                          }
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                          title="Cancelar cita"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {appointment.status === "scheduled" && (
                      <button
                        onClick={() =>
                          handleStatusChange(appointment.id, "completed")
                        }
                        disabled={loading}
                        className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors duration-200"
                        title="Marcar como completada"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                      title="Eliminar cita"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
          Historial de Citas ({pastAppointments.length})
        </h3>

        {pastAppointments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Sin historial de citas
            </h4>
            <p className="text-gray-600">
              No se encontraron citas anteriores para este paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {formatTime(appointment.time)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Motivo:</strong>{" "}
                        {appointment.reason || "Consulta general"}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Notas:</strong> {appointment.notes}
                        </p>
                      )}
                      {appointment.diagnosis && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Diagnóstico:</strong> {appointment.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-gray-600 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">
                Total de Citas
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {appointments.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Completadas</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  appointments.filter((apt) => apt.status === "completed")
                    .length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Próximas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {upcomingAppointments.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
