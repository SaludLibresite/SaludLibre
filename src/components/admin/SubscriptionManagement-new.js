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

  const handleSelectPlan = async (plan) => {
    try {
      setProcessingPayment(plan.id);
      
      const preference = await createPaymentPreference({
        planId: plan.id,
        userId: currentUser.uid,
        planName: plan.name,
        price: plan.price,
      });

      if (preference?.init_point) {
        window.location.href = preference.init_point;
      }
    } catch (error) {
      console.error('Error creating payment preference:', error);
      alert('Error al procesar el pago: ' + error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleActivateFreePlan = async () => {
    try {
      setProcessingPayment('free');
      
      const response = await fetch('/api/subscriptions/activate-free', {
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
        throw new Error(result.message || 'Error al activar el plan gratuito');
      }
      
      // Recargar los datos para mostrar la nueva suscripción
      await loadData();
      
      alert('¡Plan gratuito activado exitosamente!');
    } catch (error) {
      console.error('Error activating free plan:', error);
      alert('Error al activar el plan gratuito: ' + error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isActive = isSubscriptionActive();
  const daysRemaining = getSubscriptionDaysRemaining();

  if (process.env.NODE_ENV === 'development') {
    console.log("Debug info:", {
      doctor: doctor,
      isActive,
      daysRemaining,
      status: doctor?.subscriptionStatus,
      expiresAt: doctor?.subscriptionExpiresAt
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Suscripción
        </h1>
        <p className="mt-2 text-gray-600">
          Administra tu plan y facturación
        </p>
      </div>

      {/* Estado actual de la suscripción */}
      {doctor && doctor.subscriptionStatus && (
        <div className="mb-8">
          <div className={`rounded-lg p-6 ${
            isActive ? "bg-green-50 border border-green-200" : 
            doctor.subscriptionStatus === "pending" ? "bg-yellow-50 border border-yellow-200" : 
            "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${
                isActive ? "text-green-600" : 
                doctor.subscriptionStatus === "pending" ? "text-yellow-600" : 
                "text-red-600"
              }`}>
                {isActive ? (
                  <CheckIcon className="h-6 w-6" />
                ) : doctor.subscriptionStatus === "pending" ? (
                  <ClockIcon className="h-6 w-6" />
                ) : (
                  <XMarkIcon className="h-6 w-6" />
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {isActive ? "✅ Suscripción Activa" : 
                   doctor.subscriptionStatus === "pending" ? "⏳ Pago Pendiente" : 
                   "❌ Suscripción Inactiva"}
                </h3>
                <div className="mt-1">
                  <span className="font-semibold">{doctor.subscriptionPlan}</span>
                  {doctor.lastPaymentAmount > 0 && (
                    <span className="text-gray-600"> - ${doctor.lastPaymentAmount}/mes</span>
                  )}
                </div>
                {doctor.subscriptionStatus === "pending" && (
                  <p className="text-sm text-yellow-700 mt-1">
                    Tu pago está siendo procesado. Esto puede tomar unos minutos.
                  </p>
                )}
                {isActive && daysRemaining <= 7 && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Tu suscripción expira en {daysRemaining} días
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Fecha de activación:</span>
                <div className="text-gray-600">
                  {doctor.subscriptionActivatedAt 
                    ? (doctor.subscriptionActivatedAt.toDate ? 
                        doctor.subscriptionActivatedAt.toDate() : 
                        new Date(doctor.subscriptionActivatedAt)
                      ).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No disponible'}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Expira el:</span>
                <div className="text-gray-600">
                  {doctor.subscriptionExpiresAt 
                    ? (doctor.subscriptionExpiresAt.toDate ? 
                        doctor.subscriptionExpiresAt.toDate() : 
                        new Date(doctor.subscriptionExpiresAt)
                      ).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No disponible'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = doctor?.subscriptionPlanId === plan.id;
          const isCurrentlyActive = isCurrentPlan && isActive;
          
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
                isCurrentlyActive
                  ? "border-green-500"
                  : plan.featured
                  ? "border-blue-500"
                  : "border-gray-200"
              }`}
            >
              {plan.featured && (
                <div className="bg-blue-500 text-white text-center py-2 px-4">
                  <span className="text-sm font-medium">⭐ Más Popular</span>
                </div>
              )}
              
              {isCurrentlyActive && (
                <div className="bg-green-500 text-white text-center py-2 px-4">
                  <span className="text-sm font-medium">✅ Plan Actual</span>
                </div>
              )}

              <div className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/mes</span>
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" />
                      <span className="ml-2 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isCurrentlyActive ? (
                    <div className="text-center">
                      <div className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md bg-green-50 text-green-700">
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Plan Activo
                      </div>
                      {daysRemaining <= 7 && (
                        <p className="text-xs text-yellow-600 mt-2">
                          Expira en {daysRemaining} días
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => plan.price === 0 ? handleActivateFreePlan() : handleSelectPlan(plan)}
                      disabled={processingPayment === plan.id || processingPayment === 'free'}
                      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                        plan.featured
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {processingPayment === plan.id || (processingPayment === 'free' && plan.price === 0)
                        ? "Procesando..."
                        : plan.price === 0
                        ? "Activar Gratis"
                        : "Seleccionar Plan"
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Información Importante
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Los pagos se procesan de forma segura a través de MercadoPago</li>
          <li>• Puedes cancelar tu suscripción en cualquier momento</li>
          <li>• Las facturas se envían automáticamente por email</li>
          <li>• El soporte técnico está disponible 24/7</li>
        </ul>
      </div>
    </div>
  );
}
