import { useState } from "react";
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { createAppointment } from "../../lib/appointmentsService";

export default function NewAppointmentModal({
  isOpen,
  onClose,
  patient,
  doctorData,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    notes: "",
    type: "consultation",
    duration: "30",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.date) {
      setError("La fecha es requerida");
      return false;
    }
    if (!formData.time) {
      setError("La hora es requerida");
      return false;
    }
    if (!formData.reason) {
      setError("El motivo de la cita es requerido");
      return false;
    }

    // Validate date is not in the past
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    if (appointmentDate < now) {
      setError("La fecha y hora no pueden ser en el pasado");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const appointmentData = {
        patientId: patient.id,
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        doctorId: doctorData.id,
        doctorName: doctorData.nombre,
        date: new Date(`${formData.date}T00:00:00`),
        time: formData.time,
        reason: formData.reason,
        notes: formData.notes,
        type: formData.type,
        duration: parseInt(formData.duration),
        status: "scheduled",
      };

      // Add optional fields only if they exist
      if (doctorData.especialidad) {
        appointmentData.doctorSpecialty = doctorData.especialidad;
      }
      if (doctorData.genero) {
        appointmentData.doctorGender = doctorData.genero;
      }

      await createAppointment(appointmentData);

      // Reset form
      setFormData({
        date: "",
        time: "",
        reason: "",
        notes: "",
        type: "consultation",
        duration: "30",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError("Error al crear la cita. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        date: "",
        time: "",
        reason: "",
        notes: "",
        type: "consultation",
        duration: "30",
      });
      setError("");
      onClose();
    }
  };

  // Generate time slots (9 AM to 6 PM, every 15 minutes)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:15`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
      slots.push(`${hour.toString().padStart(2, "0")}:45`);
    }
    return slots;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nueva Cita
              </h2>
              <p className="text-sm text-gray-600">
                Programar cita para {patient?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <span className="ml-2 font-medium">{patient?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{patient?.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>
                <span className="ml-2 font-medium">{patient?.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-medium">{patient?.patientId}</span>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  min={getMinDate()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Seleccionar hora</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Type and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cita
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={loading}
              >
                <option value="consultation">Consulta</option>
                <option value="followup">Seguimiento</option>
                <option value="checkup">Chequeo</option>
                <option value="emergency">Urgencia</option>
                <option value="procedure">Procedimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (minutos)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={loading}
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la Cita <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              placeholder="Ej: Consulta general, Control de rutina, Dolor de cabeza..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                placeholder="Notas adicionales sobre la cita (opcional)..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? "Creando..." : "Crear Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
