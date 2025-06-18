import {
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function DashboardStats() {
  // Estadísticas reales - inicialmente vacías
  const stats = [
    {
      title: "Total de Pacientes",
      value: "0",
      change: "0%",
      changeType: "neutral",
      icon: UserGroupIcon,
      color: "amber",
    },
    {
      title: "Citas de Hoy",
      value: "0",
      change: "0",
      changeType: "neutral",
      icon: CalendarIcon,
      color: "yellow",
    },
    {
      title: "Esta Semana",
      value: "0",
      change: "0",
      changeType: "neutral",
      icon: ClockIcon,
      color: "orange",
    },
    {
      title: "Ingresos",
      value: "$0",
      change: "0%",
      changeType: "neutral",
      icon: CurrencyDollarIcon,
      color: "amber",
    },
  ];

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
                  Sin datos del mes anterior
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
