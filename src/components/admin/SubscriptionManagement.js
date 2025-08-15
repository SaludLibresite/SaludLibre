import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getActiveSubscriptionPlans,
  getUserSubscription,
  isSubscriptionActive,
  getSubscriptionDaysRemaining,
} from "../../lib/subscriptionsService";
import { createPaymentPreference } from "../../lib/mercadopagoService";
import {
  CheckIcon,
  StarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function SubscriptionManagement() {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activePlans, userSubscription] = await Promise.all([
        getActiveSubscriptionPlans(),
        getUserSubscription(currentUser.uid),
      ]);
      setPlans(activePlans);
      setCurrentSubscription(userSubscription);
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setProcessingPayment(plan.id);

      const subscriptionData = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        userId: currentUser.uid,
        userEmail: currentUser.email,
      };

      const preference = await createPaymentPreference(subscriptionData);

      // Redirigir a MercadoPago
      if (preference.initPoint) {
        window.location.href = preference.initPoint;
      } else {
        alert("Error al procesar el pago. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Error al procesar la suscripción. Intenta nuevamente.");
    } finally {
      setProcessingPayment(null);
    }
  };

  const isActive = isSubscriptionActive(currentSubscription);
  const daysRemaining = getSubscriptionDaysRemaining(currentSubscription);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="mb-8">
          <div
            className={`rounded-lg p-6 ${
              isActive
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {isActive ? "Suscripción Activa" : "Suscripción Vencida"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Plan: {currentSubscription.planName} - $
                  {currentSubscription.price}/mes
                </p>
                {isActive && (
                  <p className="text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    {daysRemaining} días restantes
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {currentSubscription.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {currentSubscription && isActive
              ? "Cambiar Plan de Suscripción"
              : "Elige tu Plan de Suscripción"}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Selecciona el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-8 ${
                plan.isPopular
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              } shadow-lg hover:shadow-xl transition-shadow`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <StarIcon className="h-4 w-4 mr-1" />
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features?.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    processingPayment === plan.id ||
                    (currentSubscription?.planId === plan.id && isActive)
                  }
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    currentSubscription?.planId === plan.id && isActive
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : plan.isPopular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {processingPayment === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : currentSubscription?.planId === plan.id && isActive ? (
                    "Plan Actual"
                  ) : (
                    `Suscribirse por $${plan.price}/mes`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Comparación de Características
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Característica</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-4">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Perfil profesional</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-4">
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Gestión de citas</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-4">
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Video consultas</td>
                {plans.map((plan, index) => (
                  <td key={plan.id} className="text-center py-3 px-4">
                    {index === 0 ? (
                      <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                    ) : (
                      <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">Estadísticas avanzadas</td>
                {plans.map((plan, index) => (
                  <td key={plan.id} className="text-center py-3 px-4">
                    {index < 2 ? (
                      <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                    ) : (
                      <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Preguntas Frecuentes
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">¿Puedo cambiar de plan?</h4>
            <p className="text-gray-600 mt-1">
              Sí, puedes cambiar tu plan en cualquier momento. Los cambios se
              reflejarán en tu próximo ciclo de facturación.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">¿Cómo funciona la facturación?</h4>
            <p className="text-gray-600 mt-1">
              La facturación es mensual y se renueva automáticamente. Puedes
              cancelar en cualquier momento sin penalización.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">¿Qué métodos de pago aceptan?</h4>
            <p className="text-gray-600 mt-1">
              Aceptamos todas las tarjetas de crédito y débito principales a
              través de MercadoPago, así como transferencias bancarias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
