import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { getUserSubscription } from "../../lib/subscriptionsService";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (currentUser) {
      // Dar tiempo para que el webhook procese el pago
      setTimeout(() => {
        loadSubscription();
      }, 2000);
    }
  }, [currentUser]);

  const loadSubscription = async () => {
    try {
      const userSubscription = await getUserSubscription(currentUser.uid);
      setSubscription(userSubscription);
      
      // Si no encuentra la suscripción o está pending, intentar de nuevo en unos segundos
      if (!userSubscription || userSubscription.status === 'pending') {
        setTimeout(() => {
          loadSubscription();
        }, 3000);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando tu suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ¡Pago Exitoso!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu suscripción ha sido activada correctamente
          </p>
        </div>

        {subscription && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalles de tu Suscripción
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{subscription.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio:</span>
                <span className="font-medium">${subscription.price}/mes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-green-600">
                  {subscription.status}
                </span>
              </div>
              {subscription.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expira:</span>
                  <span className="font-medium">
                    {subscription.expiresAt.toDate?.()?.toLocaleDateString() ||
                      new Date(subscription.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ¿Qué sigue ahora?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Accede a todas las funciones de tu plan</li>
            <li>• Configura tu perfil profesional</li>
            <li>• Comienza a recibir pacientes</li>
            <li>• Gestiona tus citas y horarios</li>
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
