import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function UpcomingAppointments() {
  // No hay próximas citas
  const appointments = [];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Próximas Citas
          </h3>
        </div>
      </div>
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <ClockIcon className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay próximas citas
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Las citas programadas aparecerán aquí.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Programar Cita
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Las citas se mostrarían aquí cuando existan */}
          </div>
        )}
      </div>
    </div>
  );
}
