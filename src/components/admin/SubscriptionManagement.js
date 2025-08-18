import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByUserId } from "../../lib/doctorsService";
import { getActiveSubscriptionPlans } from "../../lib/subscriptionsService";
import { createPaymentPreference } from "../../lib/mercadopagoService";
import {
  CheckIcon,
  StarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

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
      console.log('🔄 Loading subscription data for user:', currentUser?.uid);
      
      // Cargar planes de suscripción
      const activePlans = await getActiveSubscriptionPlans();
      setPlans(activePlans);
      console.log('✅ Plans loaded:', activePlans.length);
      
      // Intentar cargar datos del doctor
      try {
        console.log('🔍 Searching for doctor with userId:', currentUser.uid);
        const doctorData = await getDoctorByUserId(currentUser.uid);
        setDoctor(doctorData);
        
        console.log('✅ Doctor found:', {
          id: doctorData.id,
          subscriptionStatus: doctorData.subscriptionStatus,
          subscriptionPlan: doctorData.subscriptionPlan,
          subscriptionExpiresAt: doctorData.subscriptionExpiresAt
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log("Current doctor data:", doctorData);
          console.log("User ID:", currentUser.uid);
        }
      } catch (doctorError) {
        console.warn("❌ Doctor not found, user may need to complete registration:", doctorError);
        setDoctor(null);
      }
      
    } catch (error) {
      console.error("❌ Error loading subscription data:", error);
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
        await handleActivateFreePlan();
        return;
      }

      // Verificar si es un upgrade desde plan gratuito
      const isUpgrade = doctor && doctor.subscriptionStatus === 'active' && 
                       (doctor.subscriptionPlanId === 'plan_gratuito' || doctor.subscriptionPlan === 'Plan Gratuito');

      if (isUpgrade) {
        console.log('🔄 Upgrading from free plan to:', plan.name);
      }

      const subscriptionData = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        isUpgrade: isUpgrade, // Agregar flag para identificar upgrades
        currentPlanId: doctor?.subscriptionPlanId
      };

      console.log('💳 Creating payment preference for subscription:', subscriptionData);

      const preference = await createPaymentPreference(subscriptionData);

      console.log('✅ Payment preference created:', {
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint || preference.init_point
      });

      // Redirigir a MercadoPago
      const redirectUrl = preference.initPoint || preference.init_point;
      if (redirectUrl) {
        console.log('🔄 Redirecting to MercadoPago:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.error('❌ No redirect URL found in preference:', preference);
        alert("Error al procesar el pago. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("❌ Error creating subscription:", error);
      alert(`Error al procesar la suscripción: ${error.message || 'Intenta nuevamente.'}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleActivateFreePlan = async () => {
    try {
      setProcessingPayment('free');
      
      console.log('🔄 Activating free plan for user:', currentUser.uid);
      
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
      console.log('✅ Free plan activation response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Error al activar el plan gratuito');
      }
      
      // Recargar los datos para mostrar la nueva suscripción
      console.log('🔄 Reloading doctor data...');
      // Pequeño delay para asegurar que Firestore haya sincronizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData();
      console.log('✅ Data reloaded, current doctor:', doctor);
      
      alert('¡Plan gratuito activado exitosamente!');
    } catch (error) {
      console.error('❌ Error activating free plan:', error);
      alert('Error al activar el plan gratuito: ' + error.message);
    } finally {
      setProcessingPayment(null);
    }
  };

  const isActive = isSubscriptionActive();
  const daysRemaining = getSubscriptionDaysRemaining();

  if (process.env.NODE_ENV === 'development') {
    console.log("Subscription check:", {
      doctor: doctor,
      isActive,
      daysRemaining,
      status: doctor?.subscriptionStatus,
      expiresAt: doctor?.subscriptionExpiresAt
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
      <div className="px-4 sm:px-6 lg:px-8 py-12">
      

        {/* Mensaje cuando el doctor no existe */}
        {doctor === null && !loading && (
          <div className="mb-8">
            <div className="rounded-lg p-6 bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-blue-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-900">
                    Completa tu registro médico
                  </h3>
                  <p className="mt-1 text-blue-800">
                    Para gestionar tu suscripción, primero necesitas completar tu perfil médico.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/admin/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Completar Perfil
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            {doctor && isActive
              ? "🚀 Cambia tu Plan"
              : "✨ Elige tu Plan"}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Desbloquea todo el potencial de tu práctica médica con nuestros planes diseñados para profesionales
          </p>
        </div>
        {/* Enhanced Current Subscription Status */}
        {doctor && (
          <div className="mb-8">
            <div className={`rounded-2xl p-8 border-2 ${
              isActive 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
                : doctor?.subscriptionStatus === "pending" 
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" 
                : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-full ${
                  isActive 
                    ? "bg-green-100 text-green-600" 
                    : doctor?.subscriptionStatus === "pending" 
                    ? "bg-yellow-100 text-yellow-600" 
                    : "bg-red-100 text-red-600"
                }`}>
                  {isActive ? (
                    <CheckIcon className="h-8 w-8" />
                  ) : doctor?.subscriptionStatus === "pending" ? (
                    <ClockIcon className="h-8 w-8" />
                  ) : (
                    <XMarkIcon className="h-8 w-8" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`text-2xl font-bold ${
                      isActive ? "text-green-800" : 
                      doctor?.subscriptionStatus === "pending" ? "text-yellow-800" : 
                      "text-red-800"
                    }`}>
                      {isActive ? "🎉 Suscripción Activa" : 
                       doctor?.subscriptionStatus === "pending" ? "⏳ Pago Pendiente" : 
                       "💤 Sin Suscripción Activa"}
                    </h3>
                    {isActive && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ACTIVO
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">Plan Actual</div>
                      <div className="text-lg font-bold text-gray-900">
                        {doctor.subscriptionPlan || 'Sin plan'}
                      </div>
                      {doctor.lastPaymentAmount > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          ${doctor.lastPaymentAmount?.toLocaleString()}/mes
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">Fecha de Activación</div>
                      <div className="text-lg font-bold text-gray-900">
                        {doctor.subscriptionActivatedAt 
                          ? (doctor.subscriptionActivatedAt.toDate ? 
                              doctor.subscriptionActivatedAt.toDate() : 
                              new Date(doctor.subscriptionActivatedAt)
                            ).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'No disponible'}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        {isActive ? "Expira el" : "Estado"}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {isActive ? (
                          doctor.subscriptionExpiresAt 
                            ? (doctor.subscriptionExpiresAt.toDate ? 
                                doctor.subscriptionExpiresAt.toDate() : 
                                new Date(doctor.subscriptionExpiresAt)
                              ).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'No disponible'
                        ) : (
                          doctor?.subscriptionStatus === "pending" ? "Procesando" : "Inactivo"
                        )}
                      </div>
                      {isActive && daysRemaining <= 7 && (
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          ⚠️ {daysRemaining} días restantes
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {doctor?.subscriptionStatus === "pending" && (
                    <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-xl">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Tu pago está siendo procesado. Esto puede tomar unos minutos.
                      </p>
                    </div>
                  )}
                  
                  {isActive && daysRemaining <= 7 && (
                    <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded-xl">
                      <p className="text-sm text-orange-800 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Tu suscripción expira pronto. Considera renovar para mantener el acceso completo.
                      </p>
                    </div>
                  )}

                  {/* Mensaje especial para usuarios con plan gratuito */}
                  {isActive && (doctor?.subscriptionPlanId === 'plan_gratuito' || doctor?.subscriptionPlan === 'Plan Gratuito') && (
                    <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-xl">
                      <p className="text-sm text-blue-800 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        🚀 ¡Tienes el plan gratuito activo! Puedes upgradearte a un plan premium en cualquier momento para acceder a más funcionalidades.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            // Mejorar la detección del plan actual
            const isCurrentPlan = doctor?.subscriptionPlanId === plan.id || 
              (plan.price === 0 && doctor?.subscriptionPlanId === 'plan_gratuito') ||
              (plan.name === 'Plan Gratuito' && doctor?.subscriptionPlan === 'Plan Gratuito');
            
            const isCurrentlyActive = isCurrentPlan && isActive;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  plan.featured
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white transform scale-105 shadow-2xl border-4 border-blue-300"
                    : "bg-white shadow-xl border-2 border-gray-100 hover:border-blue-200"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                      <StarIcon className="h-4 w-4 mr-2" />
                      🔥 MÁS POPULAR
                    </div>
                  </div>
                )}

                {isCurrentlyActive && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      ✅ PLAN ACTUAL
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      plan.featured ? "bg-white/20" : "bg-blue-100"
                    }`}>
                      <span className="text-2xl">
                        {index === 0 ? "🆓" : index === 1 ? "⭐" : "💎"}
                      </span>
                    </div>
                    <h3 className={`text-3xl font-bold ${
                      plan.featured ? "text-white" : "text-gray-900"
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-3 text-lg ${
                      plan.featured ? "text-blue-100" : "text-gray-600"
                    }`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    {(plan.price === 0 || plan.price === undefined) ? (
                      <div>
                        <span className={`text-5xl font-extrabold ${
                          plan.featured ? "text-white" : "text-green-600"
                        }`}>
                          GRATIS
                        </span>
                        <p className={`text-sm mt-1 ${
                          plan.featured ? "text-blue-100" : "text-gray-500"
                        }`}>
                          Para siempre
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center">
                          <span className={`text-5xl font-extrabold ${
                            plan.featured ? "text-white" : "text-gray-900"
                          }`}>
                            ${plan.price?.toLocaleString()}
                          </span>
                          <span className={`text-xl ml-2 ${
                            plan.featured ? "text-blue-100" : "text-gray-600"
                          }`}>
                            /mes
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          plan.featured ? "text-blue-100" : "text-gray-500"
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
                          plan.featured ? "text-green-300" : "text-green-500"
                        }`} />
                        <span className={`${
                          plan.featured ? "text-blue-100" : "text-gray-700"
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
                      (isCurrentlyActive && plan.price > 0) // Solo deshabilitar si es el plan actual Y es de pago
                    }
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                      (isCurrentlyActive && plan.price > 0)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : plan.featured
                        ? "bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {processingPayment === plan.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                        Procesando...
                      </div>
                    ) : (isCurrentlyActive && plan.price > 0) ? (
                      <span className="flex items-center justify-center">
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Plan Actual
                      </span>
                    ) : isCurrentlyActive && plan.price === 0 ? (
                      <span className="flex items-center justify-center">
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Plan Actual (Gratis)
                      </span>
                    ) : (plan.price === 0 || plan.price === undefined) ? (
                      "🚀 Activar Gratis"
                    ) : (
                      `� Upgrade a $${plan.price?.toLocaleString()}/mes`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
              </tbody>
            </table>
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
                Sí, puedes cambiar tu plan en cualquier momento. Los cambios se reflejarán inmediatamente.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                💰 ¿Cómo funciona la facturación?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                La facturación es mensual y se renueva automáticamente. Puedes cancelar en cualquier momento.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                💳 ¿Qué métodos de pago aceptan?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Aceptamos todas las tarjetas principales a través de MercadoPago.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
                🔒 ¿Es seguro el pago?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Todos los pagos son procesados de forma segura por MercadoPago con encriptación SSL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}