import React from "react";
import { LockClosedIcon, StarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubscriptionRestriction({ 
  feature, 
  showUpgradeButton = true,
  className = "" 
}) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="bg-yellow-100 rounded-full p-3">
          <LockClosedIcon className="h-8 w-8 text-yellow-600" />
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Función Premium
      </h3>
      
      <p className="text-gray-600 mb-4">
        {feature ? `${feature} está` : "Esta función está"} disponible solo para 
        usuarios con suscripción activa.
      </p>

      <div className="space-y-3">
        <div className="text-sm text-gray-500">
          <p className="font-medium mb-2">Con una suscripción obtienes:</p>
          <ul className="space-y-1">
            <li className="flex items-center justify-center">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
              Acceso completo a todas las funciones
            </li>
            <li className="flex items-center justify-center">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
              Gestión ilimitada de pacientes
            </li>
            <li className="flex items-center justify-center">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
              Video consultas
            </li>
            <li className="flex items-center justify-center">
              <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
              Reportes y estadísticas
            </li>
          </ul>
        </div>

        {showUpgradeButton && (
          <div className="pt-4">
            <Link
              href="/admin/subscription"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Actualizar Suscripción
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
