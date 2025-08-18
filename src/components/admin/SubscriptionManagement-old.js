import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorById } from "../../lib/doctorsService";
import { getActiveSubscriptionPlans } from "../../lib/subscriptionsService";
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
  const [doctor, setDoctor] = useState(null);
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
      const [activePlans, doctorData] = await Promise.all([
        getActiveSubscriptionPlans(),
        getDoctorById(currentUser.uid),
      ]);
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Current doctor data:", doctorData);
        console.log("User ID:", currentUser.uid);
      }
      
      setPlans(activePlans);
      setDoctor(doctorData);
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad para verificar el estado de la suscripción
  const isSubscriptionActive = () => {
    if (!doctor || !doctor.subscriptionStatus) return false;
    if (doctor.subscriptionStatus !== 'active') return false;
    if (!doctor.subscriptionExpiresAt) return false;
    
    const expirationDate = doctor.subscriptionExpiresAt.toDate ? 
      doctor.subscriptionExpiresAt.toDate() : 
      new Date(doctor.subscriptionExpiresAt);
    
    return expirationDate > new Date();
  };

  const getSubscriptionDaysRemaining = () => {
    if (!doctor || !doctor.subscriptionExpiresAt) return 0;
    
    const expirationDate = doctor.subscriptionExpiresAt.toDate ? 
      doctor.subscriptionExpiresAt.toDate() : 
      new Date(doctor.subscriptionExpiresAt);
    
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const handleSubscribe = async (plan) => {
    try {
      setProcessingPayment(plan.id);

      // Si es un plan gratuito (precio = 0), activarlo directamente
      if (plan.price === 0 || plan.price === undefined) {
        await handleFreePlan(plan);
        return;
      }

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

  const handleFreePlan = async (plan) => {
    try {
      // Crear suscripción gratuita directamente
      const response = await fetch('/api/subscriptions/create-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          userId: currentUser.uid,
          userEmail: currentUser.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al activar el plan gratuito');
      }
      
      // Recargar los datos para mostrar la nueva suscripción
      await loadData();
      
      alert('¡Plan gratuito activado exitosamente!');
    } catch (error) {
      console.error('Error activating free plan:', error);
      throw error;
    }
  };

  const handleActivateSubscription = async () => {
    if (!currentSubscription || currentSubscription.status !== 'pending') {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          userId: currentUser.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al activar la suscripción');
      }
      
      // Recargar los datos para mostrar la suscripción actualizada
      await loadData();
      
      alert('¡Suscripción activada exitosamente!');
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert('Error al activar la suscripción: ' + error.message);
    }
  };

  const handleRenewFreeSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/renew-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al renovar la suscripción');
      }
      
      // Recargar los datos para mostrar la suscripción renovada
      await loadData();
      
      alert('¡Plan gratuito renovado por 30 días más!');
    } catch (error) {
      console.error('Error renewing free subscription:', error);
      alert('Error al renovar la suscripción: ' + error.message);
    }
  };

  const isActive = isSubscriptionActive(currentSubscription);
  const daysRemaining = getSubscriptionDaysRemaining(currentSubscription);

  if (process.env.NODE_ENV === 'development') {
    console.log("Subscription check:", {
      subscription: currentSubscription,
      isActive,
      daysRemaining,
      status: currentSubscription?.status,
      expiresAt: currentSubscription?.expiresAt
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className=" px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-12">
            <div
              className={`rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                isActive
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                  : currentSubscription.status === "pending"
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    isActive ? "bg-green-100" : 
                    currentSubscription.status === "pending" ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    {isActive ? (
                      <CheckIcon className="h-8 w-8 text-green-600" />
                    ) : currentSubscription.status === "pending" ? (
                      <ClockIcon className="h-8 w-8 text-yellow-600" />
                    ) : (
                      <XMarkIcon className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {isActive ? "🎉 Suscripción Activa" : 
                       currentSubscription.status === "pending" ? "⏳ Pago Pendiente" : 
                       "⚠️ Suscripción Vencida"}
                    </h3>
                    <p className="text-lg text-gray-700 mt-1">
                      <span className="font-semibold">{currentSubscription.planName}</span>
                      {currentSubscription.price > 0 && (
                        <span className="text-gray-600"> - ${currentSubscription.price}/mes</span>
                      )}
                    </p>
                    {currentSubscription.status === "pending" && (
                      <div className="mt-4">
                        <p className="text-sm text-yellow-700 mb-3">
                          Tu pago está siendo procesado. Una vez confirmado, tu suscripción se activará automáticamente.
                        </p>
                        <button
                          onClick={handleActivateSubscription}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Activar Manualmente
                        </button>
                      </div>
                    )}
                    {isActive && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-gray-600 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {daysRemaining} días restantes
                        </p>
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                          <div className="flex justify-between">
                            <span>Fecha de inicio:</span>
                            <span className="font-medium">
                              {currentSubscription.createdAt 
                                ? new Date(currentSubscription.createdAt.seconds * 1000).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : new Date(currentSubscription.activatedAt || Date.now()).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                              }
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>Fecha de fin:</span>
                            <span className="font-medium">
                              {currentSubscription.expiresAt 
                                ? new Date(currentSubscription.expiresAt.seconds * 1000).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : 'No disponible'
                              }
                            </span>
                          </div>
                        </div>
                        {/* Mostrar botón de renovar para plan gratuito próximo a vencer */}
                        {currentSubscription.price === 0 && daysRemaining <= 7 && (
                          <button
                            onClick={handleRenewFreeSubscription}
                            className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Renovar Plan Gratuito
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      isActive
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : currentSubscription.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {currentSubscription.status === "pending" ? "Pendiente" : currentSubscription.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            {currentSubscription && isActive
              ? "🚀 Cambia tu Plan"
              : "✨ Elige tu Plan"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Desbloquea todo el potencial de tu práctica médica con nuestros planes diseñados para profesionales
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                plan.isPopular
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white transform scale-105 shadow-2xl border-4 border-blue-300"
                  : "bg-white shadow-xl border-2 border-gray-100 hover:border-blue-200"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                    <StarIcon className="h-4 w-4 mr-2" />
                    🔥 MÁS POPULAR
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    plan.isPopular ? "bg-white/20" : "bg-blue-100"
                  }`}>
                    <span className="text-2xl">
                      {index === 0 ? "🆓" : index === 1 ? "⭐" : "💎"}
                    </span>
                  </div>
                  <h3 className={`text-3xl font-bold ${
                    plan.isPopular ? "text-white" : "text-gray-900"
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-3 text-lg ${
                    plan.isPopular ? "text-blue-100" : "text-gray-600"
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  {(plan.price === 0 || plan.price === undefined) ? (
                    <div>
                      <span className={`text-5xl font-extrabold ${
                        plan.isPopular ? "text-white" : "text-green-600"
                      }`}>
                        GRATIS
                      </span>
                      <p className={`text-sm mt-1 ${
                        plan.isPopular ? "text-blue-100" : "text-gray-500"
                      }`}>
                        Para siempre
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-center">
                        <span className={`text-5xl font-extrabold ${
                          plan.isPopular ? "text-white" : "text-gray-900"
                        }`}>
                          ${plan.price.toLocaleString()}
                        </span>
                        <span className={`text-xl ml-2 ${
                          plan.isPopular ? "text-blue-100" : "text-gray-600"
                        }`}>
                          /mes
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        plan.isPopular ? "text-blue-100" : "text-gray-500"
                      }`}>
                        Facturación mensual
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {(plan.features || []).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-left">
                      <CheckIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                        plan.isPopular ? "text-green-300" : "text-green-500"
                      }`} />
                      <span className={`${
                        plan.isPopular ? "text-blue-100" : "text-gray-700"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    processingPayment === plan.id ||
                    (currentSubscription?.planId === plan.id && isActive)
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    currentSubscription?.planId === plan.id && isActive
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : plan.isPopular
                      ? "bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {processingPayment === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                      Procesando...
                    </div>
                  ) : currentSubscription?.planId === plan.id && isActive ? (
                    <span className="flex items-center justify-center">
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Plan Actual
                    </span>
                  ) : (plan.price === 0 || plan.price === undefined) ? (
                    "🚀 Activar Gratis"
                  ) : (
                    `💳 Suscribirse por $${plan.price.toLocaleString()}/mes`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              🔍 Comparación Detallada
            </h3>
            <p className="text-lg text-gray-600">
              Descubre qué incluye cada plan para tu práctica médica
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 text-lg font-bold text-gray-900">
                    Funcionalidad
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="text-lg font-bold text-gray-900 flex items-center justify-center">
                      🆓 Plan Free
                    </div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="text-lg font-bold text-blue-600 flex items-center justify-center">
                      ⭐ Plan Medium
                    </div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="text-lg font-bold text-purple-600 flex items-center justify-center">
                      💎 Plan Plus
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    📋 Administrar perfil profesional
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    ⏰ Configurar horarios de atención
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    💳 Gestión de suscripción
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    🤝 Sistema de referidos
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    👥 Registrar nuevos pacientes
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    🗂️ Gestión completa de pacientes
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    📅 Administrar citas y agenda
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    ⭐ Sistema de reseñas y testimonios
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    📹 Video consultas ilimitadas
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    🏠 Salas virtuales personalizadas
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-10 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
            <h4 className="font-bold text-gray-900 mb-4 text-center">🎯 Leyenda de Funcionalidades</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-3"></div>
                <span className="text-gray-700">Funcionalidades básicas</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-3"></div>
                <span className="text-gray-700">Medium y Plus</span>
              </div>
              <div className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-3"></div>
                <span className="text-gray-700">Exclusivas Plus</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-10 border border-indigo-100">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              ❓ Preguntas Frecuentes
            </h3>
            <p className="text-lg text-gray-600">
              Resolvemos tus dudas sobre nuestros planes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                🔄 ¿Puedo cambiar de plan?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Sí, puedes cambiar tu plan en cualquier momento. Los cambios se reflejarán inmediatamente y ajustaremos la facturación proporcionalmente.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                💰 ¿Cómo funciona la facturación?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                La facturación es mensual y se renueva automáticamente. Puedes cancelar en cualquier momento sin penalización ni costos adicionales.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                💳 ¿Qué métodos de pago aceptan?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Aceptamos todas las tarjetas de crédito y débito principales a través de MercadoPago, así como transferencias bancarias.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                🔒 ¿Es seguro el pago?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Absolutamente. Todos los pagos son procesados de forma segura por MercadoPago con encriptación SSL y certificación PCI DSS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
