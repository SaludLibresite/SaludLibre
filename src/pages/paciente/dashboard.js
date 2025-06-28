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
} from "@heroicons/react/24/outline";

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [patientData, setPatientData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

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
          const isIncomplete = !patient.dataComplete || 
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

          // Get upcoming appointments
          const appointmentsQuery = query(
            collection(db, "appointments"),
            where("patientId", "==", patient.id),
            where("status", "==", "scheduled")
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointments = appointmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUpcomingAppointments(appointments);

          // Mock recent activity
          setRecentActivity([
            {
              id: 1,
              type: "appointment",
              title: "Cita programada",
              description: "Consulta general con Dr. García",
              date: new Date(),
              icon: CalendarIcon,
            },
            {
              id: 2,
              type: "prescription",
              title: "Nueva receta",
              description: "Medicación actualizada",
              date: new Date(Date.now() - 86400000),
              icon: DocumentTextIcon,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [currentUser, router]);

  const handleCompleteProfile = (updatedData) => {
    setPatientData(prev => ({ ...prev, ...updatedData }));
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
                  <p className="text-sm text-gray-600">Historial</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patientData.medicalHistory?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <HeartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-lg font-semibold text-green-600">Activo</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <StarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Reseñas</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
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
                            {appointment.type || "Consulta General"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.date &&
                              new Date(
                                appointment.date.toDate()
                              ).toLocaleDateString("es-ES")}
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
                          <activity.icon className="h-4 w-4 text-amber-600" />
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
