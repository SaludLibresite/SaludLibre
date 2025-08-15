import { updateSubscription, updatePayment, getUserSubscription } from '../../../lib/subscriptionsService';
import { updateDoctor } from '../../../lib/doctorsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      id, 
      topic, 
      type,
      data,
      action,
      date_created,
      user_id 
    } = req.body;

    console.log('Webhook received:', { id, topic, type, action });

    // Verificar que sea una notificación de pago
    if (topic === 'payment') {
      // Obtener información del pago desde MercadoPago usando API REST
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching payment from MercadoPago:', response.status);
        return res.status(400).json({ message: 'Error fetching payment' });
      }

      const paymentInfo = await response.json();

      console.log('Payment info:', paymentInfo);

      // Procesar según el estado del pago
      if (paymentInfo.status === 'approved') {
        await processApprovedPayment(paymentInfo);
      } else if (paymentInfo.status === 'rejected') {
        await processRejectedPayment(paymentInfo);
      } else if (paymentInfo.status === 'pending') {
        await processPendingPayment(paymentInfo);
      }
    }

    // Responder con 200 para confirmar recepción
    res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      message: 'Error processing webhook',
      error: error.message 
    });
  }
}

async function processApprovedPayment(paymentInfo) {
  try {
    // Extraer datos de la referencia externa
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    // Buscar la suscripción pendiente
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.error('Subscription not found for user:', userId);
      return;
    }

    // Calcular fecha de expiración (30 días desde ahora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Actualizar suscripción a activa
    await updateSubscription(subscription.id, {
      status: 'active',
      activatedAt: new Date(),
      expiresAt: expiresAt,
      paymentId: paymentInfo.id,
      lastPaymentDate: new Date(paymentInfo.date_approved),
    });

    // Actualizar el pago
    await updatePayment(subscription.id, {
      status: 'approved',
      paymentId: paymentInfo.id,
      approvedAt: new Date(paymentInfo.date_approved),
      paymentMethod: paymentInfo.payment_method_id,
      transactionAmount: paymentInfo.transaction_amount,
    });

    // Actualizar el doctor con la información de suscripción
    await updateDoctor(userId, {
      subscriptionStatus: 'active',
      subscriptionPlan: subscription.planName,
      subscriptionExpiresAt: expiresAt,
      updatedAt: new Date(),
    });

    console.log(`Payment approved for user ${userId}, subscription activated`);

  } catch (error) {
    console.error('Error processing approved payment:', error);
    throw error;
  }
}

async function processRejectedPayment(paymentInfo) {
  try {
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.error('Subscription not found for user:', userId);
      return;
    }

    // Actualizar suscripción como rechazada
    await updateSubscription(subscription.id, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: paymentInfo.status_detail,
    });

    // Actualizar el pago
    await updatePayment(subscription.id, {
      status: 'rejected',
      paymentId: paymentInfo.id,
      rejectedAt: new Date(),
      rejectionReason: paymentInfo.status_detail,
    });

    console.log(`Payment rejected for user ${userId}`);

  } catch (error) {
    console.error('Error processing rejected payment:', error);
    throw error;
  }
}

async function processPendingPayment(paymentInfo) {
  try {
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.error('Subscription not found for user:', userId);
      return;
    }

    // Actualizar el pago como pendiente con más información
    await updatePayment(subscription.id, {
      status: 'pending',
      paymentId: paymentInfo.id,
      paymentMethod: paymentInfo.payment_method_id,
      statusDetail: paymentInfo.status_detail,
      updatedAt: new Date(),
    });

    console.log(`Payment pending for user ${userId}`);

  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}
