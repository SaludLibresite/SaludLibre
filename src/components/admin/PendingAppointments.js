import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { 
  getPendingAppointments,
  approveAppointment,
  rejectAppointment 
} from "../../lib/appointmentsService";
import { getPatientById } from "../../lib/patientsService";
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function PendingAppointments() {
  const { currentUser } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    if (currentUser) {
      loadDoctorData();
    }
  }, [currentUser]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      const doctor = await getDoctorByUserId(currentUser.uid);
      if (doctor) {
        setDoctorData(doctor);
        await loadPendingAppointments(doctor.id);
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
      setMessage("Error al cargar los datos del doctor");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingAppointments = async (doctorId) => {
    try {
      const appointments = await getPendingAppointments(doctorId);
      
      // Enrich appointments with patient data
      const enrichedAppointments = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            const patient = await getPatientById(appointment.patientId);
            return {
              ...appointment,
              patientData: patient,
            };
          } catch (error) {
            console.error("Error loading patient data:", error);
            return appointment;
          }
        })
      );

      setPendingAppointments(enrichedAppointments);
    } catch (error) {
      console.error("Error loading pending appointments:", error);
      setMessage("Error al cargar las solicitudes de citas");
    }
  };

  const handleApprove = async (appointmentId, notes = "") => {
    try {
      setProcessingIds(prev => new Set(prev).add(appointmentId));
      await approveAppointment(appointmentId, notes);
      await loadPendingAppointments(doctorData.id);
      setMessage("Cita aprobada exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error approving appointment:", error);
      setMessage("Error al aprobar la cita");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleReject = async (appointmentId, reason) => {
    if (!reason.trim()) {
      setMessage("Debe proporcionar un motivo para el rechazo");
      return;
    }

    try {
      setProcessingIds(prev => new Set(prev).add(appointmentId));
      await rejectAppointment(appointmentId, reason);
      await loadPendingAppointments(doctorData.id);
      setMessage("Cita rechazada");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      setMessage("Error al rechazar la cita");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-green-100 text-green-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "normal":
        return "Normal";
      case "low":
        return "Baja";
      default:
        return "Normal";
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
      case "emergency":
        return "Urgencia";
      default:
        return "Consulta General";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-2 text-gray-600">Cargando solicitudes...</span>
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
              <ClockIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Solicitudes de Citas Pendientes
              </h3>
              <p className="text-sm text-gray-600">
                {pendingAppointments.length} solicitud{pendingAppointments.length !== 1 ? 'es' : ''} pendiente{pendingAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes("Error")
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-green-100 text-green-700 border border-green-200"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {pendingAppointments.length > 0 ? (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processingIds.has(appointment.id)}
                getUrgencyColor={getUrgencyColor}
                getUrgencyText={getUrgencyText}
                getAppointmentTypeText={getAppointmentTypeText}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay solicitudes pendientes
            </h3>
            <p className="text-sm text-gray-500">
              Todas las solicitudes de citas han sido procesadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  onApprove, 
  onReject, 
  isProcessing,
  getUrgencyColor,
  getUrgencyText,
  getAppointmentTypeText
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleRejectSubmit = () => {
    onReject(appointment.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Patient Info */}
            <div className="flex items-center mb-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {appointment.patientData?.name || "Paciente"}
                </h4>
                <p className="text-sm text-gray-600">
                  {appointment.patientData?.email || "Email no disponible"}
                </p>
              </div>
              <div className="ml-auto flex space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(appointment.urgency)}`}>
                  {getUrgencyText(appointment.urgency)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getAppointmentTypeText(appointment.type)}
                </span>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2 text-amber-600" />
                <span>
                  {new Date(appointment.date.toDate ? appointment.date.toDate() : appointment.date)
                    .toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2 text-amber-600" />
                <span>{appointment.time}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-1">Motivo de la consulta:</h5>
              <p className="text-gray-600 text-sm">{appointment.reason}</p>
            </div>

            {/* Additional Notes */}
            {appointment.notes && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-1">Notas adicionales:</h5>
                <p className="text-gray-600 text-sm">{appointment.notes}</p>
              </div>
            )}

            {/* Request Date */}
            <div className="text-xs text-gray-500">
              Solicitada el {new Date(appointment.requestedAt.toDate ? appointment.requestedAt.toDate() : appointment.requestedAt)
                .toLocaleDateString("es-ES")} a las {new Date(appointment.requestedAt.toDate ? appointment.requestedAt.toDate() : appointment.requestedAt)
                .toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-4 w-4 inline mr-1" />
            Rechazar
          </button>
          <button
            onClick={() => onApprove(appointment.id)}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
            ) : (
              <CheckIcon className="h-4 w-4 mr-1" />
            )}
            Aprobar
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Rechazar Solicitud de Cita
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Por favor, proporciona un motivo para el rechazo. Esto ayudará al paciente a entender la decisión.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 