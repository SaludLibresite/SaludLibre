import { updateDoctor, getDoctorById } from '../../../lib/doctorsService';
import crypto from 'crypto';

// Validar firma del webhook de MercadoPago
function validateWebhookSignature(req) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not configured - webhook validation disabled');
    return true; // En desarrollo, permitir sin validación
  }

  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  
  if (!signature || !requestId) {
    return false;
  }

  // Extraer hash de la firma
  const signatureParts = signature.split(',');
  const tsPart = signatureParts.find(part => part.startsWith('ts='));
  const vPart = signatureParts.find(part => part.startsWith('v1='));
  
  if (!tsPart || !vPart) {
    return false;
  }

  const timestamp = tsPart.replace('ts=', '');
  const hash = vPart.replace('v1=', '');

  // Crear el string a validar
  const dataString = `id:${req.body.id};request-id:${requestId};ts:${timestamp};`;
  
  // Calcular hash HMAC
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');

  return hash === expectedHash;
}

export default async function handler(req, res) {
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Validar firma del webhook
    if (!validateWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }
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
    console.log('Processing approved payment:', {
      id: paymentInfo.id,
      external_reference: paymentInfo.external_reference,
      transaction_amount: paymentInfo.transaction_amount
    });

    // Extraer userId del external_reference
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    if (!userId) {
      console.error('Could not extract userId from external_reference:', paymentInfo.external_reference);
      return;
    }

    // Verificar que el doctor existe
    const doctor = await getDoctorById(userId);
    if (!doctor) {
      console.error('Doctor not found:', userId);
      return;
    }

    console.log('Found doctor:', { id: doctor.id, nombre: doctor.nombre });

    // Calcular fecha de expiración (30 días desde ahora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Determinar el nombre del plan basado en el planId
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
      preferenceId: paymentInfo.preference_id,
      verified: true, // Activar verificación automáticamente al pagar
      updatedAt: new Date(),
    });

    console.log(`✅ Payment approved and subscription activated for doctor ${userId} (${doctor.nombre})`);

  } catch (error) {
    console.error('Error processing approved payment:', error);
    throw error;
  }
}

async function processRejectedPayment(paymentInfo) {
  try {
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    if (!userId) {
      console.error('Could not extract userId from external_reference:', paymentInfo.external_reference);
      return;
    }

    const doctor = await getDoctorById(userId);
    if (!doctor) {
      console.error('Doctor not found:', userId);
      return;
    }

    // Actualizar el doctor con información del pago rechazado
    await updateDoctor(userId, {
      subscriptionStatus: 'rejected',
      lastPaymentId: paymentInfo.id,
      lastPaymentStatus: 'rejected',
      lastPaymentDate: new Date(),
      rejectionReason: paymentInfo.status_detail,
      updatedAt: new Date(),
    });

    console.log(`❌ Payment rejected for doctor ${userId} (${doctor.nombre})`);

  } catch (error) {
    console.error('Error processing rejected payment:', error);
    throw error;
  }
}

async function processPendingPayment(paymentInfo) {
  try {
    const [userId, planId] = paymentInfo.external_reference.split('_');
    
    if (!userId) {
      console.error('Could not extract userId from external_reference:', paymentInfo.external_reference);
      return;
    }

    const doctor = await getDoctorById(userId);
    if (!doctor) {
      console.error('Doctor not found:', userId);
      return;
    }

    // Actualizar el doctor con información del pago pendiente
    await updateDoctor(userId, {
      subscriptionStatus: 'pending',
      lastPaymentId: paymentInfo.id,
      lastPaymentStatus: 'pending',
      lastPaymentMethod: paymentInfo.payment_method_id,
      lastPaymentDate: new Date(),
      paymentStatusDetail: paymentInfo.status_detail,
      updatedAt: new Date(),
    });

    console.log(`⏳ Payment pending for doctor ${userId} (${doctor.nombre})`);

  } catch (error) {
    console.error('Error processing pending payment:', error);
    throw error;
  }
}
