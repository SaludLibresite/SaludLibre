import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import Select from "react-select";
import {
  PlusIcon,
  CalendarIcon,
  ListBulletIcon,
  TableCellsIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import {
  getAppointmentsByDoctorId,
  createAppointment,
} from "../../lib/appointmentsService";
import { getPatientsByDoctorId } from "../../lib/patientsService";

// Configure moment for Spanish
moment.locale("es");
const localizer = momentLocalizer(moment);

export default function Calendar() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("Calendario");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    reason: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  // Load doctor data and appointments
  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Get doctor data
        const doctor = await getDoctorByUserId(currentUser.uid);
        if (doctor) {
          setDoctorData(doctor);

          // Load appointments and patients for this doctor
          const [appointmentsList, patientsList] = await Promise.all([
            getAppointmentsByDoctorId(doctor.id),
            getPatientsByDoctorId(doctor.id),
          ]);

          setAppointments(appointmentsList);
          setPatients(patientsList);
        }
      } catch (error) {
        console.error("Error loading appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Create patient options for select
  const patientOptions = useMemo(() => {
    return patients.map((patient) => ({
      value: patient.id,
      label: `${patient.name || 'Sin nombre'} - ${patient.phone || 'Sin teléfono'}`,
      id: patient.id,
      fullName: patient.name,
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
    }));
  }, [patients]);

  // Convert appointments to calendar events
  const events = useMemo(() => {
    return appointments.map((appointment) => {
      const appointmentDate = appointment.date?.toDate
        ? appointment.date.toDate()
        : new Date(appointment.date);

      // Parse time and create start/end times
      const [hours, minutes] = appointment.time.split(":");
      const start = new Date(appointmentDate);
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const end = new Date(start);
      end.setHours(start.getHours() + 1); // Default 1 hour duration

      return {
        id: appointment.id,
        title: `${appointment.patientName} - ${appointment.reason}`,
        start,
        end,
        resource: appointment,
      };
    });
  }, [appointments]);

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);

    // Format date for input
    const selectedDate = moment(slotInfo.start).format("YYYY-MM-DD");
    const selectedTime = moment(slotInfo.start).format("HH:mm");

    setNewAppointment((prev) => ({
      ...prev,
      date: selectedDate,
      time: selectedTime,
    }));

    setShowCreateModal(true);
  };

  const handleSelectEvent = (event) => {
    router.push(`/admin/appointment/${event.id}`);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const onNavigate = (action) => {
    let newDate = new Date(date);

    if (action === "PREV") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() - 7);
      }
    } else if (action === "NEXT") {
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else if (action === "TODAY") {
      newDate = new Date();
    }

    setDate(newDate);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!doctorData || !selectedPatient) {
      alert("Por favor selecciona un paciente");
      return;
    }

    try {
      setCreating(true);

      const appointmentData = {
        doctorId: doctorData.id,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        patientEmail: selectedPatient.email || "",
        date: new Date(`${newAppointment.date}T${newAppointment.time}`),
        time: newAppointment.time,
        reason: newAppointment.reason,
        notes: newAppointment.notes,
        status: "pending",
      };

      const created = await createAppointment(appointmentData);

      // Add to local state
      setAppointments((prev) => [...prev, created]);

      // Close modal and reset form
      setShowCreateModal(false);
      setSelectedPatient(null);
      setNewAppointment({
        date: "",
        time: "",
        reason: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error al crear la cita. Por favor intenta de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTodayAppointments = () => {
    const today = moment().startOf("day");
    return appointments
      .filter((appointment) => {
        const appointmentDate = appointment.date?.toDate
          ? moment(appointment.date.toDate())
          : moment(appointment.date);
        return appointmentDate.isSame(today, "day");
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getAllUpcomingAppointments = () => {
    const today = moment().startOf("day");

    return appointments
      .filter((appointment) => {
        const appointmentDate = appointment.date?.toDate
          ? moment(appointment.date.toDate())
          : moment(appointment.date);
        return (
          appointmentDate.isSameOrAfter(today) &&
          appointment.status !== "cancelled"
        );
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? moment(a.date.toDate()) : moment(a.date);
        const dateB = b.date?.toDate ? moment(b.date.toDate()) : moment(b.date);
        return dateA.diff(dateB);
      });
  };

  // Custom event component
  const EventComponent = ({ event }) => {
    const appointment = event.resource;
    return (
      <div
        className={`p-1 sm:p-1.5 rounded text-xs ${getStatusColor(
          appointment.status
        )} border-l-4 h-full`}
      >
        <div className="font-semibold truncate text-[10px] sm:text-xs leading-tight">{appointment.patientName}</div>
        <div className="truncate text-[9px] sm:text-[11px] leading-tight mt-0.5">{appointment.reason}</div>
      </div>
    );
  };

  // Calendar messages in Spanish
  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay citas en este rango.",
    showMore: (total) => `+ Ver más (${total})`,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Agenda</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-700 text-sm sm:text-base"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Cita</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-1 sm:space-x-8 overflow-x-auto">
          {["Agenda", "Calendario", "Lista"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-2 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 px-2 sm:px-0 ${
                selectedTab === tab
                  ? "border-blue-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "Agenda" && <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
              {tab === "Calendario" && <TableCellsIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
              {tab === "Lista" && <ListBulletIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6">
        {/* Agenda Tab */}
        {selectedTab === "Agenda" && (
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              Citas de Hoy ({getTodayAppointments().length})
            </h3>
            <div className="space-y-3">
              {getTodayAppointments().length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No hay citas programadas para hoy
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm"
                  >
                    Crear Primera Cita
                  </button>
                </div>
              ) : (
                getTodayAppointments().map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() =>
                      router.push(`/admin/appointment/${appointment.id}`)
                    }
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {appointment.patientName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {appointment.reason}
                        </p>
                        {appointment.patientPhone && (
                          <p className="text-xs text-gray-500 truncate">
                            {appointment.patientPhone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {appointment.time}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(
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
                ))
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {selectedTab === "Calendario" && (
          <div>
            {/* Custom Calendar Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                <button
                  onClick={() => onNavigate("PREV")}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <button
                  onClick={() => onNavigate("TODAY")}
                  className="px-3 py-2 sm:px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm"
                >
                  Hoy
                </button>

                <button
                  onClick={() => onNavigate("NEXT")}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <h2 className="text-sm sm:text-lg font-semibold text-gray-900 text-center sm:text-left">
                  {moment(date).format(
                    view === "month" ? "MMM YYYY" : "D MMM YYYY"
                  )}
                </h2>
              </div>

              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => handleViewChange("month")}
                  className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    view === "month"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => handleViewChange("week")}
                  className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    view === "week"
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div style={{ height: view === "month" ? "600px" : "700px", minWidth: view === "month" ? "320px" : "600px" }} className="px-3 sm:px-0">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  messages={messages}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  date={date}
                  view={view}
                  selectable
                  popup
                  components={{
                    event: EventComponent,
                    toolbar: () => null, // Disable built-in toolbar
                  }}
                  views={["month", "week"]}
                  step={30}
                  timeslots={2}
                  min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
                  max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
                />
              </div>
            </div>
          </div>
        )}

        {/* List Tab */}
        {selectedTab === "Lista" && (
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              Próximas Citas ({getAllUpcomingAppointments().length})
            </h3>

            <div className="space-y-4">
              {getAllUpcomingAppointments().length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No hay citas programadas
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm"
                  >
                    Crear Primera Cita
                  </button>
                </div>
              ) : (
                getAllUpcomingAppointments().map((appointment) => {
                  const appointmentDate = appointment.date?.toDate
                    ? moment(appointment.date.toDate())
                    : moment(appointment.date);

                  return (
                    <div
                      key={appointment.id}
                      onClick={() =>
                        router.push(`/admin/appointment/${appointment.id}`)
                      }
                      className="bg-gray-50 p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {appointment.patientName}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {appointment.reason}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {appointmentDate.format(
                              "ddd, D MMM YYYY"
                            )}
                          </p>
                          {appointment.patientPhone && (
                            <p className="text-xs text-gray-500 truncate">
                              {appointment.patientPhone}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {appointment.time}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(
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
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Nueva Cita</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Paciente *
                </label>
                <Select
                  options={patientOptions}
                  value={
                    selectedPatient
                      ? {
                          value: selectedPatient.id,
                          label: `${selectedPatient.name} - ${selectedPatient.phone}`,
                        }
                      : null
                  }
                  onChange={(option) => setSelectedPatient(option)}
                  placeholder="Buscar paciente..."
                  isClearable
                  isSearchable
                  noOptionsMessage={() => "No se encontraron pacientes"}
                  loadingMessage={() => "Buscando..."}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "42px",
                      borderColor: "#d1d5db",
                      "&:hover": {
                        borderColor: "#d1d5db",
                      },
                      "&:focus-within": {
                        borderColor: "#3b82f6",
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
                      },
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "#9ca3af",
                    }),
                  }}
                />
                {selectedPatient && (
                  <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                    <p>
                      <strong>Paciente:</strong> {selectedPatient.name}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {selectedPatient.phone}
                    </p>
                    {selectedPatient.email && (
                      <p>
                        <strong>Email:</strong> {selectedPatient.email}
                      </p>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Si el paciente no existe, agrégalo primero en Pacientes
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAppointment.date}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={newAppointment.time}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <input
                  type="text"
                  required
                  value={newAppointment.reason}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="Ej: Consulta general, seguimiento, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="Información adicional (opcional)"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 pt-4">
                <button
                  type="submit"
                  disabled={
                    creating ||
                    !selectedPatient ||
                    !newAppointment.reason.trim()
                  }
                  className="w-full sm:flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {creating ? "Creando..." : "Crear Cita"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 text-sm"
                >
                  Cancelar
                </button>
              </div>

              {/* Validation message */}
              {(!selectedPatient || !newAppointment.reason.trim()) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Campos requeridos:</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    {!selectedPatient && <li>• Seleccionar un paciente</li>}
                    {!newAppointment.reason.trim() && (
                      <li>• Escribir el motivo de consulta</li>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CSS for react-big-calendar */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-toolbar {
          margin-bottom: 1rem;
        }
        .rbc-toolbar button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          margin: 0 0.25rem;
        }
        .rbc-toolbar button:hover {
          background: #e5e7eb;
        }
        .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rbc-header {
          padding: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
        }
        @media (min-width: 640px) {
          .rbc-header {
            font-size: 0.875rem;
            padding: 0.75rem;
          }
        }
        .rbc-date-cell {
          padding: 0.25rem;
        }
        .rbc-today {
          background-color: #fef3c7;
        }
        .rbc-event {
          border-radius: 0.25rem;
          padding: 0;
          font-size: 0.6rem;
          background: transparent !important;
          border: none !important;
        }
        @media (min-width: 640px) {
          .rbc-event {
            font-size: 0.75rem;
          }
        }
        .rbc-event-content {
          padding: 0;
          overflow: visible;
        }
        .rbc-show-more {
          color: #d97706;
          font-size: 0.65rem;
          font-weight: 600;
          margin-top: 2px;
        }
        @media (min-width: 640px) {
          .rbc-show-more {
            font-size: 0.75rem;
          }
        }
        .rbc-month-view .rbc-date-cell {
          min-height: 90px;
        }
        @media (min-width: 640px) {
          .rbc-month-view .rbc-date-cell {
            min-height: 100px;
          }
        }
        .rbc-month-view .rbc-event {
          margin-bottom: 2px;
        }
        .rbc-month-row {
          overflow: visible;
        }
        @media (max-width: 640px) {
          .rbc-month-view .rbc-date-cell {
            min-height: 70px;
          }
          .rbc-header {
            padding: 0.25rem;
            font-size: 0.65rem;
          }
          .rbc-time-view .rbc-time-gutter {
            width: 40px;
          }
          .rbc-time-view .rbc-time-gutter .rbc-timeslot-group {
            font-size: 0.7rem;
          }
          .rbc-time-content {
            min-height: 400px;
          }
          .rbc-date-cell {
            padding: 2px;
          }
          .rbc-date-cell button {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
