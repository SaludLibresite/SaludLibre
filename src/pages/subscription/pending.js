import React from "react";
import { useRouter } from "next/router";
import { ClockIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubscriptionPending() {
  const router = useRouter();
  const { payment_id } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pago Pendiente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu pago está siendo procesado. Te notificaremos cuando esté listo.
          </p>
        </div>

        {payment_id && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">
              ID de Pago:
            </h4>
            <p className="text-sm text-yellow-800 font-mono">{payment_id}</p>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ¿Qué significa esto?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tu pago está siendo verificado</li>
            <li>• Puede tomar hasta 24 horas hábiles</li>
            <li>• Recibirás un email cuando se complete</li>
            <li>• Tu suscripción se activará automáticamente</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Mientras tanto...
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Puedes acceder con funciones limitadas</li>
            <li>• Completa tu perfil profesional</li>
            <li>• Revisa la configuración de tu cuenta</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/admin/profile"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Configurar Perfil
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            ¿Tienes dudas?{" "}
            <a
              href="mailto:soporte@medicos-ar.com"
              className="text-blue-600 hover:text-blue-500"
            >
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
