import { useState, useEffect } from "react";
import { CalendarIcon, CheckCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getRecentAppointments } from "../../lib/appointmentsService";
import { getPatientById } from "../../lib/patientsService";

export default function RecentAppointments() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadRecentAppointments();
    }
  }, [currentUser]);

  const loadRecentAppointments = async () => {
    try {
      setLoading(true);
      const doctorData = await getDoctorByUserId(currentUser.uid);
      if (!doctorData) return;

      const recentAppointments = await getRecentAppointments(doctorData.id);
      
      // Enrich appointments with patient data
      const enrichedAppointments = await Promise.all(
        recentAppointments.slice(0, 5).map(async (appointment) => {
          try {
            const patient = await getPatientById(appointment.patientId);
            return {
              ...appointment,
              patientData: patient || {
                name: 'Paciente no encontrado',
                email: 'N/A',
                phone: 'N/A'
              },
            };
          } catch (error) {
            console.error("Error loading patient data:", error);
            return {
              ...appointment,
              patientData: {
                name: 'Error al cargar paciente',
                email: 'N/A',
                phone: 'N/A'
              },
            };
          }
        })
      );

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error("Error loading recent appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const appointmentDate = date?.toDate ? date.toDate() : new Date(date);
    return appointmentDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (time) => {
    return time || "No especificado";
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Citas Recientes
          </h3>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay citas recientes
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Las citas completadas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.patientData?.name || "Paciente no encontrado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.reason || "Consulta general"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(appointment.date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTime(appointment.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
