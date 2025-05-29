import { appointments } from "../../data/adminData";
import { CalendarIcon, UserIcon } from "@heroicons/react/24/outline";

export default function UpcomingAppointments() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Próximas Citas</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {appointment.patientName}
                </p>
                <p className="text-sm text-gray-500">{appointment.type}</p>
                <p className="text-xs text-gray-400">{appointment.notes}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {appointment.date}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {appointment.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas las próximas
          </button>
        </div>
      </div>
    </div>
  );
}
