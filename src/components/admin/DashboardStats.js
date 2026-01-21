import { useState, useEffect } from "react";
import {
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getPatientsByDoctorId } from "../../lib/patientsService";
import { getAppointmentsByDoctorId } from "../../lib/appointmentsService";

export default function DashboardStats() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState([
    {
      title: "Total de Pacientes",
      value: "0",
      change: "Sin datos del mes anterior",
      changeType: "neutral",
      icon: UserGroupIcon,
      color: "amber",
    },
    {
      title: "Citas de Hoy",
      value: "0",
      change: "Sin datos del mes anterior",
      changeType: "neutral",
      icon: CalendarIcon,
      color: "yellow",
    },
    {
      title: "Esta Semana",
      value: "0",
      change: "Sin datos del mes anterior",
      changeType: "neutral",
      icon: ClockIcon,
      color: "orange",
    },
    {
      title: "Ingresos",
      value: "$0",
      change: "Sin datos del mes anterior",
      changeType: "neutral",
      icon: CurrencyDollarIcon,
      color: "amber",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDoctorStats();
    }
  }, [currentUser]);

  const loadDoctorStats = async () => {
    try {
      setLoading(true);
      
      // Get doctor data
      const doctorData = await getDoctorByUserId(currentUser.uid);
      if (!doctorData) {
        console.log("No se encontró el doctor");
        setLoading(false);
        return;
      }

      // Get patients (with error handling)
      let patients = [];
      try {
        patients = await getPatientsByDoctorId(doctorData.id);
      } catch (error) {
        console.error("Error loading patients:", error);
        patients = [];
      }
      
      // Get appointments (with error handling)
      let appointments = [];
      try {
        appointments = await getAppointmentsByDoctorId(doctorData.id);
      } catch (error) {
        console.error("Error loading appointments:", error);
        appointments = [];
      }
      
      // Calculate today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.date?.toDate 
          ? appointment.date.toDate() 
          : new Date(appointment.date);
        return appointmentDate >= today && 
               appointmentDate < tomorrow && 
               appointment.status !== 'cancelled';
      });

      // Calculate this week's appointments
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
      startOfWeek.setDate(today.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const thisWeekAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.date?.toDate 
          ? appointment.date.toDate() 
          : new Date(appointment.date);
        return appointmentDate >= startOfWeek && 
               appointmentDate < endOfWeek && 
               appointment.status !== 'cancelled';
      });

      // Calculate revenue (simplified - could be enhanced)
      const completedAppointments = appointments.filter(app => app.status === 'completed');
      const estimatedRevenue = completedAppointments.length * (doctorData.consultationFee || 50000); // Fallback fee
      
      // Update stats
      setStats([
        {
          title: "Total de Pacientes",
          value: patients.length.toString(),
          change: "Sin datos del mes anterior",
          changeType: "neutral",
          icon: UserGroupIcon,
          color: "amber",
        },
        {
          title: "Citas de Hoy",
          value: todayAppointments.length.toString(),
          change: "Sin datos del mes anterior",
          changeType: "neutral",
          icon: CalendarIcon,
          color: "yellow",
        },
        {
          title: "Esta Semana",
          value: thisWeekAppointments.length.toString(),
          change: "Sin datos del mes anterior",
          changeType: "neutral",
          icon: ClockIcon,
          color: "orange",
        },
        {
          title: "Ingresos",
          value: `$${estimatedRevenue.toLocaleString('es-CO')}`,
          change: "Sin datos del mes anterior",
          changeType: "neutral",
          icon: CurrencyDollarIcon,
          color: "amber",
        },
      ]);

      console.log("Estadísticas cargadas:", {
        totalPatients: patients.length,
        todayAppointments: todayAppointments.length,
        thisWeekAppointments: thisWeekAppointments.length,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        estimatedRevenue
      });

    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case "amber":
        return {
          bg: "bg-amber-50",
          icon: "text-amber-600",
          border: "border-amber-200",
        };
      case "yellow":
        return {
          bg: "bg-yellow-50",
          icon: "text-yellow-600",
          border: "border-yellow-200",
        };
      case "orange":
        return {
          bg: "bg-orange-50",
          icon: "text-orange-600",
          border: "border-orange-200",
        };
      default:
        return {
          bg: "bg-amber-50",
          icon: "text-amber-600",
          border: "border-amber-200",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colors = getColorClasses(stat.color);

        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
          >
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="mt-4">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div
                    className={`p-3 ${colors.bg} ${colors.border} border rounded-xl shadow-sm`}
                  >
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-500">
                      {stat.change}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
