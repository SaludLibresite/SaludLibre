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
import { videoConsultationService } from "../../lib/videoConsultationService";
import { removeDoctorTitle, getDoctorTitle } from "../../lib/dataUtils";
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
  VideoCameraIcon,
  PlayCircleIcon,
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
  const [videoConsultations, setVideoConsultations] = useState([]);
  const [activeVideoConsultations, setActiveVideoConsultations] = useState([]);
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
          
          // Load video consultations
          await loadVideoConsultations(patient.id);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [currentUser, router]);

  const loadVideoConsultations = async (patientId) => {
    try {
      // Obtener todas las videoconsultas del paciente
      const allRooms = await videoConsultationService.getPatientRooms(patientId);
      
      // Enriquecer con información del doctor
      const enrichedRooms = await Promise.all(
        allRooms.map(async (room) => {
          try {
            if (room.doctorId) {
              const doctorDoc = await getDoc(doc(db, "doctors", room.doctorId));
              if (doctorDoc.exists()) {
                const doctorData = doctorDoc.data();
                return {
                  ...room,
                  doctorName: doctorData.nombre || 'Doctor'
                };
              }
            }
            return room;
          } catch (error) {
            console.error('Error enriching room with doctor data:', error);
            return room;
          }
        })
      );
      
      setVideoConsultations(enrichedRooms);

      // Filtrar las videoconsultas activas (scheduled o active)
      const activeRooms = enrichedRooms.filter(room => 
        ['scheduled', 'active'].includes(room.status)
      );
      setActiveVideoConsultations(activeRooms);

      console.log('Video consultations loaded:', {
        total: enrichedRooms.length,
        active: activeRooms.length
      });
    } catch (error) {
      console.error("Error loading video consultations:", error);
    }
  };

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
          )} con ${(() => {
            if (appointment.doctorName) {
              const cleanName = removeDoctorTitle(appointment.doctorName);
              return `${getDoctorTitle(appointment.doctorGender)} ${cleanName}`;
            }
            return "Nombre no disponible";
          })()}`;
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

  const getDoctorTitle = (gender) => {
    if (!gender) return "Dr.";

    // Normalize gender to lowercase for comparison
    const normalizedGender = gender.toLowerCase().trim();

    switch (normalizedGender) {
      case "femenino":
      case "female":
      case "f":
      case "mujer":
      case "woman":
      case "w":
        return "Dra.";
      case "masculino":
      case "male":
      case "m":
      case "hombre":
      case "man":
        return "Dr.";
      default:
        // If gender is not clearly identified, try to infer from name patterns
        // This is a fallback for cases where gender data might be missing
        return "Dr.";
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

  const handleJoinVideoConsultation = (room) => {
    // Redirigir a la página de videoconsulta para pacientes con el nombre del paciente
    const patientName = encodeURIComponent(patientData.name || 'Paciente');
    const patientEmail = encodeURIComponent(patientData.email || currentUser?.email || '');
    router.push(`/video/join/${room.roomName}?patientName=${patientName}&patientEmail=${patientEmail}&fromPanel=true`);
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
  const completedVideoConsultations = videoConsultations.filter(
    (v) => v.status === "completed"
  ).length;

  // Debug statistics
  console.log("Dashboard Statistics:", {
    total: appointments.length,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments,
    pending: pendingAppointments,
    cancelled: cancelledAppointments,
    videoConsultations: videoConsultations.length,
    activeVideoConsultations: activeVideoConsultations.length,
    completedVideoConsultations: completedVideoConsultations,
    appointmentsData: appointments.map((a) => ({
      id: a.id,
      status: a.status,
      date: a.date,
    })),
  });

  return (
    <ProtectedPatientRoute>
      <PatientLayout>
        <div className="w-full max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    ¡Bienvenido, {patientData.name}!
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Gestiona tu salud de manera integral desde un solo lugar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-amber-100 rounded-lg flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div className="w-full">
                  <p className="text-xs sm:text-sm text-gray-600 leading-tight">Próximas Citas</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {upcomingAppointments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="w-full">
                  <p className="text-xs sm:text-sm text-gray-600 leading-tight">Completadas</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {completedAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-yellow-100 rounded-lg flex-shrink-0">
                  <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="w-full">
                  <p className="text-xs sm:text-sm text-gray-600 leading-tight">Pendientes</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {pendingAppointments}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-purple-100 rounded-lg flex-shrink-0">
                  <VideoCameraIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="w-full">
                  <p className="text-xs sm:text-sm text-gray-600 leading-tight">Video Consultas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedVideoConsultations}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => router.push("/paciente/appointments")}
                    className="w-full flex items-center p-3 sm:p-3.5 text-left bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 hover:border-amber-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="p-2 bg-amber-500 rounded-lg mr-3 shadow-sm flex-shrink-0">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                        Agendar Cita
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-tight mt-0.5">
                        Programa una nueva consulta
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/profile")}
                    className="w-full flex items-center p-3 sm:p-3.5 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="p-2 bg-blue-500 rounded-lg mr-3 shadow-sm flex-shrink-0">
                      <UserCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                        Ver Perfil
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-tight mt-0.5">
                        Actualiza tu información
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/medical-records")}
                    className="w-full flex items-center p-3 sm:p-3.5 text-left bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 hover:border-green-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="p-2 bg-green-500 rounded-lg mr-3 shadow-sm flex-shrink-0">
                      <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                        Historial Médico
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-tight mt-0.5">
                        Ver registros y archivos
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/paciente/reviews")}
                    className="w-full flex items-center p-3 sm:p-3.5 text-left bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200 hover:border-purple-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="p-2 bg-purple-500 rounded-lg mr-3 shadow-sm flex-shrink-0">
                      <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                        Dejar Reseña
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 leading-tight mt-0.5">
                        Califica tu experiencia
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Doctor Info */}
              {doctorData && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 lg:p-6 mt-4 sm:mt-5 lg:mt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Tu Doctor
                  </h3>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-white">
                        {doctorData.nombre
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "DR"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                        {doctorData.nombre}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {doctorData.especialidad}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doctorData.ubicacion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity & Upcoming */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Próximas Citas
                  </h3>
                  <button
                    onClick={() => router.push("/paciente/appointments")}
                    className="text-amber-600 hover:text-amber-700 text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    Ver todas
                  </button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {getAppointmentTypeText(appointment.type)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">
                            {appointment.doctorName
                              ? (() => {
                                  const cleanName = removeDoctorTitle(appointment.doctorName);
                                  return `${getDoctorTitle(appointment.doctorGender)} ${cleanName}`;
                                })()
                              : "Nombre no disponible"
                            }
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
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
                        <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-500 mb-3">
                      No tienes citas programadas
                    </p>
                    <button
                      onClick={() => router.push("/paciente/appointments")}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm sm:text-base"
                    >
                      Agendar Primera Cita
                    </button>
                  </div>
                )}
              </div>

              {/* Video Consultations */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <VideoCameraIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                    Video Consultas
                  </h3>
                  {activeVideoConsultations.length > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                      {activeVideoConsultations.length} activa{activeVideoConsultations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {activeVideoConsultations.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {activeVideoConsultations.map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <VideoCameraIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                              Consulta con {room.doctorName
                                ? (() => {
                                    const cleanName = removeDoctorTitle(room.doctorName);
                                    return `${getDoctorTitle(room.doctorGender)} ${cleanName}`;
                                  })()
                                : 'Doctor'
                              }
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">
                              {room.consultationType === 'general' ? 'Consulta General' : 
                               room.consultationType === 'followup' ? 'Seguimiento' :
                               room.consultationType === 'specialist' ? 'Especializada' :
                               'Consulta'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {room.scheduledTime ? (
                                room.scheduledTime.toDate ? 
                                  room.scheduledTime.toDate().toLocaleString('es-ES') :
                                  new Date(room.scheduledTime).toLocaleString('es-ES')
                              ) : 'Inmediata'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center text-xs text-green-600 flex-1 sm:flex-initial">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse flex-shrink-0"></div>
                            <span className="truncate">{room.status === 'active' ? 'En progreso' : 'Programada'}</span>
                          </div>
                          <button
                            onClick={() => handleJoinVideoConsultation(room)}
                            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                          >
                            <PlayCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Acceso directo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <VideoCameraIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-500 mb-2 sm:mb-3">
                      No tienes videoconsultas activas
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Las videoconsultas aparecerán aquí cuando tu doctor las programe
                    </p>
                  </div>
                )}
                
                {/* Información adicional */}
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Acceso directo:</strong> Desde aquí puedes unirte automáticamente sin ingresar tu nombre. 
                    El doctor también puede compartir un enlace directo para casos especiales.
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Actividad Reciente
                </h3>

                {recentActivity.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2 sm:gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <activity.icon
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${getStatusColor(
                              activity.type === "cancellation"
                                ? "cancelled"
                                : "scheduled"
                            )}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {activity.title}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {activity.description}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                          {activity.date.toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <ChartBarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-500">No hay actividad reciente</p>
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
