import { useRouter } from "next/router";

const DoctorsNavigation = ({ 
  filter, 
  setFilter, 
  pendingCount, 
  verifiedCount, 
  totalCount 
}) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Navigation Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => router.push("/superadmin")}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Dashboard
        </button>
        <button
          onClick={() => router.push("/superadmin/specialties")}
          className="inline-flex items-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all duration-200 font-medium"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Especialidades
        </button>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Ver Sitio
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-4 text-center transition-all duration-200 ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="font-semibold text-lg">{totalCount}</div>
            <div className="text-sm opacity-80">Todos</div>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-6 py-4 text-center transition-all duration-200 ${
              filter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="font-semibold text-lg">{pendingCount}</div>
            <div className="text-sm opacity-80">Pendientes</div>
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`px-6 py-4 text-center transition-all duration-200 ${
              filter === "verified"
                ? "bg-emerald-600 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="font-semibold text-lg">{verifiedCount}</div>
            <div className="text-sm opacity-80">Verificados</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorsNavigation;
