import React from "react";
import { LockClosedIcon, StarIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import AdminLayout from "./admin/AdminLayout";

// Mapeo de funcionalidades a planes requeridos
const FEATURE_REQUIREMENTS = {
  'nuevo-paciente': {
    requiredPlan: 'Plan Medium',
    planPrice: '$15,000/mes',
    description: 'Registrar nuevos pacientes'
  },
  'patients': {
    requiredPlan: 'Plan Medium', 
    planPrice: '$15,000/mes',
    description: 'Gestión completa de pacientes'
  },
  'schedule': {
    requiredPlan: 'Plan Medium',
    planPrice: '$15,000/mes',
    description: 'Configurar horarios de atención'
  },
  'appointments': {
    requiredPlan: 'Plan Medium',
    planPrice: '$15,000/mes',
    description: 'Administrar citas y agenda'
  },
  'reviews': {
    requiredPlan: 'Plan Medium',
    planPrice: '$15,000/mes',
    description: 'Sistema de reseñas y testimonios'
  },
  'video-consultation': {
    requiredPlan: 'Plan Plus',
    planPrice: '$25,000/mes',
    description: 'Video consultas ilimitadas'
  }
};

export default function SubscriptionRestriction({ 
  feature, 
  showUpgradeButton = true,
  className = "" 
}) {
  const router = useRouter();
  const featureInfo = FEATURE_REQUIREMENTS[feature] || {
    requiredPlan: 'Plan Medium',
    description: 'Esta funcionalidad'
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header con botón volver */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
        </div>

        {/* Contenido de restricción */}
        <div className="max-w-2xl mx-auto">
          <div className={`bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 text-center shadow-lg ${className}`}>
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full p-4 shadow-md">
                <LockClosedIcon className="h-12 w-12 text-yellow-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Función Premium
            </h2>
            
            <p className="text-lg text-gray-700 mb-2">
              <span className="font-semibold">{featureInfo.description}</span>
            </p>
            
            <p className="text-gray-600 mb-6">
              Esta funcionalidad requiere el <span className="font-semibold text-blue-600">{featureInfo.requiredPlan}</span>.
            </p>

            {/* Beneficios del plan */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Con el {featureInfo.requiredPlan} obtienes:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {feature === 'video-consultation' ? (
                  // Beneficios específicos del Plan Plus
                  <>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Agenda</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Video consultas ilimitadas</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Salas virtuales personalizadas</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Reseñas</span>
                    </div>
                  </>
                ) : (
                  // Beneficios del Plan Medium
                  <>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Todo lo del Plan Free</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Configurar horarios de atención</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Registrar nuevos pacientes</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Gestión completa de pacientes</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Administrar citas y agenda</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Sistema de reseñas</span>
                    </div>
                    <div className="flex items-start">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Reportes y estadísticas</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            {showUpgradeButton && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/admin/subscription"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Ver Planes y Precios
                </Link>
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Volver Atrás
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
