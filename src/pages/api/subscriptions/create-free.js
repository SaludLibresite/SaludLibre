import { createSubscription } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { planId, planName, price, userId, userEmail } = req.body;

    // Validar que sea un plan gratuito
    if (price !== 0 && price !== undefined) {
      return res.status(400).json({ 
        message: 'Este endpoint solo es para planes gratuitos' 
      });
    }

    // Validar datos requeridos
    if (!planId || !planName || !userId || !userEmail) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['planId', 'planName', 'userId', 'userEmail']
      });
    }

    // Crear la suscripción gratuita directamente
    const subscriptionData = {
      userId,
      planId,
      planName,
      price: 0,
      status: 'active',
      paymentMethod: 'free',
      createdAt: new Date(),
      // Para planes gratuitos, establecer 30 días de duración
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      autoRenew: true, // Los planes gratuitos se pueden renovar
    };

    const subscription = await createSubscription(subscriptionData);

    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      message: 'Plan gratuito activado exitosamente',
      subscription: subscription
    });

  } catch (error) {
    console.error('Error creating free subscription:', error);
    res.status(500).json({ 
      message: 'Error creating free subscription',
      error: error.message 
    });
  }
}
