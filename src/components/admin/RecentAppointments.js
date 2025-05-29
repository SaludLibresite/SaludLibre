import { appointments } from "../../data/adminData";
import { ClockIcon, UserIcon } from "@heroicons/react/24/outline";

export default function RecentAppointments() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Citas Recientes</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {appointments.slice(0, 5).map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {appointment.patientName}
                </p>
                <p className="text-sm text-gray-500">{appointment.type}</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                {appointment.time}
              </div>
              <div
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appointment.status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : appointment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {appointment.status === "scheduled"
                  ? "programada"
                  : appointment.status === "completed"
                  ? "completada"
                  : appointment.status}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas las citas
          </button>
        </div>
      </div>
    </div>
  );
}
