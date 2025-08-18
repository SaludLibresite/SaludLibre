import { useRouter } from "next/router";

const DoctorsPageHeader = ({ onOpenBulkSubscription }) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Doctores
          </h1>
          <p className="text-gray-600">
            Administra y verifica los perfiles de doctores registrados
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-gray-500 text-right mb-2">
            Herramientas Administrativas
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onOpenBulkSubscription}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ⚡ Activación Manual
            </button>
            <button
              onClick={() => router.push("/superadmin/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📊 Ver Suscripciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsPageHeader;
