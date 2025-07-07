import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllDoctors } from "../../lib/doctorsService";
import {
  requestAppointment,
  getAvailableTimeSlots,
} from "../../lib/appointmentsService";
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function AppointmentRequestModal({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    type: "consultation",
    reason: "",
    urgency: "normal",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      setStep(1);
      setSelectedSpecialty("");
      setDoctorSearchTerm("");
      setShowDoctorDropdown(false);
      setFormData({
        doctorId: "",
        date: "",
        time: "",
        type: "consultation",
        reason: "",
        urgency: "normal",
        notes: "",
      });
      setErrors({});
      setMessage("");
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDoctorDropdown &&
        !event.target.closest(".doctor-search-container")
      ) {
        setShowDoctorDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDoctorDropdown]);

  const loadDoctors = async () => {
    try {
      const doctorsList = await getAllDoctors();
      // Only show verified doctors
      const verifiedDoctors = doctorsList.filter(
        (doctor) => doctor.verified === true
      );
      setDoctors(verifiedDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
      setMessage("Error al cargar la lista de doctores");
    }
  };

  // Get unique specialties from doctors
  const getSpecialties = () => {
    const specialties = [
      ...new Set(doctors.map((doctor) => doctor.especialidad)),
    ];
    return specialties.sort();
  };

  // Filter doctors by specialty and search term
  const getFilteredDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialty) {
      filtered = filtered.filter(
        (doctor) => doctor.especialidad === selectedSpecialty
      );
    }

    if (doctorSearchTerm.trim()) {
      const searchLower = doctorSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          doctor.nombre.toLowerCase().includes(searchLower) ||
          doctor.especialidad.toLowerCase().includes(searchLower) ||
          doctor.ubicacion.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadAvailableSlots();
    }
  }, [formData.doctorId, formData.date]);

  const loadAvailableSlots = async () => {
    try {
      const slots = await getAvailableTimeSlots(
        formData.doctorId,
        new Date(formData.date)
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading available slots:", error);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "date" || field === "doctorId") {
      setFormData((prev) => ({
        ...prev,
        time: "",
      }));
    }
  };

  const handleSpecialtyChange = (specialty) => {
    setSelectedSpecialty(specialty);
    setDoctorSearchTerm("");
    setFormData((prev) => ({ ...prev, doctorId: "" }));
    setShowDoctorDropdown(false);
    if (errors.specialty) {
      setErrors((prev) => ({ ...prev, specialty: "" }));
    }
  };

  const handleDoctorSelect = (doctor) => {
    setDoctorSearchTerm(`Dr. ${doctor.nombre} - ${doctor.especialidad}`);
    handleInputChange("doctorId", doctor.id);
    setShowDoctorDropdown(false);
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!selectedSpecialty) {
        newErrors.specialty = "Selecciona una especialidad";
      }
      if (!formData.doctorId) {
        newErrors.doctorId = "Selecciona un doctor";
      }
      if (!formData.date) {
        newErrors.date = "Selecciona una fecha";
      } else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.date = "La fecha no puede ser anterior a hoy";
        }
      }
      if (!formData.time) {
        newErrors.time = "Selecciona un horario";
      }
    }

    if (currentStep === 2) {
      if (!formData.reason.trim()) {
        newErrors.reason = "Describe el motivo de la consulta";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setLoading(true);
      setMessage("");

      const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

      const appointmentData = {
        patientId,
        doctorId: formData.doctorId,
        doctorName: selectedDoctor?.nombre || "",
        doctorSpecialty: selectedDoctor?.especialidad || "",
        date: new Date(formData.date),
        time: formData.time,
        type: formData.type,
        reason: formData.reason,
        urgency: formData.urgency,
        notes: formData.notes,
        patientUserId: currentUser.uid,
      };

      await requestAppointment(appointmentData);

      setMessage("¡Solicitud de cita enviada exitosamente!");
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error requesting appointment:", error);
      setMessage("Error al enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-100 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Solicitar Cita Médica
                </h2>
                <p className="text-sm text-gray-600">Paso {step} de 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 mx-2 ${
                  step >= 2 ? "bg-amber-500" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Doctor y Fecha</span>
              <span className="text-xs text-gray-600">Detalles</span>
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
              <div className="flex items-center">
                {message.includes("Error") ? (
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Step 1: Specialty and Doctor Search */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Specialty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Especialidad *
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    errors.specialty ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecciona una especialidad</option>
                  {getSpecialties().map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                {errors.specialty && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.specialty}
                  </p>
                )}
              </div>

              {/* Doctor Search and Selection */}
              {selectedSpecialty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar y Seleccionar Doctor *
                  </label>
                  <div className="relative doctor-search-container">
                    <div className="relative">
                      <input
                        type="text"
                        value={doctorSearchTerm}
                        onChange={(e) => {
                          setDoctorSearchTerm(e.target.value);
                          setShowDoctorDropdown(true);
                          // Clear selection if search term changes and doesn't match current selection
                          if (formData.doctorId) {
                            const selectedDoctor = doctors.find(
                              (d) => d.id === formData.doctorId
                            );
                            if (
                              selectedDoctor &&
                              !e.target.value.includes(selectedDoctor.nombre)
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                doctorId: "",
                              }));
                            }
                          }
                        }}
                        onFocus={() => setShowDoctorDropdown(true)}
                        className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                          errors.doctorId ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={`Buscar doctor en ${selectedSpecialty}...`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-1" />
                        <ChevronDownIcon
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            showDoctorDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Dropdown with filtered doctors */}
                    {showDoctorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredDoctors().length > 0 ? (
                          getFilteredDoctors().map((doctor) => (
                            <button
                              key={doctor.id}
                              type="button"
                              onClick={() => handleDoctorSelect(doctor)}
                              className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 last:border-b-0 focus:bg-amber-50 focus:outline-none"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    Dr. {doctor.nombre}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {doctor.especialidad} • {doctor.ubicacion}
                                  </p>
                                  {doctor.consultaOnline && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                      Consulta Online
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      doctor.rango === "VIP"
                                        ? "bg-purple-100 text-purple-800"
                                        : doctor.rango === "Intermedio"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {doctor.rango}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-gray-500">
                            No se encontraron doctores en {selectedSpecialty}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.doctorId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.doctorId}
                    </p>
                  )}
                </div>
              )}

              {/* Show message if no doctors available in selected specialty */}
              {selectedSpecialty &&
                doctors.filter((d) => d.especialidad === selectedSpecialty)
                  .length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-yellow-800 text-sm">
                        No hay doctores disponibles para la especialidad{" "}
                        <strong>{selectedSpecialty}</strong>. Por favor,
                        selecciona otra especialidad.
                      </p>
                    </div>
                  </div>
                )}

              {/* Selected Doctor Info */}
              {selectedDoctor && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Dr. {selectedDoctor.nombre}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {selectedDoctor.especialidad}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {selectedDoctor.ubicacion}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la Cita *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  min={minDate}
                  max={maxDateStr}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario Disponible *
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleInputChange("time", slot)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.time === slot
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : formData.doctorId && formData.date ? (
                  <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                    No hay horarios disponibles para esta fecha
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                    Selecciona una especialidad y un doctor para ver horarios
                    disponibles
                  </p>
                )}
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Consulta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="consultation">Consulta General</option>
                  <option value="followup">Control/Seguimiento</option>
                  <option value="specialist">Consulta Especializada</option>
                  <option value="emergency">Urgencia</option>
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgencia
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleInputChange("urgency", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la Consulta *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    errors.reason ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe brevemente el motivo de tu consulta..."
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Información adicional que consideres relevante..."
                />
              </div>

              {/* Summary */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  Resumen de la Cita
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Doctor:</strong> Dr. {selectedDoctor?.nombre}
                  </p>
                  <p>
                    <strong>Especialidad:</strong>{" "}
                    {selectedDoctor?.especialidad}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formData.date &&
                      new Date(formData.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                  <p>
                    <strong>Hora:</strong> {formData.time}
                  </p>
                  <p>
                    <strong>Tipo:</strong>{" "}
                    {formData.type === "consultation"
                      ? "Consulta General"
                      : formData.type === "followup"
                      ? "Control/Seguimiento"
                      : formData.type === "specialist"
                      ? "Consulta Especializada"
                      : "Urgencia"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  ← Anterior
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  )}
                  {loading ? "Enviando..." : "Solicitar Cita"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
