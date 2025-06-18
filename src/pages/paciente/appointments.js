import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PatientLayout from "../../components/paciente/PatientLayout";
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function PatientAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, cancelled
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  useEffect(() => {
    // Mock appointments data
    setAppointments([
      {
        id: 1,
        date: new Date(Date.now() + 86400000 * 3), // 3 days from now
        time: "10:00",
        doctor: "Dr. María García",
        specialty: "Cardiología",
        type: "Consulta General",
        status: "scheduled",
        location: "Consultorio 3B",
        notes: "Control de rutina",
      },
      {
        id: 2,
        date: new Date(Date.now() + 86400000 * 7), // 7 days from now
        time: "15:30",
        doctor: "Dr. Juan Pérez",
        specialty: "Dermatología",
        type: "Consulta Especializada",
        status: "scheduled",
        location: "Consultorio 1A",
        notes: "Revisión de lunares",
      },
      {
        id: 3,
        date: new Date(Date.now() - 86400000 * 15), // 15 days ago
        time: "09:00",
        doctor: "Dr. Ana López",
        specialty: "Medicina General",
        type: "Consulta General",
        status: "completed",
        location: "Consultorio 2C",
        notes: "Chequeo anual completo",
      },
    ]);
    setLoading(false);
  }, []);

  const filteredAppointments = appointments.filter((appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);

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
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
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
      default:
        return "Pendiente";
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
                <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
                <p className="text-gray-600">
                  Gestiona todas tus citas médicas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewAppointmentModal(true)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Cita
            </button>
          </div>
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
                        {appointment.doctor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {appointment.doctor}
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
                            {appointment.date.toLocaleDateString("es-ES", {
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
                          <MapPinIcon className="h-4 w-4 mr-2 text-amber-600" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.type} - {appointment.specialty}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(appointment.status)}
                    {appointment.status === "scheduled" && (
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors">
                          Reprogramar
                        </button>
                        <button className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    )}
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

        {/* Mock Modal for New Appointment */}
        {showNewAppointmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Funcionalidad Próximamente
                </h3>
                <p className="text-gray-600 mb-6">
                  El sistema de reserva de citas estará disponible muy pronto.
                </p>
                <button
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-2 rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
