import React from "react";
import { useRouter } from "next/router";
import { XCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubscriptionFailure() {
  const router = useRouter();
  const { payment_id, payment_status, status_detail } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pago Rechazado
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No pudimos procesar tu pago. Por favor, intenta nuevamente.
          </p>
        </div>

        {status_detail && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h4 className="text-sm font-medium text-red-900 mb-2">
              Motivo del rechazo:
            </h4>
            <p className="text-sm text-red-800">
              {status_detail === "cc_rejected_insufficient_amount" &&
                "Fondos insuficientes"}
              {status_detail === "cc_rejected_bad_filled_card_number" &&
                "Número de tarjeta incorrecto"}
              {status_detail === "cc_rejected_bad_filled_date" &&
                "Fecha de vencimiento incorrecta"}
              {status_detail === "cc_rejected_bad_filled_security_code" &&
                "Código de seguridad incorrecto"}
              {status_detail === "cc_rejected_high_risk" &&
                "Pago rechazado por seguridad"}
              {!status_detail.includes("cc_rejected") &&
                "Error en el procesamiento del pago"}
            </p>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ¿Qué puedes hacer?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Verifica los datos de tu tarjeta</li>
            <li>• Asegúrate de tener fondos suficientes</li>
            <li>• Intenta con otro método de pago</li>
            <li>• Contacta a tu banco si el problema persiste</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/subscription"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Intentar Nuevamente
          </Link>
          <Link
            href="/admin"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda?{" "}
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
