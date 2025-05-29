import { dashboardStats } from "../../data/adminData";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
  "Total de Pacientes": UserGroupIcon,
  "Citas de Hoy": CalendarIcon,
  "Esta Semana": ClockIcon,
  Ingresos: CurrencyDollarIcon,
};

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardStats.map((stat, index) => {
        const Icon = iconMap[stat.title] || UserGroupIcon;
        const isIncrease = stat.changeType === "increase";

        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {isIncrease ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`ml-1 text-sm font-medium ${
                  isIncrease ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="ml-1 text-sm text-gray-500">del mes pasado</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
