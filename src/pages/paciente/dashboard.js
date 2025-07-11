import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import PatientLayout from "../../components/paciente/PatientLayout";
import ProtectedPatientRoute from "../../components/paciente/ProtectedPatientRoute";
import CompleteProfileModal from "../../components/paciente/CompleteProfileModal";
import { getAppointmentsByPatientId } from "../../lib/appointmentsService";
import {
  UserCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ChartBarIcon,
  PlusIcon,
  StarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [patientData, setPatientData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showCompleteProfileModal, setShowCompleteProfileModal] =
    useState(false);

  useEffect(() => {
    async function loadPatientData() {
      if (!currentUser) {
        router.push("/paciente/login");
        return;
      }

      try {
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

          // Check if profile is incomplete
          const isIncomplete =
            !patient.dataComplete ||
            !patient.phone ||
            !patient.dateOfBirth ||
            !patient.gender ||
            !patient.address ||
            !patient.emergencyContact ||
            !patient.emergencyPhone;

          if (isIncomplete) {
            setShowCompleteProfileModal(true);
          }

          // Get doctor data
          if (patient.doctorId) {
            const doctorDoc = await getDoc(
              doc(db, "doctors", patient.doctorId)
            );
            if (doctorDoc.exists()) {
              setDoctorData({ id: doctorDoc.id, ...doctorDoc.data() });
            }
          }

          // Load appointments using the service
          await loadAppointments(patient.id);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [currentUser, router]);

  const loadAppointments = async (patientId) => {
    try {
      const appointmentsList = await getAppointmentsByPatientId(patientId);
      console.log("Loaded appointments:", appointmentsList);
      setAppointments(appointmentsList);

      // Filter upcoming appointments
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      const upcoming = appointmentsList.filter((appointment) => {
        const appointmentDate = appointment.date?.toDate
          ? appointment.date.toDate()
          : new Date(appointment.date);

        console.log(`Appointment ${appointment.id}:`, {
          date: appointmentDate,
          status: appointment.status,
          isAfterToday: appointmentDate >= now,
          isScheduled: appointment.status === "scheduled",
        });

        return appointmentDate >= now && appointment.status === "scheduled";
      });

      console.log("Upcoming appointments:", upcoming);
      setUpcomingAppointments(upcoming);

      // Generate recent activity from appointments
      const activities = appointmentsList
        .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA; // Most recent first
        })
        .slice(0, 5)
        .map((appointment) => {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          let activityType = "appointment";
          let title = "Cita programada";
          let description = `${getAppointmentTypeText(
            appointment.type
          )} con Dr. ${appointment.doctorName || "Nombre no disponible"}`;
          let icon = CalendarIcon;

          if (appointment.status === "completed") {
            title = "Cita completada";
            icon = CheckCircleIcon;
          } else if (appointment.status === "cancelled") {
            title = "Cita cancelada";
            icon = XCircleIcon;
            activityType = "cancellation";
          } else if (appointment.status === "pending") {
            title = "Cita solicitada";
            icon = ClockIcon;
            description = `Solicitud de ${getAppointmentTypeText(
              appointment.type
            )} pendiente de aprobación`;
          }

          return {
            id: appointment.id + "_activity",
            type: activityType,
            title,
            description,
            date: appointmentDate,
            icon,
          };
        });

      console.log("Recent activities:", activities);
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error loading appointments:", error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "completed":
        return "text-blue-600";
      case "cancelled":
        return "text-red-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleCompleteProfile = (updatedData) => {
    setPatientData((prev) => ({ ...prev, ...updatedData }));
    setShowCompleteProfileModal(false);
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!patientData) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron datos del paciente
            </h1>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la información de su cuenta.
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // Calculate statistics
  const completedAppointments = appointments.filter(
    (a) => a.status === "completed"
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled"
  ).length;
  const pendingAppointments = appointments.filter(
    (a) => a.status === "pending"
  ).length;

  // Debug statistics
  console.log("Dashboard Statistics:", {
    total: appointments.length,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments,
    pending: pendingAppointments,
    cancelled: cancelledAppointments,
    appointmentsData: appointments.map((a) => ({
      id: a.id,
      status: a.status,
      date: a.date,
    })),
  });

  return (
    <ProtectedPatientRoute>
      <PatientLayout>
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-6">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mr-6 shadow-lg">
                  <UserCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    ¡Bienvenido, {patientData.name}!
                  </h1>
                  <p className="text-gray-600">
                    Gestiona tu salud de manera integral desde un solo lugar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Próximas Citas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {upcomingAppointments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <StarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Citas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/paciente/appointments")}
                    className="w-full flex items-center p-3 text-left bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-200"
                  >
                    <CalendarIcon className="h-5 w-5 text-amber-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Agendar Cita
                      </div>
                      <div className="text-sm text-gray-600">
                        Programa una nueva consulta
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/profile")}
                    className="w-full flex items-center p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  >
                    <UserCircleIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Ver Perfil
                      </div>
                      <div className="text-sm text-gray-600">
                        Actualiza tu información
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/medical-records")}
                    className="w-full flex items-center p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Historial Médico
                      </div>
                      <div className="text-sm text-gray-600">
                        Ver registros y archivos
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/reviews")}
                    className="w-full flex items-center p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                  >
                    <StarIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Dejar Reseña
                      </div>
                      <div className="text-sm text-gray-600">
                        Califica tu experiencia
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Doctor Info */}
              {doctorData && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tu Doctor
                  </h3>
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mr-4">
                      <span className="text-lg font-bold text-white">
                        {doctorData.nombre
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "DR"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {doctorData.nombre}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {doctorData.especialidad}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {doctorData.ubicacion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity & Upcoming */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Próximas Citas
                  </h3>
                  <button
                    onClick={() => router.push("/paciente/appointments")}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <CalendarIcon className="h-5 w-5 text-amber-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getAppointmentTypeText(appointment.type)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Dr.{" "}
                            {appointment.doctorName || "Nombre no disponible"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(appointment.date?.toDate
                              ? appointment.date.toDate()
                              : new Date(appointment.date)
                            ).toLocaleDateString("es-ES", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            - {appointment.time}
                          </div>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">
                      No tienes citas programadas
                    </p>
                    <button
                      onClick={() => router.push("/paciente/appointments")}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Agendar Primera Cita
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actividad Reciente
                </h3>

                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="p-2 bg-amber-100 rounded-lg mr-3">
                          <activity.icon
                            className={`h-4 w-4 ${getStatusColor(
                              activity.type === "cancellation"
                                ? "cancelled"
                                : "scheduled"
                            )}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {activity.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {activity.description}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete Profile Modal */}
        <CompleteProfileModal
          isOpen={showCompleteProfileModal}
          patientData={patientData}
          onClose={() => setShowCompleteProfileModal(false)}
          onComplete={handleCompleteProfile}
        />
      </PatientLayout>
    </ProtectedPatientRoute>
  );
}
