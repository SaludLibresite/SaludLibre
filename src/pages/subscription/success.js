import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { getDoctorById, updateDoctor } from "../../lib/doctorsService";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (currentUser && router.query.payment_id) {
      processPaymentAndUpdateSubscription();
    }
  }, [currentUser, router.query]);

  const processPaymentAndUpdateSubscription = async () => {
    try {
      setProcessingPayment(true);
      const { payment_id, preference_id, status, collection_status, external_reference } = router.query;

      console.log('Processing payment:', { payment_id, preference_id, status, collection_status, external_reference });

      // Verificar que el pago fue aprobado
      if (status !== 'approved' || collection_status !== 'approved') {
        console.error('Payment not approved:', { status, collection_status });
        setLoading(false);
        return;
      }

      // Obtener información del pago desde MercadoPago
      const paymentInfo = await fetchPaymentInfo(payment_id);
      if (!paymentInfo) {
        console.error('Could not fetch payment info');
        setLoading(false);
        return;
      }

      console.log('Payment info from MercadoPago:', paymentInfo);

      // Extraer userId del external_reference
      let userId, planId;
      if (external_reference) {
        [userId, planId] = external_reference.split('_');
        console.log('Extracted from external_reference:', { userId, planId });
      } else if (paymentInfo.external_reference) {
        [userId, planId] = paymentInfo.external_reference.split('_');
        console.log('Extracted from payment external_reference:', { userId, planId });
      }

      if (!userId) {
        console.error('Could not extract userId from external_reference');
        setLoading(false);
        return;
      }

      // Verificar que el userId coincida con el usuario actual
      if (userId !== currentUser.uid) {
        console.error('UserId mismatch:', { extractedUserId: userId, currentUserId: currentUser.uid });
        setLoading(false);
        return;
      }

      // Obtener el doctor actual
      const doctor = await getDoctorById(userId);
      if (!doctor) {
        console.error('Doctor not found:', userId);
        setLoading(false);
        return;
      }

      console.log('Found doctor:', doctor);

      // Calcular fecha de expiración (30 días desde ahora)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Determinar el nombre del plan
      const planNames = {
        'plan_basico': 'Plan Básico',
        'plan_premium': 'Plan Premium',
        'plan_profesional': 'Plan Profesional'
      };
      const planName = planNames[planId] || 'Plan Desconocido';

      // Actualizar el doctor con la información de suscripción
      await updateDoctor(userId, {
        // Información de suscripción
        subscriptionStatus: 'active',
        subscriptionPlan: planName,
        subscriptionPlanId: planId,
        subscriptionExpiresAt: expiresAt,
        subscriptionActivatedAt: new Date(),
        
        // Información del pago
        lastPaymentId: paymentInfo.id,
        lastPaymentDate: new Date(paymentInfo.date_approved),
        lastPaymentAmount: paymentInfo.transaction_amount,
        lastPaymentMethod: paymentInfo.payment_method_id,
        
        // Información adicional
        preferenceId: preference_id,
        verified: true, // Activar verificación automáticamente
        updatedAt: new Date(),
      });

      console.log('Doctor updated with subscription info for userId:', userId);

      // Cargar el doctor actualizado
      const updatedDoctor = await getDoctorById(userId);
      setDoctor(updatedDoctor);

      console.log('✅ Subscription activation completed successfully!', updatedDoctor);

    } catch (error) {
      console.error("Error processing payment and updating subscription:", error);
    } finally {
      setProcessingPayment(false);
      setLoading(false);
    }
  };

  const fetchPaymentInfo = async (paymentId) => {
    try {
      const response = await fetch(`/api/mercadopago/payment-info/${paymentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error fetching payment info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment info:', error);
      return null;
    }
  };

  if (loading || processingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {processingPayment ? 'Procesando tu pago y activando suscripción...' : 'Verificando tu suscripción...'}
          </p>
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

        {doctor && doctor.subscriptionStatus === 'active' ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalles de tu Suscripción
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{doctor.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="font-medium">${doctor.lastPaymentAmount}/mes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-green-600">
                  {doctor.subscriptionStatus === 'active' ? 'Activa' : doctor.subscriptionStatus}
                </span>
              </div>
              {doctor.subscriptionExpiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expira:</span>
                  <span className="font-medium">
                    {doctor.subscriptionExpiresAt.toDate?.()?.toLocaleDateString() ||
                      new Date(doctor.subscriptionExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {doctor.lastPaymentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Último pago:</span>
                  <span className="font-medium">
                    {doctor.lastPaymentDate.toDate?.()?.toLocaleDateString() ||
                      new Date(doctor.lastPaymentDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">
              Procesando tu suscripción
            </h3>
            <p className="text-yellow-800">
              Tu pago ha sido procesado exitosamente. Tu suscripción será activada en unos momentos.
            </p>
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
