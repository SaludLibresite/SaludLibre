import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { createPatient } from "../../lib/patientsService";
import { getAvailableTimeSlots } from "../../lib/appointmentsService";
import { formatDoctorName } from "../../lib/dataUtils";
import { useUserStore } from "../../store/userStore";

// Map JS day index (0=Sunday) to workingHours keys
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Default working hours if doctor hasn't configured them
const DEFAULT_WORKING_HOURS = {
  sunday: { start: "09:00", end: "13:00", enabled: false },
  monday: { start: "09:00", end: "17:00", enabled: true },
  tuesday: { start: "09:00", end: "17:00", enabled: true },
  wednesday: { start: "09:00", end: "17:00", enabled: true },
  thursday: { start: "09:00", end: "17:00", enabled: true },
  friday: { start: "09:00", end: "17:00", enabled: true },
  saturday: { start: "09:00", end: "13:00", enabled: false },
};

/**
 * Parse doctor.horario free-text string to extract a time range.
 * Returns { start: "HH:MM", end: "HH:MM" } or null.
 */
function parseHorarioString(horario) {
  if (!horario) return null;
  const match = horario.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return null;

  let startH = parseInt(match[1]);
  const startM = match[2];
  const startP = match[3]?.toUpperCase();
  let endH = parseInt(match[4]);
  const endM = match[5];
  const endP = match[6]?.toUpperCase();

  if (startP === "PM" && startH < 12) startH += 12;
  if (startP === "AM" && startH === 12) startH = 0;
  if (endP === "PM" && endH < 12) endH += 12;
  if (endP === "AM" && endH === 12) endH = 0;

  return {
    start: `${startH.toString().padStart(2, "0")}:${startM}`,
    end: `${endH.toString().padStart(2, "0")}:${endM}`,
  };
}

export default function AgendarCita({ isOpen, onClose, doctor, onSubmit, currentUser }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    tipoConsulta: "presencial",
    descripcion: "",
    dateOfBirth: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveAsPatient, setSaveAsPatient] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { dayKey, enabled, start, end }
  const [selectedHour, setSelectedHour] = useState(null); // selected hour block (e.g. 9, 10...)
  const { userProfile, userType } = useUserStore();

  // Build effective workingHours: prefer structured data, fallback to parsing horario string
  const workingHours = useMemo(() => {
    if (doctor?.workingHours) return doctor.workingHours;
    // If only free-text horario exists, build a rough workingHours from it
    const parsed = parseHorarioString(doctor?.horario);
    if (parsed) {
      const wh = {};
      DAY_KEYS.forEach((day, i) => {
        // Assume Mon–Fri enabled by default when parsing free text
        wh[day] = {
          start: parsed.start,
          end: parsed.end,
          enabled: i >= 1 && i <= 5, // Mon–Fri
        };
      });
      return wh;
    }
    return DEFAULT_WORKING_HOURS;
  }, [doctor?.workingHours, doctor?.horario]);

  // Pre-llenar campos con datos del usuario activo cuando se abre el sidepanel
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData((prev) => ({
        ...prev,
        nombre: userProfile?.nombre || userProfile?.name || currentUser.displayName || prev.nombre,
        email: userProfile?.email || currentUser.email || prev.email,
        telefono: userProfile?.telefono || userProfile?.phone || currentUser.phoneNumber || prev.telefono,
        dateOfBirth: userProfile?.dateOfBirth || userProfile?.fechaNacimiento || prev.dateOfBirth,
        gender: userProfile?.gender || userProfile?.genero || prev.gender,
      }));
    }
  }, [isOpen, currentUser, userProfile]);

  // Prevenir scroll del body cuando el sidepanel está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let patientId = null;

      // Si el usuario quiere guardar como paciente, crear el paciente primero
      if (saveAsPatient && doctor?.id && currentUser) {
        try {
          const patientData = {
            name: formData.nombre,
            email: formData.email,
            phone: formData.telefono,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            doctorId: doctor.id,
            doctorName: doctor.nombre,
            medicalHistory: formData.descripcion
              ? [
                  {
                    id: Date.now(),
                    date: new Date(),
                    notes: `Consulta inicial: ${formData.descripcion}`,
                    type: "appointment_request",
                  },
                ]
              : [],
          };

          const newPatient = await createPatient(patientData, doctor.id, currentUser.uid);
          patientId = newPatient.id;
        } catch (error) {
          console.error("Error creating patient:", error);
          // Continue with appointment creation even if patient creation fails
        }
      }

      // Crear la cita con nombres de campos consistentes con el resto del sistema
      const appointmentData = {
        // Campos estándar del sistema (inglés)
        patientName: formData.nombre,
        patientEmail: formData.email,
        patientPhone: formData.telefono,
        date: formData.fecha ? new Date(`${formData.fecha}T00:00:00`) : null,
        time: formData.hora,
        type: formData.tipoConsulta,
        reason: formData.descripcion,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        // Campos de referencia en español para compatibilidad con emails
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        fecha: formData.fecha,
        hora: formData.hora,
        tipoConsulta: formData.tipoConsulta,
        descripcion: formData.descripcion,
        // Campos de relación
        doctorId: doctor?.id,
        doctorName: doctor?.nombre,
        doctorSpecialty: doctor?.especialidad,
        doctorGender: doctor?.genero,
        patientId: patientId,
        patientUserId: currentUser?.uid || null,
        status: "pending",
        createdAt: new Date(),
      };

      if (onSubmit) {
        await onSubmit(appointmentData);
      }

      // Mostrar mensaje de éxito
      setMessage(
        saveAsPatient
          ? "Cita agendada y paciente guardado exitosamente"
          : "Cita agendada exitosamente"
      );

      // Resetear formulario después de un delay
      setTimeout(() => {
        setFormData({
          nombre: "",
          email: "",
          telefono: "",
          fecha: "",
          hora: "",
          tipoConsulta: "presencial",
          descripcion: "",
          dateOfBirth: "",
          gender: "",
        });
        setMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error al agendar cita:", error);
      setMessage("Error al agendar la cita. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on doctor's working hours for the selected day
  const generateTimeSlotsForDay = useCallback((dayConfig) => {
    if (!dayConfig || !dayConfig.enabled) return [];

    const [startH, startM] = dayConfig.start.split(":").map(Number);
    const [endH, endM] = dayConfig.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slots = [];
    for (let m = startMinutes; m < endMinutes; m += 15) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    }
    return slots;
  }, []);

  // When the selected date changes, load available slots
  useEffect(() => {
    if (!formData.fecha || !doctor?.id) {
      setAvailableSlots([]);
      setSelectedDayInfo(null);
      return;
    }

    const dateParts = formData.fecha.split("-");
    const selectedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayKey = DAY_KEYS[selectedDate.getDay()];
    const dayConfig = workingHours[dayKey] || { enabled: false };

    setSelectedDayInfo({ dayKey, ...dayConfig });

    if (!dayConfig.enabled) {
      setAvailableSlots([]);
      return;
    }

    // Generate all possible slots for this day based on working hours
    const allSlots = generateTimeSlotsForDay(dayConfig);

    // Now check which slots are already booked
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        // getAvailableTimeSlots returns slots not yet booked, but uses hardcoded range.
        // We'll fetch booked slots and filter our working-hours-based slots instead.
        const bookedSlotsResponse = await getAvailableTimeSlots(doctor.id, selectedDate);
        // bookedSlotsResponse contains the available (non-booked) slots from the service.
        // We intersect our working-hours slots with those available ones.
        const available = allSlots.filter(slot => bookedSlotsResponse.includes(slot));
        setAvailableSlots(available);
      } catch (error) {
        console.error("Error loading available slots:", error);
        // On error, show all working-hours slots (better than nothing)
        setAvailableSlots(allSlots);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [formData.fecha, doctor?.id, workingHours, generateTimeSlotsForDay]);

  // Get days the doctor doesn't work (for disabling in date picker)
  const disabledDays = useMemo(() => {
    const disabled = [];
    DAY_KEYS.forEach((day, index) => {
      if (!workingHours[day]?.enabled) {
        disabled.push(index);
      }
    });
    return disabled;
  }, [workingHours]);

  // Handle date change — also reset the selected time and hour
  const handleDateChange = (value) => {
    handleInputChange("fecha", value);
    handleInputChange("hora", ""); // Reset time when date changes
    setSelectedHour(null);
  };

  // Group available slots by hour for the two-level picker
  const hourGroups = useMemo(() => {
    const groups = {};
    availableSlots.forEach((slot) => {
      const hour = parseInt(slot.split(":")[0]);
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(slot);
    });
    // Return sorted array of { hour, slots }
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map((hour) => ({ hour, slots: groups[hour] }));
  }, [availableSlots]);

  // Variantes de animación para el sidepanel
  const sidepanelVariants = {
    hidden: {
      x: "100%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    visible: {
      x: "0%",
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{
              zIndex: 999,
            }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Sidepanel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl  flex flex-col"
            variants={sidepanelVariants}
            style={{
              zIndex: 20000,
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Agendar Cita
                  </h2>
                  {doctor && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDoctorName(doctor.nombre, doctor.genero)} - {doctor.especialidad}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                  disabled={loading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <form id="agendar-cita-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Message */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-lg ${
                        message.includes("Error")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      <div className="flex items-center">
                        {message.includes("Error") ? (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span className="text-sm font-medium">{message}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Información Personal
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          handleInputChange("nombre", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Juan Pérez"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="juan@email.com"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) =>
                          handleInputChange("telefono", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+54 11 1234-5678"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleInputChange("dateOfBirth", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Género
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          disabled={loading}
                        >
                          <option value="">Seleccionar</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Información de la Cita
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Preferida *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                        disabled={loading}
                      />
                      {selectedDayInfo && !selectedDayInfo.enabled && (
                        <p className="mt-1 text-sm text-amber-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          El profesional no atiende este día
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora Preferida *
                      </label>
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-4">
                          <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                          </svg>
                          <span className="text-sm text-gray-500">Cargando horarios...</span>
                        </div>
                      ) : hourGroups.length > 0 ? (
                        <div className="space-y-2">
                          {/* Hour blocks */}
                          <div className="grid grid-cols-4 gap-2">
                            {hourGroups.map(({ hour, slots }) => {
                              const isExpanded = selectedHour === hour;
                              const hasSelectedSlot = slots.includes(formData.hora);
                              return (
                                <button
                                  key={hour}
                                  type="button"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setSelectedHour(null);
                                    } else {
                                      setSelectedHour(hour);
                                      // If there's only one slot in this hour, auto-select it
                                      if (slots.length === 1) {
                                        handleInputChange("hora", slots[0]);
                                      }
                                    }
                                  }}
                                  className={`px-2 py-2 text-sm rounded-lg border transition-colors font-medium ${
                                    hasSelectedSlot
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : isExpanded
                                      ? "bg-blue-50 text-blue-700 border-blue-400 ring-1 ring-blue-400"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                  }`}
                                  disabled={loading}
                                >
                                  {hour.toString().padStart(2, "0")}:00
                                </button>
                              );
                            })}
                          </div>

                          {/* Expanded sub-slots for selected hour */}
                          {selectedHour !== null && hourGroups.find(g => g.hour === selectedHour) && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs text-blue-600 font-medium mb-2">
                                Seleccioná un horario entre las {selectedHour.toString().padStart(2, "0")}:00 y las {selectedHour.toString().padStart(2, "0")}:45
                              </p>
                              <div className="grid grid-cols-4 gap-2">
                                {hourGroups.find(g => g.hour === selectedHour).slots.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleInputChange("hora", time)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                      formData.hora === time
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                    }`}
                                    disabled={loading}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Show selected time confirmation */}
                          {formData.hora && (
                            <p className="text-sm text-green-600 flex items-center mt-1">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Horario seleccionado: {formData.hora}
                            </p>
                          )}
                        </div>
                      ) : formData.fecha ? (
                        <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                          {selectedDayInfo && !selectedDayInfo.enabled
                            ? "El profesional no atiende este día. Seleccioná otra fecha."
                            : "No hay horarios disponibles para esta fecha"}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                          Seleccioná una fecha para ver los horarios disponibles
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Consulta
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange("tipoConsulta", "presencial")
                          }
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.tipoConsulta === "presencial"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          disabled={loading}
                        >
                          <div className="text-center">
                            <svg
                              className="w-6 h-6 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              Presencial
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange("tipoConsulta", "online")
                          }
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            formData.tipoConsulta === "online"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          disabled={loading}
                        >
                          <div className="text-center">
                            <svg
                              className="w-6 h-6 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-sm font-medium">Online</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo de la Consulta
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) =>
                          handleInputChange("descripcion", e.target.value)
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Describe brevemente el motivo de tu consulta..."
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Save as Patient Option */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={saveAsPatient}
                      onChange={(e) => setSaveAsPatient(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Guardar como paciente
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Guardar mis datos para futuras consultas y tener un
                        historial médico
                      </p>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="agendar-cita-form"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="opacity-25"
                        ></circle>
                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          className="opacity-75"
                        ></path>
                      </svg>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-5 w-5" />
                      <span>Agendar Cita</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
